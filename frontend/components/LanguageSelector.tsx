"use client";

import { Check, ChevronDown, Languages } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "../lib/i18n";
import { LANGUAGES, type Language } from "../lib/translations";
import { playSfx } from "../lib/sfx";

export default function LanguageSelector() {
  const { language, setLanguage, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = useId();
  const selectedIndex = Math.max(
    0,
    LANGUAGES.findIndex((option) => option.id === language),
  );
  const selected = LANGUAGES[selectedIndex] ?? LANGUAGES[0];

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

  function selectLanguage(next: Language) {
    setLanguage(next);
    setOpen(false);
    playSfx("toggle");
    triggerRef.current?.focus();
  }

  function moveHighlight(nextIndex: number) {
    const count = LANGUAGES.length;
    const wrapped = ((nextIndex % count) + count) % count;
    setHighlighted(wrapped);
    optionRefs.current[wrapped]?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
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
      moveHighlight(LANGUAGES.length - 1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      if (document.activeElement?.getAttribute("role") === "option") {
        event.preventDefault();
        const option = LANGUAGES[highlighted];
        if (option) {
          selectLanguage(option.id);
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

  return (
    <div ref={rootRef} className="relative shrink-0" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          playSfx("click");
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={t("language.select")}
        title={`${t("language.label")}: ${selected?.name ?? ""}`}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#262626] bg-[#161616]/80 px-2.5 text-sm text-zinc-300 backdrop-blur-xl transition hover:border-[#10B981]/45 hover:text-zinc-100 focus-visible:border-[#10B981]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/30"
      >
        <Languages size={16} strokeWidth={1.7} className="shrink-0" />
        <span className="hidden text-sm font-medium tabular-nums sm:inline">
          {selected?.label}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={1.7}
          className={`hidden shrink-0 text-zinc-500 transition-transform duration-200 sm:block ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={listboxId}
            role="listbox"
            aria-label={t("language.label")}
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.7 }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-48 overflow-hidden rounded-2xl border border-[#262626] bg-[#161616]/95 p-2 shadow-[0_30px_90px_-28px_rgba(0,0,0,0.96)] backdrop-blur-xl"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[#10B981]/65 to-transparent"
            />

            {LANGUAGES.map((option, index) => {
              const active = option.id === language;
              const current = index === highlighted;

              return (
                <button
                  key={option.id}
                  ref={(element) => {
                    optionRefs.current[index] = element;
                  }}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onMouseEnter={() => setHighlighted(index)}
                  onClick={() => selectLanguage(option.id)}
                  className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition focus:outline-none focus-visible:bg-[#1C1C1C] focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#10B981]/35 ${
                    active
                      ? "bg-[#10B981]/10"
                      : current
                        ? "bg-[#1C1C1C]"
                        : "hover:bg-[#1C1C1C]"
                  }`}
                >
                  <span
                    className={`flex h-8 w-9 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold tabular-nums ${
                      active
                        ? "border-[#10B981]/30 bg-[#1C1C1C] text-[#34D399]"
                        : "border-[#262626] text-zinc-500"
                    }`}
                  >
                    {option.label}
                  </span>
                  <span
                    className={`min-w-0 flex-1 truncate text-sm ${
                      active ? "text-zinc-50" : "text-zinc-300"
                    }`}
                  >
                    {option.name}
                  </span>
                  {active && (
                    <Check
                      size={15}
                      strokeWidth={2}
                      className="shrink-0 text-[#34D399]"
                    />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
