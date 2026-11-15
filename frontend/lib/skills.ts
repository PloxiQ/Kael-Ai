import type { TranslationKey } from "./translations";

/**
 * Skills are prompt-level capabilities. The ids are the contract with the
 * backend: the server maps each id to a fixed instruction block, so the client
 * can never inject arbitrary system text through this field.
 */
export const KAEL_SKILL_IDS = [
  "code",
  "explain",
  "debug",
  "summary",
  "translate",
  "documents",
] as const;

export type KaelSkillId = (typeof KAEL_SKILL_IDS)[number];

export type KaelSkill = {
  id: KaelSkillId;
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
};

export const KAEL_SKILLS: readonly KaelSkill[] = [
  {
    id: "code",
    labelKey: "skill.code.name",
    descriptionKey: "skill.code.description",
  },
  {
    id: "explain",
    labelKey: "skill.explain.name",
    descriptionKey: "skill.explain.description",
  },
  {
    id: "debug",
    labelKey: "skill.debug.name",
    descriptionKey: "skill.debug.description",
  },
  {
    id: "summary",
    labelKey: "skill.summary.name",
    descriptionKey: "skill.summary.description",
  },
  {
    id: "translate",
    labelKey: "skill.translate.name",
    descriptionKey: "skill.translate.description",
  },
  {
    id: "documents",
    labelKey: "skill.documents.name",
    descriptionKey: "skill.documents.description",
  },
];

export function isKaelSkillId(value: unknown): value is KaelSkillId {
  return (
    typeof value === "string" &&
    (KAEL_SKILL_IDS as readonly string[]).includes(value)
  );
}
