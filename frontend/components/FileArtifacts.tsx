"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  FileCode2,
  FileText,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useI18n } from "../lib/i18n";
import { translate, type Language } from "../lib/translations";

export type KaelFileArtifact = {
  id: string;
  name: string;
  language: string;
  kind: "code" | "document";
  content: string;
};

export type MessageSegment =
  | { type: "text"; content: string }
  | { type: "file"; artifact: KaelFileArtifact };

const ARTIFACT_PATTERN = /<kael_file\b([^>]*)>([\s\S]*?)<\/kael_file>/gi;
const ATTRIBUTE_PATTERN = /([a-zA-Z_][\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
const ORPHAN_TAG_PATTERN = /<\/?kael_file\b[^>]*>/gi;

const DOCUMENT_EXTENSIONS = new Set([
  "md",
  "mdx",
  "txt",
  "rst",
  "pdf",
  "doc",
  "docx",
  "rtf",
  "csv",
]);

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  py: "python",
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  ts: "typescript",
  tsx: "tsx",
  jsx: "jsx",
  json: "json",
  css: "css",
  scss: "scss",
  html: "html",
  htm: "html",
  md: "markdown",
  mdx: "mdx",
  txt: "text",
  yml: "yaml",
  yaml: "yaml",
  sh: "bash",
  bash: "bash",
  sql: "sql",
  rs: "rust",
  go: "go",
  java: "java",
  cpp: "cpp",
  c: "c",
  cs: "csharp",
  rb: "ruby",
  php: "php",
  kt: "kotlin",
  swift: "swift",
  pdf: "pdf",
  docx: "docx",
  csv: "csv",
  xml: "xml",
  toml: "toml",
  ini: "ini",
  env: "text",
};

function readAttributes(source: string): Record<string, string> {
  const attributes: Record<string, string> = {};

  for (const match of source.matchAll(ATTRIBUTE_PATTERN)) {
    const key = match[1]?.toLowerCase();
    const value = match[2] ?? match[3] ?? "";
    if (key) {
      attributes[key] = value;
    }
  }

  return attributes;
}

function extensionOf(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? name;
  const dotIndex = base.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === base.length - 1) {
    return "";
  }
  return base.slice(dotIndex + 1).toLowerCase();
}

function resolveKind(
  attributes: Record<string, string>,
  extension: string,
  content: string,
): "code" | "document" {
  const declaredType = (attributes.type ?? "").toLowerCase();

  if (
    declaredType.includes("doc") ||
    declaredType.includes("text") ||
    declaredType.includes("markdown")
  ) {
    return "document";
  }

  if (
    declaredType.includes("code") ||
    declaredType.includes("source") ||
    declaredType.includes("script")
  ) {
    return "code";
  }

  if (DOCUMENT_EXTENSIONS.has(extension)) {
    return "document";
  }

  if (extension && LANGUAGE_BY_EXTENSION[extension]) {
    return "code";
  }

  return /[{};=<>]/.test(content) ? "code" : "document";
}

function resolveLanguage(
  attributes: Record<string, string>,
  extension: string,
  kind: "code" | "document",
): string {
  const declaredLanguage = attributes.language?.trim();
  if (declaredLanguage) {
    return declaredLanguage;
  }

  return (
    LANGUAGE_BY_EXTENSION[extension] ?? (kind === "document" ? "text" : "code")
  );
}

function stripOrphanTags(value: string): string {
  return value.replace(ORPHAN_TAG_PATTERN, "").trim();
}

function createArtifact(
  attributes: Record<string, string>,
  rawContent: string,
  index: number,
): KaelFileArtifact {
  const fallbackName = `artifact-${index + 1}.txt`;
  const name = attributes.name?.trim() || fallbackName;
  const extension = extensionOf(name);
  const content = rawContent.replace(/^\r?\n/, "").replace(/\r?\n$/, "");
  const kind = resolveKind(attributes, extension, content);
  const language = resolveLanguage(attributes, extension, kind);
  const safeId = name.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "");

  return {
    id: `${index + 1}-${safeId || "file"}`,
    name,
    language,
    kind,
    content,
  };
}

export function parseMessageContent(content: string): MessageSegment[] {
  if (!content.toLowerCase().includes("<kael_file")) {
    return [{ type: "text", content }];
  }

  const segments: MessageSegment[] = [];
  let cursor = 0;
  let fileIndex = 0;

  for (const match of content.matchAll(ARTIFACT_PATTERN)) {
    const matchIndex = match.index ?? 0;
    const textBefore = stripOrphanTags(content.slice(cursor, matchIndex));

    if (textBefore) {
      segments.push({ type: "text", content: textBefore });
    }

    const attributes = readAttributes(match[1] ?? "");
    const artifact = createArtifact(attributes, match[2] ?? "", fileIndex);
    segments.push({ type: "file", artifact });

    fileIndex += 1;
    cursor = matchIndex + match[0].length;
  }

  const remainingText = stripOrphanTags(content.slice(cursor));
  if (remainingText) {
    segments.push({ type: "text", content: remainingText });
  }

  if (segments.length === 0) {
    return [{ type: "text", content: stripOrphanTags(content) }];
  }

  return segments;
}

function formatBytes(byteLength: number, language: Language): string {
  if (byteLength < 1024) {
    return translate(language, "units.bytes", {
      count: Math.round(byteLength),
    });
  }
  if (byteLength < 1024 * 1024) {
    return translate(language, "units.kb", {
      count: (byteLength / 1024).toFixed(1),
    });
  }
  return translate(language, "units.mb", {
    count: (byteLength / (1024 * 1024)).toFixed(1),
  });
}

function downloadNameOf(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? name;
  const sanitized = base.replace(/[<>:"|?*\u0000-\u001F]/g, "").trim();
  return sanitized || "kael-artifact.txt";
}

export function FileArtifactCard({
  artifact,
}: {
  artifact: KaelFileArtifact;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const { language, t } = useI18n();
  const Icon = artifact.kind === "code" ? FileCode2 : FileText;
  const bytes = useMemo(
    () => new TextEncoder().encode(artifact.content).length,
    [artifact.content],
  );
  const lineCount = artifact.content
    ? artifact.content.split(/\r?\n/).length
    : 0;
  const preview =
    artifact.content.length > 5000
      ? `${artifact.content.slice(0, 5000)}\n...`
      : artifact.content;

  async function copyContent() {
    try {
      await navigator.clipboard.writeText(artifact.content);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }

    window.setTimeout(() => setCopyState("idle"), 1600);
  }

  function downloadContent() {
    const blob = new Blob([artifact.content], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = downloadNameOf(artifact.name);
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section
      aria-label={t("file.aria", { name: artifact.name })}
      className="kael-topline relative overflow-hidden rounded-2xl border border-[#262626] bg-[#161616]/80 shadow-[0_28px_80px_-34px_rgba(0,0,0,0.95)] backdrop-blur-2xl"
    >
      <header className="flex flex-col gap-4 px-5 pb-4 pt-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#10B981]/25 bg-[#10B981]/10 text-[#34D399]">
            <Icon size={19} strokeWidth={1.5} />
          </span>

          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-zinc-100">
              {artifact.name}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              {artifact.language} ·{" "}
              {t("file.lines", { count: lineCount })} ·{" "}
              {formatBytes(bytes, language)}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => void copyContent()}
            aria-label={t("file.copyAria")}
            title={t("file.copy")}
            className="inline-flex items-center gap-2 rounded-lg border border-[#262626] bg-[#1C1C1C] px-3 py-2 text-sm text-zinc-300 transition hover:border-[#10B981]/35 hover:bg-[#1C1C1C] hover:text-white"
          >
            {copyState === "copied" ? (
              <Check size={16} strokeWidth={1.6} className="text-[#34D399]" />
            ) : copyState === "failed" ? (
              <X size={16} strokeWidth={1.6} className="text-red-400" />
            ) : (
              <Copy size={16} strokeWidth={1.6} />
            )}
            <span className="hidden sm:inline">
              {copyState === "copied"
                ? t("file.copied")
                : copyState === "failed"
                  ? t("file.unavailable")
                  : t("file.copy")}
            </span>
          </button>

          <button
            type="button"
            onClick={downloadContent}
            aria-label={t("file.downloadAria")}
            title={t("file.download")}
            className="inline-flex items-center gap-2 rounded-lg border border-[#262626] bg-[#1C1C1C] px-3 py-2 text-sm text-zinc-300 transition hover:border-[#10B981]/35 hover:bg-[#1C1C1C] hover:text-white"
          >
            <Download size={16} strokeWidth={1.6} />
            <span className="hidden sm:inline">{t("file.download")}</span>
          </button>

          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            aria-label={
              expanded ? t("file.collapseAria") : t("file.expandAria")
            }
            aria-expanded={expanded}
            title={expanded ? t("file.collapse") : t("file.expand")}
            className="rounded-lg border border-[#262626] bg-[#1C1C1C] p-2 text-zinc-400 transition hover:border-[#3A3A3A] hover:bg-[#1C1C1C] hover:text-white"
          >
            {expanded ? (
              <ChevronUp size={16} strokeWidth={1.6} />
            ) : (
              <ChevronDown size={16} strokeWidth={1.6} />
            )}
          </button>
        </div>
      </header>

      <div className="relative border-t border-[#262626]">
        <pre
          className={`overflow-auto px-5 py-4 font-mono text-[15px] leading-7 text-zinc-300 sm:px-6 ${
            expanded ? "max-h-[560px]" : "max-h-44 overflow-hidden"
          }`}
        >
          <code>{expanded ? artifact.content : preview}</code>
        </pre>
        {!expanded && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#161616] via-[#161616]/80 to-transparent"
          />
        )}
      </div>
    </section>
  );
}
