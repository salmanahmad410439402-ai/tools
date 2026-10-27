import { ANALYTICS_DOMAIN, ANALYTICS_SCRIPT_URL } from "@/data/site";

type EventProps = Record<string, string | number | boolean>;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: EventProps }) => void;
    umami?: { track: (event: string, data?: EventProps) => void };
  }
}

/**
 * Cookie-free analytics hook. Deliberately tiny: no file names, no file sizes
 * beyond coarse buckets and never any file content.
 */
export function track(event: string, props: EventProps = {}) {
  if (typeof window === "undefined") return;
  try {
    window.plausible?.(event, { props });
    window.umami?.track(event, props);
  } catch {
    /* analytics must never break a tool */
  }
}

/** Coarse size bucket so a tool_completed event carries no identifying detail. */
export function sizeBucket(bytes: number): string {
  if (bytes < 100_000) return "<100KB";
  if (bytes < 1_000_000) return "100KB-1MB";
  if (bytes < 10_000_000) return "1-10MB";
  if (bytes < 50_000_000) return "10-50MB";
  return ">50MB";
}

export const analyticsEnabled = Boolean(ANALYTICS_SCRIPT_URL && ANALYTICS_DOMAIN);
