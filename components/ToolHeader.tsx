"use client";

import { Check, Minimize2 } from "lucide-react";
import { ToolIcon } from "./icons";
import { useToolFocus } from "./ToolFocusShell";

const TRUST_POINTS = ["Runs in your browser", "No sign-up", "No watermark", "Free"];

/**
 * The tool page header: badge, H1, one line of promise, four trust points.
 *
 * It is a client component only so that it can shrink while a document is open
 * (see `ToolFocusShell`). The H1 is always the same single element — in the
 * compact state the badge, tagline and trust list collapse and the heading sits
 * in one sticky line beside the way back out of full-width mode.
 */
export function ToolHeader({
  h1,
  tagline,
  icon,
  category,
}: {
  h1: string;
  tagline: string;
  icon: string;
  category: string;
}) {
  const { focused, setFocused } = useToolFocus();
  const kind = category === "image-tools" ? "image" : "PDF";

  if (focused) {
    return (
      <div className="sticky top-[68px] z-30 -mx-1 flex items-center gap-2 rounded-xl border border-line bg-page/90 px-2.5 py-1.5 backdrop-blur-xl">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100">
          <ToolIcon name={icon} className="h-3.5 w-3.5" />
        </span>
        <h1 className="min-w-0 flex-1 truncate text-[13px] font-semibold tracking-[-0.01em] text-body">{h1}</h1>
        <button
          type="button"
          onClick={() => setFocused(false)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1 text-[11.5px] font-semibold text-body transition-colors hover:border-primary/45 hover:text-brand-600"
        >
          <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
          Exit full-width view
        </button>
      </div>
    );
  }

  return (
    <header className="max-w-2xl">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
          <ToolIcon name={icon} className="h-4.5 w-4.5" />
        </span>
        <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-brand-600">Free {kind} tool</p>
      </div>

      <h1 className="mt-3 text-[28px] font-extrabold leading-[1.14] tracking-[-0.025em] text-ink sm:text-[36px]">
        {h1}
      </h1>
      <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-body">{tagline}</p>

      <ul className="mt-3.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] font-medium text-body">
        {TRUST_POINTS.map((point) => (
          <li key={point} className="inline-flex items-center gap-1.5">
            <span className="grid h-4 w-4 place-items-center rounded-full bg-success/10 text-success">
              <Check className="h-3 w-3" aria-hidden="true" />
            </span>
            {point}
          </li>
        ))}
      </ul>
    </header>
  );
}
