import type { Metadata } from "next";
import { tools } from "@/data/tools";
import { CATEGORIES, SITE_NAME } from "@/data/site";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, collectionJsonLd } from "@/lib/jsonld";
import { StructuredData } from "@/components/StructuredData";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ToolsExplorer } from "@/components/ToolsExplorer";
import { AdSlot } from "@/components/AdSlot";
import Link from "next/link";

export const metadata: Metadata = buildMetadata({
  title: "All Free File Tools — PDF & Image, No Upload",
  description:
    "Every free tool on the site in one place: compress and convert PDFs, change image formats, resize photos. Filter by category or search by task.",
  path: "/tools/",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "All tools", path: "/tools/" },
];

export default function ToolsPage() {
  return (
    <>
      <StructuredData
        data={[
          breadcrumbJsonLd(crumbs),
          collectionJsonLd({
            name: `All ${SITE_NAME} tools`,
            description: "Searchable index of every browser-based PDF, image and utility tool.",
            path: "/tools/",
            items: tools.map((tool) => ({ name: tool.name, url: `/${tool.slug}/` })),
          }),
        ]}
      />

      <div className="container-page pb-16 pt-6 sm:pt-8">
        <Breadcrumbs crumbs={crumbs} />

        <header className="max-w-3xl">
          <h1 className="text-[30px] font-extrabold leading-[1.12] tracking-[-0.025em] text-ink sm:text-[40px]">
            All tools — search by the job you need done
          </h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-body">
            {tools.length} tools are live today, split across four categories. Every one runs inside your
            browser: no upload, no account, no watermark and no daily limit. Type a file type or a task —
            “compress”, “heic”, “a4” — and the list filters as you go.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2 text-[12.5px]">
            {CATEGORIES.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/${category.slug}/`}
                  className="inline-flex min-h-[36px] items-center rounded-full border border-line bg-white px-3 font-medium text-body transition-colors hover:border-brand-200 hover:text-brand-600"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </header>

        <div className="mt-7">
          <ToolsExplorer tools={tools} />
        </div>

        <AdSlot variant="leaderboard" className="mt-10" />

        <section className="article mt-12 max-w-prose">
          <h2>How this list is organised</h2>
          <p>
            The four categories follow the order people usually need them. <strong>PDF tools</strong> change
            an existing PDF — shrinking, splitting or annotating it. <strong>Convert to PDF</strong> takes
            something else (a photo, a Word file, a spreadsheet) and produces a PDF.{" "}
            <strong>Image tools</strong> work on pictures and change format, size or compression.{" "}
            <strong>Utilities</strong> are small helpers that have nothing to do with files at all.
          </p>
          <p>
            Each tool page has the working widget at the top, then a written explanation of what the tool
            does, how to use it, the formats it accepts, the limits you will hit and a set of answers to
            questions people actually ask. Nothing is generated from a template: the text is written for
            that tool, and it is updated when the tool changes.
          </p>
          <h2>What “free” means here</h2>
          <p>
            No account is required, no file limit is enforced per day and no output carries a watermark. The
            site is funded by ordinary display advertising placed around the tools, never inside the
            dropzone, between your settings and the main button, or next to a download link. If a tool cannot
            do something properly in a browser, its page says so rather than producing a broken result.
          </p>
          <h2>Not sure which tool to use?</h2>
          <p>
            Start from the result you want. “My PDF is too big to email” → Compress PDF. “My portal only
            accepts PNG” → JPG to PNG. “My phone photos need to be one document” → Image to PDF. If the file
            type you have is not listed, message us and we will tell you honestly whether a browser can
            handle it.
          </p>
        </section>
      </div>
    </>
  );
}
