import Script from "next/script";
import { ADSENSE_PUBLISHER_ID, ADS_ENABLED, ADS_SLOT_INLINE, ADS_SLOT_SIDEBAR, ADS_SLOT_TOOL_TOP } from "@/data/site";
import { cn } from "@/lib/utils";

/**
 * Manual ad units only (Auto ads are assumed to be off in the AdSense account).
 *
 * Rules enforced here:
 *  - nothing renders while ADS_ENABLED is false, and no ad request is made;
 *  - space is reserved so the page does not jump (CLS);
 *  - every unit is labelled "Advertisement";
 *  - units below the fold are lazy via loading="lazy" on the iframe inside
 *    the async AdSense push (AdSense handles the rest);
 *  - never placed inside the dropzone, between options and the primary button,
 *    or beside a download button — that is enforced by the page layout.
 */
type AdVariant = "leaderboard" | "inline" | "sidebar";

const HEIGHTS: Record<AdVariant, { h: number; slot: string }> = {
  leaderboard: { h: 100, slot: ADS_SLOT_TOOL_TOP },
  inline: { h: 280, slot: ADS_SLOT_INLINE },
  sidebar: { h: 600, slot: ADS_SLOT_SIDEBAR },
};

export function AdSlot({
  variant = "inline",
  className,
}: {
  variant?: AdVariant;
  className?: string;
}) {
  if (!ADS_ENABLED) return null;

  const { h, slot } = HEIGHTS[variant];
  const width = variant === "sidebar" ? 300 : 728;
  const height = variant === "sidebar" ? 600 : 90;

  if (!slot) {
    // Enabled but no unit ID configured yet: fail quietly rather than crash.
    return null;
  }

  return (
    <aside
      className={cn("my-8 flex flex-col items-center gap-2", className)}
      aria-label="Advertisement"
      style={{ minHeight: h }}
    >
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-subtle">Advertisement</span>
      <div style={{ width: "100%", maxWidth: width, minHeight: height }}>
        <ins
          className="adsbygoogle block"
          style={{ display: "block", minHeight: height }}
          data-ad-client={ADSENSE_PUBLISHER_ID}
          data-ad-slot={slot}
          data-full-width-responsive="true"
        />
      </div>
      <AdPush />
    </aside>
  );
}

function AdPush() {
  return (
    <Script id="adsbygoogle-push" strategy="lazyOnload">
      {`(adsbygoogle = window.adsbygoogle || []).push({});`}
    </Script>
  );
}
