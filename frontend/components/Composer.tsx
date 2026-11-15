"use client";

import {
  ArrowUp,
  FileCode2,
  FileText,
  ImagePlus,
  Loader2,
  Paperclip,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  MAX_ATTACHMENTS,
  formatFileSize,
  type Attachment,
} from "../lib/attachments";
import { useI18n } from "../lib/i18n";
import type { Translate } from "../lib/translations";

const MAX_MESSAGE_LENGTH = 12_000;

const DOCUMENT_ACCEPT = [
  ".pdf",
  ".txt",
  ".md",
  ".mdx",
  ".csv",
  ".tsv",
  ".json",
  ".jsonl",
  ".yaml",
  ".yml",
  ".toml",
  ".ini",
  ".cfg",
  ".conf",
  ".log",
  ".env",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".py",
  ".java",
  ".c",
  ".h",
  ".cc",
  ".cpp",
  ".hpp",
  ".cs",
  ".go",
  ".rs",
  ".rb",
  ".php",
  ".swift",
  ".kt",
  ".kts",
  ".scala",
  ".sql",
  ".sh",
  ".bash",
  ".ps1",
  ".bat",
  ".cmd",
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".html",
  ".htm",
  ".xml",
  ".vue",
  ".svelte",
  ".dart",
  ".lua",
  ".r",
  ".gradle",
  ".dockerfile",
  ".makefile",
  ".graphql",
  ".proto",
].join(",");

function AttachmentIcon({ attachment }: { attachment: Attachment }) {
  if (attachment.kind === "image" && attachment.previewUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={attachment.previewUrl}
        alt=""
        className="h-11 w-11 shrink-0 rounded-lg border border-[#262626] object-cover"
      />
    );
  }

  const Icon = attachment.kind === "code" ? FileCode2 : FileText;

  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#262626] bg-[#1C1C1C] text-[#34D399]">
      <Icon size={18} strokeWidth={1.6} />
    </span>
  );
}

function kindLabel(attachment: Attachment, t: Translate): string {
  if (attachment.kind === "pdf") {
    return t("attachment.kind.pdf");
  }
  if (attachment.kind === "code") {
    return t("attachment.kind.code");
  }
  if (attachment.kind === "image") {
    return t("attachment.kind.image");
  }
  return t("attachment.kind.text");
}

export default function Composer({
  value,
  attachments,
  isThinking,
  isReadingFiles,
  attachmentError,
  onChange,
  onSubmit,
  onAddFiles,
  onRemoveAttachment,
  onDismissError,
  mascot,
  enterToSend = true,
}: {
  value: string;
  attachments: Attachment[];
  isThinking: boolean;
  isReadingFiles: boolean;
  attachmentError: string | null;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onAddFiles: (files: File[]) => void;
  onRemoveAttachment: (id: string) => void;
  onDismissError: () => void;
  /** When false, Enter adds a new line and Ctrl/Cmd+Enter sends. */
  enterToSend?: boolean;
  /** Rendered above the composer, anchored to the form width. */
  mascot?: ReactNode;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const { language, locale, t } = useI18n();
  const canSubmit =
    (value.trim().length > 0 || attachments.length > 0) &&
    !isThinking &&
    !isReadingFiles;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
  }, [value]);

  function pickFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }
    onAddFiles(Array.from(files));
  }

  function submit() {
    if (!canSubmit) {
      return;
    }
    onSubmit();
  }

  return (
    <div className="relative z-10 shrink-0 px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
      <div className="pointer-events-none absolute inset-x-0 -top-16 h-16 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/75 to-transparent" />

      <div
        data-mascot-anchor="true"
        className="relative mx-auto w-full max-w-3xl"
      >
        {mascot}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={(event) => {
            if (
              event.relatedTarget instanceof Node &&
              event.currentTarget.contains(event.relatedTarget)
            ) {
              return;
            }
            setDragActive(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            if (event.dataTransfer.files.length > 0) {
              pickFiles(event.dataTransfer.files);
            }
          }}
          className={`glow-field relative flex w-full flex-col rounded-3xl border bg-[#161616]/85 shadow-[0_30px_90px_-30px_rgba(0,0,0,0.96)] backdrop-blur-2xl transition-[border-color,box-shadow] duration-300 ${
            dragActive
              ? "border-[#10B981]/60 shadow-[0_30px_90px_-30px_rgba(0,0,0,0.96)]"
              : "border-[#262626]"
          }`}
        >
          {dragActive && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-[#161616]/82 backdrop-blur-sm">
              <p className="rounded-xl border border-[#10B981]/35 bg-[#1C1C1C] px-4 py-2.5 text-sm text-zinc-100">
                {t("attachment.drop")}
              </p>
            </div>
          )}

          <input
            ref={documentInputRef}
            type="file"
            multiple
            accept={DOCUMENT_ACCEPT}
            className="hidden"
            onChange={(event) => {
              pickFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <input
            ref={imageInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              pickFiles(event.target.files);
              event.target.value = "";
            }}
          />

          {attachmentError && (
            <div
              role="alert"
              className="mx-4 mt-4 flex items-start gap-2.5 rounded-xl border border-red-900/40 bg-red-950/20 px-3.5 py-2.5 sm:mx-5"
            >
              <p className="min-w-0 flex-1 text-sm leading-6 text-red-200/90">
                {attachmentError}
              </p>
              <button
                type="button"
                onClick={onDismissError}
                aria-label={t("attachment.hideError")}
                className="mt-0.5 shrink-0 rounded-md p-1 text-red-300/70 transition hover:bg-[#1C1C1C] hover:text-red-100"
              >
                <X size={14} strokeWidth={1.8} />
              </button>
            </div>
          )}

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 pt-4 sm:px-5">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="kael-chip relative flex min-w-0 items-center gap-2.5 rounded-xl border border-[#262626] bg-[#1C1C1C] py-1.5 pl-1.5 pr-8"
                >
                  <AttachmentIcon attachment={attachment} />
                  <span className="min-w-0 py-0.5">
                    <span className="block max-w-[10rem] truncate text-sm font-medium text-zinc-200 sm:max-w-[14rem]">
                      {attachment.name}
                    </span>
                    <span className="block text-sm text-zinc-500">
                      {kindLabel(attachment, t)} ·{" "}
                      {formatFileSize(attachment.size, language)}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(attachment.id)}
                    aria-label={t("attachment.remove", {
                      name: attachment.name,
                    })}
                    className="absolute right-1.5 top-1.5 rounded-md p-1 text-zinc-500 transition hover:bg-[#1C1C1C] hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/40"
                  >
                    <X size={13} strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onPaste={(event) => {
              const files = Array.from(event.clipboardData.files);
              if (files.length === 0) {
                for (const item of Array.from(event.clipboardData.items)) {
                  if (item.kind === "file") {
                    const file = item.getAsFile();
                    if (file) {
                      files.push(file);
                    }
                  }
                }
              }

              if (files.length > 0) {
                event.preventDefault();
                onAddFiles(files);
              }
            }}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                if (enterToSend) {
                  event.preventDefault();
                  submit();
                  return;
                }

                if (event.ctrlKey || event.metaKey) {
                  event.preventDefault();
                  submit();
                }
              }
            }}
            rows={1}
            maxLength={MAX_MESSAGE_LENGTH}
            data-tour="input"
            placeholder={t("composer.placeholder")}
            aria-label={t("composer.messageAria")}
            className="max-h-[220px] min-h-[64px] w-full resize-none bg-transparent px-5 pb-1 pt-5 text-base leading-8 text-zinc-100 outline-none placeholder:text-zinc-600 sm:px-6"
          />

          <div className="flex items-center justify-between gap-3 px-3 pb-3 pt-1 sm:px-4 sm:pb-4">
            <div className="flex min-w-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => documentInputRef.current?.click()}
                disabled={isThinking}
                data-tour="attach"
                aria-label={t("attachment.attachFile")}
                title={t("attachment.attachHint")}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-[#1C1C1C] hover:text-zinc-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/35"
              >
                <Paperclip size={18} strokeWidth={1.7} />
              </button>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={isThinking}
                aria-label={t("attachment.addImage")}
                title={t("attachment.addImageHint")}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-[#1C1C1C] hover:text-zinc-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/35"
              >
                <ImagePlus size={18} strokeWidth={1.7} />
              </button>

              <span className="ml-1 hidden min-w-0 items-center gap-2 sm:flex">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#10B981]" />
                <span className="truncate text-sm text-zinc-500">
                  {isReadingFiles
                    ? t("attachment.reading")
                    : attachments.length > 0
                      ? t("attachment.ready", {
                          count: attachments.length,
                          max: MAX_ATTACHMENTS,
                        })
                      : enterToSend
                        ? t("attachment.enterToSend")
                        : t("attachment.enterToSendOff")}
                </span>
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {value.length > 0 && (
                <span className="hidden text-sm tabular-nums text-zinc-600 sm:inline">
                  {value.length.toLocaleString(locale)} /{" "}
                  {MAX_MESSAGE_LENGTH.toLocaleString(locale)}
                </span>
              )}
              <button
                type="submit"
                disabled={!canSubmit}
                data-tour="send"
                aria-label={
                  isThinking
                    ? t("composer.generating")
                    : t("composer.send")
                }
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#10B981] text-[#052E1C] shadow-none transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:bg-none disabled:bg-[#1C1C1C] disabled:text-zinc-600 disabled:shadow-none disabled:active:scale-100"
              >
                {isThinking ? (
                  <Loader2 size={18} strokeWidth={1.8} className="animate-spin" />
                ) : isReadingFiles ? (
                  <Loader2 size={18} strokeWidth={1.8} className="animate-spin" />
                ) : (
                  <ArrowUp size={18} strokeWidth={2} />
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
