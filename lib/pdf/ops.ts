import {
  PDFDocument,
  PDFName,
  degrees,
  rgb,
  StandardFonts,
  type PDFFont,
  type PDFImage,
} from "pdf-lib";
import { loadPdfDocument, savePdf, verifyPdf } from "./core";

/* ─────────────────────────────── Merge ─────────────────────────────────── */

export async function mergePdfs(files: { name: string; bytes: ArrayBuffer }[]): Promise<Uint8Array> {
  if (files.length < 2) throw new Error("Add at least two PDFs to merge.");
  const output = await PDFDocument.create();
  output.setProducer("Filecraft (browser)");
  output.setCreator("Filecraft Merge PDF");

  let total = 0;
  for (const file of files) {
    const { doc } = await loadPdfDocument(file.bytes);
    const pages = await output.copyPages(doc, doc.getPageIndices());
    for (const page of pages) {
      output.addPage(page);
      total += 1;
    }
  }
  if (!total) throw new Error("Those files contain no pages.");
  const bytes = await savePdf(output);
  await verifyPdf(bytes, total);
  return bytes;
}

/* ─────────────────────────────── Split ─────────────────────────────────── */

export async function extractPages(bytes: ArrayBuffer, pages: number[]): Promise<Uint8Array> {
  const { doc } = await loadPdfDocument(bytes);
  const output = await PDFDocument.create();
  output.setProducer("Filecraft (browser)");
  const copied = await output.copyPages(doc, pages);
  copied.forEach((page) => output.addPage(page));
  const result = await savePdf(output);
  await verifyPdf(result, pages.length);
  return result;
}

/** One output file per group; groups come from parseRangeGroups/everyNthChunks. */
export async function splitPdf(bytes: ArrayBuffer, groups: number[][]): Promise<{ index: number; pages: number[]; bytes: Uint8Array }[]> {
  const results: { index: number; pages: number[]; bytes: Uint8Array }[] = [];
  for (let index = 0; index < groups.length; index += 1) {
    const pages = groups[index];
    if (!pages.length) continue;
    results.push({ index, pages, bytes: await extractPages(bytes, pages) });
  }
  if (!results.length) throw new Error("None of those ranges contained a page.");
  return results;
}

/* ─────────────────────────────── Rotate ────────────────────────────────── */

export async function rotatePdf(
  bytes: ArrayBuffer,
  angle: 90 | 180 | 270,
  options: { pages?: number[] } = {},
): Promise<Uint8Array> {
  const { doc, pages: pageCount } = await loadPdfDocument(bytes);
  const targets = options.pages ?? Array.from({ length: pageCount }, (_, index) => index);
  const all = doc.getPages();
  for (const index of targets) {
    const page = all[index];
    if (!page) continue;
    page.setRotation(degrees((page.getRotation().angle + angle) % 360));
  }
  const result = await savePdf(doc);
  await verifyPdf(result, pageCount);
  return result;
}

/* ─────────────────────────── Organise pages ────────────────────────────── */

export interface PageEdit {
  /** 0-based index in the source document. */
  source: number;
  rotation: number;
}

export async function rebuildPdf(bytes: ArrayBuffer, edits: PageEdit[]): Promise<Uint8Array> {
  if (!edits.length) throw new Error("Keep at least one page.");
  const { doc } = await loadPdfDocument(bytes);
  const output = await PDFDocument.create();
  output.setProducer("Filecraft (browser)");
  const copied = await output.copyPages(doc, edits.map((edit) => edit.source));
  copied.forEach((page, index) => {
    const rotation = edits[index].rotation;
    if (rotation) page.setRotation(degrees(((page.getRotation().angle + rotation) % 360 + 360) % 360));
    output.addPage(page);
  });
  const result = await savePdf(output);
  await verifyPdf(result, edits.length);
  return result;
}

/* ───────────────────────────── Page numbers ────────────────────────────── */

export type NumberPosition =
  | "bottom-center"
  | "bottom-right"
  | "bottom-left"
  | "top-center"
  | "top-right"
  | "top-left";

export interface PageNumberOptions {
  position: NumberPosition;
  startAt: number;
  fontSize: number;
  margin: number;
  format: string; // "{n} of {total}"
  skipFirst: boolean;
  pages?: number[];
}

export async function addPageNumbers(bytes: ArrayBuffer, options: PageNumberOptions): Promise<Uint8Array> {
  const { doc, pages: pageCount } = await loadPdfDocument(bytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const targets = options.pages ?? Array.from({ length: pageCount }, (_, index) => index);
  const rotationDegree = options.position.startsWith("top") ? 0 : 0;

  targets.forEach((index, order) => {
    if (options.skipFirst && index === 0) return;
    const page = doc.getPage(index);
    const { width, height } = page.getSize();
    const label = options.format
      .replace(/\{n\}/g, String(options.startAt + order))
      .replace(/\{total\}/g, String(pageCount));
    const textWidth = font.widthOfTextAtSize(label, options.fontSize);
    const y = options.position.startsWith("top")
      ? height - options.margin - options.fontSize
      : options.margin;
    const x = options.position.endsWith("right")
      ? width - options.margin - textWidth
      : options.position.endsWith("center")
        ? (width - textWidth) / 2
        : options.margin;

    page.drawText(label, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(0.28, 0.33, 0.41),
      rotate: degrees(rotationDegree),
    });
  });

  const result = await savePdf(doc);
  await verifyPdf(result, pageCount);
  return result;
}

/* ────────────────────────────── Watermark ──────────────────────────────── */

export type WatermarkPlacement = "center" | "tile" | "bottom-right" | "top-left";

export interface WatermarkTextOptions {
  text: string;
  fontSize: number;
  opacity: number;
  rotation: number;
  placement: WatermarkPlacement;
  color: "gray" | "red" | "blue" | "black";
}

const WATERMARK_COLORS = {
  gray: rgb(0.45, 0.45, 0.45),
  red: rgb(0.8, 0.13, 0.13),
  blue: rgb(0.2, 0.3, 0.75),
  black: rgb(0.1, 0.1, 0.1),
};

export async function addTextWatermark(bytes: ArrayBuffer, options: WatermarkTextOptions): Promise<Uint8Array> {
  if (!options.text.trim()) throw new Error("Type the watermark text first.");
  const { doc, pages: pageCount } = await loadPdfDocument(bytes);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const size = options.fontSize;
    const textWidth = font.widthOfTextAtSize(options.text, size);
    const color = WATERMARK_COLORS[options.color];
    const base = { size, font, color, opacity: Math.min(Math.max(options.opacity, 0.05), 1), rotate: degrees(options.rotation) };

    if (options.placement === "tile") {
      const stepX = Math.max(textWidth + 60, 180);
      const stepY = Math.max(size * 4, 120);
      for (let y = -height; y < height * 2; y += stepY) {
        for (let x = -width; x < width * 2; x += stepX) {
          page.drawText(options.text, { ...base, x, y });
        }
      }
      continue;
    }

    if (options.placement === "bottom-right") {
      page.drawText(options.text, { ...base, x: width - textWidth - 36, y: 36, rotate: degrees(0) });
      continue;
    }
    if (options.placement === "top-left") {
      page.drawText(options.text, { ...base, x: 36, y: height - size - 36, rotate: degrees(0) });
      continue;
    }

    // Centre: account for the rotation so the string stays visually centred.
    const radians = (options.rotation * Math.PI) / 180;
    const offsetX = (textWidth / 2) * Math.cos(radians);
    const offsetY = (textWidth / 2) * Math.sin(radians);
    page.drawText(options.text, {
      ...base,
      x: width / 2 - offsetX,
      y: height / 2 - offsetY - size / 2,
    });
  }

  const result = await savePdf(doc);
  await verifyPdf(result, pageCount);
  return result;
}

export async function addImageWatermark(
  bytes: ArrayBuffer,
  imageBytes: ArrayBuffer,
  kind: "png" | "jpg",
  options: { opacity: number; scale: number; placement: WatermarkPlacement; rotation: number },
): Promise<Uint8Array> {
  const { doc, pages: pageCount } = await loadPdfDocument(bytes);
  const image: PDFImage =
    kind === "png" ? await doc.embedPng(imageBytes) : await doc.embedJpg(imageBytes);

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const drawWidth = width * Math.min(Math.max(options.scale, 0.05), 1);
    const drawHeight = (image.height / image.width) * drawWidth;
    const opacity = Math.min(Math.max(options.opacity, 0.05), 1);

    const draw = (x: number, y: number) =>
      page.drawImage(image, { x, y, width: drawWidth, height: drawHeight, opacity, rotate: degrees(options.rotation) });

    if (options.placement === "bottom-right") {
      draw(width - drawWidth - 24, 24);
    } else if (options.placement === "top-left") {
      draw(24, height - drawHeight - 24);
    } else if (options.placement === "tile") {
      for (let y = 0; y < height; y += drawHeight + 40) {
        for (let x = 0; x < width; x += drawWidth + 40) draw(x, y);
      }
    } else {
      draw((width - drawWidth) / 2, (height - drawHeight) / 2);
    }
  }

  const result = await savePdf(doc);
  await verifyPdf(result, pageCount);
  return result;
}

/* ────────────────────────────── Signatures ─────────────────────────────── */

export interface PlacedSignature {
  pageIndex: number;
  /** Fractions of the page width/height, measured from the bottom-left corner. */
  x: number;
  y: number;
  /** Signature width as a fraction of the page width. */
  width: number;
}

export async function placeSignature(
  bytes: ArrayBuffer,
  signaturePng: ArrayBuffer,
  placement: PlacedSignature,
): Promise<Uint8Array> {
  const { doc, pages: pageCount } = await loadPdfDocument(bytes);
  if (placement.pageIndex >= pageCount) throw new Error("That page does not exist in this PDF.");
  const image = await doc.embedPng(signaturePng);
  const page = doc.getPage(placement.pageIndex);
  const { width, height } = page.getSize();
  const drawWidth = width * Math.min(Math.max(placement.width, 0.05), 0.9);
  const drawHeight = (image.height / image.width) * drawWidth;

  page.drawImage(image, {
    x: placement.x * width,
    y: placement.y * height - drawHeight / 2,
    width: drawWidth,
    height: drawHeight,
  });

  const result = await savePdf(doc);
  await verifyPdf(result, pageCount);
  return result;
}

/* ──────────────────────────── Metadata editor ──────────────────────────── */

export interface PdfMetadataFields {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
}

export async function readMetadata(bytes: ArrayBuffer): Promise<PdfMetadataFields> {
  const { doc } = await loadPdfDocument(bytes);
  return {
    title: doc.getTitle() ?? "",
    author: doc.getAuthor() ?? "",
    subject: doc.getSubject() ?? "",
    keywords: (doc.getKeywords() ?? "").split(/[,;]\s*/).filter(Boolean).join(", "),
    creator: doc.getCreator() ?? "",
  };
}

export async function writeMetadata(bytes: ArrayBuffer, fields: PdfMetadataFields): Promise<Uint8Array> {
  const { doc, pages } = await loadPdfDocument(bytes);
  doc.setTitle(fields.title.trim());
  doc.setAuthor(fields.author.trim());
  doc.setSubject(fields.subject.trim());
  doc.setKeywords(
    fields.keywords
      .split(/[,;]/)
      .map((keyword) => keyword.trim())
      .filter(Boolean),
  );
  doc.setCreator(fields.creator.trim() || "Filecraft");
  doc.setProducer("Filecraft (browser)");
  doc.setModificationDate(new Date());
  const result = await savePdf(doc);
  await verifyPdf(result, pages);
  return result;
}

/* ─────────────────────────── Annotation export ─────────────────────────── */

export type AnnotationKind = "text" | "highlight" | "rect" | "whiteout" | "draw" | "image";

export interface Annotation {
  id: string;
  kind: AnnotationKind;
  pageIndex: number;
  /** Normalised 0–1 coordinates, origin top-left (screen space). */
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  text?: string;
  fontSize?: number;
  points?: { x: number; y: number }[];
  imageBytes?: ArrayBuffer;
}

const hexToRgb = (hex: string) => {
  const clean = hex.replace("#", "");
  const value = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const int = Number.parseInt(value || "000000", 16);
  return rgb(((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255);
};

export async function applyAnnotations(bytes: ArrayBuffer, annotations: Annotation[]): Promise<Uint8Array> {
  const { doc, pages: pageCount } = await loadPdfDocument(bytes);
  const font: PDFFont = await doc.embedFont(StandardFonts.Helvetica);

  for (const annotation of annotations) {
    if (annotation.pageIndex >= pageCount) continue;
    const page = doc.getPage(annotation.pageIndex);
    const { width, height } = page.getSize();
    const px = annotation.x * width;
    const py = height - annotation.y * height;
    const w = annotation.width * width;
    const h = annotation.height * height;
    const color = hexToRgb(annotation.color);

    switch (annotation.kind) {
      case "highlight":
        page.drawRectangle({ x: px, y: py - h, width: w, height: h, color, opacity: 0.35, borderWidth: 0 });
        break;
      case "whiteout":
        page.drawRectangle({ x: px, y: py - h, width: w, height: h, color: rgb(1, 1, 1), opacity: 1, borderWidth: 0 });
        break;
      case "rect":
        page.drawRectangle({ x: px, y: py - h, width: w, height: h, borderColor: color, borderWidth: 2, opacity: 0 });
        break;
      case "text": {
        const size = annotation.fontSize ?? 14;
        const lines = (annotation.text ?? "").split("\n");
        lines.forEach((line, index) => {
          page.drawText(line, { x: px + 2, y: py - size - index * size * 1.25, size, font, color });
        });
        break;
      }
      case "draw": {
        const points = annotation.points ?? [];
        for (let index = 1; index < points.length; index += 1) {
          const from = points[index - 1];
          const to = points[index];
          page.drawLine({
            start: { x: from.x * width, y: height - from.y * height },
            end: { x: to.x * width, y: height - to.y * height },
            thickness: 2,
            color,
          });
        }
        break;
      }
      case "image": {
        if (!annotation.imageBytes) break;
        let image: PDFImage | null = null;
        try {
          image = await doc.embedPng(annotation.imageBytes);
        } catch {
          image = await doc.embedJpg(annotation.imageBytes);
        }
        if (image) {
          page.drawImage(image, { x: px, y: py - h, width: w, height: h, opacity: 1 });
        }
        break;
      }
      default:
        break;
    }
  }

  const result = await savePdf(doc);
  await verifyPdf(result, pageCount);
  return result;
}

/** Strips the page thumbnails some scanners embed — pure dead weight. */
export function dropThumbnails(doc: PDFDocument): number {
  let removed = 0;
  for (const page of doc.getPages()) {
    if (page.node.has(PDFName.of("Thumb"))) {
      page.node.delete(PDFName.of("Thumb"));
      removed += 1;
    }
  }
  return removed;
}
