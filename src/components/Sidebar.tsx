"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Mic, Video, Image as ImageIcon, Music, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import SettingsModal from "./SettingsModal";

const navItems = [
  { name: "文本对话", href: "/", icon: MessageSquare },
  { name: "语音生成", href: "/voice", icon: Mic },
  { name: "视频生成", href: "/video", icon: Video },
  { name: "图片生成", href: "/image", icon: ImageIcon },
  { name: "音乐生成", href: "/music", icon: Music },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <aside className={`flex flex-col h-screen border-r border-[var(--border-soft)] bg-white/90 dark:border-zinc-800 dark:bg-zinc-950/85 backdrop-blur-xl transition-all ${collapsed ? "w-16" : "w-52"}`}>
        <div className={`p-4 mb-2 ${collapsed ? "space-y-2" : "space-y-3"}`}>
          <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
            {!collapsed && (
              <div className="font-display text-lg font-semibold text-slate-800 dark:text-zinc-100 tracking-tight">
                MiniMax
              </div>
            )}
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="h-8 w-8 rounded-full border border-[var(--border)] bg-white text-[#45515e] hover:bg-black/[0.03] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex-1 px-3 py-2 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={`flex items-center px-3 py-2.5 text-[13px] rounded-full transition-all border ${collapsed ? "justify-center" : "gap-3"} ${
                  isActive
                    ? "bg-black/[0.05] text-[#18181b] border-[var(--border)] shadow-[0_0_15px_rgba(44,30,116,0.16)] dark:bg-blue-500/20 dark:text-blue-100 dark:border-blue-700/60 font-medium"
                    : "text-[#45515e] hover:bg-black/[0.03] dark:text-zinc-300 dark:hover:bg-zinc-800 border-transparent"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-[#1456f0] dark:text-blue-300" : ""}`} />
                {!collapsed && item.name}
              </Link>
            );
          })}
        </div>

      </aside>

      <div className={`fixed bottom-20 z-20 transition-all ${collapsed ? "left-1.5 w-[3.25rem]" : "left-4 w-[11rem]"}`}>
        <button
          onClick={() => setIsSettingsOpen(true)}
          title="设置"
          className={`group flex items-center w-full px-3 py-2.5 rounded-2xl text-[#45515e] bg-white/95 hover:bg-black/[0.03] dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors border border-[var(--border)] dark:border-zinc-700 shadow-sm ${collapsed ? "justify-center" : "gap-3"}`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors group-hover:bg-blue-100 group-hover:text-blue-700 dark:bg-zinc-800 dark:text-zinc-300 dark:group-hover:bg-blue-900/40 dark:group-hover:text-blue-300">
            <Settings className="h-4 w-4" />
          </span>
          {!collapsed && <span className="text-sm font-medium">设置</span>}
        </button>
      </div>

      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </>
  );
}
