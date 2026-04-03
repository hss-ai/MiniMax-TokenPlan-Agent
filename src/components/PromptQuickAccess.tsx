"use client";

import { useMemo, useState } from "react";
import { PromptScope, usePromptStore } from "@/store/usePromptStore";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type PromptQuickAccessProps = {
  scope: PromptScope;
  value: string;
  onUsePrompt: (value: string) => void;
  onAppendPrompt?: (value: string) => void;
};

export default function PromptQuickAccess({ scope, value, onUsePrompt, onAppendPrompt }: PromptQuickAccessProps) {
  const { prompts, addPrompt } = usePromptStore();
  const [selectedTheme, setSelectedTheme] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const scopedPrompts = useMemo(
    () => prompts.filter((item) => item.scope === scope).sort((a, b) => b.createdAt - a.createdAt),
    [prompts, scope]
  );
  const themeOptions = useMemo(() => {
    const themes = scopedPrompts.map((item) => item.theme || "默认主题");
    return Array.from(new Set(themes));
  }, [scopedPrompts]);
  const detailOptions = useMemo(() => {
    if (!selectedTheme) {
      return scopedPrompts;
    }
    return scopedPrompts.filter((item) => (item.theme || "默认主题") === selectedTheme);
  }, [scopedPrompts, selectedTheme]);
  const selectedPrompt = useMemo(
    () => detailOptions.find((item) => item.id === selectedId) || null,
    [detailOptions, selectedId]
  );
  const selectedPromptText = selectedPrompt?.detail || selectedPrompt?.text || "";
  const totalCount = scopedPrompts.length;
  const visibleCount = detailOptions.length;

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/75 p-3 dark:border-zinc-800 dark:bg-zinc-900/70">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-medium text-slate-900 dark:text-zinc-100">提示词快捷库</div>
          <div className="text-xs text-slate-500 dark:text-zinc-400">
            当前模块已收藏 {totalCount} 条，当前筛选显示 {visibleCount} 条
          </div>
        </div>
        <div className="text-xs text-slate-500 dark:text-zinc-400">
          {selectedPrompt ? `主题：${selectedPrompt.theme || "默认主题"}` : "选择常用提示词后可替换或追加到当前输入"}
        </div>
      </div>
      <div className="flex flex-col gap-2 xl:flex-row">
        <Select
          value={selectedTheme}
          onChange={(e) => {
            setSelectedTheme(e.currentTarget.value);
            setSelectedId("");
          }}
          className="xl:w-44"
        >
          <option value="">全部主题</option>
          {themeOptions.map((theme) => (
            <option key={theme} value={theme}>
              {theme}
            </option>
          ))}
        </Select>
        <Select value={selectedId} onChange={(e) => setSelectedId(e.currentTarget.value)} className="flex-1">
          <option value="">选择详细提示词</option>
          {detailOptions.map((item) => {
            const detail = item.detail || item.text || "";
            return (
              <option key={item.id} value={item.id}>
                {detail.length > 64 ? `${detail.slice(0, 64)}...` : detail}
              </option>
            );
          })}
        </Select>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => selectedPromptText && onUsePrompt(selectedPromptText)}
            disabled={!selectedPromptText}
          >
            替换输入
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (!selectedPromptText) {
                return;
              }
              if (onAppendPrompt) {
                onAppendPrompt(selectedPromptText);
                return;
              }
              onUsePrompt(selectedPromptText);
            }}
            disabled={!selectedPromptText}
          >
            追加插入
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (!value.trim()) {
                return;
              }
              addPrompt(scope, value, selectedTheme || "默认主题");
            }}
            disabled={!value.trim()}
          >
            收藏当前
          </Button>
        </div>
      </div>
      {selectedPromptText && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/80 px-3 py-2 text-sm leading-6 text-slate-700 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-300">
          {selectedPromptText}
        </div>
      )}
      {scopedPrompts.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500 dark:border-zinc-700 dark:text-zinc-400">
          暂无提示词，可在设置中心按主题维护，也可直接收藏当前输入
        </div>
      )}
    </div>
  );
}
