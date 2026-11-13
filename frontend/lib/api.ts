/** Fetch helpers for the KAEL FastAPI backend and Telegram session token. */

export const TOKEN_STORAGE_KEY = "kael_token";

export function apiUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_KAEL_API_URL ?? "").replace(
    /\/+$/,
    "",
  );
  if (!base) {
    throw new Error("NEXT_PUBLIC_KAEL_API_URL is not configured.");
  }
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** fetch with the Bearer token issued after Telegram initData verification. */
export async function authFetch(path: string, init: RequestInit = {}) {
  let token: string | null = null;
  try {
    token = localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    token = null;
  }

  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  // The 7-day session expired or the secret changed. Drop the stale token so
  // the provider can log in again with fresh initData after the reload.
  if (response.status === 401) {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // Storage can be unavailable in private mode; the reload still recovers.
    }
    window.location.reload();
  }

  return response;
}
