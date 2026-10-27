import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { tools } from "@/data/tools";
import { guides } from "@/data/guides";
import { ToolIcon } from "./icons";

/** Related tools + related guides. Both lists come from the tool registry. */
export function RelatedTools({ slugs, guideSlugs = [] }: { slugs: string[]; guideSlugs?: string[] }) {
  const related = slugs.map((slug) => tools.find((tool) => tool.slug === slug)).filter(Boolean);
  const relatedGuides = guideSlugs
    .map((slug) => guides.find((guide) => guide.slug === slug))
    .filter(Boolean);

  if (!related.length && !relatedGuides.length) return null;

  return (
    <section id="related" aria-labelledby="related-title" className="mt-14 scroll-mt-24">
      <h2 id="related-title" className="text-[22px] font-bold tracking-tight text-ink sm:text-2xl">
        Related tools &amp; guides
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {related.map((tool) => (
          <Link
            key={tool!.slug}
            href={`/${tool!.slug}/`}
            className="group flex items-start gap-3 rounded-xl border border-line bg-raised p-4 transition-colors hover:border-brand-200 hover:bg-brand-50/40"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100">
              <ToolIcon name={tool!.icon} className="h-4 w-4" />
            </span>
            <span>
              <span className="flex items-center gap-1 text-[14.5px] font-semibold text-ink">
                {tool!.name}
                <ArrowRight className="h-3.5 w-3.5 text-subtle transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
              <span className="mt-0.5 block text-[13px] leading-relaxed text-subtle">{tool!.tagline}</span>
            </span>
          </Link>
        ))}
        {relatedGuides.map((guide) => (
          <Link
            key={guide!.slug}
            href={`/blog/${guide!.slug}/`}
            className="group flex items-start gap-3 rounded-xl border border-line bg-raised p-4 transition-colors hover:border-brand-200 hover:bg-brand-50/40"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface text-subtle ring-1 ring-line">
              <ToolIcon name="FileText" className="h-4 w-4" />
            </span>
            <span>
              <span className="text-[14.5px] font-semibold text-ink">{guide!.title}</span>
              <span className="mt-0.5 block text-[13px] leading-relaxed text-subtle">{guide!.excerpt}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
