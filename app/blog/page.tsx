import type { Metadata } from "next";
import Link from "next/link";
import { guides } from "@/data/guides";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { ArrowRight } from "lucide-react";
import { tools } from "@/data/tools";

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Guides", path: "/blog/" },
];

export const metadata: Metadata = buildMetadata({
  title: "Guides — PDF, Image Formats and File Sizes",
  description:
    "Practical guides to compressing, converting and sharing files: PDF size limits, image format comparisons, upload requirements and honest trade-offs.",
  path: "/blog/",
  // A guide index with no guides is a thin page; it is excluded until Step 5.
  noindex: guides.length === 0,
});

export default function BlogIndexPage() {
  return (
    <>
      <StructuredData data={breadcrumbJsonLd(crumbs)} />
      <div className="container-page pb-16 pt-6 sm:pt-8">
        <Breadcrumbs crumbs={crumbs} />
        <header className="max-w-3xl">
          <h1 className="text-[30px] font-extrabold leading-[1.12] tracking-[-0.025em] text-ink sm:text-[40px]">
            Guides to files, <span className="text-gradient-flow">formats and size limits</span>
          </h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-body">
            Long-form, hand-written explanations of the things tool pages only have room to summarise: how
            compression really works, which image format to pick, what “under 2 MB” means for each portal, and
            where a browser tool genuinely cannot help.
          </p>
        </header>

        {guides.length === 0 ? (
          <div className="mt-8 rounded-card border border-dashed border-line bg-surface p-8">
            <h2 className="text-[18px] font-bold text-ink">The first guides are being written</h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-body">
              Fifteen original guides ship in the next build step, each over 800 words and checked against real
              files. Until then this page is intentionally out of the index — an empty blog is a thin page, and
              thin pages are not worth ranking.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {tools.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/${tool.slug}/`}
                  className="group flex items-center justify-between rounded-xl border border-line bg-raised px-4 py-3 text-[13.5px] font-semibold text-ink transition-colors hover:border-primary/40"
                >
                  {tool.name}
                  <ArrowRight className="h-3.5 w-3.5 text-brand-500 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((guide) => (
              <article key={guide.slug} className="glass-panel card-hover p-5">
                <p className="text-[11.5px] font-semibold uppercase tracking-wide text-subtle">
                  {guide.readingMinutes} min read ·{" "}
                  {new Date(guide.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
                <h2 className="card-title mt-2 text-[16.5px] font-bold leading-snug text-ink">
                  <Link href={`/blog/${guide.slug}/`} className="focus:outline-none">
                    {/* Stretched link: the whole card is clickable, the name stays on the link. */}
                    <span className="absolute inset-0 z-10 rounded-card" aria-hidden="true" />
                    {guide.title}
                  </Link>
                </h2>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-body">{guide.excerpt}</p>
                <Link href={`/blog/${guide.slug}/`} className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-brand-600">
                  Read the guide
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
