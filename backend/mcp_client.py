"""Generic Model Context Protocol (MCP) client for KAEL.

Implements the parts of MCP that a chat product needs:

* Streamable HTTP transport (JSON or SSE replies).
* ``initialize`` / ``tools/list`` / ``tools/call``.
* OAuth 2.1 discovery (RFC 9728 + RFC 8414), dynamic client registration
  (RFC 7591) and PKCE, plus refresh tokens.
* Bearer and anonymous servers.

No MCP SDK is used: the official Python SDK pins a Starlette version that is
incompatible with the FastAPI version this backend runs on.
"""

from __future__ import annotations

import base64
import hashlib
import json
import re
import secrets
import time
from dataclasses import dataclass
from typing import Any, Mapping
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import mcp_store
from security import (
    OutboundUrlError,
    ResponseTooLargeError,
    SafeResponse,
    redact,
    safe_request,
    validate_outbound_url,
)

PROTOCOL_VERSION = "2025-06-18"
FALLBACK_PROTOCOL_VERSIONS = ("2025-03-26", "2024-11-05")
CLIENT_NAME = "KAEL"
CLIENT_VERSION = "1.7.0"
MAX_TOOL_PAGES = 10
MAX_TOOL_SCHEMA_CHARS = 20_000
MAX_TOOL_RESULT_CHARS = 60_000


class McpError(Exception):
    """A user-safe MCP failure."""


class McpAuthRequired(McpError):
    def __init__(
        self,
        message: str,
        *,
        resource_metadata: str | None = None,
    ) -> None:
        super().__init__(message)
        self.resource_metadata = resource_metadata


class McpProtocolError(McpError):
    def __init__(self, message: str, *, data: Any = None) -> None:
        super().__init__(message)
        self.data = data


@dataclass(frozen=True)
class AuthDiscovery:
    authorization_endpoint: str
    token_endpoint: str
    registration_endpoint: str | None
    scopes: tuple[str, ...]
    issuer: str | None


def _parse_sse(text: str) -> list[dict[str, Any]]:
    messages: list[dict[str, Any]] = []

    def flush(lines: list[str]) -> None:
        if not lines:
            return
        payload = "\n".join(lines).strip()
        lines.clear()
        if not payload or payload == "[DONE]":
            return
        try:
            parsed = json.loads(payload)
        except ValueError:
            return
        if isinstance(parsed, dict):
            messages.append(parsed)

    lines: list[str] = []
    for raw_line in text.splitlines():
        if raw_line.startswith("data:"):
            lines.append(raw_line[5:].lstrip())
        elif not raw_line.strip():
            flush(lines)

    flush(lines)
    return messages


def _resource_metadata_header(value: str) -> str | None:
    quoted = re.search(
        r'resource_metadata\s*=\s*"([^"]+)"', value, re.IGNORECASE
    )
    if quoted:
        return quoted.group(1)

    bare = re.search(
        r"resource_metadata\s*=\s*([^,\s]+)", value, re.IGNORECASE
    )
    return bare.group(1) if bare else None


def _rpc_messages(response: SafeResponse) -> list[dict[str, Any]]:
    content_type = response.headers.get("content-type", "").lower()

    if "text/event-stream" in content_type:
        return _parse_sse(response.text)

    if not response.content.strip():
        return []

    try:
        parsed = response.json()
    except (ValueError, UnicodeDecodeError):
        return _parse_sse(response.text)

    if isinstance(parsed, dict):
        return [parsed]
    if isinstance(parsed, list):
        return [item for item in parsed if isinstance(item, dict)]
    return []


class McpHttpClient:
    """One MCP session over Streamable HTTP."""

    def __init__(
        self,
        url: str,
        *,
        access_token: str | None = None,
        protocol_version: str | None = None,
        timeout: float = 30.0,
    ) -> None:
        self.url = validate_outbound_url(url)
        self.access_token = access_token
        self.protocol_version = protocol_version
        self.timeout = timeout
        self.session_id: str | None = None
        self.negotiated_version: str | None = None

    def _headers(self) -> dict[str, str]:
        headers = {
            "Accept": "application/json, text/event-stream",
            "Content-Type": "application/json",
            "User-Agent": f"{CLIENT_NAME}/{CLIENT_VERSION}",
        }
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        if self.session_id:
            headers["Mcp-Session-Id"] = self.session_id
        if self.protocol_version:
            headers["MCP-Protocol-Version"] = self.protocol_version
        return headers

    def _post(
        self,
        payload: dict[str, Any],
        *,
        expected_id: int | None,
    ) -> dict[str, Any]:
        try:
            response = safe_request(
                "POST",
                self.url,
                headers=self._headers(),
                json_body=payload,
                timeout=self.timeout,
                max_bytes=1_500_000,
                follow_redirects=False,
            )
        except OutboundUrlError as error:
            raise McpError(str(error)) from error
        except ResponseTooLargeError as error:
            raise McpError("MCP server response is too large.") from error
        except TimeoutError as error:
            raise McpError("MCP server timed out.") from error
        except ConnectionError as error:
            raise McpError("MCP server is unreachable.") from error

        session_id = response.headers.get("mcp-session-id")
        if session_id:
            self.session_id = session_id

        if response.status_code == 401:
            metadata = _resource_metadata_header(
                response.headers.get("www-authenticate", "")
            )
            raise McpAuthRequired(
                "MCP server requires authorization.",
                resource_metadata=metadata,
            )

        if response.status_code == 404:
            raise McpError("MCP endpoint was not found at this URL.")

        if response.status_code >= 400:
            raise McpProtocolError(
                f"MCP server returned HTTP {response.status_code}."
            )

        if response.status_code == 202 and expected_id is None:
            return {}

        messages = _rpc_messages(response)
        if not messages:
            if expected_id is None:
                return {}
            raise McpProtocolError("MCP server returned an empty response.")

        for message in messages:
            error = message.get("error")
            if isinstance(error, dict):
                detail = redact(str(error.get("message") or "MCP error"), 240)
                raise McpProtocolError(detail, data=error.get("data"))

        if expected_id is None:
            return messages[0].get("result") or {}

        for message in messages:
            if message.get("id") == expected_id:
                result = message.get("result")
                return result if isinstance(result, dict) else {}

        raise McpProtocolError("MCP server returned no matching response.")

    def initialize(self) -> dict[str, Any]:
        for version in (PROTOCOL_VERSION, *FALLBACK_PROTOCOL_VERSIONS):
            try:
                result = self._post(
                    {
                        "jsonrpc": "2.0",
                        "id": 1,
                        "method": "initialize",
                        "params": {
                            "protocolVersion": version,
                            "capabilities": {},
                            "clientInfo": {
                                "name": CLIENT_NAME,
                                "version": CLIENT_VERSION,
                            },
                        },
                    },
                    expected_id=1,
                )
            except McpProtocolError as error:
                text = str(error).lower()
                if "protocol version" in text or "unsupported" in text:
                    continue
                raise

            negotiated = result.get("protocolVersion")
            self.negotiated_version = (
                negotiated if isinstance(negotiated, str) and negotiated else version
            )
            self.protocol_version = self.negotiated_version

            try:
                self._post(
                    {
                        "jsonrpc": "2.0",
                        "method": "notifications/initialized",
                    },
                    expected_id=None,
                )
            except McpError:
                # Some servers answer 204/202 to notifications, others reject
                # them. The session is still usable if initialize succeeded.
                pass

            return result

        raise McpError(
            "MCP server does not support a known protocol version."
        )

    def list_tools(self) -> list[dict[str, Any]]:
        tools: list[dict[str, Any]] = []
        cursor: str | None = None
        seen_cursors: set[str] = set()

        for _ in range(MAX_TOOL_PAGES):
            params: dict[str, Any] = {}
            if cursor:
                params["cursor"] = cursor

            result = self._post(
                {
                    "jsonrpc": "2.0",
                    "id": 2,
                    "method": "tools/list",
                    "params": params,
                },
                expected_id=2,
            )

            page = result.get("tools")
            if isinstance(page, list):
                tools.extend(item for item in page if isinstance(item, dict))

            next_cursor = result.get("nextCursor")
            if not isinstance(next_cursor, str) or not next_cursor:
                break
            if next_cursor in seen_cursors:
                break

            seen_cursors.add(next_cursor)
            cursor = next_cursor

        return tools

    def call_tool(
        self, name: str, arguments: Mapping[str, Any]
    ) -> dict[str, Any]:
        result = self._post(
            {
                "jsonrpc": "2.0",
                "id": 3,
                "method": "tools/call",
                "params": {"name": name, "arguments": dict(arguments)},
            },
            expected_id=3,
        )
        return result


def _sanitize_tool(raw: Mapping[str, Any]) -> dict[str, Any] | None:
    name = raw.get("name")
    if not isinstance(name, str) or not name.strip():
        return None
    name = name.strip()[:128]

    title = raw.get("title")
    description = raw.get("description")
    annotations = raw.get("annotations")

    read_only = False
    destructive = False
    if isinstance(annotations, dict):
        read_only = annotations.get("readOnlyHint") is True
        destructive = annotations.get("destructiveHint") is True

    schema = raw.get("inputSchema")
    if not isinstance(schema, dict):
        schema = {"type": "object", "properties": {}}

    try:
        serialized = json.dumps(schema, ensure_ascii=False)
    except (TypeError, ValueError):
        serialized = ""

    if not serialized or len(serialized) > MAX_TOOL_SCHEMA_CHARS:
        schema = {
            "type": "object",
            "properties": {},
            "additionalProperties": True,
        }

    if schema.get("type") != "object":
        schema = {"type": "object", "properties": {}, "additionalProperties": True}

    return {
        "name": name,
        "title": str(title).strip()[:120] if isinstance(title, str) else "",
        "description": (
            str(description).strip()[:800]
            if isinstance(description, str)
            else ""
        ),
        "read_only": read_only,
        "destructive": destructive,
        "input_schema": schema,
    }


def _well_known_urls(base: str, suffix: str) -> list[str]:
    parts = urlsplit(base)
    origin = f"{parts.scheme}://{parts.netloc}"
    path = parts.path.rstrip("/")

    candidates: list[str] = []
    if path:
        candidates.append(f"{origin}/.well-known/{suffix}{path}")
        candidates.append(f"{origin}{path}/.well-known/{suffix}")
    candidates.append(f"{origin}/.well-known/{suffix}")
    return list(dict.fromkeys(candidates))


def _fetch_json(url: str, *, timeout: float = 15.0) -> dict[str, Any]:
    try:
        response = safe_request(
            "GET",
            url,
            headers={"Accept": "application/json"},
            timeout=timeout,
            max_bytes=512_000,
        )
    except (OutboundUrlError, ResponseTooLargeError, TimeoutError, ConnectionError):
        raise
    except Exception as error:  # pragma: no cover - defensive
        raise McpError("OAuth metadata request failed.") from error

    if response.status_code >= 400:
        raise McpError(f"Metadata request returned HTTP {response.status_code}.")

    try:
        data = response.json()
    except ValueError as error:
        raise McpError("Metadata endpoint returned invalid JSON.") from error

    if not isinstance(data, dict):
        raise McpError("Metadata endpoint returned an unexpected payload.")
    return data


def _first_json(urls: list[str]) -> dict[str, Any] | None:
    for url in urls:
        try:
            return _fetch_json(url)
        except (McpError, OutboundUrlError, ResponseTooLargeError, TimeoutError, ConnectionError):
            continue
    return None


def discover_oauth(
    server_url: str,
    *,
    resource_metadata_url: str | None = None,
) -> AuthDiscovery:
    """Discover the authorization server for an MCP endpoint."""

    resource_metadata: dict[str, Any] | None = None

    if resource_metadata_url:
        try:
            candidate = _fetch_json(resource_metadata_url)
            if "authorization_servers" in candidate or "scopes_supported" in candidate:
                resource_metadata = candidate
        except (McpError, OutboundUrlError, ResponseTooLargeError, TimeoutError, ConnectionError):
            resource_metadata = None

    if resource_metadata is None:
        resource_metadata = _first_json(
            _well_known_urls(server_url, "oauth-protected-resource")
        )

    if not resource_metadata:
        raise McpError(
            "This server did not publish OAuth metadata. It may use a "
            "bearer token instead."
        )

    authorization_servers = resource_metadata.get("authorization_servers")
    resource_scopes = resource_metadata.get("scopes_supported")

    if isinstance(authorization_servers, list) and authorization_servers:
        issuers = [
            item for item in authorization_servers if isinstance(item, str)
        ]
    else:
        parts = urlsplit(server_url)
        issuers = [f"{parts.scheme}://{parts.netloc}"]

    for issuer in issuers:
        metadata = _first_json(
            _well_known_urls(issuer, "oauth-authorization-server")
            + _well_known_urls(issuer, "openid-configuration")
        )
        if not metadata:
            continue

        authorization_endpoint = metadata.get("authorization_endpoint")
        token_endpoint = metadata.get("token_endpoint")
        if not isinstance(authorization_endpoint, str) or not isinstance(
            token_endpoint, str
        ):
            continue

        registration_endpoint = metadata.get("registration_endpoint")
        scopes = resource_scopes or metadata.get("scopes_supported") or []
        scope_values = tuple(
            item for item in scopes if isinstance(item, str) and item
        )

        methods = metadata.get("code_challenge_methods_supported")
        if isinstance(methods, list) and methods and "S256" not in methods:
            raise McpError("Authorization server does not support PKCE S256.")

        return AuthDiscovery(
            authorization_endpoint=validate_outbound_url(authorization_endpoint),
            token_endpoint=validate_outbound_url(token_endpoint),
            registration_endpoint=(
                validate_outbound_url(registration_endpoint)
                if isinstance(registration_endpoint, str)
                else None
            ),
            scopes=scope_values,
            issuer=issuer,
        )

    raise McpError("No usable OAuth authorization server was found.")


def _token_request(
    endpoint: str,
    data: dict[str, str],
    *,
    client_secret: str | None = None,
    auth_method: str = "none",
) -> dict[str, Any]:
    data = {key: value for key, value in data.items() if value}
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
    }

    if client_secret and auth_method == "client_secret_basic":
        client_id = data.get("client_id", "")
        raw = f"{client_id}:{client_secret}".encode("utf-8")
        headers["Authorization"] = (
            "Basic " + base64.b64encode(raw).decode("ascii")
        )
    elif client_secret and auth_method == "client_secret_post":
        data = {**data, "client_secret": client_secret}

    body = urlencode(data).encode("utf-8")

    try:
        response = safe_request(
            "POST",
            endpoint,
            headers=headers,
            body=body,
            timeout=30.0,
            max_bytes=512_000,
            follow_redirects=False,
        )
    except (OutboundUrlError, ResponseTooLargeError, TimeoutError, ConnectionError) as error:
        raise McpError("Token endpoint is unreachable.") from error

    if response.status_code >= 400:
        raise McpError(
            f"Token endpoint rejected the request (HTTP {response.status_code})."
        )

    try:
        payload = response.json()
    except ValueError as error:
        raise McpError("Token endpoint returned invalid JSON.") from error

    if not isinstance(payload, dict) or not isinstance(
        payload.get("access_token"), str
    ):
        detail = payload.get("error_description") if isinstance(payload, dict) else None
        raise McpError(
            redact(str(detail), 200)
            if detail
            else "Token endpoint returned no access token."
        )

    return payload


def begin_oauth(
    server: Mapping[str, Any], redirect_uri: str, user_id: str
) -> str:
    """Register a public client, save PKCE state and return the consent URL."""

    discovery = discover_oauth(server["url"])

    if not discovery.registration_endpoint:
        raise McpError(
            "This authorization server does not support dynamic client "
            "registration."
        )

    scope = " ".join(discovery.scopes)
    register_payload: dict[str, Any] = {
        "client_name": CLIENT_NAME,
        "redirect_uris": [redirect_uri],
        "grant_types": ["authorization_code", "refresh_token"],
        "response_types": ["code"],
        "token_endpoint_auth_method": "none",
    }
    if scope:
        register_payload["scope"] = scope

    try:
        response = safe_request(
            "POST",
            discovery.registration_endpoint,
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            json_body=register_payload,
            timeout=20.0,
            max_bytes=256_000,
            follow_redirects=False,
        )
    except (OutboundUrlError, ResponseTooLargeError, TimeoutError, ConnectionError) as error:
        raise McpError("Client registration failed.") from error

    if response.status_code == 400 and scope:
        register_payload.pop("scope", None)
        try:
            response = safe_request(
                "POST",
                discovery.registration_endpoint,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                json_body=register_payload,
                timeout=20.0,
                max_bytes=256_000,
                follow_redirects=False,
            )
        except (OutboundUrlError, ResponseTooLargeError, TimeoutError, ConnectionError) as error:
            raise McpError("Client registration failed.") from error

    if response.status_code >= 400:
        raise McpError(
            f"Client registration failed (HTTP {response.status_code})."
        )

    try:
        registration = response.json()
    except ValueError as error:
        raise McpError("Client registration returned invalid JSON.") from error

    if not isinstance(registration, dict) or not isinstance(
        registration.get("client_id"), str
    ):
        raise McpError("Client registration returned no client_id.")

    client_id = registration["client_id"]
    client_secret = registration.get("client_secret")
    if not isinstance(client_secret, str):
        client_secret = None
    auth_method = registration.get("token_endpoint_auth_method")
    if not isinstance(auth_method, str) or not auth_method:
        auth_method = "none"

    verifier = secrets.token_urlsafe(64)
    challenge = (
        base64.urlsafe_b64encode(hashlib.sha256(verifier.encode("ascii")).digest())
        .rstrip(b"=")
        .decode("ascii")
    )
    state = secrets.token_urlsafe(32)

    authorize_params = {
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "state": state,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
        "resource": server["url"],
    }
    if scope:
        authorize_params["scope"] = scope

    parts = urlsplit(discovery.authorization_endpoint)
    existing = dict(parse_qsl(parts.query))
    query = urlencode({**existing, **authorize_params})
    authorization_url = urlunsplit(
        (parts.scheme, parts.netloc, parts.path, query, "")
    )

    mcp_store.save_oauth_pending(
        state,
        {
            "server_id": server["id"],
            "user_id": user_id,
            "verifier": verifier,
            "client_id": client_id,
            "client_secret": client_secret,
            "token_endpoint": discovery.token_endpoint,
            "token_auth_method": auth_method,
            "redirect_uri": redirect_uri,
            "scope": scope,
            "resource": server["url"],
        },
    )

    return authorization_url


def complete_oauth(
    state: str, code: str, *, user_id: str | None = None
) -> tuple[str, str]:
    """Exchange an authorization code and store the token bundle.

    Returns ``(server_id, user_id)``.
    """

    pending = mcp_store.take_oauth_pending(state)
    if not pending:
        raise McpError("Authorization state is unknown or expired.")

    effective_user = pending["user_id"]
    if user_id and effective_user != user_id:
        raise McpError("Authorization state belongs to another account.")

    token_data = _token_request(
        pending["token_endpoint"],
        {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": pending["redirect_uri"],
            "client_id": pending["client_id"],
            "code_verifier": pending["verifier"],
            "resource": pending["resource"] or "",
        },
        client_secret=pending["client_secret"],
        auth_method=pending["token_auth_method"] or "none",
    )

    expires_in = token_data.get("expires_in")
    expires_at = None
    if isinstance(expires_in, (int, float)) and expires_in > 0:
        expires_at = int(time.time() + float(expires_in) - 30)

    refresh_token = token_data.get("refresh_token")
    bundle = {
        "access_token": token_data["access_token"],
        "refresh_token": refresh_token if isinstance(refresh_token, str) else None,
        "expires_at": expires_at,
        "token_endpoint": pending["token_endpoint"],
        "client_id": pending["client_id"],
        "client_secret": pending["client_secret"],
        "token_auth_method": pending["token_auth_method"] or "none",
        "scope": token_data.get("scope") or pending["scope"],
        "resource": pending["resource"],
    }

    mcp_store.save_secret(pending["server_id"], bundle)
    mcp_store.update_server_result(
        pending["server_id"],
        status="connected",
        last_error=None,
        oauth_available=False,
    )

    return pending["server_id"], effective_user


def refresh_oauth(server_id: str, bundle: Mapping[str, Any]) -> dict[str, Any]:
    refresh_token = bundle.get("refresh_token")
    token_endpoint = bundle.get("token_endpoint")
    client_id = bundle.get("client_id")

    if (
        not isinstance(refresh_token, str)
        or not isinstance(token_endpoint, str)
        or not isinstance(client_id, str)
    ):
        raise McpAuthRequired("Reconnect this MCP server to refresh access.")

    token_data = _token_request(
        token_endpoint,
        {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": client_id,
            "resource": str(bundle.get("resource") or ""),
        },
        client_secret=(
            bundle.get("client_secret")
            if isinstance(bundle.get("client_secret"), str)
            else None
        ),
        auth_method=str(bundle.get("token_auth_method") or "none"),
    )

    expires_in = token_data.get("expires_in")
    expires_at = None
    if isinstance(expires_in, (int, float)) and expires_in > 0:
        expires_at = int(time.time() + float(expires_in) - 30)

    updated = {
        **dict(bundle),
        "access_token": token_data["access_token"],
        "expires_at": expires_at,
    }
    new_refresh = token_data.get("refresh_token")
    if isinstance(new_refresh, str):
        updated["refresh_token"] = new_refresh

    mcp_store.save_secret(server_id, updated)
    return updated


def access_token_for(
    server: Mapping[str, Any], *, force_refresh: bool = False
) -> str | None:
    bundle = mcp_store.load_secret(server["id"])
    if not bundle:
        return None

    access_token = bundle.get("access_token")
    if not isinstance(access_token, str) or not access_token:
        access_token = None

    expires_at = bundle.get("expires_at")
    expired = (
        isinstance(expires_at, (int, float))
        and expires_at > 0
        and time.time() >= float(expires_at) - 30
    )

    if bundle.get("refresh_token") and (force_refresh or expired):
        try:
            refreshed = refresh_oauth(server["id"], bundle)
            token = refreshed.get("access_token")
            return token if isinstance(token, str) else None
        except McpError:
            if force_refresh or expired:
                raise McpAuthRequired(
                    "MCP authorization expired. Reconnect the server."
                )

    if access_token is None and bundle.get("refresh_token"):
        refreshed = refresh_oauth(server["id"], bundle)
        token = refreshed.get("access_token")
        return token if isinstance(token, str) else None

    return access_token


def _probe_tools(
    server: Mapping[str, Any], access_token: str | None
) -> tuple[list[dict[str, Any]], str | None]:
    client = McpHttpClient(server["url"], access_token=access_token)
    client.initialize()
    raw_tools = client.list_tools()

    tools: list[dict[str, Any]] = []
    seen: set[str] = set()
    for raw in raw_tools:
        tool = _sanitize_tool(raw)
        if not tool or tool["name"] in seen:
            continue
        seen.add(tool["name"])
        tools.append(tool)

    return tools, client.negotiated_version


def probe_server(server: Mapping[str, Any]) -> tuple[list[dict[str, Any]], str | None]:
    """Initialize a server and list tools, refreshing OAuth once on 401."""

    token = access_token_for(server)

    try:
        return _probe_tools(server, token)
    except McpAuthRequired:
        if not token:
            raise
        fresh = access_token_for(server, force_refresh=True)
        return _probe_tools(server, fresh)


def probe_anonymous(url: str) -> tuple[list[dict[str, Any]], str | None]:
    return _probe_tools({"url": validate_outbound_url(url)}, None)


def _format_result(result: Mapping[str, Any]) -> tuple[str, bool]:
    is_error = bool(result.get("isError"))
    blocks = result.get("content")
    parts: list[str] = []

    if isinstance(blocks, list):
        for block in blocks:
            if not isinstance(block, dict):
                continue
            block_type = block.get("type")
            if block_type == "text" and isinstance(block.get("text"), str):
                parts.append(block["text"])
            elif block_type == "image":
                parts.append("[image returned by tool]")
            elif block_type == "audio":
                parts.append("[audio returned by tool]")
            elif block_type == "resource":
                resource = block.get("resource")
                if isinstance(resource, dict) and isinstance(
                    resource.get("text"), str
                ):
                    parts.append(resource["text"])
                else:
                    parts.append("[resource returned by tool]")
            else:
                parts.append(f"[{block_type or 'unknown'} content]")

    structured = result.get("structuredContent")
    if not parts and structured is not None:
        try:
            parts.append(json.dumps(structured, ensure_ascii=False))
        except (TypeError, ValueError):
            parts.append(str(structured))

    text = "\n\n".join(part for part in parts if part).strip()
    if not text:
        text = "(tool returned no text content)"

    if len(text) > MAX_TOOL_RESULT_CHARS:
        text = (
            text[:MAX_TOOL_RESULT_CHARS]
            + "\n\n[tool output truncated by KAEL]"
        )

    return text, is_error


def call_server_tool(
    server: Mapping[str, Any],
    tool_name: str,
    arguments: Mapping[str, Any],
) -> tuple[str, bool]:
    """Execute one tool with a fresh MCP session."""

    available = {
        tool["name"] for tool in server.get("tools", []) if isinstance(tool, dict)
    }
    if available and tool_name not in available:
        raise McpError(f"Tool '{tool_name}' is not offered by this server.")

    token = access_token_for(server)

    def execute(access_token: str | None) -> tuple[str, bool]:
        client = McpHttpClient(server["url"], access_token=access_token)
        client.initialize()
        return _format_result(client.call_tool(tool_name, arguments))

    try:
        return execute(token)
    except McpAuthRequired:
        if not token:
            raise
        fresh = access_token_for(server, force_refresh=True)
        return execute(fresh)


def server_status_message(error: Exception) -> str:
    if isinstance(error, McpAuthRequired):
        return "Authorization required."
    return redact(str(error), 240)
