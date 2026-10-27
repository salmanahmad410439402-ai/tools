import type { Block } from "@/lib/pdf/text-pdf";
import { htmlToBlocks } from "./text-sources.ts";

/**
 * Word (.docx) → blocks, via Mammoth (BSD-2-Clause).
 *
 * Mammoth maps Word's structure to clean HTML: headings become <h1>–<h6>,
 * paragraphs <p>, lists <ul>/<ol>, tables <table>, bold/italic <strong>/<em>.
 * We then lay that out with our own PDF engine, so the result keeps real,
 * selectable text rather than a screenshot of a page.
 *
 * Honest limitation: Word's floating text boxes, column layouts, footnotes,
 * embedded charts and exact page breaks are not reproduced. Documents with a
 * simple structure come out very close; heavily designed ones shift.
 */
export async function docxToBlocks(file: File): Promise<{ blocks: Block[]; warnings: number }> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();

  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: [
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Subtitle'] => h2:fresh",
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='Quote'] => blockquote:fresh",
      ],
    },
  );

  const blocks = htmlToBlocks(result.value);
  if (!blocks.length) {
    throw new Error(
      "No readable text was found in this document. If it consists only of images, add page numbers or use a different export.",
    );
  }

  // Mammoth reports anything it could not represent; the UI surfaces a count.
  const warnings = result.messages.filter((message) => message.type === "warning").length;
  return { blocks, warnings };
}

export function describeDocxLimits(): string {
  return "Headings, paragraphs, bold, italics, lists and tables are preserved. Text boxes, columns, footnotes, charts and exact page breaks are not.";
}
