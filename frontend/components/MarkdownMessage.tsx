"use client";

import { Check, Copy, X } from "lucide-react";
import { useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useI18n } from "../lib/i18n";

type MarkdownMessageProps = {
  content: string;
};

function CodeBlock({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const { t } = useI18n();
  const code = String(children ?? "").replace(/\n$/, "");
  const language = className?.replace("language-", "") || "text";

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }

    window.setTimeout(() => setCopyState("idle"), 1600);
  }

  return (
    <div className="my-5 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#07070a]/85">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-3">
        <span className="text-sm text-zinc-500">{language}</span>
        <button
          type="button"
          onClick={() => void copyCode()}
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-zinc-400 transition hover:bg-white/[0.05] hover:text-white"
        >
          {copyState === "copied" ? (
            <Check size={15} strokeWidth={1.6} className="text-[#f7a6ba]" />
          ) : copyState === "failed" ? (
            <X size={15} strokeWidth={1.6} className="text-red-400" />
          ) : (
            <Copy size={15} strokeWidth={1.6} />
          )}
          {copyState === "copied"
            ? t("file.copied")
            : copyState === "failed"
              ? t("file.unavailable")
              : t("file.copy")}
        </button>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-[15px] leading-7 text-zinc-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const markdownComponents: Components = {
  pre({ children }) {
    const child = children as React.ReactElement<{
      className?: string;
      children?: React.ReactNode;
    }>;

    return (
      <CodeBlock className={child?.props?.className}>
        {child?.props?.children}
      </CodeBlock>
    );
  },
  code({ children, className }) {
    if (className) {
      return <code className={className}>{children}</code>;
    }

    return (
      <code className="rounded-md border border-white/[0.07] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.9em] text-zinc-100">
        {children}
      </code>
    );
  },
  h1({ children }) {
    return (
      <h1 className="mb-4 mt-8 font-display text-2xl font-semibold leading-tight tracking-tight text-zinc-50">
        {children}
      </h1>
    );
  },
  h2({ children }) {
    return (
      <h2 className="mb-3 mt-7 font-display text-xl font-semibold leading-tight tracking-tight text-zinc-100">
        {children}
      </h2>
    );
  },
  h3({ children }) {
    return (
      <h3 className="mb-2 mt-6 text-lg font-semibold leading-7 text-zinc-100">
        {children}
      </h3>
    );
  },
  h4({ children }) {
    return (
      <h4 className="mb-2 mt-5 text-base font-semibold leading-7 text-zinc-200">
        {children}
      </h4>
    );
  },
  p({ children }) {
    return <p className="mb-4 last:mb-0">{children}</p>;
  },
  ul({ children }) {
    return (
      <ul className="mb-4 list-disc space-y-2 pl-6 marker:text-zinc-600 last:mb-0">
        {children}
      </ul>
    );
  },
  ol({ children }) {
    return (
      <ol className="mb-4 list-decimal space-y-2 pl-6 marker:text-zinc-600 last:mb-0">
        {children}
      </ol>
    );
  },
  li({ children }) {
    return <li className="pl-1 leading-8">{children}</li>;
  },
  blockquote({ children }) {
    return (
      <blockquote className="my-5 rounded-r-xl border-l-2 border-[#f5576c]/60 bg-kael-gradient-soft py-2 pl-5 pr-4 text-zinc-300">
        {children}
      </blockquote>
    );
  },
  a({ children, href, title }) {
    return (
      <a
        href={href}
        title={title}
        target="_blank"
        rel="noreferrer"
        className="text-[#f7a6ba] underline decoration-[#f5576c]/40 underline-offset-4 transition hover:text-white"
      >
        {children}
      </a>
    );
  },
  hr() {
    return <hr />;
  },
  table({ children }) {
    return (
      <div className="my-5 overflow-x-auto rounded-xl border border-white/[0.08]">
        <table className="w-full border-collapse text-left">{children}</table>
      </div>
    );
  },
  th({ children }) {
    return <th>{children}</th>;
  },
  td({ children }) {
    return <td>{children}</td>;
  },
  img({ src, alt, title }) {
    return (
      <img
        src={src}
        alt={alt ?? ""}
        title={title}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="my-5 max-h-[440px] max-w-full rounded-2xl border border-white/[0.08] object-contain"
      />
    );
  },
};

export default function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <div className="markdown-content text-base leading-8 text-zinc-300">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
