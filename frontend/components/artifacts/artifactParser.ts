export type ArtifactType = "html" | "react" | "code" | "markdown" | "svg";

export type KaelArtifact = {
  id: string;
  type: ArtifactType;
  title: string;
  language: string;
  content: string;
  fileName: string;
  isStreaming: boolean;
};

export type ArtifactSegment =
  | { type: "text"; content: string }
  | { type: "artifact"; artifact: KaelArtifact };

const OPEN_TAG_PATTERN = /<kael_artifact(?=[\s/>])/gi;
const CLOSE_TAG_PATTERN = /<\/kael_artifact\s*>/gi;
const ORPHAN_TAG_PATTERN = /<\/?kael_artifact\b[^>]*>/gi;
const ATTRIBUTE_PATTERN =
  /([a-zA-Z_][\w:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;

const LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  ts: "typescript",
  py: "python",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  md: "markdown",
  mdx: "markdown",
  htm: "html",
  yml: "yaml",
  rs: "rust",
  kt: "kotlin",
  cs: "csharp",
  "c++": "cpp",
  rb: "ruby",
  svg: "svg",
  text: "text",
};

const EXTENSION_BY_LANGUAGE: Record<string, string> = {
  html: "html",
  css: "css",
  scss: "scss",
  less: "less",
  javascript: "js",
  jsx: "jsx",
  typescript: "ts",
  tsx: "tsx",
  python: "py",
  json: "json",
  markdown: "md",
  bash: "sh",
  shell: "sh",
  sql: "sql",
  yaml: "yml",
  xml: "xml",
  svg: "svg",
  rust: "rs",
  go: "go",
  java: "java",
  cpp: "cpp",
  c: "c",
  csharp: "cs",
  ruby: "rb",
  php: "php",
  kotlin: "kt",
  swift: "swift",
  text: "txt",
};

function readAttributes(source: string): Record<string, string> {
  const attributes: Record<string, string> = {};

  for (const match of source.matchAll(ATTRIBUTE_PATTERN)) {
    const key = match[1]?.toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    if (key) {
      attributes[key] = value;
    }
  }

  return attributes;
}

function findTagEnd(source: string, start: number): number {
  let quote: string | null = null;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      if (char === "\\" && index + 1 < source.length) {
        index += 1;
        continue;
      }
      if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (char === "\n" || char === "\r") {
      return -1;
    }

    if (char === ">") {
      return index;
    }
  }

  return -1;
}

function findClosingTag(
  source: string,
  start: number,
): { index: number; length: number } | null {
  const regex = new RegExp(CLOSE_TAG_PATTERN.source, "gi");
  regex.lastIndex = start;
  const match = regex.exec(source);
  return match ? { index: match.index, length: match[0].length } : null;
}

function findPartialClosingTagStart(source: string, start: number): number {
  const tail = source.slice(start);
  const lastOpen = tail.lastIndexOf("<");
  if (lastOpen < 0) {
    return -1;
  }

  const fragment = tail.slice(lastOpen).toLowerCase();
  if (fragment.includes(">")) {
    return -1;
  }
  if (fragment.startsWith("</kael_artifact")) {
    return start + lastOpen;
  }
  if (
    "</kael_artifact".startsWith(fragment) &&
    fragment.length >= 3
  ) {
    return start + lastOpen;
  }
  return -1;
}

function stripTrailingPartialProtocol(value: string): string {
  const lastOpen = value.lastIndexOf("<");
  if (lastOpen < 0) {
    return value;
  }

  const fragment = value.slice(lastOpen).toLowerCase();
  if (fragment.includes(">")) {
    return value;
  }

  if (
    fragment.startsWith("<kael_artifact") ||
    fragment.startsWith("</kael_artifact")
  ) {
    return value.slice(0, lastOpen);
  }

  if (
    "<kael_artifact".startsWith(fragment) &&
    fragment.length >= 3
  ) {
    return value.slice(0, lastOpen);
  }

  if (
    "</kael_artifact".startsWith(fragment) &&
    fragment.length >= 3
  ) {
    return value.slice(0, lastOpen);
  }

  return value;
}

function stripOrphanTags(value: string): string {
  return stripTrailingPartialProtocol(
    value.replace(ORPHAN_TAG_PATTERN, ""),
  ).trim();
}

function stripWrappingFence(raw: string): string {
  const value = raw.replace(/^\r?\n/, "").replace(/\r?\n$/, "");
  const fenced = value.match(/^```[^\n]*\n([\s\S]*?)\n```\s*$/);
  if (fenced) {
    return fenced[1];
  }
  const tildeFenced = value.match(/^~~~[^\n]*\n([\s\S]*?)\n~~~\s*$/);
  if (tildeFenced) {
    return tildeFenced[1];
  }
  return value;
}

function normalizeType(
  declaredType: string,
  language: string,
  content: string,
): ArtifactType {
  const type = declaredType.trim().toLowerCase();

  if (["html", "htm", "website", "web"].includes(type)) {
    return "html";
  }
  if (["react", "tsx", "jsx", "component"].includes(type)) {
    return "react";
  }
  if (["svg", "graphic", "image"].includes(type)) {
    return "svg";
  }
  if (["markdown", "md", "document", "doc", "text"].includes(type)) {
    return "markdown";
  }
  if (
    ["code", "script", "python", "javascript", "typescript"].includes(type)
  ) {
    return "code";
  }

  const lang = language.trim().toLowerCase();
  if (lang === "html" || lang === "htm") {
    return "html";
  }
  if (lang === "svg") {
    return "svg";
  }
  if (lang === "react" || lang === "tsx" || lang === "jsx") {
    return "react";
  }
  if (lang === "md" || lang === "markdown") {
    return "markdown";
  }

  if (/^\s*<svg\b/i.test(content)) {
    return "svg";
  }
  if (/^\s*(?:<!doctype\s+html|<html\b)/i.test(content)) {
    return "html";
  }
  if (
    /\bexport\s+default\b/.test(content) &&
    /<[A-Z][\w.]*[\s/>]/.test(content)
  ) {
    return "react";
  }

  return "code";
}

function normalizeLanguage(
  declaredLanguage: string,
  type: ArtifactType,
  content: string,
): string {
  const language = declaredLanguage.trim().toLowerCase();
  if (language) {
    return LANGUAGE_ALIASES[language] ?? language;
  }

  if (type === "html") {
    return "html";
  }
  if (type === "react") {
    return "tsx";
  }
  if (type === "svg") {
    return "svg";
  }
  if (type === "markdown") {
    return "markdown";
  }

  if (/^\s*#!.*python/m.test(content)) {
    return "python";
  }
  if (/^\s*#!.*node/m.test(content)) {
    return "javascript";
  }
  if (/^\s*<\?php/m.test(content)) {
    return "php";
  }

  return "text";
}

function extensionFor(type: ArtifactType, language: string): string {
  if (type === "html") {
    return "html";
  }
  if (type === "react") {
    return language === "jsx" ? "jsx" : "tsx";
  }
  if (type === "svg") {
    return "svg";
  }
  if (type === "markdown") {
    return "md";
  }
  return EXTENSION_BY_LANGUAGE[language] ?? "txt";
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function createFileName(
  attributes: Record<string, string>,
  title: string,
  type: ArtifactType,
  language: string,
  index: number,
): string {
  const declared =
    attributes.filename?.trim() ||
    attributes.file?.trim() ||
    attributes.name?.trim();

  if (declared) {
    const base = declared.split(/[\\/]/).pop() ?? declared;
    const safe = base.replace(/[<>:"|?*\u0000-\u001F]/g, "").trim();
    if (safe) {
      return safe.includes(".")
        ? safe
        : `${safe}.${extensionFor(type, language)}`;
    }
  }

  const slug = slugify(title) || `artifact-${index + 1}`;
  return `${slug}.${extensionFor(type, language)}`;
}

function createArtifact(
  attributes: Record<string, string>,
  rawContent: string,
  index: number,
  isStreaming: boolean,
): KaelArtifact {
  const content = stripWrappingFence(rawContent);
  const declaredLanguage = attributes.language ?? "";
  const type = normalizeType(
    attributes.type ?? "",
    declaredLanguage,
    content,
  );
  const language = normalizeLanguage(declaredLanguage, type, content);
  const title = (attributes.title ?? "").trim();
  const fileName = createFileName(attributes, title, type, language, index);
  const idBase = slugify(attributes.id ?? fileName.replace(/\.[^.]+$/, ""));
  const id = `${idBase || "artifact"}-${index + 1}`;

  return {
    id,
    type,
    title,
    language,
    content,
    fileName,
    isStreaming,
  };
}

export function parseArtifactSegments(
  content: string,
  options?: { streaming?: boolean },
): ArtifactSegment[] {
  if (!content) {
    return [];
  }

  const streaming = options?.streaming ?? false;
  const segments: ArtifactSegment[] = [];
  let cursor = 0;
  let artifactIndex = 0;

  while (cursor < content.length) {
    const openRegex = new RegExp(OPEN_TAG_PATTERN.source, "gi");
    openRegex.lastIndex = cursor;
    const openMatch = openRegex.exec(content);

    if (!openMatch) {
      const remaining = stripOrphanTags(content.slice(cursor));
      if (remaining) {
        segments.push({ type: "text", content: remaining });
      }
      break;
    }

    const openIndex = openMatch.index;
    const tagEnd = findTagEnd(content, openIndex);

    if (tagEnd < 0) {
      const before = stripOrphanTags(content.slice(cursor, openIndex));
      if (before) {
        segments.push({ type: "text", content: before });
      }
      break;
    }

    const before = stripOrphanTags(content.slice(cursor, openIndex));
    if (before) {
      segments.push({ type: "text", content: before });
    }

    const attributes = readAttributes(
      content.slice(openIndex, tagEnd + 1),
    );
    const closing = findClosingTag(content, tagEnd + 1);

    if (closing) {
      const artifact = createArtifact(
        attributes,
        content.slice(tagEnd + 1, closing.index),
        artifactIndex,
        false,
      );
      segments.push({ type: "artifact", artifact });
      cursor = closing.index + closing.length;
    } else {
      const partialClose = findPartialClosingTagStart(
        content,
        tagEnd + 1,
      );
      const contentEnd =
        partialClose >= 0 ? partialClose : content.length;
      const artifact = createArtifact(
        attributes,
        content.slice(tagEnd + 1, contentEnd),
        artifactIndex,
        streaming,
      );
      segments.push({ type: "artifact", artifact });
      break;
    }

    artifactIndex += 1;
  }

  if (segments.length === 0) {
    return [{ type: "text", content: stripOrphanTags(content) }];
  }

  return segments;
}
