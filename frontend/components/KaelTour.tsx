"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "../lib/i18n";
import type { TranslationKey } from "../lib/translations";
import { KaelMascot } from "./KaelMascot";

type Step = { target: string; title: TranslationKey; text: TranslationKey };

/**
 * target = the value of a data-tour attribute in the interface.
 * Steps whose element is not visible (for example, a collapsed sidebar) are
 * skipped automatically.
 */
export const TOUR_STEPS: Step[] = [
  {
    target: "new-chat",
    title: "tour.newChat.title",
    text: "tour.newChat.text",
  },
  {
    target: "mode",
    title: "tour.mode.title",
    text: "tour.mode.text",
  },
  {
    target: "model",
    title: "tour.model.title",
    text: "tour.model.text",
  },
  {
    target: "attach",
    title: "tour.attach.title",
    text: "tour.attach.text",
  },
  {
    target: "input",
    title: "tour.input.title",
    text: "tour.input.text",
  },
  {
    target: "send",
    title: "tour.send.title",
    text: "tour.send.text",
  },
];

const DONE_KEY = "kael_tour_done";
const EVENT = "kael:tour";

/** Restart the tour from anywhere, for example from a header help button. */
export function restartKaelTour() {
  try {
    localStorage.removeItem(DONE_KEY);
  } catch {
    // Storage can be unavailable; the event still restarts the tour.
  }
  window.dispatchEvent(new Event(EVENT));
}

function findEl(target: string): HTMLElement | null {
  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`),
  );
  for (const element of nodes) {
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return element;
    }
  }
  return null;
}

function haptic() {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred("light");
  } catch {
    // Haptics are optional.
  }
}

export function KaelTour() {
  const { t } = useI18n();
  const [steps, setSteps] = useState<Step[]>([]);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });

  const start = useCallback(() => {
    const available = TOUR_STEPS.filter((step) => findEl(step.target));
    if (!available.length) {
      return;
    }
    setIndex(0);
    setSteps(available);
  }, []);

  // Auto-start on the first visit and support a manual restart.
  useEffect(() => {
    let done = false;
    try {
      done = localStorage.getItem(DONE_KEY) === "1";
    } catch {
      // Storage can be unavailable; the tour still works once per load.
    }

    const timer = done ? undefined : window.setTimeout(start, 1200);
    const onRestart = () => window.setTimeout(start, 200);
    window.addEventListener(EVENT, onRestart);

    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
      window.removeEventListener(EVENT, onRestart);
    };
  }, [start]);

  const step = steps[index];

  const measure = useCallback(() => {
    if (!step) {
      return;
    }
    const element = findEl(step.target);
    setViewport({ w: window.innerWidth, h: window.innerHeight });
    setRect(element ? element.getBoundingClientRect() : null);
  }, [step]);

  useEffect(() => {
    if (!step) {
      return;
    }

    findEl(step.target)?.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
    measure();

    const timer = window.setTimeout(measure, 350);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step, measure]);

  const finish = useCallback(() => {
    try {
      localStorage.setItem(DONE_KEY, "1");
    } catch {
      // Storage can be unavailable; the tour simply shows next time.
    }
    setSteps([]);
    setRect(null);
  }, []);

  const next = useCallback(() => {
    haptic();
    if (index >= steps.length - 1) {
      finish();
    } else {
      setIndex((current) => current + 1);
    }
  }, [index, steps.length, finish]);

  if (!step || !rect) {
    return null;
  }

  const pad = 6;
  const gap = 44; // room for the pointer arrow
  const bubbleWidth = Math.min(340, viewport.w - 24);
  const bubbleBelow = rect.top < viewport.h / 2;
  const centerX = rect.left + rect.width / 2;
  const left = Math.max(
    12,
    Math.min(centerX - bubbleWidth / 2, viewport.w - bubbleWidth - 12),
  );
  const bubblePosition = bubbleBelow
    ? { top: rect.bottom + pad + gap }
    : { bottom: viewport.h - rect.top + pad + gap };
  const pointerPosition = bubbleBelow
    ? { top: rect.bottom + pad + 6, left: centerX - 10 }
    : { bottom: viewport.h - rect.top + pad + 6, left: centerX - 10 };
  const isLast = index === steps.length - 1;

  return (
    <>
      <div
        className="fixed inset-0 z-[9998]"
        onClick={(event) => event.stopPropagation()}
      />

      <div
        className="kael-ring pointer-events-none fixed z-[9999]"
        style={{
          left: rect.left - pad,
          top: rect.top - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
          borderRadius: 14,
        }}
      />

      <div
        className={`kael-pointer ${
          bubbleBelow ? "kael-pointer-up" : "kael-pointer-down"
        }`}
        style={pointerPosition}
      >
        {bubbleBelow ? "▲" : "▼"}
      </div>

      <div
        className="kael-card fixed z-[10000] flex items-start gap-3 p-4"
        style={{ left, width: bubbleWidth, ...bubblePosition }}
        role="dialog"
        aria-label={t(step.title)}
      >
        <KaelMascot
          size={64}
          look={bubbleBelow ? "up" : "down"}
          mood={isLast ? "happy" : "idle"}
        />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold tracking-wide text-[#f7a6ba]">
            {t(step.title)}
          </div>
          <p className="mt-1 text-sm leading-snug text-zinc-200">
            {t(step.text)}
          </p>

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex gap-1.5">
              {steps.map((_, dotIndex) => (
                <span
                  key={dotIndex}
                  className={`h-1.5 rounded-full transition-all ${
                    dotIndex === index
                      ? "w-4 bg-[#f5576c]"
                      : "w-1.5 bg-[#f093fb]/40"
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              {!isLast && (
                <button className="kael-btn-ghost" onClick={finish}>
                  {t("tour.skip")}
                </button>
              )}
              <button
                className="kael-btn"
                style={{
                  padding: "0.5rem 1.1rem",
                  fontSize: "0.85rem",
                  borderRadius: 12,
                }}
                onClick={next}
              >
                {isLast ? t("tour.done") : t("tour.next")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
