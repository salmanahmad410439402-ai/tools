"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { ADSENSE_PUBLISHER_ID, ADSENSE_SCRIPT_ENABLED } from "@/data/site";
import { readConsent, subscribeConsent, type ConsentRecord } from "@/lib/consent";

/**
 * The AdSense library, injected only after the visitor allows advertising.
 *
 * Set NEXT_PUBLIC_ADSENSE_SCRIPT=on to load it without consent — Google's review
 * sometimes wants the snippet present before approval, and the EEA/UK/CH consent
 * message is handled by Google's own certified CMP in that case.
 */
export function AdSenseScript() {
  const [consent, setConsent] = useState<ConsentRecord | null>(null);

  useEffect(() => {
    setConsent(readConsent());
    return subscribeConsent(setConsent);
  }, []);

  const forced = process.env.NEXT_PUBLIC_ADSENSE_SCRIPT === "on";
  if (!ADSENSE_SCRIPT_ENABLED) return null;
  if (!forced && !consent?.ads) return null;

  return (
    <Script
      id="adsbygoogle-lib"
      async
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`}
    />
  );
}
