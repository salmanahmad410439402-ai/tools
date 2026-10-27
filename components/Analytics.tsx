"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import dynamic from "next/dynamic";
import { ANALYTICS_DOMAIN, ANALYTICS_SCRIPT_URL, VERCEL_ANALYTICS_ENABLED } from "@/data/site";
import { readConsent, subscribeConsent, type ConsentRecord } from "@/lib/consent";

/**
 * Vercel Analytics, loaded lazily and only after the visitor allows analytics.
 * The component injects `/_vercel/insights/script.js` on the client (that file is
 * served by the Vercel deployment itself, which is why this is opt-in for other
 * hosts), so keeping it out of the initial bundle costs nothing when it is off.
 */
const VercelAnalytics = dynamic(() => import("@vercel/analytics/next").then((mod) => mod.Analytics), {
  ssr: false,
});

/**
 * Cookie-free measurement, mounted only when the build enables a provider AND the
 * visitor pressed "Allow". Declining keeps the site fully functional: the tools
 * run on the device and never depend on this.
 *
 * lib/analytics.ts is the only place that emits events — tool_started and
 * tool_completed, carrying just the tool slug, counts and a coarse size bucket.
 */
export function Analytics() {
  const [consent, setConsent] = useState<ConsentRecord | null>(null);

  useEffect(() => {
    setConsent(readConsent());
    return subscribeConsent(setConsent);
  }, []);

  if (!consent?.analytics) return null;

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
