"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Task, useTasksStore } from "@/store/useTasksStore";
import { appConfig } from "@/config/appConfig";
import { Video, Loader2, PlayCircle, Clock, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { ApiError, apiRequest } from "@/lib/apiClient";
import { resolveFileDownloadUrl, useTaskPolling } from "@/lib/taskPolling";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PromptQuickAccess from "@/components/PromptQuickAccess";

type VideoGenerateMode = "text_to_video" | "image_to_video" | "start_end_to_video" | "subject_reference";
const TEXT_TO_VIDEO_MODELS = ["MiniMax-Hailuo-02", "MiniMax-Hailuo-2.3", "MiniMax-Hailuo-2.3-Fast"];
const IMAGE_TO_VIDEO_MODELS = ["MiniMax-Hailuo-02", "MiniMax-Hailuo-2.3", "MiniMax-Hailuo-2.3-Fast"];
const VIDEO_MODEL_ALIASES: Record<string, string> = {
  "Hailuo-2.3-Fast": "MiniMax-Hailuo-2.3-Fast",
  "Hailuo-2.3": "MiniMax-Hailuo-2.3",
  "video-01": "MiniMax-Hailuo-2.3",
  "video-01-turbo": "MiniMax-Hailuo-02",
  "video-01-lite": "MiniMax-Hailuo-2.3-Fast",
};

export default function VideoPage() {
  const { apiKey } = useSettingsStore();
  const { tasks, addTask, updateTask } = useTasksStore();

  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<VideoGenerateMode>("text_to_video");
  const [model, setModel] = useState(appConfig.models.videoDefault);
  const [duration, setDuration] = useState(6);
  const [resolution, setResolution] = useState("768P");
  const [firstFrameImage, setFirstFrameImage] = useState("");
  const [lastFrameImage, setLastFrameImage] = useState("");
  const [subjectReferenceImage, setSubjectReferenceImage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [playbackUrls, setPlaybackUrls] = useState<Record<string, string>>({});
  const sourceUrlRef = useRef<Record<string, string>>({});
  const objectUrlRef = useRef<Record<string, string>>({});
  const downloadingIdsRef = useRef<Set<string>>(new Set());
  const modeModelOptions = useMemo(() => {
    const filteredOptions = mode === "text_to_video"
      ? appConfig.models.videoOptions.filter((videoModel) => TEXT_TO_VIDEO_MODELS.includes(videoModel))
      : appConfig.models.videoOptions.filter((videoModel) => IMAGE_TO_VIDEO_MODELS.includes(videoModel));
    if (filteredOptions.length > 0) {
      return filteredOptions;
    }
    return appConfig.models.videoOptions;
  }, [mode]);
  const normalizedModel = VIDEO_MODEL_ALIASES[model] ?? model;
  const durationOptions = useMemo(() => normalizedModel === "MiniMax-Hailuo-02" ? [6, 10] : [6], [normalizedModel]);

  useEffect(() => {
    if (!modeModelOptions.length) {
      return;
    }
    if (!modeModelOptions.includes(model)) {
      setModel(modeModelOptions[0]);
    }
  }, [modeModelOptions, model]);

  useEffect(() => {
    if (!durationOptions.includes(duration)) {
      setDuration(durationOptions[0]);
    }
  }, [duration, durationOptions]);

  const toggleTask = (id: string) => {
    setExpandedTasks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const videoTasks = tasks.filter(t => t.type === 'video');

  const autoExpand = useCallback((id: string) => {
    setExpandedTasks((prev) => ({ ...prev, [id]: true }));
  }, []);

  const queryVideoTask = useCallback(async (task: Task, key: string): Promise<Partial<Task>> => {
    const queryData = await apiRequest<{ status?: string; file_id?: string; error_message?: string }>({
      path: `/query/video_generation?task_id=${encodeURIComponent(task.id)}`,
      apiKey: key,
      timeoutMs: 120000,
    });

    if (queryData.status === "Success") {
      if (!queryData.file_id) {
        return { status: "Fail" as const, errorMessage: "任务完成但未返回文件 ID" };
      }
      const downloadUrl = await resolveFileDownloadUrl(queryData.file_id, key);
      if (!downloadUrl) {
        return { status: "Fail" as const, errorMessage: "无法获取视频下载链接" };
      }
      return { status: "Success" as const, resultUrl: downloadUrl };
    }
    if (queryData.status === "Fail") {
      return { status: "Fail" as const, errorMessage: queryData.error_message || "未知错误" };
    }
    return { status: "Processing" as const };
  }, []);

  useTaskPolling({
    apiKey,
    tasks,
    type: "video",
    intervalMs: 8000,
    queryTask: queryVideoTask,
    updateTask,
    autoExpand,
  });

  useEffect(() => {
    const successTasks = tasks.filter((task) => task.type === "video" && task.status === "Success" && !!task.resultUrl);
    const activeIds = new Set(successTasks.map((task) => task.id));

    Object.keys(sourceUrlRef.current).forEach((id) => {
      if (!activeIds.has(id)) {
        if (objectUrlRef.current[id]) {
          URL.revokeObjectURL(objectUrlRef.current[id]);
        }
        delete sourceUrlRef.current[id];
        delete objectUrlRef.current[id];
        downloadingIdsRef.current.delete(id);
      }
    });

    setPlaybackUrls((prev) => {
      const next: Record<string, string> = {};
      Object.keys(prev).forEach((id) => {
        if (activeIds.has(id)) {
          next[id] = prev[id];
        }
      });
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });

    let cancelled = false;
    successTasks.forEach((task) => {
      const sourceUrl = task.resultUrl;
      if (!sourceUrl) {
        return;
      }
      if (sourceUrlRef.current[task.id] === sourceUrl && playbackUrls[task.id]) {
        return;
      }
      if (downloadingIdsRef.current.has(task.id)) {
        return;
      }

      downloadingIdsRef.current.add(task.id);
      void (async () => {
        try {
          const response = await fetch(sourceUrl, { cache: "no-store" });
          if (!response.ok) {
            throw new Error("download failed");
          }
          const blob = await response.blob();
          if (cancelled) {
            return;
          }
          const objectUrl = URL.createObjectURL(blob);
          if (objectUrlRef.current[task.id]) {
            URL.revokeObjectURL(objectUrlRef.current[task.id]);
          }
          objectUrlRef.current[task.id] = objectUrl;
          sourceUrlRef.current[task.id] = sourceUrl;
          setPlaybackUrls((prev) => ({ ...prev, [task.id]: objectUrl }));
        } catch {
          if (!cancelled) {
            sourceUrlRef.current[task.id] = sourceUrl;
            setPlaybackUrls((prev) => ({ ...prev, [task.id]: sourceUrl }));
          }
        } finally {
          downloadingIdsRef.current.delete(task.id);
        }
      })();
    });

    return () => {
      cancelled = true;
    };
  }, [playbackUrls, tasks]);

  useEffect(() => {
    const objectUrls = objectUrlRef.current;
    const sourceUrls = sourceUrlRef.current;
    const downloadingIds = downloadingIdsRef.current;
    return () => {
      Object.values(objectUrls).forEach((url) => URL.revokeObjectURL(url));
      objectUrlRef.current = {};
      sourceUrlRef.current = {};
      Object.keys(sourceUrls).forEach((key) => {
        delete sourceUrls[key];
      });
      downloadingIds.clear();
    };
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim() || !apiKey) return;
    if ((mode === "image_to_video" || mode === "start_end_to_video") && !firstFrameImage.trim()) {
      setErrorMsg("请填写首帧图片 URL");
      return;
    }
    if (mode === "start_end_to_video" && !lastFrameImage.trim()) {
      setErrorMsg("请填写尾帧图片 URL");
      return;
    }
    if (mode === "subject_reference" && !subjectReferenceImage.trim()) {
      setErrorMsg("请填写主体参考图 URL");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const body: {
        prompt: string;
        model: string;
        duration: number;
        resolution: string;
        first_frame_image?: string;
        last_frame_image?: string;
        subject_reference?: Array<{
          type: "character";
          image_file: string;
        }>;
      } = {
        prompt,
        model: normalizedModel,
        duration,
        resolution,
      };

      if (mode === "image_to_video" || mode === "start_end_to_video") {
        body.first_frame_image = firstFrameImage.trim();
      }
      if (mode === "start_end_to_video") {
        body.last_frame_image = lastFrameImage.trim();
      }
      if (mode === "subject_reference") {
        body.subject_reference = [
          {
            type: "character",
            image_file: subjectReferenceImage.trim(),
          },
        ];
      }

      const createData = await apiRequest<{ task_id: string }>({
        path: "/video_generation",
        method: "POST",
        apiKey,
        timeoutMs: 120000,
        body,
      });

      addTask({
        id: createData.task_id,
        type: 'video',
        prompt,
        status: 'Queuing',
        createdAt: Date.now()
      });

      setPrompt("");
      setFirstFrameImage("");
      setLastFrameImage("");
      setSubjectReferenceImage("");

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
            <Video className="w-8 h-8 text-blue-600" />
            视频生成 (Hailuo)
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            支持文生视频、图生视频、首尾帧视频与主体参考视频四种模式，自动匹配官方模型并异步轮询结果。
          </p>
        </div>

        {!apiKey && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900/50 text-sm">
            请先在左下角设置中配置您的 MiniMax API Key
          </div>
        )}

        <Card className="bg-white/80 dark:bg-zinc-900/80 border-gray-200/80 dark:border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">参数配置</CardTitle>
            <CardDescription>选择模式、模型和参数后提交生成任务</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PromptQuickAccess
              scope="video"
              value={prompt}
              onUsePrompt={setPrompt}
              onAppendPrompt={(value) => setPrompt((prev) => prev.trim() ? `${prev.trim()}\n${value}` : value)}
            />
            <div className="space-y-2">
              <Label>生成模式</Label>
              <Select value={mode} onChange={(e) => setMode(e.target.value as VideoGenerateMode)} disabled={isSubmitting || !apiKey}>
                <option value="text_to_video">文生视频</option>
                <option value="image_to_video">图生视频</option>
                <option value="start_end_to_video">首尾帧视频</option>
                <option value="subject_reference">主体参考视频</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>模型选择</Label>
              <Select value={model} onChange={(e) => setModel(e.target.value)} disabled={isSubmitting || !apiKey}>
                {modeModelOptions.map((videoModel) => (
                  <option key={videoModel} value={videoModel}>
                    {videoModel}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>时长（秒）</Label>
                <Select value={duration} onChange={(e) => setDuration(Number(e.target.value))} disabled={isSubmitting || !apiKey}>
                  {durationOptions.map((seconds) => (
                    <option key={seconds} value={seconds}>{seconds}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>分辨率</Label>
                <Select value={resolution} onChange={(e) => setResolution(e.target.value)} disabled={isSubmitting || !apiKey}>
                  <option value="768P">768p</option>
                  <option value="1080P">1080p</option>
                </Select>
              </div>
            </div>

            {(mode === "image_to_video" || mode === "start_end_to_video") && (
              <div className="space-y-2">
                <Label>首帧图片 URL *</Label>
                <Input
                  type="url"
                  value={firstFrameImage}
                  onChange={(e) => setFirstFrameImage(e.target.value)}
                  placeholder="https://example.com/first-frame.jpg"
                  disabled={isSubmitting || !apiKey}
                />
              </div>
            )}

            {mode === "start_end_to_video" && (
              <div className="space-y-2">
                <Label>尾帧图片 URL *</Label>
                <Input
                  type="url"
                  value={lastFrameImage}
                  onChange={(e) => setLastFrameImage(e.target.value)}
                  placeholder="https://example.com/last-frame.jpg"
                  disabled={isSubmitting || !apiKey}
                />
              </div>
            )}

            {mode === "subject_reference" && (
              <div className="space-y-2">
                <Label>主体参考图 URL *</Label>
                <Input
                  type="url"
                  value={subjectReferenceImage}
                  onChange={(e) => setSubjectReferenceImage(e.target.value)}
                  placeholder="https://example.com/character.jpg"
                  disabled={isSubmitting || !apiKey}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>画面描述 (Prompt)</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="例如：镜头拍摄一个女性坐在咖啡馆里，女人抬头看着窗外，镜头缓缓移动拍摄到窗外的街道，画面呈现暖色调..."
                className="min-h-[128px] resize-none dark:text-white"
                disabled={isSubmitting || !apiKey}
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-red-500">
                {errorMsg}
              </div>
              <Button
                onClick={handleGenerate}
                disabled={isSubmitting || !prompt.trim() || !apiKey}
                className="gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
                提交任务
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">任务列表</h2>
          {videoTasks.length === 0 ? (
            <p className="text-gray-500 text-sm">暂无任务</p>
          ) : (
            <div className="grid gap-4">
              {videoTasks.map(task => {
                const isExpanded = expandedTasks[task.id] ?? false;

                return (
                  <Card key={task.id} className="bg-white/90 dark:bg-zinc-900/90 p-4 border-gray-200 dark:border-zinc-800 flex flex-col gap-3 transition-all">
                    <div
                      className="flex items-start justify-between cursor-pointer group"
                      onClick={() => toggleTask(task.id)}
                    >
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 flex-1 pr-4 group-hover:text-blue-600 transition-colors">
                        <span className="font-semibold mr-2">Prompt:</span>
                        {task.prompt}
                      </p>
                      <div className="shrink-0 flex items-center gap-3">
                        <div className="text-xs font-medium">
                          {task.status === "Success" && (
                            <Badge className="gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              完成
                            </Badge>
                          )}
                          {task.status === "Fail" && (
                            <Badge className="gap-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                              <AlertCircle className="w-3.5 h-3.5" />
                              失败
                            </Badge>
                          )}
                          {(task.status === "Processing" || task.status === "Queuing") && (
                            <Badge className="gap-1">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              {task.status === "Queuing" ? "排队中" : "生成中"}
                            </Badge>
                          )}
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
                          <div className="mt-2 aspect-video w-full max-w-xl rounded-lg overflow-hidden bg-black">
                            <video
                              key={`${task.id}-${playbackUrls[task.id] ?? task.resultUrl}`}
                              controls
                              src={playbackUrls[task.id] ?? task.resultUrl}
                              preload="metadata"
                              playsInline
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
