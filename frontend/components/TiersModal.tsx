"use client";

import { Check, Crown, Gauge, KeyRound, Lock, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { KaelRole } from "../lib/api";
import { useI18n } from "../lib/i18n";
import {
  DEV_TIER,
  PUBLIC_TIERS,
  formatNumber,
  formatTokens,
  getTier,
  isUnlimitedTier,
  nextResetLabel,
  tierForRole,
  usagePercent,
  type UsageState,
} from "../lib/tiers";
import {
  TIER_TRANSLATION_KEYS,
  type TranslationKey,
} from "../lib/translations";

type TiersModalProps = {
  open: boolean;
  usage: UsageState;
  role: KaelRole;
  onClose: () => void;
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

const TIER_ICONS = {
  free: Sparkles,
  pro: Gauge,
  elite: Crown,
  dev: KeyRound,
} as const;

const ROLE_KEYS: Record<KaelRole, TranslationKey> = {
  admin: "auth.role.admin",
  tester: "auth.role.tester",
  user: "auth.role.user",
};

export default function TiersModal({
  open,
  usage,
  role,
  onClose,
}: TiersModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const [mounted, setMounted] = useState(open);
  const { locale, t } = useI18n();

  const currentTierId = tierForRole(role);
  const currentTier = getTier(currentTierId);
  const unlimited = isUnlimitedTier(currentTier);
  const percent = usagePercent({ ...usage, tierId: currentTierId });
  const remaining = unlimited
    ? 0
    : Math.max(0, currentTier.tokenLimit - usage.tokensUsed);
  const resetLabel = useMemo(() => nextResetLabel(locale), [locale]);
  const showDev = role === "admin";
  const visibleTiers = showDev ? [...PUBLIC_TIERS, DEV_TIER] : PUBLIC_TIERS;
  const currentTierName = t(TIER_TRANSLATION_KEYS[currentTier.id].name);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (open) {
      setMounted(true);
    }
  }, [open]);

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

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence onExitComplete={() => setMounted(false)}>
      {open && (
        <motion.div
          key="tiers-modal"
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"
          initial={false}
        >
          <motion.button
            type="button"
            aria-label={t("tiers.closeBackdrop")}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-0 bg-black/80"
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tiers-modal-title"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.99 }}
            transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.9 }}
            className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-[#262626] bg-[#161616] shadow-[0_40px_120px_-32px_rgba(0,0,0,0.95)] sm:max-h-[calc(100dvh-3rem)]"
          >
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#262626] px-5 py-5 sm:px-7 sm:py-6">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#10B981]">
                  {t("tiers.eyebrow")}
                </p>
                <h2
                  id="tiers-modal-title"
                  className="kael-display mt-2 text-xl font-semibold tracking-[-0.02em] text-[#F5F5F0]"
                >
                  {t("tiers.title")}
                </h2>
                <p className="mt-2 text-sm text-[#8E8E8A]">
                  {showDev ? t("tiers.subtitleDev") : t("tiers.subtitle")}
                </p>
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label={t("tiers.close")}
                className="shrink-0 rounded-lg border border-[#262626] p-2.5 text-[#8E8E8A] transition hover:border-[#3A3A3A] hover:bg-[#1C1C1C] hover:text-[#F5F5F0] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/40"
              >
                <X size={18} strokeWidth={1.6} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
              <section
                aria-label={t("tiers.current")}
                className="rounded-xl border border-[#262626] bg-[#0A0A0A] p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-[#8E8E8A]">
                      {t("tiers.current")}
                    </p>
                    <p className="kael-display mt-1 flex flex-wrap items-center gap-2 text-lg font-semibold text-[#F5F5F0]">
                      {currentTierName}
                      <span className="rounded-md border border-[#262626] bg-[#161616] px-2 py-1 text-xs font-medium tracking-[0.08em] text-[#10B981]">
                        {t(ROLE_KEYS[role])}
                      </span>
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-lg border border-[#262626] bg-[#161616] px-3 py-2 text-sm text-[#F5F5F0]">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        unlimited ? "bg-[#10B981]" : "bg-[#8E8E8A]"
                      }`}
                    />
                    {unlimited
                      ? t("tiers.unlimited")
                      : t("tiers.tokensLeft", {
                          count: formatNumber(remaining, locale),
                        })}
                  </span>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-[#8E8E8A]">
                      {unlimited
                        ? t("tiers.tokensProcessed", {
                            count: formatNumber(usage.tokensUsed, locale),
                          })
                        : t("tiers.tokensOf", {
                            used: formatNumber(usage.tokensUsed, locale),
                            limit: formatTokens(currentTier.tokenLimit, locale),
                          })}
                    </span>
                    <span className="tabular-nums text-[#F5F5F0]">
                      {unlimited ? "∞" : `${Math.round(percent)}%`}
                    </span>
                  </div>

                  <div
                    role="progressbar"
                    aria-label={t("tiers.progressAria")}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={unlimited ? 100 : Math.round(percent)}
                    aria-valuetext={
                      unlimited
                        ? t("tiers.unlimited")
                        : t("tiers.percentAria", {
                            percent: Math.round(percent),
                          })
                    }
                    className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#262626]"
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: unlimited ? "100%" : `${Math.max(percent, 2)}%`,
                      }}
                      transition={{ type: "spring", stiffness: 90, damping: 22 }}
                      className="h-full rounded-full bg-[#10B981]"
                    />
                  </div>

                  <p className="mt-3 text-sm text-[#8E8E8A]">
                    {unlimited
                      ? t("tiers.unlimitedNote")
                      : t("tiers.limitReset", { date: resetLabel })}
                  </p>
                </div>
              </section>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {visibleTiers.map((tier, index) => {
                  const Icon = TIER_ICONS[tier.id];
                  const active = tier.id === currentTierId;
                  const isDev = tier.id === "dev";
                  const tierCopy = TIER_TRANSLATION_KEYS[tier.id];
                  const tierName = t(tierCopy.name);

                  return (
                    <motion.section
                      key={tier.id}
                      layout
                      aria-label={tierName}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.05 + index * 0.04,
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                      className={`flex flex-col rounded-xl border p-5 ${
                        active
                          ? "border-[#10B981]/45 bg-[#0A0A0A]"
                          : "border-[#262626] bg-[#0A0A0A]/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                            active
                              ? "border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981]"
                              : "border-[#262626] text-[#8E8E8A]"
                          }`}
                        >
                          <Icon size={17} strokeWidth={1.6} />
                        </span>
                        {active ? (
                          <span className="rounded-md border border-[#10B981]/30 bg-[#10B981]/10 px-2.5 py-1 text-xs text-[#10B981]">
                            {isDev ? t("tiers.devBadge") : t("tiers.active")}
                          </span>
                        ) : null}
                      </div>

                      <h3 className="kael-display mt-4 text-base font-semibold text-[#F5F5F0]">
                        {tierName}
                      </h3>
                      <p className="mt-1 text-sm text-[#8E8E8A]">
                        {t(tierCopy.price)}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-[#8E8E8A]">
                        {t(tierCopy.description)}
                      </p>

                      <ul className="mt-4 flex-1 space-y-2.5">
                        {tierCopy.features.map((featureKey) => (
                          <li
                            key={featureKey}
                            className="flex items-start gap-2.5 text-sm leading-5 text-[#8E8E8A]"
                          >
                            <Check
                              size={15}
                              strokeWidth={2}
                              className="mt-0.5 shrink-0 text-[#10B981]"
                            />
                            {t(featureKey)}
                          </li>
                        ))}
                      </ul>

                      <button
                        type="button"
                        disabled
                        className={`mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium ${
                          active
                            ? "border-[#10B981]/30 text-[#10B981]"
                            : "cursor-not-allowed border-[#262626] bg-[#161616] text-[#8E8E8A]"
                        }`}
                      >
                        {active ? (
                          t("tiers.currentButton")
                        ) : (
                          <>
                            <Lock size={14} strokeWidth={1.8} />
                            {t("tiers.unavailable")}
                          </>
                        )}
                      </button>
                    </motion.section>
                  );
                })}
              </div>

              <p className="mt-5 text-sm leading-6 text-[#8E8E8A]">
                {t("tiers.footer")}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
