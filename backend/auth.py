"""Clerk session authentication for KAEL.

The frontend is a static Next.js export, so Clerk runs entirely in the
browser. It issues a short-lived RS256 session token (custom JWT template
``kael``), the SPA sends it as ``Authorization: Bearer <token>``, and this
module verifies the signature against the Clerk JWKS endpoint.

Required environment variables:
    CLERK_ISSUER - Clerk Frontend API URL, for example
                   ``https://your-instance.clerk.accounts.dev``.

Optional:
    CLERK_JWKS_URL           - override the JWKS endpoint (proxy setups).
    CLERK_AUTHORIZED_PARTIES - comma-separated origins allowed in ``azp``.
                               Falls back to ``KAEL_ALLOWED_ORIGINS`` plus the
                               local development origins.
"""

import os
from typing import Literal, Mapping, cast

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from pydantic import BaseModel

Role = Literal["admin", "tester", "user"]

ROLES: frozenset[str] = frozenset({"admin", "tester", "user"})

DEFAULT_AUTHORIZED_PARTIES = frozenset(
    {
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    }
)

_bearer = HTTPBearer(auto_error=False)

_jwks_client: PyJWKClient | None = None
_jwks_url: str | None = None


class CurrentUser(BaseModel):
    """Identity extracted from a verified Clerk session token."""

    id: str
    role: Role = "user"
    email: str | None = None
    name: str | None = None


def _issuer() -> str:
    issuer = os.getenv("CLERK_ISSUER", "").strip().rstrip("/")
    if not issuer:
        raise HTTPException(
            status_code=500,
            detail="CLERK_ISSUER не настроен на сервере.",
        )
    return issuer


def _jwks_endpoint(issuer: str) -> str:
    override = os.getenv("CLERK_JWKS_URL", "").strip()
    return override or f"{issuer}/.well-known/jwks.json"


def _get_jwks_client(issuer: str) -> PyJWKClient:
    global _jwks_client, _jwks_url

    url = _jwks_endpoint(issuer)
    if _jwks_client is None or _jwks_url != url:
        _jwks_client = PyJWKClient(url, cache_keys=True, lifespan=300)
        _jwks_url = url

    return _jwks_client


def _authorized_parties() -> set[str]:
    raw = os.getenv("CLERK_AUTHORIZED_PARTIES", "").strip()
    if not raw:
        raw = os.getenv("KAEL_ALLOWED_ORIGINS", "").strip()

    configured = {
        item.strip().rstrip("/") for item in raw.split(",") if item.strip()
    }

    # Localhost parties are a development convenience only. Accepting them in
    # production would let a token minted for a local app on the same Clerk
    # instance be replayed against the deployed backend.
    if os.getenv("KAEL_ENV", "").strip().lower() == "production":
        return configured

    return configured | set(DEFAULT_AUTHORIZED_PARTIES)


def _extract_role(payload: Mapping[str, object]) -> Role:
    candidates: list[object] = [payload.get("role")]

    for key in ("metadata", "public_metadata"):
        value = payload.get(key)
        if isinstance(value, dict):
            candidates.append(value.get("role"))

    for candidate in candidates:
        if isinstance(candidate, str):
            normalized = candidate.strip().lower()
            if normalized in ROLES:
                return cast(Role, normalized)

    return "user"


def _optional_string(payload: Mapping[str, object], key: str) -> str | None:
    value = payload.get(key)
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None


def verify_token(token: str) -> dict[str, object]:
    """Verify a Clerk session token and return its claims."""

    issuer = _issuer()

    try:
        signing_key = _get_jwks_client(issuer).get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=issuer,
            options={"require": ["exp", "iat", "sub", "azp"]},
        )
    except jwt.PyJWTError as error:
        raise HTTPException(
            status_code=401,
            detail="Недействительный или просроченный токен.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from error

    authorized_parties = _authorized_parties()
    azp = payload.get("azp")
    if not isinstance(azp, str) or azp.rstrip("/") not in authorized_parties:
        raise HTTPException(
            status_code=403,
            detail="Источник сессии не разрешён.",
        )

    if not isinstance(payload.get("sub"), str) or not payload["sub"]:
        raise HTTPException(
            status_code=401,
            detail="В токене отсутствует идентификатор пользователя.",
        )

    return cast(dict[str, object], payload)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> CurrentUser:
    """FastAPI dependency: resolve the Clerk user or raise 401/403."""

    if (
        credentials is None
        or credentials.scheme.lower() != "bearer"
        or not credentials.credentials.strip()
    ):
        raise HTTPException(
            status_code=401,
            detail="Требуется авторизация.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = verify_token(credentials.credentials.strip())

    return CurrentUser(
        id=cast(str, payload["sub"]),
        role=_extract_role(payload),
        email=_optional_string(payload, "email"),
        name=_optional_string(payload, "name"),
    )
