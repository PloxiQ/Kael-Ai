import type { Language } from "../../lib/translations";
import type { ArtifactType } from "./artifactParser";

export type ArtifactText = {
  artifact: string;
  untitled: string;
  openPreview: string;
  openCode: string;
  generating: string;
  generatingHint: string;
  preview: string;
  code: string;
  copy: string;
  copied: string;
  copyFailed: string;
  download: string;
  openTab: string;
  close: string;
  desktop: string;
  mobile: string;
  viewport: string;
  lines: (count: number) => string;
  empty: string;
  previewError: string;
  sandboxed: string;
  safePreview: string;
  loading: string;
  dismiss: string;
  types: Record<ArtifactType, string>;
};

const TEXT: Record<Language, ArtifactText> = {
  ru: {
    artifact: "Артефакт",
    untitled: "Без названия",
    openPreview: "Открыть превью",
    openCode: "Открыть код",
    generating: "Генерация",
    generatingHint: "Артефакт собирается…",
    preview: "Превью",
    code: "Код",
    copy: "Копировать",
    copied: "Скопировано",
    copyFailed: "Ошибка копирования",
    download: "Скачать",
    openTab: "В новой вкладке",
    close: "Закрыть",
    desktop: "Десктоп",
    mobile: "Мобильный",
    viewport: "Ширина превью",
    lines: (count) => `${count} строк`,
    empty: "Артефакт пуст.",
    previewError: "Превью сообщило об ошибке.",
    sandboxed: "Изолированная песочница",
    safePreview: "Безопасный просмотр",
    loading: "Загрузка превью…",
    dismiss: "Скрыть",
    types: {
      html: "HTML",
      react: "React",
      code: "Код",
      markdown: "Markdown",
      svg: "SVG",
    },
  },
  uk: {
    artifact: "Артефакт",
    untitled: "Без назви",
    openPreview: "Відкрити прев'ю",
    openCode: "Відкрити код",
    generating: "Генерація",
    generatingHint: "Артефакт збирається…",
    preview: "Прев'ю",
    code: "Код",
    copy: "Копіювати",
    copied: "Скопійовано",
    copyFailed: "Помилка копіювання",
    download: "Завантажити",
    openTab: "У новій вкладці",
    close: "Закрити",
    desktop: "Десктоп",
    mobile: "Мобільний",
    viewport: "Ширина прев'ю",
    lines: (count) => `${count} рядків`,
    empty: "Артефакт порожній.",
    previewError: "Прев'ю повідомило про помилку.",
    sandboxed: "Ізольована пісочниця",
    safePreview: "Безпечний перегляд",
    loading: "Завантаження прев'ю…",
    dismiss: "Приховати",
    types: {
      html: "HTML",
      react: "React",
      code: "Код",
      markdown: "Markdown",
      svg: "SVG",
    },
  },
  en: {
    artifact: "Artifact",
    untitled: "Untitled",
    openPreview: "Open Preview",
    openCode: "Open Code",
    generating: "Generating",
    generatingHint: "Building artifact…",
    preview: "Preview",
    code: "Code",
    copy: "Copy",
    copied: "Copied!",
    copyFailed: "Copy failed",
    download: "Download",
    openTab: "New tab",
    close: "Close",
    desktop: "Desktop",
    mobile: "Mobile",
    viewport: "Preview width",
    lines: (count) => `${count} line${count === 1 ? "" : "s"}`,
    empty: "This artifact is empty.",
    previewError: "The preview reported an error.",
    sandboxed: "Sandboxed preview",
    safePreview: "Safe preview",
    loading: "Loading preview…",
    dismiss: "Dismiss",
    types: {
      html: "HTML",
      react: "React",
      code: "Code",
      markdown: "Markdown",
      svg: "SVG",
    },
  },
};

export function artifactText(language: Language): ArtifactText {
  return TEXT[language] ?? TEXT.en;
}
