import {
  localeFor,
  translate,
  type Language,
} from "./translations";

export type AttachmentKind = "image" | "pdf" | "text" | "code";

export type Attachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  kind: AttachmentKind;
  /** Base64 payload without the data URL prefix. Present only in memory. */
  data?: string;
  /** Extracted text for text and code files. Present only in memory. */
  text?: string;
  /** Small data URL used for thumbnails and persisted history. */
  previewUrl?: string;
};

export type AttachmentPayload = {
  name: string;
  mime_type: string;
  size: number;
  kind: AttachmentKind;
  data?: string;
  text?: string;
};

export const MAX_ATTACHMENTS = 6;
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_TOTAL_ATTACHMENT_BYTES = 24 * 1024 * 1024;
export const MAX_TEXT_ATTACHMENT_CHARS = 120_000;

const IMAGE_MAX_DIMENSION = 1_800;
const IMAGE_QUALITY = 0.92;
const PREVIEW_MAX_DIMENSION = 220;
const PREVIEW_QUALITY = 0.82;

const CODE_EXTENSIONS = new Set([
  "js",
  "jsx",
  "mjs",
  "cjs",
  "ts",
  "tsx",
  "py",
  "pyw",
  "java",
  "c",
  "h",
  "cc",
  "cpp",
  "cxx",
  "hpp",
  "cs",
  "go",
  "rs",
  "rb",
  "php",
  "swift",
  "kt",
  "kts",
  "scala",
  "sql",
  "sh",
  "bash",
  "zsh",
  "fish",
  "ps1",
  "bat",
  "cmd",
  "css",
  "scss",
  "sass",
  "less",
  "html",
  "htm",
  "xml",
  "vue",
  "svelte",
  "dart",
  "lua",
  "r",
  "m",
  "mm",
  "gradle",
  "dockerfile",
  "makefile",
  "cmake",
  "graphql",
  "proto",
  "asm",
]);

const TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "markdown",
  "mdx",
  "csv",
  "tsv",
  "json",
  "jsonl",
  "yaml",
  "yml",
  "toml",
  "ini",
  "cfg",
  "conf",
  "log",
  "env",
  "gitignore",
  "editorconfig",
  "lock",
]);

function extensionOf(name: string): string {
  const clean = name.trim().toLowerCase();
  const dot = clean.lastIndexOf(".");
  if (dot < 0 || dot === clean.length - 1) {
    return clean;
  }
  return clean.slice(dot + 1);
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function estimateBase64Bytes(base64: string): number {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

function dataUrlToBase64(dataUrl: string): string {
  const comma = dataUrl.indexOf(",");
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

function readAsDataUrl(file: File, language: Language): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const readError = () =>
      new Error(translate(language, "attachment.readError", { name: file.name }));
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(readError());
      }
    };
    reader.onerror = () => {
      reject(readError());
    };
    reader.readAsDataURL(file);
  });
}

function loadImage(source: string, language: Language): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error(translate(language, "attachment.imageOpenError")));
    image.src = source;
  });
}

function drawToDataUrl(
  image: HTMLImageElement,
  maxDimension: number,
  quality: number,
  language: Language,
): string {
  const largestSide = Math.max(image.naturalWidth, image.naturalHeight, 1);
  const scale = Math.min(1, maxDimension / largestSide);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error(translate(language, "attachment.imagePrepareError"));
  }

  context.fillStyle = "#08080b";
  context.fillRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", quality);
}

async function processImage(
  file: File,
  language: Language,
): Promise<Attachment> {
  const source = await readAsDataUrl(file, language);
  const image = await loadImage(source, language);
  const full = drawToDataUrl(
    image,
    IMAGE_MAX_DIMENSION,
    IMAGE_QUALITY,
    language,
  );
  const preview = drawToDataUrl(
    image,
    PREVIEW_MAX_DIMENSION,
    PREVIEW_QUALITY,
    language,
  );
  const data = dataUrlToBase64(full);

  return {
    id: createId(),
    name: file.name || "screenshot.jpg",
    mimeType: "image/jpeg",
    size: estimateBase64Bytes(data),
    kind: "image",
    data,
    previewUrl: preview,
  };
}

async function processPdf(
  file: File,
  language: Language,
): Promise<Attachment> {
  const dataUrl = await readAsDataUrl(file, language);
  const data = dataUrlToBase64(dataUrl);

  return {
    id: createId(),
    name: file.name || "document.pdf",
    mimeType: "application/pdf",
    size: estimateBase64Bytes(data),
    kind: "pdf",
    data,
  };
}

async function processText(
  file: File,
  kind: "text" | "code",
  language: Language,
): Promise<Attachment> {
  const text = await file.text();
  const normalized = text.replace(/\u0000/g, "");

  if (!normalized.trim()) {
    throw new Error(
      translate(language, "attachment.emptyFile", { name: file.name }),
    );
  }

  if (normalized.length > MAX_TEXT_ATTACHMENT_CHARS) {
    throw new Error(
      translate(language, "attachment.tooManyChars", {
        name: file.name,
        count: Math.round(MAX_TEXT_ATTACHMENT_CHARS / 1000),
      }),
    );
  }

  return {
    id: createId(),
    name: file.name || (kind === "code" ? "source.txt" : "document.txt"),
    mimeType: file.type || (kind === "code" ? "text/plain" : "text/plain"),
    size: file.size || new Blob([normalized]).size,
    kind,
    text: normalized,
  };
}

export function attachmentKindOf(file: File): AttachmentKind | null {
  const extension = extensionOf(file.name);
  const mime = file.type.toLowerCase();

  if (mime.startsWith("image/")) {
    return "image";
  }

  if (mime === "application/pdf" || extension === "pdf") {
    return "pdf";
  }

  if (CODE_EXTENSIONS.has(extension) || /^(text|application)\/(x-)?(javascript|typescript|json|xml)$/.test(mime)) {
    return "code";
  }

  if (
    TEXT_EXTENSIONS.has(extension) ||
    mime.startsWith("text/") ||
    mime === "application/json"
  ) {
    return "text";
  }

  return null;
}

export async function createAttachment(
  file: File,
  language: Language = "ru",
): Promise<Attachment> {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error(
      translate(language, "attachment.tooLarge", {
        name: file.name,
        size: formatFileSize(MAX_ATTACHMENT_BYTES, language),
      }),
    );
  }

  const kind = attachmentKindOf(file);
  if (!kind) {
    throw new Error(
      translate(language, "attachment.unsupported", {
        ext: extensionOf(file.name) || translate(language, "attachment.noExtension"),
      }),
    );
  }

  if (kind === "image") {
    return processImage(file, language);
  }

  if (kind === "pdf") {
    return processPdf(file, language);
  }

  return processText(file, kind, language);
}

export function totalAttachmentBytes(attachments: Attachment[]): number {
  return attachments.reduce((total, attachment) => total + attachment.size, 0);
}

export function toAttachmentPayload(
  attachment: Attachment,
): AttachmentPayload | null {
  const base = {
    name: attachment.name,
    mime_type: attachment.mimeType,
    size: attachment.size,
    kind: attachment.kind,
  };

  if (attachment.kind === "image" || attachment.kind === "pdf") {
    if (!attachment.data) {
      return null;
    }
    return { ...base, data: attachment.data };
  }

  if (!attachment.text) {
    return null;
  }

  return { ...base, text: attachment.text };
}

export function toStoredAttachment(attachment: Attachment): Attachment {
  return {
    id: attachment.id,
    name: attachment.name,
    mimeType: attachment.mimeType,
    size: attachment.size,
    kind: attachment.kind,
    ...(attachment.previewUrl ? { previewUrl: attachment.previewUrl } : {}),
  };
}

export function attachmentPreviewUrl(attachment: Attachment): string | null {
  if (attachment.previewUrl) {
    return attachment.previewUrl;
  }

  if (attachment.data) {
    return `data:${attachment.mimeType};base64,${attachment.data}`;
  }

  return null;
}

export function formatFileSize(
  bytes: number,
  language: Language = "ru",
): string {
  const safe = Math.max(0, bytes);
  const formatter = new Intl.NumberFormat(localeFor(language), {
    maximumFractionDigits: 1,
  });

  if (safe < 1024) {
    return translate(language, "units.bytes", {
      count: formatter.format(Math.round(safe)),
    });
  }
  if (safe < 1024 * 1024) {
    return translate(language, "units.kb", {
      count: formatter.format(Math.round(safe / 1024)),
    });
  }
  return translate(language, "units.mb", {
    count: formatter.format(safe / (1024 * 1024)),
  });
}

const ATTACHMENT_KINDS: AttachmentKind[] = ["image", "pdf", "text", "code"];

export function isStoredAttachment(value: unknown): value is Attachment {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const attachment = value as Partial<Attachment>;

  return (
    typeof attachment.id === "string" &&
    typeof attachment.name === "string" &&
    typeof attachment.mimeType === "string" &&
    typeof attachment.size === "number" &&
    Number.isFinite(attachment.size) &&
    typeof attachment.kind === "string" &&
    ATTACHMENT_KINDS.includes(attachment.kind as AttachmentKind) &&
    (attachment.previewUrl === undefined ||
      typeof attachment.previewUrl === "string") &&
    (attachment.data === undefined || typeof attachment.data === "string") &&
    (attachment.text === undefined || typeof attachment.text === "string")
  );
}
