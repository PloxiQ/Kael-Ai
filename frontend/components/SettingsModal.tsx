"use client";

import { useClerk, useUser } from "@clerk/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AudioLines,
  Check,
  ChevronRight,
  Compass,
  CreditCard,
  Info,
  Loader2,
  LogOut,
  Monitor,
  Moon,
  Plug,
  Puzzle,
  RefreshCw,
  RotateCcw,
  Save,
  ScrollText,
  Settings2,
  Sparkles,
  Sun,
  Trash2,
  Type,
  UserRound,
  Volume2,
  X,
} from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useKaelAuth } from "./auth/KaelAuthProvider";
import LegalLinks from "./legal/LegalLinks";
import McpServersSection from "./settings/McpServersSection";
import type { KaelRole, ProvidersResponse } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { MODEL_GROUPS, type ProviderId } from "../lib/models";
import {
  MAX_CUSTOM_INSTRUCTIONS,
  MAX_PREFERRED_NAME,
  type DisplayFontId,
  type InterfaceFontId,
  type KaelPreferences,
  type ResponseStyle,
  type ThemeId,
} from "../lib/preferences";
import { KAEL_SKILLS } from "../lib/skills";
import { playSfx } from "../lib/sfx";
import { KAEL_VERSION_LABEL } from "../lib/version";
import {
  formatNumber,
  getTier,
  isUnlimitedTier,
  remainingTokens,
  tierForRole,
  type UsageState,
} from "../lib/tiers";
import {
  LANGUAGES,
  MODEL_GROUP_HINT_KEYS,
  TIER_TRANSLATION_KEYS,
  type TranslationKey,
} from "../lib/translations";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type SettingsSectionId =
  | "account"
  | "client"
  | "extensions"
  | "personalization"
  | "other";

type SectionId = SettingsSectionId;

type Section = {
  id: SectionId;
  label: TranslationKey;
  hint: TranslationKey;
  icon: typeof UserRound;
};

const SECTIONS: readonly Section[] = [
  {
    id: "account",
    label: "settings.section.account",
    hint: "settings.section.accountHint",
    icon: UserRound,
  },
  {
    id: "client",
    label: "settings.section.client",
    hint: "settings.section.clientHint",
    icon: Monitor,
  },
  {
    id: "extensions",
    label: "settings.section.extensions",
    hint: "settings.section.extensionsHint",
    icon: Puzzle,
  },
  {
    id: "personalization",
    label: "settings.section.personalization",
    hint: "settings.section.personalizationHint",
    icon: Sparkles,
  },
  {
    id: "other",
    label: "settings.section.other",
    hint: "settings.section.otherHint",
    icon: Settings2,
  },
];

const ROLE_KEYS: Record<KaelRole, TranslationKey> = {
  admin: "auth.role.admin",
  tester: "auth.role.tester",
  user: "auth.role.user",
};

const STYLE_KEYS: Record<ResponseStyle, TranslationKey> = {
  default: "settings.personalization.style.default",
  concise: "settings.personalization.style.concise",
  detailed: "settings.personalization.style.detailed",
  friendly: "settings.personalization.style.friendly",
  direct: "settings.personalization.style.direct",
};

const THEME_OPTIONS: ReadonlyArray<{
  id: ThemeId;
  labelKey: TranslationKey;
  hintKey: TranslationKey;
  icon: typeof Moon;
}> = [
  {
    id: "dark",
    labelKey: "settings.client.theme.dark",
    hintKey: "settings.client.theme.darkHint",
    icon: Moon,
  },
  {
    id: "light",
    labelKey: "settings.client.theme.light",
    hintKey: "settings.client.theme.lightHint",
    icon: Sun,
  },
];

const INTERFACE_FONT_OPTIONS: ReadonlyArray<{
  id: InterfaceFontId;
  labelKey: TranslationKey;
  family: string;
}> = [
  {
    id: "manrope",
    labelKey: "settings.client.font.manrope",
    family: "var(--font-manrope)",
  },
  {
    id: "inter",
    labelKey: "settings.client.font.inter",
    family: "var(--font-inter)",
  },
  {
    id: "onest",
    labelKey: "settings.client.font.onest",
    family: "var(--font-onest)",
  },
  {
    id: "system",
    labelKey: "settings.client.font.system",
    family: '"Segoe UI", system-ui, sans-serif',
  },
];

const DISPLAY_FONT_OPTIONS: ReadonlyArray<{
  id: DisplayFontId;
  labelKey: TranslationKey;
  family: string;
}> = [
  {
    id: "unbounded",
    labelKey: "settings.client.font.unbounded",
    family: "var(--font-unbounded)",
  },
  {
    id: "onest",
    labelKey: "settings.client.font.onest",
    family: "var(--font-onest)",
  },
  {
    id: "manrope",
    labelKey: "settings.client.font.manrope",
    family: "var(--font-manrope)",
  },
  {
    id: "system",
    labelKey: "settings.client.font.system",
    family: '"Segoe UI", system-ui, sans-serif',
  },
];

const CONNECTOR_ORDER: readonly ProviderId[] = [
  "openrouter",
  "groq",
  "ollama",
  "zerocat",
  "gemini",
];

const CONNECTOR_HINT_KEYS: Record<ProviderId, TranslationKey> = {
  openrouter: "settings.extensions.connector.openrouterHint",
  groq: "settings.extensions.connector.groqHint",
  ollama: "settings.extensions.connector.ollamaHint",
  zerocat: "settings.extensions.connector.zerocatHint",
  gemini: "settings.extensions.connector.geminiHint",
};

const INPUT_CLASS =
  "h-10 w-full rounded-lg border border-[#262626] bg-[#161616] px-3 text-sm text-[#F5F5F0] outline-none transition placeholder:text-[#8E8E8A]/70 focus:border-[#10B981]/60 focus:ring-2 focus:ring-[#10B981]/20 disabled:cursor-not-allowed disabled:opacity-50";

const PRIMARY_BUTTON_CLASS =
  "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#10B981] px-4 text-sm font-semibold text-[#052E1C] transition hover:brightness-110 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/50 disabled:cursor-not-allowed disabled:bg-[#1C1C1C] disabled:text-zinc-600";

const SECONDARY_BUTTON_CLASS =
  "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#262626] px-4 text-sm font-medium text-[#F5F5F0] transition hover:border-[#3A3A3A] hover:bg-[#1C1C1C] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/40 disabled:cursor-not-allowed disabled:opacity-50";

const DANGER_BUTTON_CLASS =
  "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-red-900/50 bg-red-950/20 px-4 text-sm font-medium text-red-200 transition hover:border-red-800 hover:bg-red-950/35 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30";

type NameState = "idle" | "saving" | "saved" | "error";
type ConfirmState = "history" | "reset" | null;

export type SettingsModalProps = {
  open: boolean;
  openSection?: SettingsSectionId;
  preferences: KaelPreferences;
  usage: UsageState;
  sfxOn: boolean;
  ambientOn: boolean;
  sessionCount: number;
  messageCount: number;
  providers: ProvidersResponse | null;
  providersLoading: boolean;
  modelId: string;
  onRefreshProviders: () => void;
  onSelectModel: (modelId: string) => void;
  onClose: () => void;
  onChangePreferences: (patch: Partial<KaelPreferences>) => void;
  onSfxChange: (enabled: boolean) => void;
  onAmbientChange: (enabled: boolean) => void;
  onClearHistory: () => void;
  onResetPreferences: () => void;
  onRestartTour: () => void;
  onOpenTiers: () => void;
  onOpenChangelog: () => void;
};

function SectionHeading({
  title,
  hint,
}: {
  title: string;
  hint: string;
}) {
  return (
    <div className="mb-5">
      <h3 className="kael-display text-lg font-semibold tracking-[-0.01em] text-[#F5F5F0]">
        {title}
      </h3>
      <p className="mt-1 text-sm text-[#8E8E8A]">{hint}</p>
    </div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="divide-y divide-[#262626] overflow-hidden rounded-xl border border-[#262626] bg-[#0A0A0A]">
      {children}
    </div>
  );
}

function SettingRow({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#F5F5F0]">{title}</p>
        {hint && (
          <p className="mt-1 max-w-md text-xs leading-5 text-[#8E8E8A]">
            {hint}
          </p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  label,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        onChange(!checked);
        playSfx("toggle");
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/40 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked
          ? "border-[#10B981]/60 bg-[#10B981]/85"
          : "border-[#3A3A3A] bg-[#1C1C1C]"
      }`}
    >
      <span
        aria-hidden="true"
        className={`block h-4 w-4 rounded-full transition-transform ${
          checked
            ? "translate-x-[22px] bg-[#052E1C]"
            : "translate-x-1 bg-[#8E8E8A]"
        }`}
      />
    </button>
  );
}

export default function SettingsModal({
  open,
  openSection,
  preferences,
  usage,
  sfxOn,
  ambientOn,
  sessionCount,
  messageCount,
  providers,
  providersLoading,
  modelId,
  onRefreshProviders,
  onSelectModel,
  onClose,
  onChangePreferences,
  onSfxChange,
  onAmbientChange,
  onClearHistory,
  onResetPreferences,
  onRestartTour,
  onOpenTiers,
  onOpenChangelog,
}: SettingsModalProps) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { role } = useKaelAuth();
  const { language, locale, setLanguage, t } = useI18n();

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const onCloseRef = useRef(onClose);
  const statusTimer = useRef<number | null>(null);
  const titleId = useId();
  const nameInputId = useId();
  const instructionsId = useId();

  const [mounted, setMounted] = useState(open);
  const [section, setSection] = useState<SectionId>("account");
  const [nameDraft, setNameDraft] = useState("");
  const [nameState, setNameState] = useState<NameState>("idle");
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

  const tierId = tierForRole(role);
  const tier = getTier(tierId);
  const unlimited = isUnlimitedTier(tier);
  const tokensLeft = unlimited ? 0 : remainingTokens({ ...usage, tierId });
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const displayName =
    user?.fullName || user?.username || email || t("auth.role.user");

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (open) {
      setMounted(true);
      if (openSection) {
        setSection(openSection);
        setConfirmState(null);
      }
    }
  }, [open, openSection]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setNameDraft(user?.fullName || user?.username || "");
    setNameState("idle");
    setConfirmState(null);
    // The draft only re-syncs when the dialog opens or the account changes.
    // Updating the name in Clerk should keep the "saved" confirmation visible.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.id]);

  useEffect(
    () => () => {
      if (statusTimer.current !== null) {
        window.clearTimeout(statusTimer.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!mounted) {
      return undefined;
    }

    const previousActive = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => element.offsetParent !== null);

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActive?.focus();
    };
  }, [mounted]);

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || nameState === "saving") {
      return;
    }

    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === (user.fullName ?? "")) {
      return;
    }

    setNameState("saving");

    try {
      const [firstName, ...rest] = trimmed.split(/\s+/);
      await user.update({
        firstName,
        lastName: rest.join(" "),
      });
      setNameState("saved");
      playSfx("success");

      if (statusTimer.current !== null) {
        window.clearTimeout(statusTimer.current);
      }
      statusTimer.current = window.setTimeout(() => {
        setNameState("idle");
      }, 2600);
    } catch {
      setNameState("error");
      playSfx("error");
    }
  }

  function moveSection(nextIndex: number) {
    const count = SECTIONS.length;
    const wrapped = ((nextIndex % count) + count) % count;
    const next = SECTIONS[wrapped];
    if (!next) {
      return;
    }
    setSection(next.id);
    setConfirmState(null);
    tabRefs.current[wrapped]?.focus();
  }

  function handleNavKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const currentIndex = SECTIONS.findIndex((item) => item.id === section);

    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      moveSection(currentIndex + 1);
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      moveSection(currentIndex - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      moveSection(0);
    } else if (event.key === "End") {
      event.preventDefault();
      moveSection(SECTIONS.length - 1);
    }
  }

  function selectSection(id: SectionId) {
    setSection(id);
    setConfirmState(null);
    playSfx("click");
  }

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  const nameUnchanged =
    !user ||
    nameDraft.trim().length === 0 ||
    nameDraft.trim() === (user.fullName ?? "");

  return createPortal(
    <AnimatePresence onExitComplete={() => setMounted(false)}>
      {open && (
        <motion.div
          key="settings-modal"
          className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6"
          initial={false}
        >
          <motion.button
            type="button"
            aria-label={t("settings.closeBackdrop")}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute inset-0 bg-black/80"
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 24, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.995 }}
            transition={{ type: "spring", stiffness: 320, damping: 34, mass: 0.9 }}
            className="relative flex h-[100dvh] w-full flex-col overflow-hidden border border-[#262626] bg-[#161616] shadow-[0_40px_140px_-40px_rgba(0,0,0,0.98)] sm:h-[min(86dvh,780px)] sm:max-w-4xl sm:rounded-2xl"
          >
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#262626] px-5 py-4 sm:px-6 sm:py-5">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#10B981]">
                  {t("settings.eyebrow")}
                </p>
                <h2
                  id={titleId}
                  className="kael-display mt-1.5 text-xl font-semibold tracking-[-0.02em] text-[#F5F5F0]"
                >
                  {t("settings.title")}
                </h2>
                <p className="mt-1 hidden text-sm text-[#8E8E8A] sm:block">
                  {t("settings.subtitle")}
                </p>
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label={t("settings.close")}
                className="shrink-0 rounded-lg border border-[#262626] p-2.5 text-[#8E8E8A] transition hover:border-[#3A3A3A] hover:bg-[#1C1C1C] hover:text-[#F5F5F0] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/40"
              >
                <X size={18} strokeWidth={1.6} />
              </button>
            </header>

            <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
              <nav className="shrink-0 border-b border-[#262626] p-2.5 sm:w-56 sm:border-b-0 sm:border-r sm:p-3">
                <div
                  role="tablist"
                  aria-label={t("settings.title")}
                  aria-orientation="vertical"
                  onKeyDown={handleNavKeyDown}
                  className="kael-no-scrollbar flex gap-1 overflow-x-auto sm:flex-col"
                >
                  {SECTIONS.map((item, index) => {
                    const active = item.id === section;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        ref={(element) => {
                          tabRefs.current[index] = element;
                        }}
                        type="button"
                        role="tab"
                        id={`settings-tab-${item.id}`}
                        aria-selected={active}
                        aria-controls={`settings-panel-${item.id}`}
                        tabIndex={active ? 0 : -1}
                        onClick={() => selectSection(item.id)}
                        className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#10B981]/40 ${
                          active
                            ? "bg-[#10B981]/10 text-[#F5F5F0]"
                            : "text-[#8E8E8A] hover:bg-[#1C1C1C] hover:text-[#F5F5F0]"
                        }`}
                      >
                        <Icon
                          size={17}
                          strokeWidth={1.7}
                          className={active ? "text-[#34D399]" : ""}
                        />
                        <span className="whitespace-nowrap text-sm font-medium">
                          {t(item.label)}
                        </span>
                        <ChevronRight
                          size={14}
                          strokeWidth={1.7}
                          aria-hidden="true"
                          className={`ml-auto hidden text-[#8E8E8A] sm:block ${
                            active ? "opacity-100" : "opacity-0"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                <p className="mt-3 hidden px-3 text-[11px] leading-5 text-[#8E8E8A]/80 sm:block">
                  {t("settings.other.version", { version: KAEL_VERSION_LABEL })}
                </p>
              </nav>

              <div
                id={`settings-panel-${section}`}
                role="tabpanel"
                aria-labelledby={`settings-tab-${section}`}
                tabIndex={0}
                className="min-h-0 flex-1 overflow-y-auto px-4 py-5 focus:outline-none sm:px-6 sm:py-6"
              >
                {section === "account" && (
                  <div>
                    <SectionHeading
                      title={t("settings.section.account")}
                      hint={t("settings.section.accountHint")}
                    />

                    <div className="rounded-xl border border-[#262626] bg-[#0A0A0A] p-4 sm:p-5">
                      <div className="flex items-center gap-3.5">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#262626] bg-[#161616] text-base font-semibold text-[#10B981]">
                          {user?.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={user.imageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            displayName.slice(0, 1).toUpperCase()
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#F5F5F0]">
                            {displayName}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-[#8E8E8A]">
                            {email || t("settings.account.emailEmpty")}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-md border border-[#10B981]/30 bg-[#10B981]/10 px-2 py-1 text-[11px] font-medium tracking-[0.06em] text-[#34D399]">
                          {t(ROLE_KEYS[role])}
                        </span>
                      </div>

                      <form onSubmit={saveName} className="mt-5">
                        <label
                          htmlFor={nameInputId}
                          className="text-xs font-medium text-[#8E8E8A]"
                        >
                          {t("settings.account.nameLabel")}
                        </label>

                        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                          <input
                            id={nameInputId}
                            type="text"
                            value={nameDraft}
                            maxLength={MAX_PREFERRED_NAME}
                            autoComplete="name"
                            placeholder={t(
                              "settings.account.namePlaceholder",
                            )}
                            onChange={(event) => {
                              setNameDraft(event.target.value);
                              if (nameState !== "idle") {
                                setNameState("idle");
                              }
                            }}
                            className={INPUT_CLASS}
                          />
                          <button
                            type="submit"
                            disabled={nameUnchanged || nameState === "saving"}
                            className={PRIMARY_BUTTON_CLASS}
                          >
                            {nameState === "saving" ? (
                              <Loader2
                                size={15}
                                strokeWidth={1.9}
                                className="animate-spin"
                              />
                            ) : (
                              <Save size={15} strokeWidth={1.8} />
                            )}
                            {nameState === "saving"
                              ? t("settings.account.saving")
                              : t("settings.account.saveName")}
                          </button>
                        </div>

                        <p className="mt-2 text-xs leading-5 text-[#8E8E8A]">
                          {t("settings.account.nameHint")}
                        </p>

                        <p
                          aria-live="polite"
                          className={`mt-1 min-h-5 text-xs ${
                            nameState === "error"
                              ? "text-red-300"
                              : "text-[#34D399]"
                          }`}
                        >
                          {nameState === "saved"
                            ? `${t("settings.account.nameSaved")} · ${t("settings.saved")}`
                            : nameState === "error"
                              ? t("settings.account.nameError")
                              : ""}
                        </p>
                      </form>
                    </div>

                    <div className="mt-4">
                      <Card>
                        <SettingRow
                          title={t("settings.account.email")}
                          hint={email || t("settings.account.emailEmpty")}
                        >
                          <span className="text-sm text-[#F5F5F0]">
                            {email || "—"}
                          </span>
                        </SettingRow>

                        <SettingRow title={t("settings.account.role")}>
                          <span className="inline-flex items-center gap-2 rounded-lg border border-[#262626] bg-[#161616] px-3 py-1.5 text-sm text-[#F5F5F0]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                            {t(ROLE_KEYS[role])}
                          </span>
                        </SettingRow>

                        <SettingRow
                          title={t("settings.account.plan")}
                          hint={t("settings.account.planHint")}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-2 rounded-lg border border-[#262626] bg-[#161616] px-3 py-1.5 text-sm text-[#F5F5F0]">
                              <CreditCard
                                size={14}
                                strokeWidth={1.7}
                                className="text-[#34D399]"
                              />
                              {t(TIER_TRANSLATION_KEYS[tier.id].name)}
                              <span className="text-xs text-[#8E8E8A]">
                                {unlimited
                                  ? t("tiers.unlimited")
                                  : t("tiers.tokensLeft", {
                                      count: formatNumber(tokensLeft, locale),
                                    })}
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={onOpenTiers}
                              className={SECONDARY_BUTTON_CLASS}
                            >
                              {t("settings.account.managePlan")}
                            </button>
                          </div>
                        </SettingRow>
                      </Card>
                    </div>

                    <div className="mt-4 rounded-xl border border-[#262626] bg-[#0A0A0A] p-4 sm:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-[#F5F5F0]">
                            {t("settings.account.signOut")}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[#8E8E8A]">
                            {t("settings.account.signOutHint")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            playSfx("close");
                            void signOut();
                          }}
                          className={`${SECONDARY_BUTTON_CLASS} text-red-200 hover:border-red-900/60 hover:bg-red-950/20`}
                        >
                          <LogOut size={15} strokeWidth={1.8} />
                          {t("settings.account.signOut")}
                        </button>
                      </div>
                    </div>

                    <p className="mt-4 flex gap-2 text-xs leading-5 text-[#8E8E8A]">
                      <Info
                        size={14}
                        strokeWidth={1.7}
                        className="mt-0.5 shrink-0"
                      />
                      {t("settings.account.deviceNote")}
                    </p>
                  </div>
                )}

                {section === "client" && (
                  <div>
                    <SectionHeading
                      title={t("settings.section.client")}
                      hint={t("settings.section.clientHint")}
                    />

                    <Card>
                      <div className="px-4 py-4 sm:px-5">
                        <p className="text-sm font-medium text-[#F5F5F0]">
                          {t("settings.client.language")}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-[#8E8E8A]">
                          {t("settings.client.languageHint")}
                        </p>

                        <div
                          role="radiogroup"
                          aria-label={t("settings.client.language")}
                          className="mt-3 grid grid-cols-3 gap-2"
                        >
                          {LANGUAGES.map((option) => {
                            const active = option.id === language;

                            return (
                              <button
                                key={option.id}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                onClick={() => {
                                  setLanguage(option.id);
                                  playSfx("toggle");
                                }}
                                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/40 ${
                                  active
                                    ? "border-[#10B981]/50 bg-[#10B981]/10 text-[#F5F5F0]"
                                    : "border-[#262626] text-[#8E8E8A] hover:border-[#3A3A3A] hover:bg-[#161616] hover:text-[#F5F5F0]"
                                }`}
                              >
                                <span className="font-semibold tabular-nums">
                                  {option.label}
                                </span>
                                <span className="truncate">{option.name}</span>
                                {active && (
                                  <Check
                                    size={14}
                                    strokeWidth={2}
                                    className="shrink-0 text-[#34D399]"
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </Card>

                    <div className="mt-4">
                      <Card>
                        <div className="px-4 py-4 sm:px-5">
                          <p className="text-sm font-medium text-[#F5F5F0]">
                            {t("settings.client.theme")}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[#8E8E8A]">
                            {t("settings.client.themeHint")}
                          </p>

                          <div
                            role="radiogroup"
                            aria-label={t("settings.client.theme")}
                            className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2"
                          >
                            {THEME_OPTIONS.map((option) => {
                              const active = preferences.theme === option.id;
                              const Icon = option.icon;

                              return (
                                <button
                                  key={option.id}
                                  type="button"
                                  role="radio"
                                  aria-checked={active}
                                  onClick={() => {
                                    onChangePreferences({ theme: option.id });
                                    playSfx("toggle");
                                  }}
                                  className={`flex flex-col gap-2 rounded-lg border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/40 ${
                                    active
                                      ? "border-[#10B981]/50 bg-[#10B981]/10"
                                      : "border-[#262626] hover:border-[#3A3A3A] hover:bg-[#161616]"
                                  }`}
                                >
                                  <span className="flex items-center justify-between gap-2">
                                    <span className="flex items-center gap-2 text-sm font-medium text-[#F5F5F0]">
                                      <Icon
                                        size={15}
                                        strokeWidth={1.7}
                                        className={
                                          active
                                            ? "text-[#34D399]"
                                            : "text-[#8E8E8A]"
                                        }
                                      />
                                      {t(option.labelKey)}
                                    </span>
                                    {active && (
                                      <Check
                                        size={14}
                                        strokeWidth={2}
                                        className="shrink-0 text-[#34D399]"
                                      />
                                    )}
                                  </span>
                                  <span className="text-xs leading-5 text-[#8E8E8A]">
                                    {t(option.hintKey)}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="px-4 py-4 sm:px-5">
                          <p className="flex items-center gap-2 text-sm font-medium text-[#F5F5F0]">
                            <Type
                              size={15}
                              strokeWidth={1.7}
                              className="text-[#8E8E8A]"
                            />
                            {t("settings.client.interfaceFont")}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[#8E8E8A]">
                            {t("settings.client.interfaceFontHint")}
                          </p>

                          <div
                            role="radiogroup"
                            aria-label={t("settings.client.interfaceFont")}
                            className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"
                          >
                            {INTERFACE_FONT_OPTIONS.map((option) => {
                              const active =
                                preferences.interfaceFont === option.id;

                              return (
                                <button
                                  key={option.id}
                                  type="button"
                                  role="radio"
                                  aria-checked={active}
                                  onClick={() => {
                                    onChangePreferences({
                                      interfaceFont: option.id,
                                    });
                                    playSfx("toggle");
                                  }}
                                  className={`rounded-lg border px-2.5 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/40 ${
                                    active
                                      ? "border-[#10B981]/50 bg-[#10B981]/10"
                                      : "border-[#262626] hover:border-[#3A3A3A] hover:bg-[#161616]"
                                  }`}
                                >
                                  <span
                                    className="block truncate text-[13px] font-medium text-[#F5F5F0]"
                                    style={{ fontFamily: option.family }}
                                  >
                                    {t(option.labelKey)}
                                  </span>
                                  <span
                                    className="mt-1 block truncate text-[11px] text-[#8E8E8A]"
                                    style={{ fontFamily: option.family }}
                                  >
                                    Aa Бб 123
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="px-4 py-4 sm:px-5">
                          <p className="flex items-center gap-2 text-sm font-medium text-[#F5F5F0]">
                            <Type
                              size={15}
                              strokeWidth={1.7}
                              className="text-[#8E8E8A]"
                            />
                            {t("settings.client.displayFont")}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[#8E8E8A]">
                            {t("settings.client.displayFontHint")}
                          </p>

                          <div
                            role="radiogroup"
                            aria-label={t("settings.client.displayFont")}
                            className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"
                          >
                            {DISPLAY_FONT_OPTIONS.map((option) => {
                              const active =
                                preferences.displayFont === option.id;

                              return (
                                <button
                                  key={option.id}
                                  type="button"
                                  role="radio"
                                  aria-checked={active}
                                  onClick={() => {
                                    onChangePreferences({
                                      displayFont: option.id,
                                    });
                                    playSfx("toggle");
                                  }}
                                  className={`rounded-lg border px-2.5 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/40 ${
                                    active
                                      ? "border-[#10B981]/50 bg-[#10B981]/10"
                                      : "border-[#262626] hover:border-[#3A3A3A] hover:bg-[#161616]"
                                  }`}
                                >
                                  <span
                                    className="block truncate text-[13px] font-semibold text-[#F5F5F0]"
                                    style={{ fontFamily: option.family }}
                                  >
                                    {t(option.labelKey)}
                                  </span>
                                  <span
                                    className="mt-1 block truncate text-[11px] uppercase tracking-[0.08em] text-[#8E8E8A]"
                                    style={{ fontFamily: option.family }}
                                  >
                                    KAEL
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </Card>
                    </div>

                    <div className="mt-4">
                      <Card>
                        <SettingRow
                          title={t("settings.client.sound")}
                          hint={t("settings.client.soundHint")}
                        >
                          <div className="flex items-center gap-2.5">
                            <Volume2
                              size={15}
                              strokeWidth={1.7}
                              className={
                                sfxOn ? "text-[#34D399]" : "text-[#8E8E8A]"
                              }
                            />
                            <Toggle
                              checked={sfxOn}
                              label={t("settings.client.sound")}
                              onChange={onSfxChange}
                            />
                          </div>
                        </SettingRow>

                        <SettingRow
                          title={t("settings.client.ambient")}
                          hint={t("settings.client.ambientHint")}
                        >
                          <div className="flex items-center gap-2.5">
                            <AudioLines
                              size={15}
                              strokeWidth={1.7}
                              className={
                                ambientOn ? "text-[#34D399]" : "text-[#8E8E8A]"
                              }
                            />
                            <Toggle
                              checked={ambientOn}
                              label={t("settings.client.ambient")}
                              onChange={onAmbientChange}
                            />
                          </div>
                        </SettingRow>

                        <SettingRow
                          title={t("settings.client.enterToSend")}
                          hint={t("settings.client.enterToSendHint")}
                        >
                          <Toggle
                            checked={preferences.enterToSend}
                            label={t("settings.client.enterToSend")}
                            onChange={(checked) =>
                              onChangePreferences({ enterToSend: checked })
                            }
                          />
                        </SettingRow>

                        <SettingRow
                          title={t("settings.client.autoScroll")}
                          hint={t("settings.client.autoScrollHint")}
                        >
                          <Toggle
                            checked={preferences.autoScroll}
                            label={t("settings.client.autoScroll")}
                            onChange={(checked) =>
                              onChangePreferences({ autoScroll: checked })
                            }
                          />
                        </SettingRow>
                      </Card>
                    </div>
                  </div>
                )}

                {section === "extensions" && (
                  <div>
                    <SectionHeading
                      title={t("settings.section.extensions")}
                      hint={t("settings.section.extensionsHint")}
                    />

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm font-semibold text-[#F5F5F0]">
                          <Plug
                            size={15}
                            strokeWidth={1.7}
                            className="text-[#34D399]"
                          />
                          {t("settings.extensions.connectors")}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-[#8E8E8A]">
                          {t("settings.extensions.connectorsHint")}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={onRefreshProviders}
                        disabled={providersLoading}
                        className={SECONDARY_BUTTON_CLASS}
                      >
                        <RefreshCw
                          size={15}
                          strokeWidth={1.8}
                          className={providersLoading ? "animate-spin" : ""}
                        />
                        {t("settings.extensions.refresh")}
                      </button>
                    </div>

                    <div className="mt-3">
                      <Card>
                        {CONNECTOR_ORDER.map((providerId) => {
                          const group = MODEL_GROUPS.find(
                            (item) => item.provider === providerId,
                          );
                          if (!group) {
                            return null;
                          }

                          const available = providers?.[providerId] ?? false;
                          const checking = providersLoading && providers === null;
                          const selected = group.models.some(
                            (item) => item.id === modelId,
                          )
                            ? modelId
                            : "";

                          return (
                            <div
                              key={providerId}
                              className="px-4 py-4 sm:px-5"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-[#F5F5F0]">
                                    {group.label}
                                  </p>
                                  <p className="mt-1 text-xs leading-5 text-[#8E8E8A]">
                                    {t(CONNECTOR_HINT_KEYS[providerId])}
                                  </p>
                                </div>

                                <span
                                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium ${
                                    checking
                                      ? "border-[#262626] bg-[#1C1C1C] text-[#8E8E8A]"
                                      : available
                                        ? "border-[#10B981]/30 bg-[#10B981]/10 text-[#34D399]"
                                        : "border-[#262626] bg-[#1C1C1C] text-[#8E8E8A]"
                                  }`}
                                >
                                  {checking ? (
                                    <Loader2
                                      size={12}
                                      strokeWidth={2}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <span
                                      className={`h-1.5 w-1.5 rounded-full ${
                                        available
                                          ? "bg-[#10B981]"
                                          : "bg-zinc-600"
                                      }`}
                                    />
                                  )}
                                  {checking
                                    ? t("settings.extensions.checking")
                                    : available
                                      ? t("settings.extensions.connected")
                                      : t("settings.extensions.notConfigured")}
                                </span>
                              </div>

                              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                                <select
                                  value={selected}
                                  disabled={!available}
                                  aria-label={t(
                                    "settings.extensions.modelFor",
                                    { provider: group.label },
                                  )}
                                  onChange={(event) => {
                                    const next = event.target.value;
                                    if (next) {
                                      onSelectModel(next);
                                      playSfx("toggle");
                                    }
                                  }}
                                  className={`${INPUT_CLASS} sm:max-w-xs`}
                                >
                                  <option value="" disabled>
                                    {t("settings.extensions.chooseModel")}
                                  </option>
                                  {group.models.map((model) => (
                                    <option key={model.id} value={model.id}>
                                      {model.name}
                                    </option>
                                  ))}
                                </select>

                                <span className="text-xs leading-5 text-[#8E8E8A]">
                                  {t(MODEL_GROUP_HINT_KEYS[providerId])}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </Card>
                    </div>

                    <div className="mt-6 border-t border-[#262626] pt-6">
                      <McpServersSection />
                    </div>

                    <div className="mt-6">
                      <div className="flex items-start gap-2">
                        <Puzzle
                          size={15}
                          strokeWidth={1.7}
                          className="mt-0.5 shrink-0 text-[#34D399]"
                        />
                        <div>
                          <p className="text-sm font-semibold text-[#F5F5F0]">
                            {t("settings.extensions.plugins")}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[#8E8E8A]">
                            {t("settings.extensions.pluginsHint")}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <Card>
                          <SettingRow
                            title={t(
                              "settings.extensions.plugin.liveDemo",
                            )}
                            hint={t(
                              "settings.extensions.plugin.liveDemoHint",
                            )}
                          >
                            <Toggle
                              checked={preferences.liveDemo}
                              label={t(
                                "settings.extensions.plugin.liveDemo",
                              )}
                              onChange={(checked) =>
                                onChangePreferences({ liveDemo: checked })
                              }
                            />
                          </SettingRow>

                          <SettingRow
                            title={t(
                              "settings.extensions.plugin.quickStart",
                            )}
                            hint={t(
                              "settings.extensions.plugin.quickStartHint",
                            )}
                          >
                            <Toggle
                              checked={preferences.quickStart}
                              label={t(
                                "settings.extensions.plugin.quickStart",
                              )}
                              onChange={(checked) =>
                                onChangePreferences({ quickStart: checked })
                              }
                            />
                          </SettingRow>

                          <SettingRow
                            title={t(
                              "settings.extensions.plugin.changelogAuto",
                            )}
                            hint={t(
                              "settings.extensions.plugin.changelogAutoHint",
                            )}
                          >
                            <Toggle
                              checked={preferences.changelogAuto}
                              label={t(
                                "settings.extensions.plugin.changelogAuto",
                              )}
                              onChange={(checked) =>
                                onChangePreferences({
                                  changelogAuto: checked,
                                })
                              }
                            />
                          </SettingRow>
                        </Card>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="flex items-start gap-2">
                        <Sparkles
                          size={15}
                          strokeWidth={1.7}
                          className="mt-0.5 shrink-0 text-[#34D399]"
                        />
                        <div>
                          <p className="text-sm font-semibold text-[#F5F5F0]">
                            {t("settings.extensions.skills")}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[#8E8E8A]">
                            {t("settings.extensions.skillsHint")}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <Card>
                          {KAEL_SKILLS.map((skill) => {
                            const checked = preferences.skills.includes(
                              skill.id,
                            );

                            return (
                              <SettingRow
                                key={skill.id}
                                title={t(skill.labelKey)}
                                hint={t(skill.descriptionKey)}
                              >
                                <Toggle
                                  checked={checked}
                                  label={t(skill.labelKey)}
                                  onChange={(next) => {
                                    const skills = next
                                      ? [...preferences.skills, skill.id]
                                      : preferences.skills.filter(
                                          (id) => id !== skill.id,
                                        );
                                    onChangePreferences({ skills });
                                  }}
                                />
                              </SettingRow>
                            );
                          })}
                        </Card>
                      </div>
                    </div>
                  </div>
                )}

                {section === "personalization" && (
                  <div>
                    <SectionHeading
                      title={t("settings.section.personalization")}
                      hint={t("settings.section.personalizationHint")}
                    />

                    <Card>
                      <div className="px-4 py-4 sm:px-5">
                        <label
                          htmlFor={`${instructionsId}-name`}
                          className="text-sm font-medium text-[#F5F5F0]"
                        >
                          {t("settings.personalization.name")}
                        </label>
                        <p className="mt-1 text-xs leading-5 text-[#8E8E8A]">
                          {t("settings.personalization.nameHint")}
                        </p>
                        <input
                          id={`${instructionsId}-name`}
                          type="text"
                          value={preferences.preferredName}
                          maxLength={MAX_PREFERRED_NAME}
                          placeholder={t(
                            "settings.personalization.namePlaceholder",
                          )}
                          onChange={(event) =>
                            onChangePreferences({
                              preferredName: event.target.value,
                            })
                          }
                          className={`${INPUT_CLASS} mt-3`}
                        />
                      </div>

                      <div className="px-4 py-4 sm:px-5">
                        <label
                          htmlFor={`${instructionsId}-style`}
                          className="text-sm font-medium text-[#F5F5F0]"
                        >
                          {t("settings.personalization.style")}
                        </label>
                        <p className="mt-1 text-xs leading-5 text-[#8E8E8A]">
                          {t("settings.personalization.styleHint")}
                        </p>
                        <select
                          id={`${instructionsId}-style`}
                          value={preferences.responseStyle}
                          onChange={(event) =>
                            onChangePreferences({
                              responseStyle: event.target
                                .value as ResponseStyle,
                            })
                          }
                          className={`${INPUT_CLASS} mt-3`}
                        >
                          {(
                            Object.keys(STYLE_KEYS) as ResponseStyle[]
                          ).map((style) => (
                            <option key={style} value={style}>
                              {t(STYLE_KEYS[style])}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="px-4 py-4 sm:px-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <label
                              htmlFor={instructionsId}
                              className="text-sm font-medium text-[#F5F5F0]"
                            >
                              {t("settings.personalization.instructions")}
                            </label>
                            <p className="mt-1 text-xs leading-5 text-[#8E8E8A]">
                              {t(
                                "settings.personalization.instructionsHint",
                                { max: MAX_CUSTOM_INSTRUCTIONS },
                              )}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs tabular-nums text-[#8E8E8A]">
                            {t(
                              "settings.personalization.instructionsCounter",
                              {
                                count: preferences.customInstructions.length,
                                max: MAX_CUSTOM_INSTRUCTIONS,
                              },
                            )}
                          </span>
                        </div>

                        <textarea
                          id={instructionsId}
                          value={preferences.customInstructions}
                          maxLength={MAX_CUSTOM_INSTRUCTIONS}
                          rows={5}
                          placeholder={t(
                            "settings.personalization.instructionsPlaceholder",
                          )}
                          onChange={(event) =>
                            onChangePreferences({
                              customInstructions: event.target.value,
                            })
                          }
                          className="mt-3 w-full resize-y rounded-lg border border-[#262626] bg-[#161616] px-3 py-2.5 text-sm leading-6 text-[#F5F5F0] outline-none transition placeholder:text-[#8E8E8A]/70 focus:border-[#10B981]/60 focus:ring-2 focus:ring-[#10B981]/20"
                        />

                        <p className="mt-2 flex gap-2 text-xs leading-5 text-[#8E8E8A]">
                          <Info
                            size={13}
                            strokeWidth={1.7}
                            className="mt-0.5 shrink-0"
                          />
                          {t("settings.personalization.privacy")}
                        </p>
                      </div>
                    </Card>

                    <div className="mt-4">
                      <Card>
                        <SettingRow
                          title={t("settings.personalization.mascot")}
                          hint={t("settings.personalization.mascotHint")}
                        >
                          <Toggle
                            checked={preferences.mascotEnabled}
                            label={t("settings.personalization.mascot")}
                            onChange={(checked) =>
                              onChangePreferences({ mascotEnabled: checked })
                            }
                          />
                        </SettingRow>

                        <SettingRow
                          title={t("settings.personalization.reduceMotion")}
                          hint={t(
                            "settings.personalization.reduceMotionHint",
                          )}
                        >
                          <Toggle
                            checked={preferences.reduceMotion}
                            label={t("settings.personalization.reduceMotion")}
                            onChange={(checked) =>
                              onChangePreferences({ reduceMotion: checked })
                            }
                          />
                        </SettingRow>
                      </Card>
                    </div>
                  </div>
                )}

                {section === "other" && (
                  <div>
                    <SectionHeading
                      title={t("settings.section.other")}
                      hint={t("settings.section.otherHint")}
                    />

                    <Card>
                      <div className="px-4 py-4 sm:px-5">
                        <p className="text-sm font-medium text-[#F5F5F0]">
                          {t("settings.other.data")}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-[#8E8E8A]">
                          {t("settings.other.dataHint")}
                        </p>
                        <p className="mt-2 text-xs tabular-nums text-[#8E8E8A]">
                          {t("settings.other.stats", {
                            sessions: sessionCount,
                            messages: messageCount,
                          })}
                        </p>

                        {confirmState === "history" ? (
                          <div className="mt-4 rounded-lg border border-red-900/40 bg-red-950/15 p-3.5">
                            <p className="text-sm text-red-100/90">
                              {t("settings.other.clearConfirm")}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setConfirmState(null)}
                                className={SECONDARY_BUTTON_CLASS}
                              >
                                {t("settings.other.cancel")}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onClearHistory();
                                  setConfirmState(null);
                                  playSfx("close");
                                }}
                                className={DANGER_BUTTON_CLASS}
                              >
                                <Trash2 size={15} strokeWidth={1.8} />
                                {t("settings.other.clear")}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3">
                            <button
                              type="button"
                              disabled={sessionCount === 0}
                              onClick={() => {
                                setConfirmState("history");
                                playSfx("click");
                              }}
                              className={DANGER_BUTTON_CLASS}
                            >
                              <Trash2 size={15} strokeWidth={1.8} />
                              {t("settings.other.clearHistory")}
                            </button>
                            <p className="mt-2 text-xs leading-5 text-[#8E8E8A]">
                              {t("settings.other.clearHistoryHint")}
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>

                    <div className="mt-4">
                      <Card>
                        <div className="px-4 py-4 sm:px-5">
                          <p className="text-sm font-medium text-[#F5F5F0]">
                            {t("settings.other.reset")}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[#8E8E8A]">
                            {t("settings.other.resetHint")}
                          </p>

                          {confirmState === "reset" ? (
                            <div className="mt-4 rounded-lg border border-red-900/40 bg-red-950/15 p-3.5">
                              <p className="text-sm text-red-100/90">
                                {t("settings.other.resetConfirm")}
                              </p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => setConfirmState(null)}
                                  className={SECONDARY_BUTTON_CLASS}
                                >
                                  {t("settings.other.cancel")}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onResetPreferences();
                                    setLanguage("ru");
                                    setConfirmState(null);
                                    playSfx("toggle");
                                  }}
                                  className={DANGER_BUTTON_CLASS}
                                >
                                  <RotateCcw size={15} strokeWidth={1.8} />
                                  {t("settings.other.resetAction")}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmState("reset");
                                playSfx("click");
                              }}
                              className={`${SECONDARY_BUTTON_CLASS} mt-3`}
                            >
                              <RotateCcw size={15} strokeWidth={1.8} />
                              {t("settings.other.reset")}
                            </button>
                          )}
                        </div>
                      </Card>
                    </div>

                    <div className="mt-4">
                      <Card>
                        <SettingRow
                          title={t("settings.other.restartTour")}
                          hint={t("settings.other.restartTourHint")}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onRestartTour();
                              playSfx("open");
                            }}
                            className={SECONDARY_BUTTON_CLASS}
                          >
                            <Compass size={15} strokeWidth={1.8} />
                            {t("settings.other.restartTour")}
                          </button>
                        </SettingRow>
                        <SettingRow
                          title={`${t("changelog.open")} · ${KAEL_VERSION_LABEL}`}
                          hint={t("changelog.openHint")}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onOpenChangelog();
                              playSfx("open");
                            }}
                            className={SECONDARY_BUTTON_CLASS}
                          >
                            <ScrollText size={15} strokeWidth={1.8} />
                            {t("changelog.open")}
                          </button>
                        </SettingRow>
                      </Card>
                    </div>

                    <div className="mt-4 rounded-xl border border-[#262626] bg-[#0A0A0A] p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#262626] bg-[#161616] text-sm font-semibold text-[#10B981]">
                          K
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#F5F5F0]">
                            {t("settings.other.about")}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[#8E8E8A]">
                            {t("settings.other.aboutText")}
                          </p>
                          <p className="mt-2 text-xs tabular-nums text-[#8E8E8A]/80">
                            {t("settings.other.version", {
                              version: KAEL_VERSION_LABEL,
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-[#262626] pt-3">
                        <p className="text-xs font-medium text-[#F5F5F0]">
                          {t("settings.other.legal")}
                        </p>
                        <LegalLinks className="mt-2" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
