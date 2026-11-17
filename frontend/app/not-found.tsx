"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import LanguageSelector from "../components/LanguageSelector";
import LegalLinks from "../components/legal/LegalLinks";
import { useI18n } from "../lib/i18n";

export default function NotFound() {
  const { language, t } = useI18n();

  useEffect(() => {
    document.title = `${t("notFound.title")} — KAEL`;
    document.documentElement.lang = language;
  }, [language, t]);

  return (
    <div className="flex min-h-dvh flex-col bg-[#0A0A0A] text-[#F5F5F0]">
      <header className="border-b border-[#262626]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
          <Link
            href="/"
            className="kael-display rounded-lg text-base font-semibold tracking-[0.2em] text-white transition hover:text-[#34D399] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/40"
          >
            KAEL
          </Link>
          <LanguageSelector />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-5 py-16">
        <div className="max-w-xl">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-[#10B981]" aria-hidden="true" />
            <p className="kael-display text-xs font-medium uppercase tracking-[0.14em] text-[#10B981]">
              {t("notFound.eyebrow")}
            </p>
          </div>

          <h1 className="kael-display mt-5 text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-[#F5F5F0]">
            {t("notFound.title")}
          </h1>

          <p className="mt-4 text-sm leading-7 text-[#8E8E8A] sm:text-base sm:leading-8">
            {t("notFound.description")}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-[#10B981] px-4 py-2.5 text-sm font-semibold text-[#052E1C] transition hover:bg-[#34D399] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/40"
            >
              <ArrowLeft size={15} strokeWidth={2} aria-hidden="true" />
              {t("notFound.back")}
            </Link>
          </div>
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
