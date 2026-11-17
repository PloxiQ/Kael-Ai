/** Fetch helpers for the KAEL FastAPI backend and Clerk session tokens. */

import {
  getAuthToken,
  notifyAuthUnauthorized,
} from "./authToken";

export type KaelRole = "admin" | "tester" | "user";

/** Backend reachability shown in the header and sidebar. */
export type ApiStatus = "checking" | "online" | "offline";

export type MeResponse = {
  id: string;
  role: KaelRole;
  email: string | null;
  name: string | null;
  dev_access: boolean;
};

/** Provider availability, so the client can avoid a model with a missing key. */
export type ProvidersResponse = {
  openrouter: boolean;
  groq: boolean;
  ollama: boolean;
  zerocat: boolean;
  gemini: boolean;
};

export type AuthFetchOptions = {
  /** Use an already fetched token instead of the registered getter. */
  token?: string | null;
};

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

export function isMeResponse(value: unknown): value is MeResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<MeResponse>;

  return (
    typeof candidate.id === "string" &&
    (candidate.role === "admin" ||
      candidate.role === "tester" ||
      candidate.role === "user") &&
    (candidate.email === null || typeof candidate.email === "string") &&
    (candidate.name === null || typeof candidate.name === "string") &&
    typeof candidate.dev_access === "boolean"
  );
}

export function isProvidersResponse(
  value: unknown,
): value is ProvidersResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<ProvidersResponse>;

  return (
    typeof candidate.openrouter === "boolean" &&
    typeof candidate.groq === "boolean" &&
    typeof candidate.ollama === "boolean" &&
    typeof candidate.zerocat === "boolean" &&
    typeof candidate.gemini === "boolean"
  );
}

function buildHeaders(init: RequestInit, token: string | null): Headers {
  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type")) {
    const isFormData =
      typeof FormData !== "undefined" && init.body instanceof FormData;
    if (!isFormData) {
      headers.set("Content-Type", "application/json");
    }
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

/**
 * fetch with a Clerk session token. On the first 401 the token cache is
 * bypassed once, then the registered handler signs the stale session out.
 */
export async function authFetch(
  path: string,
  init: RequestInit = {},
  options: AuthFetchOptions = {},
): Promise<Response> {
  const send = (token: string | null) =>
    fetch(apiUrl(path), {
      ...init,
      headers: buildHeaders(init, token),
    });

  const usesExplicitToken = options.token !== undefined;
  let token = usesExplicitToken
    ? options.token ?? null
    : await getAuthToken();

  let response = await send(token);

  if (response.status === 401 && !usesExplicitToken) {
    const freshToken = await getAuthToken({ skipCache: true });
    if (freshToken && freshToken !== token) {
      token = freshToken;
      response = await send(token);
    }
  }

  if (response.status === 401 && !usesExplicitToken) {
    notifyAuthUnauthorized();
  }

  return response;
}
