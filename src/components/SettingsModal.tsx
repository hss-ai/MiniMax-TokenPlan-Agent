"use client";

import { useMemo, useState } from "react";
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
  const { prompts, addPrompt, updatePrompt, removePrompt } = usePromptStore();
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
  const [promptSearch, setPromptSearch] = useState("");
  const [editingPromptId, setEditingPromptId] = useState("");
  const [editingPromptTheme, setEditingPromptTheme] = useState("");
  const [editingPromptDetail, setEditingPromptDetail] = useState("");

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
  const themeLabelMap: Record<"system" | "light" | "dark", string> = {
    system: "跟随系统",
    light: "浅色模式",
    dark: "深色模式",
  };
  const menuItems = [
    { key: "system" as const, label: "系统设置", description: "主题、密钥与持久化策略" },
    { key: "prompt" as const, label: "提示词管理", description: "按模块维护可复用提示词" },
    { key: "skills" as const, label: "Skills 管理", description: "仓库、能力与应用状态" },
  ];
  const scopedPrompts = useMemo(
    () => prompts.filter((item) => item.scope === promptScope).sort((a, b) => b.createdAt - a.createdAt),
    [promptScope, prompts]
  );
  const filteredPrompts = useMemo(() => {
    const keyword = promptSearch.trim().toLowerCase();
    if (!keyword) {
      return scopedPrompts;
    }
    return scopedPrompts.filter((item) => {
      const theme = (item.theme || "默认主题").toLowerCase();
      const detail = (item.detail || item.text || "").toLowerCase();
      return theme.includes(keyword) || detail.includes(keyword);
    });
  }, [promptSearch, scopedPrompts]);
  const scopedSkills = useMemo(
    () => skills.filter((item) => !skillRepoId || item.repoId === skillRepoId).sort((a, b) => b.createdAt - a.createdAt),
    [skillRepoId, skills]
  );
  const scopeThemeCount = new Set(scopedPrompts.map((item) => item.theme || "默认主题")).size;
  const appliedSkillsCount = skills.filter((item) => item.applied).length;
  const maskedApiKey = localKey ? `${localKey.slice(0, 4)}${localKey.length > 8 ? "••••" : ""}${localKey.slice(-4)}` : "未配置";
  const systemSummaryItems = [
    { label: "密钥状态", value: localKey ? "已配置" : "未配置" },
    { label: "当前展示", value: maskedApiKey },
    { label: "保存策略", value: rememberLocal ? "本地记住" : "仅会话内" },
    { label: "主题模式", value: themeLabelMap[themeLocal] },
  ];

  const beginEditPrompt = (id: string, theme: string, detail: string) => {
    setEditingPromptId(id);
    setEditingPromptTheme(theme || "默认主题");
    setEditingPromptDetail(detail);
  };

  const cancelEditPrompt = () => {
    setEditingPromptId("");
    setEditingPromptTheme("");
    setEditingPromptDetail("");
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] w-[min(96vw,78rem)] max-w-6xl overflow-hidden p-0">
        <DialogHeader className="border-b border-slate-200 px-8 py-6 dark:border-zinc-800">
          <DialogTitle className="text-2xl">设置</DialogTitle>
          <DialogDescription>围绕系统配置、提示词资产与 Skills 能力，提供更完整的工作台级管理体验。</DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[calc(90vh-9rem)] grid-cols-1 gap-5 overflow-hidden px-8 py-6 md:grid-cols-[240px_1fr]">
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 p-3 dark:border-zinc-800">
              <div className="mb-3 px-1">
                <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100">设置中心</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-zinc-400">将高频配置收敛为三个清晰入口，减少来回跳转。</div>
              </div>
              <div className="space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveMenu(item.key)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                      activeMenu === item.key
                        ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                        : "border-transparent text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-zinc-400">{item.description}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">工作台状态</div>
              <div className="mt-2 space-y-1 text-sm text-slate-700 dark:text-zinc-300">
                <div>Prompt 总数：{prompts.length}</div>
                <div>仓库数量：{repositories.length}</div>
                <div>已应用 Skills：{appliedSkillsCount}</div>
              </div>
            </div>
          </div>

          <div className="space-y-5 overflow-y-auto pr-1">
            {activeMenu === "system" && (
              <div className="space-y-4 rounded-2xl border border-slate-200 p-5 dark:border-zinc-800">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {systemSummaryItems.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                      <div className="text-xs text-slate-500 dark:text-zinc-400">{item.label}</div>
                      <div className="mt-1 text-sm font-medium text-slate-900 dark:text-zinc-100 break-all">{item.value}</div>
                    </div>
                  ))}
                </div>
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
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/70">
                  <div>
                    <Label htmlFor="remember-key" className="text-sm">记住 API Key（便携版建议开启）</Label>
                    <div className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                      关闭后仅在当前会话保留，适合共享设备；开启后重启应用仍会保留。
                    </div>
                  </div>
                  <Switch
                    id="remember-key"
                    checked={rememberLocal}
                    onCheckedChange={(checked) => setRememberLocal(checked)}
                  />
                </div>
                <div className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 dark:border-zinc-700 dark:text-zinc-400">
                  建议在本地开发机开启“记住 API Key”，在演示机或共享设备上关闭，以减少误留凭证风险。
                </div>
              </div>
            )}

            {activeMenu === "prompt" && (
              <div className="space-y-4 rounded-2xl border border-slate-200 p-5 dark:border-zinc-800">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                  <div>
                    <div className="text-base font-medium">按模块管理主题与详细提示词</div>
                    <div className="mt-1 text-sm text-slate-500 dark:text-zinc-400">支持筛选、编辑与复用，适合沉淀团队常用表达模板。</div>
                  </div>
                  <Input
                    value={promptSearch}
                    onChange={(e) => setPromptSearch(e.currentTarget.value)}
                    placeholder="搜索主题或提示词内容"
                    className="xl:w-72"
                  />
                </div>
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
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                    <div className="text-xs text-slate-500 dark:text-zinc-400">当前模块</div>
                    <div className="mt-1 text-sm font-medium text-slate-900 dark:text-zinc-100">{scopeLabelMap[promptScope]}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                    <div className="text-xs text-slate-500 dark:text-zinc-400">主题数量</div>
                    <div className="mt-1 text-sm font-medium text-slate-900 dark:text-zinc-100">{scopeThemeCount}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                    <div className="text-xs text-slate-500 dark:text-zinc-400">提示词条数</div>
                    <div className="mt-1 text-sm font-medium text-slate-900 dark:text-zinc-100">{filteredPrompts.length}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    disabled={!promptDetail.trim()}
                    onClick={() => {
                      if (!promptDetail.trim()) {
                        return;
                      }
                      addPrompt(promptScope, promptDetail, promptTheme || "默认主题");
                      setPromptTheme("");
                      setPromptDetail("");
                    }}
                  >
                    添加提示词
                  </Button>
                </div>
                <div className="max-h-72 overflow-y-auto space-y-2">
                  {filteredPrompts.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 px-3 py-5 text-center text-xs text-slate-500 dark:border-zinc-700 dark:text-zinc-400">
                      当前筛选下暂无提示词
                    </div>
                  ) : (
                    filteredPrompts.map((item) => {
                      const isEditing = editingPromptId === item.id;
                      return (
                        <div key={item.id} className="rounded-xl border border-slate-200 px-3 py-3 dark:border-zinc-800">
                          {isEditing ? (
                            <div className="space-y-3">
                              <Input value={editingPromptTheme} onChange={(e) => setEditingPromptTheme(e.currentTarget.value)} placeholder="主题" />
                              <Input value={editingPromptDetail} onChange={(e) => setEditingPromptDetail(e.currentTarget.value)} placeholder="详细提示词" />
                              <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={cancelEditPrompt}>
                                  取消
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={!editingPromptDetail.trim()}
                                  onClick={() => {
                                    updatePrompt(item.id, editingPromptDetail, editingPromptTheme || "默认主题");
                                    cancelEditPrompt();
                                  }}
                                >
                                  保存
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-xs text-blue-600 dark:text-blue-300 truncate">{item.theme || "默认主题"}</div>
                                <div className="mt-1 text-xs text-slate-700 dark:text-zinc-300 whitespace-pre-wrap break-words">
                                  {item.detail || item.text || ""}
                                </div>
                              </div>
                              <div className="flex shrink-0 gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => beginEditPrompt(item.id, item.theme || "默认主题", item.detail || item.text || "")}
                                >
                                  编辑
                                </Button>
                                <Button type="button" variant="outline" size="sm" onClick={() => removePrompt(item.id)}>
                                  删除
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {activeMenu === "skills" && (
              <div className="space-y-4 rounded-2xl border border-slate-200 p-5 dark:border-zinc-800">
                <div>
                  <div className="text-base font-medium">Skills 与仓库管理</div>
                  <div className="mt-1 text-sm text-slate-500 dark:text-zinc-400">通过仓库归档与应用状态，让技能资产更接近真实产品控制台。</div>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                    <div className="text-xs text-slate-500 dark:text-zinc-400">仓库数量</div>
                    <div className="mt-1 text-sm font-medium text-slate-900 dark:text-zinc-100">{repositories.length}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                    <div className="text-xs text-slate-500 dark:text-zinc-400">Skill 总数</div>
                    <div className="mt-1 text-sm font-medium text-slate-900 dark:text-zinc-100">{skills.length}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                    <div className="text-xs text-slate-500 dark:text-zinc-400">已应用</div>
                    <div className="mt-1 text-sm font-medium text-slate-900 dark:text-zinc-100">{appliedSkillsCount}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>添加仓库</Label>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
                    <Input value={repoName} onChange={(e) => setRepoName(e.currentTarget.value)} placeholder="仓库名称" />
                    <Input value={repoUrl} onChange={(e) => setRepoUrl(e.currentTarget.value)} placeholder="仓库地址" />
                    <Button
                      type="button"
                      disabled={!repoName.trim() || !repoUrl.trim()}
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
                  <div className="max-h-36 overflow-y-auto space-y-2">
                    {repositories.map((repo) => (
                      <div key={repo.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 dark:border-zinc-800">
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                      disabled={!skillName.trim() || !skillCommand.trim() || !skillRepoId}
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

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {scopedSkills.map((skill) => {
                    const repo = repositories.find((item) => item.id === skill.repoId);
                    return (
                      <div key={skill.id} className="rounded-xl border border-slate-200 px-3 py-3 dark:border-zinc-800 space-y-2">
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

        <DialogFooter className="border-t border-slate-200 px-8 py-5 dark:border-zinc-800">
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {activeMenu === "system" && (
                <Button variant="destructive" onClick={handleClear}>清空密钥</Button>
              )}
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button variant="outline" onClick={onClose}>取消</Button>
              <Button onClick={handleSave}>保存</Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
