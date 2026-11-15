"use client";

import { Boxes, Check, ChevronDown, Cloud, Cpu, Gem, Zap } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "../lib/i18n";
import {
  ALL_MODELS,
  MODEL_GROUPS,
  findModel,
  type ModelOption,
  type ProviderId,
} from "../lib/models";
import {
  MODEL_DESCRIPTION_KEYS,
  MODEL_GROUP_HINT_KEYS,
} from "../lib/translations";

type ModelSelectorProps = {
  value: string;
  onChange: (modelId: string) => void;
  disabled?: boolean;
};

const PROVIDER_ICONS: Record<ProviderId, typeof Cloud> = {
  openrouter: Cloud,
  groq: Zap,
  ollama: Cpu,
  zerocat: Boxes,
  gemini: Gem,
};

const MODEL_INDEX = new Map(
  ALL_MODELS.map((model, index) => [model.id, index] as const),
);

export default function ModelSelector({
  value,
  onChange,
  disabled = false,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const { t } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = useId();
  const selectedModel = findModel(value);
  const flatModels = ALL_MODELS;
  const selectedIndex = flatModels.findIndex((model) => model.id === value);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const initialIndex = selectedIndex >= 0 ? selectedIndex : 0;
    setHighlighted(initialIndex);
    const frame = window.requestAnimationFrame(() => {
      optionRefs.current[initialIndex]?.focus();
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

  function selectModel(model: ModelOption) {
    onChange(model.id);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function moveHighlight(nextIndex: number) {
    const count = flatModels.length;
    if (count === 0) {
      return;
    }

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
      moveHighlight(flatModels.length - 1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      if (document.activeElement?.getAttribute("role") === "option") {
        event.preventDefault();
        const model = flatModels[highlighted];
        if (model) {
          selectModel(model);
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
    <div ref={rootRef} className="relative min-w-0 flex-1 sm:flex-none" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        disabled={disabled}
        data-tour="model"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={
          selectedModel
            ? t("model.aria", { name: selectedModel.name })
            : t("model.selectAria")
        }
        title={selectedModel?.id}
        className="flex h-10 w-full max-w-none min-w-0 items-center gap-2 rounded-xl border border-[#262626] bg-[#161616]/80 px-3 text-sm text-zinc-200 backdrop-blur-xl transition-all hover:border-[#10B981]/50 focus-visible:border-[#10B981]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/30 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:max-w-[220px]"
      >
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#10B981] shadow-none" />
        <span className="min-w-0 flex-1 truncate text-left">
          {selectedModel?.name ?? t("model.fallback")}
        </span>
        <ChevronDown
          size={15}
          strokeWidth={1.7}
          className={`shrink-0 text-zinc-500 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={listboxId}
            role="listbox"
            aria-label={t("model.selectAria")}
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.7 }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 top-[calc(100%+0.5rem)] z-50 max-h-[min(78vh,640px)] w-[min(86vw,340px)] overflow-y-auto overscroll-contain rounded-2xl border border-[#262626] bg-[#161616]/95 p-2 shadow-[0_30px_90px_-28px_rgba(0,0,0,0.96)] backdrop-blur-xl"
          >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[#10B981]/65 to-transparent"
          />

          {MODEL_GROUPS.map((group) => {
            const Icon = PROVIDER_ICONS[group.provider];
            const headingId = `${listboxId}-${group.provider}`;

            return (
              <div
                key={group.provider}
                role="group"
                aria-labelledby={headingId}
                className="pb-1 last:pb-0"
              >
                <div className="flex items-center gap-2 px-3 pb-1 pt-2.5">
                  <Icon
                    size={14}
                    strokeWidth={1.6}
                    className="shrink-0 text-[#34D399]"
                  />
                  <span
                    id={headingId}
                    className="kael-display text-sm font-medium uppercase tracking-[0.12em] text-zinc-400"
                  >
                    {group.label}
                  </span>
                  <span className="ml-auto text-sm text-zinc-600">
                    {t(MODEL_GROUP_HINT_KEYS[group.provider])}
                  </span>
                </div>

                <div className="space-y-0.5">
                  {group.models.map((model) => {
                    const index = MODEL_INDEX.get(model.id) ?? 0;
                    const active = model.id === value;
                    const current = index === highlighted;

                    return (
                      <button
                        key={model.id}
                        ref={(element) => {
                          optionRefs.current[index] = element;
                        }}
                        type="button"
                        role="option"
                        aria-selected={active}
                        title={`${group.label} · ${model.id}`}
                        onMouseEnter={() => setHighlighted(index)}
                        onClick={() => selectModel(model)}
                        className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition focus:outline-none focus-visible:bg-[#1C1C1C] focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#10B981]/35 ${
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

                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-sm font-medium ${
                              active ? "text-zinc-50" : "text-zinc-200"
                            }`}
                          >
                            {model.name}
                          </span>
                          <span className="mt-0.5 block truncate text-sm leading-5 text-zinc-500">
                            {MODEL_DESCRIPTION_KEYS[model.id]
                              ? t(MODEL_DESCRIPTION_KEYS[model.id])
                              : model.description}
                          </span>
                        </span>

                        {active ? (
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#1C1C1C] text-[#34D399]">
                            <Check size={14} strokeWidth={2} />
                          </span>
                        ) : (
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                              current ? "bg-[#10B981]" : "bg-[#262626]"
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
