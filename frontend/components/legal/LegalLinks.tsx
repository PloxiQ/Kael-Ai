"use client";

import { useI18n } from "../../lib/i18n";

const LINKS = [
  { href: "/privacy", key: "legal.privacy" },
  { href: "/terms", key: "legal.terms" },
  { href: "/security", key: "legal.security" },
] as const;

export default function LegalLinks({ className = "" }: { className?: string }) {
  const { t } = useI18n();

  return (
    <nav
      aria-label={t("legal.nav")}
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${className}`}
    >
      {LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="text-xs text-[#8E8E8A] underline decoration-transparent underline-offset-4 transition hover:text-[#34D399] hover:decoration-[#10B981]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/40"
        >
          {t(link.key)}
        </a>
      ))}
    </nav>
  );
}
