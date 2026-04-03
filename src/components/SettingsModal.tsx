"use client";

import { useState } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { PromptScope, usePromptStore } from "@/store/usePromptStore";
import { useSkillsStore } from "@/store/useSkillsStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { apiKey, rememberApiKey, themeMode, setApiKey, setRememberApiKey, setThemeMode, clearApiKey } = useSettingsStore();
  const { prompts, addPrompt, removePrompt } = usePromptStore();
  const {
    repositories,
    skills,
    addRepository,
    removeRepository,
    addSkill,
    removeSkill,
    setSkillApplied,
  } = useSkillsStore();
  const [activeMenu, setActiveMenu] = useState<"system" | "prompt" | "skills">("system");
  const [localKey, setLocalKey] = useState(apiKey);
  const [rememberLocal, setRememberLocal] = useState(rememberApiKey);
  const [themeLocal, setThemeLocal] = useState(themeMode);
  const [promptScope, setPromptScope] = useState<PromptScope>("chat");
  const [promptTheme, setPromptTheme] = useState("");
  const [promptDetail, setPromptDetail] = useState("");
  const [repoName, setRepoName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [skillName, setSkillName] = useState("");
  const [skillCommand, setSkillCommand] = useState("");
  const [skillRepoId, setSkillRepoId] = useState("");

  const handleSave = () => {
    setRememberApiKey(rememberLocal);
    setThemeMode(themeLocal);
    setApiKey(localKey);
    onClose();
  };

  const handleClear = () => {
    setLocalKey("");
    setRememberLocal(false);
    setRememberApiKey(false);
    clearApiKey();
  };

  const scopeLabelMap: Record<PromptScope, string> = {
    chat: "文本对话",
    voice: "语音生成",
    video: "视频生成",
    image: "图片生成",
    music: "音乐生成",
  };
  const scopedPrompts = prompts
    .filter((item) => item.scope === promptScope)
    .sort((a, b) => b.createdAt - a.createdAt);
  const scopedSkills = skills
    .filter((item) => !skillRepoId || item.repoId === skillRepoId)
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto max-w-5xl">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
          <DialogDescription>支持系统设置、提示词管理与 Skills 能力管理。</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 p-2 space-y-1 h-fit">
            <button
              type="button"
              onClick={() => setActiveMenu("system")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeMenu === "system"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                  : "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
              }`}
            >
              系统设置
            </button>
            <button
              type="button"
              onClick={() => setActiveMenu("prompt")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeMenu === "prompt"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                  : "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
              }`}
            >
              提示词管理
            </button>
            <button
              type="button"
              onClick={() => setActiveMenu("skills")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeMenu === "skills"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                  : "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
              }`}
            >
              Skills 管理
            </button>
          </div>

          <div className="space-y-5">
            {activeMenu === "system" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="theme-mode">主题模式</Label>
                  <Select id="theme-mode" value={themeLocal} onChange={(e) => setThemeLocal(e.currentTarget.value as "system" | "light" | "dark")}>
                    <option value="system">跟随系统</option>
                    <option value="light">浅色模式</option>
                    <option value="dark">深色模式</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api-key">MiniMax API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    value={localKey}
                    onChange={(e) => setLocalKey(e.currentTarget.value)}
                    placeholder="请输入您的 API Key"
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/70">
                  <Label htmlFor="remember-key" className="text-sm">记住 API Key（便携版建议开启）</Label>
                  <Switch
                    id="remember-key"
                    checked={rememberLocal}
                    onCheckedChange={(checked) => setRememberLocal(checked)}
                  />
                </div>
              </div>
            )}

            {activeMenu === "prompt" && (
              <div className="space-y-3 rounded-xl border border-slate-200 p-3 dark:border-zinc-800">
                <div className="text-sm font-medium">按模块管理主题与详细提示词</div>
                <div className="space-y-2">
                  <Label htmlFor="prompt-scope">功能模块</Label>
                  <Select id="prompt-scope" value={promptScope} onChange={(e) => setPromptScope(e.currentTarget.value as PromptScope)}>
                    {Object.entries(scopeLabelMap).map(([scope, label]) => (
                      <option key={scope} value={scope}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input
                    value={promptTheme}
                    onChange={(e) => setPromptTheme(e.currentTarget.value)}
                    placeholder="主题，例如：电商文案"
                  />
                  <Input
                    value={promptDetail}
                    onChange={(e) => setPromptDetail(e.currentTarget.value)}
                    placeholder="详细提示词"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => {
                      if (!promptDetail.trim()) {
                        return;
                      }
                      addPrompt(promptScope, promptDetail, promptTheme || "默认主题");
                      setPromptDetail("");
                    }}
                  >
                    添加提示词
                  </Button>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {scopedPrompts.length === 0 ? (
                    <div className="text-xs text-slate-500 dark:text-zinc-400">暂无提示词</div>
                  ) : (
                    scopedPrompts.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-2 py-1.5 dark:border-zinc-800">
                        <div className="min-w-0">
                          <div className="text-xs text-blue-600 dark:text-blue-300 truncate">{item.theme || "默认主题"}</div>
                          <div className="text-xs text-slate-700 dark:text-zinc-300 line-clamp-2">{item.detail || item.text || ""}</div>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => removePrompt(item.id)}>
                          删除
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeMenu === "skills" && (
              <div className="space-y-4 rounded-xl border border-slate-200 p-3 dark:border-zinc-800">
                <div className="text-sm font-medium">Skills 与仓库管理</div>

                <div className="space-y-2">
                  <Label>添加仓库</Label>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
                    <Input value={repoName} onChange={(e) => setRepoName(e.currentTarget.value)} placeholder="仓库名称" />
                    <Input value={repoUrl} onChange={(e) => setRepoUrl(e.currentTarget.value)} placeholder="仓库地址" />
                    <Button
                      type="button"
                      onClick={() => {
                        addRepository(repoName, repoUrl);
                        if (repoName.trim() && repoUrl.trim()) {
                          setRepoName("");
                          setRepoUrl("");
                        }
                      }}
                    >
                      添加仓库
                    </Button>
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-2">
                    {repositories.map((repo) => (
                      <div key={repo.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-2 py-1.5 dark:border-zinc-800">
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-slate-700 dark:text-zinc-300 truncate">{repo.name}</div>
                          <div className="text-xs text-slate-500 dark:text-zinc-400 truncate">{repo.url}</div>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => removeRepository(repo.id)}>
                          删除
                        </Button>
                      </div>
                    ))}
                    {repositories.length === 0 && <div className="text-xs text-slate-500 dark:text-zinc-400">暂无仓库</div>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>添加 Skill</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Input value={skillName} onChange={(e) => setSkillName(e.currentTarget.value)} placeholder="Skill 名称" />
                    <Input value={skillCommand} onChange={(e) => setSkillCommand(e.currentTarget.value)} placeholder="Skill 命令" />
                    <Select value={skillRepoId} onChange={(e) => setSkillRepoId(e.currentTarget.value)}>
                      <option value="">选择仓库</option>
                      {repositories.map((repo) => (
                        <option key={repo.id} value={repo.id}>
                          {repo.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => {
                        addSkill(skillName, skillCommand, skillRepoId);
                        if (skillName.trim() && skillCommand.trim() && skillRepoId) {
                          setSkillName("");
                          setSkillCommand("");
                        }
                      }}
                    >
                      添加 Skill
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {scopedSkills.map((skill) => {
                    const repo = repositories.find((item) => item.id === skill.repoId);
                    return (
                      <div key={skill.id} className="rounded-lg border border-slate-200 px-2 py-2 dark:border-zinc-800 space-y-2">
                        <div className="text-sm font-medium text-slate-700 dark:text-zinc-300">{skill.name}</div>
                        <div className="text-xs text-slate-500 dark:text-zinc-400">{skill.command}</div>
                        <div className="text-xs text-slate-500 dark:text-zinc-400">仓库：{repo?.name || "未知仓库"}</div>
                        <div className="flex gap-2 justify-end">
                          {skill.applied ? (
                            <Button type="button" variant="outline" size="sm" onClick={() => setSkillApplied(skill.id, false)}>
                              取消应用
                            </Button>
                          ) : (
                            <Button type="button" size="sm" onClick={() => setSkillApplied(skill.id, true)}>
                              应用
                            </Button>
                          )}
                          <Button type="button" variant="outline" size="sm" onClick={() => removeSkill(skill.id)}>
                            删除
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {scopedSkills.length === 0 && <div className="text-xs text-slate-500 dark:text-zinc-400">暂无 Skill</div>}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="destructive" onClick={handleClear}>清空密钥</Button>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
