import type { Block, InlineRun } from "@/lib/pdf/text-pdf";

/* ─────────────────────────────── Plain text ────────────────────────────── */

/** Splits a .txt file into paragraphs, keeping single line breaks as soft wraps. */
export function textToBlocks(text: string): Block[] {
  const normalised = text.replace(/\r\n?/g, "\n").replace(/\t/g, "    ");
  const chunks = normalised.split(/\n{2,}/);
  const blocks: Block[] = [];

  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;
    if (/^[-*_]{3,}$/.test(trimmed)) {
      blocks.push({ type: "hr" });
      continue;
    }
    const lines = trimmed.split("\n");
    blocks.push({
      type: "paragraph",
      runs: lines.map((line, index) => ({
        text: index === 0 ? line : `\u2028${line}`,
      })),
    });
  }

  return blocks.length ? blocks : [{ type: "paragraph", runs: [{ text: text.slice(0, 2000) }] }];
}

/* ──────────────────────────────── Markdown ─────────────────────────────── */

const INLINE_PATTERN = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

function parseInline(text: string): InlineRun[] {
  const runs: InlineRun[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(INLINE_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) runs.push({ text: text.slice(lastIndex, index) });
    const token = match[0];

    if (token.startsWith("**") || token.startsWith("__")) {
      runs.push({ text: token.slice(2, -2), bold: true });
    } else if (token.startsWith("`")) {
      runs.push({ text: token.slice(1, -1) });
    } else if (token.startsWith("[")) {
      const link = /\[([^\]]+)\]\(([^)]+)\)/.exec(token);
      if (link) {
        // A PDF is not interactive here: show the label and the address.
        runs.push({ text: `${link[1]} (${link[2]})` });
      } else {
        runs.push({ text: token });
      }
    } else {
      runs.push({ text: token.slice(1, -1), italic: true });
    }
    lastIndex = index + token.length;
  }

  if (lastIndex < text.length) runs.push({ text: text.slice(lastIndex) });
  return runs.length ? runs : [{ text }];
}

export function markdownToBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let index = 0;

  const flushParagraph = (buffer: string[]) => {
    if (!buffer.length) return;
    blocks.push({ type: "paragraph", runs: parseInline(buffer.join(" ").trim()) });
    buffer.length = 0;
  };

  const paragraph: string[] = [];

  while (index < lines.length) {
    const line = lines[index];

    // Fenced code block
    if (/^\s*```/.test(line)) {
      flushParagraph(paragraph);
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !/^\s*```/.test(lines[index])) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push({ type: "code", text: code.join("\n") });
      continue;
    }

    // Table
    if (/^\s*\|/.test(line) && /\|\s*$/.test(line) && /^\s*\|?[\s:|-]+\|/.test(lines[index + 1] ?? "")) {
      flushParagraph(paragraph);
      const rows: string[][] = [];
      const readRow = (row: string) =>
        row
          .trim()
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((cell) => cell.trim());
      const header = readRow(line);
      index += 2;
      while (index < lines.length && /^\s*\|/.test(lines[index])) {
        rows.push(readRow(lines[index]));
        index += 1;
      }
      blocks.push({ type: "table", header, rows });
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph(paragraph);
      const level = Math.min(heading[1].length, 4) as 1 | 2 | 3 | 4;
      blocks.push({ type: "heading", level, runs: parseInline(heading[2].trim()) });
      index += 1;
      continue;
    }

    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      flushParagraph(paragraph);
      blocks.push({ type: "hr" });
      index += 1;
      continue;
    }

    const quote = /^>\s?(.*)$/.exec(line);
    if (quote) {
      flushParagraph(paragraph);
      const quoted: string[] = [quote[1]];
      index += 1;
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quoted.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push({ type: "quote", runs: parseInline(quoted.join(" ")) });
      continue;
    }

    const bullet = /^\s*[-*+]\s+(.*)$/.exec(line);
    const ordered = /^\s*(\d+)[.)]\s+(.*)$/.exec(line);
    if (bullet || ordered) {
      flushParagraph(paragraph);
      const isOrdered = Boolean(ordered);
      const items: InlineRun[][] = [];
      const start = ordered ? Number(ordered[1]) : 1;
      const matcher = isOrdered ? /^\s*(\d+)[.)]\s+(.*)$/ : /^\s*[-*+]\s+(.*)$/;

      while (index < lines.length) {
        const match = matcher.exec(lines[index]);
        if (!match) break;
        items.push(parseInline(isOrdered ? match[2] : match[1]));
        index += 1;
      }
      blocks.push({ type: "list", ordered: isOrdered, items, start });
      continue;
    }

    if (line.trim() === "") {
      flushParagraph(paragraph);
      index += 1;
      continue;
    }

    paragraph.push(line.trim());
    index += 1;
  }

  flushParagraph(paragraph);
  return blocks;
}

/* ────────────────────────────────── HTML ───────────────────────────────── */

const BLOCK_TAGS = new Set(["P", "DIV", "SECTION", "ARTICLE", "HEADER", "FOOTER", "MAIN", "LI", "TD", "TH", "BR"]);

function inlineRunsFromElement(element: Element, bold = false, italic = false): InlineRun[] {
  const runs: InlineRun[] = [];
  element.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? "").replace(/\s+/g, " ");
      if (text.trim()) runs.push({ text, bold, italic });
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const child = node as Element;
    const tag = child.tagName;
    if (tag === "BR") {
      runs.push({ text: "\u2028" });
      return;
    }
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "HEAD") return;
    runs.push(
      ...inlineRunsFromElement(
        child,
        bold || tag === "STRONG" || tag === "B",
        italic || tag === "EM" || tag === "I",
      ),
    );
  });
  return runs;
}

/** Converts HTML (from Mammoth, or a pasted page) into renderable blocks. */
export function htmlToBlocks(html: string): Block[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const blocks: Block[] = [];

  const walk = (element: Element) => {
    for (const child of Array.from(element.children)) {
      const tag = child.tagName;
      if (tag === "SCRIPT" || tag === "STYLE" || tag === "HEAD" || tag === "NOSCRIPT") continue;

      if (/^H[1-6]$/.test(tag)) {
        const level = Math.min(Number(tag[1]), 4) as 1 | 2 | 3 | 4;
        const runs = inlineRunsFromElement(child);
        if (runs.length) blocks.push({ type: "heading", level, runs });
        continue;
      }

      if (tag === "UL" || tag === "OL") {
        const items = Array.from(child.querySelectorAll(":scope > li")).map((item) => inlineRunsFromElement(item));
        if (items.length) blocks.push({ type: "list", ordered: tag === "OL", items });
        continue;
      }

      if (tag === "TABLE") {
        const rows = Array.from(child.querySelectorAll("tr")).map((row) =>
          Array.from(row.querySelectorAll("th,td")).map((cell) => (cell.textContent ?? "").replace(/\s+/g, " ").trim()),
        );
        if (rows.length) {
          const hasHeader = Boolean(child.querySelector("th"));
          blocks.push({ type: "table", header: hasHeader ? rows[0] : undefined, rows: hasHeader ? rows.slice(1) : rows });
        }
        continue;
      }

      if (tag === "BLOCKQUOTE") {
        const runs = inlineRunsFromElement(child);
        if (runs.length) blocks.push({ type: "quote", runs });
        continue;
      }

      if (tag === "PRE") {
        blocks.push({ type: "code", text: child.textContent ?? "" });
        continue;
      }

      if (tag === "HR") {
        blocks.push({ type: "hr" });
        continue;
      }

      if (tag === "P") {
        const runs = inlineRunsFromElement(child);
        if (runs.length) blocks.push({ type: "paragraph", runs });
        continue;
      }

      if (tag === "IMG") {
        const alt = child.getAttribute("alt");
        if (alt) blocks.push({ type: "paragraph", runs: [{ text: `[Image: ${alt}]`, italic: true }] });
        continue;
      }

      // Structural container: descend, but keep direct text if it has children-less content.
      if (child.children.length) {
        walk(child);
      } else if (BLOCK_TAGS.has(tag)) {
        const runs = inlineRunsFromElement(child);
        if (runs.length && (child.textContent ?? "").trim()) blocks.push({ type: "paragraph", runs });
      }
    }
  };

  if (doc.body) walk(doc.body);
  if (!blocks.length) {
    const text = doc.body?.textContent?.trim() ?? "";
    if (text) blocks.push({ type: "paragraph", runs: [{ text }] });
  }
  return blocks;
}

/* ─────────────────────────────────── CSV ───────────────────────────────── */

/** Detects the delimiter by counting candidates outside quotes on the first line. */
export function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const candidates = [",", ";", "\t", "|"];
  let best = ",";
  let bestCount = 0;
  for (const candidate of candidates) {
    let count = 0;
    let quoted = false;
    for (const character of firstLine) {
      if (character === '"') quoted = !quoted;
      else if (!quoted && character === candidate) count += 1;
    }
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }
  return best;
}

/** RFC-4180-ish CSV parser: quotes, escaped quotes, embedded newlines. */
export function parseCsv(text: string, delimiter?: string): string[][] {
  const separator = delimiter ?? detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  const source = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (quoted) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"') {
      quoted = true;
      continue;
    }
    if (character === separator) {
      row.push(field);
      field = "";
      continue;
    }
    if (character === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    field += character;
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  // Drop completely empty trailing rows.
  while (rows.length && rows[rows.length - 1].every((cell) => cell.trim() === "")) rows.pop();
  return rows;
}

export function rowsToBlocks(rows: string[][], options: { headerRow: boolean } = { headerRow: true }): Block[] {
  if (!rows.length) throw new Error("This file has no rows to convert.");
  const header = options.headerRow ? rows[0] : undefined;
  const body = options.headerRow ? rows.slice(1) : rows;
  return [{ type: "table", header, rows: body }];
}
