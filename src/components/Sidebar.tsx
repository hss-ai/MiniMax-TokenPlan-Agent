"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Mic, Video, Image as ImageIcon, Music, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
      <aside className={`flex flex-col h-screen border-r border-white/80 dark:border-zinc-800 bg-white/75 dark:bg-zinc-900/75 backdrop-blur-xl transition-all ${collapsed ? "w-20" : "w-72"}`}>
        <div className={`p-4 mb-1 ${collapsed ? "space-y-2" : ""}`}>
          <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between gap-2"}`}>
            {!collapsed && (
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500 bg-clip-text text-transparent">
                MiniMax多模态工作台
              </h1>
            )}
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="h-8 w-8 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
          {!collapsed && (
            <div className="mt-2">
              <Badge>MiniMax多模态工作台</Badge>
            </div>
          )}
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
                className={`flex items-center px-3 py-3 rounded-xl transition-all border ${collapsed ? "justify-center" : "gap-3"} ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-700/60 shadow-sm font-medium"
                    : "text-gray-700 hover:bg-white/80 dark:text-gray-300 dark:hover:bg-zinc-800 border-transparent"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-blue-600 dark:text-blue-400" : ""}`} />
                {!collapsed && item.name}
              </Link>
            );
          })}
        </div>

      </aside>

      <div className={`fixed bottom-16 z-40 transition-all ${collapsed ? "left-2 w-16" : "left-4 w-64"}`}>
        <button
          onClick={() => setIsSettingsOpen(true)}
          title="设置"
          className={`group flex items-center w-full px-3 py-2.5 rounded-xl text-gray-700 bg-white/85 hover:bg-white dark:bg-zinc-900/90 dark:text-gray-300 dark:hover:bg-zinc-900 transition-colors border border-gray-200/80 dark:border-zinc-700 shadow-sm ${collapsed ? "justify-center" : "gap-3"}`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors group-hover:bg-sky-100 group-hover:text-sky-700 dark:bg-zinc-800 dark:text-zinc-300 dark:group-hover:bg-sky-900/40 dark:group-hover:text-sky-300">
            <Settings className="h-4 w-4" />
          </span>
          {!collapsed && <span className="text-sm font-medium">设置</span>}
        </button>
      </div>

      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </>
  );
}
