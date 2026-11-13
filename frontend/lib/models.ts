export type ProviderId = "openrouter" | "groq" | "ollama";

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
        id: "groq/llama-3.3-70b-versatile",
        provider: "groq",
        name: "Llama 3.3 70B",
        description: "Почти мгновенный ответ через Groq",
      },
      {
        id: "groq/mixtral-8x7b-32768",
        provider: "groq",
        name: "Mixtral 8x7B",
        description: "Компактная модель для коротких задач",
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
];

export const DEFAULT_MODEL_ID = "openai/gpt-4o-mini";

export const ALL_MODELS: ModelOption[] = MODEL_GROUPS.flatMap(
  (group) => group.models,
);

export const DEFAULT_MODEL_BY_PROVIDER: Record<ProviderId, string> = {
  openrouter: DEFAULT_MODEL_ID,
  groq: "groq/llama-3.3-70b-versatile",
  ollama: "ollama/llama3",
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
  return value === "openrouter" || value === "groq" || value === "ollama";
}

export function providerOf(modelId: string): ProviderId {
  return findModel(modelId)?.provider ?? "openrouter";
}
