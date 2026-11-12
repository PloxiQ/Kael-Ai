import os
import time
from typing import Literal

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import APIConnectionError as GroqAPIConnectionError
from groq import APIStatusError as GroqAPIStatusError
from groq import Groq
from openai import APIConnectionError as OpenAIAPIConnectionError
from openai import APIStatusError as OpenAIAPIStatusError
from openai import OpenAI
from pydantic import BaseModel, Field


load_dotenv()

KAEL_SYSTEM_PROMPT = """
Ты — KAEL, умный и прямолинейный AI-помощник.

Твой характер: уверенный, немного дерзкий и слегка саркастичный, но всегда полезный
и уважительный. Объясняй сложные вещи простыми словами, без корпоративной воды и
театральных обещаний. Говори кратко, если вопрос простой, и структурированно, если
задача сложная. Не выдумывай факты: если данных не хватает, прямо скажи, чего именно
не хватает. Сарказм используй легко и по делу — не оскорбляй пользователя и не
позволяй стилю скрывать важные технические ограничения.
""".strip()

ProviderName = Literal["groq", "openrouter", "ollama"]


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=12_000)
    provider: ProviderName = "openrouter"


class ChatResponse(BaseModel):
    reply: str
    provider: ProviderName
    model_used: str
    latency_ms: int


app = FastAPI(title="KAEL API", description="Universal FastAPI backend for KAEL.", version="0.4.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_credentials=False, allow_methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type", "Authorization"])


def request_groq(message: str) -> tuple[str, str]:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Groq is not configured. Set GROQ_API_KEY in backend/.env.")
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    client = Groq(api_key=api_key, timeout=float(os.getenv("GROQ_TIMEOUT_SECONDS", "60")))
    try:
        completion = client.chat.completions.create(model=model, messages=[{"role": "system", "content": KAEL_SYSTEM_PROMPT}, {"role": "user", "content": message}], temperature=0.7, max_tokens=1_024)
    except GroqAPIConnectionError as error:
        raise HTTPException(status_code=502, detail="Groq is unreachable. Check the network connection and try again.") from error
    except GroqAPIStatusError as error:
        if error.status_code in {401, 403}: detail = "Groq rejected the API key. Check GROQ_API_KEY in backend/.env."
        elif error.status_code == 429: detail = "Groq rate limit reached. Wait a moment and try again."
        else: detail = "Groq returned an error while generating the response."
        raise HTTPException(status_code=502, detail=detail) from error
    reply = completion.choices[0].message.content
    if not reply: raise HTTPException(status_code=502, detail="Groq returned an empty response.")
    return reply.strip(), model


def request_openrouter(message: str) -> tuple[str, str]:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="OpenRouter is not configured. Set OPENROUTER_API_KEY in backend/.env.")
    model = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")
    client = OpenAI(api_key=api_key, base_url=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"), default_headers={"HTTP-Referer": os.getenv("OPENROUTER_HTTP_REFERER", "http://localhost:3000"), "X-Title": os.getenv("OPENROUTER_APP_NAME", "KAEL")}, timeout=float(os.getenv("OPENROUTER_TIMEOUT_SECONDS", "60")))
    try:
        completion = client.chat.completions.create(model=model, messages=[{"role": "system", "content": KAEL_SYSTEM_PROMPT}, {"role": "user", "content": message}], temperature=0.7, max_tokens=1_024)
    except OpenAIAPIConnectionError as error:
        raise HTTPException(status_code=502, detail="OpenRouter is unreachable. Check the network connection and try again.") from error
    except OpenAIAPIStatusError as error:
        if error.status_code in {401, 403}: detail = "OpenRouter rejected the API key. Check OPENROUTER_API_KEY in backend/.env."
        elif error.status_code == 429: detail = "OpenRouter rate limit reached. Wait a moment and try again."
        else: detail = "OpenRouter returned an error while generating the response."
        raise HTTPException(status_code=502, detail=detail) from error
    reply = completion.choices[0].message.content
    if not reply: raise HTTPException(status_code=502, detail="OpenRouter returned an empty response.")
    return reply.strip(), model


def request_ollama(message: str) -> tuple[str, str]:
    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
    model = os.getenv("OLLAMA_MODEL", "llama3.2")
    payload = {"model": model, "system": KAEL_SYSTEM_PROMPT, "prompt": message, "stream": False}
    try:
        response = requests.post(f"{base_url}/api/generate", json=payload, timeout=float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "120")))
    except requests.Timeout as error:
        raise HTTPException(status_code=504, detail="Ollama timed out. Check the local model and try again.") from error
    except requests.RequestException as error:
        raise HTTPException(status_code=502, detail="Ollama is unreachable. Start Ollama or use another provider.") from error
    if response.status_code == 404: raise HTTPException(status_code=502, detail="Ollama model was not found. Run 'ollama pull OLLAMA_MODEL' first.")
    if response.status_code >= 400: raise HTTPException(status_code=502, detail="Ollama returned an error while generating the response.")
    try: response_data = response.json()
    except ValueError as error: raise HTTPException(status_code=502, detail="Ollama returned an invalid response.") from error
    reply = response_data.get("response")
    if not reply: raise HTTPException(status_code=502, detail="Ollama returned an empty response.")
    return reply.strip(), model


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    message = request.message.strip()
    if not message: raise HTTPException(status_code=400, detail="Message cannot be empty.")
    started_at = time.perf_counter()
    if request.provider == "groq": reply, model_used = request_groq(message)
    elif request.provider == "openrouter": reply, model_used = request_openrouter(message)
    else: reply, model_used = request_ollama(message)
    latency_ms = round((time.perf_counter() - started_at) * 1000)
    return ChatResponse(reply=reply, provider=request.provider, model_used=model_used, latency_ms=latency_ms)
