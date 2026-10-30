/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  PowerPoint (.pptx) → PDF
 *
 *  A .pptx is a ZIP of XML. This reads the presentation size, the slide order,
 *  and each slide's shapes, then draws them into a PDF page using pdf-lib:
 *
 *    • text boxes — paragraphs, bullets, alignment, bold/italic, colour, size,
 *      wrapped and shrunk to fit the box the way PowerPoint's autofit does;
 *    • pictures — PNG/JPEG embedded at their transformed position;
 *    • solid-filled shapes and slide backgrounds;
 *    • tables flattened to aligned text rows (stated as a limit on the page).
 *
 *  Placeholders that inherit their position from the slide layout or master are
 *  resolved through those parts, because a deck built from a template stores
 *  almost no geometry on the slides themselves.
 *
 *  It is a faithful preview, not PowerPoint: animations, transitions, charts,
 *  SmartArt, gradients, shadows, 3-D and video are not reproduced.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import JSZip from "jszip";
import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import { getFontPair } from "../pdf/fonts.ts";
import { wrapText } from "../pdf/editor.ts";

const EMU_PER_POINT = 12700;

export interface PptxTextRun {
  text: string;
  bold: boolean;
  italic: boolean;
}

export interface PptxParagraph {
  runs: PptxTextRun[];
  size: number;
  color: string;
  align: "left" | "center" | "right";
  bullet: boolean;
  level: number;
}

export interface PptxText {
  kind: "text";
  x: number;
  y: number;
  width: number;
  height: number;
  paragraphs: PptxParagraph[];
  /** Solid fill behind the text box, if the shape has one. */
  fill?: string;
  border?: string;
}

export interface PptxImage {
  kind: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  bytes: Uint8Array;
  type: "png" | "jpg";
}

export interface PptxRect {
  kind: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  border?: string;
}

export type PptxElement = PptxText | PptxImage | PptxRect;

export interface PptxSlide {
  number: number;
  width: number;
  height: number;
  background?: string;
  elements: PptxElement[];
}

export interface PptxDeck {
  slides: PptxSlide[];
  width: number;
  height: number;
  warnings: string[];
}

/* ─────────────────────────────── helpers ────────────────────────────────── */

const emu = (value: string | null | undefined): number => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number / EMU_PER_POINT : 0;
};

const attr = (element: Element | null | undefined, name: string): string | null => element?.getAttribute(name) ?? null;

/**
 * PowerPoint XML is namespaced (`p:` shapes, `a:` drawing), and CSS selectors
 * cannot take a namespace prefix as a plain element name — `querySelector
 * ("p:sldSz")` throws in a real browser as well as in jsdom. These two helpers
 * use the qualified tag name instead, which works in every XML DOM.
 */
const all = (root: Element | Document | null | undefined, tag: string): Element[] =>
  root ? Array.from(root.getElementsByTagName(tag)) : [];
const one = (root: Element | Document | null | undefined, tag: string): Element | null =>
  root ? root.getElementsByTagName(tag)[0] ?? null : null;

/**
 * In an XML document `getElementsByTagName` matches the *qualified* name, so a
 * search for "srgbClr" never finds "a:srgbClr". Matching on `localName` keeps
 * this working whatever prefix the producer chose.
 */
function descendant(parent: Element | null | undefined, localName: string): Element | null {
  if (!parent) return null;
  for (const element of Array.from(parent.getElementsByTagName("*"))) {
    if (element.localName === localName) return element;
  }
  return null;
}

/** Resolves `<a:srgbClr val="…">`, `<a:schemeClr val="…">` and `<a:prstClr>`. */
function readColor(parent: Element | null | undefined): string | null {
  if (!parent) return null;
  const srgb = descendant(parent, "srgbClr");
  if (srgb) {
    const value = attr(srgb, "val");
    if (value && /^[0-9a-f]{6}$/i.test(value)) return `#${value}`;
  }
  const scheme = descendant(parent, "schemeClr");
  if (scheme) {
    const value = attr(scheme, "val") ?? "";
    if (value === "tx1" || value === "dk1") return "#000000";
    if (value === "bg1" || value === "lt1") return "#FFFFFF";
    if (value === "tx2" || value === "dk2") return "#44546A";
    if (value === "bg2" || value === "lt2") return "#E7E6E6";
    if (value.startsWith("accent")) {
      const accents: Record<string, string> = {
        accent1: "#4472C4",
        accent2: "#ED7D31",
        accent3: "#A5A5A5",
        accent4: "#FFC000",
        accent5: "#5B9BD5",
        accent6: "#70AD47",
      };
      return accents[value] ?? "#4472C4";
    }
    return "#000000";
  }
  const preset = descendant(parent, "prstClr");
  if (preset) {
    const name = attr(preset, "val") ?? "black";
    const presets: Record<string, string> = {
      black: "#000000",
      white: "#FFFFFF",
      red: "#FF0000",
      green: "#008000",
      blue: "#0000FF",
      yellow: "#FFFF00",
      gray: "#808080",
      grey: "#808080",
    };
    return presets[name] ?? "#000000";
  }
  return null;
}

const hexToRgb = (hex: string) => {
  const clean = hex.replace("#", "");
  const value = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  return rgb(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255);
};

function parseXml(text: string, label: string): Document {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) throw new Error(`The ${label} inside this .pptx could not be read.`);
  return doc;
}

/** Path helper for the relationship targets that .pptx files use. */
function resolvePath(base: string, target: string): string {
  if (target.startsWith("/")) return target.slice(1);
  const baseParts = base.split("/").slice(0, -1);
  for (const part of target.split("/")) {
    if (part === "..") baseParts.pop();
    else if (part !== ".") baseParts.push(part);
  }
  return baseParts.join("/");
}

interface Rel {
  target: string;
  type: string;
}

async function readRels(zip: JSZip, relsPath: string, baseFolder: string): Promise<Map<string, Rel>> {
  const map = new Map<string, Rel>();
  const file = zip.file(relsPath);
  if (!file) return map;
  const xml = parseXml(await file.async("string"), "relationships");
  for (const rel of all(xml, "Relationship")) {
    const id = attr(rel, "Id");
    const target = attr(rel, "Target");
    if (!id || !target) continue;
    const baseDir = baseFolder.split("/").slice(0, -1).join("/");
    map.set(id, { target: resolvePath(`${baseDir}/x`, target), type: attr(rel, "Type") ?? "" });
  }
  return map;
}

/* ─────────────────────────── placeholder geometry ───────────────────────── */

interface Placeholder {
  x: number;
  y: number;
  width: number;
  height: number;
  size?: number;
  bold?: boolean;
  color?: string;
  align?: "left" | "center" | "right";
}

function placeholderKey(type: string | null, idx: string | null): string[] {
  const keys: string[] = [];
  if (idx) keys.push(`idx:${idx}`);
  const normalised = (type ?? "obj").replace("ctrTitle", "title").replace("subTitle", "body");
  keys.push(`type:${normalised}`);
  keys.push(`type:obj`);
  return keys;
}

function readPlaceholders(root: Document): Map<string, Placeholder> {
  const map = new Map<string, Placeholder>();
  for (const shape of all(root, "p:sp")) {
    const ph = one(shape, "p:ph");
    if (!ph) continue;
    const xfrm = one(shape, "a:xfrm");
    const off = one(xfrm, "a:off");
    const ext = one(xfrm, "a:ext");
    if (!off || !ext) continue;
    const properties = one(shape, "a:defRPr");
    const sizeValue = attr(properties, "sz");
    const placeholder: Placeholder = {
      x: emu(attr(off, "x")),
      y: emu(attr(off, "y")),
      width: emu(attr(ext, "cx")),
      height: emu(attr(ext, "cy")),
      size: sizeValue ? Number(sizeValue) / 100 : undefined,
      bold: properties ? attr(properties, "b") === "1" : undefined,
      color: readColor(properties) ?? undefined,
      align: (attr(one(shape, "a:pPr"), "algn") as Placeholder["align"]) ?? undefined,
    };
    for (const key of placeholderKey(attr(ph, "type"), attr(ph, "idx"))) {
      if (!map.has(key)) map.set(key, placeholder);
    }
  }
  return map;
}

/* ─────────────────────────────── parsing ────────────────────────────────── */

function readParagraphs(textBody: Element | null, fallbackSize: number, fallbackColor: string, fallbackAlign: "left" | "center" | "right" = "left"): PptxParagraph[] {
  if (!textBody) return [];
  const paragraphs: PptxParagraph[] = [];
  for (const p of all(textBody, "a:p")) {
    const pPr = one(p, "a:pPr");
    const level = Number(attr(pPr, "lvl") ?? 0);
    const align = (attr(pPr, "algn") as PptxParagraph["align"]) ?? fallbackAlign;
    const bullet = Boolean(one(p, "a:buChar") || one(p, "a:buAutoNum"));
    const runs: PptxTextRun[] = [];
    let size = fallbackSize;
    let color = fallbackColor;

    for (const node of Array.from(p.childNodes)) {
      if (node.nodeType !== 1) continue;
      const element = node as Element;
      if (element.tagName === "a:r" || element.tagName === "a:fld") {
        const text = one(element, "a:t")?.textContent ?? "";
        const rPr = one(element, "a:rPr");
        const runSize = attr(rPr, "sz");
        if (runSize) size = Number(runSize) / 100;
        const runColor = readColor(rPr);
        if (runColor) color = runColor;
        if (text) {
          runs.push({
            text,
            bold: attr(rPr, "b") === "1",
            italic: attr(rPr, "i") === "1",
          });
        }
      } else if (element.tagName === "a:br") {
        runs.push({ text: "\n", bold: false, italic: false });
      }
    }

    if (!runs.length) continue;
    paragraphs.push({ runs, size, color, align, bullet, level });
  }
  return paragraphs;
}

async function walkShapeTree(
  tree: Element,
  zip: JSZip,
  slideRels: Map<string, Rel>,
  placeholders: Map<string, Placeholder>,
  media: Map<string, Uint8Array>,
  warnings: string[],
  offset = { x: 0, y: 0, scaleX: 1, scaleY: 1 },
): Promise<PptxElement[]> {
  const elements: PptxElement[] = [];

  for (const node of Array.from(tree.children)) {
    if (node.tagName === "p:grpSp") {
      const xfrm = one(node, "a:xfrm");
      const off = one(xfrm, "a:off");
      const ext = one(xfrm, "a:ext");
      const chOff = one(xfrm, "a:chOff");
      const chExt = one(xfrm, "a:chExt");
      const groupX = emu(attr(off, "x"));
      const groupY = emu(attr(off, "y"));
      const groupW = emu(attr(ext, "cx")) || 1;
      const groupH = emu(attr(ext, "cy")) || 1;
      const childX = emu(attr(chOff, "x"));
      const childY = emu(attr(chOff, "y"));
      const childW = emu(attr(chExt, "cx")) || groupW;
      const childH = emu(attr(chExt, "cy")) || groupH;
      const groupScaleX = (groupW / childW) * offset.scaleX;
      const groupScaleY = (groupH / childH) * offset.scaleY;
      const nested = await walkShapeTree(node, zip, slideRels, placeholders, media, warnings, {
        x: offset.x + (groupX - childX * groupScaleX),
        y: offset.y + (groupY - childY * groupScaleY),
        scaleX: groupScaleX,
        scaleY: groupScaleY,
      });
      elements.push(...nested);
      continue;
    }

    if (node.tagName === "p:graphicFrame") {
      const table = one(node, "a:tbl");
      const xfrm = one(node, "p:xfrm");
      if (table && xfrm) {
        const off = one(xfrm, "a:off");
        const ext = one(xfrm, "a:ext");
        const rows = all(table, "a:tr").map((row) =>
          all(row, "a:tc")
            .map((cell) => (cell.textContent ?? "").replace(/\s+/g, " ").trim())
            .join("  |  "),
        );
        const paragraphs: PptxParagraph[] = rows.map((text) => ({
          runs: [{ text, bold: false, italic: false }],
          size: 11,
          color: "#000000",
          align: "left",
          bullet: false,
          level: 0,
        }));
        if (paragraphs.length) {
          elements.push({
            kind: "text",
            x: offset.x + emu(attr(off, "x")) * offset.scaleX,
            y: offset.y + emu(attr(off, "y")) * offset.scaleY,
            width: emu(attr(ext, "cx")) * offset.scaleX,
            height: emu(attr(ext, "cy")) * offset.scaleY,
            paragraphs,
            border: "#D0D0D0",
          });
          warnings.push("table flattened");
        }
      }
      continue;
    }

    if (node.tagName === "p:pic") {
      const xfrm = one(node, "a:xfrm");
      const off = one(xfrm, "a:off");
      const ext = one(xfrm, "a:ext");
      const blip = one(node, "a:blip");
      const embed = attr(blip, "r:embed") ?? attr(blip, "r:link");
      if (!off || !ext || !embed) continue;
      const rel = slideRels.get(embed);
      if (!rel) continue;
      let bytes = media.get(rel.target);
      if (!bytes) {
        const file = zip.file(rel.target);
        if (!file) continue;
        bytes = await file.async("uint8array");
        media.set(rel.target, bytes);
      }
      const isJpeg = /\.jpe?g$/i.test(rel.target) || (bytes[0] === 0xff && bytes[1] === 0xd8);
      const isPng = /\.png$/i.test(rel.target) || (bytes[0] === 0x89 && bytes[1] === 0x50);
      if (!isJpeg && !isPng) {
        warnings.push("unsupported image");
        continue;
      }
      elements.push({
        kind: "image",
        x: offset.x + emu(attr(off, "x")) * offset.scaleX,
        y: offset.y + emu(attr(off, "y")) * offset.scaleY,
        width: emu(attr(ext, "cx")) * offset.scaleX,
        height: emu(attr(ext, "cy")) * offset.scaleY,
        bytes: bytes.slice(0),
        type: isPng ? "png" : "jpg",
      });
      continue;
    }

    if (node.tagName === "p:sp") {
      const shapeProperties = one(node, "p:spPr");
      const xfrm = one(shapeProperties, "a:xfrm");
      const ph = one(node, "p:ph");
      const off = one(xfrm, "a:off");
      const ext = one(xfrm, "a:ext");

      let x = 0;
      let y = 0;
      let width = 0;
      let height = 0;

      if (off && ext) {
        x = emu(attr(off, "x"));
        y = emu(attr(off, "y"));
        width = emu(attr(ext, "cx"));
        height = emu(attr(ext, "cy"));
      } else if (ph) {
        const inherited = placeholderKey(attr(ph, "type"), attr(ph, "idx"))
          .map((key) => placeholders.get(key))
          .find(Boolean);
        if (inherited) {
          x = inherited.x;
          y = inherited.y;
          width = inherited.width;
          height = inherited.height;
        }
      }

      x = offset.x + x * offset.scaleX;
      y = offset.y + y * offset.scaleY;
      width *= offset.scaleX;
      height *= offset.scaleY;

      if (width <= 0 || height <= 0) continue;

      const isTitle = /title/i.test(attr(ph, "type") ?? "");
      const fallbackSize = isTitle ? 32 : 18;
      const paragraphs = readParagraphs(
        one(node, "p:txBody"),
        fallbackSize,
        isTitle ? "#000000" : "#000000",
        isTitle ? "left" : "left",
      );

      const fill = readColor(one(shapeProperties, "a:solidFill"));
      const line = readColor(one(one(shapeProperties, "a:ln"), "a:solidFill"));
      const hasOutline = Boolean(one(shapeProperties, "a:ln"));

      if (paragraphs.length) {
        elements.push({
          kind: "text",
          x,
          y,
          width,
          height,
          paragraphs,
          fill: fill ?? undefined,
          border: hasOutline ? line ?? "#000000" : undefined,
        });
      } else if (fill || hasOutline) {
        elements.push({ kind: "rect", x, y, width, height, fill: fill ?? undefined, border: hasOutline ? line ?? "#000000" : undefined });
      }
      continue;
    }

    // Connectors: draw as a line only when they have a fill/stroke colour.
    if (node.tagName === "p:cxnSp") {
      const xfrm = one(node, "a:xfrm");
      const off = one(xfrm, "a:off");
      const ext = one(xfrm, "a:ext");
      if (!off || !ext) continue;
      const color = readColor(one(one(node, "a:ln"), "a:solidFill")) ?? "#404040";
      elements.push({
        kind: "rect",
        x: offset.x + emu(attr(off, "x")) * offset.scaleX,
        y: offset.y + emu(attr(off, "y")) * offset.scaleY,
        width: Math.max(1, emu(attr(ext, "cx")) * offset.scaleX),
        height: Math.max(1, emu(attr(ext, "cy")) * offset.scaleY),
        border: color,
      });
    }
  }

  return elements;
}

export async function parsePptx(bytes: ArrayBuffer): Promise<PptxDeck> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(bytes);
  } catch {
    throw new Error("This file is not a readable .pptx. Legacy .ppt files (PowerPoint 97–2003) cannot be opened in a browser.");
  }

  const presentationFile = zip.file("ppt/presentation.xml");
  if (!presentationFile) {
    throw new Error("This does not look like a PowerPoint file — the presentation part is missing. If it is a .ppt, save it as .pptx first.");
  }
  const presentation = parseXml(await presentationFile.async("string"), "presentation");
  const sizeElement = one(presentation, "p:sldSz");
  const width = emu(attr(sizeElement, "cx")) || 960;
  const height = emu(attr(sizeElement, "cy")) || 540;

  const rels = new Map<string, Rel>();
  const relsFile = zip.file("ppt/_rels/presentation.xml.rels");
  if (relsFile) {
    const relsXml = parseXml(await relsFile.async("string"), "relationships");
    for (const rel of all(relsXml, "Relationship")) {
      const id = attr(rel, "Id");
      const target = attr(rel, "Target");
      if (id && target) rels.set(id, { target: resolvePath("ppt/x", target), type: attr(rel, "Type") ?? "" });
    }
  }

  const slidePaths: string[] = [];
  for (const slideId of all(presentation, "p:sldId")) {
    const rid = attr(slideId, "r:id") ?? attr(slideId, "id");
    const rel = rid ? rels.get(rid) : undefined;
    if (rel && rel.target.startsWith("ppt/")) slidePaths.push(rel.target);
  }
  if (!slidePaths.length) {
    // Fall back to numeric order when the relationship list is unusual.
    const numeric = Object.keys(zip.files)
      .filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path))
      .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]));
    slidePaths.push(...numeric);
  }
  if (!slidePaths.length) throw new Error("This presentation has no slides, so there is nothing to convert.");

  const warnings: string[] = [];
  const media = new Map<string, Uint8Array>();
  const slides: PptxSlide[] = [];

  for (let index = 0; index < slidePaths.length; index += 1) {
    const path = slidePaths[index];
    const file = zip.file(path);
    if (!file) continue;
    const xml = parseXml(await file.async("string"), `slide ${index + 1}`);
    const slideRels = await readRels(zip, path.replace("slides/", "slides/_rels/") + ".rels", path);

    // Placeholder geometry from the layout, then the master behind it.
    const placeholders = new Map<string, Placeholder>();
    const layoutRel = Array.from(slideRels.values()).find((rel) => /slideLayout\d*\.xml$/.test(rel.target));
    if (layoutRel) {
      const layoutFile = zip.file(layoutRel.target);
      if (layoutFile) {
        const layoutXml = parseXml(await layoutFile.async("string"), "slide layout");
        for (const [key, value] of readPlaceholders(layoutXml)) placeholders.set(key, value);
        const layoutRels = await readRels(zip, layoutRel.target.replace("slideLayouts/", "slideLayouts/_rels/") + ".rels", layoutRel.target);
        const masterRel = Array.from(layoutRels.values()).find((rel) => /slideMaster\d*\.xml$/.test(rel.target));
        if (masterRel) {
          const masterFile = zip.file(masterRel.target);
          if (masterFile) {
            const masterXml = parseXml(await masterFile.async("string"), "slide master");
            for (const [key, value] of readPlaceholders(masterXml)) if (!placeholders.has(key)) placeholders.set(key, value);
          }
        }
      }
    }

    const tree = one(xml, "p:spTree");
    if (!tree) continue;
    const elements = await walkShapeTree(tree, zip, slideRels, placeholders, media, warnings);
    const background = readColor(one(xml, "p:bgPr")) ?? undefined;

    slides.push({
      number: index + 1,
      width,
      height,
      background,
      elements: elements.sort((a, b) => a.y - b.y),
    });
  }

  return { slides, width, height, warnings };
}

/* ─────────────────────────────── rendering ──────────────────────────────── */

interface RenderContext {
  doc: PDFDocument;
  regular: PDFFont;
  bold: PDFFont;
}

function wrapParagraph(
  context: RenderContext,
  paragraph: PptxParagraph,
  maxWidth: number,
  startSize: number,
  maxHeight = Infinity,
): { lines: string[]; size: number; lineHeight: number } {
  const text = paragraph.runs
    .map((run) => run.text)
    .join("")
    .replace(/\s+/g, " ")
    .trim();
  let size = Math.max(6, startSize);
  let lineHeight = size * 1.22;
  if (!text) return { lines: [], size, lineHeight };

  const font = paragraph.runs.some((run) => run.bold) ? context.bold : context.regular;
  let lines = wrapText(text, font, size, Math.max(20, maxWidth), true).lines;

  // PowerPoint shrinks overflowing text; six 10% steps is enough for real decks.
  for (let attempt = 0; attempt < 6 && lines.length * lineHeight > maxHeight; attempt += 1) {
    size *= 0.9;
    lineHeight = size * 1.22;
    lines = wrapText(text, font, size, Math.max(20, maxWidth), true).lines;
  }
  return { lines, size, lineHeight };
}

export async function renderPptxToPdf(deck: PptxDeck, title?: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  for (const slide of deck.slides) {
    const page = doc.addPage([slide.width, slide.height]);
    const sample = slide.elements
      .filter((element): element is PptxText => element.kind === "text")
      .map((element) => element.paragraphs.map((paragraph) => paragraph.runs.map((run) => run.text).join("")).join(" "))
      .join(" ");
    const pair = await getFontPair(doc, sample || "Filecraft");
    const context: RenderContext = { doc, regular: pair.regular, bold: pair.bold };

    page.drawRectangle({
      x: 0,
      y: 0,
      width: slide.width,
      height: slide.height,
      color: rgb(1, 1, 1),
    });
    if (slide.background) {
      page.drawRectangle({ x: 0, y: 0, width: slide.width, height: slide.height, color: hexToRgb(slide.background) });
    }

    for (const element of slide.elements) {
      const top = slide.height - element.y;

      if (element.kind === "rect") {
        page.drawRectangle({
          x: element.x,
          y: top - element.height,
          width: element.width,
          height: element.height,
          color: element.fill ? hexToRgb(element.fill) : undefined,
          borderColor: element.border ? hexToRgb(element.border) : undefined,
          borderWidth: element.border ? 1 : 0,
        });
        continue;
      }

      if (element.kind === "image") {
        try {
          const image = element.type === "png" ? await doc.embedPng(element.bytes) : await doc.embedJpg(element.bytes);
          page.drawImage(image, {
            x: element.x,
            y: top - element.height,
            width: element.width,
            height: element.height,
          });
        } catch {
          // A corrupt or CMYK JPEG is skipped rather than failing the deck.
        }
        continue;
      }

      // Text: the shape's fill first, then the paragraphs on top.
      const inset = 7.2;
      if (element.fill) {
        page.drawRectangle({
          x: element.x,
          y: top - element.height,
          width: element.width,
          height: element.height,
          color: hexToRgb(element.fill),
        });
      }
      if (element.border) {
        page.drawRectangle({
          x: element.x,
          y: top - element.height,
          width: element.width,
          height: element.height,
          borderColor: hexToRgb(element.border),
          borderWidth: 0.75,
        });
      }

      let cursor = top - inset;
      const boxWidth = Math.max(20, element.width - inset * 2);

      for (const paragraph of element.paragraphs) {
        const { lines, size, lineHeight } = wrapParagraph(
          context,
          paragraph,
          boxWidth - paragraph.level * 12,
          paragraph.size,
          Math.max(paragraph.size, top - inset - element.y + element.height),
        );
        if (!lines.length) {
          cursor -= paragraph.size * 0.6;
          continue;
        }
        const font = paragraph.runs.some((run) => run.bold) ? context.bold : context.regular;
        const color = hexToRgb(paragraph.color || "#000000");

        lines.forEach((line, lineIndex) => {
          const prefix = paragraph.bullet && lineIndex === 0 ? (paragraph.level ? "– " : "• ") : "";
          const rendered = `${prefix}${line}`;
          const lineWidth = font.widthOfTextAtSize(rendered, size);
          let x = element.x + inset + paragraph.level * 12;
          if (paragraph.align === "center") x = element.x + (element.width - lineWidth) / 2;
          if (paragraph.align === "right") x = element.x + element.width - inset - lineWidth;
          const y = cursor - size;
          if (y < -size) return; // never draw outside the page
          page.drawText(rendered, { x, y, size, font, color });
          cursor -= lineHeight;
        });
      }
    }
  }

  doc.setProducer("Filecraft PowerPoint to PDF");
  if (title) doc.setTitle(title);
  return doc.save({ useObjectStreams: true });
}

/** Slide dimensions reported to the UI, in the units people understand. */
export function describeSlideSize(deck: PptxDeck): string {
  return `${(deck.width / 72).toFixed(2)} × ${(deck.height / 72).toFixed(2)} in (${Math.round(deck.width)} × ${Math.round(deck.height)} pt pages)`;
}
