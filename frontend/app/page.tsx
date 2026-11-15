"use client";

import {
  ArrowUpRight,
  FileCode2,
  FileText,
  Menu,
  ScrollText,
  Settings,
} from "lucide-react";
import { MotionConfig, motion } from "framer-motion";
import { useEffect, useCallback, useRef, useState } from "react";
import ChangelogModal from "../components/ChangelogModal";
import Composer from "../components/Composer";
import ArtifactDrawer from "../components/artifacts/ArtifactDrawer";
import ArtifactMessageBody from "../components/artifacts/ArtifactMessageBody";
import type { KaelArtifact } from "../components/artifacts/artifactParser";
import { KAEL_TOUR_DONE_EVENT, KAEL_TOUR_DONE_KEY, restartKaelTour } from "../components/KaelTour";
import { LandingDemo } from "../components/LandingDemo";
import LanguageSelector from "../components/LanguageSelector";
import { MascotCompanion } from "../components/MascotCompanion";
import ModelSelector from "../components/ModelSelector";
import ModeSelector from "../components/ModeSelector";
import SettingsModal from "../components/SettingsModal";
import Sidebar, { type SidebarSession } from "../components/Sidebar";
import StreamingMessage from "../components/StreamingMessage";
import ThinkingStatus from "../components/ThinkingStatus";
import TiersModal from "../components/TiersModal";
import { UserChip } from "../components/UserChip";
import { useKaelAuth } from "../components/auth/KaelAuthProvider";
import LegalLinks from "../components/legal/LegalLinks";
import McpApprovalPanel from "../components/mcp/McpApprovalPanel";
import McpTrace from "../components/mcp/McpTrace";
import { authFetch, isProvidersResponse, type ProvidersResponse } from "../lib/api";
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
  MCP_CHANGED_EVENT,
  fetchMcpServers,
  type McpToolRequest,
  type McpTraceEntry,
} from "../lib/mcp";
import { moodForError, moodForReply, type MascotPhase } from "../lib/mascot";
import {
  DEFAULT_MODEL_BY_PROVIDER,
  DEFAULT_MODEL_ID,
  isModelId,
  isProviderId,
  PROVIDER_IDS,
  providerOf,
} from "../lib/models";
import {
  DEFAULT_MODE,
  isResponseMode,
  type ResponseMode,
} from "../lib/modes";
import {
  DEFAULT_PREFERENCES,
  buildPersonalization,
  readPreferences,
  writePreferences,
  type KaelPreferences,
} from "../lib/preferences";
import {
  playSfx,
  setAmbientEnabled as setAmbientGlobal,
  setSfxEnabled as setSfxGlobal,
} from "../lib/sfx";
import type { SlimeMood } from "../lib/slime";
import {
  createDefaultUsage,
  estimateTokens,
  readUsage,
  tierForRole,
  withAddedTokens,
  withTier,
  writeUsage,
  type UsageState,
} from "../lib/tiers";
import type { TranslationKey, Translate } from "../lib/translations";
import { KAEL_CHANGELOG_SEEN_KEY, KAEL_VERSION, KAEL_VERSION_LABEL } from "../lib/version";

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
  mcpTrace?: McpTraceEntry[];
};

type StoredSession = SidebarSession & {
  messages: ChatMessage[];
};

type ChatApiResponse = {
  reply?: string;
  detail?: string;
  latency_ms?: number;
  tokens_used?: number;
  status?: "ok" | "approval_required";
  approval_token?: string | null;
  tool_requests?: McpToolRequest[];
  mcp_trace?: McpTraceEntry[];
};

type PendingApproval = {
  token: string;
  requests: McpToolRequest[];
  userMessage: string;
  mode: ResponseMode;
  messageId: number;
  devMode: boolean;
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

const STORAGE_SESSIONS = "kael-sessions";
const STORAGE_ACTIVE_SESSION = "kael-active-session";
const STORAGE_MODEL = "kael-model";
const STORAGE_LEGACY_PROVIDER = "kael-provider";
const STORAGE_MODE = "kael-mode";
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

function isMcpTraceEntry(value: unknown): value is McpTraceEntry {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const entry = value as Partial<McpTraceEntry>;

  return (
    typeof entry.server_id === "string" &&
    typeof entry.server_name === "string" &&
    typeof entry.tool === "string" &&
    (entry.status === "ok" ||
      entry.status === "error" ||
      entry.status === "denied") &&
    typeof entry.duration_ms === "number" &&
    (entry.error === null || typeof entry.error === "string")
  );
}

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

  if (
    message.mcpTrace !== undefined &&
    (!Array.isArray(message.mcpTrace) ||
      !message.mcpTrace.every(isMcpTraceEntry))
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
  onOpenChangelog,
  disabled,
  reduceMotion,
  showDemo,
  showQuickStart,
}: {
  onPrompt: (prompt: string) => void;
  onOpenChangelog: () => void;
  disabled: boolean;
  reduceMotion: boolean;
  showDemo: boolean;
  showQuickStart: boolean;
}) {
  const { t } = useI18n();

  return (
    <section className="flex min-h-0 flex-1 overflow-y-auto px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-8">
      <div className="mx-auto my-auto w-full max-w-6xl">
        <div
          className={`grid gap-8 ${
            showDemo
              ? "xl:grid-cols-[minmax(0,1fr)_minmax(400px,440px)] xl:items-center xl:gap-12"
              : "xl:grid-cols-1"
          }`}
        >
          <div className="min-w-0">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-[#10B981]" />
              <span className="kael-display shrink-0 text-xs font-medium uppercase tracking-[0.14em] text-[#10B981] sm:text-sm">
                {t("landing.badge")}
              </span>
              <span className="h-px flex-1 bg-[#262626]" />
              <button
                type="button"
                onClick={onOpenChangelog}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#262626] bg-[#161616] px-2.5 py-1.5 text-xs font-medium text-[#8E8E8A] transition hover:border-[#10B981]/40 hover:text-[#F5F5F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/40"
              >
                <ScrollText size={13} strokeWidth={1.7} aria-hidden="true" />
                {t("changelog.open")}
                <span className="hidden tabular-nums text-[#10B981] sm:inline">
                  {KAEL_VERSION_LABEL}
                </span>
              </button>
            </div>

            <h1 className="kael-display max-w-3xl text-[clamp(2.1rem,3.2vw,3rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-zinc-50">
              {t("landing.title1")}
              <br />
              <span className="text-[#10B981]">{t("landing.title2")}</span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-400 sm:text-base sm:leading-8">
              {t("landing.description")}
            </p>

            {showQuickStart && (
              <>
                <div className="mb-2.5 mt-6 flex items-center gap-3">
                  <span className="kael-display text-[11px] font-medium uppercase tracking-[0.14em] text-[#8E8E8A]">
                    {t("landing.quickStart")}
                  </span>
                  <span className="h-px flex-1 bg-[#1C1C1C]" />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {PROMPT_STARTERS.map((starter, index) => (
                    <button
                      key={starter.title}
                      type="button"
                      onClick={() => onPrompt(t(starter.prompt))}
                      disabled={disabled}
                      title={t(starter.description)}
                      className="group flex min-w-0 items-center gap-2.5 rounded-xl border border-[#262626] bg-[#161616] px-3 py-2.5 text-left transition hover:border-[#10B981]/40 hover:bg-[#1C1C1C] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="text-xs font-medium tabular-nums text-[#10B981]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-200">
                        {t(starter.title)}
                      </span>
                      <ArrowUpRight
                        size={15}
                        strokeWidth={1.6}
                        className="shrink-0 text-zinc-600 transition group-hover:text-[#10B981]"
                      />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {showDemo && (
            <div className="min-w-0">
              <LandingDemo
                onPrompt={onPrompt}
                disabled={disabled}
                reduceMotion={reduceMotion}
              />
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#262626] pt-5">
          <span className="text-xs tabular-nums text-[#8E8E8A]">
            KAEL {KAEL_VERSION_LABEL}
          </span>
          <LegalLinks />
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
                rel="noopener noreferrer"
                title={attachment.name}
                className="group overflow-hidden rounded-xl border border-[#262626] bg-[#1C1C1C]"
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
                className="inline-flex max-w-full items-center gap-2 rounded-xl border border-[#262626] bg-[#1C1C1C] px-3 py-2"
              >
                <Icon
                  size={16}
                  strokeWidth={1.6}
                  className="shrink-0 text-[#10B981]"
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
          <span className="kael-display flex h-6 w-6 items-center justify-center rounded-md bg-[#10B981] text-sm font-semibold text-[#052E1C]">
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
          <p className="whitespace-pre-wrap rounded-2xl rounded-tr-md border border-[#262626] bg-[#1C1C1C] px-5 py-4 text-base leading-8 text-zinc-100 backdrop-blur-xl">
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

          {message.mcpTrace && message.mcpTrace.length > 0 && (
            <McpTrace entries={message.mcpTrace} />
          )}
        </div>
      )}
    </motion.article>
  );
}

export default function ChatPage() {
  const { language, t } = useI18n();
  const { role } = useKaelAuth();
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
  const [mascotPhase, setMascotPhase] = useState<MascotPhase>("idle");
  const [mascotMood, setMascotMood] = useState<SlimeMood>("happy");
  const [isOnline, setIsOnline] = useState(false);
  const [nextMessageId, setNextMessageId] = useState(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [sfxOn, setSfxOn] = useState(true);
  const [ambientOn, setAmbientOn] = useState(false);
  const [preferences, setPreferences] = useState<KaelPreferences>(
    DEFAULT_PREFERENCES,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [streamingId, setStreamingId] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [providers, setProviders] = useState<ProvidersResponse | null>(null);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [mcpServerIds, setMcpServerIds] = useState<string[]>([]);
  const [pendingApproval, setPendingApproval] =
    useState<PendingApproval | null>(null);
  const [approvalBusy, setApprovalBusy] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const changelogAutoRef = useRef(false);
  const preferencesRef = useRef(preferences);
  const tRef = useRef(t);
  tRef.current = t;
  preferencesRef.current = preferences;

  const refreshProviders = useCallback(async () => {
    setProvidersLoading(true);

    try {
      const response = await authFetch("/api/providers");
      if (!response.ok) {
        setProviders(null);
        return;
      }

      const data: unknown = await response.json();
      if (!isProvidersResponse(data)) {
        setProviders(null);
        return;
      }

      setProviders(data);

      const available = PROVIDER_IDS.filter((provider) => data[provider]);
      const fallback = available[0];

      if (fallback) {
        setModelId((current) =>
          available.includes(providerOf(current))
            ? current
            : DEFAULT_MODEL_BY_PROVIDER[fallback],
        );
      }
    } catch {
      setProviders(null);
    } finally {
      setProvidersLoading(false);
    }
  }, []);

  const refreshMcpServers = useCallback(async () => {
    try {
      const servers = await fetchMcpServers();
      setMcpServerIds(
        servers
          .filter((server) => server.enabled && server.status === "connected")
          .map((server) => server.id),
      );
    } catch {
      setMcpServerIds([]);
    }
  }, []);

  useEffect(() => {
    void refreshMcpServers();

    const handleChange = () => void refreshMcpServers();
    window.addEventListener(MCP_CHANGED_EVENT, handleChange);
    return () => window.removeEventListener(MCP_CHANGED_EVENT, handleChange);
  }, [refreshMcpServers]);

  useEffect(() => {
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

    setPreferences(readPreferences());

    setUsage(readUsage());

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

  // A saved/default model can point at a provider without a key. Ask the
  // backend which providers are live and move to one that can answer.
  useEffect(() => {
    void refreshProviders();
  }, [refreshProviders]);

  // Returning users already finished the tour, so surface the changelog once.
  useEffect(() => {
    if (!hydrated || changelogAutoRef.current) {
      return;
    }

    changelogAutoRef.current = true;

    if (!preferencesRef.current.changelogAuto) {
      return;
    }

    let seen = false;
    let tourDone = false;

    try {
      seen = localStorage.getItem(KAEL_CHANGELOG_SEEN_KEY) === KAEL_VERSION;
      tourDone = localStorage.getItem(KAEL_TOUR_DONE_KEY) === "1";
    } catch {
      // Storage can be unavailable; skip the automatic changelog.
    }

    if (seen || !tourDone) {
      return;
    }

    const timer = window.setTimeout(() => setChangelogOpen(true), 850);
    return () => window.clearTimeout(timer);
  }, [hydrated]);

  // A natural tour completion opens the changelog once, after the tour closes.
  useEffect(() => {
    const onTourDone = (event: Event) => {
      const detail = (event as CustomEvent<{ completed?: boolean }>).detail;
      if (!detail?.completed || !preferencesRef.current.changelogAuto) {
        return;
      }

      let seen = false;
      try {
        seen = localStorage.getItem(KAEL_CHANGELOG_SEEN_KEY) === KAEL_VERSION;
      } catch {
        // Storage can be unavailable; still show the changelog once.
      }

      if (seen) {
        return;
      }

      window.setTimeout(() => setChangelogOpen(true), 240);
    };

    window.addEventListener(KAEL_TOUR_DONE_EVENT, onTourDone);
    return () => window.removeEventListener(KAEL_TOUR_DONE_EVENT, onTourDone);
  }, []);

  useEffect(() => {
    setUsage((current) => {
      const tierId = tierForRole(role);
      if (current.tierId === tierId) {
        return current;
      }
      const next = withTier(current, tierId);
      writeUsage(next);
      return next;
    });
  }, [role]);

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
    if (!hydrated) {
      return;
    }
    writePreferences(preferences);
  }, [hydrated, preferences]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const root = document.documentElement;
    root.dataset.theme = preferences.theme;
    root.dataset.interfaceFont = preferences.interfaceFont;
    root.dataset.displayFont = preferences.displayFont;
    root.style.colorScheme = preferences.theme;

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute(
        "content",
        preferences.theme === "light" ? "#F5F7F3" : "#0A0A0A",
      );
    }
  }, [
    hydrated,
    preferences.theme,
    preferences.interfaceFont,
    preferences.displayFont,
  ]);

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
    if (!preferences.autoScroll) {
      return;
    }

    bottomRef.current?.scrollIntoView({
      behavior: preferences.reduceMotion ? "auto" : "smooth",
      block: "end",
    });
  }, [isThinking, messages, preferences.autoScroll, preferences.reduceMotion]);

  function updateSfx(enabled: boolean) {
    setSfxOn(enabled);
    setSfxGlobal(enabled);
    if (enabled) {
      playSfx("toggle");
    }
  }

  function updateAmbient(enabled: boolean) {
    setAmbientOn(enabled);
    setAmbientGlobal(enabled);
    if (enabled) {
      playSfx("toggle");
    }
  }

  function handleInputChange(value: string) {
    setInput(value);
  }

  function handleStreamComplete(messageId: number) {
    if (streamingId !== messageId) {
      return;
    }
    setStreamingId(null);
    setMascotPhase((current) => (current === "typing" ? "done" : current));
    playSfx("success");
  }

  function handleOpenArtifact(artifact: KaelArtifact) {
    playSfx("open");
    setActiveArtifact(artifact);
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

  function discardApproval() {
    setPendingApproval(null);
    setApprovalError(null);
  }

  function newChat() {
    if (isThinking || approvalBusy) {
      return;
    }

    discardApproval();
    setActiveSessionId(`session-${Date.now()}`);
    setMessages([]);
    setNextMessageId(1);
    setInput("");
    setAttachments([]);
    setAttachmentError(null);
    setStreamingId(null);
    setMascotPhase("idle");
    setMobileSidebarOpen(false);
    playSfx("open");
  }

  function selectSession(id: string) {
    if (isThinking || approvalBusy) {
      return;
    }

    const selected = sessions.find((session) => session.id === id);
    if (!selected) {
      return;
    }

    discardApproval();
    setActiveSessionId(selected.id);
    setMessages(selected.messages);
    setNextMessageId(nextIdFromMessages(selected.messages));
    setInput("");
    setAttachments([]);
    setAttachmentError(null);
    setStreamingId(null);
    setMascotPhase("idle");
    setMobileSidebarOpen(false);
    playSfx("click");
  }

  function commitAssistantReply(
    data: ChatApiResponse,
    context: {
      messageId: number;
      userMessage: string;
      mode: ResponseMode;
      devMode: boolean;
      clientDurationMs: number;
    },
  ): boolean {
    const reply = data.reply?.trim();
    if (!reply) {
      return false;
    }

    const reportedTokens = data.tokens_used;
    const usedTokens =
      typeof reportedTokens === "number" &&
      Number.isFinite(reportedTokens) &&
      reportedTokens > 0
        ? Math.round(reportedTokens)
        : estimateTokens(context.userMessage) + estimateTokens(reply);

    if (!context.devMode) {
      setUsage((current) => {
        const next = withAddedTokens(current, usedTokens);
        writeUsage(next);
        return next;
      });
    }

    setMessages((current) => [
      ...current,
      {
        id: context.messageId,
        role: "assistant",
        content: reply,
        isError: false,
        userMessage: context.userMessage,
        durationMs: data.latency_ms ?? context.clientDurationMs,
        mode: context.mode,
        ...(data.mcp_trace && data.mcp_trace.length > 0
          ? { mcpTrace: data.mcp_trace }
          : {}),
      },
    ]);
    setStreamingId(context.messageId);
    setMascotMood(moodForReply(reply, context.mode));
    setMascotPhase("typing");
    playSfx("success");
    return true;
  }

  async function sendMessage(messageOverride?: string) {
    const typedInput = (messageOverride ?? input).trim();
    const pendingAttachments = attachments;

    if (
      (!typedInput && pendingAttachments.length === 0) ||
      isThinking ||
      isReadingFiles ||
      pendingApproval !== null
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
    const devBypass = role === "admin";
    const sessionId = activeSessionId || `session-${Date.now()}`;
    const userMessageId = nextMessageId;
    const assistantMessageId = nextMessageId + 1;
    const selectedModelId = modelId;
    const selectedProvider = providerOf(selectedModelId);
    const selectedMode = mode;
    const startedAt = performance.now();
    const personalization = buildPersonalization(preferences);

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
    setMascotPhase("thinking");
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
      setMascotMood("cool");
      setMascotPhase("typing");
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
        body: JSON.stringify({
          message: effectiveText,
          model: selectedModelId,
          provider: selectedProvider,
          mode: selectedMode,
          language,
          dev_mode: devBypass,
          ...(personalization ? { personalization } : {}),
          ...(payloadAttachments.length > 0
            ? { attachments: payloadAttachments }
            : {}),
          ...(mcpServerIds.length > 0
            ? { mcp_server_ids: mcpServerIds }
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

      const approvalRequests = data?.tool_requests ?? [];
      if (
        data?.status === "approval_required" &&
        data.approval_token &&
        approvalRequests.length > 0
      ) {
        setPendingApproval({
          token: data.approval_token,
          requests: approvalRequests,
          userMessage: effectiveText,
          mode: selectedMode,
          messageId: assistantMessageId,
          devMode: devBypass,
        });
        setApprovalError(null);
        setMascotMood("cool");
        setMascotPhase("idle");
        return;
      }

      const clientDurationMs = Math.round(performance.now() - startedAt);
      if (
        !data ||
        !commitAssistantReply(data, {
          messageId: assistantMessageId,
          userMessage: effectiveText,
          mode: selectedMode,
          devMode: devBypass,
          clientDurationMs,
        })
      ) {
        throw new Error(t("error.backendEmpty"));
      }
    } catch (error) {
      const durationMs = Math.round(performance.now() - startedAt);

      setMascotMood(moodForError(error));
      setMascotPhase("error");

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

  async function resolveApproval(decisions: Record<string, boolean>) {
    const context = pendingApproval;
    if (!context || approvalBusy) {
      return;
    }

    setApprovalBusy(true);
    setApprovalError(null);
    const startedAt = performance.now();

    try {
      const response = await authFetch("/api/chat/approve", {
        method: "POST",
        body: JSON.stringify({
          token: context.token,
          decisions,
        }),
      });

      let data: ChatApiResponse | null = null;
      try {
        data = (await response.json()) as ChatApiResponse;
      } catch {
        data = null;
      }

      if (!response.ok) {
        if (response.status === 410) {
          setPendingApproval(null);
          setMessages((current) => [
            ...current,
            {
              id: context.messageId,
              role: "assistant",
              content: t("chat.mcp.approvalExpired"),
              isError: true,
              userMessage: context.userMessage,
              durationMs: Math.round(performance.now() - startedAt),
              mode: context.mode,
            },
          ]);
          setMascotPhase("error");
          playSfx("error");
          return;
        }

        throw new Error(data?.detail ?? t("chat.mcp.approvalError"));
      }

      const nextRequests = data?.tool_requests ?? [];
      if (
        data?.status === "approval_required" &&
        data.approval_token &&
        nextRequests.length > 0
      ) {
        setPendingApproval({
          ...context,
          token: data.approval_token,
          requests: nextRequests,
        });
        return;
      }

      if (
        !data ||
        !commitAssistantReply(data, {
          messageId: context.messageId,
          userMessage: context.userMessage,
          mode: context.mode,
          devMode: context.devMode,
          clientDurationMs: Math.round(performance.now() - startedAt),
        })
      ) {
        throw new Error(t("chat.mcp.approvalError"));
      }

      setPendingApproval(null);
    } catch (error) {
      setApprovalError(getRequestError(error, t));
      setMascotPhase("idle");
    } finally {
      setApprovalBusy(false);
    }
  }

  function updatePreferences(patch: Partial<KaelPreferences>) {
    setPreferences((current) => ({ ...current, ...patch }));
  }

  function closeChangelog() {
    playSfx("close");
    setChangelogOpen(false);

    try {
      localStorage.setItem(KAEL_CHANGELOG_SEEN_KEY, KAEL_VERSION);
    } catch {
      // Storage can be unavailable; the changelog still closes.
    }
  }

  function clearHistory() {
    if (isThinking || approvalBusy) {
      return;
    }

    discardApproval();
    setSessions([]);
    setMessages([]);
    setActiveSessionId("");
    setNextMessageId(1);
    setStreamingId(null);
    setInput("");
    setAttachments([]);
    setAttachmentError(null);
    setMascotPhase("idle");
    safeRemove(STORAGE_SESSIONS);
    safeRemove(STORAGE_ACTIVE_SESSION);
  }

  function resetPreferences() {
    setPreferences({ ...DEFAULT_PREFERENCES });
    setSfxOn(true);
    setSfxGlobal(true);
    setAmbientOn(false);
    setAmbientGlobal(false);
    safeWrite(STORAGE_SFX, "true");
    safeWrite(STORAGE_AMBIENT, "false");
  }

  const messageCount =
    sessions.reduce((total, session) => total + session.messages.length, 0) +
    (sessions.some((session) => session.id === activeSessionId)
      ? 0
      : messages.length);

  const lastUserMessage =
    messages.filter((message) => message.role === "user").at(-1)?.content ?? "";

  return (
    <MotionConfig
      reducedMotion={preferences.reduceMotion ? "always" : "user"}
      transition={{ type: "spring", stiffness: 260, damping: 27, mass: 0.9 }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-[#0A0A0A]"
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
          <header className="relative z-20 shrink-0 border-b border-[#262626] bg-[#0A0A0A]/85 px-4 py-2.5 backdrop-blur-2xl sm:h-[72px] sm:px-6 sm:py-0 lg:px-8">
            <div className="flex h-full flex-wrap items-center gap-x-3 gap-y-2 sm:flex-nowrap sm:gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3 sm:flex-none">
              <button
                type="button"
                onClick={() => {
                  playSfx("open");
                  setMobileSidebarOpen(true);
                }}
                aria-label={t("header.openMenu")}
                className="rounded-lg p-2.5 text-zinc-400 transition hover:bg-[#1C1C1C] hover:text-zinc-100 active:scale-95 lg:hidden"
              >
                <Menu size={20} strokeWidth={1.5} />
              </button>

              <span className="kael-display shrink-0 text-base font-semibold tracking-[0.2em] text-white sm:text-lg">
                KAEL
              </span>

              <span className="hidden h-4 w-px bg-[#262626] sm:block" />

              <div className="hidden items-center gap-2 sm:flex">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isOnline ? "kael-pulse bg-[#10B981]" : "bg-zinc-700"
                  }`}
                />
                <span className="text-sm text-zinc-500">
                  {isOnline ? t("app.online") : t("app.offline")}
                </span>
              </div>
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
              <div className="hidden sm:flex">
                <UserChip compact />
              </div>

              <LanguageSelector />

              <button
                type="button"
                onClick={() => {
                  playSfx("open");
                  setChangelogOpen(true);
                }}
                aria-label={t("changelog.open")}
                title={`${t("changelog.open")} · ${KAEL_VERSION_LABEL}`}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#262626] text-zinc-400 transition hover:border-[#10B981]/45 hover:bg-[#1C1C1C] hover:text-zinc-100 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/40"
              >
                <ScrollText size={17} strokeWidth={1.7} />
              </button>

              <button
                type="button"
                onClick={() => {
                  playSfx("open");
                  setSettingsOpen(true);
                }}
                aria-label={t("settings.title")}
                title={t("settings.title")}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#262626] text-zinc-400 transition hover:border-[#10B981]/45 hover:bg-[#1C1C1C] hover:text-zinc-100 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/40"
              >
                <Settings size={17} strokeWidth={1.7} />
              </button>
            </div>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col">
            {messages.length === 0 ? (
              <LandingState
                onPrompt={(prompt) => void sendMessage(prompt)}
                onOpenChangelog={() => {
                  playSfx("open");
                  setChangelogOpen(true);
                }}
                disabled={isThinking}
                reduceMotion={preferences.reduceMotion}
                showDemo={preferences.liveDemo}
                showQuickStart={preferences.quickStart}
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

                  <div ref={bottomRef} className="h-20 w-full shrink-0 sm:h-24" />
                </div>
              </section>
            )}

            {pendingApproval && (
              <div className="shrink-0 px-4 pb-1 sm:px-6">
                <div className="mx-auto w-full max-w-3xl">
                  <McpApprovalPanel
                    requests={pendingApproval.requests}
                    busy={approvalBusy}
                    error={approvalError}
                    onResolve={(decisions) => void resolveApproval(decisions)}
                  />
                </div>
              </div>
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
              enterToSend={preferences.enterToSend}
              mascot={
                messages.length > 0 ? (
                  <MascotCompanion
                    phase={mascotPhase}
                    answerMood={mascotMood}
                    enabled={preferences.mascotEnabled}
                    forceReduceMotion={preferences.reduceMotion}
                  />
                ) : null
              }
            />
          </div>
        </div>
      </main>

      <SettingsModal
        open={settingsOpen}
        preferences={preferences}
        usage={usage}
        sfxOn={sfxOn}
        ambientOn={ambientOn}
        sessionCount={sessions.length}
        messageCount={messageCount}
        providers={providers}
        providersLoading={providersLoading}
        modelId={modelId}
        onRefreshProviders={() => void refreshProviders()}
        onSelectModel={setModelId}
        onClose={() => {
          playSfx("close");
          setSettingsOpen(false);
        }}
        onChangePreferences={updatePreferences}
        onSfxChange={updateSfx}
        onAmbientChange={updateAmbient}
        onClearHistory={clearHistory}
        onResetPreferences={resetPreferences}
        onRestartTour={() => {
          setSettingsOpen(false);
          window.setTimeout(restartKaelTour, 180);
        }}
        onOpenChangelog={() => {
          setSettingsOpen(false);
          window.setTimeout(() => setChangelogOpen(true), 180);
        }}
        onOpenTiers={() => {
          setSettingsOpen(false);
          window.setTimeout(() => setTiersOpen(true), 180);
        }}
      />

      <TiersModal
        open={tiersOpen}
        usage={usage}
        role={role}
        onClose={() => {
          playSfx("close");
          setTiersOpen(false);
        }}
      />

      <ChangelogModal open={changelogOpen} onClose={closeChangelog} />

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
