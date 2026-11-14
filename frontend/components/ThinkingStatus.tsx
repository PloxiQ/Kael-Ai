"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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

export type ThinkingStatusProps = {
  /** True while the model is working; false renders the finished summary. */
  isThinking: boolean;
  /** Last user message. Used to pick a scenario for the auto-generated statuses. */
  userMessage?: string;
  /** Total time of the finished answer, shown in the finished state. */
  durationMs?: number;
  mode?: ResponseMode;
  /** Custom rotating statuses, e.g. ["Думает...", "Анализирует код..."]. Overrides the generated ones. */
  statuses?: string[];
  /** Fully controlled label. When set, the internal timer does not rotate statuses. */
  status?: string;
  /** Milliseconds between status changes. Defaults depend on `mode`. */
  intervalMs?: number;
  /** Start over from the first status after the last one instead of stopping on it. */
  loop?: boolean;
  /** Open the steps list initially. */
  defaultExpanded?: boolean;
  /** Hide the chevron and the steps list (pure one-line indicator). */
  hideSteps?: boolean;
  /** Show the elapsed time (m:ss) while thinking. Default true. */
  showTimer?: boolean;
  /** Fires whenever the visible status changes, e.g. to sync the mascot's speech. */
  onStepChange?: (index: number, label: string) => void;
  className?: string;
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

const STYLES = `
.kts-lattice{display:grid;grid-template-columns:repeat(3,5px);gap:3px;transform:rotate(45deg)}
.kts-lattice i{display:block;width:5px;height:5px;border-radius:1.5px;background:#262626;animation:kts-wave 1.6s ease-in-out infinite}
.kts-orb{position:absolute;inset:2px;border-radius:9999px;background:radial-gradient(circle,rgba(16,185,129,.22),transparent 68%);filter:blur(5px);animation:kts-breathe 1.6s ease-in-out infinite}
.kts-check circle,.kts-check path{stroke-dasharray:1;stroke-dashoffset:1;animation:kts-draw .55s ease-out forwards}
.kts-check path{animation-delay:.12s}
.kts-in{animation:kts-in .4s cubic-bezier(.2,.7,.2,1) both}
.kts-out{animation:kts-out .3s ease-in both;pointer-events:none}
.kts-shimmer{background:linear-gradient(100deg,#8E8E8A 38%,#D1FAE5 50%,#8E8E8A 62%) 100% 0/250% 100% no-repeat;-webkit-background-clip:text;background-clip:text;color:transparent;animation:kts-shine 2.6s linear infinite}
.kts-comet{position:absolute;left:0;right:0;bottom:0;height:1px;overflow:hidden;pointer-events:none}
.kts-comet::after{content:"";position:absolute;top:0;bottom:0;left:0;width:34%;background:linear-gradient(90deg,transparent,#10B981,transparent);animation:kts-comet 2s cubic-bezier(.45,0,.25,1) infinite}
.kts-ping{position:relative}
.kts-ping::after{content:"";position:absolute;inset:-3px;border-radius:9999px;border:1px solid #10B981;animation:kts-ping 1.4s ease-out infinite}
@keyframes kts-wave{0%,60%,100%{background:#262626;transform:scale(.7);box-shadow:none}30%{background:#10B981;transform:scale(1.15);box-shadow:0 0 9px rgba(16,185,129,.7)}}
@keyframes kts-breathe{0%,100%{opacity:.35;transform:scale(.85)}50%{opacity:1;transform:scale(1.1)}}
@keyframes kts-draw{to{stroke-dashoffset:0}}
@keyframes kts-in{from{opacity:0;transform:translateY(7px);filter:blur(3px)}to{opacity:1;transform:none;filter:none}}
@keyframes kts-out{from{opacity:1;transform:none;filter:none}to{opacity:0;transform:translateY(-7px);filter:blur(3px)}}
@keyframes kts-shine{from{background-position:100% 0}to{background-position:0 0}}
@keyframes kts-comet{from{transform:translateX(-100%)}to{transform:translateX(295%)}}
@keyframes kts-ping{from{transform:scale(.6);opacity:.8}to{transform:scale(1.6);opacity:0}}
@media (prefers-reduced-motion:reduce){
.kts-lattice i,.kts-orb,.kts-shimmer,.kts-comet::after,.kts-ping::after{animation:none!important}
.kts-lattice i:nth-child(5){background:#10B981}
.kts-shimmer{color:#8E8E8A;background:none}
.kts-in,.kts-out,.kts-check circle,.kts-check path{animation-duration:.01s!important}
}
`;

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** 3x3 lattice: an emerald wave sweeps diagonally across a rotated grid. */
function Lattice() {
  return (
    <span
      aria-hidden="true"
      className="relative flex h-8 w-8 items-center justify-center"
    >
      <span className="kts-orb" />
      <span className="kts-lattice relative">
        {Array.from({ length: 9 }, (_, index) => {
          const row = Math.floor(index / 3);
          const column = index % 3;
          return (
            <i
              key={index}
              style={{ animationDelay: `${(row + column) * 0.16}s` }}
            />
          );
        })}
      </span>
    </span>
  );
}

/** Ring and check mark that draw themselves once the answer is ready. */
function DoneMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 32"
      className="kts-check h-8 w-8"
      fill="none"
      stroke="#10B981"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle
        cx="16"
        cy="16"
        r="10.5"
        pathLength={1}
        strokeOpacity=".4"
        strokeWidth="1.5"
      />
      <path d="M11.5 16.5l3 3 6-6.5" pathLength={1} strokeWidth="1.75" />
    </svg>
  );
}

/** Cross-fades between status texts: the old one slides up, the new one rises in. */
function StatusText({ text, shimmer }: { text: string; shimmer: boolean }) {
  const [shown, setShown] = useState(text);
  const [leaving, setLeaving] = useState<string | null>(null);

  useEffect(() => {
    if (text === shown) {
      return undefined;
    }
    setLeaving(shown);
    setShown(text);
    const timer = window.setTimeout(() => setLeaving(null), 320);
    return () => window.clearTimeout(timer);
    // `shown` is intentionally read from the render that saw the new `text`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <span className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)] text-sm leading-5">
      {leaving !== null && (
        <span
          key={`out-${leaving}`}
          aria-hidden="true"
          className="kts-out col-start-1 row-start-1 min-w-0"
        >
          <span className="block truncate">{leaving}</span>
        </span>
      )}
      <span key={shown} className="kts-in col-start-1 row-start-1 min-w-0">
        <span className={`block truncate ${shimmer ? "kts-shimmer" : ""}`}>
          {shown}
        </span>
      </span>
    </span>
  );
}

export default function ThinkingStatus({
  isThinking,
  userMessage = "",
  durationMs,
  mode = "balanced",
  statuses,
  status,
  intervalMs,
  loop = false,
  defaultExpanded = false,
  hideSteps = false,
  showTimer = true,
  onStepChange,
  className = "",
}: ThinkingStatusProps) {
  const { t } = useI18n();
  const [active, setActive] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const onStepChangeRef = useRef(onStepChange);
  onStepChangeRef.current = onStepChange;

  const generated = useMemo(
    () => buildThinkingSteps(userMessage, mode, t).map((step) => step.label),
    [mode, t, userMessage],
  );
  const labels = useMemo(() => {
    const custom = statuses?.filter((label) => label.trim().length > 0);
    return custom && custom.length > 0 ? custom : generated;
  }, [statuses, generated]);

  const count = labels.length;
  const controlled = status !== undefined;
  const delay = intervalMs ?? (mode === "fast" ? 900 : mode === "deep" ? 1500 : 1200);

  useEffect(() => {
    if (!isThinking) {
      return undefined;
    }

    setActive(0);
    setElapsed(0);
    const startedAt = performance.now();
    const clock = window.setInterval(
      () => setElapsed(Math.floor((performance.now() - startedAt) / 1000)),
      500,
    );
    const rotation =
      !controlled && count > 1
        ? window.setInterval(
            () =>
              setActive((current) =>
                loop ? (current + 1) % count : Math.min(current + 1, count - 1),
              ),
            delay,
          )
        : undefined;

    return () => {
      window.clearInterval(clock);
      if (rotation !== undefined) {
        window.clearInterval(rotation);
      }
    };
  }, [isThinking, controlled, count, delay, loop]);

  const currentIndex = Math.min(active, Math.max(count - 1, 0));
  const activeLabel =
    status ?? labels[currentIndex] ?? t("thinking.processing");

  useEffect(() => {
    if (isThinking) {
      onStepChangeRef.current?.(currentIndex, activeLabel);
    }
  }, [isThinking, currentIndex, activeLabel]);

  if (!isThinking && !userMessage && !statuses && status === undefined) {
    return null;
  }

  const finishedLabel =
    typeof durationMs === "number" && durationMs > 0
      ? t("thinking.doneIn", { seconds: (durationMs / 1000).toFixed(1) })
      : t("thinking.done");
  const summary = isThinking ? activeLabel : finishedLabel;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={isThinking}
      className={`relative w-full overflow-hidden rounded-xl border border-[#262626] bg-[#161616] text-[#8E8E8A] transition-colors duration-300 hover:border-[#333] ${className}`}
    >
      <style href="kael-thinking-status" precedence="default">
        {STYLES}
      </style>

      <button
        type="button"
        disabled={hideSteps}
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={hideSteps ? undefined : expanded}
        className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#10B981]/50 disabled:cursor-default"
      >
        {isThinking ? <Lattice key="busy" /> : <DoneMark key="done" />}
        <StatusText text={summary} shimmer={isThinking} />
        {isThinking && showTimer && (
          <span className="shrink-0 font-mono text-[11px] tabular-nums text-[#8E8E8A]/60">
            {formatClock(elapsed)}
          </span>
        )}
        {!hideSteps && (
          <ChevronDown
            size={15}
            strokeWidth={1.5}
            aria-hidden="true"
            className={`shrink-0 text-[#8E8E8A]/70 transition-transform duration-300 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {!hideSteps && (
        <div
          aria-hidden={!expanded}
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <ol className="space-y-0.5 border-t border-[#262626] px-3.5 py-3">
              {labels.map((label, index) => {
                const done = !isThinking || index < currentIndex;
                const current = isThinking && index === currentIndex;

                return (
                  <li
                    key={`${label}-${index}`}
                    className={`flex items-center gap-3 py-1 text-[13px] leading-5 transition-opacity duration-300 ${
                      current ? "opacity-100" : done ? "opacity-60" : "opacity-35"
                    }`}
                  >
                    <span className="flex h-2 w-8 shrink-0 items-center justify-center">
                      <span
                        className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                          done || current ? "bg-[#10B981]" : "bg-[#262626]"
                        } ${current ? "kts-ping" : ""}`}
                      />
                    </span>
                    <span className="min-w-0">{label}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}

      {isThinking && <span aria-hidden="true" className="kts-comet" />}
    </div>
  );
}
