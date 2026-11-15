"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../lib/i18n";
import {
  MoodBag,
  THINKING_MOODS,
  nextTypingMood,
  thinkingMoodDelay,
  type MascotPhase,
} from "../lib/mascot";
import type { SlimeMood } from "../lib/slime";
import type { TranslationKey } from "../lib/translations";
import { SlimeMascot } from "./SlimeMascot";

const POKE_KEYS = [
  "mascot.poke0",
  "mascot.poke1",
  "mascot.poke2",
  "mascot.poke3",
] as const satisfies readonly TranslationKey[];

const POKE_REACTIONS: readonly SlimeMood[] = [
  "laugh",
  "love",
  "wink",
  "surprised",
  "shy",
];

const WANDER_MOODS: readonly SlimeMood[] = ["happy", "cool", "wink"];

type RoamAction =
  | "settle"
  | "wander"
  | "sprint"
  | "hop"
  | "peek"
  | "dance"
  | "spin"
  | "rest";

type Pose = {
  x: number;
  y: number;
  duration: number;
  facing: 1 | -1;
  action: RoamAction;
};

type Point = { x: number; y: number };
type Viewport = { width: number; height: number };
type AnchorBox = { top: number; right: number };

type RoamStep = {
  pose: Pose;
  mood: SlimeMood | null;
  moodMs: number;
  wait: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pickOne<T>(items: readonly T[], fallback: T): T {
  return items[Math.floor(Math.random() * items.length)] ?? fallback;
}

/** Rotates through expressive moods while the model works or types. */
function useMascotMood(phase: MascotPhase, answerMood: SlimeMood): SlimeMood {
  const [mood, setMood] = useState<SlimeMood>("idle");

  useEffect(() => {
    let timer: number | null = null;
    let cancelled = false;

    if (phase === "thinking") {
      const bag = new MoodBag(THINKING_MOODS);

      const schedule = (delay: number) => {
        timer = window.setTimeout(() => {
          if (cancelled) {
            return;
          }
          setMood(bag.next());
          schedule(thinkingMoodDelay());
        }, delay);
      };

      setMood(bag.next());
      schedule(thinkingMoodDelay());
    } else if (phase === "typing") {
      setMood(answerMood);
      timer = window.setTimeout(() => {
        if (!cancelled) {
          setMood(nextTypingMood(answerMood));
        }
      }, 620);
    } else if (phase === "done") {
      setMood("jump");
      timer = window.setTimeout(() => {
        if (!cancelled) {
          setMood("idle");
        }
      }, 2200);
    } else if (phase === "error") {
      setMood(answerMood);
      timer = window.setTimeout(() => {
        if (!cancelled) {
          setMood("idle");
        }
      }, 2600);
    } else {
      setMood("idle");
    }

    return () => {
      cancelled = true;
      if (timer !== null) {
        window.clearTimeout(timer);
      }
    };
  }, [answerMood, phase]);

  return mood;
}

function buildPose(
  previous: Pose,
  x: number,
  y: number,
  duration: number,
  action: RoamAction,
): Pose {
  const facing: 1 | -1 =
    x < previous.x - 2 ? -1 : x > previous.x + 2 ? 1 : previous.facing;

  return {
    x: Math.round(x),
    y: Math.round(y),
    duration: Math.round(Math.max(0, duration)),
    facing,
    action,
  };
}

/**
 * Picks the next thing the slime does on its own. Movement stays in the band
 * above the composer, so the chat column is never covered by a stationary
 * blob and the input is never blocked.
 */
function chooseRoamAction(
  previous: Pose,
  viewport: Viewport,
  size: number,
  height: number,
  home: Point,
): RoamStep {
  const minX = 10;
  const maxX = Math.max(minX, viewport.width - size - 10);
  const minY = Math.max(80, viewport.height * 0.07);
  const maxY = Math.max(
    minY,
    Math.min(home.y + height * 0.04, viewport.height - height - 10),
  );
  const spanY = Math.max(0, maxY - minY);

  const roll = Math.random();

  if (roll < 0.32) {
    const x = randomBetween(minX, maxX);
    const y = maxY - Math.random() * spanY * 0.7;
    const distance = Math.hypot(x - previous.x, y - previous.y);

    return {
      pose: buildPose(
        previous,
        x,
        y,
        clamp(distance * randomBetween(8, 12), 900, 2800),
        "wander",
      ),
      mood:
        Math.random() < 0.55 ? pickOne(WANDER_MOODS, "happy") : null,
      moodMs: 1300,
      wait: randomBetween(2600, 5200),
    };
  }

  if (roll < 0.48) {
    const toRight = previous.x < viewport.width / 2;
    const x = toRight
      ? randomBetween(viewport.width * 0.68, maxX)
      : randomBetween(minX, viewport.width * 0.32);
    const y = randomBetween(maxY - spanY * 0.18, maxY);
    const distance = Math.hypot(x - previous.x, y - previous.y);

    return {
      pose: buildPose(
        previous,
        clamp(x, minX, maxX),
        clamp(y, minY, maxY),
        clamp(distance * 4.2, 520, 1100),
        "sprint",
      ),
      mood: "excited",
      moodMs: 1600,
      wait: randomBetween(2200, 3800),
    };
  }

  if (roll < 0.64) {
    const x = clamp(previous.x + randomBetween(-38, 38), minX, maxX);

    return {
      pose: buildPose(previous, x, previous.y, 260, "hop"),
      mood: "jump",
      moodMs: 1500,
      wait: randomBetween(2200, 4200),
    };
  }

  if (roll < 0.76) {
    const x = previous.x > viewport.width / 2 ? minX : maxX;
    const y = minY + spanY * 0.18;
    const distance = Math.hypot(x - previous.x, y - previous.y);

    return {
      pose: buildPose(
        previous,
        x,
        y,
        clamp(distance * 8.5, 900, 2200),
        "peek",
      ),
      mood: "sneaky",
      moodMs: 2200,
      wait: randomBetween(2800, 4800),
    };
  }

  if (roll < 0.86) {
    return {
      pose: buildPose(previous, previous.x, previous.y, 0, "dance"),
      mood: "laugh",
      moodMs: 2000,
      wait: randomBetween(2600, 4200),
    };
  }

  if (roll < 0.93) {
    return {
      pose: buildPose(previous, previous.x, previous.y, 0, "spin"),
      mood: "dizzy",
      moodMs: 1700,
      wait: randomBetween(2800, 4400),
    };
  }

  return {
    pose: buildPose(
      previous,
      clamp(home.x, minX, maxX),
      clamp(home.y, minY, maxY),
      clamp(
        Math.hypot(home.x - previous.x, home.y - previous.y) *
          randomBetween(7, 10),
        600,
        1900,
      ),
      "rest",
    ),
    mood: "sleepy",
    moodMs: 6000,
    wait: randomBetween(7000, 10000),
  };
}

export type MascotCompanionProps = {
  phase: MascotPhase;
  /** Face chosen for the finished answer; shown while it is typed out. */
  answerMood: SlimeMood;
  /** When false the companion is not rendered at all. */
  enabled?: boolean;
  /** Manual preference that wins over the system reduced-motion setting. */
  forceReduceMotion?: boolean;
  className?: string;
};

/**
 * The slime companion. It lives in a fixed layer portaled to `document.body`,
 * so it can run around the screen without being clipped by the composer.
 * It returns home and reacts whenever the model is thinking, typing, done, or
 * has failed, and it stays fully still when the user prefers reduced motion.
 */
export function MascotCompanion({
  phase,
  answerMood,
  enabled = true,
  forceReduceMotion = false,
  className = "",
}: MascotCompanionProps) {
  const { t } = useI18n();
  const mood = useMascotMood(phase, answerMood);

  const [host, setHost] = useState<HTMLElement | null>(null);
  const [viewport, setViewport] = useState<Viewport>({ width: 0, height: 0 });
  const [anchor, setAnchor] = useState<AnchorBox | null>(null);
  const [pose, setPose] = useState<Pose | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [moving, setMoving] = useState(false);
  const [override, setOverride] = useState<SlimeMood | null>(null);
  const [bubble, setBubble] = useState<string | null>(null);
  const reducedMotion = forceReduceMotion || prefersReducedMotion;

  const poseRef = useRef<Pose | null>(null);
  const bubbleTimer = useRef<number | null>(null);
  const overrideTimer = useRef<number | null>(null);
  const moveTimer = useRef<number | null>(null);
  const tRef = useRef(t);
  tRef.current = t;

  const size = viewport.width >= 1024 ? 128 : viewport.width >= 640 ? 118 : 92;
  const height = Math.round(size * 0.85);

  const home = useMemo<Point>(() => {
    if (viewport.width === 0) {
      return { x: 0, y: 0 };
    }

    const inset = 10;
    const rightPad = viewport.width < 640 ? 12 : 24;
    const fallback = {
      x: clamp(
        viewport.width - size - rightPad,
        inset,
        viewport.width - size - inset,
      ),
      y: clamp(
        viewport.height - height - 180,
        inset,
        viewport.height - height - inset,
      ),
    };

    if (!anchor) {
      return fallback;
    }

    return {
      x: clamp(
        anchor.right - size - rightPad,
        inset,
        viewport.width - size - inset,
      ),
      y: clamp(
        anchor.top - height * 0.92,
        inset,
        viewport.height - height - inset,
      ),
    };
  }, [anchor, height, size, viewport.height, viewport.width]);

  const homeRef = useRef(home);
  homeRef.current = home;

  const applyPose = useCallback((next: Pose) => {
    poseRef.current = next;
    setPose(next);

    if (moveTimer.current !== null) {
      window.clearTimeout(moveTimer.current);
      moveTimer.current = null;
    }

    if (next.duration >= 450) {
      setMoving(true);
      moveTimer.current = window.setTimeout(() => {
        moveTimer.current = null;
        setMoving(false);
      }, next.duration + 90);
    } else {
      setMoving(false);
    }
  }, []);

  const flashMood = useCallback((next: SlimeMood, duration: number) => {
    if (overrideTimer.current !== null) {
      window.clearTimeout(overrideTimer.current);
    }

    setOverride(next);
    overrideTimer.current = window.setTimeout(() => {
      overrideTimer.current = null;
      setOverride(null);
    }, duration);
  }, []);

  const clearFlash = useCallback(() => {
    if (overrideTimer.current !== null) {
      window.clearTimeout(overrideTimer.current);
      overrideTimer.current = null;
    }
    setOverride(null);
  }, []);

  const showBubble = useCallback((text: string) => {
    setBubble(text);

    if (bubbleTimer.current !== null) {
      window.clearTimeout(bubbleTimer.current);
    }

    bubbleTimer.current = window.setTimeout(() => {
      bubbleTimer.current = null;
      setBubble(null);
    }, 2400);
  }, []);

  const handlePoke = useCallback(() => {
    showBubble(tRef.current(pickOne(POKE_KEYS, POKE_KEYS[0])));
    flashMood(pickOne(POKE_REACTIONS, "laugh"), 1500);
  }, [flashMood, showBubble]);

  useEffect(() => {
    setHost(document.body);
  }, []);

  useEffect(() => {
    const update = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });

    update();
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    const measure = () => {
      const element = document.querySelector<HTMLElement>(
        "[data-mascot-anchor]",
      );

      if (!element) {
        setAnchor(null);
        return;
      }

      const rect = element.getBoundingClientRect();
      setAnchor({ top: rect.top, right: rect.right });
    };

    measure();
    window.addEventListener("resize", measure);

    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);
    const element = document.querySelector<HTMLElement>(
      "[data-mascot-anchor]",
    );

    if (element && observer) {
      observer.observe(element);
    }

    return () => {
      window.removeEventListener("resize", measure);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(query.matches);

    update();
    query.addEventListener("change", update);

    return () => {
      query.removeEventListener("change", update);
    };
  }, []);

  // Seed the very first pose once the viewport is known.
  useEffect(() => {
    if (viewport.width === 0 || poseRef.current !== null) {
      return;
    }

    applyPose({
      x: homeRef.current.x,
      y: homeRef.current.y,
      duration: 0,
      facing: 1,
      action: "settle",
    });
  }, [applyPose, viewport.width]);

  // Keep following the composer while it is settled (for example while the
  // textarea grows with a long message).
  useEffect(() => {
    const current = poseRef.current;

    if (!anchor || !current || current.action !== "settle") {
      return;
    }

    applyPose({
      x: homeRef.current.x,
      y: homeRef.current.y,
      duration: 240,
      facing: current.facing,
      action: "settle",
    });
  }, [anchor, applyPose]);

  // Keep the slime inside the viewport after a resize or rotation.
  useEffect(() => {
    const current = poseRef.current;

    if (viewport.width === 0 || !current) {
      return;
    }

    const x = clamp(current.x, 10, Math.max(10, viewport.width - size - 10));
    const y = clamp(
      current.y,
      80,
      Math.max(80, viewport.height - height - 10),
    );

    if (x !== current.x || y !== current.y) {
      applyPose({ ...current, x, y, duration: 240 });
    }
  }, [applyPose, height, size, viewport.height, viewport.width]);

  // Roaming loop. Busy phases pull the slime back above the composer; idle
  // phases send it wandering again after a short pause.
  useEffect(() => {
    if (!enabled || viewport.width === 0 || poseRef.current === null) {
      return;
    }

    if (reducedMotion || phase !== "idle") {
      clearFlash();
      applyPose({
        x: homeRef.current.x,
        y: homeRef.current.y,
        duration: reducedMotion ? 0 : 360,
        facing: poseRef.current.facing,
        action: "settle",
      });
      return;
    }

    let cancelled = false;
    let timer: number | null = null;
    let wait = 2600;

    const schedule = () => {
      timer = window.setTimeout(() => {
        if (cancelled) {
          return;
        }

        const current = poseRef.current;

        if (!document.hidden && current) {
          const step = chooseRoamAction(
            current,
            viewport,
            size,
            height,
            homeRef.current,
          );

          applyPose(step.pose);

          if (step.mood !== null) {
            flashMood(step.mood, step.moodMs);
          }

          wait = step.wait;
        } else {
          wait = 3200;
        }

        schedule();
      }, wait);
    };

    schedule();

    return () => {
      cancelled = true;
      if (timer !== null) {
        window.clearTimeout(timer);
      }
    };
  }, [
    applyPose,
    clearFlash,
    enabled,
    flashMood,
    height,
    phase,
    reducedMotion,
    size,
    viewport,
  ]);

  // Bubbles belong to idle chatter; hide them as soon as real work starts.
  useEffect(() => {
    if (phase === "idle") {
      return;
    }

    setBubble(null);
    if (bubbleTimer.current !== null) {
      window.clearTimeout(bubbleTimer.current);
      bubbleTimer.current = null;
    }
  }, [phase]);

  useEffect(
    () => () => {
      if (bubbleTimer.current !== null) {
        window.clearTimeout(bubbleTimer.current);
      }
      if (overrideTimer.current !== null) {
        window.clearTimeout(overrideTimer.current);
      }
      if (moveTimer.current !== null) {
        window.clearTimeout(moveTimer.current);
      }
    },
    [],
  );

  if (!enabled || !host || !pose || viewport.width === 0) {
    return null;
  }

  const displayMood = override ?? mood;
  const bubbleOnRight = pose.x + size / 2 > viewport.width / 2;
  const motionClass =
    pose.action === "dance"
      ? "kael-mascot-dance"
      : pose.action === "spin"
        ? "kael-mascot-spin"
        : moving
          ? "kael-mascot-run"
          : "";

  return createPortal(
    <div
      aria-hidden="true"
      data-kael-mascot="true"
      data-action={pose.action}
      className={`pointer-events-none fixed left-0 top-0 z-20 select-none ${className}`}
      style={{
        width: size,
        height,
        transform: `translate3d(${pose.x}px, ${pose.y}px, 0)`,
        transition:
          pose.duration > 0
            ? `transform ${pose.duration}ms cubic-bezier(0.22, 0.61, 0.36, 1)`
            : "none",
        willChange: "transform",
      }}
    >
      {bubble !== null && (
        <span
          className={`absolute bottom-full mb-1.5 block w-max max-w-[min(210px,46vw)] rounded-xl border border-[#262626] bg-[#161616]/95 px-3 py-1.5 text-center text-xs leading-5 text-[#F5F5F0] shadow-[0_18px_40px_-24px_rgba(0,0,0,0.95)] backdrop-blur-sm ${
            bubbleOnRight ? "right-0" : "left-0"
          }`}
        >
          {bubble}
        </span>
      )}

      <div
        className="h-full w-full"
        style={{
          transform: `scaleX(${pose.facing})`,
          transition: "transform 220ms ease",
        }}
      >
        <div className={`pointer-events-auto h-full w-full ${motionClass}`}>
          <SlimeMascot mood={displayMood} onPoke={handlePoke} />
        </div>
      </div>
    </div>,
    host,
  );
}
