export type ProviderId =
  | "openrouter"
  | "groq"
  | "ollama"
  | "zerocat"
  | "gemini";

export type ModelOption = {
  id: string;
  provider: ProviderId;
  name: string;
  description: string;
};

export type ModelGroup = {
  provider: ProviderId;
  label: string;
  hint: string;
  models: ModelOption[];
};

export const PROVIDER_IDS: readonly ProviderId[] = [
  "openrouter",
  "groq",
  "ollama",
  "zerocat",
  "gemini",
];

export const MODEL_GROUPS: ModelGroup[] = [
  {
    provider: "openrouter",
    label: "OpenRouter",
    hint: "облако",
    models: [
      {
        id: "openai/gpt-4o-mini",
        provider: "openrouter",
        name: "GPT-4o mini",
        description: "Быстрый универсал для повседневных задач",
      },
      {
        id: "openai/gpt-4o",
        provider: "openrouter",
        name: "GPT-4o",
        description: "Больше глубины на сложных запросах",
      },
      {
        id: "anthropic/claude-3.5-sonnet",
        provider: "openrouter",
        name: "Claude 3.5 Sonnet",
        description: "Сильный в коде и длинном контексте",
      },
      {
        id: "deepseek/deepseek-chat",
        provider: "openrouter",
        name: "DeepSeek Chat",
        description: "Спокойные рассуждения без лишнего шума",
      },
    ],
  },
  {
    provider: "groq",
    label: "Groq",
    hint: "быстро",
    models: [
      {
        id: "groq/openai/gpt-oss-120b",
        provider: "groq",
        name: "GPT-OSS 120B",
        description: "Мощная модель с почти мгновенным ответом",
      },
      {
        id: "groq/openai/gpt-oss-20b",
        provider: "groq",
        name: "GPT-OSS 20B",
        description: "Самая быстрая для коротких задач",
      },
    ],
  },
  {
    provider: "ollama",
    label: "Ollama",
    hint: "локально",
    models: [
      {
        id: "ollama/llama3",
        provider: "ollama",
        name: "Llama 3",
        description: "Работает на вашем компьютере",
      },
      {
        id: "ollama/mistral",
        provider: "ollama",
        name: "Mistral",
        description: "Лёгкая локальная модель для черновиков",
      },
    ],
  },
  {
    provider: "zerocat",
    label: "ZeroCat",
    hint: "мультидоступ",
    models: [
      {
        id: "zerocat/gpt-5.6-sol",
        provider: "zerocat",
        name: "GPT-5.6 Sol",
        description: "Флагман GPT через ZeroCat",
      },
      {
        id: "zerocat/claude-sonnet-5",
        provider: "zerocat",
        name: "Claude Sonnet 5",
        description: "Сильный в коде и длинном контексте",
      },
      {
        id: "zerocat/deepseek-v4.1-flash",
        provider: "zerocat",
        name: "DeepSeek V4.1 Flash",
        description: "Быстрый и недорогой для повседневных задач",
      },
      {
        id: "zerocat/gemini-3.8-flash",
        provider: "zerocat",
        name: "Gemini 3.8 Flash",
        description: "Быстрая мультимодальная модель",
      },
    ],
  },
  {
    provider: "gemini",
    label: "Gemini",
    hint: "Google",
    models: [
      {
        id: "gemini/gemini-3.6-flash",
        provider: "gemini",
        name: "Gemini 3.6 Flash",
        description: "Быстрая модель Google с поддержкой изображений",
      },
      {
        id: "gemini/gemini-3.1-pro-preview",
        provider: "gemini",
        name: "Gemini 3.1 Pro",
        description: "Глубокие рассуждения и длинный контекст",
      },
    ],
  },
];

// Speed is the main wow factor for new users, so Groq GPT-OSS leads by default.
// Existing users keep the model saved in localStorage.
export const DEFAULT_MODEL_ID = "groq/openai/gpt-oss-120b";
const DEFAULT_OPENROUTER_MODEL_ID = "openai/gpt-4o-mini";

export const ALL_MODELS: ModelOption[] = MODEL_GROUPS.flatMap(
  (group) => group.models,
);

export const DEFAULT_MODEL_BY_PROVIDER: Record<ProviderId, string> = {
  openrouter: DEFAULT_OPENROUTER_MODEL_ID,
  groq: "groq/openai/gpt-oss-120b",
  ollama: "ollama/llama3",
  zerocat: "zerocat/gpt-5.6-sol",
  gemini: "gemini/gemini-3.6-flash",
};

const MODEL_BY_ID = new Map(
  ALL_MODELS.map((model) => [model.id, model] as const),
);

export function findModel(modelId: string): ModelOption | undefined {
  return MODEL_BY_ID.get(modelId);
}

export function isModelId(value: unknown): value is string {
  return typeof value === "string" && MODEL_BY_ID.has(value);
}

export function isProviderId(value: unknown): value is ProviderId {
  return (
    value === "openrouter" ||
    value === "groq" ||
    value === "ollama" ||
    value === "zerocat" ||
    value === "gemini"
  );
}

export function providerOf(modelId: string): ProviderId {
  return findModel(modelId)?.provider ?? "openrouter";
}
