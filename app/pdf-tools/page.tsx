import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CATEGORIES, SITE_NAME } from "@/data/site";
import { TOOL_GROUPS, tools, toolsByGroup, toolsForCategory } from "@/data/tools";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, collectionJsonLd } from "@/lib/jsonld";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { ToolCard } from "@/components/ToolCard";
import { AdSlot } from "@/components/AdSlot";
import { Faq } from "@/components/Faq";
import { ToolIcon } from "@/components/icons";

const category = CATEGORIES.find((entry) => entry.slug === "pdf-tools")!;

export const metadata: Metadata = buildMetadata({
  title: category.title,
  description: category.metaDescription,
  path: "/pdf-tools/",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "All tools", path: "/tools/" },
  { name: "PDF tools", path: "/pdf-tools/" },
];

const FAQS = [
  {
    q: "Why are all the PDF tools in one place?",
    a: "Because people do not think in categories. Someone who needs to compress a scan before emailing it, and someone who needs to turn a Word file into a PDF, are both trying to produce a document. Everything that opens, creates, changes or reads a PDF lives here, grouped by the job rather than split across separate menus.",
  },
  {
    q: "Do any of these tools upload my PDF?",
    a: "No. Files are read through the browser's File API and processed in memory in the tab. There is no upload endpoint on this site, which you can confirm in your browser's Network tab while a tool runs. The tools also work with the network disconnected once the page has loaded.",
  },
  {
    q: "Which PDF tools work on a phone?",
    a: "All of them, with practical caveats. Merging, splitting, rotating, numbering, watermarking, signing and metadata editing are light and work well on a phone. Thumbnail-heavy tools such as the page organiser and the PDF editor are usable but slower on long documents; compressing a 100 MB scan is better on a desktop.",
  },
  {
    q: "Can I edit the text inside a PDF?",
    a: "Not in the way you edit a Word document. A PDF stores glyphs at fixed positions, not paragraphs, so there is nothing to reflow. The PDF editor adds text boxes, highlights, shapes and images on top of a page, and white-out can cover text — but the original characters remain in the file. Editing body text requires the source document.",
  },
  {
    q: "Is there a file-size limit?",
    a: "Nothing is imposed by the site. Your device's memory is the real limit: files under 25 MB are comfortable on a phone, while a desktop handles documents well above 100 MB. Tools warn before starting if a batch looks heavy.",
  },
  {
    q: "Do you remove passwords from PDFs?",
    a: "No. Tools that open a PDF will tell you when a file is encrypted. A locked file must be unlocked in a viewer where you know the password, and then the unlocked copy can be used here. Bypassing protection on files you do not own is not something this site does.",
  },
  {
    q: "What happens to my files when I close the tab?",
    a: "They are gone. Nothing is stored in your browser and nothing was ever sent to a server. Download links are in-memory object URLs that are released when you start over or leave the page.",
  },
];

export default function PdfToolsPage() {
  const items = toolsForCategory("pdf-tools");
  const createTools = toolsForCategory("convert-to-pdf");

  return (
    <>
      <StructuredData
        data={[
          breadcrumbJsonLd(crumbs),
          collectionJsonLd({
            name: "PDF tools",
            description: category.metaDescription,
            path: "/pdf-tools/",
            items: items.map((tool) => ({ name: tool.name, url: `/${tool.slug}/` })),
          }),
        ]}
      />

      <div className="container-page pb-16 pt-6 sm:pt-8">
        <Breadcrumbs crumbs={crumbs} />

        <header className="max-w-3xl">
          <p className="eyebrow">
            <ToolIcon name="FileText" className="h-3.5 w-3.5" />
            {items.length} PDF tools
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

        {/* Jump links, so a 16-tool page is still easy to scan. */}
        <nav aria-label="PDF tool groups" className="mt-8 flex flex-wrap gap-2">
          {TOOL_GROUPS.filter((group) => toolsByGroup(group.key).length > 0).map((group) => (
            <a
              key={group.key}
              href={`#${group.key}`}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-line bg-raised px-3 text-[12.5px] font-semibold text-body transition-colors hover:border-brand-200 hover:text-brand-600"
            >
              {group.label}
              <span className="rounded-full bg-surface px-1.5 text-[10.5px] text-subtle">
                {toolsByGroup(group.key).length}
              </span>
            </a>
          ))}
        </nav>

        {TOOL_GROUPS.map((group) => {
          const groupTools = toolsByGroup(group.key);
          if (!groupTools.length) return null;
          return (
            <section key={group.key} id={group.key} className="mt-10 scroll-mt-24" aria-labelledby={`${group.key}-title`}>
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 id={`${group.key}-title`} className="text-[22px] font-bold tracking-tight text-ink">
                    {group.label}
                  </h2>
                  <p className="mt-1 text-[13.5px] text-body">{group.description}</p>
                </div>
                <span className="text-[12px] text-subtle">
                  {groupTools.length} tool{groupTools.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groupTools.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} compact />
                ))}
              </div>
            </section>
          );
        })}

        <AdSlot variant="leaderboard" className="mt-10" />

        <section className="article mt-12 max-w-prose">
          <h2>One menu, {items.length} PDF tools</h2>
          <p>
            Most sites split “PDF tools” and “convert to PDF” into separate sections, which forces you to guess
            where a tool lives. Here everything that touches a PDF is in one list, ordered by what you are
            trying to do: <strong>organise</strong> the pages you already have, <strong>optimise</strong> the file
            size, <strong>edit and sign</strong> the page, <strong>create</strong> a PDF from something else, or{" "}
            <strong>extract</strong> images back out of it.
          </p>
          <p>
            The creation tools — image, Word, text, spreadsheet and Markdown to PDF — also have their own{" "}
            <Link href="/convert-to-pdf/">convert to PDF hub</Link> with a longer explanation of fidelity for each
            format, because that is the question people ask most before converting a document they care about.
          </p>

          <h2>What a browser does well, and what it does not</h2>
          <p>
            A modern browser can parse a PDF, walk every object and write a new, valid file. That covers merging,
            splitting, rotating, numbering, watermarking, signing, annotating and metadata editing — all of it
            lossless, because pages are copied rather than reprinted.
          </p>
          <p>
            What it cannot do is reflow existing text. A PDF is a set of instructions for placing glyphs at fixed
            coordinates; there is no paragraph to re-break when you change a margin. That is why the editor
            annotates pages instead of pretending to be a word processor, and why Word conversion reproduces the
            document's structure rather than its exact layout. Each tool page states its own limits before you
            upload anything.
          </p>

          <h2>Order of operations</h2>
          <p>
            If a document needs several fixes, the order changes the result. Organise pages first (delete, reorder,
            rotate), merge next, then edit and sign, add page numbers late, and compress last. Compressing before
            you merge re-encodes images twice; stamping a watermark before compression can soften it into
            illegibility.
          </p>

          <h2>Privacy that holds up to inspection</h2>
          <p>
            There is no upload endpoint on this site. You can check rather than trust: open developer tools,
            switch to the Network tab, clear it and run any tool — no request carries your document. Because the
            work happens locally, these tools also run on a locked-down work laptop where file-upload sites are
            blocked by policy, and they keep working on a plane.
          </p>
        </section>

        <div className="mt-12 rounded-card border border-line bg-surface p-6">
          <h2 className="text-[18px] font-bold text-ink">Creating a PDF from another file?</h2>
          <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-body">
            {createTools.length} conversion tools are included in the list above. The hub page compares their
            fidelity, format by format.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/convert-to-pdf/" className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-brand-200 bg-raised px-3 text-[13.5px] font-semibold text-brand-700">
              Convert to PDF guide
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            {toolsForCategory("image-tools").map((tool) => (
              <Link
                key={tool.slug}
                href={`/${tool.slug}/`}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-line bg-raised px-3 text-[13.5px] font-medium text-body hover:border-brand-200"
              >
                {tool.name}
              </Link>
            ))}
          </div>
        </div>

        <Faq items={FAQS} heading="PDF tools: common questions" />

        <p className="mt-10 text-[13px] text-subtle">
          {tools.length} tools across {SITE_NAME} · everything runs in your browser · page updated 27 October 2026
        </p>
      </div>
    </>
  );
}
