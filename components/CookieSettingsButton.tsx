"use client";

import { clearConsent } from "@/lib/consent";

/**
 * Re-opens the consent panel. Clearing the stored choice is enough: the banner
 * subscribes to the change event, so no page reload and no shared state needed.
 */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={clearConsent} className={className}>
      Cookie settings
    </button>
  );
}
