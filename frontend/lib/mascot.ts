import type { ResponseMode } from "./modes";
import type { SlimeMood } from "./slime";

export type MascotPhase = "idle" | "thinking" | "typing" | "done" | "error";

/**
 * Moods the slime cycles through while the model is working. "think" is
 * weighted by repetition so it stays the dominant expression, while the rest
 * keep the face alive instead of freezing on one pose.
 */
export const THINKING_MOODS: readonly SlimeMood[] = [
  "think",
  "think",
  "think",
  "surprised",
  "dizzy",
  "bored",
  "sneaky",
  "cool",
  "excited",
  "wink",
];

/** Moods used while the answer is being typed out, after the model replied. */
export const TYPING_MOODS: readonly SlimeMood[] = [
  "happy",
  "wink",
  "cool",
  "excited",
  "sneaky",
  "shy",
  "love",
  "laugh",
  "surprised",
];

const DELIVERY_MOODS: readonly SlimeMood[] = [
  "happy",
  "wink",
  "cool",
  "excited",
  "shy",
  "love",
  "laugh",
  "sneaky",
];

const CODE_PATTERN =
  /```|(^|\n)\s*(import|export|const|let|function|class|def|async|interface|type)\b|<[a-z][\w-]*[\s>]/i;
const HUMOR_PATTERN = /ха-ха|анекдот|шутк|смешн|lol\b|haha|funny|😂|🤣/i;
const GRATITUDE_PATTERN = /спасибо|благодар|дякую|thank/i;
const AFFECTION_PATTERN = /люблю|обожаю|love you|обійм/i;
const APOLOGY_PATTERN = /извин|прости|не могу|sorry|i can't|не вдалося/i;
const EXCITED_PATTERN = /!{2,}|[🎉🚀✨🔥]/u;

/** A shuffle bag: every mood in the pool is used once before repeats. */
export class MoodBag {
  private remaining: SlimeMood[] = [];

  constructor(private readonly pool: readonly SlimeMood[]) {}

  next(random: () => number = Math.random): SlimeMood {
    if (this.remaining.length === 0) {
      this.remaining = [...this.pool];

      for (let index = this.remaining.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(random() * (index + 1));
        const current = this.remaining[index];
        const swap = this.remaining[swapIndex];

        if (current !== undefined && swap !== undefined) {
          this.remaining[index] = swap;
          this.remaining[swapIndex] = current;
        }
      }
    }

    const mood = this.remaining.pop();
    return mood ?? this.pool[0] ?? "idle";
  }
}

export function nextTypingMood(previous: SlimeMood): SlimeMood {
  const alternatives = TYPING_MOODS.filter((mood) => mood !== previous);
  return alternatives[Math.floor(Math.random() * alternatives.length)] ?? "happy";
}

function hashString(value: string): number {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

/**
 * Picks the face the mascot wears while delivering a finished answer.
 * Content signals win; otherwise a stable hash keeps the choice varied
 * between answers without flickering on re-renders.
 */
export function moodForReply(reply: string, mode: ResponseMode): SlimeMood {
  if (CODE_PATTERN.test(reply)) {
    return "cool";
  }
  if (HUMOR_PATTERN.test(reply)) {
    return "laugh";
  }
  if (GRATITUDE_PATTERN.test(reply)) {
    return "shy";
  }
  if (AFFECTION_PATTERN.test(reply)) {
    return "love";
  }
  if (APOLOGY_PATTERN.test(reply)) {
    return "shy";
  }
  if (mode === "deep") {
    return "cool";
  }
  if (mode === "fast") {
    return "wink";
  }
  if (EXCITED_PATTERN.test(reply)) {
    return "excited";
  }
  if (reply.length > 900) {
    return "cool";
  }
  if (reply.includes("?")) {
    return "surprised";
  }

  return DELIVERY_MOODS[hashString(reply) % DELIVERY_MOODS.length] ?? "happy";
}

export function moodForError(error: unknown): SlimeMood {
  if (error instanceof Error && error.name === "AbortError") {
    return "scared";
  }
  if (error instanceof Error && /429|rate limit/i.test(error.message)) {
    return "dizzy";
  }
  return "sad";
}

export function thinkingMoodDelay(): number {
  return 1300 + Math.random() * 1100;
}
