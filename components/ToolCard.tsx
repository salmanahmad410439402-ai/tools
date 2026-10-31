import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Tool } from "@/lib/tool-types";
import { ToolIcon } from "./icons";
import { cn } from "@/lib/utils";

export function ToolCard({ tool, className, compact = false }: { tool: Tool; className?: string; compact?: boolean }) {
  return (
    <article
      className={cn(
        "card card-hover group relative flex h-full flex-col p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="card-icon grid h-11 w-11 place-items-center rounded-xl border border-line bg-surface text-body">
          <ToolIcon name={tool.icon} className="h-5 w-5" />
        </span>
        <span className="flex items-center gap-1.5">
          {tool.isNew && (
            <span className="pill-emerald uppercase tracking-wide">New</span>
          )}
          <span className="pill uppercase tracking-wide">Free</span>
        </span>
      </div>

      <h3 className="card-title mt-4 text-[16.5px] font-bold tracking-tight text-ink">
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
        <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-body">
          Open
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}
