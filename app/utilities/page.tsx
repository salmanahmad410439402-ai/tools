import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES } from "@/data/site";
import { buildMetadata } from "@/lib/seo";
import { CategoryPage } from "@/components/CategoryPage";
import { roadmap } from "@/data/roadmap";

const category = CATEGORIES.find((entry) => entry.slug === "utilities")!;

/**
 * This category has no live tools yet. Until Step 5 ships the four utilities
 * this page stays out of the index (a real page with an empty catalogue is a
 * thin page, and thin pages are an AdSense liability). Flip `noindex` to false
 * in the same commit that adds the first utility.
 */
export const metadata: Metadata = buildMetadata({
  title: category.title,
  description: category.metaDescription,
  path: "/utilities/",
  noindex: true,
});

const faqs = [
  {
    q: "Are the utilities planned here really free?",
    a: "Yes, and they will run locally like everything else on the site. A word counter or a QR generator has no server cost at all, so there is nothing to charge for.",
  },
  {
    q: "When will they be available?",
    a: "They are the fifth build step. The site ships in stages so each tool gets a tested page and real written documentation instead of appearing as an empty shell.",
  },
  {
    q: "Can I request a different utility?",
    a: "Please do — requests genuinely set the order. Use the contact page and describe the job you are trying to do, not just the tool name; that usually reveals a better way to solve it.",
  },
  {
    q: "Why is this page not in Google yet?",
    a: "Because a category page with no tools in it is a thin page. It is excluded from search and from the sitemap until the first utility is live.",
  },
];

export default function UtilitiesPage() {
  const planned = roadmap.filter((item) => item.category === "utilities");
  return (
    <CategoryPage
      category={category}
      faqs={faqs}
      intro={
        <>
          <h2>What is coming to this category</h2>
          <p>
            Four small tools are planned: a <strong>QR code generator</strong> that writes real, scannable
            codes without a redirect service in the middle; a <strong>word and character counter</strong> with
            the limits of common platforms built in; a <strong>case converter</strong> that handles sentence,
            title, upper, lower and slug case; and a <strong>Lorem ipsum generator</strong> with paragraph,
            sentence and list output.
          </p>
          <p>
            They are listed rather than linked because they do not exist yet. A “coming soon” page that ranks
            in search and then does nothing is worse than no page at all — for you and for the site.
          </p>

          <h2>Why these four</h2>
          <p>
            Each of them replaces something people currently do with a sketchy website, an app install or a
            spreadsheet formula. All four are small enough to run instantly, offline and without a server, which
            means they can be genuinely free with no usage meter.
          </p>
          <p>
            The planned list below shows exactly what is in the queue ({planned.length} items). If something you
            need is missing,{" "}
            <Link href="/contact/" className="link">
              tell us the job you are trying to do
            </Link>
            .
          </p>
        </>
      }
    />
  );
}
