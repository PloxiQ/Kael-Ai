"use client";

import { ScrollText, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../lib/i18n";
import type { TranslationKey } from "../lib/translations";
import { KAEL_VERSION_LABEL } from "../lib/version";

type Release = {
  version: string;
  tagline: TranslationKey;
  current?: boolean;
  legacy?: boolean;
  items: readonly TranslationKey[];
};

/**
 * Newest first: the current release stays visible without scrolling, while the
 * old site sits at the end of the table.
 */
const RELEASES: readonly Release[] = [
  {
    version: KAEL_VERSION_LABEL,
    tagline: "changelog.v17.tagline",
    current: true,
    items: [
      "changelog.v17.item0",
      "changelog.v17.item1",
      "changelog.v17.item2",
      "changelog.v17.item3",
      "changelog.v17.item4",
      "changelog.v17.item5",
    ],
  },
  {
    version: "v1.6",
    tagline: "changelog.v16.tagline",
    items: [
      "changelog.v16.item0",
      "changelog.v16.item1",
      "changelog.v16.item2",
      "changelog.v16.item3",
      "changelog.v16.item4",
    ],
  },
  {
    version: "v1.5",
    tagline: "changelog.v15.tagline",
    items: [
      "changelog.v15.item0",
      "changelog.v15.item1",
      "changelog.v15.item2",
      "changelog.v15.item3",
      "changelog.v15.item4",
    ],
  },
  {
    version: "v1.4",
    tagline: "changelog.v14.tagline",
    items: [
      "changelog.v14.item0",
      "changelog.v14.item1",
      "changelog.v14.item2",
      "changelog.v14.item3",
      "changelog.v14.item4",
    ],
  },
  {
    version: "v1.3",
    tagline: "changelog.v13.tagline",
    items: [
      "changelog.v13.item0",
      "changelog.v13.item1",
      "changelog.v13.item2",
      "changelog.v13.item3",
      "changelog.v13.item4",
    ],
  },
  {
    version: "v1.2",
    tagline: "changelog.v12.tagline",
    items: [
      "changelog.v12.item0",
      "changelog.v12.item1",
      "changelog.v12.item2",
      "changelog.v12.item3",
    ],
  },
  {
    version: "v1.1",
    tagline: "changelog.v11.tagline",
    items: [
      "changelog.v11.item0",
      "changelog.v11.item1",
      "changelog.v11.item2",
      "changelog.v11.item3",
    ],
  },
  {
    version: "v1.0",
    tagline: "changelog.v10.tagline",
    legacy: true,
    items: [
      "changelog.v10.item0",
      "changelog.v10.item1",
      "changelog.v10.item2",
    ],
  },
];

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type ChangelogModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function ChangelogModal({
  open,
  onClose,
}: ChangelogModalProps) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (open) {
      setMounted(true);
    }
  }, [open]);

  useEffect(() => {
    if (!mounted) {
      return undefined;
    }

    const previousActive = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => element.offsetParent !== null);

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActive?.focus();
    };
  }, [mounted]);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence onExitComplete={() => setMounted(false)}>
      {open ? (
        <motion.div
          key="changelog-modal"
          className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center sm:p-6"
          initial={false}
        >
          <motion.button
            type="button"
            aria-label={t("changelog.closeBackdrop")}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute inset-0 bg-black/80"
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 24, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.995 }}
            transition={{ type: "spring", stiffness: 320, damping: 34, mass: 0.9 }}
            className="relative flex h-[100dvh] w-full flex-col overflow-hidden border border-[#262626] bg-[#161616] shadow-[0_40px_140px_-40px_rgba(0,0,0,0.98)] sm:h-[min(88dvh,820px)] sm:max-w-3xl sm:rounded-2xl"
          >
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#262626] px-5 py-4 sm:px-7 sm:py-5">
              <div className="flex min-w-0 items-start gap-3">
                <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#262626] bg-[#0A0A0A] text-[#10B981] sm:flex">
                  <ScrollText size={18} strokeWidth={1.6} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#10B981]">
                    {t("changelog.eyebrow")}
                  </p>
                  <h2
                    id={titleId}
                    className="kael-display mt-1.5 text-xl font-semibold tracking-[-0.02em] text-[#F5F5F0]"
                  >
                    {t("changelog.title")}
                  </h2>
                  <p className="mt-1 hidden text-sm text-[#8E8E8A] sm:block">
                    {t("changelog.subtitle")}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className="hidden rounded-md border border-[#10B981]/30 bg-[#10B981]/10 px-2 py-1 text-[11px] font-medium tabular-nums text-[#10B981] sm:inline">
                  {KAEL_VERSION_LABEL}
                </span>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={onClose}
                  aria-label={t("changelog.close")}
                  className="rounded-lg border border-[#262626] p-2.5 text-[#8E8E8A] transition hover:border-[#3A3A3A] hover:bg-[#1C1C1C] hover:text-[#F5F5F0] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/40"
                >
                  <X size={18} strokeWidth={1.6} />
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-7 sm:py-6">
              <div className="mb-5 flex flex-wrap items-center gap-2.5 rounded-xl border border-[#262626] bg-[#0A0A0A] px-4 py-3">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[#10B981]"
                  aria-hidden="true"
                />
                <span className="text-sm text-[#F5F5F0]">
                  {t("changelog.summary", {
                    count: RELEASES.length,
                    version: KAEL_VERSION_LABEL,
                  })}
                </span>
              </div>

              <table className="w-full border-collapse text-left">
                <caption className="sr-only">{t("changelog.title")}</caption>
                <thead className="sticky top-0 z-10 bg-[#161616]">
                  <tr className="border-b border-[#262626]">
                    <th
                      scope="col"
                      className="w-[78px] pb-3 pr-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#8E8E8A] sm:w-28 sm:text-[11px]"
                    >
                      {t("changelog.versionColumn")}
                    </th>
                    <th
                      scope="col"
                      className="pb-3 text-[10px] font-medium uppercase tracking-[0.14em] text-[#8E8E8A] sm:text-[11px]"
                    >
                      {t("changelog.changesColumn")}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {RELEASES.map((release) => (
                    <tr
                      key={release.version}
                      className={`border-b border-[#262626] align-top last:border-0 ${
                        release.current ? "bg-[#10B981]/[0.04]" : ""
                      }`}
                    >
                      <th
                        scope="row"
                        className="py-4 pr-3 align-top sm:py-5"
                      >
                        <span
                          className={`kael-display block text-sm font-semibold tabular-nums sm:text-base ${
                            release.current
                              ? "text-[#10B981]"
                              : "text-[#F5F5F0]"
                          }`}
                        >
                          {release.version}
                        </span>

                        {release.current ? (
                          <span className="mt-1.5 inline-flex whitespace-nowrap rounded border border-[#10B981]/30 bg-[#10B981]/10 px-1.5 py-0.5 text-[10px] text-[#10B981]">
                            {t("changelog.current")}
                          </span>
                        ) : null}

                        {release.legacy ? (
                          <span className="mt-1.5 inline-flex whitespace-nowrap rounded border border-[#262626] bg-[#0A0A0A] px-1.5 py-0.5 text-[10px] text-[#8E8E8A]">
                            {t("changelog.legacy")}
                          </span>
                        ) : null}
                      </th>

                      <td className="py-4 sm:py-5">
                        <p
                          className={`text-sm font-medium ${
                            release.current
                              ? "text-[#34D399]"
                              : "text-[#F5F5F0]"
                          }`}
                        >
                          {t(release.tagline)}
                        </p>

                        <ul className="mt-2.5 space-y-1.5">
                          {release.items.map((item) => (
                            <li
                              key={item}
                              className="flex items-start gap-2 text-[13px] leading-5 text-[#8E8E8A]"
                            >
                              <span
                                className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#10B981]/70"
                                aria-hidden="true"
                              />
                              <span>{t(item)}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="mt-5 text-xs leading-5 text-[#8E8E8A]">
                {t("changelog.footer")}
              </p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
