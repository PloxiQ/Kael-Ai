"use client";

import { ArrowLeft, ArrowUpRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useI18n } from "../../lib/i18n";
import { LEGAL_CONTENT, type LegalDocumentId } from "../../lib/legal";
import LanguageSelector from "../LanguageSelector";
import LegalLinks from "./LegalLinks";

const DOCUMENTS: ReadonlyArray<{
  id: LegalDocumentId;
  href: string;
  label: "legal.privacy" | "legal.terms" | "legal.security";
}> = [
  { id: "privacy", href: "/privacy", label: "legal.privacy" },
  { id: "terms", href: "/terms", label: "legal.terms" },
  { id: "security", href: "/security", label: "legal.security" },
];

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

function ContactLine({ line }: { line: string }) {
  const parts = line.split(URL_PATTERN);

  return (
    <p className="mt-2 text-sm leading-7 text-[#8E8E8A]">
      {parts.map((part, index) =>
        part.startsWith("http://") || part.startsWith("https://") ? (
          <a
            key={`${part}-${index}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#34D399] underline decoration-[#10B981]/40 underline-offset-4 transition hover:text-[#10B981] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/40"
          >
            {part}
          </a>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </p>
  );
}

export default function LegalPage({ id }: { id: LegalDocumentId }) {
  const { language, t } = useI18n();
  const document = LEGAL_CONTENT[language][id];

  return (
    <div className="min-h-dvh bg-[#0A0A0A] text-[#F5F5F0]">
      <header className="sticky top-0 z-30 border-b border-[#262626] bg-[#0A0A0A]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
          <Link
            href="/"
            className="kael-display rounded-lg text-base font-semibold tracking-[0.2em] text-white transition hover:text-[#34D399] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/40"
          >
            KAEL
          </Link>

          <div className="flex items-center gap-2">
            <LanguageSelector />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#262626] bg-[#161616] px-2.5 py-1.5 text-xs font-medium text-[#8E8E8A] transition hover:border-[#10B981]/40 hover:text-[#F5F5F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/40"
            >
              <ArrowLeft size={14} strokeWidth={1.7} aria-hidden="true" />
              <span className="hidden sm:inline">{t("legal.back")}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 pb-20 pt-10 sm:pt-14">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-[#10B981]" aria-hidden="true" />
            <p className="kael-display text-xs font-medium uppercase tracking-[0.14em] text-[#10B981]">
              {document.eyebrow}
            </p>
          </div>

          <h1 className="kael-display mt-5 text-[clamp(1.9rem,3vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-[#F5F5F0]">
            {document.title}
          </h1>

          <p className="mt-3 text-xs tabular-nums text-[#8E8E8A]">
            {document.updated}
          </p>

          <p className="mt-5 text-sm leading-7 text-[#8E8E8A] sm:text-base sm:leading-8">
            {document.intro}
          </p>
        </div>

        <nav aria-label={t("legal.documentNav")} className="mt-8 flex flex-wrap gap-2">
          {DOCUMENTS.map((item) => {
            const active = item.id === id;

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/40 ${
                  active
                    ? "border-[#10B981]/60 bg-[#10B981]/10 text-[#34D399]"
                    : "border-[#262626] bg-[#161616] text-[#8E8E8A] hover:border-[#10B981]/40 hover:text-[#F5F5F0]"
                }`}
              >
                {active && (
                  <ShieldCheck size={13} strokeWidth={1.8} aria-hidden="true" />
                )}
                {t(item.label)}
              </Link>
            );
          })}
        </nav>

        <div className="mt-10 grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-14">
          <nav
            aria-label={t("legal.toc")}
            className="hidden lg:sticky lg:top-24 lg:block lg:self-start"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8E8E8A]">
              {t("legal.toc")}
            </p>
            <ol className="mt-3 space-y-1.5 border-l border-[#262626] pl-4">
              {document.sections.map((section, index) => (
                <li key={section.title}>
                  <a
                    href={`#section-${index + 1}`}
                    className="block text-xs leading-5 text-[#8E8E8A] transition hover:text-[#34D399] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/40"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <details className="rounded-xl border border-[#262626] bg-[#161616] px-4 py-3 lg:hidden">
            <summary className="cursor-pointer text-sm font-medium text-[#F5F5F0] marker:text-[#10B981]">
              {t("legal.toc")}
            </summary>
            <ol className="mt-3 space-y-2 border-l border-[#262626] pl-4">
              {document.sections.map((section, index) => (
                <li key={section.title}>
                  <a
                    href={`#section-${index + 1}`}
                    className="block text-xs leading-5 text-[#8E8E8A] transition hover:text-[#34D399]"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </details>

          <article className="min-w-0">
            <div className="space-y-9">
              {document.sections.map((section, index) => (
                <section
                  key={section.title}
                  id={`section-${index + 1}`}
                  className="scroll-mt-24"
                >
                  <h2 className="kael-display text-lg font-semibold leading-7 text-[#F5F5F0] sm:text-xl">
                    {section.title}
                  </h2>

                  {section.paragraphs?.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="mt-3 text-sm leading-7 text-[#8E8E8A]"
                    >
                      {paragraph}
                    </p>
                  ))}

                  {section.bullets && section.bullets.length > 0 && (
                    <ul className="mt-3 space-y-2.5">
                      {section.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="flex gap-3 text-sm leading-7 text-[#8E8E8A]"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#10B981]"
                          />
                          <span className="min-w-0">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-[#262626] bg-[#161616] p-5 sm:p-6">
              <h2 className="kael-display text-base font-semibold text-[#F5F5F0]">
                {document.contactTitle}
              </h2>
              {document.contact.map((line) => (
                <ContactLine key={line} line={line} />
              ))}
              <a
                href="https://t.me/SAM0S0B0Y"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#34D399] transition hover:text-[#10B981] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/40"
              >
                {t("legal.contactTelegram")}
                <ArrowUpRight size={14} strokeWidth={1.8} aria-hidden="true" />
              </a>
            </div>

            <p className="mt-6 rounded-xl border border-[#262626] bg-[#0A0A0A] p-4 text-xs leading-6 text-[#8E8E8A]">
              {document.disclaimer}
            </p>
          </article>
        </div>
      </main>

      <footer className="border-t border-[#262626]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-[#8E8E8A]">{t("legal.footer")}</p>
          <LegalLinks />
        </div>
      </footer>
    </div>
  );
}
