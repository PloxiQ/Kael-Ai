/**
 * Bridge between Clerk (React context) and non-React fetch helpers.
 *
 * `KaelAuthProvider` registers the Clerk `getToken` callback while a session is
 * active. `authFetch` can then request a short-lived JWT without importing
 * Clerk or React.
 */

export type AuthTokenOptions = {
  skipCache?: boolean;
};

export type AuthTokenGetter = (
  options?: AuthTokenOptions,
) => Promise<string | null>;

export type AuthUnauthorizedHandler = () => void;

let tokenGetter: AuthTokenGetter | null = null;
let unauthorizedHandler: AuthUnauthorizedHandler | null = null;

export function registerAuthTokenGetter(getter: AuthTokenGetter | null): void {
  tokenGetter = getter;
}

export function registerAuthUnauthorizedHandler(
  handler: AuthUnauthorizedHandler | null,
): void {
  unauthorizedHandler = handler;
}

export function getAuthToken(
  options: AuthTokenOptions = {},
): Promise<string | null> {
  if (!tokenGetter) {
    return Promise.resolve(null);
  }

  return tokenGetter(options);
}

export function notifyAuthUnauthorized(): void {
  unauthorizedHandler?.();
}
