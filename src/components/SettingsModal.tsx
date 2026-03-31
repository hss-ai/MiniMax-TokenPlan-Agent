"use client";

import { useState } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { apiRequest, ApiError } from "@/lib/apiClient";
import { Loader2, RefreshCw, X } from "lucide-react";

interface SettingsModalProps {
  onClose: () => void;
}

type ModelRemain = {
  start_time: number;
  end_time: number;
  remains_time: number;
  current_interval_total_count: number;
  current_interval_usage_count: number;
  model_name: string;
  current_weekly_total_count: number;
  current_weekly_usage_count: number;
  weekly_start_time: number;
  weekly_end_time: number;
  weekly_remains_time: number;
};

type RemainsResponse = {
  model_remains?: ModelRemain[];
};

const formatDateTime = (timestamp: number) => {
  if (!Number.isFinite(timestamp)) {
    return "-";
  }
  return new Date(timestamp).toLocaleString("zh-CN", { hour12: false });
};

const formatDuration = (ms: number) => {
  if (!Number.isFinite(ms) || ms <= 0) {
    return "0秒";
  }
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) {
    return `${days}天${hours}小时${minutes}分钟`;
  }
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  }
  if (minutes > 0) {
    return `${minutes}分钟${seconds}秒`;
  }
  return `${seconds}秒`;
};

const calcRemainCount = (total: number, used: number) => {
  if (!Number.isFinite(total) || !Number.isFinite(used)) {
    return "-";
  }
  return Math.max(total - used, 0).toLocaleString("zh-CN");
};

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { apiKey, rememberApiKey, setApiKey, setRememberApiKey, clearApiKey } = useSettingsStore();
  const [localKey, setLocalKey] = useState(apiKey);
  const [rememberLocal, setRememberLocal] = useState(rememberApiKey);
  const [remains, setRemains] = useState<ModelRemain[]>([]);
  const [isQueryingRemains, setIsQueryingRemains] = useState(false);
  const [remainsError, setRemainsError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState("");

  const handleSave = () => {
    setRememberApiKey(rememberLocal);
    setApiKey(localKey);
    onClose();
  };

  const handleClear = () => {
    setLocalKey("");
    setRememberLocal(false);
    setRememberApiKey(false);
    clearApiKey();
  };

  const handleQueryRemains = async () => {
    const key = localKey.trim();
    if (!key) {
      setRemainsError("请先输入 API Key 再查询余额");
      setRemains([]);
      return;
    }
    setIsQueryingRemains(true);
    setRemainsError("");
    try {
      const data = await apiRequest<RemainsResponse>({
        path: "https://www.minimaxi.com/v1/api/openplatform/coding_plan/remains",
        apiKey: key,
      });
      const list = Array.isArray(data.model_remains) ? data.model_remains : [];
      setRemains(list);
      setLastUpdatedAt(new Date().toLocaleString("zh-CN", { hour12: false }));
    } catch (error: unknown) {
      const message = error instanceof ApiError ? error.message : "余额查询失败，请稍后重试";
      setRemainsError(message || "余额查询失败，请稍后重试");
      setRemains([]);
    } finally {
      setIsQueryingRemains(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white/95 dark:bg-zinc-900/95 rounded-2xl shadow-2xl p-6 relative border border-white/60 dark:border-zinc-700/50">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          设置
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              MiniMax API Key
            </label>
            <input
              type="password"
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder="请输入您的 API Key"
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white"
            />
            <p className="text-xs text-gray-500 mt-2">
              默认仅保存在当前会话，关闭浏览器后自动清除。
            </p>
          </div>
          <label className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-zinc-700 px-3 py-2.5 bg-gray-50 dark:bg-zinc-800/70">
            <span className="text-sm text-gray-700 dark:text-gray-200">记住 API Key（不推荐）</span>
            <input
              type="checkbox"
              checked={rememberLocal}
              onChange={(e) => setRememberLocal(e.target.checked)}
              className="h-4 w-4 accent-blue-600"
            />
          </label>

          <div className="rounded-xl border border-gray-200 dark:border-zinc-700 bg-white/70 dark:bg-zinc-800/70 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Token Plan 余额查询</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  查询各模型当前周期与周维度剩余额度
                </p>
              </div>
              <button
                onClick={handleQueryRemains}
                disabled={isQueryingRemains}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {isQueryingRemains ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    查询中
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    查询余额
                  </>
                )}
              </button>
            </div>

            {remainsError && (
              <p className="mt-3 text-xs text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 px-2.5 py-2 rounded-lg">
                {remainsError}
              </p>
            )}

            {lastUpdatedAt && !remainsError && (
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">最近刷新：{lastUpdatedAt}</p>
            )}

            {remains.length > 0 && (
              <div className="mt-3 max-h-72 overflow-auto space-y-2 pr-1">
                {remains.map((item) => (
                  <div
                    key={`${item.model_name}-${item.start_time}-${item.end_time}`}
                    className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50/80 dark:bg-zinc-900/60 p-3"
                  >
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.model_name}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <p>周期额度：{item.current_interval_usage_count.toLocaleString("zh-CN")} / {item.current_interval_total_count.toLocaleString("zh-CN")}</p>
                      <p>周期剩余次数：{calcRemainCount(item.current_interval_total_count, item.current_interval_usage_count)}</p>
                      <p>周额度：{item.current_weekly_usage_count.toLocaleString("zh-CN")} / {item.current_weekly_total_count.toLocaleString("zh-CN")}</p>
                      <p>周剩余次数：{calcRemainCount(item.current_weekly_total_count, item.current_weekly_usage_count)}</p>
                      <p>周期剩余时间：{formatDuration(item.remains_time)}</p>
                      <p>周剩余时间：{formatDuration(item.weekly_remains_time)}</p>
                      <p>周期开始：{formatDateTime(item.start_time)}</p>
                      <p>周期结束：{formatDateTime(item.end_time)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={handleClear}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          >
            清空密钥
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
