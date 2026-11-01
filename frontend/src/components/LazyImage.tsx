"use client";

import { useState, useRef, useEffect, ImgHTMLAttributes } from "react";
import { withRandomArticleCoverCacheBust } from "@/lib/upload";

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
  cacheKey?: string;
}

export default function LazyImage({
  src,
  alt = "",
  cacheKey,
  className = "",
  onLoad,
  onError,
  ...props
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [displaySrc, setDisplaySrc] = useState(src);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoaded(false);
      setDisplaySrc(withRandomArticleCoverCacheBust(src, cacheKey));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [src, cacheKey]);

  // 图片从浏览器缓存加载时 onLoad 可能在 React 注册前就触发，
  // 导致 loaded 永远 false → opacity-0 → 图片不可见。
  // 这里在 mount 和 src 变化时检查 img.complete 兜底。
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={displaySrc}
      alt={alt}
      decoding="async"
      referrerPolicy="no-referrer"
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      onError={(e) => {
        setLoaded(true);
        onError?.(e);
      }}
      className={`transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"} ${className}`}
      {...props}
    />
  );
}
