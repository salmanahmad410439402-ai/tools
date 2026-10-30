/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  PDF text layout — shared by PDF → Word and PDF → Excel
 *
 *  pdf.js hands back a flat list of positioned fragments (`{ str, transform,
 *  width, height }`), not lines or paragraphs. Everything here turns that list
 *  into the structures the two converters need, using geometry only:
 *
 *    items → lines → paragraphs   (Word)
 *    items → cells → columns      (Excel)
 *
 *  No heuristics can rebuild the original design, so the rule is to be boring
 *  and predictable: cluster by baseline, split on gaps, and never claim more
 *  structure than the coordinates actually support.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** The subset of a pdf.js text item we use. `transform` is [a,b,c,d,e,f]. */
export interface RawTextItem {
  str: string;
  transform: number[];
  width?: number;
  height?: number;
  hasEOL?: boolean;
}

export interface LayoutItem {
  text: string;
  /** Left edge, in PDF points from the left of the page. */
  x: number;
  /** Baseline, in PDF points from the bottom of the page. */
  y: number;
  width: number;
  height: number;
  fontSize: number;
}

export interface LayoutLine {
  text: string;
  x: number;
  y: number;
  right: number;
  fontSize: number;
  items: LayoutItem[];
}

export interface LayoutPage {
  /** Page number as the reader sees it, starting at 1. */
  pageNumber: number;
  width: number;
  height: number;
  lines: LayoutLine[];
}

function toItem(raw: RawTextItem): LayoutItem | null {
  if (typeof raw.str !== "string" || !raw.str.length) return null;
  const transform = raw.transform ?? [];
  const x = Number(transform[4] ?? 0);
  const y = Number(transform[5] ?? 0);
  // Scale is the length of the (c, d) column vector of the text matrix.
  const scale = Math.hypot(Number(transform[2] ?? 0), Number(transform[3] ?? 0)) || 1;
  const fontSize = Math.abs(Number(raw.height ?? 0)) || scale;
  return {
    text: raw.str,
    x,
    y,
    width: Math.abs(Number(raw.width ?? 0)) || raw.str.length * fontSize * 0.5,
    height: fontSize,
    fontSize,
  };
}

const median = (values: number[]): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

/** Groups fragments into lines by baseline, then joins them by gap. */
export function itemsToLines(items: RawTextItem[]): LayoutLine[] {
  const parsed = items.map(toItem).filter((item): item is LayoutItem => item !== null);
  if (!parsed.length) return [];

  // Reading order: top of the page first (PDF y grows upwards), then left.
  const sorted = [...parsed].sort((a, b) => (Math.abs(a.y - b.y) > 1 ? b.y - a.y : a.x - b.x));

  const rows: LayoutItem[][] = [];
  for (const item of sorted) {
    const row = rows[rows.length - 1];
    if (row) {
      const last = row[row.length - 1];
      const tolerance = Math.max(1.5, Math.min(item.fontSize, last.fontSize) * 0.45);
      if (Math.abs(last.y - item.y) <= tolerance) {
        row.push(item);
        continue;
      }
    }
    rows.push([item]);
  }

  return rows.map((row) => {
    const ordered = [...row].sort((a, b) => a.x - b.x);
    let text = "";
    let previous: LayoutItem | null = null;
    for (const item of ordered) {
      if (!previous) {
        text = item.text;
        previous = item;
        continue;
      }
      const gap = item.x - (previous.x + previous.width);
      // A visible gap becomes a space; fragments that continue a word are
      // concatenated so "Hel" + "lo" does not become "Hel lo".
      const separator = gap > Math.max(1, previous.fontSize * 0.18) ? " " : "";
      text += separator + item.text;
      previous = item;
    }
    return {
      text: text.replace(/\s+/g, " ").trim(),
      x: ordered[0].x,
      y: ordered[0].y,
      right: Math.max(...ordered.map((item) => item.x + item.width)),
      fontSize: median(ordered.map((item) => item.fontSize)) || ordered[0].fontSize,
      items: ordered,
    };
  }).filter((line) => line.text.length > 0);
}

export interface Paragraph {
  text: string;
  /** 1–3 for headings, 0 for body text. */
  heading: 0 | 1 | 2 | 3;
  /** True when the paragraph starts a new page in the source. */
  pageBreakBefore?: boolean;
}

/**
 * Rebuilds paragraphs from lines: a new paragraph starts when the vertical gap
 * grows, the size changes noticeably, or the line is indented relative to the
 * paragraph before it. Short lines set much larger than the page's body text
 * are treated as headings.
 */
export function linesToParagraphs(lines: LayoutLine[]): Paragraph[] {
  if (!lines.length) return [];
  const bodySize = median(lines.map((line) => line.fontSize)) || 12;

  const paragraphs: Paragraph[] = [];
  let current: { text: string; size: number; x: number; heading: 0 | 1 | 2 | 3 } | null = null;

  const flush = () => {
    if (!current) return;
    paragraphs.push({ text: current.text.trim(), heading: current.heading });
    current = null;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const previous = index > 0 ? lines[index - 1] : null;
    const ratio = line.fontSize / bodySize;
    // Size alone is a weak signal, so the thresholds are deliberately wide:
    // a line only becomes a heading when it is clearly larger than body text.
    const heading: 0 | 1 | 2 | 3 =
      ratio >= 1.8 ? 1 : ratio >= 1.4 ? 2 : ratio > 1.25 && line.text.length <= 80 ? 3 : 0;

    if (!current) {
      current = { text: line.text, size: line.fontSize, x: line.x, heading };
      continue;
    }

    const gap = previous ? previous.y - line.y : 0;
    const lineHeight = Math.max(line.fontSize, previous?.fontSize ?? line.fontSize);
    const sizeChanged = Math.abs(line.fontSize - current.size) > bodySize * 0.15;
    const indented = Math.abs(line.x - current.x) > bodySize * 1.2;
    const broken = gap > lineHeight * 1.75 || Math.abs(gap) < 0.1;
    const styleChanged = heading !== current.heading;
    const endsSentence = /[.:;!?]$/.test(current.text);

    if (sizeChanged || indented || broken || styleChanged || (endsSentence && gap > lineHeight * 1.45)) {
      flush();
      current = { text: line.text, size: line.fontSize, x: line.x, heading };
      continue;
    }

    // A hyphen at the end of a line is a wrapped word, not a real hyphen.
    current.text = /[a-z]-$/i.test(current.text)
      ? current.text.replace(/-$/, "") + line.text
      : `${current.text} ${line.text}`;
  }

  flush();

  return paragraphs
    .map((paragraph) => ({ ...paragraph, text: paragraph.text.replace(/\s+/g, " ").trim() }))
    .filter((paragraph) => paragraph.text.length > 0);
}

/** Turns one page of lines into paragraphs, with a page break before the first. */
export function pageToParagraphs(page: LayoutPage): Paragraph[] {
  const paragraphs = linesToParagraphs(page.lines);
  if (paragraphs.length) paragraphs[0] = { ...paragraphs[0], pageBreakBefore: page.pageNumber > 1 };
  return paragraphs;
}

/**
 * Finds lines that repeat at the same height on most pages — running headers,
 * footers and page numbers. They are printed furniture, not document text, and
 * they are what makes a converted Word file look wrong at the top of every
 * page.
 */
export function findRepeatingLines(pages: LayoutPage[], minimumRatio = 0.6): Set<string> {
  if (pages.length < 3) return new Set();
  const counts = new Map<string, number>();
  for (const page of pages) {
    const seen = new Set<string>();
    for (const line of page.lines) {
      // Running furniture sits at the top or bottom of the page. Anything in
      // the body is real content even when the digits in it change per page.
      const nearEdge = line.y > page.height * 0.88 || line.y < page.height * 0.12;
      if (!nearEdge) continue;
      // Page numbers differ per page, so normalise digits before comparing.
      const key = `${Math.round(line.y / 6)}|${line.text.replace(/\d+/g, "#").toLowerCase().slice(0, 80)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  const threshold = Math.max(3, Math.ceil(pages.length * minimumRatio));
  const repeats = new Set<string>();
  for (const [key, count] of counts) if (count >= threshold) repeats.add(key);
  return repeats;
}

export function isRepeating(line: LayoutLine, repeats: Set<string>): boolean {
  const key = `${Math.round(line.y / 6)}|${line.text.replace(/\d+/g, "#").toLowerCase().slice(0, 80)}`;
  return repeats.has(key);
}

/* ─────────────────────────────── Excel ──────────────────────────────────── */

export interface SheetCell {
  text: string;
  x: number;
}

export interface SheetRow {
  cells: SheetCell[];
  y: number;
}

/** Splits a line into cells at visible gaps (the only column cue a PDF has). */
export function lineToCells(line: LayoutLine): SheetCell[] {
  const cells: SheetCell[] = [];
  let text = "";
  let startX = 0;
  let previous: LayoutItem | null = null;

  for (const item of line.items) {
    if (!previous) {
      text = item.text;
      startX = item.x;
      previous = item;
      continue;
    }
    const gap = item.x - (previous.x + previous.width);
    if (gap > Math.max(6, previous.fontSize * 1.1)) {
      cells.push({ text: text.replace(/\s+/g, " ").trim(), x: startX });
      text = item.text;
      startX = item.x;
    } else {
      text += (gap > previous.fontSize * 0.18 ? " " : "") + item.text;
    }
    previous = item;
  }
  if (text.trim()) cells.push({ text: text.replace(/\s+/g, " ").trim(), x: startX });
  return cells.filter((cell) => cell.text.length > 0);
}

/**
 * Aligns per-line cells into columns by clustering their left edges, then
 * lays every row out in column order. Cells that land in the same cluster are
 * joined, so a wide column wrapped over two fragments stays one cell.
 */
export function linesToTable(lines: LayoutLine[]): string[][] {
  const rows: SheetRow[] = lines
    .map((line) => ({ cells: lineToCells(line), y: line.y }))
    .filter((row) => row.cells.length > 0);
  if (!rows.length) return [];

  const tolerance = 14; // points: columns rarely sit closer than this
  const centres: number[] = [];
  for (const cell of rows.flatMap((row) => row.cells)) {
    const near = centres.find((centre) => Math.abs(centre - cell.x) <= tolerance);
    if (near === undefined) centres.push(cell.x);
  }
  centres.sort((a, b) => a - b);

  const columnOf = (x: number) => {
    let best = 0;
    let bestDistance = Infinity;
    centres.forEach((centre, index) => {
      const distance = Math.abs(centre - x);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    return best;
  };

  const table: string[][] = rows.map((row) => {
    const values: string[] = new Array(centres.length).fill("");
    for (const cell of row.cells) {
      const column = columnOf(cell.x);
      values[column] = values[column] ? `${values[column]} ${cell.text}` : cell.text;
    }
    return values;
  });

  // Drop columns that ended up empty on every row (common with a stray gap).
  const keep = centres.map((_, index) => index).filter((index) => table.some((row) => row[index]));
  const trimmed = table.map((row) => keep.map((index) => row[index]));
  // Drop leading and trailing empty rows.
  while (trimmed.length && trimmed[0].every((value) => !value)) trimmed.shift();
  while (trimmed.length && trimmed[trimmed.length - 1].every((value) => !value)) trimmed.pop();
  return trimmed;
}

/** Numbers go to Excel as numbers so they can be summed; everything else stays text. */
export function cellValue(text: string): string | number {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(trimmed) || /^-?\d+(\.\d+)?$/.test(trimmed)) {
    const numeric = Number(trimmed.replace(/,/g, ""));
    if (Number.isFinite(numeric)) return numeric;
  }
  return trimmed;
}

/** Column widths that roughly match the longest value, clamped to Excel's limits. */
export function columnWidths(rows: (string | number)[][]): { wch: number }[] {
  const columns = Math.max(...rows.map((row) => row.length), 0);
  return Array.from({ length: columns }, (_, index) => {
    const longest = rows.reduce((max, row) => {
      const value = row[index];
      return Math.max(max, value === undefined || value === null ? 0 : String(value).length);
    }, 4);
    return { wch: Math.min(60, Math.max(8, longest + 2)) };
  });
}
