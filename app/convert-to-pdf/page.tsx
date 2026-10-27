import type { Metadata } from "next";
import { CATEGORIES } from "@/data/site";
import { buildMetadata } from "@/lib/seo";
import { CategoryPage } from "@/components/CategoryPage";

const category = CATEGORIES.find((entry) => entry.slug === "convert-to-pdf")!;

export const metadata: Metadata = buildMetadata({
  title: category.title,
  description: category.metaDescription,
  path: "/convert-to-pdf/",
});

const faqs = [
  {
    q: "Will my Word document look exactly the same as a PDF?",
    a: "Not exactly, and any tool that promises otherwise is either using a full office suite on a server or guessing. The browser route reads the document structure (headings, paragraphs, lists, bold, italics, tables) and lays it out again in a PDF. Simple documents look very close; complex layouts with text boxes, columns and floating images will shift.",
  },
  {
    q: "Is the text in the PDF selectable?",
    a: "For text-based inputs — TXT, DOCX, CSV, Markdown — yes. The text is written as real text with fonts embedded, so you can select, search and copy it. Images to PDF is the exception: those pages are pictures of pages, not text.",
  },
  {
    q: "Can I convert several files into one PDF?",
    a: "The Image to PDF tool does this by design: every image becomes a page and you control the order. For documents, merge the PDFs afterwards — the merge tool combines them without re-encoding the contents.",
  },
  {
    q: "What about scanned PDFs and OCR?",
    a: "OCR is on the roadmap, not live yet. A scanned PDF contains pictures of words; turning those into selectable text needs a recognition engine and a language model for each script. We will ship it when English accuracy is genuinely good, then add more languages.",
  },
  {
    q: "Do these converters upload my documents?",
    a: "No. Every converter on this site reads the file from your device and writes the PDF in the same browser tab. Nothing is sent to a server, which is why they work with the network disconnected after the page loads.",
  },
];

export default function ConvertToPdfPage() {
  return (
    <CategoryPage
      category={category}
      faqs={faqs}
      intro={
        <>
          <h2>Why convert to PDF at all?</h2>
          <p>
            PDF is the format that stops other people's software from changing your layout. A CV, an invoice,
            a signed letter or a set of photographed ID pages all need to look the same on a stranger's phone,
            a recruiter's Windows laptop and a print shop's machine. PDF guarantees that; DOCX, TXT and CSV do
            not.
          </p>
          <p>
            The trade-off is that PDF is a destination format. Once something is a PDF, editing it becomes
            annotation rather than authoring. Convert last, keep the original, and only send the PDF when you
            are happy with the source.
          </p>

          <h2>Fidelity, format by format</h2>
          <p>
            Being honest up front saves you a disappointing download. This is what each conversion really
            delivers in a browser:
          </p>
          <ul>
            <li>
              <strong>Images → PDF</strong> is essentially lossless. Each photo is placed on a page at its own
              resolution and can be embedded without re-compression.
            </li>
            <li>
              <strong>TXT → PDF</strong> is faithful: monospaced or proportional type, your font size, your
              margins, real selectable text, Unicode characters included.
            </li>
            <li>
              <strong>DOCX → PDF</strong> reproduces the document's structure — headings, styling, lists,
              tables — but not every page break. Think “very good draft”, not “certified print proof”.
            </li>
            <li>
              <strong>CSV / Excel → PDF</strong> gives you a clean table with repeated header rows. Wide sheets
              are scaled or split across pages; there is no way to make 60 columns fit an A4 sheet legibly.
            </li>
            <li>
              <strong>Markdown / HTML → PDF</strong> keeps headings, lists, code blocks and links. Arbitrary CSS
              from a website will not survive, because the layout engine is not a browser engine.
            </li>
          </ul>

          <h2>What to do before converting</h2>
          <p>
            Check the source file first. If your Word document relies on a specific font that is not installed
            on your machine, the PDF will substitute something similar. If your spreadsheet has hidden columns,
            they will not print. If your images are 4000 pixels wide, decide now whether you want a 30 MB PDF or
            a 3 MB one — you can re-run the converter with a smaller maximum size instead of compressing the
            result afterwards.
          </p>
          <p>
            For documents that must match a template exactly — a lawyer's letterhead, a design proof — export the
            PDF from the application that created the file. A browser converter is the right tool for everyday
            paperwork, not for pixel-exact reproduction of a brand template.
          </p>

          <h2>Private by design</h2>
          <p>
            Contracts, payslips, medical letters and passport scans are exactly the files you should not be
            uploading to an unknown server to convert. Here they are parsed in your own tab, converted with
            local code and downloaded directly. Nothing is transmitted, and there is no retention policy to read
            because there is no copy to retain.
          </p>
        </>
      }
    />
  );
}
