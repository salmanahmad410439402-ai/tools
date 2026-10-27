import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES } from "@/data/site";
import { buildMetadata } from "@/lib/seo";
import { CategoryPage } from "@/components/CategoryPage";

const category = CATEGORIES.find((entry) => entry.slug === "utilities")!;

export const metadata: Metadata = buildMetadata({
  title: category.title,
  description: category.metaDescription,
  path: "/utilities/",
});

const faqs = [
  {
    q: "Are these utilities really free?",
    a: "Yes, and there is nothing to meter. A word count or a QR code has no server cost because it never reaches a server, so there is no account, no limit and no “pro” tier hiding the useful part.",
  },
  {
    q: "Do they work offline?",
    a: "Yes, after the first visit. Every utility is a static page with the logic bundled in, so counting words or generating a code works with no connection at all — which is also a reasonable test that nothing is being uploaded.",
  },
  {
    q: "Is my text or link stored anywhere?",
    a: "No. The page keeps your input in memory while it is open, and closing the tab discards it. There is no draft history, no database and no analytics event containing your content.",
  },
  {
    q: "Why are there only four utilities?",
    a: "Because four that work properly are better than twenty thin pages. Each one here documents its real behaviour and its limits, and more will be added only when they are genuinely useful rather than to pad a list.",
  },
  {
    q: "Can I request a different utility?",
    a: "Yes — requests genuinely set the order. Use the contact page and describe the job you are trying to do rather than just the tool name; that usually reveals the right tool, which is not always the obvious one.",
  },
  {
    q: "Do these utilities use cookies or track me?",
    a: "No tracking by default. The optional analytics switch is off unless it is enabled at build time, and even then it records only a page view and a tool name — never your text, a link you encoded or an image.",
  },
];

export default function UtilitiesPage() {
  return (
    <CategoryPage
      category={category}
      faqs={faqs}
      intro={
        <>
          <h2>Small tools that respect the size of the job</h2>
          <p>
            A word count should not require an account, and a QR code should not route through somebody else's
            redirect service. These four utilities do one thing each, in a single page, with no upload, no sign-up
            and no usage meter.
          </p>
          <p>
            The <strong>QR code generator</strong> produces a real, standards-compliant symbol you can download as
            vector SVG or an exact-size PNG — and because there is no redirect in the middle, the code keeps working
            for as long as its destination does. The <strong>word and character counter</strong> counts as you type
            and checks your text against the limits that actually reject submissions: 280 characters for a post, 155
            for a meta description, 160 for an SMS.
          </p>

          <h2>Why “runs in your browser” matters for text</h2>
          <p>
            Unpublished drafts are some of the most sensitive text people handle: a client's press release, a
            resignation letter, an article embargoed until Friday. Pasting those into a web form means trusting
            whatever that site does with them. Here the counting, the casing and the filler generation happen in the
            tab, and closing it leaves nothing behind.
          </p>
          <p>
            The same applies to the link you turn into a QR code. Most generators replace your URL with their own
            short link so they can count scans — which is a legitimate product, but it also means every scan passes
            through their server, and the code dies if they do. This one encodes your text directly.
          </p>

          <h2>What these tools deliberately do not do</h2>
          <p>
            The <strong>case converter</strong> applies English casing rules, so German nouns and French title
            conventions may need a manual fix, and scripts without letter case pass through unchanged. The{" "}
            <strong>lorem ipsum generator</strong> makes paragraphs, not lists or tables, and its Latin is vocabulary
            rather than grammar — it is for judging layout, never for publishing.
          </p>
          <p>
            If a utility you need is missing,{" "}
            <Link href="/contact/" className="link">
              describe the job you are trying to do
            </Link>{" "}
            and it may be the next one built.
          </p>
        </>
      }
    />
  );
}
