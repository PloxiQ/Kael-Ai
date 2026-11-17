"""Shared security primitives for KAEL.

Contains the three pieces that every outbound feature needs:

* ``safe_request`` - HTTP with SSRF protection, redirect re-validation and a
  hard response size limit.
* Fernet-based secret encryption with a key that comes from
  ``KAEL_SECRET_KEY`` or a local key file.
* A small in-process sliding-window rate limiter.

The module deliberately does not import FastAPI application state; it is used
from both endpoints and the MCP client.
"""

from __future__ import annotations

import base64
import hashlib
import ipaddress
import json
import os
import secrets
import socket
import threading
import time
from collections import deque
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Mapping
from urllib.parse import urljoin, urlsplit, urlunsplit

import httpx
from cryptography.fernet import Fernet, InvalidToken
from fastapi import HTTPException, Request


MAX_URL_LENGTH = 2_048
MAX_RESPONSE_BYTES = 2_000_000
MAX_REDIRECTS = 3

_LOCAL_HOSTNAMES = {"localhost", "127.0.0.1", "::1"}

_BLOCKED_NETWORKS = tuple(
    ipaddress.ip_network(value)
    for value in (
        "0.0.0.0/8",
        "10.0.0.0/8",
        "100.64.0.0/10",
        "127.0.0.0/8",
        "169.254.0.0/16",
        "172.16.0.0/12",
        "192.0.0.0/24",
        "192.0.2.0/24",
        "192.168.0.0/16",
        "198.18.0.0/15",
        "198.51.100.0/24",
        "203.0.113.0/24",
        "224.0.0.0/4",
        "240.0.0.0/4",
        "::/128",
        "::1/128",
        "fc00::/7",
        "fe80::/10",
        "ff00::/8",
        "2001:db8::/32",
    )
)


class OutboundUrlError(ValueError):
    """Raised when a user-supplied URL may not be fetched by the backend."""


class ResponseTooLargeError(ValueError):
    """Raised when a remote response exceeds the allowed size."""


@dataclass(frozen=True)
class SafeResponse:
    status_code: int
    headers: Mapping[str, str]
    content: bytes

    @property
    def text(self) -> str:
        return self.content.decode("utf-8", errors="replace")

    def json(self) -> Any:
        return json.loads(self.content.decode("utf-8"))


def data_dir() -> Path:
    """Directory for the SQLite database and the fallback encryption key."""

    configured = os.getenv("KAEL_DATA_DIR", "").strip()
    path = Path(configured) if configured else Path(__file__).resolve().parent / "data"
    path.mkdir(parents=True, exist_ok=True)
    return path


def allow_local_outbound() -> bool:
    """Local MCP servers are a development convenience only."""

    if os.getenv("KAEL_ENV", "").strip().lower() == "production":
        return False
    return os.getenv("KAEL_MCP_ALLOW_LOCAL", "").strip() == "1"


def _is_blocked_ip(address: ipaddress._BaseAddress) -> bool:
    if isinstance(address, ipaddress.IPv6Address) and address.ipv4_mapped:
        address = address.ipv4_mapped

    if (
        address.is_private
        or address.is_loopback
        or address.is_link_local
        or address.is_multicast
        or address.is_reserved
        or address.is_unspecified
    ):
        return True

    return any(address in network for network in _BLOCKED_NETWORKS)


def _resolve_host(host: str, port: int) -> list[ipaddress._BaseAddress]:
    try:
        infos = socket.getaddrinfo(
            host,
            port,
            type=socket.SOCK_STREAM,
            proto=socket.IPPROTO_TCP,
        )
    except socket.gaierror as error:
        raise OutboundUrlError(f"Host '{host}' could not be resolved.") from error

    addresses: list[ipaddress._BaseAddress] = []
    for info in infos:
        raw = str(info[4][0]).split("%", 1)[0]
        try:
            addresses.append(ipaddress.ip_address(raw))
        except ValueError:
            continue

    if not addresses:
        raise OutboundUrlError(f"Host '{host}' has no usable address.")

    return addresses


def _validate_outbound_url(
    raw_url: str,
) -> tuple[str, list[ipaddress._BaseAddress]]:
    """Validate a user-supplied URL and return its normalized form plus
    the resolved addresses that were checked.

    Rejects credentials in the URL, non-HTTP schemes, localhost and every
    private/reserved address range, including cloud metadata endpoints.
    """

    candidate = (raw_url or "").strip()
    if not candidate:
        raise OutboundUrlError("URL is empty.")
    if len(candidate) > MAX_URL_LENGTH:
        raise OutboundUrlError("URL is too long.")
    if any(character in candidate for character in ("\n", "\r", "\t", " ")):
        raise OutboundUrlError("URL contains whitespace or control characters.")

    try:
        parts = urlsplit(candidate)
    except ValueError as error:
        raise OutboundUrlError("URL is malformed.") from error

    if parts.scheme.lower() not in {"http", "https"}:
        raise OutboundUrlError("Only http:// and https:// URLs are supported.")
    if parts.username or parts.password:
        raise OutboundUrlError("URLs with credentials are not allowed.")
    if not parts.hostname:
        raise OutboundUrlError("URL has no host.")
    if parts.fragment:
        raise OutboundUrlError("URL fragments are not supported.")

    try:
        host = parts.hostname.encode("idna").decode("ascii").lower()
    except UnicodeError as error:
        raise OutboundUrlError("URL host is invalid.") from error

    try:
        port = parts.port or (443 if parts.scheme.lower() == "https" else 80)
    except ValueError as error:
        raise OutboundUrlError("URL port is invalid.") from error

    local = allow_local_outbound() and (
        host in _LOCAL_HOSTNAMES
        or any(str(address) in _LOCAL_HOSTNAMES for address in _resolve_host(host, port))
    )

    if parts.scheme.lower() == "http" and not local:
        raise OutboundUrlError(
            "HTTPS is required for remote MCP servers. Plain HTTP is only "
            "allowed for local development."
        )

    addresses = _resolve_host(host, port)
    if not local and any(_is_blocked_ip(address) for address in addresses):
        raise OutboundUrlError(
            "This URL resolves to a private or reserved network address."
        )

    host_for_url = f"[{host}]" if ":" in host else host
    netloc = host_for_url
    if parts.port:
        netloc = f"{host_for_url}:{parts.port}"

    normalized = urlunsplit(
        (
            parts.scheme.lower(),
            netloc,
            parts.path or "/",
            parts.query,
            "",
        )
    )
    return normalized, addresses


def validate_outbound_url(raw_url: str) -> str:
    """Validate a user-supplied URL and return its normalized form."""

    normalized, _ = _validate_outbound_url(raw_url)
    return normalized


def _pin_outbound_target(url: str) -> tuple[str, str, str | None]:
    """Rewrite a validated URL to connect to one pre-checked IP address.

    Pinning closes the DNS-rebinding window between validation and the
    actual TCP connection: the request never resolves the hostname again.
    The original hostname is preserved in the ``Host`` header, and HTTPS
    keeps it as the TLS SNI/verification name.

    Returns ``(pinned_url, host_header, sni_hostname)``.
    """

    normalized, addresses = _validate_outbound_url(url)
    parts = urlsplit(normalized)
    host = parts.hostname or ""
    if not host or not addresses:
        raise OutboundUrlError("URL has no usable address.")

    address = next(
        (item for item in addresses if item.version == 4), addresses[0]
    )
    ip_text = str(address)
    ip_for_url = f"[{ip_text}]" if ":" in ip_text else ip_text
    netloc = ip_for_url
    if parts.port:
        netloc = f"{ip_for_url}:{parts.port}"

    pinned_url = urlunsplit(
        (parts.scheme, netloc, parts.path or "/", parts.query, "")
    )

    host_header = f"[{host}]" if ":" in host else host
    if parts.port:
        host_header = f"{host_header}:{parts.port}"

    sni_hostname = host if parts.scheme == "https" else None
    return pinned_url, host_header, sni_hostname


def safe_request(
    method: str,
    url: str,
    *,
    headers: Mapping[str, str] | None = None,
    json_body: Any = None,
    body: bytes | None = None,
    timeout: float = 20.0,
    max_bytes: int = MAX_RESPONSE_BYTES,
    follow_redirects: bool = True,
) -> SafeResponse:
    """Perform an SSRF-safe HTTP request with bounded response size."""

    logical_url = url
    current, host_header, sni_hostname = _pin_outbound_target(logical_url)
    current_method = method.upper()
    request_headers = {
        key: value
        for key, value in (headers or {}).items()
        if key.lower() != "host"
    }
    request_headers["Host"] = host_header

    for redirect_count in range(MAX_REDIRECTS + 1):
        try:
            with httpx.Client(
                timeout=httpx.Timeout(timeout),
                follow_redirects=False,
            ) as client:
                with client.stream(
                    current_method,
                    current,
                    headers=request_headers,
                    json=json_body,
                    content=body,
                    extensions=(
                        {"sni_hostname": sni_hostname}
                        if sni_hostname
                        else None
                    ),
                ) as response:
                    if (
                        follow_redirects
                        and response.status_code
                        in {301, 302, 303, 307, 308}
                        and redirect_count < MAX_REDIRECTS
                    ):
                        location = response.headers.get("location")
                        if not location:
                            raise OutboundUrlError(
                                "Redirect response has no Location header."
                            )
                        next_url = urljoin(logical_url, str(location))
                        current, host_header, sni_hostname = (
                            _pin_outbound_target(next_url)
                        )
                        logical_url = next_url
                        request_headers = {
                            key: value
                            for key, value in request_headers.items()
                            if key.lower() != "host"
                        }
                        request_headers["Host"] = host_header
                        if response.status_code == 303:
                            current_method = "GET"
                            json_body = None
                            body = None
                        continue

                    chunks: list[bytes] = []
                    total = 0
                    for chunk in response.iter_bytes():
                        total += len(chunk)
                        if total > max_bytes:
                            raise ResponseTooLargeError(
                                "Remote response is too large."
                            )
                        chunks.append(chunk)

                    return SafeResponse(
                        status_code=response.status_code,
                        headers=dict(response.headers),
                        content=b"".join(chunks),
                    )
        except httpx.TimeoutException as error:
            raise TimeoutError("Remote server timed out.") from error
        except httpx.HTTPError as error:
            raise ConnectionError("Remote server is unreachable.") from error

    raise OutboundUrlError("Too many redirects.")


_FERNET_LOCK = threading.Lock()
_FERNET: Fernet | None = None
_FERNET_SOURCE: str | None = None


def _fernet_key_material() -> tuple[bytes, str]:
    configured = os.getenv("KAEL_SECRET_KEY", "").strip()
    if configured:
        return hashlib.sha256(configured.encode("utf-8")).digest(), "env"

    key_path = data_dir() / "secret.key"
    if key_path.exists():
        raw = key_path.read_bytes()
        if len(raw) >= 32:
            return raw[:32], str(key_path)

    raw = secrets.token_bytes(32)
    key_path.write_bytes(raw)
    try:
        key_path.chmod(0o600)
    except OSError:
        pass
    return raw, str(key_path)


def _fernet() -> Fernet:
    global _FERNET, _FERNET_SOURCE

    with _FERNET_LOCK:
        material, source = _fernet_key_material()
        if _FERNET is None or _FERNET_SOURCE != source:
            _FERNET = Fernet(base64.urlsafe_b64encode(material))
            _FERNET_SOURCE = source
        return _FERNET


def encrypt_secret(payload: Mapping[str, Any]) -> str:
    serialized = json.dumps(dict(payload), separators=(",", ":")).encode("utf-8")
    return _fernet().encrypt(serialized).decode("ascii")


def decrypt_secret(token: str) -> dict[str, Any]:
    try:
        raw = _fernet().decrypt(token.encode("ascii"))
    except (InvalidToken, ValueError) as error:
        raise ValueError("Stored secret could not be decrypted.") from error

    data = json.loads(raw.decode("utf-8"))
    if not isinstance(data, dict):
        raise ValueError("Stored secret has an unexpected shape.")
    return data


class SlidingWindow:
    """A bounded sliding-window counter keyed by an opaque identity."""

    def __init__(self, limit: int, window_seconds: float) -> None:
        self.limit = limit
        self.window = window_seconds
        self._events: dict[str, deque[float]] = {}
        self._lock = threading.Lock()

    def hit(self, key: str) -> tuple[bool, int]:
        now = time.monotonic()
        cutoff = now - self.window

        with self._lock:
            if len(self._events) > 20_000:
                for stale_key in list(self._events):
                    bucket = self._events[stale_key]
                    while bucket and bucket[0] < cutoff:
                        bucket.popleft()
                    if not bucket:
                        del self._events[stale_key]

            bucket = self._events.setdefault(key, deque())
            while bucket and bucket[0] < cutoff:
                bucket.popleft()

            if len(bucket) >= self.limit:
                retry_after = max(1, int(bucket[0] + self.window - now) + 1)
                return False, retry_after

            bucket.append(now)
            return True, 0


_LIMITERS: dict[tuple[str, int, float], SlidingWindow] = {}
_LIMITERS_LOCK = threading.Lock()


def rate_limiter(namespace: str, limit: int, window_seconds: float) -> SlidingWindow:
    key = (namespace, limit, window_seconds)
    with _LIMITERS_LOCK:
        limiter = _LIMITERS.get(key)
        if limiter is None:
            limiter = SlidingWindow(limit, window_seconds)
            _LIMITERS[key] = limiter
        return limiter


def _normalize_ip(raw: str) -> str | None:
    """Return a canonical IP address, or None when the value is not an IP."""

    candidate = raw.strip()
    if candidate.startswith("[") and "]" in candidate:
        candidate = candidate[1 : candidate.index("]")]
    elif candidate.count(":") == 1 and "." in candidate:
        # Tolerate "203.0.113.5:443" from proxies that append a source port.
        host, _, port = candidate.rpartition(":")
        if port.isdigit():
            candidate = host

    try:
        return str(ipaddress.ip_address(candidate))
    except ValueError:
        return None


def _xff_trusted_entries() -> int:
    """How many rightmost X-Forwarded-For entries belong to infrastructure.

    A client can prepend anything to the header, but it cannot append entries
    that appear after its own request. Values added by the proxy chain are
    therefore counted from the right.

    On Render the chain is Cloudflare then Render's load balancer, so the
    rightmost entry is the Render edge and the client IP is one entry further
    left. Set ``KAEL_XFF_TRUSTED_ENTRIES=0`` when the app is exposed directly
    behind a single proxy that does not append its own address.
    """

    raw = os.getenv("KAEL_XFF_TRUSTED_ENTRIES", "1").strip()
    try:
        value = int(raw)
    except ValueError:
        return 1
    return max(0, min(value, 8))


def client_ip(request: Request) -> str:
    fallback = request.client.host if request.client else "unknown"

    if os.getenv("KAEL_TRUST_PROXY_HEADERS", "").strip() != "1":
        return fallback

    # Cloudflare overwrites this header at the edge, and Render routes all
    # traffic through Cloudflare, so it is the single most reliable value.
    edge_ip = _normalize_ip(request.headers.get("cf-connecting-ip") or "")
    if edge_ip:
        return edge_ip

    raw_entries: list[str] = []
    for header_value in request.headers.getlist("x-forwarded-for"):
        raw_entries.extend(header_value.split(","))

    entries = [value for value in map(_normalize_ip, raw_entries) if value]
    if not entries:
        return fallback

    index = len(entries) - 1 - _xff_trusted_entries()
    if index < 0:
        # Fewer entries than configured. A single entry is what a proxy that
        # does not append its own address produces, so the rightmost remaining
        # value is the best available answer.
        index = len(entries) - 1

    return entries[index]


def enforce_rate_limit(
    request: Request,
    *,
    namespace: str,
    limit: int,
    window_seconds: float,
    identity: str | None = None,
) -> None:
    """Raise HTTP 429 when the caller exceeds the configured budget."""

    key = identity or client_ip(request)
    allowed, retry_after = rate_limiter(
        namespace, limit, window_seconds
    ).hit(key)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="Слишком много запросов. Подождите немного и повторите.",
            headers={"Retry-After": str(retry_after)},
        )


def redact(text: str, limit: int = 300) -> str:
    """Keep an error message free of long secrets and truncate it."""

    normalized = " ".join(str(text).split())
    if len(normalized) > limit:
        normalized = normalized[: limit - 1] + "…"
    return normalized
