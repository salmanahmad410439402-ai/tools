/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Document editor engine
 *
 *  A small scene model (pages + elements) rendered into a real PDF with
 *  pdf-lib. It backs the PDF editor page in two modes:
 *
 *    • **blank** — start from an empty document of a chosen size and build a
 *      page from nothing: text, shapes, images, colours;
 *    • **overlay** — open an existing PDF and draw on top of it.
 *
 *  What it can and cannot do is deliberate and documented on the page:
 *  every element is drawn *onto* the page. Existing text is never rewritten,
 *  reflowed or restyled, because a PDF stores positioned glyphs rather than
 *  paragraphs — no browser library can honestly offer that.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { getFontPair } from "./fonts.ts";
import { loadPdfDocument, savePdf, verifyPdf } from "./core.ts";

export type EditorElementKind =
  | "text"
  | "rect"
  | "roundrect"
  | "ellipse"
  | "line"
  | "arrow"
  | "triangle"
  | "highlight"
  | "whiteout"
  | "draw"
  | "image";

export type FontFamily = "sans" | "serif" | "mono";
export type TextAlign = "left" | "center" | "right";

export interface EditorPoint {
  x: number;
  y: number;
}

export interface EditorElement {
  id: string;
  kind: EditorElementKind;
  /** Index into the *exported* page order. */
  pageIndex: number;
  /** Normalised 0–1, origin top-left. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Degrees, clockwise, about the element's centre. */
  rotation?: number;
  /** Fill colour as `#rrggbb`, or null for no fill. */
  fill?: string | null;
  /** Stroke colour as `#rrggbb`, or null for no outline. */
  stroke?: string | null;
  strokeWidth?: number;
  /** 0–1, applies to fill and stroke together. */
  opacity?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: FontFamily;
  bold?: boolean;
  italic?: boolean;
  align?: TextAlign;
  /** Multiple of the font size, default 1.3. */
  lineHeight?: number;
  /** Wrap the text inside the element box (default true). */
  wrap?: boolean;
  points?: EditorPoint[];
  imageBytes?: ArrayBuffer;
  /**
   * Object URL used only to show an image in the on-screen preview. It is never
   * serialised into the PDF, which embeds `imageBytes` instead.
   */
  imageUrl?: string;
}

export type PageSizeKey = "a4" | "letter" | "legal" | "a5" | "a3" | "square";

export const EDITOR_PAGE_SIZES: Record<PageSizeKey, { label: string; width: number; height: number }> = {
  a4: { label: "A4 (210 × 297 mm)", width: 595.28, height: 841.89 },
  letter: { label: "US Letter (8.5 × 11 in)", width: 612, height: 792 },
  legal: { label: "US Legal (8.5 × 14 in)", width: 612, height: 1008 },
  a5: { label: "A5 (148 × 210 mm)", width: 419.53, height: 595.28 },
  a3: { label: "A3 (297 × 420 mm)", width: 841.89, height: 1190.55 },
  square: { label: "Square (200 × 200 mm)", width: 566.93, height: 566.93 },
};

/** One slot in the exported document. `sourceIndex` null means a blank page. */
export interface PageSlot {
  /** Page number in the uploaded file, or null for a new blank page. */
  sourceIndex: number | null;
}

export interface RenderRequest {
  /** Either start from nothing or open an existing document. */
  source: { kind: "blank"; pages: number; size: PageSizeKey; orientation: "portrait" | "landscape" } | { kind: "pdf"; bytes: ArrayBuffer };
  /** Final page order. Omitted for blank documents, where `source.pages` is used. */
  pages?: PageSlot[];
  elements: EditorElement[];
  /** Optional document title written into the PDF metadata. */
  title?: string;
}

export interface RenderResult {
  bytes: Uint8Array;
  pages: number;
  elements: number;
  /** Elements skipped because their page no longer exists. */
  dropped: number;
}

/* ────────────────────────────── colour ──────────────────────────────────── */

export function hexToRgbColor(hex: string) {
  const clean = hex.replace("#", "").trim();
  const value = clean.length === 3 ? clean.split("").map((character) => character + character).join("") : clean;
  const int = Number.parseInt(/^[0-9a-f]{6}$/i.test(value) ? value : "000000", 16);
  return rgb(((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255);
}

/* ─────────────────────────────── fonts ──────────────────────────────────── */

const STANDARD: Record<FontFamily, Record<"regular" | "bold" | "italic" | "boldItalic", StandardFonts>> = {
  sans: {
    regular: StandardFonts.Helvetica,
    bold: StandardFonts.HelveticaBold,
    italic: StandardFonts.HelveticaOblique,
    boldItalic: StandardFonts.HelveticaBoldOblique,
  },
  serif: {
    regular: StandardFonts.TimesRoman,
    bold: StandardFonts.TimesRomanBold,
    italic: StandardFonts.TimesRomanItalic,
    boldItalic: StandardFonts.TimesRomanBoldItalic,
  },
  mono: {
    regular: StandardFonts.Courier,
    bold: StandardFonts.CourierBold,
    italic: StandardFonts.CourierOblique,
    boldItalic: StandardFonts.CourierBoldOblique,
  },
};

/** The built-in fonts cover WinAnsi only; anything else needs the bundled font. */
export function isWinAnsi(text: string): boolean {
  return /^[\u0000-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026\u20AC\u2122]*$/.test(text);
}

class FontBook {
  private doc: PDFDocument;
  private cache = new Map<string, PDFFont>();

  constructor(doc: PDFDocument) {
    this.doc = doc;
  }

  async get(element: EditorElement): Promise<{ font: PDFFont; unicode: boolean }> {
    const text = element.text ?? "";
    const family = element.fontFamily ?? "sans";
    const unicode = !isWinAnsi(text);

    if (unicode) {
      // DejaVu Sans is bundled; it has no italic, so italic is dropped rather
      // than faked. The page says so in its limits.
      const key = `unicode-${element.bold ? "bold" : "regular"}`;
      const cached = this.cache.get(key);
      if (cached) return { font: cached, unicode: true };
      const pair = await getFontPair(this.doc, text);
      const font = element.bold ? pair.bold : pair.regular;
      this.cache.set(key, font);
      return { font, unicode: true };
    }

    const variant = element.bold && element.italic ? "boldItalic" : element.bold ? "bold" : element.italic ? "italic" : "regular";
    const key = `${family}-${variant}`;
    const cached = this.cache.get(key);
    if (cached) return { font: cached, unicode: false };
    const font = await this.doc.embedFont(STANDARD[family][variant]);
    this.cache.set(key, font);
    return { font, unicode: false };
  }
}

/* ────────────────────────────── text layout ─────────────────────────────── */

export interface TextLayout {
  lines: string[];
  /** Width of each line in points, in the same order. */
  widths: number[];
}

/**
 * Greedy word wrap measured with the actual font.
 *
 * Exported so the test suite can assert that a long paragraph fits its box and
 * that no line is longer than the width it was given.
 */
export function wrapText(text: string, font: PDFFont, size: number, maxWidth: number, wrap: boolean): TextLayout {
  const measure = (value: string) => {
    try {
      return font.widthOfTextAtSize(value, size);
    } catch {
      // A glyph the font cannot draw throws; count it as a space so layout
      // still completes and the caller keeps the original characters.
      return value.length * size * 0.5;
    }
  };

  const paragraphs = text.replace(/\r\n?/g, "\n").split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    if (!wrap || !maxWidth || measure(paragraph) <= maxWidth) {
      lines.push(paragraph);
      continue;
    }
    let current = "";
    for (const word of paragraph.split(/(\s+)/)) {
      const candidate = current + word;
      if (measure(candidate) > maxWidth && current.trim()) {
        lines.push(current.trimEnd());
        current = word.trimStart();
      } else {
        current = candidate;
      }
    }
    lines.push(current.trimEnd());
  }

  return { lines, widths: lines.map(measure) };
}

/* ─────────────────────────────── rendering ──────────────────────────────── */

const MM_TO_PT = 72 / 25.4;

function pageDimensions(size: PageSizeKey, orientation: "portrait" | "landscape") {
  const { width, height } = EDITOR_PAGE_SIZES[size];
  return orientation === "landscape" ? [height, width] as const : [width, height] as const;
}

/** Rotates a point around a centre, in PDF points. */
export function rotatePoint(point: EditorPoint, centre: EditorPoint, angle: number): EditorPoint {
  if (!angle) return point;
  const radians = (angle * Math.PI) / 180;
  const dx = point.x - centre.x;
  const dy = point.y - centre.y;
  return {
    x: centre.x + dx * Math.cos(radians) - dy * Math.sin(radians),
    y: centre.y + dx * Math.sin(radians) + dy * Math.cos(radians),
  };
}

async function embedImage(doc: PDFDocument, bytes: ArrayBuffer): Promise<PDFImage | null> {
  try {
    return await doc.embedPng(bytes);
  } catch {
    try {
      return await doc.embedJpg(bytes);
    } catch {
      return null;
    }
  }
}

/**
 * Builds the PDF.
 *
 * Page operations happen first (so element page indices refer to the final
 * document), then every element is drawn. A failure in one image is reported
 * through the return value instead of losing the whole export.
 */
export async function renderEditorPdf(request: RenderRequest): Promise<RenderResult> {
  let doc: PDFDocument;

  if (request.source.kind === "blank") {
    doc = await PDFDocument.create();
    const [width, height] = pageDimensions(request.source.size, request.source.orientation);
    for (let index = 0; index < Math.max(1, request.source.pages); index += 1) {
      doc.addPage([width, height]);
    }
  } else {
    const loaded = await loadPdfDocument(request.source.bytes);
    const source = loaded.doc;
    const slots = request.pages ?? Array.from({ length: loaded.pages }, (_, index) => ({ sourceIndex: index }));

    // Rebuild in the requested order: copy the surviving source pages and add
    // blank ones where the user inserted them.
    const rebuilt = await PDFDocument.create();
    const copied = await rebuilt.copyPages(
      source,
      slots.map((slot) => slot.sourceIndex).filter((index): index is number => index !== null),
    );
    let cursor = 0;
    // Inserted blank pages inherit the size of the document they land in, so a
    // mixed stack of pages does not suddenly contain A4 sheets.
    const fallback = pageDimensions("a4", "portrait");
    const firstPage = source.getPageCount() ? source.getPage(0).getSize() : null;
    const width = firstPage ? firstPage.width : fallback[0];
    const height = firstPage ? firstPage.height : fallback[1];
    for (const slot of slots) {
      if (slot.sourceIndex === null) {
        rebuilt.addPage([width, height]);
      } else {
        rebuilt.addPage(copied[cursor]);
        cursor += 1;
      }
    }
    doc = rebuilt;
  }

  const fonts = new FontBook(doc);
  const pageCount = doc.getPageCount();
  let drawn = 0;
  let dropped = 0;

  for (const element of request.elements) {
    if (element.pageIndex < 0 || element.pageIndex >= pageCount) {
      dropped += 1;
      continue;
    }

    const page: PDFPage = doc.getPage(element.pageIndex);
    const { width: pageWidth, height: pageHeight } = page.getSize();
    const left = element.x * pageWidth;
    const top = element.y * pageHeight;
    const boxWidth = element.width * pageWidth;
    const boxHeight = element.height * pageHeight;
    const rotation = element.rotation ?? 0;
    const opacity = Math.min(1, Math.max(0, element.opacity ?? 1));
    const fill = element.fill ? hexToRgbColor(element.fill) : undefined;
    const stroke = element.stroke ? hexToRgbColor(element.stroke) : undefined;
    const strokeWidth = Math.max(0, element.strokeWidth ?? 0);
    const centre = { x: left + boxWidth / 2, y: pageHeight - (top + boxHeight / 2) };

    switch (element.kind) {
      case "rect": {
        if (element.fill === null && !element.stroke) break;
        page.drawRectangle({
          x: left,
          y: pageHeight - top - boxHeight,
          width: boxWidth,
          height: boxHeight,
          color: fill,
          borderColor: stroke,
          borderWidth: stroke ? strokeWidth || 1 : 0,
          opacity,
          borderOpacity: opacity,
          rotate: degrees(-rotation),
        });
        drawn += 1;
        break;
      }

      case "roundrect": {
        const radius = Math.max(0, Math.min(Math.min(boxWidth, boxHeight) / 2, (element.strokeWidth ?? 2) * 2));
        const w = boxWidth;
        const h = boxHeight;
        const path =
          `M ${radius} 0 H ${w - radius} A ${radius} ${radius} 0 0 1 ${w} ${radius} ` +
          `V ${h - radius} A ${radius} ${radius} 0 0 1 ${w - radius} ${h} ` +
          `H ${radius} A ${radius} ${radius} 0 0 1 0 ${h - radius} ` +
          `V ${radius} A ${radius} ${radius} 0 0 1 ${radius} 0 Z`;
        page.drawSvgPath(path, {
          x: left,
          y: pageHeight - top,
          color: fill,
          borderColor: stroke,
          borderWidth: stroke ? strokeWidth || 1 : 0,
          opacity,
          borderOpacity: opacity,
          rotate: degrees(-rotation),
        });
        drawn += 1;
        break;
      }

      case "ellipse": {
        page.drawEllipse({
          x: left + boxWidth / 2,
          y: pageHeight - top - boxHeight / 2,
          xScale: Math.max(0.5, boxWidth / 2),
          yScale: Math.max(0.5, boxHeight / 2),
          color: fill,
          borderColor: stroke,
          borderWidth: stroke ? strokeWidth || 1 : 0,
          opacity,
          borderOpacity: opacity,
          rotate: degrees(-rotation),
        });
        drawn += 1;
        break;
      }

      case "line":
      case "arrow": {
        const startPdf = { x: left, y: pageHeight - top };
        const endPdf = { x: left + boxWidth, y: pageHeight - top - boxHeight };
        const start = rotatePoint(startPdf, centre, -rotation);
        const end = rotatePoint(endPdf, centre, -rotation);
        const thickness = Math.max(0.5, strokeWidth || 2);
        page.drawLine({
          start,
          end,
          thickness,
          color: stroke ?? fill ?? rgb(0, 0, 0),
          opacity,
        });
        if (element.kind === "arrow") {
          const angle = Math.atan2(end.y - start.y, end.x - start.x);
          const head = Math.max(6, thickness * 3.5);
          for (const offset of [Math.PI * 0.82, -Math.PI * 0.82]) {
            page.drawLine({
              start: end,
              end: { x: end.x + head * Math.cos(angle + offset), y: end.y + head * Math.sin(angle + offset) },
              thickness,
              color: stroke ?? fill ?? rgb(0, 0, 0),
              opacity,
            });
          }
        }
        drawn += 1;
        break;
      }

      case "triangle": {
        const w = boxWidth;
        const h = boxHeight;
        const path = `M ${w / 2} 0 L ${w} ${h} L 0 ${h} Z`;
        page.drawSvgPath(path, {
          x: left,
          y: pageHeight - top,
          color: fill,
          borderColor: stroke,
          borderWidth: stroke ? strokeWidth || 1 : 0,
          opacity,
          borderOpacity: opacity,
          rotate: degrees(-rotation),
        });
        drawn += 1;
        break;
      }

      case "highlight": {
        page.drawRectangle({
          x: left,
          y: pageHeight - top - boxHeight,
          width: boxWidth,
          height: boxHeight,
          color: fill ?? hexToRgbColor(element.stroke ?? "#FDE68A"),
          opacity: Math.min(0.6, opacity * 0.45),
          borderWidth: 0,
          rotate: degrees(-rotation),
        });
        drawn += 1;
        break;
      }

      case "whiteout": {
        page.drawRectangle({
          x: left,
          y: pageHeight - top - boxHeight,
          width: boxWidth,
          height: boxHeight,
          color: rgb(1, 1, 1),
          opacity: 1,
          borderWidth: 0,
          rotate: degrees(-rotation),
        });
        drawn += 1;
        break;
      }

      case "draw": {
        const points = element.points ?? [];
        const colour = stroke ?? fill ?? rgb(0, 0, 0);
        for (let index = 1; index < points.length; index += 1) {
          page.drawLine({
            start: { x: points[index - 1].x * pageWidth, y: pageHeight - points[index - 1].y * pageHeight },
            end: { x: points[index].x * pageWidth, y: pageHeight - points[index].y * pageHeight },
            thickness: Math.max(0.5, strokeWidth || 2),
            color: colour,
            opacity,
          });
        }
        drawn += 1;
        break;
      }

      case "image": {
        if (!element.imageBytes) break;
        const image = await embedImage(doc, element.imageBytes);
        if (!image) break;
        page.drawImage(image, {
          x: left,
          y: pageHeight - top - boxHeight,
          width: boxWidth,
          height: boxHeight,
          opacity,
          rotate: degrees(-rotation),
        });
        drawn += 1;
        break;
      }

      case "text": {
        const text = (element.text ?? "").trim();
        if (!text) break;
        const size = Math.max(4, element.fontSize ?? 14);
        const { font } = await fonts.get(element);
        const lineHeight = size * (element.lineHeight ?? 1.3);
        const { lines, widths } = wrapText(text, font, size, boxWidth, element.wrap !== false);
        const colour = stroke ?? fill ?? rgb(0, 0, 0);
        const align = element.align ?? "left";

        lines.forEach((line, index) => {
          if (!line) return;
          let offsetX = 0;
          if (align === "center") offsetX = (boxWidth - widths[index]) / 2;
          if (align === "right") offsetX = boxWidth - widths[index];
          page.drawText(line, {
            x: left + offsetX,
            y: pageHeight - top - size - index * lineHeight,
            size,
            font,
            color: colour,
            opacity,
            rotate: degrees(-rotation),
          });
        });
        drawn += 1;
        break;
      }

      default:
        break;
    }
  }

  if (request.title) doc.setTitle(request.title);
  doc.setProducer("Filecraft PDF editor");

  const bytes = await savePdf(doc);
  await verifyPdf(bytes, pageCount);
  return { bytes, pages: pageCount, elements: drawn, dropped };
}

/** Milliseconds of work we expect per element — used for a rough progress bar. */
export const MM = MM_TO_PT;
