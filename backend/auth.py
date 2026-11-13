"""Telegram Mini App authentication for KAEL.

The frontend sends Telegram's signed ``initData``. We verify the HMAC with the
bot token, then issue a short stateless session token signed with
``KAEL_JWT_SECRET``. No user database is required: the Telegram user payload is
embedded in the token and protected by HMAC-SHA256.

Required environment variables:
    TELEGRAM_BOT_TOKEN  - token from @BotFather
    KAEL_JWT_SECRET     - long random secret used to sign session tokens

Optional:
    KAEL_ALLOWED_TG_IDS - comma-separated Telegram user IDs for a closed beta.
                          Empty value allows every Telegram user.
"""

import base64
import hashlib
import hmac
import json
import os
import time
from urllib.parse import parse_qsl

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])

INIT_DATA_MAX_AGE = 24 * 60 * 60  # 24 hours
SESSION_TTL = 7 * 24 * 60 * 60  # 7 days
BETA_CLOSED_MSG = (
    "KAEL AI сейчас в закрытой бете. "
    "Твой аккаунт пока не в списке приглашённых."
)


def _allowed_tg_ids() -> set[int]:
    """Read the optional allowlist on each check so env changes apply safely."""
    raw = os.getenv("KAEL_ALLOWED_TG_IDS", "").strip()
    ids: set[int] = set()
    for chunk in raw.split(","):
        value = chunk.strip()
        if value.isdigit():
            ids.add(int(value))
    return ids


def _is_allowed(user_id: int) -> bool:
    allowed = _allowed_tg_ids()
    return not allowed or user_id in allowed


class TelegramAuthRequest(BaseModel):
    initData: str


# ---------- helpers ----------


def _b64e(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def _b64d(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def _bot_token() -> str:
    token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    if not token:
        raise HTTPException(
            status_code=500,
            detail="TELEGRAM_BOT_TOKEN не настроен на сервере.",
        )
    return token


def _jwt_secret() -> bytes:
    secret = os.getenv("KAEL_JWT_SECRET", "").strip()
    if not secret:
        raise HTTPException(
            status_code=500,
            detail="KAEL_JWT_SECRET не настроен на сервере.",
        )
    return secret.encode()


# ---------- initData verification ----------


def verify_init_data(init_data: str) -> dict:
    if not init_data or not init_data.strip():
        raise HTTPException(status_code=401, detail="initData пустой.")

    data = dict(parse_qsl(init_data, keep_blank_values=True))

    received_hash = data.pop("hash", None)
    if not received_hash:
        raise HTTPException(status_code=401, detail="initData: отсутствует hash.")

    try:
        auth_date = int(data.get("auth_date", ""))
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="initData: некорректный auth_date.",
        )

    age = time.time() - auth_date
    if age > INIT_DATA_MAX_AGE or age < -60:
        raise HTTPException(
            status_code=401,
            detail="initData устарел, перезапусти Mini App.",
        )

    # Telegram signs every field except hash, including the newer signature
    # field. Keys must be sorted and joined with newlines.
    data_check_string = "\n".join(
        f"{key}={value}" for key, value in sorted(data.items())
    )
    secret_key = hmac.new(
        b"WebAppData", _bot_token().encode(), hashlib.sha256
    ).digest()
    calculated = hmac.new(
        secret_key, data_check_string.encode(), hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(calculated, received_hash):
        raise HTTPException(status_code=401, detail="initData: неверная подпись.")

    try:
        raw_user = json.loads(data.get("user", ""))
        user_id = int(raw_user["id"])
    except (ValueError, KeyError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="initData: нет данных пользователя.",
        )

    return {
        "id": user_id,
        "first_name": str(raw_user.get("first_name", "")),
        "username": raw_user.get("username"),
        "photo_url": raw_user.get("photo_url"),
    }


# ---------- stateless session token ----------


def create_token(user: dict) -> str:
    now = int(time.time())
    payload = {**user, "iat": now, "exp": now + SESSION_TTL}
    payload_b64 = _b64e(
        json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode()
    )
    signature = hmac.new(
        _jwt_secret(), payload_b64.encode(), hashlib.sha256
    ).digest()
    return f"{payload_b64}.{_b64e(signature)}"


def verify_token(token: str) -> dict:
    try:
        payload_b64, signature_b64 = token.split(".", 1)
        expected = hmac.new(
            _jwt_secret(), payload_b64.encode(), hashlib.sha256
        ).digest()
        if not hmac.compare_digest(expected, _b64d(signature_b64)):
            raise ValueError("bad signature")

        payload = json.loads(_b64d(payload_b64))
        if int(payload["exp"]) < time.time():
            raise ValueError("expired")
        int(payload["id"])
        return payload
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Недействительный или просроченный токен.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=401,
            detail="Требуется авторизация.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = verify_token(authorization[7:].strip())
    user_id = int(payload["id"])

    # Re-check the allowlist on every request: removing an ID revokes access
    # even while an already issued 7-day token is still valid.
    if not _is_allowed(user_id):
        raise HTTPException(status_code=403, detail=BETA_CLOSED_MSG)

    return {
        key: payload.get(key)
        for key in ("id", "first_name", "username", "photo_url")
    }


# ---------- endpoint ----------


@router.post("/telegram-webapp")
def telegram_webapp_login(body: TelegramAuthRequest):
    user = verify_init_data(body.initData)
    if not _is_allowed(int(user["id"])):
        raise HTTPException(status_code=403, detail=BETA_CLOSED_MSG)
    return {"token": create_token(user), "user": user}
