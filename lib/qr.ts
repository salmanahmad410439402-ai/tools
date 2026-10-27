/**
 * QR rendering helpers.
 *
 * The encoding itself is `qrcode-generator` (MIT, no runtime dependencies),
 * which returns a module matrix. Everything below turns that matrix into output
 * a person can actually use — a canvas bitmap at an exact pixel size, or an SVG
 * whose modules are real rectangles (so it stays sharp at any size).
 *
 * What this deliberately does **not** do: redirects, short links, tracking or
 * logo overlays. The code contains exactly the text you typed, which is why it
 * keeps working when this site is gone.
 */
import qrcode from "qrcode-generator";

export type QrErrorLevel = "L" | "M" | "Q" | "H";

export interface QrMatrix {
  /** Modules per side, including the quiet zone. */
  size: number;
  /** Quiet-zone width in modules. */
  margin: number;
  /** Raw modules without the quiet zone. */
  modules: number;
  /** `isDark[row][col]` for the grid without the quiet zone. */
  isDark: (row: number, col: number) => boolean;
  /** Encoding version chosen by the library (1–40). */
  version: number;
}

export interface QrOptions {
  level?: QrErrorLevel;
  /** Quiet zone in modules. The specification asks for at least 4. */
  margin?: number;
}

/**
 * Encodes text into a QR matrix.
 *
 * Throws a readable error when the payload does not fit 40 versions at the
 * chosen error-correction level — usually a multi-kilobyte URL, not a typo.
 */
export function encodeQr(text: string, options: QrOptions = {}): QrMatrix {
  const level = options.level ?? "M";
  const margin = Math.max(0, Math.min(options.margin ?? 4, 16));
  if (!text.trim()) throw new Error("Type something to encode first.");

  const qr = qrcode(0, level);
  qr.addData(text);
  try {
    qr.make();
  } catch {
    throw new Error(
      `That is too much data for a QR code at error correction ${level}. Shorten the text, or switch to level L.`,
    );
  }

  const modules = qr.getModuleCount();
  return {
    size: modules + margin * 2,
    margin,
    modules,
    version: Math.floor((modules - 17) / 4),
    isDark: (row: number, col: number) => qr.isDark(row, col),
  };
}

export interface QrStyle {
  /** Module colour for the dark squares. */
  foreground?: string;
  background?: string;
  /** Quiet-zone colour, defaulting to the background. */
  quietZone?: string;
}

/**
 * SVG with one `<rect>` per dark module.
 *
 * A real vector export, not a traced bitmap: it prints at any size, opens in
 * Illustrator and stays readable at 20 mm.
 */
export function qrToSvg(matrix: QrMatrix, style: QrStyle = {}): string {
  const foreground = style.foreground ?? "#0B1020";
  const background = style.background ?? "#FFFFFF";
  const quietZone = style.quietZone ?? background;
  const total = matrix.size;
  const offset = matrix.margin;

  const parts: string[] = [];
  for (let row = 0; row < matrix.modules; row += 1) {
    for (let col = 0; col < matrix.modules; col += 1) {
      if (!matrix.isDark(row, col)) continue;
      parts.push(`<rect x="${col + offset}" y="${row + offset}" width="1" height="1"/>`);
    }
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" ` +
    `width="${total}" height="${total}" shape-rendering="crispEdges" role="img">` +
    `<rect width="${total}" height="${total}" fill="${quietZone}"/>` +
    `<g fill="${foreground}">${parts.join("")}</g>` +
    `</svg>`
  );
}

/**
 * Draws the matrix into a canvas at an exact pixel size.
 *
 * The cell size is floored so modules stay whole pixels; the difference is
 * absorbed by the quiet zone rather than by blurring every edge.
 */
export function drawQrToCanvas(
  canvas: HTMLCanvasElement,
  matrix: QrMatrix,
  options: { pixelSize: number; foreground?: string; background?: string },
): void {
  const { pixelSize } = options;
  const cell = Math.max(1, Math.floor(pixelSize / matrix.size));
  const drawn = cell * matrix.size;
  canvas.width = drawn;
  canvas.height = drawn;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available in this browser.");

  context.fillStyle = options.background ?? "#FFFFFF";
  context.fillRect(0, 0, drawn, drawn);
  context.fillStyle = options.foreground ?? "#0B1020";
  for (let row = 0; row < matrix.modules; row += 1) {
    for (let col = 0; col < matrix.modules; col += 1) {
      if (!matrix.isDark(row, col)) continue;
      context.fillRect((col + matrix.margin) * cell, (row + matrix.margin) * cell, cell, cell);
    }
  }
}

/** Contrast check, so a navy-on-navy code is flagged instead of shipped. */
export function contrastRatio(first: string, second: string): number {
  const luminance = (hex: string) => {
    const value = hex.replace("#", "");
    const full = value.length === 3 ? value.split("").map((char) => char + char).join("") : value;
    const channels = [0, 2, 4].map((offset) => parseInt(full.slice(offset, offset + 2), 16) / 255);
    const [r, g, b] = channels.map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const a = luminance(first);
  const b = luminance(second);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

export const QR_ERROR_LEVELS: { value: QrErrorLevel; label: string; hint: string }[] = [
  { value: "L", label: "L — 7%", hint: "Smallest code, least damage tolerance" },
  { value: "M", label: "M — 15%", hint: "The usual default" },
  { value: "Q", label: "Q — 25%", hint: "Better for print or a worn label" },
  { value: "H", label: "H — 30%", hint: "Tolerates a logo or heavy damage" },
];
