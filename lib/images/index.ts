import { encodeBmp, encodeTiff, encodeIco, encodeGif } from "./codecs";

export type OutputMime =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/avif"
  | "image/gif"
  | "image/bmp"
  | "image/tiff"
  | "image/x-icon";

export interface OutputFormat {
  mime: OutputMime;
  label: string;
  extension: string;
  lossy: boolean;
  /** Formats the browser can write itself. */
  native: boolean;
  hint: string;
}

export const OUTPUT_FORMATS: OutputFormat[] = [
  { mime: "image/jpeg", label: "JPG", extension: "jpg", lossy: true, native: true, hint: "Smallest for photos, no transparency" },
  { mime: "image/png", label: "PNG", extension: "png", lossy: false, native: true, hint: "Lossless, keeps transparency" },
  { mime: "image/webp", label: "WebP", extension: "webp", lossy: true, native: true, hint: "Best all-round format for the web" },
  { mime: "image/avif", label: "AVIF", extension: "avif", lossy: true, native: true, hint: "Smallest files, slower to encode" },
  { mime: "image/gif", label: "GIF", extension: "gif", lossy: true, native: false, hint: "Limited palette, first frame only" },
  { mime: "image/bmp", label: "BMP", extension: "bmp", lossy: false, native: false, hint: "Uncompressed, very large files" },
  { mime: "image/tiff", label: "TIFF", extension: "tiff", lossy: false, native: false, hint: "Uncompressed RGB, for print workflows" },
  { mime: "image/x-icon", label: "ICO", extension: "ico", lossy: false, native: false, hint: "Favicon / app icon, square sources" },
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
    case "image/x-icon": {
      const size = Math.min(canvas.width, canvas.height);
      const square = document.createElement("canvas");
      square.width = Math.min(size, 256);
      square.height = square.width;
      const context = square.getContext("2d");
      if (!context) throw new Error("Canvas is not available in this browser.");
      context.imageSmoothingQuality = "high";
      const offsetX = (canvas.width - size) / 2;
      const offsetY = (canvas.height - size) / 2;
      context.drawImage(canvas, offsetX, offsetY, size, size, 0, 0, square.width, square.height);
      const pngBlob = await new Promise<Blob | null>((resolve) => square.toBlob(resolve, "image/png"));
      if (!pngBlob) throw new Error("Could not encode the icon.");
      return encodeIco(new Uint8Array(await pngBlob.arrayBuffer()), square.width, square.height);
    }
    default: {
      const supported = await canEncode(mime);
      if (!supported) {
        throw new Error(
          mime === "image/avif"
            ? "This browser cannot write AVIF files (Safari reads AVIF but cannot encode it). Try WebP or JPG instead."
            : "This browser cannot encode the selected format.",
        );
      }
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, mime, OUTPUT_FORMATS.find((f) => f.mime === mime)?.lossy ? quality : undefined),
      );
      if (!blob) throw new Error("The browser could not encode this image.");
      return blob;
    }
  }
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
  /** Extra space around the image when padding is requested (0–1 zoom). */
  rotate?: 0 | 90 | 180 | 270;
  flipX?: boolean;
  flipY?: boolean;
}

export async function renderToCanvas(file: File, options: RenderOptions = {}): Promise<HTMLCanvasElement> {
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

  const canvas = document.createElement("canvas");
  canvas.width = drawWidth;
  canvas.height = drawHeight;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    release();
    throw new Error("Canvas is not available in this browser.");
  }

  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
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
  return canvas;
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
