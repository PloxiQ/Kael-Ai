"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../lib/i18n";
import type { ResponseMode } from "../lib/modes";
import {
  createTranslator,
  type Translate,
  type TranslationKey,
} from "../lib/translations";

export type ThinkingStep = {
  label: string;
  completed: boolean;
};

type ThinkingStatusProps = {
  isThinking: boolean;
  userMessage?: string;
  durationMs?: number;
  mode?: ResponseMode;
};

export type ThinkingScenario =
  | "coding"
  | "analysis"
  | "document"
  | "social"
  | "general";

const SCENARIO_KEYS: Record<ThinkingScenario, TranslationKey[]> = {
  coding: [
    "thinking.coding.0",
    "thinking.coding.1",
    "thinking.coding.2",
    "thinking.coding.3",
  ],
  analysis: [
    "thinking.analysis.0",
    "thinking.analysis.1",
    "thinking.analysis.2",
    "thinking.analysis.3",
  ],
  document: [
    "thinking.document.0",
    "thinking.document.1",
    "thinking.document.2",
    "thinking.document.3",
  ],
  social: [
    "thinking.social.0",
    "thinking.social.1",
    "thinking.social.2",
  ],
  general: [
    "thinking.general.0",
    "thinking.general.1",
    "thinking.general.2",
    "thinking.general.3",
  ],
};

const codingSignals = [
  "код",
  "скрипт",
  "python",
  "javascript",
  "typescript",
  "react",
  "next.js",
  "fastapi",
  "api",
  "endpoint",
  "sql",
  "html",
  "css",
  "баг",
  "ошибк",
  "функци",
  "класс",
  "компонент",
  "debug",
  "git",
  "json",
  "исправь",
  "реализуй",
  "напиши код",
  "напиши функцию",
  "помилк",
  "функці",
  "виправ",
  "реалізуй",
  "напиши код",
];

const analysisSignals = [
  "почему",
  "зачем",
  "сравни",
  "сравнение",
  "анализ",
  "архитектур",
  "план",
  "стратег",
  "причин",
  "плюс",
  "минус",
  "объясни",
  "разница",
  "что лучше",
  "вывод",
  "исследуй",
  "why",
  "compare",
  "analyz",
  "plan",
  "architecture",
  "tradeoff",
  "чому",
  "порівняй",
  "аналіз",
  "архітектур",
  "поясни",
  "різниця",
];

const documentSignals = [
  "документ",
  "файл",
  "readme",
  "статья",
  "статью",
  "отчёт",
  "отчет",
  "резюме",
  "письмо",
  "инструкц",
  "markdown",
  "docx",
  "pdf",
  "report",
  "document",
  "essay",
  "документ",
  "файл",
  "звіт",
  "резюме",
  "лист",
  "інструкц",
];

const socialStarts = [
  "привет",
  "здравствуй",
  "здравствуйте",
  "добрый день",
  "доброе утро",
  "добрый вечер",
  "как дела",
  "спасибо",
  "благодарю",
  "hi",
  "hello",
  "hey",
  "thanks",
  "привіт",
  "добрий день",
  "доброго ранку",
  "дякую",
];

const codeShapePattern =
  /```|\.(py|js|ts|tsx|jsx|css|scss|html|json|sql|sh|bash|rs|go|java|cpp|cs|rb|php|kt|swift|yml|yaml)\b/i;

function countSignals(text: string, signals: string[]): number {
  return signals.reduce(
    (total, signal) => total + (text.includes(signal) ? 1 : 0),
    0,
  );
}

function looksSocial(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  if (normalized.length === 0 || normalized.length > 48) {
    return false;
  }

  return socialStarts.some((start) => {
    if (!normalized.startsWith(start)) {
      return false;
    }
    const nextCharacter = normalized.charAt(start.length);
    return nextCharacter === "" || /[\s,.!?]/.test(nextCharacter);
  });
}

export function getThinkingScenario(message: string): ThinkingScenario {
  const text = message.toLowerCase();
  const codeScore =
    countSignals(text, codingSignals) + (codeShapePattern.test(text) ? 2 : 0);
  const analysisScore = countSignals(text, analysisSignals);
  const documentScore = countSignals(text, documentSignals);
  const asksToProduceDocument =
    /(собери|подготовь|напиши|сделай|сформируй|збери|підготуй|зроби|сформуй|create|write|build|draft|generate).{0,40}(readme|документ|стать[яю]|отч[её]т|резюме|письмо|инструкц|звіт|лист|інструкц|markdown|\.md\b)/i.test(
      text,
    );
  const mentionsDocument =
    /(readme|документ|стать[яю]|отч[её]т|резюме|письмо|инструкц|звіт|лист|інструкц|markdown|\.md\b)/i.test(
      text,
    );

  if (asksToProduceDocument) {
    return "document";
  }

  if (
    mentionsDocument &&
    documentScore > codeScore &&
    documentScore > analysisScore
  ) {
    return "document";
  }

  const bestScore = Math.max(codeScore, analysisScore, documentScore);

  if (bestScore === 0) {
    return looksSocial(message) ? "social" : "general";
  }

  if (analysisScore === bestScore) {
    return "analysis";
  }

  if (codeScore === bestScore) {
    return "coding";
  }

  return "document";
}

export function buildThinkingSteps(
  message: string,
  mode: ResponseMode = "balanced",
  t: Translate = createTranslator("ru"),
): ThinkingStep[] {
  const keys = SCENARIO_KEYS[getThinkingScenario(message)];
  let labels: string[];

  if (mode === "fast") {
    labels = [
      t(keys[0] ?? "thinking.general.0"),
      t("thinking.short"),
    ];
  } else if (mode === "deep") {
    labels = [
      ...keys.map((key) => t(key)),
      t("thinking.deepExtra0"),
      t("thinking.deepExtra1"),
    ];
  } else {
    labels = keys.map((key) => t(key));
  }

  return labels.map((label) => ({
    label,
    completed: true,
  }));
}

export default function ThinkingStatus({
  isThinking,
  userMessage = "",
  durationMs,
  mode = "balanced",
}: ThinkingStatusProps) {
  const { t } = useI18n();
  const [activeStep, setActiveStep] = useState(0);
  const [expanded, setExpanded] = useState(isThinking);
  const displaySteps = useMemo(
    () => buildThinkingSteps(userMessage, mode, t),
    [mode, t, userMessage],
  );

  useEffect(() => {
    if (!isThinking) {
      setExpanded(false);
      return undefined;
    }

    setExpanded(true);
    setActiveStep(0);
    const stepDuration = mode === "fast" ? 700 : mode === "deep" ? 1200 : 1050;
    const interval = window.setInterval(() => {
      setActiveStep((current) =>
        Math.min(current + 1, Math.max(displaySteps.length - 1, 0)),
      );
    }, stepDuration);

    return () => window.clearInterval(interval);
  }, [displaySteps.length, isThinking, mode]);

  if (!isThinking && !userMessage) {
    return null;
  }

  const finishedLabel =
    typeof durationMs === "number" && durationMs > 0
      ? t("thinking.doneIn", { seconds: (durationMs / 1000).toFixed(1) })
      : t("thinking.done");
  const activeLabel =
    displaySteps[activeStep % displaySteps.length]?.label ??
    t("thinking.processing");
  const summary = isThinking ? activeLabel : finishedLabel;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`kael-topline w-full overflow-hidden rounded-2xl border bg-[#07070a]/80 shadow-[0_24px_70px_-34px_rgba(0,0,0,0.95)] backdrop-blur-2xl transition-colors duration-200 ${
        isThinking
          ? "border-[#f093fb]/30 shadow-[0_24px_70px_-34px_rgba(0,0,0,0.95),0_0_50px_-20px_rgba(245,87,108,0.4)]"
          : "border-white/[0.08] hover:border-white/[0.14]"
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left"
      >
        <span className="relative flex h-3 w-3 shrink-0 items-center justify-center">
          <span
            className={`absolute h-3 w-3 rounded-full bg-kael-gradient ${
              isThinking ? "kael-pulse opacity-40" : "opacity-25"
            }`}
          />
          <span className="h-1.5 w-1.5 rounded-full bg-kael-gradient" />
        </span>
        <span
          className={`min-w-0 flex-1 truncate text-sm font-medium ${
            isThinking ? "text-zinc-200" : "text-zinc-400"
          }`}
        >
          {summary}
        </span>
        {expanded ? (
          <ChevronDown
            size={16}
            strokeWidth={1.5}
            className="shrink-0 text-zinc-600"
          />
        ) : (
          <ChevronRight
            size={16}
            strokeWidth={1.5}
            className="shrink-0 text-zinc-600"
          />
        )}
      </button>

      {expanded && (
        <div className="border-t border-white/[0.06] px-5 py-4">
          <ol className="space-y-3">
            {displaySteps.map((step, index) => {
              const done = !isThinking || index < activeStep;
              const current = isThinking && index === activeStep;

              return (
                <li key={`${step.label}-${index}`} className="flex items-start gap-3">
                  <span
                    className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-200 ${
                      done
                        ? "bg-kael-gradient"
                        : current
                          ? "bg-white"
                          : "bg-zinc-700"
                    }`}
                  />
                  <span
                    className={`text-sm leading-6 transition-colors duration-200 ${
                      current
                        ? "text-zinc-100"
                        : done
                          ? "text-zinc-400"
                          : "text-zinc-600"
                    }`}
                  >
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
