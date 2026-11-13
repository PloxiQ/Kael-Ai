"use client";

import { FileText } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useI18n } from "../../lib/i18n";
import type { KaelArtifact } from "./artifactParser";
import { artifactText } from "./artifactText";

const COMPONENTS: Components = {
  h1: ({ children }) => (
    <h1 className="mb-5 mt-0 border-b border-white/10 pb-3 text-2xl font-semibold tracking-tight text-white">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-8 border-b border-white/[0.08] pb-2 text-xl font-semibold tracking-tight text-white first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-6 text-lg font-semibold text-zinc-100 first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="mb-2 mt-5 text-base font-semibold text-zinc-100 first:mt-0">
      {children}
    </h4>
  ),
  h5: ({ children }) => (
    <h5 className="mb-2 mt-4 text-sm font-semibold uppercase tracking-[0.14em] text-zinc-300 first:mt-0">
      {children}
    </h5>
  ),
  h6: ({ children }) => (
    <h6 className="mb-2 mt-4 text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400 first:mt-0">
      {children}
    </h6>
  ),
  p: ({ children }) => <p className="my-3">{children}</p>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#f7a6ba] underline decoration-[#f093fb]/40 underline-offset-4 transition hover:text-white hover:decoration-[#f5576c]"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="text-zinc-200 italic">{children}</em>
  ),
  del: ({ children }) => (
    <del className="text-zinc-500 line-through">{children}</del>
  ),
  ul: ({ children }) => (
    <ul className="my-3 list-disc space-y-1.5 pl-6 marker:text-[#f5576c]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 list-decimal space-y-1.5 pl-6 marker:text-[#f5576c]">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-2 border-[#f093fb]/50 pl-4 text-zinc-400 italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-6 border-white/10" />,
  pre: ({ children }) => (
    <pre className="my-4 overflow-x-auto rounded-xl border border-white/10 bg-black/45 p-4">
      {children}
    </pre>
  ),
  code: ({ className, children }) => {
    const value = String(children ?? "");
    const isBlock =
      /(?:^|\s)language-/.test(className ?? "") || value.includes("\n");

    if (isBlock) {
      return (
        <code
          className={`block whitespace-pre font-mono text-sm leading-6 text-zinc-300 ${className ?? ""}`}
        >
          {children}
        </code>
      );
    }

    return (
      <code className="rounded-md border border-white/10 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[14px] text-[#f7a6ba]">
        {children}
      </code>
    );
  },
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-white/[0.04] text-zinc-200">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="border-b border-white/10 px-3 py-2 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-white/[0.06] px-3 py-2 align-top">
      {children}
    </td>
  ),
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt ?? ""}
      className="my-4 max-w-full rounded-xl border border-white/10"
    />
  ),
  input: ({ checked, disabled, type }) => (
    <input
      type={type}
      checked={checked}
      disabled={disabled}
      readOnly
      className="mr-2 h-4 w-4 accent-[#f5576c]"
    />
  ),
};

export default function MarkdownPreview({
  artifact,
  device,
}: {
  artifact: KaelArtifact;
  device: "desktop" | "mobile";
}) {
  const { language } = useI18n();
  const text = artifactText(language);
  const isMobileFrame = device === "mobile";

  if (!artifact.content.trim()) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-zinc-500">
          <FileText size={22} strokeWidth={1.5} />
        </span>
        <p className="text-sm text-zinc-500">{text.empty}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full justify-center overflow-hidden bg-[#050507] p-0 sm:p-3">
      <div
        className={`h-full min-h-0 overflow-y-auto bg-[#09090b] ${
          isMobileFrame
            ? "mx-auto w-[375px] max-w-full rounded-[26px] border border-white/15 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.9)]"
            : "w-full rounded-none border-0 sm:rounded-xl sm:border sm:border-white/10"
        }`}
      >
        <article className="mx-auto max-w-3xl px-5 py-6 text-[15px] leading-7 text-zinc-300 sm:px-8 sm:py-8">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={COMPONENTS}
          >
            {artifact.content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
