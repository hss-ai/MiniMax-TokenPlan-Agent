"use client";

import { useState } from "react";
import NextImage from "next/image";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTasksStore } from "@/store/useTasksStore";
import { appConfig } from "@/config/appConfig";
import { ImageIcon, Loader2, PlayCircle, Clock, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { ApiError, apiRequest } from "@/lib/apiClient";
import PromptQuickAccess from "@/components/PromptQuickAccess";

type ImageGenerateMode = "text_to_image" | "subject_reference";

export default function ImagePage() {
  const { apiKey } = useSettingsStore();
  const { tasks, addTask, updateTask } = useTasksStore();

  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<ImageGenerateMode>("text_to_image");
  const [model, setModel] = useState(appConfig.models.imageDefault);
  const [aspectRatio, setAspectRatio] = useState(
    appConfig.models.imageAspectRatios.includes("16:9") ? "16:9" : appConfig.models.imageAspectRatios[0]
  );
  const [referenceImageUrl, setReferenceImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  const toggleTask = (id: string) => {
    setExpandedTasks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const imageTasks = tasks.filter(t => t.type === 'image');

  const handleGenerate = async () => {
    if (!prompt.trim() || !apiKey) return;
    if (mode === "subject_reference" && !referenceImageUrl.trim()) {
      setErrorMsg("请填写主体参考图片 URL");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");
    const localTaskId = uuidv4();
    addTask({
      id: localTaskId,
      type: 'image',
      prompt,
      status: 'Processing',
      createdAt: Date.now()
    });
    setExpandedTasks(prev => ({ ...prev, [localTaskId]: true }));

    try {
      const body: {
        model: string;
        prompt: string;
        aspect_ratio: string;
        response_format: "base64";
        subject_reference?: Array<{
          type: "character";
          image_file: string;
        }>;
      } = {
        model,
        prompt,
        aspect_ratio: aspectRatio,
        response_format: "base64",
      };

      if (mode === "subject_reference") {
        body.subject_reference = [
          {
            type: "character",
            image_file: referenceImageUrl.trim(),
          },
        ];
      }

      const data = await apiRequest<{ data?: { image_base64?: string[] } }>({
        path: "/image_generation",
        method: "POST",
        apiKey,
        timeoutMs: 120000,
        body,
      });

      const base64Str = data.data?.image_base64?.[0];
      if (base64Str) {
        updateTask(localTaskId, {
          status: 'Success',
          resultUrl: `data:image/jpeg;base64,${base64Str}`
        });
      } else {
        throw new Error("未能获取图片数据");
      }

      setPrompt("");
      if (mode === "subject_reference") {
        setReferenceImageUrl("");
      }

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
            <ImageIcon className="w-8 h-8 text-emerald-600" />
            图片生成 (Image-01)
          </h1>
          <p className="mt-2 text-[#45515e] dark:text-gray-400">
            支持文生图和主体参考图生图，两种模式均支持本地任务记录与结果下载。
          </p>
        </div>

        {!apiKey && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-200 dark:border-red-900/50">
            请先在左下角设置中配置您的 MiniMax API Key
          </div>
        )}

        <div className="mm-panel p-6 space-y-4 dark:border-zinc-700 dark:bg-zinc-900/80">
          <PromptQuickAccess
            scope="image"
            value={prompt}
            onUsePrompt={setPrompt}
            onAppendPrompt={(value) => setPrompt((prev) => prev.trim() ? `${prev.trim()}\n${value}` : value)}
          />
          <div>
            <label className="block text-sm font-medium text-[#18181b] dark:text-gray-300 mb-2">
              生成模式
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as ImageGenerateMode)}
              className="w-full md:w-64 px-4 py-3 bg-white dark:bg-zinc-950 border border-[var(--border)] dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300/70 dark:text-white"
              disabled={isSubmitting || !apiKey}
            >
              <option value="text_to_image">文生图</option>
              <option value="subject_reference">主体参考图生图</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#18181b] dark:text-gray-300 mb-2">
              模型选择
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full md:w-64 px-4 py-3 bg-white dark:bg-zinc-950 border border-[var(--border)] dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300/70 dark:text-white"
              disabled={isSubmitting || !apiKey}
            >
              {appConfig.models.imageOptions.map((imageModel) => (
                <option key={imageModel} value={imageModel}>
                  {imageModel}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#18181b] dark:text-gray-300 mb-2">
              图片描述 (Prompt) *
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例如：女孩在图书馆的窗户前，看向远方，动漫风格，高细节..."
              className="w-full h-32 px-4 py-3 bg-white dark:bg-zinc-950 border border-[var(--border)] dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-300/70 resize-none dark:text-white"
              disabled={isSubmitting || !apiKey}
            />
          </div>

          {mode === "subject_reference" && (
            <div>
              <label className="block text-sm font-medium text-[#18181b] dark:text-gray-300 mb-2">
                主体参考图 URL *
              </label>
              <input
                type="url"
                value={referenceImageUrl}
                onChange={(e) => setReferenceImageUrl(e.target.value)}
                placeholder="https://example.com/character.jpg"
                className="w-full px-4 py-3 bg-white dark:bg-zinc-950 border border-[var(--border)] dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300/70 dark:text-white"
                disabled={isSubmitting || !apiKey}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#18181b] dark:text-gray-300 mb-2">
              图片比例
            </label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full md:w-64 px-4 py-3 bg-white dark:bg-zinc-950 border border-[var(--border)] dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300/70 dark:text-white"
              disabled={isSubmitting || !apiKey}
            >
              {appConfig.models.imageAspectRatios.map((ratio) => (
                <option key={ratio} value={ratio}>
                  {ratio}
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
              disabled={isSubmitting || !prompt.trim() || !apiKey}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#181e25] text-white mm-pill hover:bg-[#111821] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
              开始生成
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-display text-2xl font-medium text-[#18181b] dark:text-white">任务列表</h2>
          {imageTasks.length === 0 ? (
            <p className="text-gray-500 text-sm">暂无任务</p>
          ) : (
            <div className="grid gap-4">
              {imageTasks.map(task => {
                const isExpanded = expandedTasks[task.id] ?? false;

                return (
                  <div key={task.id} className="bg-white/95 dark:bg-zinc-900/90 rounded-[20px] p-4 border border-[var(--border)] dark:border-zinc-800 shadow-sm flex flex-col gap-3 transition-all">
                    <div
                      className="flex items-start justify-between cursor-pointer group"
                      onClick={() => toggleTask(task.id)}
                    >
                      <p className="text-sm text-[#45515e] dark:text-gray-300 line-clamp-2 flex-1 pr-4 group-hover:text-emerald-600 transition-colors">
                        <span className="font-semibold mr-2">Prompt:</span>
                        {task.prompt}
                      </p>
                      <div className="shrink-0 flex items-center gap-3">
                        <div className="text-xs font-medium">
                          {task.status === 'Success' && <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> 完成</span>}
                          {task.status === 'Fail' && <span className="text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4"/> 失败</span>}
                          {task.status === 'Processing' &&
                            <span className="text-emerald-600 flex items-center gap-1"><Loader2 className="w-4 h-4 animate-spin"/> 生成中</span>
                          }
                        </div>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="pt-2 border-t border-[var(--border-soft)] dark:border-zinc-800 animate-in fade-in slide-in-from-top-2">
                        <div className="text-xs text-[#8e8e93] flex items-center gap-1 mb-3">
                          <Clock className="w-3 h-3" />
                          {new Date(task.createdAt).toLocaleString()}
                        </div>

                        {task.status === 'Fail' && task.errorMessage && (
                          <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                            {task.errorMessage}
                          </div>
                        )}

                        {task.status === 'Success' && task.resultUrl && (
                          <div className="mt-2 w-full max-w-xl rounded-lg overflow-hidden bg-black/5 flex items-center justify-center relative group">
                            <NextImage
                              src={task.resultUrl}
                              alt="Generated"
                              width={1280}
                              height={720}
                              className="w-full h-auto max-h-[600px] object-contain"
                              unoptimized
                            />
                            <a
                              href={task.resultUrl}
                              download={`minimax-image-${task.id.slice(0, 8)}.jpeg`}
                              className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                            >
                              下载图片
                            </a>
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
