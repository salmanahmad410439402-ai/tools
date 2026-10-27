import { PDFDocument } from "pdf-lib";
import { loadPdfjsDocument, describePdfError } from "./pdfjs";

/** Shared helpers for every PDF tool. All of them run on the client. */

export interface LoadedPdf {
  doc: PDFDocument;
  pages: number;
  encrypted: boolean;
}

export async function loadPdfDocument(bytes: ArrayBuffer | Uint8Array, options: { ignoreEncryption?: boolean } = {}): Promise<LoadedPdf> {
  try {
    const doc = await PDFDocument.load(bytes, {
      updateMetadata: false,
      ignoreEncryption: options.ignoreEncryption ?? false,
    });
    return { doc, pages: doc.getPageCount(), encrypted: doc.isEncrypted };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/encrypted/i.test(message)) {
      throw new Error(
        "This PDF is password-protected. Open it in a viewer where you know the password, export an unlocked copy, then use that copy here.",
      );
    }
    throw new Error(describePdfError(error));
  }
}

export async function savePdf(doc: PDFDocument): Promise<Uint8Array> {
  return doc.save({ useObjectStreams: true });
}

/** Counts pages with pdf.js — used when the file may be encrypted. */
export async function countPages(bytes: ArrayBuffer): Promise<number> {
  const pdf = await loadPdfjsDocument(bytes);
  const total = pdf.numPages;
  await pdf.destroy();
  return total;
}

/**
 * Parses page selections written the way people write them:
 *   "1-3, 5, 8-10"   → [0,1,2,4,7,8,9]
 *   "3"              → [2]
 * Negative, zero and out-of-range values are rejected with a clear message so
 * the user is never handed a half-empty document.
 */
export function parsePageRanges(input: string, pageCount: number): number[] {
  const cleaned = input.trim().toLowerCase().replace(/\s+/g, "");
  if (!cleaned) throw new Error("Type at least one page number, for example 1-3, 5.");

  const result: number[] = [];
  const seen = new Set<number>();

  for (const part of cleaned.split(",")) {
    if (!part) continue;
    const range = /^(\d+)(?:-(\d+))?$/.exec(part);
    if (!range) {
      throw new Error(`“${part}” is not a page or page range. Use a number (3) or a range (2-5).`);
    }
    const start = Number(range[1]);
    const end = range[2] ? Number(range[2]) : start;
    if (start < 1 || end < 1) throw new Error("Page numbers start at 1.");
    if (end < start) throw new Error(`The range “${part}” ends before it starts.`);
    if (start > pageCount || end > pageCount) {
      throw new Error(`This PDF has ${pageCount} page${pageCount === 1 ? "" : "s"}, so “${part}” is out of range.`);
    }
    for (let page = start; page <= end; page += 1) {
      if (!seen.has(page)) {
        seen.add(page);
        result.push(page - 1);
      }
    }
  }

  if (!result.length) throw new Error("That selection matched no pages.");
  return result;
}

/** "1,2,4-9,12" — used to show the user what a selection resolves to. */
export function formatPageList(pages: number[]): string {
  if (!pages.length) return "none";
  const sorted = [...pages].sort((a, b) => a - b);
  const parts: string[] = [];
  let start = sorted[0];
  let previous = sorted[0];
  for (const page of sorted.slice(1)) {
    if (page === previous + 1) {
      previous = page;
      continue;
    }
    parts.push(start === previous ? `${start + 1}` : `${start + 1}-${previous + 1}`);
    start = page;
    previous = page;
  }
  parts.push(start === previous ? `${start + 1}` : `${start + 1}-${previous + 1}`);
  return parts.join(", ");
}

/** Splits [0..n-1] into the groups described by a range string. */
export function parseRangeGroups(input: string, pageCount: number): number[][] {
  const groups = input
    .split(/[,;]/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (!groups.length) throw new Error("Add at least one range, for example 1-3, 4-8.");
  return groups.map((group) => parsePageRanges(group, pageCount));
}

export function everyNthChunks(pageCount: number, chunkSize: number): number[][] {
  if (!Number.isFinite(chunkSize) || chunkSize < 1) {
    throw new Error("Pages per file must be at least 1.");
  }
  const chunks: number[][] = [];
  for (let start = 0; start < pageCount; start += chunkSize) {
    const chunk: number[] = [];
    for (let page = start; page < Math.min(start + chunkSize, pageCount); page += 1) chunk.push(page);
    chunks.push(chunk);
  }
  return chunks;
}

/** Validates that a produced PDF reopens and has the expected page count. */
export async function verifyPdf(bytes: Uint8Array, expectedPages?: number): Promise<void> {
  const check = await PDFDocument.load(bytes, { updateMetadata: false });
  if (expectedPages != null && check.getPageCount() !== expectedPages) {
    throw new Error("The result did not come out as expected, so nothing was written. Please try again.");
  }
}

export { describePdfError };
