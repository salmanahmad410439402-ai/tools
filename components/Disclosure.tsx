"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A <details> section that still works without JavaScript (crawlers see the
 * content, keyboard users can open it) but opens itself when a jump link or
 * another page points at its id.
 */
export function Disclosure({
  id,
  title,
  summary,
  children,
  defaultOpen = false,
  className,
}: {
  id: string;
  title: string;
  /** One line shown under the title inside the summary. */
  summary?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    const details = ref.current;
    if (!details) return;
    const maybeOpen = () => {
      if (window.location.hash === `#${id}`) {
        details.open = true;
        setOpen(true);
      }
    };
    maybeOpen();
    window.addEventListener("hashchange", maybeOpen);
    return () => window.removeEventListener("hashchange", maybeOpen);
  }, [id]);

  return (
    <details
      ref={ref}
      id={id}
      open={defaultOpen}
      onToggle={(event) => setOpen((event.currentTarget as HTMLDetailsElement).open)}
      className={cn("group mt-3 scroll-mt-24 overflow-hidden rounded-card border border-line bg-raised", className)}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 marker:hidden hover:bg-surface [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block text-[16px] font-bold tracking-tight text-ink">{title}</span>
          {summary && <span className="mt-0.5 block text-[13px] leading-relaxed text-subtle">{summary}</span>}
        </span>
        <ChevronDown
          className={cn(
            "mt-1 h-5 w-5 shrink-0 text-subtle transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </summary>
      <div className="border-t border-line px-5 py-4">{children}</div>
    </details>
  );
}
