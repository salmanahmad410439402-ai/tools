import Link from "next/link";
import { SITE_NAME } from "@/data/site";
import { cn } from "@/lib/utils";

/**
 * Wordmark: an indigo rounded tile holding a stacked page glyph, followed by
 * the site name. The mark is drawn in SVG so it stays crisp at every size.
 */
export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5 rounded-lg text-ink", className)}
      aria-label={`${SITE_NAME} home`}
    >
      <span className="relative grid h-9 w-9 place-items-center rounded-[11px] bg-brand-500 text-white shadow-[0_6px_16px_-8px_rgba(79,70,229,0.9)] transition-colors group-hover:bg-brand-600">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 3.75h6.2L18 8.55V19.5a1.75 1.75 0 0 1-1.75 1.75H7A1.75 1.75 0 0 1 5.25 19.5v-14A1.75 1.75 0 0 1 7 3.75Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M13 3.9V9h5.1" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M8.6 13.2h6.2M8.6 16.4h4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[17px] font-bold tracking-[-0.02em] text-ink">{SITE_NAME}</span>
        {!compact && (
          <span className="mt-1 hidden text-[10.5px] font-semibold uppercase tracking-[0.14em] text-subtle sm:block">
            Browser file tools
          </span>
        )}
      </span>
    </Link>
  );
}
