"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { ADS_ENABLED } from "@/data/site";

const STORAGE_KEY = "filecraft-cookie-notice";

/**
 * A small, non-blocking notice. It never covers the tool or blocks the page.
 *
 * Ad cookies are only relevant once ads are live, and for visitors in the EEA,
 * UK and Switzerland Google's own certified consent message (AdSense →
 * Privacy & messaging) collects consent before any ad cookie is set. This
 * banner only explains the situation and stores a dismissal flag locally —
 * that flag is not a cookie and is never sent anywhere.
 */
export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) !== "dismissed") setVisible(true);
    } catch {
      /* storage blocked — show nothing rather than nagging */
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "dismissed");
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      role="region"
      aria-label="Cookie information"
      className="fixed bottom-4 left-4 z-40 max-w-sm animate-fade-up rounded-xl border border-line bg-raised p-4 shadow-lift sm:bottom-6 sm:left-6"
    >
      <div className="flex items-start gap-3">
        <p className="text-[13px] leading-relaxed text-body">
          <strong className="font-semibold text-ink">No tracking by default.</strong>{" "}
          Files you open are processed on your device and never uploaded. We store one small
          preference in your browser, not a tracking cookie.{" "}
          {ADS_ENABLED ? (
            <>
              Ads are shown by Google, and visitors in the EEA, UK and Switzerland see Google&apos;s
              certified consent message first.{" "}
            </>
          ) : null}
          <Link href="/cookie-policy/" className="link">
            Cookie Policy
          </Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-subtle transition-colors hover:bg-surface hover:text-ink"
          aria-label="Dismiss cookie information"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
