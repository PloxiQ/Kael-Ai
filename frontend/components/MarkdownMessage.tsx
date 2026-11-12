"use client";

import { Check, Clipboard } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownMessageProps = {
  content: string;
};

function CodeBlock({ children, className }: { children?: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const code = String(children ?? "").replace(/\n$/, "");
  const language = className?.replace("language-", "") || "code";

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return <div className="my-4 overflow-hidden rounded-xl border border-white/[0.1] bg-black/50"><div className="flex items-center justify-between border-b border-white/[0.08] px-3 py-2 kael-mono text-[10px] uppercase tracking-[0.12em] text-zinc-600"><span>{language}</span><button type="button" onClick={() => void copyCode()} className="inline-flex items-center gap-1.5 text-zinc-500 transition hover:text-zinc-100">{copied ? <Check size={13} strokeWidth={1.5} /> : <Clipboard size={13} strokeWidth={1.5} />}{copied ? "скопировано" : "копировать"}</button></div><pre className="overflow-x-auto p-4 kael-mono text-xs leading-6 text-zinc-300"><code>{code}</code></pre></div>;
}

export default function MarkdownMessage({ content }: MarkdownMessageProps) {
  return <div className="markdown-content text-[15px] leading-8 text-zinc-300"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ pre({ children }) { const child = children as React.ReactElement<{ className?: string; children?: React.ReactNode }>; return <CodeBlock className={child?.props?.className}>{child?.props?.children}</CodeBlock>; }, code({ children, className, ...props }) { return <code className={className ?? "rounded bg-white/[0.08] px-1.5 py-0.5 kael-mono text-xs text-zinc-200"} {...props}>{children}</code>; }, h1({ children }) { return <h1 className="mb-4 mt-6 kael-display text-xl text-zinc-100">{children}</h1>; }, h2({ children }) { return <h2 className="mb-3 mt-5 kael-display text-lg text-zinc-100">{children}</h2>; }, p({ children }) { return <p className="mb-4 last:mb-0">{children}</p>; }, ul({ children }) { return <ul className="mb-4 list-disc space-y-1 pl-6">{children}</ul>; }, ol({ children }) { return <ol className="mb-4 list-decimal space-y-1 pl-6">{children}</ol>; }, blockquote({ children }) { return <blockquote className="my-4 border-l-2 border-[#c1121f] pl-4 text-zinc-500">{children}</blockquote>; }, a({ children, href }) { return <a href={href} target="_blank" rel="noreferrer" className="text-red-300 underline decoration-red-300/40 underline-offset-4 hover:text-red-200">{children}</a>; } }}>{content}</ReactMarkdown></div>;
}
