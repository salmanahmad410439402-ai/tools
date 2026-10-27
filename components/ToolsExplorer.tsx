"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { Tool } from "@/lib/tool-types";
import { CATEGORIES } from "@/data/site";
import { roadmap } from "@/data/roadmap";
import { ToolCard } from "@/components/ToolCard";
import { cn } from "@/lib/utils";

export function ToolsExplorer({ tools }: { tools: Tool[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const cat = params.get("category");
    if (q) setQuery(q);
    if (cat && CATEGORIES.some((entry) => entry.slug === cat)) setCategory(cat);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools.filter((tool) => {
      const matchesCategory =
        category === "all" ||
        (category === "convert-to-pdf" ? tool.group === "create" : tool.category === category);
      if (!matchesCategory) return false;
      if (!q) return true;
      const haystack = [
        tool.name,
        tool.tagline,
        tool.bestFor,
        tool.keywords.join(" "),
        tool.inputFormats.join(" "),
        tool.outputFormats.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return q.split(/\s+/).every((term) => haystack.includes(term));
    });
  }, [tools, query, category]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: tools.length };
    for (const entry of CATEGORIES) {
      map[entry.slug] =
        entry.slug === "convert-to-pdf"
          ? tools.filter((tool) => tool.group === "create").length
          : tools.filter((tool) => tool.category === entry.slug).length;
    }
    return map;
  }, [tools]);

  const plannedFor = category === "all" ? roadmap : roadmap.filter((item) => item.category === category);

  return (
    <div>
      <div className="glass-panel p-4 shadow-card sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
            <label htmlFor="tool-search" className="sr-only">
              Search tools
            </label>
            <input
              id="tool-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by task: compress, jpg to png, heic, iphone…"
              className="h-11 w-full rounded-xl border border-line bg-raised pl-9 pr-9 text-[14px] text-ink shadow-inset outline-none transition-colors placeholder:text-subtle focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-subtle hover:bg-surface hover:text-ink"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
          <p className="inline-flex items-center gap-1.5 text-[12.5px] text-subtle">
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            {filtered.length} of {tools.length} tools shown
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {[{ slug: "all", name: "All tools" }, ...CATEGORIES.filter((entry) => !entry.hidden)].map((entry) => {
            const active = category === entry.slug;
            return (
              <button
                key={entry.slug}
                type="button"
                onClick={() => setCategory(entry.slug)}
                aria-pressed={active}
                className={cn(
                  "inline-flex min-h-[38px] items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-semibold transition-colors",
                  active
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-line bg-raised text-body hover:border-primary/40 hover:text-ink",
                )}
              >
                {entry.name}
                <span className={cn("rounded-full px-1.5 py-0.5 text-[10.5px]", active ? "bg-white/25" : "bg-surface text-subtle")}>
                  {counts[entry.slug] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-card border border-dashed border-line bg-surface p-8 text-center">
          <p className="text-[15px] font-semibold text-ink">No tool matches “{query}”.</p>
          <p className="mx-auto mt-1 max-w-md text-[13.5px] leading-relaxed text-subtle">
            Try a different word, like “pdf”, “png” or “compress” — or check the planned list below to see
            whether the tool you need exists yet.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
            className="btn-secondary mt-4"
          >
            Clear filters
          </button>
        </div>
      )}

      {plannedFor.length > 0 && (
        <section className="mt-12" aria-labelledby="planned">
          <h2 id="planned" className="text-[20px] font-bold tracking-tight text-ink">
            Planned, not built yet
          </h2>
          <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-body">
            These are written down so you can see the direction of travel — they have no pages and no
            pretend screenshots. A tool appears in the list above on the day it actually works.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {plannedFor.map((item) => (
              <li key={item.name} className="rounded-xl border border-dashed border-line bg-raised px-3 py-2.5">
                <p className="text-[13px] font-medium text-body">{item.name}</p>
                {item.note && <p className="text-[11.5px] text-subtle">{item.note}</p>}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[12.5px] text-subtle">
            Need something specific?{" "}
            <Link href="/contact/" className="link">
              Ask for it
            </Link>{" "}
            — requests decide the order.
          </p>
        </section>
      )}
    </div>
  );
}
