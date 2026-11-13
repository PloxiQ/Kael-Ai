"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { TOKEN_STORAGE_KEY } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { KaelMascot } from "./KaelMascot";
import { KaelTour } from "./KaelTour";

export type TgUser = {
  id: number;
  first_name: string;
  username?: string | null;
  photo_url?: string | null;
};

type Status = "loading" | "authenticated" | "blocked" | "denied" | "error";
type AuthCtx = { user: TgUser | null; token: string | null };

const AuthContext = createContext<AuthCtx>({ user: null, token: null });
export const useTelegramAuth = () => useContext(AuthContext);

const API = (process.env.NEXT_PUBLIC_KAEL_API_URL ?? "").replace(/\/+$/, "");
const BOT_USERNAME = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "")
  .replace(/^@/, "")
  .trim();
const BOT_URL = BOT_USERNAME ? `https://t.me/${BOT_USERNAME}` : null;

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function waitForTelegram(): Promise<TelegramWebApp | null> {
  const immediate = window.Telegram?.WebApp;
  if (immediate) {
    return immediate;
  }

  // The Telegram script is loaded with next/script beforeInteractive, but a
  // slow network can still delay it. Poll briefly instead of flashing the lock
  // screen at a real Mini App user.
  for (let attempt = 0; attempt < 12; attempt += 1) {
    await sleep(150);
    const webApp = window.Telegram?.WebApp;
    if (webApp) {
      return webApp;
    }
  }
  return null;
}

function telegramUserId(initData: string): number | null {
  try {
    const rawUser = new URLSearchParams(initData).get("user");
    if (!rawUser) {
      return null;
    }
    const parsed = JSON.parse(rawUser) as { id?: unknown };
    return typeof parsed.id === "number" ? parsed.id : null;
  } catch {
    return null;
  }
}

/**
 * Reuse a still-valid 7-day token only when it belongs to the same Telegram
 * account that opened the Mini App. This avoids a Render cold start on every
 * open without letting one account inherit another account's session.
 */
function readStoredSession(expectedUserId: number): AuthCtx | null {
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      return null;
    }

    const [payloadPart] = token.split(".");
    if (!payloadPart) {
      return null;
    }

    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as {
      id?: unknown;
      exp?: unknown;
      first_name?: unknown;
      username?: unknown;
      photo_url?: unknown;
    };

    if (typeof payload.id !== "number" || payload.id !== expectedUserId) {
      return null;
    }
    if (
      typeof payload.exp !== "number" ||
      payload.exp < Math.floor(Date.now() / 1000) + 30
    ) {
      return null;
    }

    return {
      token,
      user: {
        id: payload.id,
        first_name:
          typeof payload.first_name === "string" ? payload.first_name : "",
        username:
          typeof payload.username === "string" ? payload.username : null,
        photo_url:
          typeof payload.photo_url === "string" ? payload.photo_url : null,
      },
    };
  } catch {
    return null;
  }
}

export function TelegramAuthProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [status, setStatus] = useState<Status>("loading");
  const [slow, setSlow] = useState(false);
  const [auth, setAuth] = useState<AuthCtx>({ user: null, token: null });
  const [message, setMessage] = useState("");
  const inFlightRef = useRef(false);
  const startedRef = useRef(false);

  const login = useCallback(async () => {
    if (inFlightRef.current) {
      return;
    }
    inFlightRef.current = true;

    try {
      const webApp = await waitForTelegram();
      if (!webApp || !webApp.initData) {
        setStatus("blocked");
        return;
      }

      try {
        webApp.ready();
        webApp.expand();
        webApp.setHeaderColor?.("#07070a");
        webApp.setBackgroundColor?.("#07070a");
        webApp.setBottomBarColor?.("#07070a");
      } catch {
        // Older Telegram clients do not support every method.
      }

      const expectedUserId = telegramUserId(webApp.initData);
      if (expectedUserId !== null) {
        const stored = readStoredSession(expectedUserId);
        if (stored) {
          setAuth(stored);
          setStatus("authenticated");
          return;
        }
      }

      setStatus("loading");

      if (!API) {
        setMessage("NEXT_PUBLIC_KAEL_API_URL is not configured.");
        setStatus("error");
        return;
      }

      const slowTimer = window.setTimeout(() => setSlow(true), 6000);
      const controller = new AbortController();
      const abortTimer = window.setTimeout(() => controller.abort(), 70000);

      try {
        const response = await fetch(`${API}/auth/telegram-webapp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData: webApp.initData }),
          signal: controller.signal,
        });

        if (response.status === 403) {
          const body = await response.json().catch(() => ({}));
          setMessage(body.detail || t("auth.betaClosed"));
          setStatus("denied");
          return;
        }

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.detail || `HTTP ${response.status}`);
        }

        const data: { token: string; user: TgUser } = await response.json();
        try {
          localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        } catch {
          // Private mode can block storage; the in-memory session still works.
        }

        setAuth({ token: data.token, user: data.user });
        setStatus("authenticated");
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          setMessage(t("auth.connectError"));
        } else {
          setMessage(
            error instanceof Error && error.message
              ? error.message
              : t("auth.connectError"),
          );
        }
        setStatus("error");
      } finally {
        window.clearTimeout(slowTimer);
        window.clearTimeout(abortTimer);
        setSlow(false);
      }
    } finally {
      inFlightRef.current = false;
    }
  }, [t]);

  useEffect(() => {
    // Run once on mount. `login` changes with the language, but re-running it
    // would only repeat the same Telegram handshake.
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;
    void login();
  }, [login]);

  if (status === "authenticated") {
    return (
      <AuthContext.Provider value={auth}>
        {children}
        <KaelTour />
      </AuthContext.Provider>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-[#050507] p-6">
      <div className="kael-grid-bg absolute inset-0" />
      <div className="kael-scan pointer-events-none absolute inset-x-0 top-0" />
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#f5576c]/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#f093fb]/20 blur-[120px]" />

      <div
        className="kael-card w-full max-w-sm p-8 text-center"
        role="status"
        aria-live="polite"
      >
        <div className="mb-3 flex justify-center">
          <KaelMascot
            size={104}
            look={status === "blocked" ? "down" : "center"}
            mood={
              status === "blocked" || status === "loading" ? "happy" : "idle"
            }
          />
        </div>

        <h1 className="kael-title mb-6 text-4xl font-bold">KAEL AI</h1>

        {status === "loading" && (
          <>
            <p className="mb-4 text-zinc-300">{t("auth.loading")}</p>
            <div className="kael-bar-track">
              <div className="kael-bar" />
            </div>
            {slow && (
              <p className="mt-3 text-xs text-zinc-500">{t("auth.slow")}</p>
            )}
          </>
        )}

        {status === "blocked" && (
          <>
            <p className="mb-4 text-lg leading-snug text-zinc-200">
              {t("auth.telegramOnly")}
            </p>

            {BOT_URL ? (
              <>
                <div className="kael-bounce mb-2 text-xl text-[#f7a6ba] drop-shadow-[0_0_8px_#f5576c]">
                  ▼
                </div>
                <a href={BOT_URL} className="kael-btn kael-btn-pulse">
                  {t("auth.openTelegram")}
                </a>
                <p className="mt-4 text-xs leading-relaxed text-zinc-500">
                  {t("auth.openHint")}
                </p>
              </>
            ) : (
              <p className="mb-4 text-sm text-zinc-500">
                {t("auth.botHint")}
              </p>
            )}

            <button
              type="button"
              onClick={() => void login()}
              className="kael-btn-ghost mt-4"
            >
              {t("auth.checkAgain")}
            </button>
          </>
        )}

        {status === "denied" && (
          <>
            <p className="text-lg leading-snug text-zinc-200">{message}</p>
            <button
              type="button"
              onClick={() => void login()}
              className="kael-btn-ghost mt-5"
            >
              {t("auth.checkAgain")}
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <p className="mb-6 text-zinc-300">{message}</p>
            <button
              type="button"
              onClick={() => void login()}
              className="kael-btn"
            >
              {t("auth.retry")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
