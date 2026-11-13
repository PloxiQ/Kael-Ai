export type TierId = "free" | "pro" | "elite" | "dev";

export type Tier = {
  id: TierId;
  name: string;
  price: string;
  tokenLimit: number;
  description: string;
  features: string[];
  hidden?: boolean;
  unlimited?: boolean;
};

export type UsageState = {
  tierId: TierId;
  tokensUsed: number;
  period: string;
};

export const DEV_TIER_ID: TierId = "dev";
export const DEV_MODE_STORAGE_KEY = "kael_dev_mode";
export const DEV_SECRET = "kael-dev-2026";

export const TIERS: Tier[] = [
  {
    id: "free",
    name: "Free Tier",
    price: "0 ₽",
    tokenLimit: 100_000,
    description: "Для знакомства с KAEL и личных экспериментов.",
    features: [
      "100 тыс. токенов в месяц",
      "Базовые модели",
      "История диалогов",
    ],
  },
  {
    id: "pro",
    name: "Pro Creator",
    price: "990 ₽ / мес",
    tokenLimit: 1_000_000,
    description: "Для ежедневной работы, кода и документов.",
    features: [
      "1 млн токенов в месяц",
      "Все модели и Deep Think",
      "Приоритетная очередь",
    ],
  },
  {
    id: "elite",
    name: "Elite SaaS",
    price: "2 990 ₽ / мес",
    tokenLimit: 10_000_000,
    description: "Для команд и тяжёлых рабочих нагрузок.",
    features: [
      "10 млн токенов в месяц",
      "Максимальный контекст",
      "Ранний доступ к функциям",
    ],
  },
  {
    id: "dev",
    name: "Друг разработчика",
    price: "∞",
    tokenLimit: 0,
    description: "Секретный доступ для своих. Без лимитов и очередей.",
    features: [
      "Неограниченные токены",
      "Все модели и Deep Think",
      "Прямой доступ к новым функциям",
    ],
    hidden: true,
    unlimited: true,
  },
];

export const PUBLIC_TIERS: Tier[] = TIERS.filter((tier) => !tier.hidden);
export const DEV_TIER: Tier = TIERS.find((tier) => tier.id === DEV_TIER_ID)!;

export const DEFAULT_TIER_ID: TierId = "free";
export const USAGE_STORAGE_KEY = "kael-usage";

export function isTierId(value: unknown): value is TierId {
  return value === "free" || value === "pro" || value === "elite" || value === "dev";
}

export function getTier(tierId: TierId): Tier {
  return TIERS.find((tier) => tier.id === tierId) ?? TIERS[0];
}

export function isUnlimitedTier(tier: Tier): boolean {
  return tier.id === DEV_TIER_ID || tier.tokenLimit <= 0;
}

export function readDevMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(DEV_MODE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function writeDevMode(enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(DEV_MODE_STORAGE_KEY, String(enabled));
  } catch {
    return;
  }
}

export function currentPeriod(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

export function createDefaultUsage(): UsageState {
  return {
    tierId: DEFAULT_TIER_ID,
    tokensUsed: 0,
    period: currentPeriod(),
  };
}

function isUsageState(value: unknown): value is UsageState {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const usage = value as Partial<UsageState>;

  return (
    isTierId(usage.tierId) &&
    typeof usage.tokensUsed === "number" &&
    Number.isFinite(usage.tokensUsed) &&
    typeof usage.period === "string" &&
    /^\d{4}-\d{2}$/.test(usage.period)
  );
}

export function readUsage(): UsageState {
  if (typeof window === "undefined") {
    return createDefaultUsage();
  }

  try {
    const raw = window.localStorage.getItem(USAGE_STORAGE_KEY);
    if (!raw) {
      return createDefaultUsage();
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isUsageState(parsed)) {
      return createDefaultUsage();
    }

    const period = currentPeriod();
    const tierId =
      parsed.tierId === DEV_TIER_ID && !readDevMode()
        ? DEFAULT_TIER_ID
        : parsed.tierId;

    return {
      tierId,
      tokensUsed:
        parsed.period === period
          ? Math.max(0, Math.round(parsed.tokensUsed))
          : 0,
      period,
    };
  } catch {
    return createDefaultUsage();
  }
}

export function writeUsage(usage: UsageState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usage));
  } catch {
    return;
  }
}

export function withAddedTokens(
  usage: UsageState,
  tokens: number,
): UsageState {
  const period = currentPeriod();
  const base =
    usage.period === period
      ? usage
      : { ...usage, tokensUsed: 0, period };

  return {
    ...base,
    period,
    tokensUsed:
      base.tokensUsed + Math.max(0, Math.round(Number.isFinite(tokens) ? tokens : 0)),
  };
}

export function withTier(usage: UsageState, tierId: TierId): UsageState {
  const period = currentPeriod();

  return {
    ...usage,
    tierId,
    period,
    tokensUsed: usage.period === period ? usage.tokensUsed : 0,
  };
}

export function usagePercent(usage: UsageState): number {
  const tier = getTier(usage.tierId);
  if (isUnlimitedTier(tier) || tier.tokenLimit <= 0) {
    return 0;
  }

  return Math.min(100, (usage.tokensUsed / tier.tokenLimit) * 100);
}

export function remainingTokens(usage: UsageState): number {
  const tier = getTier(usage.tierId);
  if (isUnlimitedTier(tier)) {
    return 0;
  }

  return Math.max(0, tier.tokenLimit - usage.tokensUsed);
}

export function formatNumber(value: number, locale = "ru-RU"): string {
  return new Intl.NumberFormat(locale).format(
    Math.max(0, Math.round(value)),
  );
}

export function formatTokens(value: number, locale = "ru-RU"): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Math.max(0, Math.round(value)));
}

export function nextResetLabel(
  locale = "ru-RU",
  now = new Date(),
): string {
  const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
  }).format(nextReset);
}

export function estimateTokens(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }

  return Math.max(1, Math.ceil(trimmed.length / 4));
}
