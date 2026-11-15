"use client";

import {
  ChevronRight,
  Crown,
  History,
  MessageSquarePlus,
  PanelLeftClose,
  PanelLeftOpen,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "../lib/i18n";
import {
  formatNumber,
  getTier,
  isUnlimitedTier,
  remainingTokens,
  usagePercent,
  type UsageState,
} from "../lib/tiers";
import { TIER_TRANSLATION_KEYS } from "../lib/translations";

export type SidebarSession = {
  id: string;
  title: string;
  updatedAt: number;
};

type SidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  sessions: SidebarSession[];
  activeSessionId: string;
  isOnline: boolean;
  busy: boolean;
  usage: UsageState;
  onToggle: () => void;
  onMobileClose: () => void;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onOpenTiers: () => void;
};

function formatSessionDate(timestamp: number, locale: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  return new Intl.DateTimeFormat(
    locale,
    sameDay
      ? { hour: "2-digit", minute: "2-digit" }
      : { day: "2-digit", month: "2-digit" },
  ).format(date);
}

const SPRING = { type: "spring", stiffness: 300, damping: 33, mass: 0.9 } as const;

export default function Sidebar({
  collapsed,
  mobileOpen,
  sessions,
  activeSessionId,
  isOnline,
  busy,
  usage,
  onToggle,
  onMobileClose,
  onNewChat,
  onSelectSession,
  onOpenTiers,
}: SidebarProps) {
  const tier = getTier(usage.tierId);
  const unlimited = isUnlimitedTier(tier);
  const percent = usagePercent(usage);
  const remaining = remainingTokens(usage);
  const { locale, t } = useI18n();
  const tierName = t(TIER_TRANSLATION_KEYS[tier.id].name);

  const renderPanel = (isCollapsed: boolean) => (
    <>
      <div
        className={`flex h-16 shrink-0 items-center border-b border-[#262626] sm:h-[72px] ${
          isCollapsed ? "justify-center px-2" : "justify-between px-5"
        }`}
      >
        {!isCollapsed && (
          <span className="kael-display text-sm font-medium uppercase tracking-[0.12em] text-zinc-400">
            {t("sidebar.history")}
          </span>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-label={
            isCollapsed ? t("sidebar.expand") : t("sidebar.collapse")
          }
          className="hidden rounded-lg p-2.5 text-zinc-500 transition hover:bg-[#1C1C1C] hover:text-zinc-100 lg:inline-flex"
        >
          {isCollapsed ? (
            <PanelLeftOpen size={18} strokeWidth={1.5} />
          ) : (
            <PanelLeftClose size={18} strokeWidth={1.5} />
          )}
        </button>
        <button
          type="button"
          onClick={onMobileClose}
          aria-label={t("sidebar.closeMenu")}
          className="rounded-lg p-2.5 text-zinc-500 transition hover:bg-[#1C1C1C] hover:text-zinc-100 lg:hidden"
        >
          <X size={18} strokeWidth={1.5} />
        </button>
      </div>

      <div className={isCollapsed ? "px-3 pt-4" : "px-4 pt-4"}>
        <button
          type="button"
          onClick={onNewChat}
          disabled={busy}
          data-tour="new-chat"
          title={busy ? t("sidebar.wait") : t("sidebar.newChat")}
          className={`group flex w-full items-center gap-3 rounded-xl bg-[#10B981] px-4 py-3 text-sm font-semibold text-[#052E1C] shadow-none transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45 ${
            isCollapsed ? "justify-center px-0" : ""
          }`}
        >
          <MessageSquarePlus size={18} strokeWidth={1.8} />
          {!isCollapsed && <span>{t("sidebar.newChat")}</span>}
        </button>
      </div>

      {isCollapsed ? (
        <div className="mt-5 flex flex-1 flex-col items-center">
          <span
            className="rounded-lg p-2.5 text-zinc-600"
            title={t("sidebar.historyAria")}
          >
            <History size={18} strokeWidth={1.5} />
          </span>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-5 pb-3 pt-6">
            <span className="kael-display text-sm uppercase tracking-[0.1em] text-zinc-500">
              {t("sidebar.dialogs")}
            </span>
            <span className="text-sm tabular-nums text-zinc-600">
              {sessions.length.toString().padStart(2, "0")}
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
            {sessions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#262626] px-4 py-5">
                <p className="text-sm leading-6 text-zinc-500">
                  {t("sidebar.empty")}
                </p>
              </div>
            ) : (
              <nav aria-label={t("sidebar.historyAria")} className="space-y-1">
                {sessions.map((session) => {
                  const active = session.id === activeSessionId;

                  return (
                    <button
                      type="button"
                      key={session.id}
                      onClick={() => onSelectSession(session.id)}
                      disabled={busy}
                      aria-current={active ? "true" : undefined}
                      className={`relative flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        active
                          ? "bg-[#1C1C1C] text-zinc-100"
                          : "text-zinc-500 hover:bg-[#1C1C1C] hover:text-zinc-300"
                      }`}
                    >
                      {active && (
                        <span className="absolute inset-y-2.5 left-0 w-0.5 rounded-full bg-[#10B981]" />
                      )}
                      <span className="min-w-0 truncate text-sm">
                        {session.title}
                      </span>
                      <span className="shrink-0 text-sm tabular-nums text-zinc-600">
                        {formatSessionDate(session.updatedAt, locale)}
                      </span>
                    </button>
                  );
                })}
              </nav>
            )}
          </div>
        </>
      )}

      <div
        className={`shrink-0 ${isCollapsed ? "px-3 pb-3" : "px-4 pb-3"}`}
      >
        {isCollapsed ? (
          <button
            type="button"
            onClick={onOpenTiers}
            title={
              unlimited
                ? t("sidebar.tierTitleUnlimited", { tier: tierName })
                : t("sidebar.tierTitle", {
                    tier: tierName,
                    count: formatNumber(remaining, locale),
                  })
            }
            aria-label={t("sidebar.tierAria")}
            className="flex w-full items-center justify-center rounded-xl border border-[#262626] p-2.5 text-[#34D399] transition hover:border-[#10B981]/35 hover:bg-[#1C1C1C]"
          >
            <Crown size={18} strokeWidth={1.6} />
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenTiers}
            aria-label={t("sidebar.tierAriaName", { tier: tierName })}
            className="group w-full rounded-xl border border-[#262626] bg-[#161616]/70 p-3.5 text-left backdrop-blur-xl transition hover:border-[#10B981]/30 hover:bg-[#1C1C1C]"
          >
            <div className="flex items-center gap-2.5">
              <Crown
                size={16}
                strokeWidth={1.6}
                className="shrink-0 text-[#34D399]"
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-200">
                {tierName}
              </span>
              <ChevronRight
                size={15}
                strokeWidth={1.6}
                className="shrink-0 text-zinc-600 transition group-hover:text-zinc-300"
              />
            </div>

            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#1C1C1C]">
              <motion.div
                initial={false}
                animate={{
                  width: unlimited ? "100%" : `${Math.max(percent, 2)}%`,
                }}
                transition={{ type: "spring", stiffness: 90, damping: 22 }}
                className={`h-full rounded-full bg-[#10B981] ${
                  unlimited ? "kael-pulse" : ""
                }`}
              />
            </div>

            <p className="mt-2 text-sm text-zinc-500">
              {unlimited
                ? t("sidebar.unlimited")
                : t("sidebar.tokensLeft", {
                    count: formatNumber(remaining, locale),
                  })}
            </p>
          </button>
        )}
      </div>

      <div
        className={`shrink-0 border-t border-[#262626] ${
          isCollapsed ? "flex justify-center p-5" : "px-5 py-4"
        }`}
      >
        {isCollapsed ? (
          <span
            title={isOnline ? t("sidebar.apiOnline") : t("sidebar.apiOffline")}
            className={`h-2 w-2 rounded-full ${
              isOnline ? "kael-pulse bg-[#10B981]" : "bg-zinc-700"
            }`}
          />
        ) : (
          <div className="flex items-center gap-2.5">
            {isOnline ? (
              <Wifi size={15} strokeWidth={1.5} className="text-[#34D399]" />
            ) : (
              <WifiOff size={15} strokeWidth={1.5} className="text-zinc-600" />
            )}
            <span
              className={`text-sm ${
                isOnline ? "text-zinc-400" : "text-zinc-600"
              }`}
            >
              {isOnline ? t("sidebar.apiOnline") : t("sidebar.apiOffline")}
            </span>
            <span
              className={`ml-auto h-1.5 w-1.5 rounded-full ${
                isOnline ? "kael-pulse bg-[#10B981]" : "bg-zinc-700"
              }`}
            />
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            key="sidebar-backdrop"
            type="button"
            aria-label={t("sidebar.closeMenu")}
            onClick={onMobileClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            key="sidebar-mobile"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={SPRING}
            className="fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r border-[#262626] bg-[#161616]/90 backdrop-blur-2xl will-change-transform lg:hidden"
          >
            {renderPanel(false)}
          </motion.aside>
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 76 : 280 }}
        transition={SPRING}
        className="relative z-10 hidden h-full shrink-0 flex-col overflow-hidden border-r border-[#262626] bg-[#161616]/85 backdrop-blur-2xl will-change-[width] lg:flex"
      >
        {renderPanel(collapsed)}
      </motion.aside>
    </>
  );
}
