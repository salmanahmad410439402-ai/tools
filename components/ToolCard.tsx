import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Tool } from "@/lib/tool-types";
import { ToolIcon } from "./icons";
import { cn } from "@/lib/utils";

export function ToolCard({ tool, className, compact = false }: { tool: Tool; className?: string; compact?: boolean }) {
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-card border border-line bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
          <ToolIcon name={tool.icon} className="h-5 w-5" />
        </span>
        <span className="flex items-center gap-1.5">
          {tool.isNew && (
            <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-success">
              New
            </span>
          )}
          <span className="rounded-full bg-surface px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-subtle ring-1 ring-line">
            Free
          </span>
        </span>
      </div>

      <h3 className="mt-4 text-[16.5px] font-bold tracking-tight text-ink">
        <Link href={`/${tool.slug}/`} className="focus:outline-none">
          {/* Whole card is clickable via this overlay, while the accessible
              name stays on the link itself. */}
          <span className="absolute inset-0 z-10 rounded-card" aria-hidden="true" />
          {tool.name}
        </Link>
      </h3>

      <p className="mt-1.5 text-[14px] leading-relaxed text-body">{tool.tagline}</p>

      {!compact && (
        <p className="mt-3 text-[13px] leading-relaxed text-subtle">
          <span className="font-semibold text-ink">Best used when:</span> {tool.bestFor.replace(/^You /, "you ")}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between pt-4">
        <span className="flex flex-wrap gap-1">
          {tool.outputFormats.slice(0, 3).map((format) => (
            <span
              key={format}
              className="rounded-md bg-surface px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-subtle ring-1 ring-line"
            >
              {format}
            </span>
          ))}
        </span>
        <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-600">
          Open
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}
