"use client";

import {
  AlertTriangle,
  Check,
  ChevronDown,
  Loader2,
  ShieldAlert,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../../lib/i18n";
import type { McpToolRequest } from "../../lib/mcp";

function formatArguments(value: Record<string, unknown>): string {
  try {
    const text = JSON.stringify(value, null, 2);
    return text.length > 2_400 ? `${text.slice(0, 2_400)}\n…` : text;
  } catch {
    return "{}";
  }
}

export default function McpApprovalPanel({
  requests,
  busy,
  error,
  onResolve,
}: {
  requests: McpToolRequest[];
  busy: boolean;
  error?: string | null;
  onResolve: (decisions: Record<string, boolean>) => void;
}) {
  const { t } = useI18n();
  const signature = requests.map((request) => request.call_id).join("|");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  // Only calls that actually wait for a decision get a checkbox. Read-only and
  // allow_write servers run automatically, and a decision for them is ignored
  // by the backend, so offering one would be a false affordance.
  const actionable = useMemo(
    () => requests.filter((request) => request.requires_approval),
    [requests],
  );

  useEffect(() => {
    setSelected(
      Object.fromEntries(
        requests
          .filter((request) => request.requires_approval)
          .map((request) => [request.call_id, false]),
      ),
    );
    // Reset only when a new approval batch arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const approvedCount = useMemo(
    () => actionable.filter((request) => selected[request.call_id]).length,
    [actionable, selected],
  );

  function resolveAll(value: boolean) {
    onResolve(
      Object.fromEntries(
        actionable.map((request) => [request.call_id, value]),
      ),
    );
  }

  return (
    <section
      aria-label={t("chat.mcp.approvalTitle")}
      className="w-full overflow-hidden rounded-2xl border border-amber-500/25 bg-[#161616]"
    >
      <div className="border-b border-[#262626] px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200/90">
            <ShieldAlert size={17} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[#F5F5F0]">
              {t("chat.mcp.approvalTitle")}
            </h3>
            <p className="mt-1 text-xs leading-5 text-[#8E8E8A]">
              {t("chat.mcp.approvalHint")}
            </p>
          </div>
        </div>
      </div>

      <ul className="divide-y divide-[#262626]">
        {requests.map((request) => {
          const checked = Boolean(selected[request.call_id]);

          return (
            <li key={request.call_id} className="px-4 py-3.5 sm:px-5">
              <div className="flex items-start gap-3">
                {request.requires_approval ? (
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    aria-label={`${t("chat.mcp.approve")} ${request.title || request.tool}`}
                    disabled={busy}
                    onClick={() =>
                      setSelected((current) => ({
                        ...current,
                        [request.call_id]: !current[request.call_id],
                      }))
                    }
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/40 disabled:opacity-50 ${
                      checked
                        ? "border-[#10B981] bg-[#10B981] text-[#052E1C]"
                        : "border-[#3A3A3A] bg-[#0A0A0A] text-transparent hover:border-[#10B981]/60"
                    }`}
                  >
                    <Check size={13} strokeWidth={2.6} aria-hidden="true" />
                  </button>
                ) : (
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[#262626] bg-[#1C1C1C] text-[#8E8E8A]"
                  >
                    <Check size={13} strokeWidth={2.6} />
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-sm font-medium text-[#F5F5F0]">
                      {request.title || request.tool}
                    </span>
                    <span className="text-[11px] text-[#8E8E8A]">
                      {request.server_name}
                    </span>
                    {!request.requires_approval && (
                      <span className="rounded border border-[#262626] bg-[#1C1C1C] px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[#8E8E8A]">
                        {t("chat.mcp.auto")}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 break-all font-mono text-[11px] text-[#8E8E8A]">
                    {request.tool}
                  </p>
                  {request.description && (
                    <p className="mt-1.5 text-xs leading-5 text-[#8E8E8A]">
                      {request.description}
                    </p>
                  )}

                  <details className="group mt-2">
                    <summary className="flex w-fit cursor-pointer list-none items-center gap-1 text-[11px] font-medium text-[#8E8E8A] transition hover:text-[#F5F5F0]">
                      {t("chat.mcp.arguments")}
                      <ChevronDown
                        size={12}
                        strokeWidth={1.8}
                        aria-hidden="true"
                        className="transition group-open:rotate-180"
                      />
                    </summary>
                    <pre className="kael-no-scrollbar mt-2 max-h-56 overflow-auto rounded-lg border border-[#262626] bg-[#0A0A0A] p-3 font-mono text-[11px] leading-5 text-zinc-300">
                      {formatArguments(request.arguments)}
                    </pre>
                  </details>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 border-t border-[#262626] px-4 py-3 text-xs leading-5 text-red-300/90 sm:px-5"
        >
          <AlertTriangle
            size={14}
            strokeWidth={1.8}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 border-t border-[#262626] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <button
          type="button"
          disabled={busy || actionable.length === 0}
          onClick={() => resolveAll(false)}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#262626] px-3 text-xs font-medium text-[#8E8E8A] transition hover:border-red-900/60 hover:bg-red-950/20 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 disabled:opacity-50"
        >
          <X size={13} strokeWidth={2} aria-hidden="true" />
          {t("chat.mcp.denyAll")}
        </button>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            disabled={busy || actionable.length === 0}
            onClick={() => resolveAll(true)}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-[#262626] px-3 text-xs font-medium text-[#F5F5F0] transition hover:border-[#3A3A3A] hover:bg-[#1C1C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/40 disabled:opacity-50"
          >
            {t("chat.mcp.selectAll")}
          </button>

          <button
            type="button"
            disabled={busy || approvedCount === 0}
            onClick={() => onResolve(selected)}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#10B981] px-4 text-xs font-semibold text-[#052E1C] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/50 disabled:cursor-not-allowed disabled:bg-[#1C1C1C] disabled:text-zinc-600"
          >
            {busy ? (
              <Loader2
                size={14}
                strokeWidth={2}
                className="animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Check size={14} strokeWidth={2.2} aria-hidden="true" />
            )}
            {busy
              ? t("chat.mcp.approvalSending")
              : t("chat.mcp.approveSelected", { count: approvedCount })}
          </button>
        </div>
      </div>
    </section>
  );
}
