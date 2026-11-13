"use client";

import {
  Atom,
  FileCode2,
  FileText,
  Globe2,
  Loader2,
  Play,
  Shapes,
} from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { useI18n } from "../../lib/i18n";
import type { ArtifactType, KaelArtifact } from "./artifactParser";
import { artifactText } from "./artifactText";
import { formatArtifactBytes } from "./artifactUtils";
import { isPreviewable } from "./previewDocument";

const TYPE_ICONS: Record<ArtifactType, typeof Globe2> = {
  html: Globe2,
  react: Atom,
  code: FileCode2,
  markdown: FileText,
  svg: Shapes,
};

export default function ArtifactCard({
  artifact,
  onOpen,
}: {
  artifact: KaelArtifact;
  onOpen: (artifact: KaelArtifact) => void;
}) {
  const { language } = useI18n();
  const text = artifactText(language);
  const Icon = TYPE_ICONS[artifact.type];
  const previewable = isPreviewable(artifact.type);
  const bytes = useMemo(
    () => new TextEncoder().encode(artifact.content).length,
    [artifact.content],
  );
  const lineCount = useMemo(
    () =>
      artifact.content
        ? artifact.content.split(/\r?\n/).length
        : 0,
    [artifact.content],
  );
  const title = artifact.title || text.untitled;
  const actionLabel = previewable ? text.openPreview : text.openCode;

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 12, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
      aria-label={`${text.artifact}: ${title}`}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#030305]/85 shadow-[0_28px_80px_-36px_rgba(0,0,0,0.98),0_0_45px_-28px_rgba(240,147,251,0.55)] backdrop-blur-2xl"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#f093fb]/60 to-transparent"
      />

      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#f093fb]/25 bg-kael-gradient-soft text-[#f7a6ba] shadow-[0_0_28px_-14px_rgba(240,147,251,0.9)]">
            <Icon size={19} strokeWidth={1.5} />
          </span>

          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold text-zinc-100">
                {title}
              </h3>
              <span className="inline-flex min-h-6 items-center rounded-full border border-[#f093fb]/20 bg-kael-gradient-soft px-2.5 text-sm font-medium text-[#f7a6ba]">
                {text.types[artifact.type]}
              </span>
            </div>

            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-500">
              <span className="font-mono text-zinc-400">
                {artifact.language}
              </span>
              <span aria-hidden="true">·</span>
              <span>{text.lines(lineCount)}</span>
              <span aria-hidden="true">·</span>
              <span>{formatArtifactBytes(bytes, language)}</span>
            </p>

            {artifact.isStreaming && (
              <p className="mt-1.5 flex items-center gap-2 text-sm text-[#f7a6ba]">
                <span className="kael-pulse h-1.5 w-1.5 rounded-full bg-[#f5576c]" />
                {text.generatingHint}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          disabled={artifact.isStreaming}
          onClick={() => onOpen(artifact)}
          className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5576c]/45 ${
            artifact.isStreaming
              ? "cursor-wait border border-white/10 bg-white/[0.03] text-zinc-500"
              : "bg-kael-gradient text-[#1c0710] shadow-[0_0_32px_-10px_rgba(240,147,251,0.85)] hover:shadow-[0_0_42px_-8px_rgba(245,87,108,0.8)] active:scale-[0.98]"
          }`}
        >
          {artifact.isStreaming ? (
            <Loader2 size={16} strokeWidth={1.8} className="animate-spin" />
          ) : (
            <Play size={16} strokeWidth={1.8} fill="currentColor" />
          )}
          <span>
            {artifact.isStreaming ? text.generating : actionLabel}
          </span>
        </button>
      </div>

      {artifact.isStreaming && (
        <div className="relative h-0.5 overflow-hidden bg-white/[0.06]">
          <motion.div
            className="h-full w-1/2 bg-kael-gradient"
            initial={{ x: "-120%" }}
            animate={{ x: "240%" }}
            transition={{
              repeat: Infinity,
              duration: 1.4,
              ease: "easeInOut",
            }}
          />
        </div>
      )}
    </motion.section>
  );
}
