"use client";

import { useCallback, useState } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Task, useTasksStore } from "@/store/useTasksStore";
import { appConfig } from "@/config/appConfig";
import { Mic, Loader2, PlayCircle, Clock, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { ApiError, apiRequest } from "@/lib/apiClient";
import { resolveFileDownloadUrl, useTaskPolling } from "@/lib/taskPolling";
import PromptQuickAccess from "@/components/PromptQuickAccess";

export default function VoicePage() {
  const { apiKey } = useSettingsStore();
  const { tasks, addTask, updateTask } = useTasksStore();

  const [text, setText] = useState("");
  const [voiceId, setVoiceId] = useState(appConfig.models.voiceDefault);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  const toggleTask = (id: string) => {
    setExpandedTasks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const voiceTasks = tasks.filter(t => t.type === 'voice');

  const autoExpand = useCallback((id: string) => {
    setExpandedTasks((prev) => ({ ...prev, [id]: true }));
  }, []);

  const queryVoiceTask = useCallback(async (task: Task, key: string): Promise<Partial<Task>> => {
    const queryData = await apiRequest<{
      status?: string | number;
      task_status?: string | number;
      file_id?: string;
      data?: { file_id?: string };
      task_info?: { file_id?: string };
      error_message?: string;
    }>({
      path: `/query/t2a_async_query_v2?task_id=${encodeURIComponent(task.id)}`,
      apiKey: key,
    });

    const taskStatus = queryData.status || queryData.task_status;
    if (taskStatus === "Success" || taskStatus === 2) {
      const fileId = queryData.file_id || queryData.data?.file_id || queryData.task_info?.file_id;
      if (!fileId) {
        return { status: "Fail" as const, errorMessage: "任务完成但未返回文件 ID" };
      }
      const downloadUrl = await resolveFileDownloadUrl(fileId, key);
      if (!downloadUrl) {
        return { status: "Fail" as const, errorMessage: "无法获取音频下载链接" };
      }
      return { status: "Success" as const, resultUrl: downloadUrl };
    }
    if (taskStatus === "Fail" || taskStatus === 3) {
      return { status: "Fail" as const, errorMessage: queryData.error_message || "未知错误" };
    }
    return { status: "Processing" as const };
  }, []);

  useTaskPolling({
    apiKey,
    tasks,
    type: "voice",
    intervalMs: 6000,
    queryTask: queryVoiceTask,
    updateTask,
    autoExpand,
  });

  const handleGenerate = async () => {
    if (!text.trim() || !apiKey) return;

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const createData = await apiRequest<{ task_id: string }>({
        path: "/t2a_async_v2",
        method: "POST",
        apiKey,
      timeoutMs: 120000,
        body: {
          model: appConfig.models.voiceModel,
          text: text,
          voice_setting: {
            voice_id: voiceId,
            speed: 1,
            vol: 1,
            pitch: 0
          },
          audio_setting: {
            sample_rate: appConfig.audio.voice.sampleRate,
            bitrate: appConfig.audio.voice.bitrate,
            format: appConfig.audio.voice.format,
            channel: appConfig.audio.voice.channel
          }
        },
      });

      addTask({
        id: createData.task_id,
        type: 'voice',
        prompt: `[${voiceId}] ${text}`,
        status: 'Queuing',
        createdAt: Date.now()
      });

      setText("");

    } catch (error: unknown) {
      const errorMessage = error instanceof ApiError ? error.message : error instanceof Error ? error.message : "未知错误";
      setErrorMsg(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/65 dark:bg-zinc-900/55 backdrop-blur-xl p-6 md:p-8 overflow-y-auto rounded-3xl border border-white/70 dark:border-zinc-800 shadow-xl">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Mic className="w-8 h-8 text-orange-600" />
            语音合成 (Text-to-Speech)
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            基于 MiniMax speech-2.8-hd 模型，输入文本即可生成逼真的语音。任务会在后台异步处理。
          </p>
        </div>

        {!apiKey && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900/50">
            请先在左下角设置中配置您的 MiniMax API Key
          </div>
        )}

        <div className="bg-white/80 dark:bg-zinc-900/80 rounded-2xl p-6 border border-gray-200/80 dark:border-zinc-700 space-y-4 shadow-sm">
          <PromptQuickAccess
            scope="voice"
            value={text}
            onUsePrompt={setText}
            onAppendPrompt={(value) => setText((prev) => prev.trim() ? `${prev.trim()}\n${value}` : value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              待合成文本 *
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="例如：微风拂过柔软的草地，清新的芳香伴随着鸟儿的歌唱。"
              className="w-full h-32 px-4 py-3 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none dark:text-white"
              disabled={isSubmitting || !apiKey}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              选择音色
            </label>
            <select
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              className="w-full md:w-64 px-4 py-3 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-white"
              disabled={isSubmitting || !apiKey}
            >
              {appConfig.models.voiceOptions.map((voiceOption) => (
                <option key={voiceOption.id} value={voiceOption.id}>
                  {voiceOption.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-red-500">
              {errorMsg}
            </div>

            <button
              onClick={handleGenerate}
              disabled={isSubmitting || !text.trim() || !apiKey}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
              提交任务
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">任务列表</h2>
          {voiceTasks.length === 0 ? (
            <p className="text-gray-500 text-sm">暂无任务</p>
          ) : (
            <div className="grid gap-4">
              {voiceTasks.map(task => {
                const isExpanded = expandedTasks[task.id] ?? false;

                return (
                  <div key={task.id} className="bg-white/90 dark:bg-zinc-900/90 rounded-xl p-4 border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col gap-3 transition-all">
                    <div
                      className="flex items-start justify-between cursor-pointer group"
                      onClick={() => toggleTask(task.id)}
                    >
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 flex-1 pr-4 group-hover:text-orange-600 transition-colors">
                        <span className="font-semibold mr-2">文本:</span>
                        {task.prompt}
                      </p>
                      <div className="shrink-0 flex items-center gap-3">
                        <div className="text-xs font-medium">
                          {task.status === 'Success' && <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> 完成</span>}
                          {task.status === 'Fail' && <span className="text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4"/> 失败</span>}
                          {(task.status === 'Processing' || task.status === 'Queuing') &&
                            <span className="text-orange-600 flex items-center gap-1"><Loader2 className="w-4 h-4 animate-spin"/> 生成中</span>
                          }
                        </div>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2">
                        <div className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                          <Clock className="w-3 h-3" />
                          {new Date(task.createdAt).toLocaleString()}
                        </div>

                        {task.status === 'Fail' && task.errorMessage && (
                          <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                            {task.errorMessage}
                          </div>
                        )}

                        {task.status === 'Success' && task.resultUrl && (
                          <div className="w-full">
                            <audio
                              controls
                              src={task.resultUrl}
                              className="w-full"
                            />
                            <div className="mt-2 flex justify-end">
                              <a
                                href={task.resultUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-orange-600 hover:underline text-xs font-medium"
                              >
                                在新标签页中打开 / 下载
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
