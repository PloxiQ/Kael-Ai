"use client";

import {
  ArrowUpRight,
  AudioLines,
  Code2,
  FileCode2,
  FileText,
  ImageOff,
  Layers,
  Menu,
  Paperclip,
  Volume2,
  VolumeX,
} from "lucide-react";
import { MotionConfig, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import ThreeBackground, {
  type ThreeBackgroundQuality,
} from "../components/ThreeBackground";
import Composer from "../components/Composer";
import CursorGlow from "../components/CursorGlow";
import ArtifactDrawer from "../components/artifacts/ArtifactDrawer";
import ArtifactMessageBody from "../components/artifacts/ArtifactMessageBody";
import type { KaelArtifact } from "../components/artifacts/artifactParser";
import LanguageSelector from "../components/LanguageSelector";
import ModelSelector from "../components/ModelSelector";
import ModeSelector from "../components/ModeSelector";
import Sidebar, { type SidebarSession } from "../components/Sidebar";
import StreamingMessage from "../components/StreamingMessage";
import ThinkingStatus from "../components/ThinkingStatus";
import TiersModal from "../components/TiersModal";
import { UserChip } from "../components/UserChip";
import { authFetch } from "../lib/api";
import {
  MAX_ATTACHMENTS,
  MAX_TOTAL_ATTACHMENT_BYTES,
  attachmentPreviewUrl,
  createAttachment,
  formatFileSize,
  isStoredAttachment,
  toAttachmentPayload,
  toStoredAttachment,
  totalAttachmentBytes,
  type Attachment,
  type AttachmentPayload,
} from "../lib/attachments";
import {
  CREATOR_ANSWER,
  isCreatorQuestion,
} from "../lib/creator";
import { useI18n } from "../lib/i18n";
import {
  DEFAULT_MODEL_BY_PROVIDER,
  DEFAULT_MODEL_ID,
  isModelId,
  isProviderId,
  providerOf,
} from "../lib/models";
import {
  DEFAULT_MODE,
  isResponseMode,
  type ResponseMode,
} from "../lib/modes";
import {
  playSfx,
  setAmbientEnabled as setAmbientGlobal,
  setSfxEnabled as setSfxGlobal,
} from "../lib/sfx";
import {
  DEV_SECRET,
  createDefaultUsage,
  estimateTokens,
  readDevMode,
  readUsage,
  withAddedTokens,
  withTier,
  writeDevMode,
  writeUsage,
  type TierId,
  type UsageState,
} from "../lib/tiers";
import type { TranslationKey, Translate } from "../lib/translations";

type MessageRole = "user" | "assistant";

type ChatMessage = {
  id: number;
  role: MessageRole;
  content: string;
  isError: boolean;
  userMessage?: string;
  durationMs?: number;
  mode?: ResponseMode;
  attachments?: Attachment[];
};

type StoredSession = SidebarSession & {
  messages: ChatMessage[];
};

type ChatApiResponse = {
  reply?: string;
  detail?: string;
  latency_ms?: number;
  tokens_used?: number;
};

type PromptStarter = {
  title: TranslationKey;
  description: TranslationKey;
  prompt: TranslationKey;
};

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_KAEL_API_URL ?? "http://127.0.0.1:8000"
).replace(/\/$/, "");
const REQUEST_TIMEOUT_MS = 120_000;
const HEALTH_CHECK_INTERVAL_MS = 20_000;
const MAX_SESSIONS = 40;
const AMBIENT_3D_ENABLED_BY_DEFAULT = true;

const STORAGE_SESSIONS = "kael-sessions";
const STORAGE_ACTIVE_SESSION = "kael-active-session";
const STORAGE_MODEL = "kael-model";
const STORAGE_LEGACY_PROVIDER = "kael-provider";
const STORAGE_MODE = "kael-mode";
const STORAGE_3D = "kael-3d-enabled";
const STORAGE_QUALITY = "kael-3d-quality";
const STORAGE_SFX = "kael-sfx-enabled";
const STORAGE_AMBIENT = "kael-ambient-enabled";

const PROMPT_STARTERS: PromptStarter[] = [
  {
    title: "starter.explain.title",
    description: "starter.explain.description",
    prompt: "starter.explain.prompt",
  },
  {
    title: "starter.code.title",
    description: "starter.code.description",
    prompt: "starter.code.prompt",
  },
  {
    title: "starter.compare.title",
    description: "starter.compare.description",
    prompt: "starter.compare.prompt",
  },
  {
    title: "starter.document.title",
    description: "starter.document.description",
    prompt: "starter.document.prompt",
  },
];

const CAPABILITIES = [
  {
    icon: Code2,
    title: "capabilities.code.title",
    description: "capabilities.code.description",
  },
  {
    icon: FileText,
    title: "capabilities.docs.title",
    description: "capabilities.docs.description",
  },
  {
    icon: Paperclip,
    title: "capabilities.files.title",
    description: "capabilities.files.description",
  },
] as const;

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const message = value as Partial<ChatMessage>;

  if (typeof message.id !== "number" || !Number.isFinite(message.id)) {
    return false;
  }
  if (message.role !== "user" && message.role !== "assistant") {
    return false;
  }
  if (
    typeof message.content !== "string" ||
    typeof message.isError !== "boolean"
  ) {
    return false;
  }

  if (message.mode !== undefined && !isResponseMode(message.mode)) {
    return false;
  }

  if (
    message.attachments !== undefined &&
    (!Array.isArray(message.attachments) ||
      !message.attachments.every(isStoredAttachment))
  ) {
    return false;
  }

  return true;
}

function isStoredSession(value: unknown): value is StoredSession {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const session = value as Partial<StoredSession>;

  return (
    typeof session.id === "string" &&
    typeof session.title === "string" &&
    typeof session.updatedAt === "number" &&
    Array.isArray(session.messages) &&
    session.messages.every(isChatMessage)
  );
}

function toStoredMessage(message: ChatMessage): ChatMessage {
  if (!message.attachments || message.attachments.length === 0) {
    return message;
  }

  return {
    ...message,
    attachments: message.attachments.map(toStoredAttachment),
  };
}

function safeRead(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    return;
  }
}

function safeRemove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    return;
  }
}

function nextIdFromMessages(messages: ChatMessage[]): number {
  return (
    messages.reduce((highest, message) => Math.max(highest, message.id), 0) + 1
  );
}

function createSessionTitle(
  messages: ChatMessage[],
  fallback: string,
): string {
  const firstUserMessage = messages.find((message) => message.role === "user");
  if (!firstUserMessage) {
    return fallback;
  }

  const firstLine = firstUserMessage.content.trim().split(/\r?\n/)[0] ?? "";
  if (!firstLine) {
    return fallback;
  }

  return firstLine.length > 42
    ? `${firstLine.slice(0, 42).trimEnd()}…`
    : firstLine;
}

function getRequestError(error: unknown, t: Translate): string {
  if (error instanceof Error && error.name === "AbortError") {
    return t("error.timeout", { seconds: REQUEST_TIMEOUT_MS / 1000 });
  }

  if (error instanceof TypeError) {
    return t("error.connect", { url: BACKEND_URL });
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return t("error.unknown");
}

function LandingState({
  onPrompt,
  disabled,
}: {
  onPrompt: (prompt: string) => void;
  disabled: boolean;
}) {
  const { t } = useI18n();

  return (
    <section className="flex min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto my-auto w-full max-w-4xl">
        <div className="mb-5 flex items-center gap-3">
          <span className="h-px w-8 bg-kael-gradient" />
          <span className="kael-display text-sm font-medium uppercase tracking-[0.14em] text-[#f7a6ba]">
            {t("landing.badge")}
          </span>
          <span className="h-px flex-1 bg-gradient-to-r from-[#f5576c]/30 to-transparent" />
        </div>

        <h1 className="kael-display max-w-3xl text-[clamp(2.3rem,5.2vw,3.6rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-zinc-50">
          {t("landing.title1")}
          <br />
          <span className="kael-gradient-text">{t("landing.title2")}</span>
        </h1>

        <p className="mt-5 max-w-xl text-base leading-8 text-zinc-400">
          {t("landing.description")}
        </p>

        <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
          {PROMPT_STARTERS.map((starter, index) => (
            <button
              key={starter.title}
              type="button"
              onClick={() => onPrompt(t(starter.prompt))}
              disabled={disabled}
              className="group rounded-2xl border border-white/[0.08] bg-[#07070a]/70 p-4 text-left backdrop-blur-2xl transition hover:border-[#f093fb]/30 hover:bg-[#0d0d12]/80 hover:shadow-[0_24px_60px_-34px_rgba(245,87,108,0.6)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#f7a6ba]">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-2 text-base font-semibold text-zinc-100">
                    {t(starter.title)}
                  </p>
                  <p className="mt-1.5 text-sm leading-6 text-zinc-500">
                    {t(starter.description)}
                  </p>
                </div>
                <ArrowUpRight
                  size={18}
                  strokeWidth={1.5}
                  className="mt-0.5 shrink-0 text-zinc-600 transition group-hover:text-[#f5576c]"
                />
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 border-t border-white/[0.07] pt-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="kael-display text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
              {t("capabilities.title")}
            </span>
            <span className="hidden h-px min-w-6 flex-1 bg-white/[0.06] sm:block" />
            <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
              <ImageOff
                size={13}
                strokeWidth={1.6}
                className="shrink-0 text-zinc-600"
              />
              {t("capabilities.noImages")}
            </span>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3 sm:gap-5">
            {CAPABILITIES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-2.5">
                <Icon
                  size={17}
                  strokeWidth={1.6}
                  className="mt-0.5 shrink-0 text-[#f7a6ba]"
                />
                <div>
                  <p className="text-sm font-medium text-zinc-200">
                    {t(title)}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    {t(description)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MessageAttachments({ attachments }: { attachments: Attachment[] }) {
  const { language, t } = useI18n();
  const images = attachments.filter(
    (attachment) => attachment.kind === "image" && attachmentPreviewUrl(attachment),
  );
  const files = attachments.filter(
    (attachment) => attachment.kind !== "image" || !attachmentPreviewUrl(attachment),
  );

  return (
    <div className="flex max-w-full flex-col items-end gap-2">
      {images.length > 0 && (
        <div className="flex max-w-full flex-wrap justify-end gap-2">
          {images.map((attachment) => {
            const url = attachmentPreviewUrl(attachment);
            if (!url) {
              return null;
            }

            return (
              <a
                key={attachment.id}
                href={url}
                target="_blank"
                rel="noreferrer"
                title={attachment.name}
                className="group overflow-hidden rounded-xl border border-white/[0.09] bg-white/[0.03]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={attachment.name}
                  className="max-h-56 w-auto max-w-[min(18rem,100%)] object-cover transition duration-300 group-hover:scale-[1.02]"
                />
              </a>
            );
          })}
        </div>
      )}

      {files.length > 0 && (
        <div className="flex max-w-full flex-wrap justify-end gap-2">
          {files.map((attachment) => {
            const Icon = attachment.kind === "code" ? FileCode2 : FileText;

            return (
              <span
                key={attachment.id}
                className="inline-flex max-w-full items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2"
              >
                <Icon
                  size={16}
                  strokeWidth={1.6}
                  className="shrink-0 text-[#f7a6ba]"
                />
                <span className="min-w-0">
                  <span className="block max-w-[12rem] truncate text-sm font-medium text-zinc-200">
                    {attachment.name}
                  </span>
                  <span className="block text-sm text-zinc-500">
                    {attachment.kind === "pdf"
                      ? t("attachment.kind.pdf")
                      : attachment.kind === "code"
                        ? t("attachment.kind.code")
                        : t("attachment.kind.text")}{" "}
                    · {formatFileSize(attachment.size, language)}
                  </span>
                </span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ChatMessageRow({
  message,
  isStreaming = false,
  onStreamComplete,
  onOpenArtifact,
}: {
  message: ChatMessage;
  isStreaming?: boolean;
  onStreamComplete?: () => void;
  onOpenArtifact: (artifact: KaelArtifact) => void;
}) {
  const isUser = message.role === "user";
  const { t } = useI18n();
  const canStream = Boolean(
    isStreaming &&
      !message.isError &&
      !isUser &&
      onStreamComplete &&
      !message.content.includes("<kael_file"),
  );

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 18, scale: 0.985, filter: "blur(7px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      transition={{ type: "spring", stiffness: 260, damping: 27, mass: 0.9 }}
      className={`kael-message ${isUser ? "flex flex-col items-end" : ""}`}
    >
      <div
        className={`mb-3 flex w-full items-center gap-2.5 ${
          isUser ? "justify-end" : ""
        }`}
      >
        {!isUser && (
          <span className="kael-display flex h-6 w-6 items-center justify-center rounded-md bg-kael-gradient text-sm font-semibold text-[#1c0710]">
            K
          </span>
        )}
        <span
          className={
            isUser
              ? "text-sm text-zinc-500"
              : "kael-display text-sm font-medium tracking-[0.16em] text-zinc-300"
          }
        >
          {isUser ? t("chat.you") : "KAEL"}
        </span>
      </div>

      {!isUser && message.userMessage && (
        <div className="mb-4 w-full">
          <ThinkingStatus
            isThinking={false}
            userMessage={message.userMessage}
            durationMs={message.durationMs}
            mode={message.mode}
          />
        </div>
      )}

      {isUser ? (
        <div className="flex max-w-[92%] flex-col items-end gap-2.5 sm:max-w-[85%]">
          <p className="whitespace-pre-wrap rounded-2xl rounded-tr-md border border-white/[0.08] bg-white/[0.05] px-5 py-4 text-base leading-8 text-zinc-100 backdrop-blur-xl">
            {message.content}
          </p>
          {message.attachments && message.attachments.length > 0 && (
            <MessageAttachments attachments={message.attachments} />
          )}
        </div>
      ) : message.isError ? (
        <div className="w-full rounded-2xl border border-red-900/40 bg-red-950/15 px-5 py-4 backdrop-blur-2xl">
          <p className="text-sm font-medium text-red-300/90">
            {t("chat.responseMissing")}
          </p>
          <p className="mt-2 text-base leading-7 text-red-200/90">
            {message.content}
          </p>
        </div>
      ) : (
        <div className="w-full space-y-5">
          {canStream ? (
            <StreamingMessage
              content={message.content}
              enabled
              onComplete={onStreamComplete!}
              onOpenArtifact={onOpenArtifact}
            />
          ) : (
            <ArtifactMessageBody
              content={message.content}
              onOpenArtifact={onOpenArtifact}
            />
          )}
        </div>
      )}
    </motion.article>
  );
}

export default function ChatPage() {
  const { language, t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);
  const [mode, setMode] = useState<ResponseMode>(DEFAULT_MODE);
  const [usage, setUsage] = useState<UsageState>(createDefaultUsage);
  const [tiersOpen, setTiersOpen] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<KaelArtifact | null>(null);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [threeEnabled, setThreeEnabled] = useState(
    AMBIENT_3D_ENABLED_BY_DEFAULT,
  );
  const [quality, setQuality] = useState<ThreeBackgroundQuality>("low");
  const [nextMessageId, setNextMessageId] = useState(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [sfxOn, setSfxOn] = useState(true);
  const [ambientOn, setAmbientOn] = useState(false);
  const [typingEnergy, setTypingEnergy] = useState(0);
  const [streamingId, setStreamingId] = useState<number | null>(null);
  const [devMode, setDevMode] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const ambientRef = useRef<HTMLDivElement>(null);
  const typingEnergyRef = useRef(0);
  const typingDecayRef = useRef(0);
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    const saved3D = safeRead(STORAGE_3D);
    if (saved3D === "true" || saved3D === "false") {
      setThreeEnabled(saved3D === "true");
    }

    const savedQuality = safeRead(STORAGE_QUALITY);
    if (savedQuality === "low" || savedQuality === "high") {
      setQuality(savedQuality);
    }

    const savedModel = safeRead(STORAGE_MODEL);
    if (isModelId(savedModel)) {
      setModelId(savedModel);
    } else {
      const savedProvider = safeRead(STORAGE_LEGACY_PROVIDER);
      if (isProviderId(savedProvider)) {
        setModelId(DEFAULT_MODEL_BY_PROVIDER[savedProvider]);
      }
    }

    const savedMode = safeRead(STORAGE_MODE);
    if (isResponseMode(savedMode)) {
      setMode(savedMode);
    }

    const savedSfx = safeRead(STORAGE_SFX);
    const sfxEnabled = savedSfx !== "false";
    setSfxOn(sfxEnabled);
    setSfxGlobal(sfxEnabled);

    const savedAmbient = safeRead(STORAGE_AMBIENT) === "true";
    setAmbientOn(savedAmbient);
    setAmbientGlobal(savedAmbient);

    const savedDevMode = readDevMode();
    setDevMode(savedDevMode);

    let initialUsage = readUsage();
    if (savedDevMode && initialUsage.tierId !== "dev") {
      initialUsage = withTier(initialUsage, "dev");
      writeUsage(initialUsage);
    }
    setUsage(initialUsage);

    const savedSessions = safeRead(STORAGE_SESSIONS);
    if (savedSessions) {
      try {
        const parsed: unknown = JSON.parse(savedSessions);
        if (Array.isArray(parsed)) {
          const validSessions = parsed
            .filter(isStoredSession)
            .slice(0, MAX_SESSIONS);
          setSessions(validSessions);

          const savedActiveSession = safeRead(STORAGE_ACTIVE_SESSION);
          const activeSession =
            validSessions.find(
              (session) => session.id === savedActiveSession,
            ) ?? validSessions[0];

          if (activeSession) {
            setActiveSessionId(activeSession.id);
            setMessages(activeSession.messages);
            setNextMessageId(nextIdFromMessages(activeSession.messages));
          }
        }
      } catch {
        safeRemove(STORAGE_SESSIONS);
      }
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    safeWrite(STORAGE_MODEL, modelId);
  }, [hydrated, modelId]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    safeWrite(STORAGE_MODE, mode);
  }, [hydrated, mode]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    setSfxGlobal(sfxOn);
    safeWrite(STORAGE_SFX, String(sfxOn));
  }, [hydrated, sfxOn]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    setAmbientGlobal(ambientOn);
    safeWrite(STORAGE_AMBIENT, String(ambientOn));
  }, [hydrated, ambientOn]);

  useEffect(() => {
    let lastElement: Element | null = null;
    let lastAt = 0;

    const handlePointerOver = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const interactive = target.closest(
        "button, a, [role='button'], [role='option'], input, textarea, select",
      );

      if (!interactive || interactive === lastElement) {
        return;
      }

      const now = performance.now();
      if (now - lastAt < 70) {
        return;
      }

      lastElement = interactive;
      lastAt = now;
      playSfx("hover");
    };

    const handlePointerOut = () => {
      lastElement = null;
    };

    window.addEventListener("pointerover", handlePointerOver, { passive: true });
    window.addEventListener("pointerout", handlePointerOut, { passive: true });

    return () => {
      window.removeEventListener("pointerover", handlePointerOver);
      window.removeEventListener("pointerout", handlePointerOut);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (typingDecayRef.current) {
        window.clearInterval(typingDecayRef.current);
        typingDecayRef.current = 0;
      }
    };
  }, []);

  useEffect(() => {
    const layer = ambientRef.current;
    if (!layer) {
      return undefined;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let raf = 0;

    const frame = () => {
      currentX += (targetX - currentX) * 0.07;
      currentY += (targetY - currentY) * 0.07;
      layer.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0) scale(1.03)`;

      if (
        Math.abs(targetX - currentX) > 0.05 ||
        Math.abs(targetY - currentY) > 0.05
      ) {
        raf = window.requestAnimationFrame(frame);
      } else {
        raf = 0;
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      targetX = (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 26;
      targetY = (event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 20;

      if (!raf) {
        raf = window.requestAnimationFrame(frame);
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", handlePointerMove);
      layer.style.transform = "";
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (activeSessionId) {
      safeWrite(STORAGE_ACTIVE_SESSION, activeSessionId);
    }

    if (!activeSessionId || messages.length === 0) {
      return;
    }

    setSessions((current) => {
      const existing = current.find(
        (session) => session.id === activeSessionId,
      );
      const nextSession: StoredSession = {
        id: activeSessionId,
        title: existing?.title ?? createSessionTitle(messages, tRef.current("chat.newDialog")),
        updatedAt: Date.now(),
        messages,
      };
      const nextSessions = [
        nextSession,
        ...current.filter((session) => session.id !== activeSessionId),
      ].slice(0, MAX_SESSIONS);

      const persistedSessions = nextSessions.map((session) => ({
        ...session,
        messages: session.messages.map(toStoredMessage),
      }));

      safeWrite(STORAGE_SESSIONS, JSON.stringify(persistedSessions));
      return nextSessions;
    });
  }, [activeSessionId, hydrated, messages]);

  useEffect(() => {
    let mounted = true;

    const checkHealth = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/health`, {
          cache: "no-store",
        });
        if (mounted) {
          setIsOnline(response.ok);
        }
      } catch {
        if (mounted) {
          setIsOnline(false);
        }
      }
    };

    void checkHealth();
    const interval = window.setInterval(
      () => void checkHealth(),
      HEALTH_CHECK_INTERVAL_MS,
    );

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [isThinking, messages]);

  function toggle3D() {
    playSfx("toggle");
    setThreeEnabled((current) => {
      const next = !current;
      safeWrite(STORAGE_3D, String(next));
      return next;
    });
  }

  function changeQuality(next: ThreeBackgroundQuality) {
    playSfx("click");
    setQuality(next);
    safeWrite(STORAGE_QUALITY, next);
  }

  function toggleSfx() {
    const next = !sfxOn;
    setSfxOn(next);
    setSfxGlobal(next);
    if (next) {
      playSfx("toggle");
    }
  }

  function toggleAmbient() {
    const next = !ambientOn;
    setAmbientOn(next);
    setAmbientGlobal(next);
    if (next) {
      playSfx("toggle");
    }
  }

  function bumpTypingEnergy() {
    typingEnergyRef.current = Math.min(1, typingEnergyRef.current + 0.3);
    setTypingEnergy(typingEnergyRef.current);

    if (!typingDecayRef.current) {
      typingDecayRef.current = window.setInterval(() => {
        typingEnergyRef.current = Math.max(0, typingEnergyRef.current - 0.085);
        setTypingEnergy(typingEnergyRef.current);

        if (typingEnergyRef.current <= 0) {
          window.clearInterval(typingDecayRef.current);
          typingDecayRef.current = 0;
        }
      }, 90);
    }
  }

  function handleInputChange(value: string) {
    setInput(value);
    if (value.trim().length > 0) {
      bumpTypingEnergy();
    }
  }

  function handleStreamComplete(messageId: number) {
    setStreamingId((current) => (current === messageId ? null : current));
    playSfx("success");
  }

  function handleOpenArtifact(artifact: KaelArtifact) {
    playSfx("open");
    setActiveArtifact(artifact);
  }

  function selectTier(tierId: TierId) {
    if (tierId !== "dev") {
      return;
    }

    setDevMode(true);
    writeDevMode(true);
    setUsage((current) => {
      const next = withTier(current, tierId);
      writeUsage(next);
      return next;
    });
    playSfx("success");
    setTiersOpen(false);
  }

  function unlockDev() {
    setDevMode(true);
    writeDevMode(true);
    setUsage((current) => {
      const next = withTier(current, "dev");
      writeUsage(next);
      return next;
    });
    playSfx("success");
  }

  async function addFiles(files: File[]) {
    if (files.length === 0 || isThinking || isReadingFiles) {
      return;
    }

    setAttachmentError(null);
    const room = MAX_ATTACHMENTS - attachments.length;

    if (room <= 0) {
      setAttachmentError(
        t("attachment.maxFiles", { count: MAX_ATTACHMENTS }),
      );
      playSfx("error");
      return;
    }

    const selected = files.slice(0, room);
    const notices: string[] = [];

    if (files.length > room) {
      notices.push(t("attachment.limit", { count: MAX_ATTACHMENTS }));
    }

    setIsReadingFiles(true);

    try {
      const results = await Promise.allSettled(
        selected.map((file) => createAttachment(file, language)),
      );
      const added: Attachment[] = [];

      for (const result of results) {
        if (result.status === "fulfilled") {
          added.push(result.value);
        } else {
          notices.push(
            result.reason instanceof Error
              ? result.reason.message
              : t("attachment.unreadable"),
          );
        }
      }

      let total = totalAttachmentBytes(attachments);
      const accepted: Attachment[] = [];

      for (const attachment of added) {
        if (total + attachment.size > MAX_TOTAL_ATTACHMENT_BYTES) {
          notices.push(
            t("attachment.totalSize", {
              size: formatFileSize(MAX_TOTAL_ATTACHMENT_BYTES, language),
            }),
          );
          continue;
        }

        total += attachment.size;
        accepted.push(attachment);
      }

      if (accepted.length > 0) {
        setAttachments((current) =>
          [...current, ...accepted].slice(0, MAX_ATTACHMENTS),
        );
        playSfx("pop");
      }

      if (notices.length > 0) {
        setAttachmentError(notices[0]);
        if (accepted.length === 0) {
          playSfx("error");
        }
      }
    } finally {
      setIsReadingFiles(false);
    }
  }

  function removeAttachment(id: string) {
    setAttachments((current) =>
      current.filter((attachment) => attachment.id !== id),
    );
    setAttachmentError(null);
    playSfx("click");
  }

  function newChat() {
    if (isThinking) {
      return;
    }

    setActiveSessionId(`session-${Date.now()}`);
    setMessages([]);
    setNextMessageId(1);
    setInput("");
    setAttachments([]);
    setAttachmentError(null);
    setMobileSidebarOpen(false);
    playSfx("open");
  }

  function selectSession(id: string) {
    if (isThinking) {
      return;
    }

    const selected = sessions.find((session) => session.id === id);
    if (!selected) {
      return;
    }

    setActiveSessionId(selected.id);
    setMessages(selected.messages);
    setNextMessageId(nextIdFromMessages(selected.messages));
    setInput("");
    setAttachments([]);
    setAttachmentError(null);
    setMobileSidebarOpen(false);
    playSfx("click");
  }

  async function sendMessage(messageOverride?: string) {
    const typedInput = (messageOverride ?? input).trim();
    const pendingAttachments = attachments;

    if (
      (!typedInput && pendingAttachments.length === 0) ||
      isThinking ||
      isReadingFiles
    ) {
      return;
    }

    const effectiveText = typedInput || t("chat.attachmentOnly");
    const creatorQuestion =
      typedInput.length > 0 && isCreatorQuestion(typedInput);
    const payloadAttachments = pendingAttachments
      .map(toAttachmentPayload)
      .filter(
        (attachment): attachment is AttachmentPayload => attachment !== null,
      );
    const devBypass = devMode && usage.tierId === "dev";
    const sessionId = activeSessionId || `session-${Date.now()}`;
    const userMessageId = nextMessageId;
    const assistantMessageId = nextMessageId + 1;
    const selectedModelId = modelId;
    const selectedProvider = providerOf(selectedModelId);
    const selectedMode = mode;
    const startedAt = performance.now();

    setActiveSessionId(sessionId);
    setMessages((current) => [
      ...current,
      {
        id: userMessageId,
        role: "user",
        content: effectiveText,
        isError: false,
        ...(pendingAttachments.length > 0
          ? { attachments: pendingAttachments }
          : {}),
      },
    ]);
    setInput("");
    setAttachments([]);
    setAttachmentError(null);
    setNextMessageId((current) => current + 2);
    setIsThinking(true);
    setMobileSidebarOpen(false);
    playSfx("send");

    if (creatorQuestion) {
      await new Promise((resolve) => window.setTimeout(resolve, 320));

      setMessages((current) => [
        ...current,
        {
          id: assistantMessageId,
          role: "assistant",
          content: CREATOR_ANSWER,
          isError: false,
          userMessage: typedInput,
          durationMs: 320,
          mode: selectedMode,
        },
      ]);
      setStreamingId(assistantMessageId);
      setIsThinking(false);
      playSfx("success");
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS,
    );

    try {
      const response = await authFetch("/api/chat", {
        method: "POST",
        headers: {
          ...(devBypass ? { "X-Developer-Secret": DEV_SECRET } : {}),
        },
        body: JSON.stringify({
          message: effectiveText,
          model: selectedModelId,
          provider: selectedProvider,
          mode: selectedMode,
          language,
          dev_mode: devBypass,
          ...(payloadAttachments.length > 0
            ? { attachments: payloadAttachments }
            : {}),
        }),
        signal: controller.signal,
      });

      let data: ChatApiResponse | null = null;
      try {
        data = (await response.json()) as ChatApiResponse;
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.detail ?? t("error.backendHttp", { status: response.status }),
        );
      }

      const reply = data?.reply?.trim();
      if (!reply) {
        throw new Error(t("error.backendEmpty"));
      }

      const clientDurationMs = Math.round(performance.now() - startedAt);
      const reportedTokens = data?.tokens_used;
      const usedTokens =
        typeof reportedTokens === "number" &&
        Number.isFinite(reportedTokens) &&
        reportedTokens > 0
          ? Math.round(reportedTokens)
          : estimateTokens(effectiveText) + estimateTokens(reply);

      if (!devBypass) {
        setUsage((current) => {
          const next = withAddedTokens(current, usedTokens);
          writeUsage(next);
          return next;
        });
      }

      setMessages((current) => [
        ...current,
        {
          id: assistantMessageId,
          role: "assistant",
          content: reply,
          isError: false,
          userMessage: effectiveText,
          durationMs: data?.latency_ms ?? clientDurationMs,
          mode: selectedMode,
        },
      ]);
      setStreamingId(assistantMessageId);
      playSfx("success");
    } catch (error) {
      const durationMs = Math.round(performance.now() - startedAt);

      setMessages((current) => [
        ...current,
        {
          id: assistantMessageId,
          role: "assistant",
          content: getRequestError(error, t),
          isError: true,
          userMessage: effectiveText,
          durationMs,
          mode: selectedMode,
        },
      ]);
      playSfx("error");
    } finally {
      window.clearTimeout(timeoutId);
      setIsThinking(false);
    }
  }

  const lastUserMessage =
    messages.filter((message) => message.role === "user").at(-1)?.content ?? "";

  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ type: "spring", stiffness: 260, damping: 27, mass: 0.9 }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div
          ref={ambientRef}
          className="absolute inset-0 will-change-transform"
        >
          <div className="kael-orb kael-orb-ripe -right-40 -top-52 h-[36rem] w-[36rem]" />
          <div className="kael-orb kael-orb-coral -left-48 top-[38%] h-[32rem] w-[32rem]" />
          <div className="kael-orb kael-orb-violet -bottom-72 right-[22%] h-[34rem] w-[34rem]" />
        </div>
        <div className="kael-gradient-mesh absolute inset-0" />
        <div className="kael-pointer-mesh absolute inset-0" />
        <div className="kael-vignette absolute inset-0" />
      </div>

      <CursorGlow />

      <ThreeBackground
        enabled={threeEnabled}
        quality={quality}
        isThinking={isThinking}
        hasMessages={messages.length > 0}
        typingEnergy={typingEnergy}
      />

      <main className="relative z-10 flex h-[100dvh] w-full overflow-hidden text-zinc-100">
        <Sidebar
          collapsed={sidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          sessions={sessions}
          activeSessionId={activeSessionId}
          isOnline={isOnline}
          busy={isThinking}
          usage={usage}
          onToggle={() => {
            playSfx("click");
            setSidebarCollapsed((current) => !current);
          }}
          onMobileClose={() => {
            playSfx("close");
            setMobileSidebarOpen(false);
          }}
          onNewChat={newChat}
          onSelectSession={selectSession}
          onOpenTiers={() => {
            playSfx("open");
            setTiersOpen(true);
          }}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="relative z-20 shrink-0 border-b border-white/[0.06] bg-[#07070a]/75 px-4 py-2.5 backdrop-blur-2xl sm:h-[72px] sm:px-6 sm:py-0 lg:px-8">
            <div className="flex h-full flex-wrap items-center gap-x-3 gap-y-2 sm:flex-nowrap sm:gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3 sm:flex-none">
              <button
                type="button"
                onClick={() => {
                  playSfx("open");
                  setMobileSidebarOpen(true);
                }}
                aria-label={t("header.openMenu")}
                className="rounded-lg p-2.5 text-zinc-400 transition hover:bg-white/[0.05] hover:text-zinc-100 active:scale-95 lg:hidden"
              >
                <Menu size={20} strokeWidth={1.5} />
              </button>

              <span className="kael-display shrink-0 text-base font-semibold tracking-[0.2em] text-white sm:text-lg">
                KAEL
              </span>

              <span className="hidden h-4 w-px bg-white/[0.1] sm:block" />

              <div className="hidden items-center gap-2 sm:flex">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isOnline ? "kael-pulse bg-[#f5576c]" : "bg-zinc-700"
                  }`}
                />
                <span className="text-sm text-zinc-500">
                  {isOnline ? t("app.online") : t("app.offline")}
                </span>
              </div>
            </div>

            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={toggle3D}
                aria-pressed={threeEnabled}
                title={threeEnabled ? t("header.3dOff") : t("header.3dOn")}
                className={`hidden h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm transition sm:inline-flex ${
                  threeEnabled
                    ? "border-[#f093fb]/30 bg-kael-gradient-soft text-zinc-100 hover:border-[#f093fb]/50"
                    : "border-white/[0.08] text-zinc-500 hover:border-white/[0.16] hover:text-zinc-300"
                }`}
              >
                <Layers size={16} strokeWidth={1.5} />
                <span className="hidden sm:inline">3D</span>
              </button>

              <select
                aria-label={t("header.quality")}
                value={quality}
                disabled={!threeEnabled}
                onChange={(event) =>
                  changeQuality(event.target.value as ThreeBackgroundQuality)
                }
                className="hidden h-10 shrink-0 cursor-pointer rounded-xl border border-white/[0.08] bg-[#07070a]/70 px-3 text-sm text-zinc-400 outline-none transition hover:border-white/[0.16] disabled:cursor-not-allowed disabled:opacity-40 md:block"
              >
                <option value="low">{t("header.qualityLow")}</option>
                <option value="high">{t("header.qualityHigh")}</option>
              </select>
            </div>

            <div className="order-last flex w-full min-w-0 items-center gap-2 sm:order-none sm:w-auto sm:flex-1 sm:justify-end">
              <ModeSelector
                value={mode}
                onChange={setMode}
                disabled={isThinking}
              />

              <ModelSelector
                value={modelId}
                onChange={setModelId}
                disabled={isThinking}
              />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <UserChip compact />

              <LanguageSelector />

              <button
                type="button"
                onClick={toggleSfx}
                aria-pressed={sfxOn}
                aria-label={
                  sfxOn ? t("header.sfxOff") : t("header.sfxOn")
                }
                title={
                  sfxOn ? t("header.sfxEnabled") : t("header.sfxDisabled")
                }
                className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5576c]/35 ${
                  sfxOn
                    ? "border-[#f093fb]/25 bg-kael-gradient-soft text-zinc-200 hover:border-[#f093fb]/45"
                    : "border-white/[0.08] text-zinc-500 hover:border-white/[0.16] hover:text-zinc-300"
                }`}
              >
                {sfxOn ? (
                  <Volume2 size={17} strokeWidth={1.7} />
                ) : (
                  <VolumeX size={17} strokeWidth={1.7} />
                )}
              </button>

              <button
                type="button"
                onClick={toggleAmbient}
                aria-pressed={ambientOn}
                aria-label={
                  ambientOn ? t("header.ambientOff") : t("header.ambientOn")
                }
                title={
                  ambientOn
                    ? t("header.ambientEnabled")
                    : t("header.ambientDisabled")
                }
                className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5576c]/35 ${
                  ambientOn
                    ? "border-[#f5576c]/30 bg-kael-gradient-soft text-zinc-200 hover:border-[#f5576c]/50"
                    : "border-white/[0.08] text-zinc-500 hover:border-white/[0.16] hover:text-zinc-300"
                }`}
              >
                <AudioLines size={17} strokeWidth={1.7} />
              </button>
            </div>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col">
            {messages.length === 0 ? (
              <LandingState
                onPrompt={(prompt) => void sendMessage(prompt)}
                disabled={isThinking}
              />
            ) : (
              <section
                aria-label={t("header.chatHistory")}
                aria-busy={isThinking}
                className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-6"
              >
                <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 py-8 sm:py-10">
                  {messages.map((message) => (
                    <ChatMessageRow
                      key={message.id}
                      message={message}
                      isStreaming={streamingId === message.id}
                      onStreamComplete={() => handleStreamComplete(message.id)}
                      onOpenArtifact={handleOpenArtifact}
                    />
                  ))}

                  {isThinking && (
                    <div className="kael-message">
                      <ThinkingStatus
                        isThinking
                        userMessage={lastUserMessage}
                        mode={mode}
                      />
                    </div>
                  )}

                  <div ref={bottomRef} className="h-px w-full shrink-0" />
                </div>
              </section>
            )}

            <Composer
              value={input}
              attachments={attachments}
              isThinking={isThinking}
              isReadingFiles={isReadingFiles}
              attachmentError={attachmentError}
              onChange={handleInputChange}
              onSubmit={() => void sendMessage()}
              onAddFiles={(files) => void addFiles(files)}
              onRemoveAttachment={removeAttachment}
              onDismissError={() => setAttachmentError(null)}
            />
          </div>
        </div>
      </main>

      <TiersModal
        open={tiersOpen}
        usage={usage}
        devMode={devMode}
        onClose={() => {
          playSfx("close");
          setTiersOpen(false);
        }}
        onSelectTier={selectTier}
        onUnlockDev={unlockDev}
      />

      <ArtifactDrawer
        artifact={activeArtifact}
        onClose={() => {
          playSfx("close");
          setActiveArtifact(null);
        }}
      />
    </MotionConfig>
  );
}
