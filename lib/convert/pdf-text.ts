/**
 * Reads a PDF's text layer into the layout model the Word and Excel converters
 * use. Browser-only: pdf.js needs a DOM for its canvas paths, and this is the
 * one place that touches it for conversion.
 */
import { loadPdfjsDocument } from "@/lib/pdf/pdfjs";
import { parsePageRanges } from "@/lib/pdf/core";
import { itemsToLines, type LayoutPage, type RawTextItem } from "./pdf-layout";

export async function readPdfLayout(
  file: File,
  pageSelection: string,
  onProgress?: (value: number, label: string) => void,
): Promise<{ pages: LayoutPage[]; imageOnly: number; totalPages: number }> {
  const pdf = await loadPdfjsDocument(await file.arrayBuffer());
  const totalPages = pdf.numPages;
  const requested = pageSelection.trim();
  const selection =
    !requested || /^(all|everything|whole document)$/i.test(requested)
      ? Array.from({ length: totalPages }, (_, index) => index)
      : parsePageRanges(requested, totalPages);
  const pages: LayoutPage[] = [];
  let imageOnly = 0;

  for (let index = 0; index < selection.length; index += 1) {
    const pageNumber = selection[index] + 1;
    onProgress?.((index + 1) / selection.length, `Reading page ${pageNumber} of ${totalPages}`);
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const lines = itemsToLines(content.items as RawTextItem[]);
    if (!lines.length) imageOnly += 1;
    pages.push({ pageNumber, width: viewport.width, height: viewport.height, lines });
    page.cleanup();
  }

  await pdf.destroy();
  return { pages, imageOnly, totalPages };
}
