"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useI18n } from "../lib/i18n";
import type { TranslationKey } from "../lib/translations";
import { KaelMascot } from "./KaelMascot";

type Step = { target: string; title: TranslationKey; text: TranslationKey };
type Box = { top: number; left: number; width: number; height: number };
type Viewport = { w: number; h: number };

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

export const KAEL_TOUR_DONE_KEY = "kael_tour_done";
export const KAEL_TOUR_DONE_EVENT = "kael:tour:done";
const EVENT = "kael:tour";
const SHADE = "rgba(4, 4, 4, 0.74)";
const CARD_WIDTH = 360;
const EDGE = 12;
const RING_PAD = 6;
const CARD_GAP = 16;

// useLayoutEffect warns during SSR; this avoids the warning while still
// measuring before the first paint in the browser.
const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Restart the tour from anywhere, for example from a header help button. */
export function restartKaelTour() {
  try {
    localStorage.removeItem(KAEL_TOUR_DONE_KEY);
  } catch {
    // Storage can be unavailable; the event still restarts the tour.
  }
  window.dispatchEvent(new Event(EVENT));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function isVisible(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return false;
  }

  const style = window.getComputedStyle(element);
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < window.innerHeight &&
    rect.left < window.innerWidth
  );
}

function findEl(target: string): HTMLElement | null {
  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`),
  );

  for (const element of nodes) {
    if (isVisible(element)) {
      return element;
    }
  }

  return null;
}

function sameBox(a: Box, b: Box) {
  return (
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}

function haptic() {
  try {
    navigator.vibrate?.(8);
  } catch {
    // Haptics are optional and not supported everywhere.
  }
}

export function KaelTour() {
  const { t } = useI18n();
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [index, setIndex] = useState(0);
  /** undefined = not measured yet, null = target disappeared. */
  const [rect, setRect] = useState<Box | null | undefined>(undefined);
  const [viewport, setViewport] = useState<Viewport>({ w: 0, h: 0 });
  const [cardHeight, setCardHeight] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const step = open ? steps[index] : undefined;

  const start = useCallback(() => {
    const available = TOUR_STEPS.filter((item) => findEl(item.target));
    if (!available.length) {
      return;
    }

    setSteps(available);
    setIndex(0);
    setRect(undefined);
    setOpen(true);
  }, []);

  const finish = useCallback((completed = false) => {
    try {
      localStorage.setItem(KAEL_TOUR_DONE_KEY, "1");
    } catch {
      // Storage can be unavailable; the tour simply shows next time.
    }

    setOpen(false);
    setSteps([]);
    setRect(undefined);
    setCardHeight(0);

    window.dispatchEvent(
      new CustomEvent(KAEL_TOUR_DONE_EVENT, { detail: { completed } }),
    );
  }, []);

  const next = useCallback(() => {
    if (!open) {
      return;
    }

    haptic();

    if (index >= steps.length - 1) {
      finish(true);
      return;
    }

    setRect(undefined);
    setIndex((current) => current + 1);
  }, [finish, index, open, steps.length]);

  // Portal target is only available in the browser.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-start on the first visit, but never fight the user's first action.
  useEffect(() => {
    let done = false;
    try {
      done = localStorage.getItem(KAEL_TOUR_DONE_KEY) === "1";
    } catch {
      // Storage can be unavailable; the tour still works once per load.
    }

    if (done) {
      return;
    }

    const timer = window.setTimeout(start, 900);
    return () => window.clearTimeout(timer);
  }, [start]);

  useEffect(() => {
    const onRestart = () => start();
    window.addEventListener(EVENT, onRestart);
    return () => window.removeEventListener(EVENT, onRestart);
  }, [start]);

  // Keep the spotlight glued to the target while the layout moves.
  const measure = useCallback(() => {
    if (!open || !step) {
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    setViewport((current) =>
      current.w === width && current.h === height
        ? current
        : { w: width, h: height },
    );

    const element = findEl(step.target);
    if (!element) {
      setRect(null);
      return;
    }

    const box = element.getBoundingClientRect();
    const nextBox: Box = {
      top: box.top,
      left: box.left,
      width: box.width,
      height: box.height,
    };

    setRect((current) =>
      current && sameBox(current, nextBox) ? current : nextBox,
    );
  }, [open, step]);

  useIsoLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    if (!open || !step) {
      return;
    }

    const element = findEl(step.target);
    if (element) {
      const box = element.getBoundingClientRect();
      const fullyVisible =
        box.top >= EDGE && box.bottom <= window.innerHeight - EDGE;

      if (!fullyVisible) {
        element.scrollIntoView({
          block: "nearest",
          inline: "nearest",
          behavior: "smooth",
        });
      }
    }

    const timer = window.setTimeout(measure, 380);
    const interval = window.setInterval(measure, 500);

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure, open, step]);

  // If the target vanished (sidebar collapsed, responsive rerender), move on
  // instead of leaving an invisible overlay stuck on screen.
  useEffect(() => {
    if (!open || rect !== null) {
      return;
    }

    const timer = window.setTimeout(() => {
      for (let candidate = index + 1; candidate < steps.length; candidate += 1) {
        if (findEl(steps[candidate].target)) {
          setRect(undefined);
          setIndex(candidate);
          return;
        }
      }

      finish();
    }, 120);

    return () => window.clearTimeout(timer);
  }, [finish, index, open, rect, steps]);

  // Interacting with the highlighted control means the user has learned the
  // step: close the tour instead of leaving the shade on screen.
  useEffect(() => {
    if (!open || !step) {
      return;
    }

    const onClick = (event: Event) => {
      const node = event.target;
      if (!(node instanceof Element)) {
        return;
      }

      if (node.closest(`[data-tour="${step.target}"]`)) {
        window.setTimeout(finish, 0);
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [finish, open, step]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        finish();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [finish, open]);

  // The card changes height between steps and on narrow screens.
  useIsoLayoutEffect(() => {
    const element = cardRef.current;
    if (!element || !open) {
      return;
    }

    const height = element.getBoundingClientRect().height;
    setCardHeight((current) =>
      Math.abs(current - height) > 0.5 ? height : current,
    );
  }, [index, open, steps.length, viewport.w]);

  useEffect(() => {
    const element = cardRef.current;
    if (!element || !open) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height;
      if (typeof height !== "number") {
        return;
      }

      setCardHeight((current) =>
        Math.abs(current - height) > 0.5 ? height : current,
      );
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [open]);

  if (
    !mounted ||
    !open ||
    !step ||
    !rect ||
    !viewport.w ||
    !viewport.h
  ) {
    return null;
  }

  const cardWidth = Math.min(CARD_WIDTH, viewport.w - EDGE * 2);
  const estimatedHeight = cardHeight > 0 ? cardHeight : 218;
  const targetBottom = rect.top + rect.height;
  const roomBelow = viewport.h - targetBottom;
  const roomAbove = rect.top;
  const hasRoomBelow = roomBelow >= estimatedHeight + CARD_GAP + EDGE;
  const hasRoomAbove = roomAbove >= estimatedHeight + CARD_GAP + EDGE;
  const below = hasRoomBelow || (!hasRoomAbove && roomBelow >= roomAbove);
  const rawTop = below
    ? targetBottom + CARD_GAP
    : rect.top - CARD_GAP - estimatedHeight;
  const top = clamp(
    rawTop,
    EDGE,
    viewport.h - estimatedHeight - EDGE,
  );
  const centerX = rect.left + rect.width / 2;
  const left = clamp(
    centerX - cardWidth / 2,
    EDGE,
    viewport.w - cardWidth - EDGE,
  );
  const arrowX = clamp(centerX - left, 22, cardWidth - 22);
  const arrowVisible = below
    ? top >= targetBottom
    : top + estimatedHeight <= rect.top;

  // Block the page around the spotlight instead of covering it. The hole keeps
  // the highlighted control clickable, so "Новый чат", the input, and the
  // send button work while the tour is open.
  const holeTop = clamp(rect.top - RING_PAD, 0, viewport.h);
  const holeLeft = clamp(rect.left - RING_PAD, 0, viewport.w);
  const holeRight = clamp(
    rect.left + rect.width + RING_PAD,
    0,
    viewport.w,
  );
  const holeBottom = clamp(
    targetBottom + RING_PAD,
    0,
    viewport.h,
  );
  const holeHeight = holeBottom - holeTop;

  const shadeStyle: CSSProperties = { background: SHADE };
  const isLast = index === steps.length - 1;
  const cardStyle: CSSProperties = {
    position: "fixed",
    top,
    left,
    width: cardWidth,
    zIndex: 10000,
    maxHeight: viewport.h - EDGE * 2,
    overflowY: "auto",
  };

  return createPortal(
    <>
      <div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-[9998]"
        style={{ ...shadeStyle, height: holeTop }}
      />
      <div
        aria-hidden="true"
        className="fixed inset-x-0 bottom-0 z-[9998]"
        style={{ ...shadeStyle, top: holeBottom }}
      />
      <div
        aria-hidden="true"
        className="fixed left-0 z-[9998]"
        style={{
          ...shadeStyle,
          top: holeTop,
          width: holeLeft,
          height: holeHeight,
        }}
      />
      <div
        aria-hidden="true"
        className="fixed right-0 z-[9998]"
        style={{
          ...shadeStyle,
          top: holeTop,
          left: holeRight,
          height: holeHeight,
        }}
      />

      <div
        aria-hidden="true"
        className="kael-ring pointer-events-none"
        style={{
          position: "fixed",
          zIndex: 9999,
          left: rect.left - RING_PAD,
          top: rect.top - RING_PAD,
          width: rect.width + RING_PAD * 2,
          height: rect.height + RING_PAD * 2,
          borderRadius: 14,
        }}
      />

      <div
        ref={cardRef}
        className="kael-tour-card kael-card-in"
        style={cardStyle}
        role="dialog"
        aria-modal={false}
        aria-labelledby={titleId}
      >
        {arrowVisible && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute h-3 w-3 rotate-45 border-[#262626] bg-[#161616]"
            style={
              below
                ? {
                    top: -6,
                    left: arrowX - 6,
                    borderLeftWidth: 1,
                    borderTopWidth: 1,
                  }
                : {
                    bottom: -6,
                    left: arrowX - 6,
                    borderRightWidth: 1,
                    borderBottomWidth: 1,
                  }
            }
          />
        )}

        <div className="flex items-start gap-3">
          <div className="shrink-0 pt-0.5">
            <KaelMascot
              size={44}
              float={false}
              look={below ? "up" : "down"}
              mood={isLast ? "happy" : "idle"}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-medium tracking-[0.08em] text-[#10B981]">
                {t("tour.step", {
                  current: index + 1,
                  total: steps.length,
                })}
              </span>
              <button
                type="button"
                onClick={() => finish()}
                aria-label={t("tour.close")}
                className="-mr-1 -mt-1 rounded-lg p-1 text-[#8E8E8A] transition hover:bg-[#1C1C1C] hover:text-[#F5F5F0]"
              >
                <X size={14} strokeWidth={1.8} />
              </button>
            </div>

            <h2
              id={titleId}
              className="mt-1.5 text-[13px] font-semibold leading-snug text-[#F5F5F0]"
            >
              {t(step.title)}
            </h2>
            <p className="mt-1 text-[13px] leading-[1.55] text-[#8E8E8A]">
              {t(step.text)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {steps.map((_, dotIndex) => (
              <span
                key={dotIndex}
                className={`h-1.5 rounded-full transition-all ${
                  dotIndex === index
                    ? "w-4 bg-[#10B981]"
                    : "w-1.5 bg-[#333333]"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!isLast && (
              <button
                type="button"
                className="kael-btn-ghost"
                onClick={() => finish()}
              >
                {t("tour.skip")}
              </button>
            )}
            <button
              type="button"
              className="kael-btn"
              style={{
                padding: "0.5rem 1.05rem",
                fontSize: "0.82rem",
                borderRadius: 10,
              }}
              onClick={next}
            >
              {isLast ? t("tour.done") : t("tour.next")}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
