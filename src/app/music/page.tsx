"use client";

import { useState } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTasksStore } from "@/store/useTasksStore";
import { appConfig } from "@/config/appConfig";
import { Music, Loader2, PlayCircle, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { ApiError, apiRequest } from "@/lib/apiClient";
import PromptQuickAccess from "@/components/PromptQuickAccess";

export default function MusicPage() {
  const { apiKey } = useSettingsStore();
  const { tasks, addTask, updateTask } = useTasksStore();

  const [prompt, setPrompt] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [isInstrumental, setIsInstrumental] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const musicTasks = tasks.filter(t => t.type === 'music');

  const handleGenerate = async () => {
    if (!prompt.trim() || !apiKey) return;

    setIsSubmitting(true);
    setErrorMsg("");

    const localTaskId = uuidv4();
    const finalLyrics = isInstrumental ? "\u65e0\u6b4c\u8bcd" : (lyrics.trim() || undefined);

    addTask({
      id: localTaskId,
      type: 'music',
      prompt: `${prompt}${isInstrumental ? ' (纯音乐)' : (lyrics ? ' (含歌词)' : ' (纯音乐)')}`,
      status: 'Processing',
      createdAt: Date.now()
    });

    try {
      const data = await apiRequest<{ data?: { audio_url?: string; audio?: string }; audio_url?: string; url?: string }>({
        path: "/music_generation",
        method: "POST",
        apiKey,
        timeoutMs: 120000,
        body: {
          model: appConfig.models.musicDefault,
          prompt: prompt,
          lyrics: finalLyrics,
          lyrics_optimizer: false,
          audio_setting: {
            sample_rate: appConfig.audio.music.sampleRate,
            bitrate: appConfig.audio.music.bitrate,
            format: appConfig.audio.music.format
          },
          output_format: "url"
        },
      });
      const url = data.data?.audio_url || data.audio_url || data.url || data.data?.audio;

      if (url) {
        updateTask(localTaskId, {
          status: 'Success',
          resultUrl: url
        });
      } else {
        throw new Error("未能获取音频链接");
      }

      setPrompt("");
      setLyrics("");

    } catch (error: unknown) {
      const errorMessage = error instanceof ApiError ? error.message : error instanceof Error ? error.message : "未知错误";
      updateTask(localTaskId, {
        status: 'Fail',
        errorMessage
      });
      setErrorMsg(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mm-shell flex flex-col h-full p-6 md:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <div>
          <h1 className="font-display text-3xl font-medium text-[#18181b] dark:text-white flex items-center gap-3">
            <Music className="w-8 h-8 text-purple-600" />
            音乐生成 (Music-2.5)
          </h1>
          <p className="mt-2 text-[#45515e] dark:text-gray-400">
            基于 MiniMax-Music-2.5 模型，输入风格描述和可选歌词即可生成完整的歌曲。任务已支持本地保存记录。
          </p>
        </div>

        {!apiKey && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-200 dark:border-red-900/50">
            请先在左下角设置中配置您的 MiniMax API Key
          </div>
        )}

        <div className="mm-panel p-6 space-y-4 dark:border-zinc-700 dark:bg-zinc-900/80">
          <PromptQuickAccess
            scope="music"
            value={prompt}
            onUsePrompt={setPrompt}
            onAppendPrompt={(value) => setPrompt((prev) => prev.trim() ? `${prev.trim()}\n${value}` : value)}
          />
          <div>
            <label className="block text-sm font-medium text-[#18181b] dark:text-gray-300 mb-2">
              音乐风格 (Prompt) *
            </label>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例如：Mandopop, Festive, Upbeat, 流行男声..."
              className="w-full px-4 py-3 bg-white dark:bg-zinc-950 border border-[var(--border)] dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300/70 dark:text-white"
              disabled={isSubmitting || !apiKey}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[#18181b] dark:text-gray-300">
                歌词 (可选)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="instrumental"
                  checked={isInstrumental}
                  onChange={(e) => setIsInstrumental(e.target.checked)}
                  disabled={isSubmitting || !apiKey}
                  className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                />
                <label htmlFor="instrumental" className="text-sm text-[#45515e] dark:text-gray-400">
                  生成纯音乐 (无歌词)
                </label>
              </div>
            </div>
            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="输入你的歌词。如果不填或勾选“纯音乐”，则生成纯音乐。"
              className="w-full h-48 px-4 py-3 bg-white dark:bg-zinc-950 border border-[var(--border)] dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-300/70 resize-none dark:text-white disabled:opacity-50"
              disabled={isSubmitting || !apiKey || isInstrumental}
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-red-500">
              {errorMsg}
            </div>

            <button
              onClick={handleGenerate}
              disabled={isSubmitting || !prompt.trim() || !apiKey}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#181e25] text-white mm-pill hover:bg-[#111821] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
              提交任务
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-display text-2xl font-medium text-[#18181b] dark:text-white">任务列表</h2>
          {musicTasks.length === 0 ? (
            <p className="text-gray-500 text-sm">暂无任务</p>
          ) : (
            <div className="grid gap-4">
              {musicTasks.map(task => (
                <div key={task.id} className="bg-white/95 dark:bg-zinc-900/90 rounded-[20px] p-4 border border-[var(--border)] dark:border-zinc-800 shadow-sm flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-[#45515e] dark:text-gray-300 line-clamp-2 flex-1 pr-4">
                      <span className="font-semibold mr-2">Prompt:</span>
                      {task.prompt}
                    </p>
                    <div className="shrink-0 flex items-center gap-1 text-xs font-medium">
                      {task.status === 'Success' && <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> 完成</span>}
                      {task.status === 'Fail' && <span className="text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4"/> 失败</span>}
                      {task.status === 'Processing' &&
                        <span className="text-purple-600 flex items-center gap-1"><Loader2 className="w-4 h-4 animate-spin"/> 生成中</span>
                      }
                    </div>
                  </div>

                  <div className="text-xs text-[#8e8e93] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(task.createdAt).toLocaleString()}
                  </div>

                  {task.status === 'Fail' && task.errorMessage && (
                    <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                      {task.errorMessage}
                    </div>
                  )}

                  {task.status === 'Success' && task.resultUrl && (
                    <div className="mt-2 w-full">
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
                          className="text-purple-600 hover:underline text-xs font-medium"
                        >
                          在新标签页中打开 / 下载
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
