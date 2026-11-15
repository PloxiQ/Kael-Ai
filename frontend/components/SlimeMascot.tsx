"use client";

import { useEffect, useRef, useState } from "react";
import {
  loadSlime,
  type SlimeController,
  type SlimeMood,
} from "../lib/slime";

export type SlimeMascotProps = {
  /** Current face. The wrapper keeps the controller in sync with this prop. */
  mood?: SlimeMood;
  /** Milliseconds of inactivity before the slime falls asleep. `0` disables it. */
  idleSleepMs?: number;
  /** Let the slime's eyes follow the pointer. */
  trackPointer?: boolean;
  /** Fired on click, tap, or the bundle's own poke event. */
  onPoke?: () => void;
  /** Gives the page access to the controller once the bundle is mounted. */
  onReady?: (controller: SlimeController) => void;
  className?: string;
};

/**
 * Typed React wrapper around the vanilla slime bundle in `public/mascot`.
 * The bundle is loaded lazily on first mount, so the mascot never runs during
 * SSR or static export generation.
 */
export function SlimeMascot({
  mood = "idle",
  idleSleepMs = 24_000,
  trackPointer = true,
  onPoke,
  onReady,
  className = "",
}: SlimeMascotProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SlimeController | null>(null);
  const moodRef = useRef(mood);
  const onPokeRef = useRef(onPoke);
  const onReadyRef = useRef(onReady);
  const [ready, setReady] = useState(false);

  moodRef.current = mood;
  onPokeRef.current = onPoke;
  onReadyRef.current = onReady;

  useEffect(() => {
    const host = hostRef.current;

    if (!host) {
      return undefined;
    }

    let cancelled = false;
    const handlePoke = () => onPokeRef.current?.();

    void loadSlime()
      .then((Slime) => {
        if (cancelled || !host.isConnected) {
          return;
        }

        const controller = Slime.mount(host, {
          mood: moodRef.current,
          greet: false,
          idleSleepMs,
          trackPointer,
        });

        controllerRef.current = controller;
        controller.setMood(moodRef.current, { silent: true });
        host.addEventListener("slime:poke", handlePoke);
        onReadyRef.current?.(controller);
        setReady(true);
      })
      .catch((error: unknown) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("KAEL mascot failed to load", error);
        }
      });

    return () => {
      cancelled = true;
      host.removeEventListener("slime:poke", handlePoke);
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
  }, [idleSleepMs, trackPointer]);

  useEffect(() => {
    controllerRef.current?.setMood(mood, { silent: true });
  }, [mood]);

  return (
    <>
      <link
        rel="stylesheet"
        href="/mascot/slime.css"
        precedence="kael-mascot"
      />
      <div
        ref={hostRef}
        aria-hidden="true"
        className={`aspect-[400/340] w-full select-none transition-opacity duration-300 ${
          ready ? "opacity-100" : "opacity-0"
        } ${className}`}
      />
    </>
  );
}
