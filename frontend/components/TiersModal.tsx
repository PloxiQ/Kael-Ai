"use client";

import {
  ArrowUpRight,
  Check,
  Crown,
  Gauge,
  KeyRound,
  Lock,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../lib/i18n";
import {
  DEV_TIER,
  PUBLIC_TIERS,
  formatNumber,
  formatTokens,
  getTier,
  isUnlimitedTier,
  nextResetLabel,
  usagePercent,
  type TierId,
  type UsageState,
} from "../lib/tiers";
import { TIER_TRANSLATION_KEYS } from "../lib/translations";

type TiersModalProps = {
  open: boolean;
  usage: UsageState;
  devMode: boolean;
  onClose: () => void;
  onSelectTier: (tierId: TierId) => void;
  onUnlockDev: () => void;
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

const TIER_ICONS = {
  free: Sparkles,
  pro: Gauge,
  elite: Crown,
  dev: KeyRound,
} as const;

const SECRET_CLICKS = 5;

export default function TiersModal({
  open,
  usage,
  devMode,
  onClose,
  onSelectTier,
  onUnlockDev,
}: TiersModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const clicksRef = useRef(0);
  const clickTimerRef = useRef<number | null>(null);
  const [mounted, setMounted] = useState(open);
  const [titlePulse, setTitlePulse] = useState(false);
  const [devNotice, setDevNotice] = useState(false);
  const { locale, t } = useI18n();

  const currentTier = getTier(usage.tierId);
  const unlimited = isUnlimitedTier(currentTier);
  const percent = usagePercent(usage);
  const remaining = unlimited
    ? 0
    : Math.max(0, currentTier.tokenLimit - usage.tokensUsed);
  const resetLabel = useMemo(() => nextResetLabel(locale), [locale]);
  const showDev = devMode || usage.tierId === "dev";
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
    if (!open) {
      setDevNotice(false);
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

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        window.clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  function handleTitleClick() {
    clicksRef.current += 1;

    if (clickTimerRef.current) {
      window.clearTimeout(clickTimerRef.current);
    }

    clickTimerRef.current = window.setTimeout(() => {
      clicksRef.current = 0;
    }, 1_600);

    setTitlePulse(true);
    window.setTimeout(() => setTitlePulse(false), 240);

    if (clicksRef.current >= SECRET_CLICKS) {
      clicksRef.current = 0;
      onUnlockDev();
      setDevNotice(true);
    }
  }

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
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tiers-modal-title"
            initial={{ opacity: 0, y: 28, scale: 0.965 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.975 }}
            transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.9 }}
            className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#07070a]/92 shadow-[0_50px_140px_-40px_rgba(0,0,0,0.98),0_0_90px_-40px_rgba(245,87,108,0.5)] backdrop-blur-2xl sm:max-h-[calc(100dvh-3rem)]"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#f093fb]/70 to-transparent"
            />

            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-5 sm:px-7 sm:py-6">
              <div className="min-w-0">
                <p className="text-sm font-medium uppercase tracking-[0.14em] text-[#f7a6ba]">
                  {t("tiers.eyebrow")}
                </p>
                <motion.h2
                  id="tiers-modal-title"
                  onClick={handleTitleClick}
                  animate={{ scale: titlePulse ? 1.02 : 1 }}
                  transition={{ type: "spring", stiffness: 520, damping: 18 }}
                  className="kael-display mt-2 cursor-pointer select-none text-2xl font-semibold tracking-[-0.02em] text-zinc-50"
                >
                  {t("tiers.title")}
                </motion.h2>
                <p className="mt-2 text-sm text-zinc-500">
                  {showDev ? t("tiers.subtitleDev") : t("tiers.subtitle")}
                </p>
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label={t("tiers.close")}
                className="shrink-0 rounded-xl border border-white/[0.08] p-2.5 text-zinc-500 transition hover:border-white/[0.16] hover:text-zinc-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5576c]/35"
              >
                <X size={18} strokeWidth={1.6} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
              <AnimatePresence>
                {devNotice && (
                  <motion.div
                    role="status"
                    aria-live="polite"
                    initial={{ opacity: 0, height: 0, y: -8 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="mb-4 overflow-hidden"
                  >
                    <div className="flex items-center gap-3 rounded-xl border border-[#f093fb]/30 bg-[linear-gradient(135deg,rgba(240,147,251,0.14),rgba(245,87,108,0.08))] px-4 py-3">
                      <KeyRound
                        size={17}
                        strokeWidth={1.7}
                        className="shrink-0 text-[#f7a6ba]"
                      />
                      <p className="text-sm leading-6 text-zinc-200">
                        {t("tiers.devActivated")}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.section
                aria-label={t("tiers.current")}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, type: "spring", stiffness: 280, damping: 28 }}
                className={`rounded-2xl border p-5 sm:p-6 ${
                  unlimited
                    ? "border-[#f093fb]/35 bg-[linear-gradient(135deg,rgba(240,147,251,0.13),rgba(245,87,108,0.07),rgba(7,7,10,0.65))] shadow-[0_24px_80px_-44px_rgba(245,87,108,0.8)]"
                    : "border-[#f093fb]/20 bg-kael-gradient-soft"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-zinc-400">
                      {t("tiers.current")}
                    </p>
                    <p className="kael-display mt-1 flex items-center gap-2 text-xl font-semibold text-zinc-50">
                      {currentTierName}
                      {unlimited && (
                        <span className="rounded-lg border border-[#f093fb]/30 bg-white/[0.06] px-2 py-1 text-sm font-medium tracking-[0.08em] text-[#f7a6ba]">
                          DEV
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-[#07070a]/70 px-3 py-2 text-sm text-zinc-300">
                    <span
                      className={`h-1.5 w-1.5 rounded-full bg-kael-gradient ${
                        unlimited ? "kael-pulse" : ""
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
                    <span className="text-zinc-400">
                      {unlimited
                        ? t("tiers.tokensProcessed", {
                            count: formatNumber(usage.tokensUsed, locale),
                          })
                        : t("tiers.tokensOf", {
                            used: formatNumber(usage.tokensUsed, locale),
                            limit: formatTokens(currentTier.tokenLimit, locale),
                          })}
                    </span>
                    <span className="tabular-nums text-zinc-300">
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
                    className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/[0.08]"
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: unlimited ? "100%" : `${Math.max(percent, 2)}%`,
                      }}
                      transition={{ type: "spring", stiffness: 90, damping: 22 }}
                      className={`h-full rounded-full bg-kael-gradient shadow-[0_0_18px_rgba(245,87,108,0.55)] ${
                        unlimited ? "kael-glow-pulse" : ""
                      }`}
                    />
                  </div>

                  <p className="mt-3 text-sm text-zinc-500">
                    {unlimited
                      ? t("tiers.unlimitedNote")
                      : t("tiers.limitReset", { date: resetLabel })}
                  </p>
                </div>
              </motion.section>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {visibleTiers.map((tier, index) => {
                  const Icon = TIER_ICONS[tier.id];
                  const active = tier.id === usage.tierId;
                  const isDev = tier.id === "dev";
                  const unavailable = !active && !isDev;
                  const tierCopy = TIER_TRANSLATION_KEYS[tier.id];
                  const tierName = t(tierCopy.name);

                  return (
                    <motion.section
                      key={tier.id}
                      layout
                      aria-label={tierName}
                      initial={{ opacity: 0, y: 16, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        delay: 0.08 + index * 0.045,
                        type: "spring",
                        stiffness: 290,
                        damping: 28,
                      }}
                      className={`flex flex-col rounded-2xl border p-5 transition-colors duration-300 ${
                        active && isDev
                          ? "border-[#f093fb]/45 bg-[linear-gradient(150deg,rgba(240,147,251,0.14),rgba(245,87,108,0.07),rgba(7,7,10,0.92))] shadow-[0_24px_80px_-38px_rgba(245,87,108,0.9)]"
                          : active
                            ? "border-[#f093fb]/35 bg-[#0d0a10]/90 shadow-[0_24px_70px_-38px_rgba(245,87,108,0.7)]"
                            : isDev
                              ? "border-[#f093fb]/30 bg-[linear-gradient(150deg,rgba(240,147,251,0.09),rgba(245,87,108,0.04),rgba(7,7,10,0.8))] hover:border-[#f093fb]/50"
                              : "border-white/[0.08] bg-[#07070a]/70 hover:border-white/[0.16]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                            active || isDev
                              ? "border-[#f093fb]/30 bg-kael-gradient-soft text-[#f7a6ba]"
                              : "border-white/[0.08] text-zinc-500"
                          }`}
                        >
                          <Icon size={17} strokeWidth={1.6} />
                        </span>
                        {active ? (
                          <span className="rounded-lg border border-[#f093fb]/25 bg-white/[0.05] px-2.5 py-1 text-sm text-[#f7a6ba]">
                            {t("tiers.active")}
                          </span>
                        ) : isDev ? (
                          <span className="rounded-lg border border-[#f093fb]/30 bg-white/[0.05] px-2.5 py-1 text-sm text-[#f7a6ba]">
                            {t("tiers.secret")}
                          </span>
                        ) : null}
                      </div>

                      <h3 className="kael-display mt-4 text-base font-semibold text-zinc-100">
                        {tierName}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-500">
                        {t(tierCopy.price)}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-zinc-400">
                        {t(tierCopy.description)}
                      </p>

                      <ul className="mt-4 flex-1 space-y-2.5">
                        {tierCopy.features.map((featureKey) => (
                          <li
                            key={featureKey}
                            className="flex items-start gap-2.5 text-sm leading-5 text-zinc-400"
                          >
                            <Check
                              size={15}
                              strokeWidth={2}
                              className="mt-0.5 shrink-0 text-[#f7a6ba]"
                            />
                            {t(featureKey)}
                          </li>
                        ))}
                      </ul>

                      <button
                        type="button"
                        onClick={() => {
                          if (isDev) {
                            onSelectTier(tier.id);
                          }
                        }}
                        disabled={active || unavailable}
                        title={
                          unavailable
                            ? t("tiers.unavailableTitle")
                            : undefined
                        }
                        className={`mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5576c]/35 ${
                          active
                            ? "cursor-default border border-white/[0.08] text-zinc-500"
                            : unavailable
                              ? "cursor-not-allowed border border-white/[0.06] bg-white/[0.025] text-zinc-500"
                              : "bg-kael-gradient text-[#1c0710] shadow-[0_14px_34px_-14px_rgba(245,87,108,0.75)] hover:brightness-110 active:scale-[0.98]"
                        }`}
                      >
                        {active ? (
                          t("tiers.currentButton")
                        ) : unavailable ? (
                          <>
                            <Lock size={14} strokeWidth={1.8} />
                            {t("tiers.unavailable")}
                          </>
                        ) : (
                          <>
                            {t("tiers.activate")}
                            <ArrowUpRight size={15} strokeWidth={1.8} />
                          </>
                        )}
                      </button>
                    </motion.section>
                  );
                })}
              </div>

              <p className="mt-5 text-sm leading-6 text-zinc-600">
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
