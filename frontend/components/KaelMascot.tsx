"use client";

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

/** Spark, KAEL's placeholder mascot: a small robot orb with an antenna. */
export function KaelMascot({
  size = 80,
  look = "center",
  mood = "idle",
  float = true,
  className = "",
}: Props) {
  const [dx, dy] = OFFSET[look];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={`${float ? "kael-float" : ""} ${className}`}
    >
      <ellipse cx="50" cy="92" rx="22" ry="3" fill="#10B981" opacity="0.3" />

      <line
        x1="50"
        y1="19"
        x2="50"
        y2="9"
        stroke="#34D399"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle className="kael-antenna" cx="50" cy="7" r="4" fill="#34D399" />

      <rect x="7" y="41" width="8" height="18" rx="3.5" fill="#047857" />
      <rect x="85" y="41" width="8" height="18" rx="3.5" fill="#047857" />

      <rect
        x="13"
        y="18"
        width="74"
        height="66"
        rx="30"
        fill="#10B981"
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
        fill="#0A0A0A"
        stroke="#34D399"
        strokeOpacity="0.5"
        strokeWidth="1.5"
      />

      <g className="kael-blink">
        <g transform={`translate(${dx} ${dy})`}>
          {mood === "happy" ? (
            <>
              <path
                d="M31 55 Q37 47 43 55"
                stroke="#F5F5F0"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M57 55 Q63 47 69 55"
                stroke="#F5F5F0"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
            </>
          ) : (
            <>
              <circle cx="37" cy="51" r="6.5" fill="#F5F5F0" />
              <circle cx="63" cy="51" r="6.5" fill="#F5F5F0" />
              <circle cx="38.5" cy="49.5" r="2" fill="#fff" />
              <circle cx="64.5" cy="49.5" r="2" fill="#fff" />
            </>
          )}
        </g>
      </g>

      <path
        d="M45 63 Q50 67 55 63"
        stroke="#34D399"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
