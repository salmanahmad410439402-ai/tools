import Script from "next/script";
import { ANALYTICS_DOMAIN, ANALYTICS_SCRIPT_URL } from "@/data/site";

/**
 * Optional, cookie-free page-view analytics (Plausible or Umami compatible).
 * Disabled until NEXT_PUBLIC_ANALYTICS_SCRIPT_URL is set, so the default build
 * sends nothing anywhere and needs no consent banner.
 */
export function Analytics() {
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
