"use client";

import { Code2, FileSearch, MessageSquarePlus, PanelLeftClose, PanelLeftOpen, Sparkles, X } from "lucide-react";

export type SidebarSession = {
  id: string;
  title: string;
  updatedAt: number;
};

export type SidebarMode = "code" | "analysis" | "free";

type SidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  sessions: SidebarSession[];
  activeSessionId: string;
  mode: SidebarMode;
  onToggle: () => void;
  onMobileClose: () => void;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onModeChange: (mode: SidebarMode) => void;
};

const modes: Array<{ id: SidebarMode; label: string; icon: typeof Code2 }> = [
  { id: "code", label: "Код", icon: Code2 },
  { id: "analysis", label: "Анализ", icon: FileSearch },
  { id: "free", label: "Свободный режим", icon: Sparkles },
];

function formatSessionDate(timestamp: number): string {
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit" }).format(timestamp);
}

export default function Sidebar({
  collapsed,
  mobileOpen,
  sessions,
  activeSessionId,
  mode,
  onToggle,
  onMobileClose,
  onNewChat,
  onSelectSession,
  onModeChange,
}: SidebarProps) {
  return (
    <>
      {mobileOpen && <button type="button" aria-label="Закрыть меню" onClick={onMobileClose} className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md transition-all duration-200 lg:static lg:z-20 ${collapsed ? "w-[68px]" : "w-[260px]"} ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex h-20 items-center justify-between border-b border-white/[0.07] px-4">
          {!collapsed && <span className="kael-display text-xs tracking-[0.2em] text-zinc-200">WORKSPACE</span>}
          <button type="button" onClick={onToggle} aria-label={collapsed ? "Развернуть сайдбар" : "Свернуть сайдбар"} className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-100">
            {collapsed ? <PanelLeftOpen size={16} strokeWidth={1.5} /> : <PanelLeftClose size={16} strokeWidth={1.5} />}
          </button>
          <button type="button" onClick={onMobileClose} aria-label="Закрыть меню" className="rounded-lg p-2 text-zinc-500 hover:text-zinc-100 lg:hidden"><X size={16} strokeWidth={1.5} /></button>
        </div>

        <div className="p-3">
          <button type="button" onClick={onNewChat} className={`flex w-full items-center gap-3 rounded-lg border border-[#c1121f]/40 bg-[#c1121f]/10 px-3 py-2.5 text-left text-xs text-zinc-200 transition hover:border-[#c1121f] hover:bg-[#c1121f]/20 ${collapsed ? "justify-center px-0" : ""}`}>
            <MessageSquarePlus size={16} strokeWidth={1.5} />
            {!collapsed && <span>Новый чат</span>}
          </button>
        </div>

        {!collapsed && <>
          <div className="px-4 pb-2 kael-mono text-[9px] uppercase tracking-[0.18em] text-zinc-600">История</div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3">
            {sessions.length === 0 ? <p className="px-2 py-4 text-xs leading-5 text-zinc-600">Здесь появятся ваши сессии.</p> : sessions.map((session) => <button type="button" key={session.id} onClick={() => onSelectSession(session.id)} className={`mb-1 flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-xs transition ${session.id === activeSessionId ? "bg-white/[0.08] text-zinc-100" : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300"}`}><span className="truncate">{session.title}</span><span className="kael-mono shrink-0 text-[9px] text-zinc-700">{formatSessionDate(session.updatedAt)}</span></button>)}
          </div>

          <div className="border-t border-white/[0.07] p-3">
            <div className="mb-2 px-1 kael-mono text-[9px] uppercase tracking-[0.18em] text-zinc-600">Режим</div>
            {modes.map(({ id, label, icon: Icon }) => <button type="button" key={id} onClick={() => onModeChange(id)} className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs transition ${mode === id ? "bg-[#c1121f]/10 text-zinc-200" : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300"}`}><Icon size={14} strokeWidth={1.5} /><span>{label}</span>{mode === id && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#c1121f]" />}</button>)}
          </div>
        </>}

        <div className={`border-t border-white/[0.07] p-4 ${collapsed ? "flex justify-center" : ""}`}>
          {collapsed ? <span className="h-2 w-2 rounded-full bg-emerald-400" title="Система онлайн" /> : <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /><span className="kael-mono text-[9px] uppercase tracking-[0.15em] text-zinc-600">local workspace</span></div>}
        </div>
      </aside>
    </>
  );
}
