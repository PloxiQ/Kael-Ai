"use client";

import { Braces } from "lucide-react";
import { useMemo } from "react";
import { useI18n } from "../../lib/i18n";
import { artifactText } from "./artifactText";

type TokenType =
  | "plain"
  | "comment"
  | "string"
  | "number"
  | "keyword"
  | "tag"
  | "attr"
  | "function"
  | "operator"
  | "punctuation"
  | "property"
  | "heading"
  | "link"
  | "emphasis";

type Token = { text: string; type: TokenType };
type Rule = { pattern: RegExp; type: TokenType };

const TOKEN_CLASS: Record<TokenType, string> = {
  plain: "text-zinc-300",
  comment: "text-zinc-500 italic",
  string: "text-emerald-300/90",
  number: "text-amber-200/90",
  keyword: "text-[#34D399]",
  tag: "text-[#10B981]",
  attr: "text-[#f7c6a6]",
  function: "text-sky-300/90",
  operator: "text-zinc-400",
  punctuation: "text-zinc-500",
  property: "text-[#34D399]",
  heading: "text-[#34D399] font-semibold",
  link: "text-sky-300 underline decoration-sky-300/40 underline-offset-2",
  emphasis: "text-zinc-200 italic",
};

const JS_RULES: Rule[] = [
  { pattern: /\/\/[^\n]*|\/\*[\s\S]*?\*\//g, type: "comment" },
  {
    pattern:
      /`(?:[^`\\]|\\.)*`|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g,
    type: "string",
  },
  {
    pattern:
      /\b(?:const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|super|import|from|export|default|async|await|try|catch|finally|throw|typeof|instanceof|in|of|delete|void|yield|this|null|undefined|true|false|interface|type|enum|implements|readonly|public|private|protected|static|abstract|as|satisfies|keyof|infer|never|unknown|any|string|number|boolean|object|declare|namespace|module|get|set)\b/g,
    type: "keyword",
  },
  {
    pattern: /\b(?:0[xX][\da-fA-F]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g,
    type: "number",
  },
  { pattern: /\b[A-Za-z_$][\w$]*(?=\s*\()/g, type: "function" },
  { pattern: /[{}()\[\];,.:?]/g, type: "punctuation" },
  { pattern: /[+\-*\/%=<>!&|^~]+/g, type: "operator" },
];

const PYTHON_RULES: Rule[] = [
  { pattern: /#[^\n]*/g, type: "comment" },
  {
    pattern: /"""[\s\S]*?"""|'''[\s\S]*?'''/g,
    type: "string",
  },
  {
    pattern: /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g,
    type: "string",
  },
  { pattern: /@[A-Za-z_]\w*/g, type: "function" },
  {
    pattern:
      /\b(?:def|class|return|if|elif|else|for|while|break|continue|pass|import|from|as|try|except|finally|raise|with|yield|lambda|and|or|not|in|is|None|True|False|async|await|global|nonlocal|assert|del|match|case)\b/g,
    type: "keyword",
  },
  {
    pattern: /\b(?:0[xX][\da-fA-F]+|\d+(?:\.\d+)?)\b/g,
    type: "number",
  },
  { pattern: /\b[A-Za-z_]\w*(?=\s*\()/g, type: "function" },
  { pattern: /[{}()\[\];,.:?]/g, type: "punctuation" },
  { pattern: /[+\-*\/%=<>!&|^~]+/g, type: "operator" },
];

const MARKUP_RULES: Rule[] = [
  { pattern: /<!--[\s\S]*?-->/g, type: "comment" },
  { pattern: /<![^>]*>/g, type: "keyword" },
  { pattern: /<\/?[A-Za-z][\w:-]*/g, type: "tag" },
  { pattern: /[A-Za-z_:][\w:.-]*(?=\s*=)/g, type: "attr" },
  {
    pattern: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g,
    type: "string",
  },
  { pattern: /&[A-Za-z0-9#]+;/g, type: "keyword" },
  { pattern: /[<>/=]/g, type: "punctuation" },
];

const CSS_RULES: Rule[] = [
  { pattern: /\/\*[\s\S]*?\*\//g, type: "comment" },
  {
    pattern: /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g,
    type: "string",
  },
  { pattern: /@[\w-]+/g, type: "keyword" },
  { pattern: /[A-Za-z-]+(?=\s*:)/g, type: "property" },
  { pattern: /#[0-9a-fA-F]{3,8}\b/g, type: "number" },
  {
    pattern: /\b\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw|s|ms)?\b/g,
    type: "number",
  },
  { pattern: /[{}();:,]/g, type: "punctuation" },
  { pattern: /[>+~*=]/g, type: "operator" },
];

const JSON_RULES: Rule[] = [
  {
    pattern: /"(?:[^"\\\n]|\\.)*"/g,
    type: "string",
  },
  {
    pattern: /\b(?:true|false|null)\b/g,
    type: "keyword",
  },
  {
    pattern: /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g,
    type: "number",
  },
  { pattern: /[{}[\],:]/g, type: "punctuation" },
];

const SHELL_RULES: Rule[] = [
  { pattern: /#[^\n]*/g, type: "comment" },
  {
    pattern: /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g,
    type: "string",
  },
  { pattern: /\$\{?[A-Za-z_][\w]*\}?/g, type: "keyword" },
  {
    pattern:
      /\b(?:if|then|else|elif|fi|for|while|do|done|case|esac|function|in|return|export|local|echo|cd|mkdir|rm|cp|mv|sudo|npm|npx|git|docker|curl|wget)\b/g,
    type: "keyword",
  },
  { pattern: /\b\d+(?:\.\d+)?\b/g, type: "number" },
  { pattern: /[{}()\[\];,.:?]/g, type: "punctuation" },
  { pattern: /[|&<>=$!]+/g, type: "operator" },
];

const SQL_RULES: Rule[] = [
  { pattern: /--[^\n]*|\/\*[\s\S]*?\*\//g, type: "comment" },
  {
    pattern: /'(?:[^'\\\n]|\\.)*'/g,
    type: "string",
  },
  {
    pattern:
      /\b(?:select|from|where|insert|into|values|update|set|delete|create|table|alter|drop|join|left|right|inner|outer|on|group|by|order|having|limit|offset|and|or|not|null|as|distinct|count|sum|avg|min|max|primary|key|foreign|references|index|view|union|all|case|when|then|else|end)\b/gi,
    type: "keyword",
  },
  { pattern: /\b\d+(?:\.\d+)?\b/g, type: "number" },
  { pattern: /[{}()\[\];,.:?]/g, type: "punctuation" },
  { pattern: /[+\-*\/%=<>!]+/g, type: "operator" },
];

const MARKDOWN_RULES: Rule[] = [
  { pattern: /```[\s\S]*?```/g, type: "comment" },
  { pattern: /^#{1,6}[^\n]*/gm, type: "heading" },
  { pattern: /^>[^\n]*/gm, type: "emphasis" },
  { pattern: /^\s*(?:[-*+]|\d+\.)\s/gm, type: "keyword" },
  { pattern: /`[^`\n]+`/g, type: "string" },
  { pattern: /\*\*[^*\n]+\*\*|__[^_\n]+__/g, type: "emphasis" },
  { pattern: /\*[^*\n]+\*|_[^_\n]+_/g, type: "emphasis" },
  { pattern: /\[[^\]\n]*\]\([^)]+\)/g, type: "link" },
];

const GENERIC_RULES: Rule[] = [
  { pattern: /\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\//g, type: "comment" },
  {
    pattern: /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g,
    type: "string",
  },
  { pattern: /\b\d+(?:\.\d+)?\b/g, type: "number" },
  {
    pattern:
      /\b(?:const|let|var|function|return|if|else|for|while|class|new|import|export|true|false|null)\b/g,
    type: "keyword",
  },
  { pattern: /[{}()\[\];,.:?]/g, type: "punctuation" },
];

function rulesForLanguage(language: string): Rule[] {
  const value = language.toLowerCase();

  if (
    ["html", "htm", "xml", "svg", "vue", "svelte", "astro"].includes(value)
  ) {
    return MARKUP_RULES;
  }
  if (["css", "scss", "less", "sass", "stylus"].includes(value)) {
    return CSS_RULES;
  }
  if (["python", "py"].includes(value)) {
    return PYTHON_RULES;
  }
  if (["markdown", "md", "mdx"].includes(value)) {
    return MARKDOWN_RULES;
  }
  if (["json", "jsonc"].includes(value)) {
    return JSON_RULES;
  }
  if (["bash", "sh", "shell", "zsh", "powershell", "ps1"].includes(value)) {
    return SHELL_RULES;
  }
  if (value === "sql") {
    return SQL_RULES;
  }
  if (
    [
      "javascript",
      "js",
      "jsx",
      "typescript",
      "ts",
      "tsx",
      "node",
      "mjs",
      "cjs",
    ].includes(value)
  ) {
    return JS_RULES;
  }
  if (value === "text" || value === "plain") {
    return [];
  }
  return GENERIC_RULES;
}

function tokenize(code: string, rules: Rule[]): Token[] {
  if (rules.length === 0) {
    return code ? [{ text: code, type: "plain" }] : [];
  }

  const tokens: Token[] = [];
  let index = 0;

  while (index < code.length) {
    let best: {
      index: number;
      length: number;
      text: string;
      type: TokenType;
    } | null = null;

    for (const rule of rules) {
      const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
      regex.lastIndex = index;
      const match = regex.exec(code);

      if (!match || match[0].length === 0) {
        continue;
      }
      if (!best || match.index < best.index) {
        best = {
          index: match.index,
          length: match[0].length,
          text: match[0],
          type: rule.type,
        };
      }
    }

    if (!best) {
      tokens.push({ text: code.slice(index), type: "plain" });
      break;
    }

    if (best.index > index) {
      tokens.push({
        text: code.slice(index, best.index),
        type: "plain",
      });
    }

    tokens.push({ text: best.text, type: best.type });
    index = best.index + best.length;
  }

  return tokens;
}

function splitLines(tokens: Token[]): Token[][] {
  const lines: Token[][] = [[]];

  for (const token of tokens) {
    const parts = token.text.split("\n");

    parts.forEach((part, index) => {
      if (index > 0) {
        lines.push([]);
      }
      if (part.length > 0) {
        lines[lines.length - 1].push({ text: part, type: token.type });
      }
    });
  }

  return lines;
}

export default function CodeViewer({
  content,
  language,
}: {
  content: string;
  language: string;
}) {
  const { language: uiLanguage } = useI18n();
  const text = artifactText(uiLanguage);
  const normalized = useMemo(
    () => content.replace(/\r\n/g, "\n").replace(/\r/g, "\n"),
    [content],
  );
  const lines = useMemo(
    () => splitLines(tokenize(normalized, rulesForLanguage(language))),
    [language, normalized],
  );

  if (!content.trim()) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#262626] bg-[#1C1C1C] text-zinc-500">
          <Braces size={22} strokeWidth={1.5} />
        </span>
        <p className="text-sm text-zinc-500">{text.empty}</p>
      </div>
    );
  }

  return (
    <div
      className="h-full overflow-auto scroll-smooth bg-[#0A0A0A]"
      aria-label={text.code}
    >
      <pre className="min-w-max py-4 font-mono text-sm leading-6">
        {lines.map((line, lineIndex) => (
          <div
            key={lineIndex}
            className="flex min-h-6 min-w-full hover:bg-[#1C1C1C]"
          >
            <span
              aria-hidden="true"
              className="sticky left-0 z-10 w-14 shrink-0 select-none border-r border-[#262626] bg-[#0A0A0A] pr-3 text-right text-zinc-600"
            >
              {lineIndex + 1}
            </span>
            <code className="block whitespace-pre px-4 text-zinc-300">
              {line.length === 0
                ? "\u00A0"
                : line.map((token, tokenIndex) => (
                    <span
                      key={`${lineIndex}-${tokenIndex}`}
                      className={TOKEN_CLASS[token.type]}
                    >
                      {token.text}
                    </span>
                  ))}
            </code>
          </div>
        ))}
      </pre>
    </div>
  );
}
