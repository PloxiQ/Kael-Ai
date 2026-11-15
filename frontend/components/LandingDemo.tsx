"use client";

import { ArrowUpRight, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "../lib/i18n";
import { playSfx } from "../lib/sfx";
import type { SlimeMood } from "../lib/slime";
import type { TranslationKey } from "../lib/translations";
import { SlimeMascot } from "./SlimeMascot";

type DemoPhase = "typing" | "thinking" | "answer" | "pause";

type DemoExample = {
  prompt: TranslationKey;
  answer: TranslationKey;
  tag: TranslationKey;
};

const DEMO_EXAMPLES: readonly DemoExample[] = [
  {
    prompt: "landing.demo.explain.prompt",
    answer: "landing.demo.explain.answer",
    tag: "landing.demo.explain.tag",
  },
  {
    prompt: "landing.demo.code.prompt",
    answer: "landing.demo.code.answer",
    tag: "landing.demo.code.tag",
  },
  {
    prompt: "landing.demo.compare.prompt",
    answer: "landing.demo.compare.answer",
    tag: "landing.demo.compare.tag",
  },
];

const PHASE_KEYS: Record<DemoPhase, TranslationKey> = {
  typing: "landing.demo.typing",
  thinking: "landing.demo.thinking",
  answer: "landing.demo.answering",
  pause: "landing.demo.done",
};

const POKE_KEYS = [
  "mascot.poke0",
  "mascot.poke1",
  "mascot.poke2",
  "mascot.poke3",
] as const satisfies readonly TranslationKey[];

const POKE_MOODS: readonly SlimeMood[] = [
  "laugh",
  "love",
  "wink",
  "surprised",
  "shy",
];

const PROMPT_STEP_MS = 24;
const ANSWER_STEP_MS = 22;
const THINKING_MS = 1100;
const BETWEEN_EXAMPLES_MS = 4600;

function useSystemReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(query.matches);

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduce;
}

export type LandingDemoProps = {
  onPrompt: (prompt: string) => void;
  disabled?: boolean;
  reduceMotion?: boolean;
};

/**
 * A self-contained product demo: the fake composer types a sample request, the
 * slime reacts to each phase, and the sample answer streams in. No network
 * request is made and no tokens are spent.
 */
export function LandingDemo({
  onPrompt,
  disabled = false,
  reduceMotion = false,
}: LandingDemoProps) {
  const { language, t } = useI18n();
  const systemReduceMotion = useSystemReduceMotion();
  const animate = !reduceMotion && !systemReduceMotion;

  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<DemoPhase>("typing");
  const [promptChars, setPromptChars] = useState(0);
  const [answerChars, setAnswerChars] = useState(0);
  const [paused, setPaused] = useState(false);
  const [poke, setPoke] = useState<{
    mood: SlimeMood;
    line: TranslationKey;
  } | null>(null);
  const pokeTimer = useRef<number | null>(null);

  const example = DEMO_EXAMPLES[step] ?? DEMO_EXAMPLES[0];
  const prompt = example ? t(example.prompt) : "";
  const answer = example ? t(example.answer) : "";

  // Restart the text when the language or the selected sample changes.
  useEffect(() => {
    setPromptChars(0);
    setAnswerChars(0);
    setPhase("typing");
  }, [language, step]);

  useEffect(() => {
    if (!animate) {
      setPromptChars(prompt.length);
      setAnswerChars(answer.length);
      setPhase("pause");
      return;
    }

    if (paused) {
      return;
    }

    let timer = 0;

    if (phase === "typing") {
      if (promptChars < prompt.length) {
        timer = window.setTimeout(() => {
          setPromptChars((current) => Math.min(current + 2, prompt.length));
        }, PROMPT_STEP_MS);
      } else {
        timer = window.setTimeout(() => setPhase("thinking"), 480);
      }
    } else if (phase === "thinking") {
      timer = window.setTimeout(() => setPhase("answer"), THINKING_MS);
    } else if (phase === "answer") {
      if (answerChars < answer.length) {
        timer = window.setTimeout(() => {
          setAnswerChars((current) => Math.min(current + 2, answer.length));
        }, ANSWER_STEP_MS);
      } else {
        timer = window.setTimeout(() => setPhase("pause"), 280);
      }
    } else {
      timer = window.setTimeout(() => {
        const next = (step + 1) % DEMO_EXAMPLES.length;
        setStep(next);
        setPromptChars(0);
        setAnswerChars(0);
        setPhase("typing");
      }, BETWEEN_EXAMPLES_MS);
    }

    return () => window.clearTimeout(timer);
  }, [
    animate,
    answer,
    answerChars,
    paused,
    phase,
    prompt,
    promptChars,
    step,
  ]);

  useEffect(
    () => () => {
      if (pokeTimer.current !== null) {
        window.clearTimeout(pokeTimer.current);
      }
    },
    [],
  );

  function selectExample(index: number) {
    setStep(index);
    setPromptChars(0);
    setAnswerChars(0);
    setPhase("typing");
    setPaused(false);
    playSfx("click");
  }

  function handlePoke() {
    if (pokeTimer.current !== null) {
      window.clearTimeout(pokeTimer.current);
    }

    const index = Math.floor(Math.random() * POKE_KEYS.length);
    setPoke({
      mood: POKE_MOODS[index] ?? "laugh",
      line: POKE_KEYS[index] ?? "mascot.poke0",
    });
    playSfx("pop");

    pokeTimer.current = window.setTimeout(() => setPoke(null), 2000);
  }

  const phaseMood: SlimeMood =
    phase === "typing" || phase === "thinking"
      ? "think"
      : phase === "answer"
        ? "happy"
        : "wink";
  const mood = poke?.mood ?? phaseMood;
  const statusKey =
    paused && animate ? "landing.demo.paused" : PHASE_KEYS[phase];
  const visiblePrompt = prompt.slice(0, promptChars);
  const visibleAnswer = answer.slice(0, answerChars);

  return (
    <section
      aria-label={t("landing.demo.eyebrow")}
      className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-[#262626] bg-[#161616] p-4 sm:p-5 xl:max-w-none"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            {animate && !paused ? (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10B981] opacity-40 motion-reduce:animate-none" />
            ) : null}
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10B981]" />
          </span>
          <span className="kael-display text-[10px] font-medium uppercase tracking-[0.16em] text-[#10B981]">
            {t("landing.demo.eyebrow")}
          </span>
        </div>

        {animate ? (
          <button
            type="button"
            onClick={() => {
              setPaused((current) => !current);
              playSfx("click");
            }}
            aria-label={
              paused ? t("landing.demo.resume") : t("landing.demo.pause")
            }
            title={paused ? t("landing.demo.resume") : t("landing.demo.pause")}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#262626] text-[#8E8E8A] transition hover:border-[#3A3A3A] hover:bg-[#1C1C1C] hover:text-[#F5F5F0] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/40"
          >
            {paused ? (
              <Play size={14} strokeWidth={1.8} />
            ) : (
              <Pause size={14} strokeWidth={1.8} />
            )}
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex justify-end">
        <div className="min-h-[56px] max-w-[92%] rounded-2xl rounded-tr-md border border-[#262626] bg-[#1C1C1C] px-4 py-3">
          <p className="break-words text-sm leading-6 text-[#F5F5F0]">
            {visiblePrompt}
            {phase === "typing" ? (
              <span className="kael-demo-caret" aria-hidden="true" />
            ) : null}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2.5">
        <div
          className="relative w-20 shrink-0 sm:w-24"
          title={t("landing.demo.poke")}
        >
          {poke ? (
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-0 w-max max-w-[130px] -translate-x-1/2 rounded-lg border border-[#262626] bg-[#0A0A0A] px-2 py-1 text-center text-[11px] leading-4 text-[#F5F5F0] shadow-[0_12px_30px_-18px_rgba(0,0,0,0.9)]">
              {t(poke.line)}
            </span>
          ) : null}
          <SlimeMascot
            mood={mood}
            idleSleepMs={0}
            onPoke={handlePoke}
            className="w-full"
          />
        </div>

        <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-[#262626] bg-[#0A0A0A] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="kael-display text-[10px] font-medium uppercase tracking-[0.14em] text-[#10B981]">
              KAEL
            </span>
            <span
              className="h-1 w-1 rounded-full bg-[#333333]"
              aria-hidden="true"
            />
            <span
              className="text-[10px] uppercase tracking-[0.12em] text-[#8E8E8A]"
              aria-live="polite"
            >
              {t(statusKey)}
            </span>
          </div>

          <div className="mt-2 min-h-[72px]">
            {phase === "thinking" ? (
              <div
                className="flex items-center gap-1.5 pt-1.5"
                aria-hidden="true"
              >
                {[0, 1, 2].map((index) => (
                  <span
                    key={index}
                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10B981]/70 motion-reduce:animate-none"
                    style={{ animationDelay: `${index * 160}ms` }}
                  />
                ))}
              </div>
            ) : (
              <p className="break-words text-[13px] leading-5 text-zinc-300">
                {visibleAnswer}
                {phase === "answer" ? (
                  <span className="kael-demo-caret" aria-hidden="true" />
                ) : null}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#262626] pt-3">
        <div className="flex items-center gap-0.5">
          {DEMO_EXAMPLES.map((item, index) => (
            <button
              key={item.prompt}
              type="button"
              onClick={() => selectExample(index)}
              aria-label={`${t(item.tag)} · ${t("landing.demo.example", {
                index: index + 1,
              })}`}
              aria-current={index === step ? "true" : undefined}
              className="group flex h-7 w-5 items-center justify-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/40"
            >
              <span
                className={`h-1.5 rounded-full transition-all ${
                  index === step
                    ? "w-5 bg-[#10B981]"
                    : "w-1.5 bg-[#333333] group-hover:bg-[#4A4A4A]"
                }`}
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onPrompt(prompt)}
          disabled={disabled || !prompt}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#10B981] px-3.5 py-2 text-sm font-semibold text-[#052E1C] transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#1C1C1C] disabled:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/50"
        >
          {t("landing.demo.try")}
          <ArrowUpRight size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      <p className="mt-2 text-[11px] leading-4 text-zinc-600">
        {t("landing.demo.note")}
      </p>
    </section>
  );
}
