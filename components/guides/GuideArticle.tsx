import type { Metadata } from "next";
import Link from "next/link";
import type { Guide } from "@/data/guides";
import { tools } from "@/data/tools";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { AdSlot } from "@/components/AdSlot";
import { SITE_NAME, SITE_URL } from "@/data/site";

/**
 * Article template for /blog/[slug].
 *
 * The route itself is added in the same commit as the first guide, because
 * Next's static export refuses a dynamic route whose generateStaticParams()
 * returns an empty list. To switch it on, create app/blog/[slug]/page.tsx:
 *
 *   import { guideBySlug, guides } from "@/data/guides";
 *   import { GuideArticle, guideMetadata } from "@/components/guides/GuideArticle";
 *   import { notFound } from "next/navigation";
 *
 *   export const dynamicParams = false;
 *   export function generateStaticParams() { return guides.map(g => ({ slug: g.slug })); }
 *   export async function generateMetadata({ params }) {
 *     const { slug } = await params;
 *     const guide = guideBySlug(slug);
 *     return guide ? guideMetadata(guide) : {};
 *   }
 *   export default async function Page({ params }) {
 *     const { slug } = await params;
 *     const guide = guideBySlug(slug);
 *     if (!guide) notFound();
 *     return <GuideArticle guide={guide} />;
 *   }
 */
export function guideMetadata(guide: Guide): Metadata {
  return buildMetadata({
    title: guide.title,
    description: guide.excerpt,
    path: `/blog/${guide.slug}/`,
    type: "article",
    publishedTime: guide.date,
    modifiedTime: guide.updated ?? guide.date,
  });
}

export function GuideArticle({ guide }: { guide: Guide }) {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Guides", path: "/blog/" },
    { name: guide.title, path: `/blog/${guide.slug}/` },
  ];

  const relatedTools = tools.filter((tool) => guide.relatedTools.includes(tool.slug));
  const midpoint = Math.ceil(guide.body.length / 2);

  return (
    <>
      <StructuredData
        data={[
          breadcrumbJsonLd(crumbs),
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: guide.title,
            description: guide.excerpt,
            datePublished: guide.date,
            dateModified: guide.updated ?? guide.date,
            mainEntityOfPage: `${SITE_URL}/blog/${guide.slug}/`,
            author: { "@type": "Organization", name: SITE_NAME },
            publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
            inLanguage: "en",
          },
        ]}
      />

      <div className="container-page pb-16 pt-6 sm:pt-8">
        <Breadcrumbs crumbs={crumbs} />
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
          <article className="min-w-0">
            <header className="max-w-prose">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-brand-600">
                {guide.readingMinutes} min read ·{" "}
                {new Date(guide.date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <h1 className="mt-3 text-[30px] font-extrabold leading-[1.14] tracking-[-0.025em] text-ink sm:text-[38px]">
                {guide.title}
              </h1>
              <p className="mt-3 text-[16.5px] leading-relaxed text-body">{guide.excerpt}</p>
            </header>

            <div className="article mt-8 max-w-prose">
              {guide.body.map((block, index) => {
                const ad =
                  index === midpoint ? (
                    // One ad roughly halfway through the article, never in the
                    // first screen and never between a heading and its content.
                    <AdSlot key="article-ad" variant="inline" className="my-10" />
                  ) : null;

                const element = (() => {
                  if (block.type === "h2") return <h2 key={index}>{block.text}</h2>;
                  if (block.type === "h3") return <h3 key={index}>{block.text}</h3>;
                  if (block.type === "p") return <p key={index}>{block.text}</p>;
                  if (block.type === "ul")
                    return (
                      <ul key={index}>
                        {block.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    );
                  if (block.type === "ol")
                    return (
                      <ol key={index}>
                        {block.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ol>
                    );
                  return <blockquote key={index}>{block.text}</blockquote>;
                })();

                return (
                  <div key={index} className="contents">
                    {ad}
                    {element}
                  </div>
                );
              })}
            </div>

            <div className="mt-10 rounded-card border border-line bg-surface p-5">
              <p className="text-[13.5px] leading-relaxed text-body">
                Written and reviewed by the {SITE_NAME} team. Found something wrong or out of date?{" "}
                <Link href="/contact/" className="link">
                  Tell us
                </Link>{" "}
                and we will correct it and update the review date.
              </p>
            </div>
          </article>

          <aside className="lg:sticky lg:top-[88px] lg:self-start" aria-label="Tools mentioned in this guide">
            <div className="rounded-card border border-line bg-surface p-5">
              <h2 className="text-[12px] font-bold uppercase tracking-[0.12em] text-ink">Tools in this guide</h2>
              <ul className="mt-3 space-y-2">
                {relatedTools.map((tool) => (
                  <li key={tool.slug}>
                    <Link href={`/${tool.slug}/`} className="text-[13.5px] font-medium text-body hover:text-brand-600">
                      {tool.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/tools/" className="mt-3 inline-block text-[12.5px] font-semibold text-brand-600 hover:text-brand-700">
                All tools →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
