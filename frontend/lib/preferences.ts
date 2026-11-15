import {
  KAEL_SKILL_IDS,
  isKaelSkillId,
  type KaelSkillId,
} from "./skills";

export type ResponseStyle =
  | "default"
  | "concise"
  | "detailed"
  | "friendly"
  | "direct";

export type ThemeId = "dark" | "light";

export type InterfaceFontId = "manrope" | "inter" | "onest" | "system";

export type DisplayFontId = "unbounded" | "onest" | "manrope" | "system";

export type KaelPreferences = {
  enterToSend: boolean;
  autoScroll: boolean;
  mascotEnabled: boolean;
  reduceMotion: boolean;
  preferredName: string;
  responseStyle: ResponseStyle;
  customInstructions: string;
  theme: ThemeId;
  interfaceFont: InterfaceFontId;
  displayFont: DisplayFontId;
  liveDemo: boolean;
  quickStart: boolean;
  changelogAuto: boolean;
  skills: KaelSkillId[];
};

export const PREFERENCES_STORAGE_KEY = "kael-preferences";

export const MAX_PREFERRED_NAME = 40;
export const MAX_CUSTOM_INSTRUCTIONS = 1200;

export const DEFAULT_PREFERENCES: KaelPreferences = {
  enterToSend: true,
  autoScroll: true,
  mascotEnabled: true,
  reduceMotion: false,
  preferredName: "",
  responseStyle: "default",
  customInstructions: "",
  theme: "dark",
  interfaceFont: "manrope",
  displayFont: "unbounded",
  liveDemo: true,
  quickStart: true,
  changelogAuto: true,
  skills: [],
};

const RESPONSE_STYLES: readonly ResponseStyle[] = [
  "default",
  "concise",
  "detailed",
  "friendly",
  "direct",
];

const INTERFACE_FONTS: readonly InterfaceFontId[] = [
  "manrope",
  "inter",
  "onest",
  "system",
];

const DISPLAY_FONTS: readonly DisplayFontId[] = [
  "unbounded",
  "onest",
  "manrope",
  "system",
];

export function isResponseStyle(value: unknown): value is ResponseStyle {
  return (
    typeof value === "string" &&
    (RESPONSE_STYLES as readonly string[]).includes(value)
  );
}

export function isThemeId(value: unknown): value is ThemeId {
  return value === "dark" || value === "light";
}

export function isInterfaceFontId(value: unknown): value is InterfaceFontId {
  return (
    typeof value === "string" &&
    (INTERFACE_FONTS as readonly string[]).includes(value)
  );
}

export function isDisplayFontId(value: unknown): value is DisplayFontId {
  return (
    typeof value === "string" &&
    (DISPLAY_FONTS as readonly string[]).includes(value)
  );
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readText(value: unknown, fallback: string, limit: number): string {
  if (typeof value !== "string") {
    return fallback;
  }
  return value.slice(0, limit);
}

function readSkills(value: unknown): KaelSkillId[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const unique = new Set(value.filter(isKaelSkillId));
  return KAEL_SKILL_IDS.filter((skill) => unique.has(skill));
}

/** Validates untrusted localStorage data and fills missing fields. */
export function normalizePreferences(value: unknown): KaelPreferences {
  if (typeof value !== "object" || value === null) {
    return { ...DEFAULT_PREFERENCES, skills: [] };
  }

  const record = value as Partial<Record<keyof KaelPreferences, unknown>>;

  return {
    enterToSend: readBoolean(
      record.enterToSend,
      DEFAULT_PREFERENCES.enterToSend,
    ),
    autoScroll: readBoolean(record.autoScroll, DEFAULT_PREFERENCES.autoScroll),
    mascotEnabled: readBoolean(
      record.mascotEnabled,
      DEFAULT_PREFERENCES.mascotEnabled,
    ),
    reduceMotion: readBoolean(
      record.reduceMotion,
      DEFAULT_PREFERENCES.reduceMotion,
    ),
    preferredName: readText(
      record.preferredName,
      DEFAULT_PREFERENCES.preferredName,
      MAX_PREFERRED_NAME,
    ),
    responseStyle: isResponseStyle(record.responseStyle)
      ? record.responseStyle
      : DEFAULT_PREFERENCES.responseStyle,
    customInstructions: readText(
      record.customInstructions,
      DEFAULT_PREFERENCES.customInstructions,
      MAX_CUSTOM_INSTRUCTIONS,
    ),
    theme: isThemeId(record.theme)
      ? record.theme
      : DEFAULT_PREFERENCES.theme,
    interfaceFont: isInterfaceFontId(record.interfaceFont)
      ? record.interfaceFont
      : DEFAULT_PREFERENCES.interfaceFont,
    displayFont: isDisplayFontId(record.displayFont)
      ? record.displayFont
      : DEFAULT_PREFERENCES.displayFont,
    liveDemo: readBoolean(record.liveDemo, DEFAULT_PREFERENCES.liveDemo),
    quickStart: readBoolean(record.quickStart, DEFAULT_PREFERENCES.quickStart),
    changelogAuto: readBoolean(
      record.changelogAuto,
      DEFAULT_PREFERENCES.changelogAuto,
    ),
    skills: readSkills(record.skills),
  };
}

export function readPreferences(): KaelPreferences {
  try {
    const stored = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!stored) {
      return { ...DEFAULT_PREFERENCES, skills: [] };
    }
    return normalizePreferences(JSON.parse(stored));
  } catch {
    return { ...DEFAULT_PREFERENCES, skills: [] };
  }
}

export function writePreferences(preferences: KaelPreferences): void {
  try {
    window.localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferences),
    );
  } catch {
    return;
  }
}

export type PersonalizationPayload = {
  preferred_name?: string;
  response_style?: Exclude<ResponseStyle, "default">;
  custom_instructions?: string;
  skills?: KaelSkillId[];
};

/**
 * Only non-default values are sent, so the backend prompt stays small.
 * Returns null when the user has not personalized anything.
 */
export function buildPersonalization(
  preferences: KaelPreferences,
): PersonalizationPayload | null {
  const payload: PersonalizationPayload = {};
  const name = preferences.preferredName.trim();
  const instructions = preferences.customInstructions.trim();

  if (name) {
    payload.preferred_name = name;
  }
  if (preferences.responseStyle !== "default") {
    payload.response_style = preferences.responseStyle;
  }
  if (instructions) {
    payload.custom_instructions = instructions;
  }
  if (preferences.skills.length > 0) {
    payload.skills = [...preferences.skills];
  }

  return Object.keys(payload).length > 0 ? payload : null;
}
