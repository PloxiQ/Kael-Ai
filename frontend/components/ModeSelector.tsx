"use client";

import { Brain, Scale, Zap } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "../lib/i18n";
import {
  MODE_OPTIONS,
  type ResponseMode,
} from "../lib/modes";
import { MODE_TRANSLATION_KEYS } from "../lib/translations";

type ModeSelectorProps = {
  value: ResponseMode;
  onChange: (mode: ResponseMode) => void;
  disabled?: boolean;
};

const MODE_ICONS: Record<ResponseMode, typeof Zap> = {
  fast: Zap,
  balanced: Scale,
  deep: Brain,
};

export default function ModeSelector({
  value,
  onChange,
  disabled = false,
}: ModeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const { t } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = useId();
  const selectedMode = MODE_TRANSLATION_KEYS[value];
  const selectedIndex = Math.max(
    0,
    MODE_OPTIONS.findIndex((mode) => mode.id === value),
  );

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    setHighlighted(selectedIndex);
    const frame = window.requestAnimationFrame(() => {
      optionRefs.current[selectedIndex]?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, selectedIndex]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleDocumentKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [open]);

  function selectMode(modeId: ResponseMode) {
    onChange(modeId);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function moveHighlight(nextIndex: number) {
    const count = MODE_OPTIONS.length;
    const wrapped = ((nextIndex % count) + count) % count;
    setHighlighted(wrapped);
    optionRefs.current[wrapped]?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (disabled) {
      return;
    }

    if (!open) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveHighlight(highlighted + 1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveHighlight(highlighted - 1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      moveHighlight(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      moveHighlight(MODE_OPTIONS.length - 1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      if (document.activeElement?.getAttribute("role") === "option") {
        event.preventDefault();
        const mode = MODE_OPTIONS[highlighted];
        if (mode) {
          selectMode(mode.id);
        }
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (event.key === "Tab") {
      setOpen(false);
    }
  }

  const TriggerIcon = MODE_ICONS[value];

  return (
    <div ref={rootRef} className="relative shrink-0" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        disabled={disabled}
        data-tour="mode"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={t("mode.aria", { label: t(selectedMode.label) })}
        title={t(selectedMode.description)}
        className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/30 disabled:cursor-not-allowed disabled:opacity-50 ${
          value === "balanced"
            ? "border-[#262626] bg-[#161616]/80 text-zinc-200 hover:border-[#10B981]/50"
            : "border-[#10B981]/30 bg-[#10B981]/10 text-zinc-100 hover:border-[#10B981]/50"
        }`}
      >
        <TriggerIcon
          size={16}
          strokeWidth={1.6}
          className={value === "deep" ? "text-[#34D399]" : "text-zinc-400"}
        />
        <span className="hidden lg:inline">
          {t(selectedMode.label)}
        </span>
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#10B981] shadow-none"
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={listboxId}
            role="listbox"
            aria-label={t("mode.listAria")}
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.7 }}
            style={{ transformOrigin: "top right" }}
            className="fixed left-4 right-4 top-[7rem] z-50 overflow-hidden rounded-2xl border border-[#262626] bg-[#161616]/95 p-2 shadow-[0_30px_90px_-28px_rgba(0,0,0,0.96)] backdrop-blur-xl sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+0.5rem)] sm:w-[min(88vw,320px)]"
          >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[#10B981]/65 to-transparent"
          />

          <p className="px-3 pb-1 pt-2 text-sm text-zinc-500">
            {t("mode.hint")}
          </p>

          <div className="space-y-0.5">
            {MODE_OPTIONS.map((mode, index) => {
              const Icon = MODE_ICONS[mode.id];
              const active = mode.id === value;
              const current = index === highlighted;

              return (
                <button
                  key={mode.id}
                  ref={(element) => {
                    optionRefs.current[index] = element;
                  }}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onMouseEnter={() => setHighlighted(index)}
                  onClick={() => selectMode(mode.id)}
                  className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition focus:outline-none focus-visible:bg-[#1C1C1C] focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#10B981]/35 ${
                    active
                      ? "bg-[#10B981]/10"
                      : current
                        ? "bg-[#1C1C1C]"
                        : "hover:bg-[#1C1C1C]"
                  }`}
                >
                  {active && (
                    <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[#10B981]" />
                  )}

                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                      active
                        ? "border-[#10B981]/30 bg-[#1C1C1C] text-[#34D399]"
                        : "border-[#262626] text-zinc-500"
                    }`}
                  >
                    <Icon size={17} strokeWidth={1.6} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-sm font-medium ${
                        active ? "text-zinc-50" : "text-zinc-200"
                      }`}
                    >
                      {t(MODE_TRANSLATION_KEYS[mode.id].label)}
                    </span>
                    <span className="mt-0.5 block text-sm leading-5 text-zinc-500">
                      {t(MODE_TRANSLATION_KEYS[mode.id].description)}
                    </span>
                  </span>

                  <span
                    aria-hidden="true"
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      active
                        ? "bg-[#10B981]"
                        : current
                          ? "bg-[#10B981]"
                          : "bg-[#262626]"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
