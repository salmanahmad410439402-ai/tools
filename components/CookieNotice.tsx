"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";
import { ANALYTICS_DOMAIN, ANALYTICS_SCRIPT_URL, ADS_ENABLED, VERCEL_ANALYTICS_ENABLED } from "@/data/site";
import { readConsent, subscribeConsent, writeConsent, type ConsentRecord } from "@/lib/consent";

/**
 * Consent panel, styled like the rest of the product: a floating navy glass card
 * anchored to the bottom of the viewport.
 *
 * It is deliberately NOT modal: no overlay, no scroll lock, no focus trap, and
 * every tool keeps working whether you accept, decline or ignore it. Nothing is
 * pre-ticked — analytics and advertising load only after "Allow".
 *
 * The labels follow what the build can actually do, so the panel never offers a
 * choice that does not exist (see ANALYTICS_* / ADS_ENABLED in data/site.ts).
 */
export function CookieNotice() {
  const [consent, setConsent] = useState<ConsentRecord | null | undefined>(undefined);

  useEffect(() => {
    setConsent(readConsent());
    return subscribeConsent(setConsent);
  }, []);

  // Escape behaves like closing the panel: essential storage only.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && readConsent() === null) writeConsent("essential");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const analyticsAvailable = VERCEL_ANALYTICS_ENABLED || Boolean(ANALYTICS_SCRIPT_URL && ANALYTICS_DOMAIN);
  const adsAvailable = ADS_ENABLED;
  const anythingToAllow = analyticsAvailable || adsAvailable;

  // undefined = still reading storage (render nothing, avoid a flash);
  // a saved record = the visitor already decided, so stay hidden.
  if (consent === undefined || consent) return null;

  const allowLabel = analyticsAvailable && adsAvailable
    ? "Allow analytics and ads"
    : analyticsAvailable
      ? "Allow analytics"
      : adsAvailable
        ? "Allow ads"
        : "Got it";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-6 sm:pb-5">
      <div
        role="region"
        aria-labelledby="cookie-notice-title"
        className="glass-panel pointer-events-auto relative mx-auto w-full max-w-4xl animate-fade-up rounded-[20px] p-5 pr-12 shadow-[0_28px_80px_-32px_rgba(0,0,0,0.9)] sm:p-6 sm:pr-14"
      >
        <button
          type="button"
          onClick={() => writeConsent("essential")}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-subtle transition-colors hover:bg-surface hover:text-ink sm:right-4 sm:top-4"
          aria-label="Close and keep only essential storage"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="flex items-start gap-3.5 sm:gap-4">
          <span className="hidden h-11 w-11 shrink-0 place-items-center rounded-xl border border-primary/25 bg-primary/10 text-brand-600 sm:grid">
            <Cookie className="h-5 w-5" aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <h2 id="cookie-notice-title" className="text-[15.5px] font-bold leading-tight text-ink sm:text-[16.5px]">
              {anythingToAllow ? "Cookies for analytics and ads" : "Cookies and site storage"}
            </h2>

            <p className="mt-2 text-[13.5px] leading-relaxed text-body sm:text-[14.5px]">
              {anythingToAllow ? (
                <>
                  We use cookie-free analytics to see which tools people open
                  {adsAvailable ? ", and Google AdSense to show ads" : ""}. Both stay switched off until you say
                  otherwise — declining is just as easy as accepting, and you can change your mind later from the
                  footer. See the{" "}
                  <Link href="/cookie-policy/" className="link">
                    Cookie Policy
                  </Link>
                  .
                </>
              ) : (
                <>
                  This build loads no analytics and no ads, so there is nothing here to consent to. Two small
                  preferences — this notice and your light or dark choice — are stored in your browser. Files you
                  open never leave your device. See the{" "}
                  <Link href="/cookie-policy/" className="link">
                    Cookie Policy
                  </Link>
                  .
                </>
              )}
            </p>

            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => writeConsent("all")}
                className="btn-primary h-11 w-full px-5 text-[14px] sm:w-auto"
              >
                {allowLabel}
              </button>
              {anythingToAllow && (
                <button
                  type="button"
                  onClick={() => writeConsent("essential")}
                  className="btn-secondary h-11 w-full px-5 text-[14px] sm:w-auto"
                >
                  Essential cookies only
                </button>
              )}
            </div>

            <p className="mt-3 text-[12px] leading-relaxed text-minimal sm:text-[12.5px]">
              {anythingToAllow
                ? "Closing this leaves both switched off. Essential storage is only what the site needs to work."
                : "Nothing is sent anywhere. Essential storage is only what the site needs to work."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
