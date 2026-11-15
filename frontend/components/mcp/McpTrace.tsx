"use client";

import { AlertTriangle, Check, MinusCircle, Wrench } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import type { McpTraceEntry } from "../../lib/mcp";

const STATUS_META = {
  ok: {
    icon: Check,
    className: "border-[#10B981]/30 bg-[#10B981]/10 text-[#34D399]",
    key: "chat.mcp.trace.ok",
  },
  error: {
    icon: AlertTriangle,
    className: "border-red-900/40 bg-red-950/20 text-red-300/90",
    key: "chat.mcp.trace.error",
  },
  denied: {
    icon: MinusCircle,
    className: "border-[#262626] bg-[#1C1C1C] text-[#8E8E8A]",
    key: "chat.mcp.trace.denied",
  },
} as const;

export default function McpTrace({ entries }: { entries: McpTraceEntry[] }) {
  const { t } = useI18n();

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#8E8E8A]">
        <Wrench size={12} strokeWidth={1.8} aria-hidden="true" />
        {t("chat.mcp.trace")}
      </span>

      {entries.map((entry, index) => {
        const meta = STATUS_META[entry.status];
        const Icon = meta.icon;
        const title = entry.error
          ? `${entry.server_name} · ${entry.tool} · ${entry.error}`
          : `${entry.server_name} · ${entry.tool} · ${t(meta.key)} · ${entry.duration_ms} ms`;

        return (
          <span
            key={`${entry.server_id}-${entry.tool}-${index}`}
            title={title}
            className={`inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium ${meta.className}`}
          >
            <Icon size={11} strokeWidth={2.2} aria-hidden="true" />
            <span className="max-w-[12rem] truncate">{entry.tool}</span>
            <span className="sr-only">{t(meta.key)}</span>
          </span>
        );
      })}
    </div>
  );
}
