"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type ThinkingStep = {
  label: string;
  completed: boolean;
};

type ThinkingStatusProps = {
  isThinking: boolean;
  provider: string;
  userMessage?: string;
  durationMs?: number;
  modelUsed?: string;
  steps?: ThinkingStep[];
};

type StepScenario = {
  kind: "technical" | "analytical" | "social" | "general";
  variants: string[][];
};

const technicalKeywords = /\b(код|скрипт|python|javascript|typescript|js|ts|ошибк|баг|функци|класс|api|endpoint|sql|html|css|react|next|fastapi|питон|напиши|реализуй|исправь|debug|bug|code|script)\b/i;
const analyticalKeywords = /\b(почему|зачем|как работает|сравни|сравнение|разбери|анализ|архитектур|план|иде|причин|плюс|минус|объясни|в чём разница|что лучше|why|compare|analy[sz]|plan|architecture)\b/i;
const socialKeywords = /^(привет|здравствуй|здравствуйте|добрый день|доброе утро|добрый вечер|как дела|спасибо|hi|hello|hey)\b/i;

const scenarios: Record<"technical" | "analytical" | "social" | "general", StepScenario> = {
  technical: {
    kind: "technical",
    variants: [
      ["Парсинг технической задачи и выбор стека...", "Проектирование структуры алгоритма...", "Маршрутизация в вычислительное ядро ({provider})...", "Проверка синтаксиса и сборка чистого листинга..."],
      ["Выделяю требования и точки отказа...", "Собираю минимальную архитектуру решения...", "Передаю задачу модулю {provider}...", "Проверяю граничные случаи и читаемость результата..."],
    ],
  },
  analytical: {
    kind: "analytical",
    variants: [
      ["Декомпозиция вопроса на ключевые тезисы...", "Поиск логических связей в контексте сессии...", "Запрос к нейросетевому модулю ({provider})...", "Структурирование выводов и отсечение шума..."],
      ["Определяю, что здесь действительно важно...", "Сверяю аргументы и скрытые допущения...", "Подключаю аналитический модуль {provider}...", "Собираю выводы в понятную последовательность..."],
    ],
  },
  social: {
    kind: "social",
    variants: [
      ["Инициализация диалогового контекста...", "Синхронизация с ядром ({provider})...", "Формирование ответа..."],
      ["Проверяю тон и контекст сообщения...", "Связываюсь с ядром {provider}...", "Готовлю короткий человеческий ответ..."],
    ],
  },
  general: {
    kind: "general",
    variants: [
      ["Читаю задачу и выделяю намерение...", "Сверяю контекст сессии и доступные данные...", "Запрашиваю рабочий модуль {provider}...", "Собираю ответ и убираю лишнюю уверенность..."],
      ["Фиксирую цель запроса...", "Проверяю возможные направления решения...", "Маршрутизирую контекст в {provider}...", "Формулирую практичный следующий шаг..."],
      ["Определяю формат, который здесь действительно нужен...", "Отделяю факты от предположений...", "Синтезирую материал через {provider}...", "Полирую ответ до полезного состояния..."],
    ],
  },
};

function hashMessage(message: string): number {
  return Array.from(message.toLowerCase()).reduce((hash, character) => ((hash << 5) - hash + character.charCodeAt(0)) | 0, 7) >>> 0;
}

export function getThinkingScenario(message: string): StepScenario["kind"] {
  const normalized = message.trim();
  if (technicalKeywords.test(normalized)) return "technical";
  if (analyticalKeywords.test(normalized)) return "analytical";
  if (normalized.length < 25 && socialKeywords.test(normalized)) return "social";
  return "general";
}

export function buildThinkingSteps(message: string, provider: string): ThinkingStep[] {
  const kind = getThinkingScenario(message);
  const scenario = scenarios[kind];
  const variant = scenario.variants[hashMessage(message) % scenario.variants.length];
  return variant.map((label) => ({ label: label.replaceAll("{provider}", provider), completed: true }));
}

export default function ThinkingStatus({ isThinking, provider, userMessage = "", durationMs, modelUsed, steps }: ThinkingStatusProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [expanded, setExpanded] = useState(isThinking);
  const generatedSteps = useMemo(() => buildThinkingSteps(userMessage, provider), [userMessage, provider]);
  const displaySteps = steps ?? generatedSteps;

  useEffect(() => {
    if (!isThinking) return undefined;
    setExpanded(true);
    setActiveStep(0);
    const interval = window.setInterval(() => setActiveStep((current) => (current + 1) % displaySteps.length), 1250);
    return () => window.clearInterval(interval);
  }, [displaySteps.length, isThinking]);

  useEffect(() => {
    if (!isThinking) setExpanded(false);
  }, [isThinking]);

  if (!isThinking && !steps) return null;

  const elapsed = durationMs ? `${(durationMs / 1000).toFixed(1)} сек` : "обработано";
  const modelLabel = modelUsed || provider;
  const activeLabel = displaySteps[activeStep % displaySteps.length]?.label ?? "Обрабатываю запрос...";

  return <div className={`thinking-status ${isThinking ? "thinking-status-active" : ""}`}>
    <button type="button" onClick={() => setExpanded((current) => !current)} className="flex w-full items-center gap-2 text-left">
      <span className={`thinking-glyph ${isThinking ? "thinking-glyph-active" : ""}`} />
      <span className="thinking-summary">{isThinking ? activeLabel : `Обработано за ${elapsed} · ${modelLabel} · Этапы`}</span>
      {expanded ? <ChevronDown size={13} strokeWidth={1.5} className="ml-auto text-zinc-500" /> : <ChevronRight size={13} strokeWidth={1.5} className="ml-auto text-zinc-500" />}
    </button>
    {expanded && <div className="mt-3 space-y-2 border-t border-zinc-800/80 pt-3">{displaySteps.map((step, index) => <div key={`${step.label}-${index}`} className={`thinking-step ${isThinking && index <= activeStep ? "thinking-step-visible" : ""}`}><span className={`thinking-step-dot ${step.completed || (!isThinking && !!steps) || index < activeStep ? "thinking-step-dot-done" : ""}`} /><span>{step.label}</span></div>)}</div>}
  </div>;
}
