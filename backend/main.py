import base64
import binascii
import io
import os
import re
import secrets
import time
from typing import Literal

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import APIConnectionError, APIStatusError, APITimeoutError, OpenAI
from pydantic import BaseModel, Field
from pypdf import PdfReader


load_dotenv()

CREATOR_ANSWER = (
    "Я сделан командой Kael, в основном от @SAM0SOB0Y, ихний тг канал "
    "с обновлением меня: t.me/SAM0S0B0Y"
)

KAEL_SYSTEM_PROMPT = f"""
Ты — KAEL, умный и прямолинейный AI-помощник.

Твой характер: уверенный, немного дерзкий и слегка саркастичный, но всегда полезный
и уважительный. Объясняй сложные вещи простыми словами, без корпоративной воды и
театральных обещаний. Говори кратко, если вопрос простой, и структурированно, если
задача сложная. Не выдумывай факты: если данных не хватает, прямо скажи, чего именно
не хватает. Сарказм используй легко и по делу — не оскорбляй пользователя и не
позволяй стилю скрывать важные технические ограничения.

Если пользователь просит простой готовый файл без интерактивного превью
(например, README, конфиг или небольшой скрипт для скачивания), верни его
содержимое внутри тега:
<kael_file name="main.py" language="python">
...содержимое файла...
</kael_file>
Внутри тега давай только содержимое файла, без Markdown-ограждений. Обычные
небольшие фрагменты кода в ответе оставляй в Markdown-блоках. Для сайтов,
интерфейсов, React-компонентов, SVG, игр и визуализаций используй
<kael_artifact> по правилам ниже.

О тебе: тебя сделала команда Kael, основной разработчик — @SAM0SOB0Y,
телеграм-канал обновлений: t.me/SAM0S0B0Y. На любой вопрос о создателе,
разработчике или происхождении KAEL отвечай дословно:
«{CREATOR_ANSWER}»
Не добавляй к этому ответу ничего лишнего.
""".strip()

ARTIFACT_PROTOCOL = """
Артефакты. Если пользователь просит готовый standalone-результат — сайт,
лендинг, интерфейс, игру, визуализацию, React-компонент, SVG-графику,
Python-скрипт или длинный Markdown-документ — оформляй результат одним блоком:
<kael_artifact id="unique-id" type="html|react|code|markdown|svg" title="Descriptive Title" language="html">
...содержимое...
</kael_artifact>

Правила артефактов:
- type=html — самодостаточная HTML-страница с CSS и JS; добавляй <!DOCTYPE html>.
- type=react — один самодостаточный React-компонент с default export; разрешены
  Tailwind-классы.
- type=svg — валидный SVG.
- type=markdown — полноценный Markdown-документ.
- type=code — standalone-скрипт или файл кода; язык указывай в language.
- id — уникальный идентификатор латиницей, цифрами и дефисами.
- title — короткое описательное название.
- language — html, tsx, jsx, python, javascript, typescript, css, svg или markdown.
- Внутри тега только содержимое артефакта, без Markdown-ограждений и без
  комментариев о самом артефакте.
- Не оборачивай в артефакт короткие примеры кода, объяснения и ответы на вопросы.
- Не создавай больше трёх артефактов в одном ответе.
- Текст вне тега — короткое пояснение, что это и как открыть.

Для простых downloadable-файлов без интерактивного превью можно использовать
<kael_file name="main.py" language="python">...</kael_file>. Не дублируй один и
тот же результат в <kael_file> и <kael_artifact>.
""".strip()

ProviderName = Literal["openrouter", "groq", "ollama"]
ResponseMode = Literal["fast", "balanced", "deep"]
Language = Literal["ru", "uk", "en"]
AttachmentKind = Literal["image", "pdf", "text", "code"]

PROVIDER_LABELS: dict[ProviderName, str] = {
    "openrouter": "OpenRouter",
    "groq": "Groq",
    "ollama": "Ollama",
}

SUPPORTED_MODELS: dict[ProviderName, tuple[str, ...]] = {
    "openrouter": (
        "openai/gpt-4o-mini",
        "openai/gpt-4o",
        "anthropic/claude-3.5-sonnet",
        "deepseek/deepseek-chat",
    ),
    "groq": (
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
    ),
    "ollama": (
        "llama3",
        "mistral",
    ),
}

DEFAULT_MODELS: dict[ProviderName, str] = {
    "openrouter": os.getenv("OPENROUTER_MODEL", SUPPORTED_MODELS["openrouter"][0]),
    "groq": os.getenv("GROQ_MODEL", SUPPORTED_MODELS["groq"][0]),
    "ollama": os.getenv("OLLAMA_MODEL", SUPPORTED_MODELS["ollama"][0]),
}

VISION_MODELS = {
    "openai/gpt-4o-mini",
    "openai/gpt-4o",
    "anthropic/claude-3.5-sonnet",
}


def _env_int(name: str, default: int) -> int:
    raw_value = os.getenv(name)
    if not raw_value:
        return default
    try:
        return int(raw_value)
    except ValueError:
        return default


def _env_float(name: str, default: float) -> float:
    raw_value = os.getenv(name)
    if not raw_value:
        return default
    try:
        return float(raw_value)
    except ValueError:
        return default


def _env_csv(name: str, default: tuple[str, ...]) -> list[str]:
    raw_value = os.getenv(name, "").strip()
    if not raw_value:
        return list(default)
    return [
        item.strip().rstrip("/")
        for item in raw_value.split(",")
        if item.strip()
    ]


MODE_INSTRUCTIONS: dict[ResponseMode, str] = {
    "fast": (
        "Режим Fast. Отвечай коротко и по делу: один-три абзаца или компактный "
        "список. Не расписывай ход рассуждений и не добавляй длинные вступления. "
        "Если нужен код, дай минимальный рабочий фрагмент и одно короткое "
        "пояснение."
    ),
    "balanced": (
        "Режим Balanced. Дай стандартный структурированный ответ: короткое "
        "вступление, основная часть и практический следующий шаг. Для сложных "
        "задач используй списки и примеры, но без лишней воды."
    ),
    "deep": (
        "Режим Deep Think. Разбери задачу глубоко: покажи архитектуру решения, "
        "компромиссы, крайние случаи и способ проверки результата. Для кода "
        "предложи структуру модулей и ключевые решения. Ответ может быть "
        "подробным, но каждое предложение должно нести смысл."
    ),
}

LANGUAGE_INSTRUCTIONS: dict[Language, str] = {
    "ru": (
        "Язык ответа: русский. Отвечай на русском, даже если часть "
        "контекста или кода на другом языке. Сохраняй характер KAEL."
    ),
    "uk": (
        "Мова відповіді: українська. Відповідай українською, навіть якщо "
        "частина контексту або коду іншою мовою. Зберігай характер KAEL."
    ),
    "en": (
        "Response language: English. Reply in English even when part of "
        "the context or code is in another language. Keep KAEL's voice."
    ),
}

MODE_TEMPERATURE: dict[ResponseMode, float] = {
    "fast": 0.6,
    "balanced": 0.7,
    "deep": 0.55,
}

MODE_MAX_TOKENS: dict[ResponseMode, int] = {
    "fast": _env_int("KAEL_FAST_MAX_TOKENS", 512),
    "balanced": _env_int("KAEL_BALANCED_MAX_TOKENS", 1_024),
    "deep": _env_int("KAEL_DEEP_MAX_TOKENS", 2_048),
}

DEV_MAX_TOKENS = _env_int("KAEL_DEV_MAX_TOKENS", 8_192)
DEV_SECRET = os.getenv("KAEL_DEV_SECRET", "").strip() or "kael-dev-2026"
MAX_ATTACHMENTS = _env_int("KAEL_MAX_ATTACHMENTS", 6)
MAX_ATTACHMENT_BASE64_CHARS = _env_int(
    "KAEL_MAX_ATTACHMENT_BASE64_CHARS", 14_000_000
)
MAX_PDF_CHARS = _env_int("KAEL_MAX_PDF_CHARS", 30_000)
MAX_TEXT_ATTACHMENT_CHARS = _env_int(
    "KAEL_MAX_TEXT_ATTACHMENT_CHARS", 60_000
)

CREATOR_PATTERNS = (
    r"кто (тебя|вас) (сделал|создал|разработал|придумал|написал)",
    r"кто (твой|ваш) (создатель|разработчик|автор|владелец)",
    r"кем (ты|вы) (сделан|создан|разработан)",
    r"кто (создал|сделал|разработал|придумал) (kael|кэл|кел)",
    r"кто (разработчик|создатель|автор|владелец) (kael|кэл|кел)",
    r"кто стоит за (kael|кэл|кел|тобой)",
    r"откуда (ты|kael|кэл|кел) (взялся|появился)",
    r"who (made|created|built|developed|designed) you",
    r"who is your (creator|developer|author|owner)",
    r"who (owns|runs|made|created|built) kael",
)


class AttachmentPayload(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    mime_type: str = Field(
        default="application/octet-stream", max_length=120
    )
    size: int = Field(default=0, ge=0, le=50_000_000)
    kind: AttachmentKind = "text"
    data: str | None = Field(default=None, max_length=16_000_000)
    text: str | None = Field(default=None, max_length=200_000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=12_000)
    model: str | None = Field(default=None, max_length=200)
    provider: ProviderName | None = None
    mode: ResponseMode = "balanced"
    language: Language = "ru"
    dev_mode: bool = False
    attachments: list[AttachmentPayload] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str
    provider: ProviderName
    model_used: str
    mode: ResponseMode
    latency_ms: int
    tokens_used: int
    dev_mode: bool = False
    attachments_used: int = 0


DEFAULT_ALLOWED_ORIGINS = (
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
)

# Set KAEL_ALLOWED_ORIGINS to the exact public frontend origin(s), for example:
# KAEL_ALLOWED_ORIGINS=https://kael.infinityfreeapp.com
# Multiple origins are comma-separated. Local development origins remain
# allowed so the same backend can be used while testing locally.
ALLOWED_ORIGINS = sorted(
    set(DEFAULT_ALLOWED_ORIGINS)
    | set(_env_csv("KAEL_ALLOWED_ORIGINS", ()))
)
ALLOWED_ORIGIN_REGEX = (
    os.getenv("KAEL_ALLOWED_ORIGIN_REGEX", "").strip() or None
)

app = FastAPI(
    title="KAEL API",
    description="Multi-provider FastAPI backend for KAEL.",
    version="0.9.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=ALLOWED_ORIGIN_REGEX,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Developer-Secret"],
)


def _system_prompt(mode: ResponseMode, language: Language = "ru") -> str:
    return (
        f"{KAEL_SYSTEM_PROMPT}\n\n{ARTIFACT_PROTOCOL}\n\n"
        f"{MODE_INSTRUCTIONS[mode]}\n\n"
        f"{LANGUAGE_INSTRUCTIONS[language]}"
    )


def _estimate_tokens(*texts: str) -> int:
    characters = sum(len(text.strip()) for text in texts)
    return max(1, characters // 4)


def _content_text(content: str | list[dict]) -> str:
    if isinstance(content, str):
        return content

    parts: list[str] = []
    for part in content:
        text = part.get("text") if isinstance(part, dict) else None
        if isinstance(text, str):
            parts.append(text)
    return "\n".join(parts)


def _is_creator_question(message: str) -> bool:
    normalized = re.sub(
        r"\s+", " ", message.lower().replace("ё", "е")
    ).strip()
    if not normalized:
        return False
    return any(re.search(pattern, normalized) for pattern in CREATOR_PATTERNS)


def _normalize_model(provider: ProviderName, model: str) -> str:
    candidate = model.strip()
    prefix = f"{provider}/"
    if candidate.lower().startswith(prefix):
        return candidate[len(prefix) :].strip()
    return candidate


def _provider_from_model(model: str | None) -> ProviderName:
    if not model or not model.strip():
        return "openrouter"

    candidate = model.strip().lower()
    prefix = candidate.split("/", 1)[0]

    if prefix == "openrouter":
        return "openrouter"
    if prefix == "groq":
        return "groq"
    if prefix == "ollama":
        return "ollama"

    for provider, models in SUPPORTED_MODELS.items():
        if candidate in {supported.lower() for supported in models}:
            return provider

    for provider, default_model in DEFAULT_MODELS.items():
        if candidate == default_model.strip().lower():
            return provider

    return "openrouter"


def _resolve_model(provider: ProviderName, requested: str | None) -> str:
    if requested and requested.strip():
        normalized = _normalize_model(provider, requested)
        supported = {
            model.lower(): model for model in SUPPORTED_MODELS[provider]
        }

        if normalized.lower() not in supported:
            available = ", ".join(SUPPORTED_MODELS[provider])
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Model '{requested}' is not available for "
                    f"{PROVIDER_LABELS[provider]}. Supported models: {available}."
                ),
            )

        return supported[normalized.lower()]

    configured = DEFAULT_MODELS[provider].strip()
    return configured or SUPPORTED_MODELS[provider][0]


def _decode_attachment_data(attachment: AttachmentPayload) -> bytes:
    if not attachment.data:
        raise HTTPException(
            status_code=400,
            detail=f"Attachment '{attachment.name}' has no data.",
        )

    if len(attachment.data) > MAX_ATTACHMENT_BASE64_CHARS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Attachment '{attachment.name}' is too large. "
                "Maximum is about 10 MB."
            ),
        )

    try:
        return base64.b64decode(attachment.data, validate=True)
    except (binascii.Error, ValueError) as error:
        raise HTTPException(
            status_code=400,
            detail=f"Attachment '{attachment.name}' has invalid base64 data.",
        ) from error


def _extract_pdf_text(data: bytes, name: str) -> str:
    try:
        reader = PdfReader(io.BytesIO(data))
    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=f"PDF '{name}' could not be read.",
        ) from error

    if reader.is_encrypted:
        try:
            reader.decrypt("")
        except Exception as error:
            raise HTTPException(
                status_code=400,
                detail=f"PDF '{name}' is password protected.",
            ) from error

    chunks: list[str] = []
    total = 0

    for page in reader.pages:
        try:
            page_text = (page.extract_text() or "").strip()
        except Exception:
            continue

        if not page_text:
            continue

        remaining = MAX_PDF_CHARS - total
        if remaining <= 0:
            break

        chunk = page_text[:remaining]
        chunks.append(chunk)
        total += len(chunk)

        if total >= MAX_PDF_CHARS:
            break

    extracted = "\n\n".join(chunks).strip()
    if not extracted:
        return (
            f"[PDF: {name}. Текст не извлечён. "
            "Возможно, это скан без текстового слоя.]"
        )

    if total >= MAX_PDF_CHARS:
        extracted += "\n\n[Текст PDF обрезан до лимита.]"

    return extracted


def _attachment_text(attachment: AttachmentPayload) -> str:
    if attachment.text:
        text = attachment.text
    elif attachment.data:
        data = _decode_attachment_data(attachment)
        text = data.decode("utf-8", errors="replace")
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Attachment '{attachment.name}' has no text content.",
        )

    normalized = text.replace("\u0000", "").strip()
    if not normalized:
        raise HTTPException(
            status_code=400,
            detail=f"Attachment '{attachment.name}' is empty.",
        )

    if len(normalized) > MAX_TEXT_ATTACHMENT_CHARS:
        normalized = (
            normalized[:MAX_TEXT_ATTACHMENT_CHARS]
            + "\n\n[Текст вложения обрезан до лимита.]"
        )

    return normalized


def _attachment_block(attachment: AttachmentPayload, text: str) -> str:
    label = "Код" if attachment.kind == "code" else "Документ"
    return (
        f"\n\n--- Вложение: {attachment.name} ({label}) ---\n"
        f"{text}\n"
        f"--- Конец вложения ---"
    )


def _prepare_attachments(
    attachments: list[AttachmentPayload],
) -> tuple[str, list[str]]:
    text_parts: list[str] = []
    image_urls: list[str] = []

    for attachment in attachments:
        if attachment.kind == "image":
            _decode_attachment_data(attachment)
            mime = (
                attachment.mime_type
                if attachment.mime_type.startswith("image/")
                else "image/jpeg"
            )
            image_urls.append(
                f"data:{mime};base64,{attachment.data}"
            )
            text_parts.append(
                f"\n\n[Пользователь приложил изображение: "
                f"{attachment.name}]"
            )
        elif attachment.kind == "pdf":
            data = _decode_attachment_data(attachment)
            extracted = _extract_pdf_text(data, attachment.name)
            text_parts.append(_attachment_block(attachment, extracted))
        else:
            text_parts.append(
                _attachment_block(
                    attachment, _attachment_text(attachment)
                )
            )

    return "".join(text_parts), image_urls


def _build_user_content(
    message: str,
    attachment_text: str,
    image_urls: list[str],
    supports_vision: bool,
) -> str | list[dict]:
    if attachment_text:
        text = (
            f"{message}\n\n"
            "Ниже — извлечённое содержимое приложенных файлов. "
            "Считай его частью запроса и используй для ответа. "
            "Не отвечай, что не можешь открыть вложения.\n"
            f"{attachment_text}"
        )
    else:
        text = message

    if not image_urls:
        return text

    if not supports_vision:
        return (
            f"{text}\n\n[Текущая модель не поддерживает просмотр изображений. "
            "Изображения прикреплены, но не проанализированы.]"
        )

    parts: list[dict] = [{"type": "text", "text": text}]
    for image_url in image_urls:
        parts.append(
            {"type": "image_url", "image_url": {"url": image_url}}
        )
    return parts


def _request_openai_compatible(
    *,
    provider: ProviderName,
    content: str | list[dict],
    model: str,
    mode: ResponseMode,
    language: Language,
    api_key: str,
    base_url: str,
    timeout: float,
    dev_mode: bool,
    default_headers: dict[str, str] | None = None,
) -> tuple[str, int]:
    label = PROVIDER_LABELS[provider]
    client = OpenAI(
        api_key=api_key,
        base_url=base_url,
        timeout=timeout,
        default_headers=default_headers,
    )
    max_tokens = DEV_MAX_TOKENS if dev_mode else MODE_MAX_TOKENS[mode]

    try:
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": _system_prompt(mode, language)},
                {"role": "user", "content": content},
            ],
            temperature=MODE_TEMPERATURE[mode],
            max_tokens=max_tokens,
        )
    except APITimeoutError as error:
        raise HTTPException(
            status_code=504,
            detail=f"{label} timed out. Try again or choose another model.",
        ) from error
    except APIConnectionError as error:
        raise HTTPException(
            status_code=502,
            detail=(
                f"{label} is unreachable. Check the network connection "
                "and try again."
            ),
        ) from error
    except APIStatusError as error:
        if error.status_code in {401, 403}:
            detail = (
                f"{label} rejected the API key. "
                "Check the provider key in backend/.env."
            )
        elif error.status_code == 404:
            detail = (
                f"{label} could not find the model '{model}'. "
                "Check the model name."
            )
        elif error.status_code == 429:
            detail = f"{label} rate limit reached. Wait a moment and try again."
        elif error.status_code >= 500:
            detail = f"{label} is temporarily unavailable. Try again in a moment."
        else:
            detail = (
                f"{label} returned HTTP {error.status_code} "
                "while generating the response."
            )

        raise HTTPException(status_code=502, detail=detail) from error

    if not completion.choices:
        raise HTTPException(
            status_code=502,
            detail=f"{label} returned an empty response.",
        )

    reply = completion.choices[0].message.content
    if not reply or not reply.strip():
        raise HTTPException(
            status_code=502,
            detail=f"{label} returned an empty response.",
        )

    usage = completion.usage
    total_tokens = getattr(usage, "total_tokens", None) if usage else None
    tokens_used = (
        int(total_tokens)
        if isinstance(total_tokens, int) and total_tokens > 0
        else _estimate_tokens(
            _system_prompt(mode, language), _content_text(content), reply
        )
    )

    return reply.strip(), tokens_used


def request_openrouter(
    content: str | list[dict],
    model: str,
    mode: ResponseMode,
    language: Language,
    dev_mode: bool,
) -> tuple[str, int]:
    api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail=(
                "OpenRouter is not configured. "
                "Set OPENROUTER_API_KEY in backend/.env."
            ),
        )

    return _request_openai_compatible(
        provider="openrouter",
        content=content,
        model=model,
        mode=mode,
        language=language,
        dev_mode=dev_mode,
        api_key=api_key,
        base_url=os.getenv(
            "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"
        ).rstrip("/"),
        timeout=_env_float("OPENROUTER_TIMEOUT_SECONDS", 60.0),
        default_headers={
            "HTTP-Referer": os.getenv(
                "OPENROUTER_HTTP_REFERER", "http://localhost:3000"
            ),
            "X-Title": os.getenv("OPENROUTER_APP_NAME", "KAEL"),
        },
    )


def request_groq(
    content: str,
    model: str,
    mode: ResponseMode,
    language: Language,
    dev_mode: bool,
) -> tuple[str, int]:
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail=(
                "Groq is not configured. "
                "Set GROQ_API_KEY in backend/.env."
            ),
        )

    return _request_openai_compatible(
        provider="groq",
        content=content,
        model=model,
        mode=mode,
        language=language,
        dev_mode=dev_mode,
        api_key=api_key,
        base_url=os.getenv(
            "GROQ_BASE_URL", "https://api.groq.com/openai/v1"
        ).rstrip("/"),
        timeout=_env_float("GROQ_TIMEOUT_SECONDS", 60.0),
    )


def request_ollama(
    content: str,
    model: str,
    mode: ResponseMode,
    language: Language,
    dev_mode: bool,
) -> tuple[str, int]:
    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip(
        "/"
    )
    if base_url.endswith("/v1"):
        base_url = base_url[:-3]

    timeout = _env_float("OLLAMA_TIMEOUT_SECONDS", 120.0)
    max_tokens = DEV_MAX_TOKENS if dev_mode else MODE_MAX_TOKENS[mode]
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": _system_prompt(mode, language)},
            {"role": "user", "content": content},
        ],
        "stream": False,
        "options": {
            "temperature": MODE_TEMPERATURE[mode],
            "num_predict": max_tokens,
        },
    }

    try:
        response = requests.post(
            f"{base_url}/api/chat",
            json=payload,
            timeout=timeout,
        )
    except requests.Timeout as error:
        raise HTTPException(
            status_code=504,
            detail=(
                "Ollama timed out. The local model may still be loading; "
                "try again."
            ),
        ) from error
    except requests.ConnectionError as error:
        raise HTTPException(
            status_code=502,
            detail=(
                f"Ollama is offline. Start Ollama at {base_url} "
                "and try again."
            ),
        ) from error
    except requests.RequestException as error:
        raise HTTPException(
            status_code=502,
            detail="Ollama request failed. Check the local server logs.",
        ) from error

    if response.status_code == 404:
        raise HTTPException(
            status_code=502,
            detail=(
                f"Ollama model '{model}' is not installed. "
                f"Run: ollama pull {model}"
            ),
        )

    if response.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail=(
                f"Ollama returned HTTP {response.status_code}. "
                "Check the local server logs."
            ),
        )

    try:
        response_data = response.json()
    except ValueError as error:
        raise HTTPException(
            status_code=502,
            detail="Ollama returned an invalid response.",
        ) from error

    message_data = (
        response_data.get("message") if isinstance(response_data, dict) else None
    )
    reply = (
        message_data.get("content") if isinstance(message_data, dict) else None
    )

    if not isinstance(reply, str) or not reply.strip():
        raise HTTPException(
            status_code=502,
            detail="Ollama returned an empty response.",
        )

    prompt_tokens = (
        response_data.get("prompt_eval_count")
        if isinstance(response_data, dict)
        else None
    )
    eval_tokens = (
        response_data.get("eval_count")
        if isinstance(response_data, dict)
        else None
    )
    reported_tokens = sum(
        value
        for value in (prompt_tokens, eval_tokens)
        if isinstance(value, int) and value > 0
    )
    tokens_used = (
        reported_tokens
        if reported_tokens > 0
        else _estimate_tokens(_system_prompt(mode, language), content, reply)
    )

    return reply.strip(), tokens_used


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    x_developer_secret: str | None = Header(
        default=None, alias="X-Developer-Secret"
    ),
) -> ChatResponse:
    message = request.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    if request.dev_mode and not (
        x_developer_secret
        and secrets.compare_digest(x_developer_secret, DEV_SECRET)
    ):
        raise HTTPException(
            status_code=403,
            detail="Developer access denied. Valid X-Developer-Secret required.",
        )

    if len(request.attachments) > MAX_ATTACHMENTS:
        raise HTTPException(
            status_code=400,
            detail=f"Too many attachments. Maximum is {MAX_ATTACHMENTS}.",
        )

    provider = request.provider or _provider_from_model(request.model)
    model = _resolve_model(provider, request.model)
    mode = request.mode
    started_at = time.perf_counter()

    if _is_creator_question(message):
        latency_ms = round((time.perf_counter() - started_at) * 1000)
        return ChatResponse(
            reply=CREATOR_ANSWER,
            provider=provider,
            model_used=model,
            mode=mode,
            latency_ms=latency_ms,
            tokens_used=0,
            dev_mode=request.dev_mode,
            attachments_used=len(request.attachments),
        )

    attachment_text, image_urls = _prepare_attachments(request.attachments)
    supports_vision = (
        provider == "openrouter" and model in VISION_MODELS
    )

    if provider == "openrouter":
        content = _build_user_content(
            message, attachment_text, image_urls, supports_vision
        )
        reply, tokens_used = request_openrouter(
            content, model, mode, request.language, request.dev_mode
        )
    else:
        text_content = _build_user_content(
            message, attachment_text, image_urls, False
        )
        if provider == "groq":
            reply, tokens_used = request_groq(
                text_content, model, mode, request.language, request.dev_mode
            )
        else:
            reply, tokens_used = request_ollama(
                text_content, model, mode, request.language, request.dev_mode
            )

    latency_ms = round((time.perf_counter() - started_at) * 1000)

    return ChatResponse(
        reply=reply,
        provider=provider,
        model_used=model,
        mode=mode,
        latency_ms=latency_ms,
        tokens_used=tokens_used,
        dev_mode=request.dev_mode,
        attachments_used=len(request.attachments),
    )
