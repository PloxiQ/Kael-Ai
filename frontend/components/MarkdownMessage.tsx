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
    <div className="my-5 overflow-hidden rounded-2xl border border-[#262626] bg-[#161616]/85">
      <div className="flex items-center justify-between gap-3 border-b border-[#262626] px-5 py-3">
        <span className="text-sm text-zinc-500">{language}</span>
        <button
          type="button"
          onClick={() => void copyCode()}
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-zinc-400 transition hover:bg-[#1C1C1C] hover:text-white"
        >
          {copyState === "copied" ? (
            <Check size={15} strokeWidth={1.6} className="text-[#34D399]" />
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
      <code className="rounded-md border border-[#262626] bg-[#1C1C1C] px-1.5 py-0.5 font-mono text-[0.9em] text-zinc-100">
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
      <blockquote className="my-5 rounded-r-xl border-l-2 border-[#10B981]/60 bg-[#10B981]/10 py-2 pl-5 pr-4 text-zinc-300">
        {children}
      </blockquote>
    );
  },
  a({ children, href, title }) {
    const external =
      typeof href === "string" && /^https?:\/\//i.test(href);

    return (
      <a
        href={href}
        title={title}
        {...(external
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
        className="text-[#34D399] underline decoration-[#10B981]/40 underline-offset-4 transition hover:text-white"
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
      <div className="my-5 overflow-x-auto rounded-xl border border-[#262626]">
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
        className="my-5 max-h-[440px] max-w-full rounded-2xl border border-[#262626] object-contain"
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
