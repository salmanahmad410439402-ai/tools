/**
 * Builds a searchable PDF from a scan: the page image stays exactly as it was
 * scanned, and the recognised words are written underneath it as invisible
 * text. Selecting or searching the page then finds real characters, while the
 * document still looks like the original scan.
 *
 * The invisible layer is ordinary text drawn with zero alpha (`/ca 0`). Every
 * mainstream reader — Acrobat, Preview, Chrome, Firefox, pdf.js — still finds
 * and copies it, because extraction reads the content stream, not the pixels.
 */
import { PDFDocument } from "pdf-lib";
import { getFontPair } from "./fonts.ts";
import type { OcrWord } from "../ocr.ts";

export interface SearchablePageInput {
  /** JPEG of the rendered page. */
  image: Uint8Array;
  /** Pixel dimensions of that JPEG. */
  imageWidth: number;
  imageHeight: number;
  /** Page size in points (the original page's size, or the image's). */
  width: number;
  height: number;
  words: OcrWord[];
  /** Plain transcript, kept for the PDF's document properties. */
  text: string;
}

export async function buildSearchablePdf(pages: SearchablePageInput[], title?: string): Promise<Uint8Array> {
  if (!pages.length) throw new Error("There were no recognised pages to write.");

  const doc = await PDFDocument.create();
  const sample = pages.map((page) => page.words.map((word) => word.text).join(" ")).join(" ");
  const fonts = await getFontPair(doc, sample || "Filecraft");

  for (const pageInput of pages) {
    const page = doc.addPage([pageInput.width, pageInput.height]);
    const image = await doc.embedJpg(pageInput.image);
    page.drawImage(image, { x: 0, y: 0, width: pageInput.width, height: pageInput.height });

    const scaleX = pageInput.width / pageInput.imageWidth;
    const scaleY = pageInput.height / pageInput.imageHeight;

    for (const word of pageInput.words) {
      const fontSize = Math.max(1, (word.y1 - word.y0) * scaleY * 0.9);
      const x = word.x0 * scaleX;
      // The word's box bottom becomes the text baseline, with a small dip so
      // descenders do not push the line up.
      const baseline = pageInput.height - word.y1 * scaleY + fontSize * 0.18;
      try {
        page.drawText(word.text, {
          x,
          y: baseline,
          size: fontSize,
          font: fonts.regular,
          opacity: 0,
        });
      } catch {
        // A word the embedded font cannot encode is skipped; the transcript
        // still contains it.
      }
    }
  }

  doc.setProducer("Filecraft OCR");
  if (title) doc.setTitle(title);
  return doc.save({ useObjectStreams: true });
}
