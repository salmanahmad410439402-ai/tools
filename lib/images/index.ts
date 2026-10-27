import { encodeBmp, encodeTiff, encodeIco, encodeGif, encodePpm, encodeSvg } from "./codecs.ts";

export type OutputMime =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/avif"
  | "image/gif"
  | "image/bmp"
  | "image/tiff"
  | "image/x-icon"
  | "image/svg+xml"
  | "image/x-portable-pixmap"
  | "application/pdf";

export type FormatGroup = "Popular" | "Graphics & icons" | "Print & documents" | "Developer";

export interface OutputFormat {
  mime: OutputMime;
  label: string;
  extension: string;
  lossy: boolean;
  /** Formats the browser can write itself. */
  native: boolean;
  /** Target keeps an alpha channel (otherwise transparency is flattened). */
  alpha: boolean;
  group: FormatGroup;
  hint: string;
}

export const OUTPUT_FORMATS: OutputFormat[] = [
  { mime: "image/jpeg", label: "JPG", extension: "jpg", lossy: true, native: true, alpha: false, group: "Popular", hint: "Smallest for photos. No transparency — transparent areas are filled with your background colour." },
  { mime: "image/png", label: "PNG", extension: "png", lossy: false, native: true, alpha: true, group: "Popular", hint: "Lossless with a real alpha channel — the safe choice for logos, screenshots and anything with transparency." },
  { mime: "image/webp", label: "WebP", extension: "webp", lossy: true, native: true, alpha: true, group: "Popular", hint: "Smallest all-round format for the web, and it keeps transparency. Quality 80–90 is usually indistinguishable." },
  { mime: "image/avif", label: "AVIF", extension: "avif", lossy: true, native: true, alpha: true, group: "Popular", hint: "Smallest files of all, much slower to encode, and not writable in Safari or older Firefox." },
  { mime: "image/gif", label: "GIF", extension: "gif", lossy: true, native: false, alpha: false, group: "Graphics & icons", hint: "216-colour palette, first frame only. Fine for simple diagrams and stickers, poor for photos." },
  { mime: "image/x-icon", label: "ICO", extension: "ico", lossy: false, native: false, alpha: true, group: "Graphics & icons", hint: "Favicon with 16, 32, 48 and 256 px sizes. The image is centred and cropped to a square." },
  { mime: "image/tiff", label: "TIFF", extension: "tiff", lossy: false, native: false, alpha: false, group: "Print & documents", hint: "Uncompressed RGB, one strip — what print shops and scanners expect. Large files." },
  { mime: "image/bmp", label: "BMP", extension: "bmp", lossy: false, native: false, alpha: false, group: "Print & documents", hint: "Uncompressed 24-bit Windows bitmap. Every pixel kept, no compression, huge files." },
  { mime: "application/pdf", label: "PDF", extension: "pdf", lossy: true, native: false, alpha: false, group: "Print & documents", hint: "One image, one page sized to the image. Real photos stay JPEG-compressed inside the PDF." },
  { mime: "image/svg+xml", label: "SVG", extension: "svg", lossy: false, native: false, alpha: true, group: "Developer", hint: "The bitmap is embedded inside a valid SVG — not traced into vectors. Useful for HTML embedding." },
  { mime: "image/x-portable-pixmap", label: "PPM", extension: "ppm", lossy: false, native: false, alpha: false, group: "Developer", hint: "Uncompressed Netpbm P6 that scripts and research tools read directly." },
];

export const formatByMime = (mime: string) => OUTPUT_FORMATS.find((f) => f.mime === mime);

/** Input formats we advertise, with the extensions used for validation. */
export const INPUT_EXTENSIONS = [
  "jpg", "jpeg", "png", "webp", "avif", "gif", "bmp", "tif", "tiff", "svg", "heic", "heif",
];

export const ACCEPT_IMAGE = "image/*,.heic,.heif,.avif,.tif,.tiff,.svg";

export function isHeic(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return /image\/hei[cf]/.test(file.type) || ext === "heic" || ext === "heif";
}

export function looksLikeImage(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return file.type.startsWith("image/") || INPUT_EXTENSIONS.includes(ext);
}

/* ───────────────────────── Encoders the browser lacks ───────────────────── */

function canvasHasPixels(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available in this browser.");
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

const supportCache = new Map<string, Promise<boolean>>();

/** Runtime capability check (Safari cannot encode AVIF, for example). */
export function canEncode(mime: string): Promise<boolean> {
  const cached = supportCache.get(mime);
  if (cached) return cached;
  const promise = new Promise<boolean>((resolve) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 2;
      canvas.height = 2;
      canvas.toBlob((blob) => resolve(Boolean(blob && blob.type === mime)), mime, 0.9);
    } catch {
      resolve(false);
    }
  });
  supportCache.set(mime, promise);
  return promise;
}

const ICO_SIZES = [16, 32, 48, 256];

/** Square, centre-cropped PNG at an exact pixel size (used for ICO frames). */
function squarePng(canvas: HTMLCanvasElement, size: number): Promise<Blob> {
  const square = document.createElement("canvas");
  square.width = size;
  square.height = size;
  const context = square.getContext("2d");
  if (!context) throw new Error("Canvas is not available in this browser.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  const edge = Math.min(canvas.width, canvas.height);
  const offsetX = (canvas.width - edge) / 2;
  const offsetY = (canvas.height - edge) / 2;
  context.drawImage(canvas, offsetX, offsetY, edge, edge, 0, 0, size, size);
  return new Promise<Blob>((resolve, reject) => {
    square.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the icon."))),
      "image/png",
    );
  });
}

async function encodeNative(canvas: HTMLCanvasElement, mime: OutputMime, quality: number): Promise<Blob> {
  const supported = await canEncode(mime);
  if (!supported) {
    throw new Error(
      mime === "image/avif"
        ? "This browser cannot write AVIF files (Safari reads AVIF but cannot encode it). Try WebP or JPG instead."
        : `This browser cannot encode ${mime} files.`,
    );
  }
  const format = OUTPUT_FORMATS.find((f) => f.mime === mime);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mime, format?.lossy ? quality : undefined),
  );
  if (!blob) throw new Error("The browser could not encode this image.");
  if (blob.type && blob.type !== mime) {
    // Some engines silently hand back PNG when they cannot write the type asked for.
    throw new Error(`This browser returned ${blob.type} instead of ${mime}. Choose another format.`);
  }
  return blob;
}

/**
 * Encodes one canvas into the chosen target.
 *
 * `quality` is 0–1 and only affects lossy targets. Formats the browser cannot
 * write are produced by the small encoders in ./codecs, so the promise either
 * resolves with a genuinely conforming file or rejects with a readable reason —
 * it never silently hands back the wrong format.
 */
export async function encodeCanvas(
  canvas: HTMLCanvasElement,
  mime: OutputMime,
  quality = 0.9,
): Promise<Blob> {
  switch (mime) {
    case "image/bmp":
      return encodeBmp(canvasHasPixels(canvas));
    case "image/tiff":
      return encodeTiff(canvasHasPixels(canvas));
    case "image/gif":
      return encodeGif(canvasHasPixels(canvas));
    case "image/x-portable-pixmap":
      return encodePpm(canvasHasPixels(canvas));
    case "image/svg+xml": {
      const png = await encodeNative(canvas, "image/png", 1);
      const pngBytes = new Uint8Array(await png.arrayBuffer());
      return encodeSvg(pngBytes, canvas.width, canvas.height);
    }
    case "image/x-icon": {
      // Windows and browsers pick from the sizes inside the file, so ship the
      // full set every time — small sources are upscaled rather than omitted.
      const frames = [];
      for (const size of ICO_SIZES) {
        const png = await squarePng(canvas, size);
        frames.push({ pngBytes: new Uint8Array(await png.arrayBuffer()), size });
      }
      return encodeIco(frames);
    }
    case "application/pdf": {
      const format = OUTPUT_FORMATS.find((entry) => entry.mime === mime)!;
      // Photos stay JPEG inside the PDF; anything with an alpha channel is
      // flattened onto the background first, so JPEG is still safe here.
      const jpeg = await encodeNative(canvas, "image/jpeg", Math.max(0.6, quality));
      const bytes = new Uint8Array(await jpeg.arrayBuffer());
      const { buildImagePdf } = await import("../pdf/image-to-pdf.ts");
      const pdf = await buildImagePdf(
        [{ bytes, kind: "jpg", width: canvas.width, height: canvas.height }],
        { pageSize: "fit", orientation: "auto", marginMm: 0 },
      );
      void format;
      return new Blob([pdf as unknown as BlobPart], { type: "application/pdf" });
    }
    default:
      return encodeNative(canvas, mime, quality);
  }
}

/* ─────────────────────── "did that actually work?" ──────────────────────── */

const MAGIC: Partial<Record<OutputMime, number[][]>> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/gif": [[0x47, 0x49, 0x46, 0x38]],
  "image/bmp": [[0x42, 0x4d]],
  "image/tiff": [
    [0x49, 0x49, 0x2a, 0x00],
    [0x4d, 0x4d, 0x00, 0x2a],
  ],
  "image/x-icon": [[0x00, 0x00, 0x01, 0x00]],
  "image/x-portable-pixmap": [[0x50, 0x36]],
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]],
};

function matchesMagic(bytes: Uint8Array, patterns: number[][]) {
  return patterns.some((pattern) => pattern.every((value, index) => bytes[index] === value));
}

async function asciiHead(blob: Blob, length = 160) {
  const bytes = new Uint8Array(await blob.slice(0, length).arrayBuffer());
  return { bytes, text: new TextDecoder("latin1").decode(bytes) };
}

export interface VerifyResult {
  ok: boolean;
  /** Short line shown next to the finished file. */
  detail: string;
}

/**
 * Re-reads the bytes we produced and checks them against the format we claim.
 *
 * Browsers that can decode a format get a real decode + dimension comparison;
 * the others get signature checks. Either way the user is told exactly what was
 * verified instead of being asked to trust a filename.
 */
export async function verifyEncoded(
  blob: Blob,
  mime: OutputMime,
  expected: { width: number; height: number },
): Promise<VerifyResult> {
  if (!blob.size) return { ok: false, detail: "The encoder returned an empty file." };

  const { bytes, text } = await asciiHead(blob);

  if (mime === "image/webp" || mime === "image/avif") {
    const riff = text.startsWith("RIFF") && text.slice(8, 12) === "WEBP";
    const iso = text.slice(4, 8) === "ftyp" && /avi[fs]/.test(text.slice(8, 12));
    if (!(mime === "image/webp" ? riff : iso)) return { ok: false, detail: "The file signature does not match the format." };
  } else if (mime === "image/svg+xml") {
    if (!/<svg[\s>]/.test(text)) return { ok: false, detail: "The SVG wrapper is malformed." };
  } else {
    const patterns = MAGIC[mime];
    if (patterns && !matchesMagic(bytes, patterns)) {
      return { ok: false, detail: "The file signature does not match the format." };
    }
  }

  if (mime === "application/pdf") {
    const tail = new TextDecoder("latin1").decode(await blob.slice(-2048).arrayBuffer());
    if (!tail.includes("%%EOF")) return { ok: false, detail: "The PDF has no end-of-file marker." };
    return { ok: true, detail: "Valid PDF header and trailer." };
  }

  const decodable =
    mime === "image/jpeg" ||
    mime === "image/png" ||
    mime === "image/webp" ||
    mime === "image/avif" ||
    mime === "image/gif" ||
    mime === "image/svg+xml";

  if (decodable) {
    try {
      const bitmap = await createImageBitmap(blob);
      const { width, height } = bitmap;
      bitmap.close?.();
      if (!width || !height) return { ok: false, detail: "The file could not be decoded." };
      const sizeNote = ` at ${width} × ${height} px`;
      if (width !== expected.width || height !== expected.height) {
        return { ok: true, detail: `Decodes${sizeNote} (${expected.width} × ${expected.height} requested).` };
      }
      return { ok: true, detail: `Decodes cleanly${sizeNote}.` };
    } catch {
      return { ok: false, detail: "The browser could not open the file it just produced." };
    }
  }

  return { ok: true, detail: `Signature verified (${formatBytesLocal(blob.size)}).` };
}

function formatBytesLocal(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export async function encodeCanvasToBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("The browser could not encode this image.");
  return new Uint8Array(await blob.arrayBuffer());
}

/* ─────────────────────────────── Decoding ──────────────────────────────── */

async function decodeViaImageElement(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const element = new Image();
    element.decoding = "sync";
    element.src = url;
    await element.decode();
    return element;
  } finally {
    // The caller draws synchronously right after this resolves.
    window.setTimeout(() => URL.revokeObjectURL(url), 20_000);
  }
}

async function heicToJpeg(file: File): Promise<Blob> {
  const { default: heic2any } = await import("heic2any");
  const result = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.94 });
  const blob = Array.isArray(result) ? result[0] : result;
  if (!blob) throw new Error("This HEIC file could not be decoded.");
  return blob as Blob;
}

export interface DecodedImage {
  bitmap: CanvasImageSource;
  width: number;
  height: number;
  /** Releases the decoded resource. */
  release: () => void;
  wasHeic: boolean;
}

export async function decodeImage(file: File): Promise<DecodedImage> {
  const heic = isHeic(file);
  const source = heic ? await heicToJpeg(file) : file;

  try {
    const bitmap = await createImageBitmap(source);
    return {
      bitmap,
      width: bitmap.width,
      height: bitmap.height,
      release: () => bitmap.close?.(),
      wasHeic: heic,
    };
  } catch {
    // Safari can decode some SVG and AVIF files only through an <img> element.
    const element = await decodeViaImageElement(source);
    const width = element.naturalWidth || element.width || 1024;
    const height = element.naturalHeight || element.height || 1024;
    return { bitmap: element, width, height, release: () => {}, wasHeic: heic };
  }
}

export interface RenderOptions {
  /** Longest edge in pixels; 0 keeps the original size. */
  maxEdge?: number;
  /** Background colour used when the target format has no alpha channel. */
  background?: string;
  /** Exact width/height override (used by the resizer). */
  targetWidth?: number;
  targetHeight?: number;
  /** Override the canvas pixel budget (tests lower it). */
  maxPixels?: number;
  /** Keep the alpha channel instead of flattening onto the background. */
  alpha?: boolean;
  rotate?: 0 | 90 | 180 | 270;
  flipX?: boolean;
  flipY?: boolean;
}

/**
 * Largest canvas we will ask for.
 *
 * Chrome, Firefox and desktop Safari allow 16384 px per side, but iOS Safari's
 * canvas area limit is far lower (16.7 megapixels on older versions). Exceeding
 * it does not throw — it silently produces a blank canvas — so oversized images
 * are scaled down here instead and the caller is told about it.
 */
const MAX_CANVAS_SIDE = 16384;

function defaultMaxPixels(): number {
  if (typeof navigator === "undefined") return 40_000_000;
  const ua = navigator.userAgent;
  const ios = /iP(hone|ad|od)/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return ios ? 16_000_000 : 40_000_000;
}

/**
 * Fits a requested canvas size inside the browser's pixel budget.
 * Pure maths, exported so the clamp can be asserted in tests.
 */
export function clampToCanvasLimits(
  width: number,
  height: number,
  maxPixels = defaultMaxPixels(),
  maxSide = MAX_CANVAS_SIDE,
): { width: number; height: number; scaled: boolean } {
  const scale = Math.min(1, Math.sqrt(maxPixels / (width * height)), maxSide / Math.max(width, height));
  if (!Number.isFinite(scale) || scale >= 1) return { width, height, scaled: false };
  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
    scaled: true,
  };
}

export interface RenderedImage {
  canvas: HTMLCanvasElement;
  /** Dimensions of the decoded source, before any resize or clamp. */
  sourceWidth: number;
  sourceHeight: number;
}

export async function renderToCanvas(file: File, options: RenderOptions = {}): Promise<RenderedImage> {
  const { bitmap, width, height, release } = await decodeImage(file);
  const background = options.background ?? "#FFFFFF";

  let drawWidth = width;
  let drawHeight = height;
  if (options.targetWidth && options.targetHeight) {
    drawWidth = options.targetWidth;
    drawHeight = options.targetHeight;
  } else if (options.maxEdge && Math.max(width, height) > options.maxEdge) {
    const scale = options.maxEdge / Math.max(width, height);
    drawWidth = Math.max(1, Math.round(width * scale));
    drawHeight = Math.max(1, Math.round(height * scale));
  }

  if (options.rotate === 90 || options.rotate === 270) {
    [drawWidth, drawHeight] = [drawHeight, drawWidth];
  }

  // Clamp to what a canvas can actually hold, so a 100-megapixel scan cannot
  // come back as an empty file.
  const clamped = clampToCanvasLimits(drawWidth, drawHeight, options.maxPixels);
  drawWidth = clamped.width;
  drawHeight = clamped.height;

  const canvas = document.createElement("canvas");
  canvas.width = drawWidth;
  canvas.height = drawHeight;
  const context = canvas.getContext("2d", { alpha: Boolean(options.alpha) });
  if (!context) {
    release();
    throw new Error("Canvas is not available in this browser.");
  }

  if (!options.alpha) {
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  context.save();
  context.translate(canvas.width / 2, canvas.height / 2);
  if (options.rotate) context.rotate((options.rotate * Math.PI) / 180);
  if (options.flipX || options.flipY) context.scale(options.flipX ? -1 : 1, options.flipY ? -1 : 1);
  if (options.targetWidth && options.targetHeight && options.rotate && options.rotate % 180 !== 0) {
    context.drawImage(bitmap as CanvasImageSource, -drawHeight / 2, -drawWidth / 2, drawHeight, drawWidth);
  } else {
    context.drawImage(bitmap as CanvasImageSource, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  }
  context.restore();

  release();
  return { canvas, sourceWidth: width, sourceHeight: height };
}

export function describeImageError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/heic|HEIC/.test(message)) {
    return "This HEIC photo could not be decoded. In the Photos app, export it as JPEG and try again.";
  }
  if (/memory|allocation/i.test(message)) {
    return "Your browser ran out of memory for this image. Try a smaller image or fewer files at once.";
  }
  if (/AVIF/.test(message)) return message;
  return `This file could not be read as an image. ${message.slice(0, 140)}`;
}
