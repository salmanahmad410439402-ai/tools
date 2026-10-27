import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { getFontPair, type FontPair } from "./fonts.ts";

/**
 * A small, honest text-layout engine used by the TXT, Word, CSV and
 * Markdown/HTML to PDF tools.
 *
 * It is not a typesetting engine: it wraps words, respects explicit line
 * breaks, moves to a new page when a line no longer fits and draws tables with
 * header rows that repeat. That is what a browser can do reliably, and it keeps
 * text selectable and searchable — unlike rendering the page to an image.
 */

export interface InlineRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

export type Block =
  | { type: "heading"; level: 1 | 2 | 3 | 4; runs: InlineRun[] }
  | { type: "paragraph"; runs: InlineRun[]; align?: "left" | "center" | "justify" }
  | { type: "list"; ordered: boolean; items: InlineRun[][]; start?: number }
  | { type: "quote"; runs: InlineRun[] }
  | { type: "code"; text: string }
  | { type: "table"; header?: string[]; rows: string[][] }
  | { type: "hr" }
  | { type: "spacer"; height?: number };

export type PageFormat = "a4" | "letter" | "a5" | "legal";

export const TEXT_PAGE_SIZES: Record<PageFormat, { w: number; h: number }> = {
  a4: { w: 595.28, h: 841.89 },
  letter: { w: 612, h: 792 },
  a5: { w: 419.53, h: 595.28 },
  legal: { w: 612, h: 1008 },
};

export interface TextPdfOptions {
  pageFormat: PageFormat;
  orientation: "portrait" | "landscape";
  /** Margin in millimetres. */
  marginMm: number;
  fontSize: number;
  lineHeight: number;
  /** Optional title printed at the top of the first page. */
  title?: string;
  /** Optional footer, e.g. "Page {n} of {total}". */
  footer?: string;
}

const MM = 72 / 25.4;

interface Line {
  runs: { text: string; bold: boolean; italic: boolean }[];
  width: number;
}

interface Cursor {
  page: PDFPage;
  y: number;
}

function fontFor(fonts: FontPair, bold: boolean): PDFFont {
  return bold ? fonts.bold : fonts.regular;
}

function measure(fonts: FontPair, runs: { text: string; bold: boolean }[], size: number): number {
  return runs.reduce((total, run) => total + fontFor(fonts, run.bold).widthOfTextAtSize(run.text, size), 0);
}

/** Word-wraps a set of styled runs into lines that fit maxWidth. */
function wrapRuns(runs: InlineRun[], maxWidth: number, size: number, fonts: FontPair): Line[] {
  const lines: Line[] = [];
  let current: Line = { runs: [], width: 0 };

  const pushLine = () => {
    lines.push(current);
    current = { runs: [], width: 0 };
  };

  for (const run of runs) {
    const bold = Boolean(run.bold);
    const parts = run.text.split(/(\s+)/); // keep the whitespace tokens
    for (const part of parts) {
      if (part === "") continue;
      const isSpace = /^\s+$/.test(part);
      const width = fontFor(fonts, bold).widthOfTextAtSize(part, size);

      if (isSpace && current.width === 0) continue; // no leading spaces on a line

      if (current.width + width > maxWidth && current.width > 0) {
        if (isSpace) {
          pushLine();
          continue;
        }
        pushLine();
      }

      // A single word longer than the line: hard-break it character by character.
      if (width > maxWidth && !isSpace) {
        let chunk = "";
        for (const character of part) {
          const next = chunk + character;
          if (fontFor(fonts, bold).widthOfTextAtSize(next, size) > maxWidth && chunk) {
            current.runs.push({ text: chunk, bold, italic: Boolean(run.italic) });
            current.width = measure(fonts, current.runs, size);
            pushLine();
            chunk = character;
          } else {
            chunk = next;
          }
        }
        if (chunk) {
          current.runs.push({ text: chunk, bold, italic: Boolean(run.italic) });
          current.width = measure(fonts, current.runs, size);
        }
        continue;
      }

      const last = current.runs[current.runs.length - 1];
      if (last && last.bold === bold && last.italic === Boolean(run.italic)) {
        last.text += part;
      } else {
        current.runs.push({ text: part, bold, italic: Boolean(run.italic) });
      }
      current.width += width;
    }
  }

  if (current.runs.length || !lines.length) pushLine();
  return lines;
}

function drawLine(
  page: PDFPage,
  fonts: FontPair,
  line: Line,
  x: number,
  y: number,
  size: number,
  color = rgb(0.09, 0.1, 0.15),
) {
  let cursor = x;
  for (const run of line.runs) {
    const font = fontFor(fonts, run.bold);
    page.drawText(run.text, { x: cursor, y, size, font, color });
    cursor += font.widthOfTextAtSize(run.text, size);
  }
}

const plainText = (blocks: Block[]) =>
  blocks
    .map((block) => {
      switch (block.type) {
        case "heading":
        case "paragraph":
        case "quote":
          return block.runs.map((run) => run.text).join("");
        case "list":
          return block.items.map((item) => item.map((run) => run.text).join("")).join("\n");
        case "code":
          return block.text;
        case "table":
          return [...(block.header ?? []), ...block.rows.flat()].join(" ");
        default:
          return "";
      }
    })
    .join(" ");

export interface TextPdfResult {
  bytes: Uint8Array;
  pages: number;
  unicode: boolean;
}

export async function renderBlocksToPdf(blocks: Block[], options: TextPdfOptions): Promise<TextPdfResult> {
  if (!blocks.length) throw new Error("There is no text to convert yet.");

  const doc = await PDFDocument.create();
  doc.setProducer("Filecraft (browser)");
  doc.setCreator("Filecraft");
  doc.setCreationDate(new Date());
  if (options.title) doc.setTitle(options.title);

  const fonts = await getFontPair(doc, plainText(blocks));

  const base = TEXT_PAGE_SIZES[options.pageFormat];
  const landscape = options.orientation === "landscape";
  const pageWidth = landscape ? base.h : base.w;
  const pageHeight = landscape ? base.w : base.h;
  const margin = Math.max(0, options.marginMm) * MM;
  const contentWidth = pageWidth - margin * 2;
  const size = options.fontSize;
  const leading = size * options.lineHeight;
  const bottomLimit = margin;

  let totalPages = 1;
  const cursor: Cursor = { page: doc.addPage([pageWidth, pageHeight]), y: pageHeight - margin };

  const newPage = () => {
    cursor.page = doc.addPage([pageWidth, pageHeight]);
    cursor.y = pageHeight - margin;
    totalPages += 1;
  };

  const ensure = (needed: number) => {
    if (cursor.y - needed < bottomLimit) newPage();
  };

  const writeLines = (lines: Line[], indent = 0, lineSize = size, leader = leading) => {
    for (const line of lines) {
      ensure(leader);
      drawLine(cursor.page, fonts, line, margin + indent, cursor.y - lineSize, lineSize);
      cursor.y -= leader;
    }
  };

  const drawTable = (block: Extract<Block, { type: "table" }>) => {
    const columns = Math.max(block.header?.length ?? 0, ...block.rows.map((row) => row.length), 1);
    const padding = 4;
    const cellSize = Math.max(7.5, size - 1.5);
    const cellLeading = cellSize * 1.3;

    // Column widths: equal share, nudged by average content length.
    const averages = Array.from({ length: columns }, (_, column) => {
      const values = [...(block.header ? [block.header[column] ?? ""] : []), ...block.rows.map((row) => row[column] ?? "")];
      const total = values.reduce((sum, value) => sum + String(value).length, 0);
      return Math.max(4, total / Math.max(values.length, 1));
    });
    const sum = averages.reduce((a, b) => a + b, 0);
    const widths = averages.map((average) => Math.max(40, (average / sum) * contentWidth));

    const renderRow = (cells: string[], bold: boolean, shade: boolean) => {
      const wrapped = cells.map((cell, column) =>
        wrapRuns([{ text: String(cell ?? ""), bold }], widths[column] - padding * 2, cellSize, fonts),
      );
      const rowsHeight = Math.max(...wrapped.map((lines) => lines.length)) * cellLeading + padding * 2;
      ensure(rowsHeight + cellLeading);

      const top = cursor.y;
      let columnX = margin;
      wrapped.forEach((lines, column) => {
        if (shade) {
          cursor.page.drawRectangle({
            x: columnX,
            y: top - rowsHeight,
            width: widths[column],
            height: rowsHeight,
            color: rgb(0.97, 0.98, 1),
          });
        }
        cursor.page.drawRectangle({
          x: columnX,
          y: top - rowsHeight,
          width: widths[column],
          height: rowsHeight,
          borderColor: rgb(0.85, 0.88, 0.92),
          borderWidth: 0.5,
        });
        lines.forEach((line, index) => {
          drawLine(cursor.page, fonts, line, columnX + padding, top - padding - cellSize - index * cellLeading, cellSize);
        });
        columnX += widths[column];
      });
      cursor.y -= rowsHeight;
    };

    if (block.header?.length) {
      // Repeat the header whenever the table breaks onto a new page.
      const header = block.header;
      const before = cursor.page;
      renderRow(header, true, true);
      if (cursor.page !== before) renderRow(header, true, true);
    }
    block.rows.forEach((row, index) => {
      const before = cursor.page;
      renderRow(row, false, index % 2 === 1);
      if (cursor.page !== before) renderRow(row, false, index % 2 === 1);
    });
    cursor.y -= leading * 0.4;
  };

  if (options.title) {
    const lines = wrapRuns([{ text: options.title, bold: true }], contentWidth, size * 1.5, fonts);
    writeLines(lines, 0, size * 1.5, size * 1.5 * 1.25);
    cursor.y -= leading * 0.4;
  }

  for (const block of blocks) {
    switch (block.type) {
      case "heading": {
        const headingSize = [size * 1.9, size * 1.55, size * 1.3, size * 1.15][block.level - 1] ?? size * 1.15;
        cursor.y -= headingSize * 0.5;
        const lines = wrapRuns(block.runs.map((run) => ({ ...run, bold: true })), contentWidth, headingSize, fonts);
        writeLines(lines, 0, headingSize, headingSize * 1.3);
        cursor.y -= headingSize * 0.25;
        break;
      }
      case "paragraph": {
        const lines = wrapRuns(block.runs, contentWidth, size, fonts);
        writeLines(lines);
        cursor.y -= leading * 0.45;
        break;
      }
      case "quote": {
        const lines = wrapRuns(block.runs, contentWidth - 18, size, fonts);
        const startY = cursor.y;
        for (const line of lines) {
          ensure(leading);
          drawLine(cursor.page, fonts, line, margin + 18, cursor.y - size, size, rgb(0.29, 0.33, 0.41));
          cursor.y -= leading;
        }
        cursor.page.drawRectangle({
          x: margin + 4,
          y: cursor.y,
          width: 2,
          height: Math.max(0, startY - cursor.y),
          color: rgb(0.31, 0.27, 0.9),
          opacity: 0.4,
        });
        cursor.y -= leading * 0.3;
        break;
      }
      case "list": {
        block.items.forEach((item, index) => {
          const marker = block.ordered ? `${(block.start ?? 1) + index}.` : "•";
          ensure(leading);
          const markerLine: Line = { runs: [{ text: marker, bold: false, italic: false }], width: 0 };
          drawLine(cursor.page, fonts, markerLine, margin + 4, cursor.y - size, size);
          const lines = wrapRuns(item, contentWidth - 22, size, fonts);
          writeLines(lines, 22);
        });
        cursor.y -= leading * 0.3;
        break;
      }
      case "code": {
        const lines = block.text.replace(/\t/g, "    ").split("\n");
        ensure(leading * 2);
        for (const raw of lines) {
          // Wrap long code lines by character count so nothing runs off the page.
          let rest = raw.slice(0, 400);
          while (rest.length) {
            const chunk = rest.slice(0, Math.floor(contentWidth / (size * 0.6)));
            rest = rest.slice(chunk.length);
            ensure(leading);
            cursor.page.drawRectangle({
              x: margin,
              y: cursor.y - leading + 2,
              width: contentWidth,
              height: leading - 2,
              color: rgb(0.97, 0.98, 1),
            });
            cursor.page.drawText(chunk || " ", {
              x: margin + 6,
              y: cursor.y - size,
              size: size * 0.92,
              font: fonts.regular,
              color: rgb(0.16, 0.2, 0.28),
            });
            cursor.y -= leading;
          }
        }
        cursor.y -= leading * 0.4;
        break;
      }
      case "table":
        drawTable(block);
        break;
      case "hr": {
        ensure(leading * 1.5);
        cursor.page.drawLine({
          start: { x: margin, y: cursor.y },
          end: { x: pageWidth - margin, y: cursor.y },
          thickness: 0.7,
          color: rgb(0.85, 0.88, 0.92),
        });
        cursor.y -= leading;
        break;
      }
      case "spacer":
        cursor.y -= (block.height ?? leading) * 1;
        break;
      default:
        break;
    }
  }

  if (options.footer) {
    const footer = options.footer;
    const { regular } = fonts;
    for (let index = 0; index < doc.getPageCount(); index += 1) {
      const page = doc.getPage(index);
      const label = footer
        .replace(/\{n\}/g, String(index + 1))
        .replace(/\{total\}/g, String(doc.getPageCount()));
      const width = regular.widthOfTextAtSize(label, size * 0.85);
      page.drawText(label, {
        x: (pageWidth - width) / 2,
        y: Math.max(12, margin / 2),
        size: size * 0.85,
        font: regular,
        color: rgb(0.45, 0.5, 0.58),
      });
    }
  }

  const bytes = await doc.save();
  return { bytes, pages: doc.getPageCount(), unicode: fonts.unicode };
}
