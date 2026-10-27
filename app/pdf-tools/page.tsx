import type { Metadata } from "next";
import { CATEGORIES } from "@/data/site";
import { buildMetadata } from "@/lib/seo";
import { CategoryPage } from "@/components/CategoryPage";

const category = CATEGORIES.find((entry) => entry.slug === "pdf-tools")!;

export const metadata: Metadata = buildMetadata({
  title: category.title,
  description: category.metaDescription,
  path: "/pdf-tools/",
});

const faqs = [
  {
    q: "Why do these PDF tools work without an upload?",
    a: "The PDF is read through your browser's File API and parsed in memory with pdf-lib and pdf.js — the same kind of code Acrobat runs locally. The tab does the work, so there is no server to send the file to and no upload time to wait for.",
  },
  {
    q: "Is there a page or file limit?",
    a: "No limit per day and no cap on the number of files in a batch. The practical limit is your device's memory: a 100-page text-heavy PDF is fine on a laptop, while a 500-page scan with large images may need a desktop-class machine.",
  },
  {
    q: "Will the PDF still open in Acrobat, Preview and on my phone?",
    a: "Yes. Files are written as standard PDF 1.7 with an embedded cross-reference stream, which every current viewer reads. If a file ever fails a sanity check, the tool falls back to a safe method instead of handing you a broken document.",
  },
  {
    q: "Do you remove passwords or DRM?",
    a: "No. Tools that need to open a PDF will tell you when a file is encrypted. Locked files need their own password, unlocked in a viewer you control first. Bypassing protection on files you do not own is off the table.",
  },
  {
    q: "What happens to my file when I close the tab?",
    a: "It is gone. Nothing was written to storage and there was never a copy on a server. Download links are created in memory for the current session and released when you start over or leave the page.",
  },
];

export default function PdfToolsPage() {
  return (
    <CategoryPage
      category={category}
      faqs={faqs}
      intro={
        <>
          <h2>What a browser can and cannot do to a PDF</h2>
          <p>
            A modern browser can parse a PDF, walk every object in it and write a new file, which covers most
            of the jobs people actually need: combining documents, pulling pages out, rotating scans, stamping
            page numbers, adding a signature image and shrinking a file before it goes into an email.
          </p>
          <p>
            What it cannot do reliably is <strong>reflow existing text</strong>. A PDF is a set of instructions
            for placing glyphs at fixed coordinates, not a word-processing document. There is no paragraph to
            re-break when you change a margin. That is why a browser PDF editor annotates pages — it can add
            text boxes, shapes and highlights on top — but it will never re-typeset the original body text the
            way Word would. We say so on the editor page instead of pretending otherwise.
          </p>

          <h2>Compressing a PDF: what actually gets smaller</h2>
          <p>
            PDF size is usually image size. A scan of ten pages at 300 DPI is often 30 MB, and 95% of that is
            JPEG data. Text and vector lines are tiny by comparison. So the choice is really about what you are
            willing to trade:
          </p>
          <ul>
            <li>
              <strong>Keep the text layer</strong> — clean up the file structure, strip metadata and recompress
              oversized embedded JPEGs. Savings range from a couple of percent on an already-optimised file to
              more than half on a badly exported scan.
            </li>
            <li>
              <strong>Rasterise the pages</strong> — render each page as an image at a chosen resolution. This is
              how 30 MB becomes 2 MB, and why the text stops being selectable. Use it for scans and photos, not
              for documents you may need to search.
            </li>
          </ul>
          <p>
            Either way the result card shows the honest numbers before and after, and tells you when a file did
            not get smaller — which happens with documents that were already optimised.
          </p>

          <h2>Order of operations matters</h2>
          <p>
            If you need three things done to one document, the order changes the quality of the result. Rotate
            and delete pages first, then merge, then compress last. Compressing before you merge means the
            images are re-encoded twice, and stamping a watermark before compression can soften it into
            illegibility.
          </p>
          <p>
            For scanned paperwork, the biggest quality win is at capture time: shoot straight on, in even light,
            with the camera parallel to the page. A good photo compresses far better than a crooked one because
            there is less noise to encode.
          </p>

          <h2>Privacy that holds up to inspection</h2>
          <p>
            These pages have no upload endpoint. You can verify that claim rather than trust it: open developer
            tools, switch to the Network tab, clear it and run any tool. No request carries your document.
            Because everything is local, the tools also work on a plane, or on a locked-down work laptop where
            file-upload sites are blocked by policy.
          </p>
        </>
      }
    />
  );
}
