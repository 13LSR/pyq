"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { canTrackUmamiPage, umamiConfig } from "@/lib/umami-config";
import { umamiClient, UMAMI_PAGEVIEW_EVENT } from "@/lib/umami";

declare global {
  interface Window {
    umami?: {
      track: (callback: (payload: Record<string, unknown>) => Record<string, unknown>) => Promise<void>;
    };
  }
}

export default function UmamiTracker() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const lastPath = useRef<string | null>(null);
  const previousUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || !window.umami || lastPath.current === pathname) return;
    lastPath.current = pathname;
    if (!canTrackUmamiPage(window.location.hostname, pathname)) return;

    const url = new URL(pathname, window.location.origin).toString();
    const referrer = previousUrl.current || document.referrer;
    previousUrl.current = url;
    const cleanReferrer = referrer ? new URL(referrer, window.location.origin) : null;
    if (cleanReferrer) {
      cleanReferrer.search = "";
      cleanReferrer.hash = "";
    }
    // Auto tracking is off: usePathname also covers browser back/forward navigation.
    void window.umami.track((payload) => ({
      ...payload,
      url,
      title: document.title,
      referrer: cleanReferrer?.toString() || "",
    })).then(() => {
      umamiClient.invalidateStats();
      window.dispatchEvent(new Event(UMAMI_PAGEVIEW_EVENT));
    }).catch(() => {
      // Analytics failures must never interrupt reading or navigation.
    });
  }, [pathname, ready]);

  if (!umamiConfig.enabled) return null;

  return (
    <Script
      id="umami-tracker"
      src={`${umamiConfig.url}/script.js`}
      strategy="afterInteractive"
      data-website-id={umamiConfig.websiteId}
      data-host-url={umamiConfig.url}
      data-domains={umamiConfig.domains.join(",")}
      data-auto-track="false"
      data-exclude-search="true"
      data-exclude-hash="true"
      onReady={() => setReady(true)}
    />
  );
}
