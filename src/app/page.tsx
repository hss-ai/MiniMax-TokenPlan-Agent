"use client";

import { useState, useEffect, useRef } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useChatStore } from "@/store/useChatStore";
import { appConfig } from "@/config/appConfig";
import { Send, Bot, User, PlusCircle, MessageSquare, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { apiRequest, ApiError } from "@/lib/apiClient";
import PromptQuickAccess from "@/components/PromptQuickAccess";

const MAX_CONTEXT_MESSAGES = 16;

export default function ChatPage() {
  const { apiKey } = useSettingsStore();
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessions.length === 0) {
      createSession();
    }
  }, [sessions.length, createSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, activeSessionId, isLoading]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  const handleSend = async () => {
    if (!input.trim() || !apiKey || !activeSession) return;

    const userMsg = input.trim();
    setInput("");

    addMessage(activeSession.id, { role: "user", content: userMsg });
    setIsLoading(true);

    try {
      const recentMessages = activeSession.messages.slice(-MAX_CONTEXT_MESSAGES);
      const data = await apiRequest<{ choices?: Array<{ message?: { content?: string } }> }>({
        path: "/text/chatcompletion_v2",
        method: "POST",
        apiKey,
        timeoutMs: 120000,
        body: {
          model: appConfig.models.chatDefault,
          messages: [
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
    <div className="flex h-full rounded-3xl border border-white/70 dark:border-zinc-800 bg-white/65 dark:bg-zinc-900/55 backdrop-blur-xl shadow-xl overflow-hidden">
      <div className={`border-r border-white/80 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/40 flex flex-col transition-all ${sessionListCollapsed ? "w-20" : "w-72"}`}>
        <div className="p-4 border-b border-white/70 dark:border-zinc-800 space-y-2">
          <div className={`flex ${sessionListCollapsed ? "justify-center" : "justify-end"}`}>
            <button
              type="button"
              onClick={() => setSessionListCollapsed((v) => !v)}
              className="h-8 w-8 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center"
            >
              {sessionListCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
          <button
            onClick={() => createSession()}
            className={`flex items-center w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all justify-center font-medium shadow-sm ${sessionListCollapsed ? "" : "gap-2"}`}
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
            className={`flex items-center p-3 rounded-xl cursor-pointer transition-all group border ${sessionListCollapsed ? "justify-center" : "justify-between"} ${
                activeSessionId === session.id
                  ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 dark:from-blue-500/25 dark:to-indigo-500/20 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-700/50"
                  : "hover:bg-white dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300 border-transparent"
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
              {activeSession.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-4 max-w-3xl mx-auto ${
                    msg.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === "user" ? "bg-blue-600" : "bg-emerald-600"
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
                        ? "bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-100 rounded-tr-none"
                        : "bg-gray-100 text-gray-900 dark:bg-zinc-800 dark:text-gray-100 rounded-tl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-4 max-w-3xl mx-auto">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-zinc-800 rounded-tl-none">
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

            <div className="p-4 bg-white/70 dark:bg-zinc-900/60 border-t border-white/80 dark:border-zinc-800">
              <div className="max-w-3xl mx-auto relative space-y-2">
                <PromptQuickAccess scope="chat" value={input} onUsePrompt={setInput} />
                <div className="relative flex items-end gap-2">
                {!apiKey && (
                  <div className="absolute -top-10 left-0 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50">
                    请先在左下角设置中配置 API Key
                  </div>
                )}
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="输入消息..."
                  className="flex-1 max-h-48 min-h-[56px] px-4 py-3 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white shadow-sm"
                  rows={1}
                  disabled={!apiKey || isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || !apiKey || isLoading}
                  className="p-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 shadow-sm"
                >
                  <Send className="w-5 h-5" />
                </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
