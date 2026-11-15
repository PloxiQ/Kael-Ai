"use client";

import { FileText } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useI18n } from "../../lib/i18n";
import type { KaelArtifact } from "./artifactParser";
import { artifactText } from "./artifactText";

const COMPONENTS: Components = {
  h1: ({ children }) => (
    <h1 className="mb-5 mt-0 border-b border-[#262626] pb-3 text-2xl font-semibold tracking-tight text-white">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-8 border-b border-[#262626] pb-2 text-xl font-semibold tracking-tight text-white first:mt-0">
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
      className="text-[#34D399] underline decoration-[#10B981]/40 underline-offset-4 transition hover:text-white hover:decoration-[#10B981]"
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
    <ul className="my-3 list-disc space-y-1.5 pl-6 marker:text-[#10B981]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 list-decimal space-y-1.5 pl-6 marker:text-[#10B981]">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-2 border-[#10B981]/50 pl-4 text-zinc-400 italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-6 border-[#262626]" />,
  pre: ({ children }) => (
    <pre className="my-4 overflow-x-auto rounded-xl border border-[#262626] bg-black/45 p-4">
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
      <code className="rounded-md border border-[#262626] bg-[#1C1C1C] px-1.5 py-0.5 font-mono text-[14px] text-[#34D399]">
        {children}
      </code>
    );
  },
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-[#262626]">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-[#1C1C1C] text-zinc-200">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="border-b border-[#262626] px-3 py-2 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-[#262626] px-3 py-2 align-top">
      {children}
    </td>
  ),
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt ?? ""}
      className="my-4 max-w-full rounded-xl border border-[#262626]"
    />
  ),
  input: ({ checked, disabled, type }) => (
    <input
      type={type}
      checked={checked}
      disabled={disabled}
      readOnly
      className="mr-2 h-4 w-4 accent-[#10B981]"
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
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#262626] bg-[#1C1C1C] text-zinc-500">
          <FileText size={22} strokeWidth={1.5} />
        </span>
        <p className="text-sm text-zinc-500">{text.empty}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full justify-center overflow-hidden bg-[#0A0A0A] p-0 sm:p-3">
      <div
        className={`h-full min-h-0 overflow-y-auto bg-[#09090b] ${
          isMobileFrame
            ? "mx-auto w-[375px] max-w-full rounded-[26px] border border-[#262626] shadow-[0_24px_80px_-24px_rgba(0,0,0,0.9)]"
            : "w-full rounded-none border-0 sm:rounded-xl sm:border sm:border-[#262626]"
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
