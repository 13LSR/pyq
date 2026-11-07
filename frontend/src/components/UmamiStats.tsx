"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { umamiConfig } from "@/lib/umami-config";
import { umamiClient, UMAMI_PAGEVIEW_EVENT, type UmamiStats } from "@/lib/umami";

const formatCount = (count: number) => count.toLocaleString("zh-CN");

function useUmamiStats<T>(key: string, load: () => Promise<T>) {
  const pathname = usePathname();
  const [result, setResult] = useState<{ key: string; data?: T; failed?: boolean }>();
  // pathname prevents a previous article's statistics flashing during client navigation.
  const requestKey = `${pathname}:${key}`;

  useEffect(() => {
    if (!umamiConfig.enabled) return;
    let cancelled = false;
    let sequence = 0;
    const refresh = () => {
      const current = ++sequence;
      void load().then((data) => {
        if (!cancelled && sequence === current) setResult({ key: requestKey, data });
      }).catch(() => {
        if (!cancelled && sequence === current) setResult({ key: requestKey, failed: true });
      });
    };
    refresh();
    window.addEventListener(UMAMI_PAGEVIEW_EVENT, refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(UMAMI_PAGEVIEW_EVENT, refresh);
    };
  }, [requestKey, load]);

  return result?.key === requestKey ? result : undefined;
}

const loadSiteStats = () => umamiClient.getStats();

export function SiteVisitStats() {
  const result = useUmamiStats<UmamiStats>("site", loadSiteStats);
  if (!umamiConfig.enabled) return null;
  return (
    <div className="text-[11px] leading-relaxed text-wechat-time" aria-live="polite">
      {result?.failed ? "统计暂不可用" : result?.data ? (
        <>浏览量 {formatCount(result.data.pageviews)} · 访客数 {formatCount(result.data.visitors)}</>
      ) : "统计加载中…"}
    </div>
  );
}

export function ArticleVisitStats({ id, shortId }: { id: string; shortId?: string }) {
  const load = useCallback(() => umamiClient.getArticlePageviews(id, shortId), [id, shortId]);
  const result = useUmamiStats<number>(`article:${id}:${shortId || ""}`, load);
  return (
    <span aria-live="polite">
      {result?.failed ? "阅读统计暂不可用" : result?.data !== undefined
        ? `阅读 ${formatCount(result.data)}`
        : "阅读加载中…"}
    </span>
  );
}
