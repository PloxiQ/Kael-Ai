import type { Language } from "../../lib/translations";
import type { KaelArtifact } from "./artifactParser";
import { buildPreviewDocument } from "./previewDocument";

export function formatArtifactBytes(
  bytes: number,
  language: Language,
): string {
  const units =
    language === "en" ? ["B", "KB", "MB"] : ["Б", "КБ", "МБ"];

  if (bytes < 1024) {
    return `${Math.round(bytes)} ${units[0]}`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} ${units[1]}`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} ${units[2]}`;
}

export function artifactMimeType(artifact: KaelArtifact): string {
  if (artifact.type === "html") {
    return "text/html;charset=utf-8";
  }
  if (artifact.type === "svg") {
    return "image/svg+xml;charset=utf-8";
  }
  if (artifact.type === "markdown") {
    return "text/markdown;charset=utf-8";
  }
  return "text/plain;charset=utf-8";
}

export async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall through to the legacy path.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  } catch {
    return false;
  }
}

export function downloadArtifact(artifact: KaelArtifact): void {
  const blob = new Blob([artifact.content], {
    type: artifactMimeType(artifact),
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = artifact.fileName;
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function openArtifactInNewTab(artifact: KaelArtifact): void {
  const documentHtml = buildPreviewDocument(artifact);
  const blob = new Blob([documentHtml], {
    type: "text/html;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank", "noopener,noreferrer");

  if (!opened) {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
