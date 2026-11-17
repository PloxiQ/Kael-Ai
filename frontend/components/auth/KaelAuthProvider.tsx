"use client";

import {
  ClerkProvider,
  SignIn,
  useAuth,
  type ClerkProviderProps,
} from "@clerk/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  authFetch,
  isMeResponse,
  type KaelRole,
  type MeResponse,
} from "../../lib/api";
import {
  registerAuthTokenGetter,
  registerAuthUnauthorizedHandler,
} from "../../lib/authToken";
import { CLERK_SIGN_IN_LOCALIZATION } from "../../lib/clerkLocalization";
import { useI18n } from "../../lib/i18n";
import { KaelTour } from "../KaelTour";
import LegalLinks from "../legal/LegalLinks";

/** Must match the JWT template name in the Clerk Dashboard. */
export const CLERK_JWT_TEMPLATE = "kael";

const PUBLISHABLE_KEY = (
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ""
).trim();

/** Public pages that render without a Clerk session. */
const PUBLIC_ROUTES = new Set(["/privacy", "/terms", "/security"]);

/** Every route the app actually serves. Anything else is Next's 404 page. */
const APP_ROUTES = new Set(["/", ...PUBLIC_ROUTES]);

const CLERK_APPEARANCE: NonNullable<ClerkProviderProps["appearance"]> = {
  variables: {
    colorPrimary: "var(--kael-accent)",
    colorPrimaryForeground: "var(--kael-accent-ink)",
    colorBackground: "var(--kael-bg)",
    colorForeground: "var(--kael-text)",
    colorMutedForeground: "var(--kael-muted)",
    colorMuted: "var(--kael-surface)",
    colorInput: "var(--kael-raised)",
    colorInputForeground: "var(--kael-text)",
    colorBorder: "var(--kael-border)",
    colorRing: "var(--kael-accent)",
    colorShadow: "var(--kael-card-shadow)",
    colorDanger: "var(--kael-danger)",
    fontFamily: "var(--font-interface-active), 'Segoe UI', sans-serif",
    fontFamilyButtons: "var(--font-interface-active), 'Segoe UI', sans-serif",
    borderRadius: "10px",
  },
  elements: {
    socialButtons: "hidden",
    dividerRow: "hidden",
    rootBox: "w-full flex justify-center",
    cardBox: "w-full max-w-[400px]",
    card: "border border-[#262626] shadow-none rounded-xl bg-[#161616]",
    headerTitle: "text-[#F5F5F0]",
    headerSubtitle: "text-[#8E8E8A]",
    socialButtonsBlockButton:
      "border-[#262626] bg-[#161616] text-[#F5F5F0] hover:bg-[#1C1C1C]",
    formButtonPrimary:
      "bg-[#10B981] text-[#052E1C] hover:bg-[#34D399] normal-case",
    formFieldInput:
      "bg-[#1C1C1C] text-[#F5F5F0] placeholder:text-[#8E8E8A] ring-1 ring-inset ring-[#262626]",
    formFieldLabel: "text-[#F5F5F0]",
    footerActionLink: "text-[#10B981] hover:text-[#34D399]",
    footerActionText: "text-[#8E8E8A]",
    dividerLine: "bg-[#262626]",
    dividerText: "text-[#8E8E8A]",
    identityPreviewText: "text-[#F5F5F0]",
    identityPreviewEditButton: "text-[#10B981]",
    formResendCodeLink: "text-[#10B981]",
    otpCodeFieldInput:
      "bg-[#1C1C1C] text-[#F5F5F0] ring-1 ring-inset ring-[#262626]",
    alert: "border-[#262626] bg-[#161616]",
    alertText: "text-[#F5F5F0]",
  },
};

type IdentityStatus = "loading" | "ready" | "error";

type KaelAuthContextValue = {
  me: MeResponse | null;
  role: KaelRole;
  isAdmin: boolean;
  refresh: () => Promise<void>;
};

const KaelAuthContext = createContext<KaelAuthContextValue>({
  me: null,
  role: "user",
  isAdmin: false,
  refresh: () => Promise.resolve(),
});

export function useKaelAuth(): KaelAuthContextValue {
  return useContext(KaelAuthContext);
}

function Wordmark() {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#262626] bg-[#161616] text-sm font-semibold text-[#10B981]">
        K
      </span>
      <span className="kael-display text-lg font-semibold tracking-[0.24em] text-[#F5F5F0]">
        KAEL
      </span>
    </div>
  );
}

function LoadingScreen() {
  const { t } = useI18n();
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 6_000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#0A0A0A] px-6">
      <div className="w-full max-w-sm text-center" role="status" aria-live="polite">
        <Wordmark />
        <p className="mt-8 text-sm text-[#8E8E8A]">{t("auth.loading")}</p>
        <div className="mx-auto mt-4 h-px w-40 overflow-hidden bg-[#262626]">
          <div className="h-full w-1/2 animate-[kael-bar_1.4s_ease-in-out_infinite] bg-[#10B981]" />
        </div>
        {slow && (
          <p className="mt-4 text-xs leading-5 text-[#8E8E8A]">
            {t("auth.slow")}
          </p>
        )}
      </div>
    </main>
  );
}

function SignInScreen() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#0A0A0A] px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Wordmark />
        </div>
        <SignIn routing="hash" />
        <LegalLinks className="mt-6 justify-center" />
      </div>
    </main>
  );
}

function SetupScreen() {
  const { t } = useI18n();

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#0A0A0A] px-6">
      <div className="w-full max-w-md rounded-xl border border-[#262626] bg-[#161616] p-6">
        <Wordmark />
        <h1 className="mt-8 text-lg font-semibold text-[#F5F5F0]">
          {t("auth.configMissing")}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#8E8E8A]">
          {t("auth.configHint")}
        </p>
        <code className="mt-4 block overflow-x-auto rounded-lg border border-[#262626] bg-[#0A0A0A] px-3 py-2 text-xs text-[#10B981]">
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_…
        </code>
      </div>
    </main>
  );
}

function SessionErrorScreen({
  message,
  onRetry,
  onSignOut,
}: {
  message: string;
  onRetry: () => void;
  onSignOut: () => void;
}) {
  const { t } = useI18n();

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#0A0A0A] px-6">
      <div
        className="w-full max-w-md rounded-xl border border-[#262626] bg-[#161616] p-6"
        role="alert"
      >
        <Wordmark />
        <h1 className="mt-8 text-lg font-semibold text-[#F5F5F0]">
          {t("auth.sessionError")}
        </h1>
        <p className="mt-2 break-words text-sm leading-6 text-[#8E8E8A]">
          {message}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#10B981] px-4 text-sm font-semibold text-[#052E1C] transition hover:bg-[#34D399] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/50"
          >
            {t("auth.retry")}
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[#262626] px-4 text-sm font-medium text-[#F5F5F0] transition hover:border-[#3A3A3A] hover:bg-[#1C1C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/40"
          >
            {t("auth.signOut")}
          </button>
        </div>
      </div>
    </main>
  );
}

function ErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "Unknown authentication error.";
}

function SignedInGate({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
  const [status, setStatus] = useState<IdentityStatus>("loading");
  const [me, setMe] = useState<MeResponse | null>(null);
  const [message, setMessage] = useState("");

  const loadIdentity = useCallback(
    async (skipCache = false) => {
      setStatus("loading");
      setMessage("");

      try {
        const token = await getToken({
          template: CLERK_JWT_TEMPLATE,
          skipCache,
        });

        if (!token) {
          throw new Error(t("auth.sessionError"));
        }

        const response = await authFetch(
          "/api/me",
          { method: "GET" },
          { token },
        );

        if (!response.ok) {
          const body: unknown = await response.json().catch(() => null);
          const detail =
            typeof body === "object" &&
            body !== null &&
            "detail" in body &&
            typeof body.detail === "string"
              ? body.detail
              : `HTTP ${response.status}`;
          throw new Error(detail);
        }

        const identity: unknown = await response.json();

        if (!isMeResponse(identity)) {
          throw new Error("Unexpected /api/me response.");
        }

        setMe(identity);
        setStatus("ready");
      } catch (error) {
        setMessage(ErrorMessage(error));
        setStatus("error");
      }
    },
    [getToken, t],
  );

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    void loadIdentity(true);
  }, [isLoaded, isSignedIn, loadIdentity]);

  useEffect(() => {
    if (!isSignedIn) {
      registerAuthTokenGetter(null);
      return undefined;
    }

    registerAuthTokenGetter((options) =>
      getToken({
        template: CLERK_JWT_TEMPLATE,
        skipCache: options?.skipCache,
      }),
    );

    return () => registerAuthTokenGetter(null);
  }, [getToken, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) {
      registerAuthUnauthorizedHandler(null);
      return undefined;
    }

    registerAuthUnauthorizedHandler(() => {
      void signOut();
    });

    return () => registerAuthUnauthorizedHandler(null);
  }, [isSignedIn, signOut]);

  const contextValue = useMemo<KaelAuthContextValue>(
    () => ({
      me,
      role: me?.role ?? "user",
      isAdmin: me?.role === "admin",
      refresh: () => loadIdentity(true),
    }),
    [loadIdentity, me],
  );

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  if (!isSignedIn) {
    return <SignInScreen />;
  }

  if (status === "error") {
    return (
      <SessionErrorScreen
        message={message}
        onRetry={() => void loadIdentity(true)}
        onSignOut={() => void signOut()}
      />
    );
  }

  if (status !== "ready" || !me) {
    return <LoadingScreen />;
  }

  return (
    <KaelAuthContext.Provider value={contextValue}>
      {children}
      <KaelTour />
    </KaelAuthContext.Provider>
  );
}

export function KaelAuthProvider({ children }: { children: ReactNode }) {
  const { language } = useI18n();
  const pathname = usePathname();
  const normalizedPath = (pathname ?? "/").replace(/\/+$/, "") || "/";

  // Legal pages are public: they must stay readable without a Clerk session and
  // must not expose account state.
  if (PUBLIC_ROUTES.has(normalizedPath)) {
    return <>{children}</>;
  }

  // Unknown paths must reach Next's not-found boundary instead of the sign-in
  // gate, otherwise a 404 looks like a login prompt.
  if (!APP_ROUTES.has(normalizedPath)) {
    return <>{children}</>;
  }

  if (!PUBLISHABLE_KEY.startsWith("pk_")) {
    return <SetupScreen />;
  }

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      appearance={CLERK_APPEARANCE}
      localization={CLERK_SIGN_IN_LOCALIZATION[language]}
    >
      <SignedInGate>{children}</SignedInGate>
    </ClerkProvider>
  );
}
