export const SLIME_MOODS = [
  "idle",
  "happy",
  "jump",
  "sad",
  "surprised",
  "sleepy",
  "love",
  "wink",
  "laugh",
  "shy",
  "angry",
  "think",
  "dizzy",
  "cool",
  "scared",
  "bored",
  "excited",
  "cry",
  "sneaky",
] as const;

export type SlimeMood = (typeof SLIME_MOODS)[number];

export type SlimeMoodOptions = {
  silent?: boolean;
  duration?: number;
  revertTo?: SlimeMood;
};

export type SlimeEvent =
  | "success"
  | "done"
  | "error"
  | "warning"
  | "loading"
  | "thinking"
  | "praise"
  | "thanks"
  | "joke"
  | "secret"
  | "confused"
  | "bug"
  | "cool"
  | "sleep"
  | "idle";

export type SlimeOptions = {
  mood?: SlimeMood;
  speechEl?: HTMLElement;
  onSay?: (text: string) => void;
  onMoodChange?: (mood: SlimeMood) => void;
  lines?: Partial<Record<SlimeMood, readonly string[]>>;
  idleSleepMs?: number;
  trackPointer?: boolean;
  greet?: boolean;
};

export type SlimeController = {
  el: SVGSVGElement;
  moods: SlimeMood[];
  setMood: (mood: SlimeMood, options?: SlimeMoodOptions) => SlimeMood;
  getMood: () => SlimeMood;
  react: (event: SlimeEvent | SlimeMood, options?: SlimeMoodOptions) => SlimeMood;
  poke: () => void;
  say: (text: string) => void;
  destroy: () => void;
};

export type SlimeApi = {
  mount: (container: HTMLElement, options?: SlimeOptions) => SlimeController;
  MOODS: SlimeMood[];
  EVENTS: Record<string, SlimeMood>;
  LINES: Record<SlimeMood, string[]>;
  MARKUP: string;
};

const SLIME_SCRIPT_URL = "/mascot/slime.js";
const SLIME_SCRIPT_MARKER = "kaelSlime";

let pendingScript: Promise<SlimeApi> | null = null;

/**
 * Loads the vanilla mascot bundle once and resolves with its global API.
 * The bundle is served from `public/mascot`, so it never enters the Next
 * bundle and stays replaceable without a rebuild.
 */
export function loadSlime(): Promise<SlimeApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("The slime mascot can only load in a browser"));
  }

  if (window.Slime) {
    return Promise.resolve(window.Slime);
  }

  if (pendingScript) {
    return pendingScript;
  }

  pendingScript = new Promise<SlimeApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SLIME_SCRIPT_URL;
    script.async = true;
    script.dataset[SLIME_SCRIPT_MARKER] = "true";

    script.addEventListener(
      "load",
      () => {
        if (window.Slime) {
          resolve(window.Slime);
          return;
        }
        script.remove();
        reject(new Error("Mascot bundle loaded without exposing the Slime API"));
      },
      { once: true },
    );

    script.addEventListener(
      "error",
      () => {
        script.remove();
        reject(new Error("Failed to load the mascot bundle"));
      },
      { once: true },
    );

    document.head.appendChild(script);
  }).catch((error: unknown) => {
    pendingScript = null;
    throw error;
  });

  return pendingScript;
}
