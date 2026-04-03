"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { appConfig } from "@/config/appConfig";
import { useSettingsStore } from "@/store/useSettingsStore";
import { ApiError } from "@/lib/apiClient";
import {
  ModelRemain,
  buildProgressBar,
  fetchTokenPlanRemains,
  findModelRemain,
  formatDateTime,
  formatDuration,
  getUsageColorClass,
  getUsageStats,
} from "@/lib/tokenPlan";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Snapshot = {
  data: ModelRemain[];
  fetchedAt: number;
};

const toLiveRemainsMs = (value: number, fetchedAt: number, now: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, value - (now - fetchedAt));
};

export default function TokenPlanStatusBar() {
  const apiKey = useSettingsStore((state) => state.apiKey);
  const [snapshot, setSnapshot] = useState<Snapshot>({ data: [], fetchedAt: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [now, setNow] = useState(Date.now());

  const fetchRemains = useCallback(async () => {
    const key = apiKey.trim();
    if (!key) {
      setError("未配置 API Key");
      setSnapshot({ data: [], fetchedAt: 0 });
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await fetchTokenPlanRemains(key);
      setSnapshot({ data, fetchedAt: Date.now() });
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "Token Plan 查询失败";
      setError(message || "Token Plan 查询失败");
      setSnapshot({ data: [], fetchedAt: 0 });
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    void fetchRemains();
  }, [fetchRemains]);

  useEffect(() => {
    const refresh = window.setInterval(() => {
      void fetchRemains();
    }, 60000);
    return () => {
      window.clearInterval(refresh);
    };
  }, [fetchRemains]);

  useEffect(() => {
    const ticker = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      window.clearInterval(ticker);
    };
  }, []);

  const preferredStatusModels = useMemo(
    () => appConfig.models.tokenPlanStatusModels.map((model) => model.trim()).filter((model) => model.length > 0),
    []
  );
  const minimaxMRemains = useMemo(() => {
    const modelList = snapshot.data.filter((item) => /^minimax-m/i.test(item.model_name.trim()));
    if (modelList.length === 0) {
      return [];
    }
    const preferred = preferredStatusModels
      .map((model) => findModelRemain(modelList, model))
      .filter((item): item is ModelRemain => Boolean(item));
    const uniquePreferred = preferred.filter(
      (item, index, list) =>
        list.findIndex((candidate) => candidate.model_name.trim().toLowerCase() === item.model_name.trim().toLowerCase()) === index
    );
    return uniquePreferred.length > 0 ? uniquePreferred : modelList;
  }, [snapshot.data, preferredStatusModels]);
  const primaryRemain = minimaxMRemains[0] ?? snapshot.data[0];
  const liveIntervalRemainMs = primaryRemain ? toLiveRemainsMs(primaryRemain.remains_time, snapshot.fetchedAt, now) : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200/80 dark:border-zinc-800 bg-white/92 dark:bg-zinc-950/92 backdrop-blur-md px-4 py-2">
      <div className="flex items-center gap-2">
        <div className="font-mono text-xs text-gray-700 dark:text-gray-200 overflow-x-auto whitespace-nowrap flex-1">
          {error ? (
            <span className="text-red-500">Token Plan 状态异常：{error}</span>
          ) : (
            <>
              {minimaxMRemains.length === 0 ? (
                <span className="text-gray-500">暂无匹配模型</span>
              ) : (
                minimaxMRemains.map((item, index) => {
                  const stats = getUsageStats(item.current_interval_total_count, item.current_interval_usage_count);
                  const bar = buildProgressBar(stats.percent);
                  const color = getUsageColorClass(stats.percent);
                  return (
                    <span key={item.model_name}>
                      {index > 0 && <span className="mx-2 text-gray-400">│</span>}
                      <span className="mr-1">{index === 0 ? item.model_name : `+ ${item.model_name}`}</span>
                      <span className={color}>{bar}</span>
                      <span className="ml-1">
                        {stats.percent}%({stats.available.toLocaleString("zh-CN")}/{stats.total.toLocaleString("zh-CN")})
                      </span>
                    </span>
                  );
                })
              )}
              <span className="mx-2 text-gray-400">│</span>
              <span>⏱ {formatDuration(liveIntervalRemainMs)}</span>
            </>
          )}
        </div>
        <Button variant="outline" size="sm" className="h-6" onClick={() => void fetchRemains()} disabled={loading}>
          刷新
        </Button>
        <Button variant="outline" size="sm" className="h-6" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "收起" : "详细"}
        </Button>
        {loading && <span className="text-xs text-gray-500">刷新中...</span>}
      </div>

      {expanded && !error && snapshot.data.length > 0 && (
        <div className="border-t border-gray-200/80 dark:border-zinc-800 pt-3 mt-2 text-xs text-gray-700 dark:text-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">/coding_plan/remains 详细</span>
            <Button variant="outline" size="sm" className="h-6" onClick={() => setExpanded(false)}>
              关闭
            </Button>
          </div>
          <div className="max-h-[50vh] overflow-y-auto pr-1 space-y-2">
          {snapshot.data.map((item) => {
            const intervalStats = getUsageStats(item.current_interval_total_count, item.current_interval_usage_count);
            const weeklyStats = getUsageStats(item.current_weekly_total_count, item.current_weekly_usage_count);
            const intervalBar = buildProgressBar(intervalStats.percent);
            const weeklyBar = buildProgressBar(weeklyStats.percent);
            return (
              <div key={`${item.model_name}-${item.start_time}`} className="rounded-lg border border-slate-200/80 dark:border-zinc-800 p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge variant={/^minimax-m/i.test(item.model_name) ? "default" : "outline"}>{item.model_name}</Badge>
                </div>
                <p>start_time: {formatDateTime(item.start_time)}</p>
                <p>end_time: {formatDateTime(item.end_time)}</p>
                <p>remains_time: {formatDuration(toLiveRemainsMs(item.remains_time, snapshot.fetchedAt, now))}</p>
                <p className={getUsageColorClass(intervalStats.percent)}>
                  current_interval_usage: {intervalBar} {intervalStats.percent}% ({intervalStats.available.toLocaleString("zh-CN")}/{intervalStats.total.toLocaleString("zh-CN")})
                </p>
                <p>current_interval_total_count: {item.current_interval_total_count.toLocaleString("zh-CN")}</p>
                <p>current_interval_usage_count: {item.current_interval_usage_count.toLocaleString("zh-CN")}</p>
                <p>weekly_start_time: {formatDateTime(item.weekly_start_time)}</p>
                <p>weekly_end_time: {formatDateTime(item.weekly_end_time)}</p>
                <p>weekly_remains_time: {formatDuration(toLiveRemainsMs(item.weekly_remains_time, snapshot.fetchedAt, now))}</p>
                <p className={getUsageColorClass(weeklyStats.percent)}>
                  current_weekly_usage: {weeklyBar} {weeklyStats.percent}% ({weeklyStats.available.toLocaleString("zh-CN")}/{weeklyStats.total.toLocaleString("zh-CN")})
                </p>
                <p>current_weekly_total_count: {item.current_weekly_total_count.toLocaleString("zh-CN")}</p>
                <p>current_weekly_usage_count: {item.current_weekly_usage_count.toLocaleString("zh-CN")}</p>
              </div>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
}
