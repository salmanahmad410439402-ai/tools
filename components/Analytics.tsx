"use client";

import Script from "next/script";
import dynamic from "next/dynamic";
import { ANALYTICS_DOMAIN, ANALYTICS_SCRIPT_URL, VERCEL_ANALYTICS_ENABLED } from "@/data/site";

/**
 * Vercel Analytics, loaded lazily and only when the build enables it. The
 * component injects `/_vercel/insights/script.js` on the client (that file is
 * served by the Vercel deployment itself, which is why this is opt-in for other
 * hosts), so keeping it out of the initial bundle costs nothing when it is off.
 */
const VercelAnalytics = dynamic(() => import("@vercel/analytics/next").then((mod) => mod.Analytics), {
  ssr: false,
});

/**
 * Cookie-free page-view analytics. Nothing loads unless one of the two options
 * in data/site.ts is configured, so the default build sends nothing anywhere and
 * needs no consent banner.
 *
 * Both options are cookieless and see no file data. lib/analytics.ts is the only
 * place that emits events, and it sends just the tool slug plus a coarse size
 * bucket — never a file name, never a file.
 */
export function Analytics() {
  if (VERCEL_ANALYTICS_ENABLED) return <VercelAnalytics mode="production" />;

  if (!ANALYTICS_SCRIPT_URL || !ANALYTICS_DOMAIN) return null;

  const isUmami = ANALYTICS_SCRIPT_URL.includes("umami");
  return (
    <Script
      defer
      data-domain={isUmami ? undefined : ANALYTICS_DOMAIN}
      data-website-id={isUmami ? ANALYTICS_DOMAIN : undefined}
      src={ANALYTICS_SCRIPT_URL}
      strategy="afterInteractive"
    />
  );
}
