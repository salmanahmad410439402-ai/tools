import { track as vercelTrack } from "@vercel/analytics";
import { VERCEL_ANALYTICS_ENABLED } from "@/data/site";
import { readConsent } from "@/lib/consent";

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
 *
 * Vercel Analytics receives the event through its own queue (`window.va`), which
 * the injected script drains; the other backends receive it from their globals.
 * Everything is wrapped so a blocked script can never break a tool.
 */
export function track(event: string, props: EventProps = {}) {
  if (typeof window === "undefined") return;
  // Nothing is measured without an explicit "Allow" in the consent panel.
  if (!readConsent()?.analytics) return;
  try {
    if (VERCEL_ANALYTICS_ENABLED) vercelTrack(event, props);
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
