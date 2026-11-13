export type ResponseMode = "fast" | "balanced" | "deep";

export type ModeOption = {
  id: ResponseMode;
  label: string;
  description: string;
};

export const MODE_OPTIONS: ModeOption[] = [
  {
    id: "fast",
    label: "Fast",
    description: "Мгновенный ответ без длинных рассуждений",
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "Стандартный ответ с шагами мышления",
  },
  {
    id: "deep",
    label: "Deep Think",
    description: "Глубокий разбор, архитектура и больше бюджета",
  },
];

export const DEFAULT_MODE: ResponseMode = "balanced";

export function isResponseMode(value: unknown): value is ResponseMode {
  return value === "fast" || value === "balanced" || value === "deep";
}

export function findMode(modeId: string): ModeOption | undefined {
  return MODE_OPTIONS.find((mode) => mode.id === modeId);
}
