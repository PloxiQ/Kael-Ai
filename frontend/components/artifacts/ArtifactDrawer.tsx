"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Code2,
  Copy,
  Download,
  ExternalLink,
  FileCode2,
  Loader2,
  Monitor,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import {
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../../lib/i18n";
import type { KaelArtifact } from "./artifactParser";
import { artifactText } from "./artifactText";
import {
  copyText,
  downloadArtifact,
  openArtifactInNewTab,
} from "./artifactUtils";
import CodeViewer from "./CodeViewer";
import LiveSandbox from "./LiveSandbox";
import { isPreviewable } from "./previewDocument";

const MarkdownPreview = dynamic(() => import("./MarkdownPreview"), {
  ssr: false,
  loading: () => <MarkdownPreviewFallback />,
});

function MarkdownPreviewFallback() {
  const { language } = useI18n();
  const text = artifactText(language);

  return (
    <div className="flex h-full items-center justify-center bg-[#0A0A0A]">
      <span className="flex items-center gap-2 rounded-full border border-[#262626] bg-[#1C1C1C] px-4 py-2 text-sm text-zinc-400">
        <Loader2 size={16} className="animate-spin text-[#34D399]" />
        {text.loading}
      </span>
    </div>
  );
}

type Tab = "preview" | "code";
type Device = "desktop" | "mobile";
type CopyState = "idle" | "copied" | "failed";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}

export default function ArtifactDrawer({
  artifact,
  onClose,
}: {
  artifact: KaelArtifact | null;
  onClose: () => void;
}) {
  const { language } = useI18n();
  const text = artifactText(language);
  const [mounted, setMounted] = useState(false);
  const [visibleArtifact, setVisibleArtifact] =
    useState<KaelArtifact | null>(artifact);
  const [tab, setTab] = useState<Tab>("preview");
  const [device, setDevice] = useState<Device>("desktop");
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const copyTimerRef = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const titleId = useId();
  const open = Boolean(artifact);
  const displayArtifact = artifact ?? visibleArtifact;
  const previewable = displayArtifact
    ? isPreviewable(displayArtifact.type)
    : false;
  const activeTab: Tab = previewable ? tab : "code";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!artifact) {
      return;
    }

    setVisibleArtifact(artifact);
    setTab(isPreviewable(artifact.type) ? "preview" : "code");
    setDevice("desktop");
    setCopyState("idle");
  }, [artifact]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousActive = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => {
      closeRef.current?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          FOCUSABLE_SELECTOR,
        ),
      ).filter(
        (element) =>
          !element.hasAttribute("disabled") &&
          element.getAttribute("aria-hidden") !== "true",
      );

      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActive?.focus();
    };
  }, [open]);

  async function handleCopy() {
    if (!displayArtifact) {
      return;
    }

    const copied = await copyText(displayArtifact.content);
    setCopyState(copied ? "copied" : "failed");

    if (copyTimerRef.current) {
      window.clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = window.setTimeout(
      () => setCopyState("idle"),
      1_800,
    );
  }

  function handleDownload() {
    if (displayArtifact) {
      downloadArtifact(displayArtifact);
    }
  }

  function handleOpenTab() {
    if (displayArtifact) {
      openArtifactInNewTab(displayArtifact);
    }
  }

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[90]">
      <AnimatePresence>
        {open && (
          <motion.div
            key="artifact-backdrop"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="pointer-events-auto absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <AnimatePresence
        onExitComplete={() => setVisibleArtifact(null)}
      >
        {open && displayArtifact && (
          <motion.div
            key="artifact-panel"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={isMobile ? { y: "100%" } : { x: "100%" }}
            animate={{ x: 0, y: 0 }}
            exit={isMobile ? { y: "100%" } : { x: "100%" }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 32,
              mass: 0.9,
            }}
            className="pointer-events-auto absolute inset-y-0 right-0 z-10 flex h-[100dvh] w-full flex-col overflow-hidden rounded-t-[26px] border border-[#262626] bg-[#0A0A0A]/95 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)] backdrop-blur-2xl lg:w-1/2 lg:rounded-none lg:rounded-l-[26px]"
          >
            <header className="shrink-0 border-b border-[#262626] px-4 pb-3 pt-4 sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#10B981]/25 bg-[#10B981]/10 text-[#34D399]">
                    <FileCode2 size={19} strokeWidth={1.5} />
                  </span>

                  <div className="min-w-0">
                    <p className="text-sm text-zinc-500">
                      {text.artifact}
                    </p>
                    <h2
                      id={titleId}
                      className="truncate text-lg font-semibold text-zinc-100"
                    >
                      {displayArtifact.title || text.untitled}
                    </h2>
                    <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-500">
                      <span className="inline-flex min-h-6 items-center rounded-full border border-[#10B981]/20 bg-[#10B981]/10 px-2.5 font-medium text-[#34D399]">
                        {text.types[displayArtifact.type]}
                      </span>
                      <span className="font-mono text-zinc-400">
                        {displayArtifact.language}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">
                        {displayArtifact.fileName}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  ref={closeRef}
                  type="button"
                  onClick={onClose}
                  aria-label={text.close}
                  title={text.close}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#262626] bg-[#1C1C1C] text-zinc-400 transition hover:border-[#3A3A3A] hover:bg-[#1C1C1C] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/45"
                >
                  <X size={18} strokeWidth={1.7} />
                </button>
              </div>
            </header>

            {previewable && (
              <div className="flex shrink-0 items-center gap-1 border-b border-[#262626] px-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTab("preview")}
                  aria-pressed={activeTab === "preview"}
                  className={`relative inline-flex min-h-11 items-center gap-2 rounded-t-lg px-3 text-sm font-medium transition ${
                    activeTab === "preview"
                      ? "text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Monitor size={16} strokeWidth={1.6} />
                  {text.preview}
                  {activeTab === "preview" && (
                    <motion.span
                      layoutId="artifact-active-tab"
                      className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#10B981]"
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setTab("code")}
                  aria-pressed={activeTab === "code"}
                  className={`relative inline-flex min-h-11 items-center gap-2 rounded-t-lg px-3 text-sm font-medium transition ${
                    activeTab === "code"
                      ? "text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Code2 size={16} strokeWidth={1.6} />
                  {text.code}
                  {activeTab === "code" && (
                    <motion.span
                      layoutId="artifact-active-tab"
                      className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#10B981]"
                    />
                  )}
                </button>
              </div>
            )}

            <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#262626] px-3 py-2.5">
              {activeTab === "preview" && previewable && (
                <div
                  role="group"
                  aria-label={text.viewport}
                  className="flex rounded-xl border border-[#262626] bg-[#1C1C1C] p-1"
                >
                  <button
                    type="button"
                    onClick={() => setDevice("desktop")}
                    aria-pressed={device === "desktop"}
                    title={text.desktop}
                    className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-2.5 text-sm transition ${
                      device === "desktop"
                        ? "bg-[#10B981]/10 text-[#34D399]"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <Monitor size={15} strokeWidth={1.7} />
                    <span className="hidden sm:inline">
                      {text.desktop}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDevice("mobile")}
                    aria-pressed={device === "mobile"}
                    title={text.mobile}
                    className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-2.5 text-sm transition ${
                      device === "mobile"
                        ? "bg-[#10B981]/10 text-[#34D399]"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <Smartphone size={15} strokeWidth={1.7} />
                    <span className="hidden sm:inline">
                      {text.mobile}
                    </span>
                  </button>
                </div>
              )}

              <div className="ml-auto flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#262626] bg-[#1C1C1C] px-3 text-sm text-zinc-300 transition hover:border-[#10B981]/35 hover:bg-[#1C1C1C] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/45"
                >
                  {copyState === "copied" ? (
                    <Check
                      size={16}
                      strokeWidth={1.8}
                      className="text-[#34D399]"
                    />
                  ) : copyState === "failed" ? (
                    <X
                      size={16}
                      strokeWidth={1.8}
                      className="text-red-400"
                    />
                  ) : (
                    <Copy size={16} strokeWidth={1.7} />
                  )}
                  <span>
                    {copyState === "copied"
                      ? text.copied
                      : copyState === "failed"
                        ? text.copyFailed
                        : text.copy}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#262626] bg-[#1C1C1C] px-3 text-sm text-zinc-300 transition hover:border-[#10B981]/35 hover:bg-[#1C1C1C] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/45"
                >
                  <Download size={16} strokeWidth={1.7} />
                  <span>{text.download}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenTab}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#262626] bg-[#1C1C1C] px-3 text-sm text-zinc-300 transition hover:border-[#10B981]/35 hover:bg-[#1C1C1C] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/45"
                >
                  <ExternalLink size={16} strokeWidth={1.7} />
                  <span>{text.openTab}</span>
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              {activeTab === "preview" && previewable ? (
                displayArtifact.type === "markdown" ? (
                  <MarkdownPreview
                    artifact={displayArtifact}
                    device={device}
                  />
                ) : (
                  <LiveSandbox
                    artifact={displayArtifact}
                    device={device}
                  />
                )
              ) : (
                <CodeViewer
                  content={displayArtifact.content}
                  language={displayArtifact.language}
                />
              )}
            </div>

            <footer className="shrink-0 border-t border-[#262626] px-4 py-2.5">
              <span className="inline-flex items-center gap-2 text-sm text-zinc-500">
                <ShieldCheck
                  size={15}
                  strokeWidth={1.7}
                  className="text-[#34D399]"
                />
                {displayArtifact.type === "markdown"
                  ? text.safePreview
                  : text.sandboxed}
              </span>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
