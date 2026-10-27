import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { categoryBySlug, SITE_NAME, type Category } from "@/data/site";
import { toolsForCategory } from "@/data/tools";
import { roadmap } from "@/data/roadmap";
import { breadcrumbJsonLd, collectionJsonLd } from "@/lib/jsonld";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { ToolCard } from "@/components/ToolCard";
import { AdSlot } from "@/components/AdSlot";
import { ToolIcon } from "@/components/icons";
import { Faq } from "@/components/Faq";

interface Props {
  category: Category;
  intro: React.ReactNode;
  faqs: { q: string; a: string }[];
}

export function CategoryPage({ category, intro, faqs }: Props) {
  const items = toolsForCategory(category.slug);
  const planned = roadmap.filter((item) => item.category === category.slug);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "All tools", path: "/tools/" },
    { name: category.name, path: `/${category.slug}/` },
  ];

  return (
    <>
      <StructuredData
        data={[
          breadcrumbJsonLd(crumbs),
          collectionJsonLd({
            name: category.name,
            description: category.metaDescription,
            path: `/${category.slug}/`,
            items: items.map((tool) => ({ name: tool.name, url: `/${tool.slug}/` })),
          }),
        ]}
      />

      <div className="container-page pb-16 pt-6 sm:pt-8">
        <Breadcrumbs crumbs={crumbs} />

        <header className="max-w-3xl">
          <p className="eyebrow">
            <ToolIcon name={category.icon} className="h-3.5 w-3.5" />
            {category.name}
          </p>
          <h1 className="mt-3 text-[30px] font-extrabold leading-[1.12] tracking-[-0.025em] text-ink sm:text-[40px]">
            {category.heading}
          </h1>
          <div className="mt-3 space-y-2.5 text-[15.5px] leading-relaxed text-body">
            {category.intro.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>
          <dl className="mt-5 grid max-w-lg grid-cols-3 gap-3">
            {category.facts.map((fact) => (
              <div key={fact.label} className="rounded-xl border border-line bg-raised px-3 py-2.5">
                <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-subtle">{fact.label}</dt>
                <dd className="mt-0.5 text-[13.5px] font-semibold text-ink">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </header>

        <h2 className="mt-10 text-[20px] font-bold tracking-tight text-ink">
          {items.length > 0
            ? `${items.length} ${items.length === 1 ? "tool" : "tools"} available now`
            : "Not live yet — here is what is planned"}
        </h2>
        {items.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-card border border-dashed border-line bg-surface p-6 text-[14px] text-body">
            No tools in this category are finished yet. The planned list below shows what is coming.
          </p>
        )}

        <AdSlot variant="leaderboard" className="mt-10" />

        <div className="article mt-10 max-w-prose">{intro}</div>

        <Faq items={faqs} heading={`${category.name}: common questions`} />

        {planned.length > 0 && (
          <section className="mt-12" aria-labelledby="category-planned">
            <h2 id="category-planned" className="text-[20px] font-bold tracking-tight text-ink">
              Planned for this category
            </h2>
            <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-body">
              No pages exist for these yet — they are listed so the roadmap is public. Each gets its own page
              when the tool actually works, not before.
            </p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {planned.map((item) => (
                <li key={item.name} className="rounded-xl border border-dashed border-line bg-raised px-3 py-2.5 text-[13px] text-body">
                  {item.name}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-12 rounded-card border border-line bg-surface p-6">
          <h2 className="text-[18px] font-bold text-ink">Other categories</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {["pdf-tools", "convert-to-pdf", "image-tools", "utilities"]
              .filter((slug) => slug !== category.slug)
              .map((slug) => {
                const other = categoryBySlug(slug) as Category;
                return (
                  <Link
                    key={slug}
                    href={`/${slug}/`}
                    className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-line bg-raised px-3 text-[13.5px] font-medium text-body transition-colors hover:border-primary/40 hover:text-brand-600"
                  >
                    <ToolIcon name={other.icon} className="h-4 w-4" />
                    {other.name}
                    <ChevronRight className="h-3.5 w-3.5 text-subtle" aria-hidden="true" />
                  </Link>
                );
              })}
            <Link
              href="/tools/"
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 text-[13.5px] font-semibold text-brand-700"
            >
              Browse all {SITE_NAME} tools
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
