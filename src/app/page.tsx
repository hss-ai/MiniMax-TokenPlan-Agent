"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useChatStore } from "@/store/useChatStore";
import { appConfig } from "@/config/appConfig";
import { Send, Bot, User, PlusCircle, MessageSquare, Trash2, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Copy, Check } from "lucide-react";
import { apiRequest, ApiError } from "@/lib/apiClient";
import PromptQuickAccess from "@/components/PromptQuickAccess";

const MAX_CONTEXT_MESSAGES = 16;

export default function ChatPage() {
  const { apiKey, mcpServers } = useSettingsStore();
  const {
    sessions,
    activeSessionId,
    createSession,
    setActiveSession,
    deleteSession,
    addMessage
  } = useChatStore();

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionListCollapsed, setSessionListCollapsed] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState("");
  const [mcpEnabled, setMcpEnabled] = useState(false);
  const [selectedMcpServerIds, setSelectedMcpServerIds] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (sessions.length === 0) {
      createSession();
    }
  }, [sessions.length, createSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, activeSessionId, isLoading]);

  useEffect(() => {
    if (!textareaRef.current) {
      return;
    }
    textareaRef.current.style.height = "0px";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 192)}px`;
  }, [input]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const activeMessageCount = activeSession?.messages.length ?? 0;
  const contextMessageCount = Math.min(activeMessageCount, MAX_CONTEXT_MESSAGES);
  const enabledMcpServers = useMemo(
    () => mcpServers.filter((item) => item.enabled),
    [mcpServers]
  );
  const selectedMcpServers = useMemo(
    () => enabledMcpServers.filter((item) => selectedMcpServerIds.includes(item.id)),
    [enabledMcpServers, selectedMcpServerIds]
  );

  useEffect(() => {
    setSelectedMcpServerIds((current) => {
      const availableIds = enabledMcpServers.map((item) => item.id);
      const filtered = current.filter((id) => availableIds.includes(id));
      if (filtered.length > 0 || availableIds.length === 0) {
        return filtered;
      }
      return availableIds;
    });
    if (enabledMcpServers.length === 0) {
      setMcpEnabled(false);
    }
  }, [enabledMcpServers]);

  const appendInput = (value: string) => {
    setInput((prev) => prev.trim() ? `${prev.trim()}\n${value}` : value);
  };

  const formatTime = (value: number) =>
    new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(value);

  const handleCopyMessage = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(id);
      window.setTimeout(() => {
        setCopiedMessageId((current) => current === id ? "" : current);
      }, 1200);
    } catch {
      setCopiedMessageId("");
    }
  };

  const toggleMcpServer = (id: string) => {
    setSelectedMcpServerIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const handleSend = async () => {
    if (!input.trim() || !apiKey || !activeSession) return;
    if (mcpEnabled && selectedMcpServers.length === 0) return;

    const userMsg = input.trim();
    setInput("");

    addMessage(activeSession.id, { role: "user", content: userMsg });
    setIsLoading(true);

    try {
      const recentMessages = activeSession.messages.slice(-MAX_CONTEXT_MESSAGES);
      const mcpContextMessage =
        mcpEnabled && selectedMcpServers.length > 0
          ? {
              role: "system" as const,
              content: `以下是本次对话已启用的 MCP 服务，请在需要时优先结合这些能力生成回答：\n${selectedMcpServers
                .map((item, index) => {
                  const access = item.endpoint || [item.command, ...(item.args || [])].filter(Boolean).join(" ");
                  return `${index + 1}. 名称：${item.name}\n   访问方式：${access}${item.description ? `\n   描述：${item.description}` : ""}`;
                })
                .join("\n")}`,
            }
          : null;
      const data = await apiRequest<{ choices?: Array<{ message?: { content?: string } }> }>({
        path: "/text/chatcompletion_v2",
        method: "POST",
        apiKey,
        timeoutMs: 120000,
        body: {
          model: appConfig.models.chatDefault,
          messages: [
            ...(mcpContextMessage ? [mcpContextMessage] : []),
            ...recentMessages.map((m) => ({
              role: m.role === "bot" ? "assistant" : "user",
              content: m.content,
            })),
            { role: "user", content: userMsg },
          ],
        },
      });

      const botMsg = data.choices?.[0]?.message?.content || JSON.stringify(data);

      addMessage(activeSession.id, { role: "bot", content: botMsg });
    } catch (error: unknown) {
      const errorMessage = error instanceof ApiError ? error.message : error instanceof Error ? error.message : "未知错误";
      addMessage(activeSession.id, { role: "bot", content: `请求失败: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mm-shell flex h-full overflow-hidden">
      <div className={`border-r border-[var(--border-soft)] dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/75 flex flex-col transition-all ${sessionListCollapsed ? "w-20" : "w-72"}`}>
        <div className="p-4 border-b border-[var(--border-soft)] dark:border-zinc-800 space-y-2">
          <div className={`flex ${sessionListCollapsed ? "justify-center" : "justify-end"}`}>
            <button
              type="button"
              onClick={() => setSessionListCollapsed((v) => !v)}
              className="h-8 w-8 rounded-full border border-[var(--border)] dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-black/[0.04] dark:hover:bg-zinc-800 flex items-center justify-center"
            >
              {sessionListCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
          <button
            onClick={() => createSession()}
            className={`flex items-center w-full px-4 py-2.5 bg-[#181e25] text-white mm-pill hover:bg-[#111821] transition-all justify-center font-medium shadow-sm ${sessionListCollapsed ? "" : "gap-2"}`}
            title="新建对话"
          >
            <PlusCircle className="w-5 h-5" />
            {!sessionListCollapsed && "新建对话"}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => setActiveSession(session.id)}
            className={`flex items-center p-3 rounded-2xl cursor-pointer transition-all group border ${sessionListCollapsed ? "justify-center" : "justify-between"} ${
                activeSessionId === session.id
                  ? "bg-black/[0.04] text-[#18181b] dark:bg-blue-500/20 dark:text-blue-300 border-[var(--border)] dark:border-blue-700/50 shadow-[0_0_15px_rgba(44,30,116,0.16)]"
                  : "hover:bg-black/[0.02] dark:hover:bg-zinc-800 text-[#45515e] dark:text-gray-300 border-transparent"
              }`}
              title={sessionListCollapsed ? session.title : undefined}
            >
              <div className={`flex items-center overflow-hidden ${sessionListCollapsed ? "" : "gap-3"}`}>
                <MessageSquare className="w-4 h-4 shrink-0" />
                {!sessionListCollapsed && <span className="text-sm truncate">{session.title}</span>}
              </div>
              {!sessionListCollapsed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full relative">
        {!activeSession ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            请选择或新建一个对话
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-[20px] border border-[var(--border)] bg-white/95 p-4 shadow-[0_4px_6px_rgba(0,0,0,0.08)] dark:border-zinc-800 dark:bg-zinc-900/75">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-display text-xl font-medium text-[#18181b] dark:text-zinc-100">{activeSession.title}</div>
                    <div className="mt-1 text-sm text-[#45515e] dark:text-zinc-400">
                      当前会话共 {activeMessageCount} 条消息，发送时自动携带最近 {contextMessageCount} 条上下文。
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[#45515e] dark:border-zinc-700 dark:text-zinc-300">
                      模型：{appConfig.models.chatDefault}
                    </span>
                    <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[#45515e] dark:border-zinc-700 dark:text-zinc-300">
                      会话数：{sessions.length}
                    </span>
                    <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[#45515e] dark:border-zinc-700 dark:text-zinc-300">
                      MCP：{mcpEnabled && selectedMcpServers.length > 0 ? `已启用 ${selectedMcpServers.length} 个` : "未启用"}
                    </span>
                  </div>
                </div>
              </div>
              {activeSession.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-4 max-w-3xl mx-auto ${
                    msg.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === "user" ? "bg-[#1456f0]" : "bg-[#181e25]"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div
                    className={`px-4 py-3 rounded-2xl max-w-[80%] ${
                      msg.role === "user"
                        ? "bg-blue-50 text-blue-900 dark:bg-blue-900/40 dark:text-blue-100 rounded-tr-none border border-blue-100 dark:border-blue-800/60"
                        : "bg-white text-[#222222] dark:bg-zinc-800 dark:text-gray-100 rounded-tl-none border border-[var(--border)] dark:border-zinc-700"
                    }`}
                  >
                    <div className={`mb-2 flex items-center gap-2 text-[11px] ${msg.role === "user" ? "justify-end text-blue-700/80 dark:text-blue-200/80" : "justify-between text-[#8e8e93] dark:text-zinc-400"}`}>
                      <span>{msg.role === "user" ? "你" : "MiniMax Assistant"}</span>
                      <div className="flex items-center gap-2">
                        <span>{formatTime(msg.createdAt)}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="inline-flex items-center gap-1 transition-colors hover:text-slate-900 dark:hover:text-zinc-100"
                        >
                          {copiedMessageId === msg.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {copiedMessageId === msg.id ? "已复制" : "复制"}
                        </button>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-4 max-w-3xl mx-auto">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white border border-[var(--border)] dark:bg-zinc-800 dark:border-zinc-700 rounded-tl-none">
                    <div className="flex gap-1 items-center h-6">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 pb-6 bg-white/75 dark:bg-zinc-900/60 border-t border-[var(--border-soft)] dark:border-zinc-800">
              <div className="max-w-3xl mx-auto relative space-y-2">
                {toolsExpanded && (
                  <>
                    <PromptQuickAccess scope="chat" value={input} onUsePrompt={setInput} onAppendPrompt={appendInput} />
                    <div className="rounded-2xl border border-[var(--border)] bg-white/95 px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900/70">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setMcpEnabled((value) => !value)}
                          disabled={enabledMcpServers.length === 0}
                          className={`rounded-full border px-2.5 py-1 transition-colors ${
                            mcpEnabled
                              ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                              : "border-[var(--border)] bg-white text-[#45515e] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                          } disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          {mcpEnabled ? "MCP 已启用" : "MCP 已关闭"}
                        </button>
                        {enabledMcpServers.length === 0 ? (
                          <span className="text-slate-500 dark:text-zinc-400">请先在设置中心的 MCP 管理里添加并启用服务</span>
                        ) : (
                          enabledMcpServers.map((server) => (
                            <button
                              key={server.id}
                              type="button"
                              onClick={() => toggleMcpServer(server.id)}
                              className={`rounded-full border px-2.5 py-1 transition-colors ${
                                selectedMcpServerIds.includes(server.id)
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                                  : "border-[var(--border)] bg-white text-[#45515e] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                              }`}
                            >
                              {server.name}
                            </button>
                          ))
                        )}
                      </div>
                      {mcpEnabled && enabledMcpServers.length > 0 && selectedMcpServers.length === 0 && (
                        <div className="mt-2 text-amber-600 dark:text-amber-300">请至少选择一个 MCP 服务</div>
                      )}
                    </div>
                  </>
                )}
                <div className="relative flex items-end gap-2">
                {!apiKey && (
                  <div className="absolute -top-10 left-0 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50">
                    请先在左下角设置中配置 API Key
                  </div>
                )}
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="输入消息..."
                  className="flex-1 max-h-48 min-h-[56px] px-4 py-3 bg-white dark:bg-zinc-800 rounded-2xl border border-[var(--border)] dark:border-zinc-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300/70 dark:text-white shadow-sm"
                  rows={1}
                  disabled={!apiKey || isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || !apiKey || isLoading || (mcpEnabled && selectedMcpServers.length === 0)}
                  className="p-3.5 bg-[#181e25] text-white rounded-full hover:bg-[#111821] disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 shadow-sm"
                >
                  <Send className="w-5 h-5" />
                </button>
                </div>
                <div className="flex items-center justify-between px-1 pt-1 text-xs text-slate-500 dark:text-zinc-400">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setToolsExpanded((v) => !v)}
                      className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors"
                    >
                      {toolsExpanded ? (
                        <>收起提示词与MCP栏目 <ChevronUp className="w-3 h-3" /></>
                      ) : (
                        <>展开提示词与MCP栏目 <ChevronDown className="w-3 h-3" /></>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>Enter 发送，Shift + Enter 换行</span>
                    <span>{input.trim().length} 字符</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
