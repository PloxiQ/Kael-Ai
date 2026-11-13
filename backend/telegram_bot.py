"""Telegram bot webhook for the KAEL Mini App.

The bot does not register users and does not accept passwords. It only replies
with a Web App button: authentication happens inside the Mini App with
Telegram-signed ``initData``.

Required environment variables:
    TELEGRAM_BOT_TOKEN       - token from @BotFather
    TELEGRAM_WEBHOOK_SECRET  - secret passed to setWebhook and checked here
"""

import hmac
import logging
import os

import requests
from fastapi import APIRouter, Header, HTTPException

router = APIRouter(prefix="/telegram", tags=["telegram"])

WEBAPP_URL = "https://kael-ai.ct.ws/"

logger = logging.getLogger("uvicorn.error")

MESSAGES = {
    "ru": (
        "KAEL работает как Telegram Mini App. "
        "Нажми кнопку ниже — вход произойдёт автоматически, "
        "без пароля и регистрации."
    ),
    "uk": (
        "KAEL працює як Telegram Mini App. "
        "Натисни кнопку нижче — вхід відбудеться автоматично, "
        "без пароля та реєстрації."
    ),
    "en": (
        "KAEL runs as a Telegram Mini App. "
        "Tap the button below — you'll be signed in automatically, "
        "no password or sign-up needed."
    ),
}

BUTTONS = {
    "ru": "Открыть KAEL",
    "uk": "Відкрити KAEL",
    "en": "Open KAEL",
}


def _language(value: str | None) -> str:
    code = (value or "ru").split("-")[0].lower()
    return code if code in MESSAGES else "en"


def _bot_token() -> str:
    token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    if not token:
        raise RuntimeError("TELEGRAM_BOT_TOKEN is not configured")
    return token


def _send_open_button(chat_id: int, language: str) -> None:
    payload = {
        "chat_id": chat_id,
        "text": MESSAGES[language],
        "disable_web_page_preview": True,
        "reply_markup": {
            "inline_keyboard": [
                [
                    {
                        "text": BUTTONS[language],
                        "web_app": {"url": WEBAPP_URL},
                    }
                ]
            ]
        },
    }
    try:
        response = requests.post(
            f"https://api.telegram.org/bot{_bot_token()}/sendMessage",
            json=payload,
            timeout=15,
        )
        if not response.ok:
            logger.warning(
                "Telegram sendMessage failed with %s", response.status_code
            )
    except requests.RequestException as exc:
        # Never make Telegram retry the whole update because of a send error.
        logger.warning("Telegram sendMessage request failed: %s", exc)


@router.post("/webhook")
def telegram_webhook(
    update: dict,
    x_telegram_bot_api_secret_token: str | None = Header(default=None),
) -> dict[str, bool]:
    expected = os.getenv("TELEGRAM_WEBHOOK_SECRET", "").strip()
    if not expected:
        raise HTTPException(
            status_code=500,
            detail="TELEGRAM_WEBHOOK_SECRET не настроен на сервере.",
        )
    if not hmac.compare_digest(
        expected, x_telegram_bot_api_secret_token or ""
    ):
        raise HTTPException(status_code=403, detail="Invalid webhook secret.")

    message = update.get("message") or update.get("edited_message")
    if not isinstance(message, dict):
        return {"ok": True}

    chat = message.get("chat") or {}
    if chat.get("type") != "private":
        return {"ok": True}

    chat_id = chat.get("id")
    if not isinstance(chat_id, int):
        return {"ok": True}

    sender = message.get("from") or {}
    _send_open_button(chat_id, _language(sender.get("language_code")))
    return {"ok": True}
