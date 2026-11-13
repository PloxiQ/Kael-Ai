"use client";

import { useId } from "react";

type Look = "center" | "up" | "down" | "left" | "right";

const OFFSET: Record<Look, [number, number]> = {
  center: [0, 0],
  up: [0, -2.5],
  down: [0, 2.5],
  left: [-2.5, 0],
  right: [2.5, 0],
};

type Props = {
  size?: number;
  /** Eye direction. Spark "points" with his gaze. */
  look?: Look;
  mood?: "idle" | "happy";
  float?: boolean;
  className?: string;
};

/** Spark, KAEL's mascot: a glowing robot orb with an antenna. */
export function KaelMascot({
  size = 80,
  look = "center",
  mood = "idle",
  float = true,
  className = "",
}: Props) {
  const uid = useId().replace(/:/g, "");
  const [dx, dy] = OFFSET[look];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={`${float ? "kael-float" : ""} ${className}`}
      style={{ filter: "drop-shadow(0 0 10px rgba(245,87,108,0.6))" }}
    >
      <defs>
        <linearGradient id={`body-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f472b6" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>

      <ellipse cx="50" cy="92" rx="22" ry="3" fill="#f5576c" opacity="0.3" />

      <line
        x1="50"
        y1="19"
        x2="50"
        y2="9"
        stroke="#f0abfc"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle className="kael-antenna" cx="50" cy="7" r="4" fill="#f9a8d4" />

      <rect x="7" y="41" width="8" height="18" rx="3.5" fill="#c084fc" />
      <rect x="85" y="41" width="8" height="18" rx="3.5" fill="#c084fc" />

      <rect
        x="13"
        y="18"
        width="74"
        height="66"
        rx="30"
        fill={`url(#body-${uid})`}
      />
      <path
        d="M26 30 Q34 22 48 22"
        stroke="#fff"
        strokeOpacity="0.35"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      <rect
        x="22"
        y="33"
        width="56"
        height="38"
        rx="17"
        fill="#0b0614"
        stroke="#f0abfc"
        strokeOpacity="0.5"
        strokeWidth="1.5"
      />

      <g className="kael-blink">
        <g transform={`translate(${dx} ${dy})`}>
          {mood === "happy" ? (
            <>
              <path
                d="M31 55 Q37 47 43 55"
                stroke="#f5d0fe"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M57 55 Q63 47 69 55"
                stroke="#f5d0fe"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
            </>
          ) : (
            <>
              <circle cx="37" cy="51" r="6.5" fill="#f5d0fe" />
              <circle cx="63" cy="51" r="6.5" fill="#f5d0fe" />
              <circle cx="38.5" cy="49.5" r="2" fill="#fff" />
              <circle cx="64.5" cy="49.5" r="2" fill="#fff" />
            </>
          )}
        </g>
      </g>

      <path
        d="M45 63 Q50 67 55 63"
        stroke="#f472b6"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
