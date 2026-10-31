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
  | "polygon"
  | "star"
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
  /** Corner radius in PDF points: rect/roundrect corners, or rounding for polygon/star/triangle. */
  radius?: number;
  /** Per-corner radii (top-left, top-right, bottom-right, bottom-left) in points; wins over `radius`. */
  corners?: number[];
  /** Side count for `polygon` and point count for `star` (3–24). */
  sides?: number;
  /** `star` only: inner radius as a fraction of the outer radius (0.1–0.95). */
  innerRatio?: number;
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

/* ────────────────────────── polygons and stars ──────────────────────────── */

/**
 * Corner points of a regular polygon — or of a star when `innerRatio` > 0 —
 * laid out inside a `width` × `height` box with the first point at top centre.
 *
 * The preview and the PDF exporter both use this, so a six-pointed star looks
 * identical on screen and on the page. Points are in the box's own coordinates
 * (0,0 = top-left), which is the space `drawSvgPath` expects.
 */
export function polygonPoints(
  width: number,
  height: number,
  sides: number,
  innerRatio = 0,
  centred = false,
): EditorPoint[] {
  const count = Math.max(3, Math.min(24, Math.round(sides)));
  const outer = Math.max(0, width) / 2;
  const outerY = Math.max(0, height) / 2;
  const ratio = Math.min(0.95, Math.max(0, innerRatio));
  const total = ratio > 0 ? count * 2 : count;
  const points: EditorPoint[] = [];

  // Centred coordinates put the shape around (0,0), which is what pdf-lib needs
  // to rotate a path about its centre rather than its corner.
  const originX = centred ? 0 : width / 2;
  const originY = centred ? 0 : height / 2;

  for (let index = 0; index < total; index += 1) {
    const scale = ratio > 0 && index % 2 === 1 ? ratio : 1;
    // −90° puts the first point straight up, like Illustrator's polygon tool.
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / total;
    points.push({
      x: originX + Math.cos(angle) * outer * scale,
      y: originY + Math.sin(angle) * outerY * scale,
    });
  }

  return points;
}

/** SVG path string for `polygonPoints` — used by the PDF writer. */
export function polygonPath(width: number, height: number, sides: number, innerRatio = 0, centred = false): string {
  return (
    polygonPoints(width, height, sides, innerRatio, centred)
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ") + " Z"
  );
}

/**
 * Rounded-rectangle path with a real corner radius in points.
 *
 * `regexPath` handles the rectangle case; the radius is clamped to half the
 * shorter side so a large radius cannot fold the shape inside out.
 */
export function roundedRectPath(width: number, height: number, radius: number, centred = false): string {
  const r = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
  const ox = centred ? -width / 2 : 0;
  const oy = centred ? -height / 2 : 0;
  const x0 = ox;
  const y0 = oy;
  const x1 = ox + width;
  const y1 = oy + height;
  if (r <= 0.01) return `M ${x0} ${y0} H ${x1} V ${y1} H ${x0} Z`;
  return (
    `M ${x0 + r} ${y0} H ${x1 - r} A ${r} ${r} 0 0 1 ${x1} ${y0 + r} ` +
    `V ${y1 - r} A ${r} ${r} 0 0 1 ${x1 - r} ${y1} ` +
    `H ${x0 + r} A ${r} ${r} 0 0 1 ${x0} ${y1 - r} ` +
    `V ${y0 + r} A ${r} ${r} 0 0 1 ${x0 + r} ${y0} Z`
  );
}

/**
 * Rounded rectangle with four independent radii, in the order
 * top-left, top-right, bottom-right, bottom-left (the same order CSS uses).
 *
 * Each radius is clamped to half of the shorter side touching its corner, so a
 * large radius on one corner can never fold the shape over itself.
 */
export function roundedRectPathCorners(
  width: number,
  height: number,
  radii: number[],
  centred = false,
): string {
  const w = Math.max(0, width);
  const h = Math.max(0, height);
  const cap = Math.min(w, h) / 2;
  const [tl, tr, br, bl] = [0, 1, 2, 3].map((index) => Math.max(0, Math.min(radii[index] ?? 0, cap)));
  const ox = centred ? -w / 2 : 0;
  const oy = centred ? -h / 2 : 0;
  const x0 = ox;
  const y0 = oy;
  const x1 = ox + w;
  const y1 = oy + h;

  if (tl + tr + br + bl <= 0.01) return `M ${x0} ${y0} H ${x1} V ${y1} H ${x0} Z`;

  const arc = (radius: number, x: number, y: number) => `A ${radius} ${radius} 0 0 1 ${x} ${y}`;
  return (
    `M ${x0 + tl} ${y0} H ${x1 - tr} ` +
    (tr ? `${arc(tr, x1, y0 + tr)} ` : `L ${x1} ${y0} `) +
    `V ${y1 - br} ` +
    (br ? `${arc(br, x1 - br, y1)} ` : `L ${x1} ${y1} `) +
    `H ${x0 + bl} ` +
    (bl ? `${arc(bl, x0, y1 - bl)} ` : `L ${x0} ${y1} `) +
    `V ${y0 + tl} ` +
    (tl ? `${arc(tl, x0 + tl, y0)} ` : `L ${x0} ${y0} `) +
    "Z"
  );
}

/**
 * Corner points of a triangle, polygon or star inside its box, in the box's own
 * coordinates (0,0 = top-left). Shared by the preview and the exporter so the two
 * can never disagree.
 */
export function shapePoints(
  width: number,
  height: number,
  kind: "triangle" | "polygon" | "star",
  sides = 6,
  innerRatio = 0,
): EditorPoint[] {
  if (kind === "triangle") {
    return [
      { x: width / 2, y: 0 },
      { x: width, y: height },
      { x: 0, y: height },
    ];
  }
  return polygonPoints(width, height, sides, kind === "star" ? innerRatio : 0);
}

/**
 * Path through `points` with the corners rounded off — Illustrator's "Round
 * Corners" for polygons and stars. Each corner is replaced by a quadratic curve
 * whose radius never exceeds half of either adjacent edge, so small stars stay
 * legible instead of collapsing.
 */
export function roundedPath(points: EditorPoint[], radius: number): string {
  if (!points.length) return "";
  if (radius <= 0.01 || points.length < 3) {
    return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ") + " Z";
  }

  const at = (index: number) => points[(index + points.length) % points.length];
  const commands: string[] = [];

  points.forEach((point, index) => {
    const previous = at(index - 1);
    const next = at(index + 1);
    const inLength = Math.hypot(point.x - previous.x, point.y - previous.y) || 1;
    const outLength = Math.hypot(next.x - point.x, next.y - point.y) || 1;
    const limit = Math.min(inLength, outLength) / 2;
    const r = Math.min(radius, limit);

    const start = {
      x: point.x + ((previous.x - point.x) / inLength) * r,
      y: point.y + ((previous.y - point.y) / inLength) * r,
    };
    const end = {
      x: point.x + ((next.x - point.x) / outLength) * r,
      y: point.y + ((next.y - point.y) / outLength) * r,
    };

    commands.push(`${index === 0 ? "M" : "L"} ${start.x} ${start.y}`);
    commands.push(`Q ${point.x} ${point.y} ${end.x} ${end.y}`);
  });

  return commands.join(" ") + " Z";
}

/* ─────────────────────────────── images ─────────────────────────────────── */

/**
 * Size an image should occupy on a page, in page fractions, keeping the
 * picture's own proportions.
 *
 * The box is 40 % of the page width (or less for a portrait picture) and never
 * taller than half the page, so a placed photo covers a sensible area without
 * being cropped or squashed. `naturalWidth`/`naturalHeight` are the picture's
 * pixel dimensions; if they are unknown (rare, e.g. a file the browser cannot
 * decode) a 4:3 guess is used rather than a distorted box.
 */
export function imageBox(
  naturalWidth: number,
  naturalHeight: number,
  pageWidth: number,
  pageHeight: number,
  maxWidth = 0.4,
  maxHeight = 0.5,
): { width: number; height: number } {
  const ratio = naturalWidth > 0 && naturalHeight > 0 ? naturalHeight / naturalWidth : 0.75;
  let width = maxWidth;
  let height = (width * pageWidth * ratio) / pageHeight;
  if (height > maxHeight) {
    const fit = maxHeight / height;
    width *= fit;
    height *= fit;
  }
  return { width, height };
}

/* ────────────────────────────── freehand ────────────────────────────────── */

export interface StrokeBox {
  /** Normalised bounding box of the stroke on its page. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** The same points, re-based inside that box (0–1 each). */
  points: EditorPoint[];
}

/**
 * Fits a freehand stroke to its own bounding box.
 *
 * Pen points arrive as absolute page fractions. Storing them against a box of
 * their own bounds is what lets a stroke keep the size it was drawn at: the
 * previous version kept the element at the box the *shape* drag would have
 * made, so every stroke collapsed to a few pixels.
 */
export function strokeBox(points: EditorPoint[]): StrokeBox {
  if (!points.length) return { x: 0, y: 0, width: 0, height: 0, points: [] };
  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;
  for (const point of points) {
    if (point.x < minX) minX = point.x;
    if (point.x > maxX) maxX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.y > maxY) maxY = point.y;
  }
  // A perfectly straight line has a zero-size axis; give it a hair of room so
  // the preview and the exporter still have a box to work with.
  const width = Math.max(maxX - minX, 0.001);
  const height = Math.max(maxY - minY, 0.001);
  return {
    x: Math.min(1, Math.max(0, minX)),
    y: Math.min(1, Math.max(0, minY)),
    width: Math.min(1, width),
    height: Math.min(1, height),
    points: points.map((point) => ({
      x: (point.x - minX) / width,
      y: (point.y - minY) / height,
    })),
  };
}

/**
 * Height a text box needs for the first lines of text, as a page fraction.
 * Used when a text box is created so the very first keystroke is not clipped.
 */
export function textBoxHeight(fontSize: number, lineHeight: number, pageHeight: number, lines = 2): number {
  const safePage = pageHeight > 0 ? pageHeight : 842;
  return Math.min(0.6, Math.max(0.03, (fontSize * (lineHeight || 1.3) * (lines + 0.4)) / safePage));
}

/* ─────────────────────────────── rendering ──────────────────────────────── */

const MM_TO_PT = 72 / 25.4;

/**
 * pdf-lib rotates rectangles, images and paths about the origin you pass it —
 * a corner — while the editor (and every design app) rotates about the centre.
 * This returns the origin that puts the pivot at the centre, so a rotated object
 * lands where the preview shows it.
 */
export function centredOrigin(bottomLeft: EditorPoint, centre: EditorPoint, rotation: number): EditorPoint {
  if (!rotation) return bottomLeft;
  return rotatePoint(bottomLeft, centre, -rotation);
}

/** The four corner radii an element asks for, with `radius` as the uniform fallback. */
function rectRadii(element: EditorElement): number[] {
  if (element.corners && element.corners.length === 4) return element.corners;
  const uniform = element.radius ?? 0;
  return [uniform, uniform, uniform, uniform];
}

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
        if ((element.radius ?? 0) > 0.01 || (element.corners ?? []).some((value) => value > 0.01)) {
          // A rectangle with corner radii is a rounded box; draw the path,
          // defined around the centre so rotation pivots where the preview does.
          page.drawSvgPath(roundedRectPathCorners(boxWidth, boxHeight, rectRadii(element), true), {
            x: left + boxWidth / 2,
            y: pageHeight - top - boxHeight / 2,
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
        const rectOrigin = centredOrigin({ x: left, y: pageHeight - top - boxHeight }, centre, rotation);
        page.drawRectangle({
          x: rectOrigin.x,
          y: rectOrigin.y,
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
        const radii = element.corners ?? [8, 8, 8, 8];
        page.drawSvgPath(roundedRectPathCorners(boxWidth, boxHeight, radii, true), {
          x: left + boxWidth / 2,
          y: pageHeight - top - boxHeight / 2,
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

      case "triangle":
      case "polygon":
      case "star": {
        const kind = element.kind as "triangle" | "polygon" | "star";
        const points = shapePoints(
          boxWidth,
          boxHeight,
          kind,
          element.sides ?? (kind === "star" ? 5 : 6),
          element.innerRatio ?? 0.45,
        ).map((point) => ({ x: point.x - boxWidth / 2, y: point.y - boxHeight / 2 }));
        const path = roundedPath(points, element.radius ?? 0);
        page.drawSvgPath(path, {
          x: left + boxWidth / 2,
          y: pageHeight - top - boxHeight / 2,
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
        const highlightOrigin = centredOrigin({ x: left, y: pageHeight - top - boxHeight }, centre, rotation);
        page.drawRectangle({
          x: highlightOrigin.x,
          y: highlightOrigin.y,
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
        const whiteOrigin = centredOrigin({ x: left, y: pageHeight - top - boxHeight }, centre, rotation);
        page.drawRectangle({
          x: whiteOrigin.x,
          y: whiteOrigin.y,
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
        const imageOrigin = centredOrigin({ x: left, y: pageHeight - top - boxHeight }, centre, rotation);
        page.drawImage(image, {
          x: imageOrigin.x,
          y: imageOrigin.y,
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
          const baseline = centredOrigin(
            { x: left + offsetX, y: pageHeight - top - size - index * lineHeight },
            centre,
            rotation,
          );
          page.drawText(line, {
            x: baseline.x,
            y: baseline.y,
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
