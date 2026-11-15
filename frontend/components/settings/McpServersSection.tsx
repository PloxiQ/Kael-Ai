"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  ChevronDown,
  Loader2,
  Plug,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Wrench,
} from "lucide-react";
import { useEffect, useId, useState, type FormEvent } from "react";
import { useI18n } from "../../lib/i18n";
import {
  checkMcpServer,
  connectMcpServer,
  createMcpServer,
  deleteMcpServer,
  fetchMcpServers,
  mcpHost,
  notifyMcpChanged,
  updateMcpServer,
  type McpAuthMode,
  type McpServerInfo,
  type McpServerStatus,
} from "../../lib/mcp";
import { playSfx } from "../../lib/sfx";
import type { TranslationKey } from "../../lib/translations";

const INPUT_CLASS =
  "h-10 w-full rounded-lg border border-[#262626] bg-[#161616] px-3 text-sm text-[#F5F5F0] outline-none transition placeholder:text-[#8E8E8A]/70 focus:border-[#10B981]/60 focus:ring-2 focus:ring-[#10B981]/20 disabled:cursor-not-allowed disabled:opacity-50";

const PRIMARY_BUTTON_CLASS =
  "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#10B981] px-4 text-sm font-semibold text-[#052E1C] transition hover:brightness-110 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/50 disabled:cursor-not-allowed disabled:bg-[#1C1C1C] disabled:text-zinc-600";

const SECONDARY_BUTTON_CLASS =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#262626] px-3 text-xs font-medium text-[#F5F5F0] transition hover:border-[#3A3A3A] hover:bg-[#1C1C1C] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/40 disabled:cursor-not-allowed disabled:opacity-50";

const STATUS_KEYS: Record<McpServerStatus, TranslationKey> = {
  new: "settings.mcp.status.new",
  connected: "settings.mcp.status.connected",
  auth_required: "settings.mcp.status.authRequired",
  error: "settings.mcp.status.error",
};

const STATUS_CLASSES: Record<McpServerStatus, string> = {
  new: "border-[#262626] bg-[#1C1C1C] text-[#8E8E8A]",
  connected: "border-[#10B981]/30 bg-[#10B981]/10 text-[#34D399]",
  auth_required: "border-amber-500/30 bg-amber-500/10 text-amber-200/90",
  error: "border-red-900/40 bg-red-950/20 text-red-300/90",
};

const AUTH_OPTIONS: ReadonlyArray<{
  id: McpAuthMode;
  labelKey: TranslationKey;
}> = [
  { id: "auto", labelKey: "settings.mcp.auth.auto" },
  { id: "none", labelKey: "settings.mcp.auth.none" },
  { id: "bearer", labelKey: "settings.mcp.auth.bearer" },
  { id: "oauth", labelKey: "settings.mcp.auth.oauth" },
];

function Toggle({
  checked,
  label,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        onChange(!checked);
        playSfx("toggle");
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/40 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked
          ? "border-[#10B981]/60 bg-[#10B981]/85"
          : "border-[#3A3A3A] bg-[#1C1C1C]"
      }`}
    >
      <span
        aria-hidden="true"
        className={`block h-4 w-4 rounded-full transition-transform ${
          checked
            ? "translate-x-[22px] bg-[#052E1C]"
            : "translate-x-1 bg-[#8E8E8A]"
        }`}
      />
    </button>
  );
}

function ToolList({ server }: { server: McpServerInfo }) {
  const { t } = useI18n();

  if (server.tools.length === 0) {
    return (
      <p className="mt-3 text-xs leading-5 text-[#8E8E8A]">
        {t("settings.mcp.noTools")}
      </p>
    );
  }

  return (
    <details className="group mt-3 rounded-lg border border-[#262626] bg-[#161616]">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-xs font-medium text-[#8E8E8A] transition hover:text-[#F5F5F0]">
        <Wrench size={14} strokeWidth={1.7} aria-hidden="true" />
        {t("settings.mcp.toolsTitle")}
        <span className="tabular-nums text-[#10B981]">
          {server.tools.length}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={1.7}
          aria-hidden="true"
          className="ml-auto transition group-open:rotate-180"
        />
      </summary>

      <ul className="divide-y divide-[#262626] border-t border-[#262626]">
        {server.tools.map((tool) => (
          <li key={tool.name} className="px-3 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <code className="break-all font-mono text-xs text-[#F5F5F0]">
                {tool.name}
              </code>
              <span
                className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                  tool.read_only
                    ? "border-[#10B981]/30 bg-[#10B981]/10 text-[#34D399]"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-200/90"
                }`}
              >
                {tool.read_only
                  ? t("settings.mcp.readOnly")
                  : t("settings.mcp.write")}
              </span>
            </div>
            {tool.description && (
              <p className="mt-1 text-xs leading-5 text-[#8E8E8A]">
                {tool.description}
              </p>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}

export default function McpServersSection() {
  const { t } = useI18n();
  const urlId = useId();
  const nameId = useId();
  const authId = useId();
  const tokenId = useId();

  const [servers, setServers] = useState<McpServerInfo[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [auth, setAuth] = useState<McpAuthMode>("auto");
  const [token, setToken] = useState("");
  const [formError, setFormError] = useState("");
  const [adding, setAdding] = useState(false);
  const [authLink, setAuthLink] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function reload() {
    setLoadError("");
    try {
      setServers(await fetchMcpServers());
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : t("settings.mcp.error"),
      );
    }
  }

  useEffect(() => {
    void reload();
    // The panel loads once per mount; actions below update the list locally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function replaceServer(updated: McpServerInfo) {
    setServers((current) =>
      (current ?? []).map((server) =>
        server.id === updated.id ? updated : server,
      ),
    );
  }

  function setRowErrorFor(id: string, message: string) {
    setRowError((current) => ({ ...current, [id]: message }));
  }

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (adding) {
      return;
    }

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setFormError(t("settings.mcp.urlRequired"));
      return;
    }

    setAdding(true);
    setFormError("");
    setAuthLink(null);

    try {
      const result = await createMcpServer({
        url: trimmedUrl,
        name: name.trim(),
        auth,
        ...(auth === "bearer" ? { token: token.trim() } : {}),
      });

      setServers((current) => [result.server, ...(current ?? [])]);
      setUrl("");
      setName("");
      setToken("");
      setAuth("auto");
      setAddOpen(false);
      setAuthLink(result.authorization_url);
      notifyMcpChanged();
      playSfx("success");
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : t("settings.mcp.error"),
      );
      playSfx("error");
    } finally {
      setAdding(false);
    }
  }

  async function runRowAction(
    server: McpServerInfo,
    action: () => Promise<McpServerInfo>,
  ) {
    if (busyId) {
      return;
    }

    setBusyId(server.id);
    setRowErrorFor(server.id, "");

    try {
      const updated = await action();
      replaceServer(updated);
      notifyMcpChanged();
    } catch (error) {
      setRowErrorFor(
        server.id,
        error instanceof Error ? error.message : t("settings.mcp.error"),
      );
      playSfx("error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleConnect(server: McpServerInfo) {
    if (busyId) {
      return;
    }

    setBusyId(server.id);
    setRowErrorFor(server.id, "");
    setAuthLink(null);

    try {
      const link = await connectMcpServer(server.id);
      setAuthLink(link);
      replaceServer({ ...server, status: "auth_required" });
      notifyMcpChanged();
    } catch (error) {
      setRowErrorFor(
        server.id,
        error instanceof Error ? error.message : t("settings.mcp.error"),
      );
      playSfx("error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(server: McpServerInfo) {
    if (busyId) {
      return;
    }

    setBusyId(server.id);

    try {
      await deleteMcpServer(server.id);
      setServers((current) =>
        (current ?? []).filter((item) => item.id !== server.id),
      );
      setConfirmDeleteId(null);
      notifyMcpChanged();
      playSfx("success");
    } catch (error) {
      setRowErrorFor(
        server.id,
        error instanceof Error ? error.message : t("settings.mcp.error"),
      );
      playSfx("error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#F5F5F0]">
            <Plug
              size={15}
              strokeWidth={1.7}
              className="text-[#34D399]"
              aria-hidden="true"
            />
            {t("settings.mcp.title")}
          </p>
          <p className="mt-1 max-w-lg text-xs leading-5 text-[#8E8E8A]">
            {t("settings.mcp.hint")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setAddOpen((current) => !current);
            setFormError("");
            playSfx("click");
          }}
          className={SECONDARY_BUTTON_CLASS}
          aria-expanded={addOpen}
        >
          <Plus size={14} strokeWidth={1.9} aria-hidden="true" />
          {t("settings.mcp.add")}
        </button>
      </div>

      {addOpen && (
        <form
          onSubmit={handleAdd}
          className="mt-3 rounded-xl border border-[#262626] bg-[#0A0A0A] p-4 sm:p-5"
        >
          <div>
            <label
              htmlFor={urlId}
              className="text-xs font-medium text-[#8E8E8A]"
            >
              {t("settings.mcp.url")}
            </label>
            <input
              id={urlId}
              type="url"
              required
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              maxLength={2048}
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder={t("settings.mcp.urlPlaceholder")}
              className={`${INPUT_CLASS} mt-2 font-mono text-xs`}
            />
            <p className="mt-1.5 text-[11px] leading-5 text-[#8E8E8A]">
              {t("settings.mcp.urlHint")}
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor={nameId}
                className="text-xs font-medium text-[#8E8E8A]"
              >
                {t("settings.mcp.name")}
              </label>
              <input
                id={nameId}
                type="text"
                maxLength={60}
                autoComplete="off"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t("settings.mcp.namePlaceholder")}
                className={`${INPUT_CLASS} mt-2`}
              />
            </div>

            <div>
              <label
                htmlFor={authId}
                className="text-xs font-medium text-[#8E8E8A]"
              >
                {t("settings.mcp.auth")}
              </label>
              <select
                id={authId}
                value={auth}
                onChange={(event) =>
                  setAuth(event.target.value as McpAuthMode)
                }
                className={`${INPUT_CLASS} mt-2`}
              >
                {AUTH_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {auth === "bearer" && (
            <div className="mt-4">
              <label
                htmlFor={tokenId}
                className="text-xs font-medium text-[#8E8E8A]"
              >
                {t("settings.mcp.token")}
              </label>
              <input
                id={tokenId}
                type="password"
                autoComplete="off"
                spellCheck={false}
                maxLength={4096}
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="eyJhbGciOi…"
                className={`${INPUT_CLASS} mt-2 font-mono text-xs`}
              />
              <p className="mt-1.5 text-[11px] leading-5 text-[#8E8E8A]">
                {t("settings.mcp.tokenHint")}
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={adding || (auth === "bearer" && !token.trim())}
              className={PRIMARY_BUTTON_CLASS}
            >
              {adding ? (
                <Loader2
                  size={15}
                  strokeWidth={1.9}
                  className="animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Plus size={15} strokeWidth={1.9} aria-hidden="true" />
              )}
              {adding ? t("settings.mcp.adding") : t("settings.mcp.connect")}
            </button>
            <span className="text-[11px] leading-5 text-[#8E8E8A]">
              {t("settings.mcp.urlMustBeHttps")}
            </span>
          </div>

          {formError && (
            <p role="alert" className="mt-3 text-xs leading-5 text-red-300/90">
              {formError}
            </p>
          )}
        </form>
      )}

      {authLink && (
        <div className="mt-3 rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 p-4">
          <p className="flex items-start gap-2 text-xs leading-5 text-[#34D399]">
            <ShieldCheck
              size={15}
              strokeWidth={1.8}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />
            {t("settings.mcp.oauthReady")}
          </p>
          <a
            href={authLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#F5F5F0] underline decoration-[#10B981]/50 underline-offset-4 transition hover:text-[#34D399]"
          >
            {t("settings.mcp.openAuth")}
            <ArrowUpRight size={15} strokeWidth={1.8} aria-hidden="true" />
          </a>
        </div>
      )}

      {loadError && (
        <p role="alert" className="mt-3 text-xs leading-5 text-red-300/90">
          {loadError}
        </p>
      )}

      <div className="mt-3">
        {servers === null && !loadError && (
          <div className="flex items-center gap-2 rounded-xl border border-[#262626] bg-[#0A0A0A] px-4 py-5 text-xs text-[#8E8E8A]">
            <Loader2
              size={15}
              strokeWidth={1.9}
              className="animate-spin"
              aria-hidden="true"
            />
            {t("settings.mcp.loading")}
          </div>
        )}

        {servers !== null && servers.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#262626] bg-[#0A0A0A] px-4 py-6 text-center">
            <p className="text-sm font-medium text-[#F5F5F0]">
              {t("settings.mcp.empty")}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[#8E8E8A]">
              {t("settings.mcp.emptyHint")}
            </p>
          </div>
        )}

        {servers !== null && servers.length > 0 && (
          <div className="divide-y divide-[#262626] overflow-hidden rounded-xl border border-[#262626] bg-[#0A0A0A]">
            {servers.map((server) => {
              const busy = busyId === server.id;
              const error = rowError[server.id];
              const confirming = confirmDeleteId === server.id;

              return (
                <div key={server.id} className="px-4 py-4 sm:px-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#F5F5F0]">
                        <span className="truncate">{server.name}</span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${STATUS_CLASSES[server.status]}`}
                        >
                          {server.status === "connected" ? (
                            <Check size={10} strokeWidth={2.4} aria-hidden="true" />
                          ) : server.status === "error" ? (
                            <AlertTriangle
                              size={10}
                              strokeWidth={2.2}
                              aria-hidden="true"
                            />
                          ) : null}
                          {t(STATUS_KEYS[server.status])}
                        </span>
                      </p>
                      <p className="mt-1 break-all font-mono text-[11px] leading-5 text-[#8E8E8A]">
                        {mcpHost(server.url)}
                        {server.protocol_version
                          ? ` · MCP ${server.protocol_version}`
                          : ""}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void runRowAction(server, () =>
                            checkMcpServer(server.id),
                          )
                        }
                        disabled={busy}
                        className={SECONDARY_BUTTON_CLASS}
                      >
                        <RefreshCw
                          size={13}
                          strokeWidth={1.8}
                          className={busy ? "animate-spin" : ""}
                          aria-hidden="true"
                        />
                        {t("settings.mcp.check")}
                      </button>

                      {server.status === "auth_required" &&
                        server.oauth_available && (
                          <button
                            type="button"
                            onClick={() => void handleConnect(server)}
                            disabled={busy}
                            className={SECONDARY_BUTTON_CLASS}
                          >
                            <ShieldCheck
                              size={13}
                              strokeWidth={1.8}
                              aria-hidden="true"
                            />
                            {t("settings.mcp.reconnect")}
                          </button>
                        )}

                      {confirming ? (
                        <span className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => void handleDelete(server)}
                            disabled={busy}
                            className="inline-flex h-9 items-center justify-center rounded-lg border border-red-900/50 bg-red-950/20 px-3 text-xs font-medium text-red-200 transition hover:border-red-800 hover:bg-red-950/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 disabled:opacity-50"
                          >
                            {t("settings.mcp.deleteYes")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className={SECONDARY_BUTTON_CLASS}
                          >
                            {t("settings.mcp.cancel")}
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmDeleteId(server.id);
                            playSfx("click");
                          }}
                          disabled={busy}
                          aria-label={`${t("settings.mcp.delete")} ${server.name}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#262626] text-[#8E8E8A] transition hover:border-red-900/60 hover:bg-red-950/20 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 disabled:opacity-50"
                        >
                          <Trash2 size={14} strokeWidth={1.8} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                    <label className="flex items-center gap-2 text-xs text-[#8E8E8A]">
                      <Toggle
                        checked={server.enabled}
                        label={t("settings.mcp.useInChat")}
                        disabled={busy}
                        onChange={(checked) => {
                          void runRowAction(server, () =>
                            updateMcpServer(server.id, { enabled: checked }),
                          );
                        }}
                      />
                      {t("settings.mcp.useInChat")}
                    </label>

                    <label className="flex items-center gap-2 text-xs text-[#8E8E8A]">
                      <Toggle
                        checked={server.allow_write}
                        label={t("settings.mcp.allowWrite")}
                        disabled={busy}
                        onChange={(checked) => {
                          void runRowAction(server, () =>
                            updateMcpServer(server.id, {
                              allow_write: checked,
                            }),
                          );
                        }}
                      />
                      {t("settings.mcp.allowWrite")}
                    </label>
                  </div>

                  {server.allow_write && (
                    <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-5 text-amber-200/90">
                      <AlertTriangle
                        size={13}
                        strokeWidth={1.8}
                        className="mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      {t("settings.mcp.allowWriteHint")}
                    </p>
                  )}

                  {server.last_error && (
                    <p className="mt-2 text-[11px] leading-5 text-red-300/90">
                      {t("settings.mcp.lastError", {
                        error: server.last_error,
                      })}
                    </p>
                  )}

                  {error && (
                    <p
                      role="alert"
                      className="mt-2 text-[11px] leading-5 text-red-300/90"
                    >
                      {error}
                    </p>
                  )}

                  <ToolList server={server} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="mt-3 text-[11px] leading-5 text-[#8E8E8A]/80">
        {t("settings.mcp.securityNote")}
      </p>
    </div>
  );
}
