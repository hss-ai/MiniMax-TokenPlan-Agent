"use client";

import { useMemo, useState } from "react";
import { PromptScope, usePromptStore } from "@/store/usePromptStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type PromptQuickAccessProps = {
  scope: PromptScope;
  value: string;
  onUsePrompt: (value: string) => void;
};

export default function PromptQuickAccess({ scope, value, onUsePrompt }: PromptQuickAccessProps) {
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

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Select
          value={selectedTheme}
          onChange={(e) => {
            setSelectedTheme(e.currentTarget.value);
            setSelectedId("");
          }}
          className="w-40"
        >
          <option value="">全部主题</option>
          {themeOptions.map((theme) => (
            <option key={theme} value={theme}>
              {theme}
            </option>
          ))}
        </Select>
        <Select
          value={selectedId}
          onChange={(e) => {
            const id = e.currentTarget.value;
            setSelectedId(id);
            const found = detailOptions.find((item) => item.id === id);
            if (found) {
              onUsePrompt(found.detail || found.text || "");
            }
          }}
        >
          <option value="">选择详细提示词</option>
          {detailOptions.map((item) => {
            const detail = item.detail || item.text || "";
            return (
            <option key={item.id} value={item.id}>
              {detail.length > 48 ? `${detail.slice(0, 48)}...` : detail}
            </option>
            );
          })}
        </Select>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (!value.trim()) {
              return;
            }
            addPrompt(scope, value, selectedTheme || "默认主题");
          }}
        >
          收藏当前
        </Button>
      </div>
      {scopedPrompts.length === 0 && (
        <Input value="暂无提示词，可在设置中按主题维护详细提示词" readOnly className="h-8 text-xs text-slate-500" />
      )}
    </div>
  );
}
