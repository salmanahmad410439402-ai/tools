import { PDFDocument, StandardFonts, type PDFFont } from "pdf-lib";

/**
 * Font handling for the "create a PDF" tools.
 *
 * Latin text (the overwhelming majority of use) is written with the built-in
 * PDF fonts: no download, no embedding cost, a 30 KB PDF. As soon as the text
 * contains a character those fonts cannot encode — Cyrillic, Greek, Hebrew,
 * Arabic, curly quotes from Word, emoji-ish symbols — we fetch the bundled
 * DejaVu Sans from our own server (a static file, no user data) and embed a
 * subset of it instead.
 */

export interface FontPair {
  regular: PDFFont;
  bold: PDFFont;
  /** True when a Unicode font had to be embedded. */
  unicode: boolean;
}

const UNICODE_FONT_URL = "/fonts/DejaVuSans.ttf";
const UNICODE_FONT_BOLD_URL = "/fonts/DejaVuSans-Bold.ttf";

let cache: { regular: ArrayBuffer; bold: ArrayBuffer } | null = null;
let fontkitPromise: Promise<unknown> | null = null;

/**
 * pdf-lib cannot embed a TrueType file without fontkit, and fontkit is ~200 KB
 * of parser. It is imported only when a document actually contains characters
 * outside WinAnsi, and registered on that document before any font is embedded.
 * Without this call every Cyrillic/Greek/Hebrew/Arabic conversion throws
 * "no fontkit instance was found" — which is exactly what happened before the
 * engine test in scripts/smoke-test.mjs existed.
 */
async function registerFontkit(doc: PDFDocument) {
  if (!fontkitPromise) {
    fontkitPromise = import("@pdf-lib/fontkit").then((mod) => (mod as { default?: unknown }).default ?? mod);
  }
  doc.registerFontkit((await fontkitPromise) as Parameters<PDFDocument["registerFontkit"]>[0]);
}

async function fetchFont(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("The Unicode font could not be loaded. Check your connection and try again.");
  return response.arrayBuffer();
}

async function loadUnicodeFonts() {
  if (!cache) {
    const [regular, bold] = await Promise.all([fetchFont(UNICODE_FONT_URL), fetchFont(UNICODE_FONT_BOLD_URL)]);
    cache = { regular, bold };
  }
  return cache;
}

/** True when the standard Helvetica (WinAnsi) can encode every character. */
function isWinAnsi(text: string): boolean {
  // WinAnsi covers Latin-1 plus a handful of typographic characters.
  return /^[\u0000-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026\u20AC\u2122]*$/.test(text);
}

export async function getFontPair(doc: PDFDocument, sample: string): Promise<FontPair> {
  if (isWinAnsi(sample)) {
    const [regular, bold] = await Promise.all([
      doc.embedFont(StandardFonts.Helvetica),
      doc.embedFont(StandardFonts.HelveticaBold),
    ]);
    return { regular, bold, unicode: false };
  }

  const { regular, bold } = await loadUnicodeFonts();
  await registerFontkit(doc);
  const [regularFont, boldFont] = await Promise.all([
    doc.embedFont(regular, { subset: true }).catch(() => doc.embedFont(regular)),
    doc.embedFont(bold, { subset: true }).catch(() => doc.embedFont(bold)),
  ]);
  return { regular: regularFont, bold: boldFont, unicode: true };
}

/** Which scripts the bundled font can actually draw, for honest UI notes. */
export function describeUnicodeSupport(text: string): { supported: boolean; missing: string[] } {
  const missing = new Set<string>();
  for (const character of text) {
    const code = character.codePointAt(0) ?? 0;
    if (code < 0x20) continue;
    // Devanagari, Bengali, Gurmukhi, Gujarati, Tamil, Arabic-Indic supplements,
    // CJK and emoji are outside the bundled font's coverage.
    const unsupported =
      (code >= 0x0900 && code <= 0x0dff) || // Indic scripts
      (code >= 0x0e00 && code <= 0x0fff) || // Thai, Lao, Tibetan
      (code >= 0x1100 && code <= 0x11ff) || // Hangul Jamo
      (code >= 0x3040 && code <= 0x9fff) || // Japanese, CJK
      (code >= 0xac00 && code <= 0xd7af) || // Hangul syllables
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0x1f000 && code <= 0x1faff) || // emoji
      (code >= 0x20000 && code <= 0x2fa1f);
    if (unsupported) missing.add(character);
  }
  return { supported: missing.size === 0, missing: Array.from(missing).slice(0, 12) };
}
