/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Pixel operations shared by the compress, resize and crop pages
 *
 *  Everything here works on a canvas in the tab: decode with the browser's own
 *  image pipeline, transform, then encode once. The one interesting algorithm is
 *  `compressToTarget`, which searches for the highest quality whose encoded size
 *  still fits a byte budget — the thing a "compress to 100 KB" job actually
 *  needs, and the thing a single quality slider cannot promise.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { clampToCanvasLimits, decodeImage } from "./index.ts";

export type CompressMime = "image/jpeg" | "image/webp";

export interface CompressOptions {
  /** Byte budget for the finished file. */
  targetBytes: number;
  mime: CompressMime;
  /** Longest edge cap, 0 to keep the original dimensions. */
  maxEdge?: number;
  /** Colour behind transparency when the output cannot store alpha. */
  background?: string;
  /** Override the browser canvas budget (tests lower it). */
  maxPixels?: number;
  /** Lowest quality the search is allowed to reach, 0–1. */
  floorQuality?: number;
}

export interface CompressResult {
  blob: Blob;
  quality: number;
  width: number;
  height: number;
  sourceWidth: number;
  sourceHeight: number;
  /** False when even the lowest quality tried could not reach the target. */
  reachedTarget: boolean;
  attempts: number;
}

interface Attempt {
  quality: number;
  size: number;
  blob: Blob;
}

/**
 * Chooses the attempt to keep: the highest quality that still fits the budget.
 *
 * Pure, so it can be asserted in the test suite. When nothing fits, the smallest
 * attempt wins — a file that is close to the target is more useful than a
 * failure message, and the caller is told it missed.
 */
export function pickBestAttempt(attempts: Attempt[], targetBytes: number): { best: Attempt; fits: boolean } | null {
  if (!attempts.length) return null;
  const sorted = [...attempts].sort((a, b) => a.size - b.size);
  const fitting = sorted.filter((attempt) => attempt.size <= targetBytes);
  if (fitting.length) {
    // Largest file that still fits == highest quality that still fits.
    return { best: fitting[fitting.length - 1], fits: true };
  }
  return { best: sorted[0], fits: false };
}

async function encode(canvas: HTMLCanvasElement, mime: CompressMime, quality: number): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, quality));
  if (!blob) throw new Error("The browser could not encode this image.");
  return blob;
}

/**
 * Sizes the canvas for a compression job, then binary-searches the quality.
 *
 * Strategy, in order:
 *  1. try a high quality (0.92) — most phone photos already fit small targets
 *  2. binary search between the floor and 0.92 for six rounds
 *  3. keep the highest quality that fits, otherwise the smallest result
 */
export async function compressToTarget(file: File, options: CompressOptions): Promise<CompressResult> {
  const { targetBytes, mime, maxEdge = 0, background = "#FFFFFF", maxPixels, floorQuality = 0.25 } = options;
  if (!(targetBytes > 0)) throw new Error("Enter a target size in kilobytes first.");

  const { bitmap, width, height, release } = await decodeImage(file);
  try {
    let drawWidth = width;
    let drawHeight = height;
    if (maxEdge > 0 && Math.max(width, height) > maxEdge) {
      const scale = maxEdge / Math.max(width, height);
      drawWidth = Math.max(1, Math.round(width * scale));
      drawHeight = Math.max(1, Math.round(height * scale));
    }
    const clamped = clampToCanvasLimits(drawWidth, drawHeight, maxPixels);
    drawWidth = clamped.width;
    drawHeight = clamped.height;

    const canvas = document.createElement("canvas");
    canvas.width = drawWidth;
    canvas.height = drawHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is not available in this browser.");

    // JPEG has no alpha channel, so flatten first; WebP keeps transparency.
    if (mime === "image/jpeg") {
      context.fillStyle = background;
      context.fillRect(0, 0, drawWidth, drawHeight);
    }
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, drawWidth, drawHeight);

    const attempts: Attempt[] = [];
    let high = 0.92;
    let low = floorQuality;

    const first = await encode(canvas, mime, high);
    attempts.push({ quality: high, size: first.size, blob: first });
    if (first.size > targetBytes) {
      for (let round = 0; round < 6; round += 1) {
        const quality = Number(((low + high) / 2).toFixed(3));
        if (attempts.some((attempt) => Math.abs(attempt.quality - quality) < 0.005)) break;
        const blob = await encode(canvas, mime, quality);
        attempts.push({ quality, size: blob.size, blob });
        if (blob.size > targetBytes) high = quality;
        else low = quality;
      }
      // One last try at the floor, so a small target is not missed by rounding.
      const floor = await encode(canvas, mime, floorQuality);
      attempts.push({ quality: floorQuality, size: floor.size, blob: floor });
    }

    const chosen = pickBestAttempt(attempts, targetBytes);
    if (!chosen) throw new Error("The browser produced no output for this image.");

    const result: CompressResult = {
      blob: chosen.best.blob,
      quality: chosen.best.quality,
      width: drawWidth,
      height: drawHeight,
      sourceWidth: width,
      sourceHeight: height,
      reachedTarget: chosen.fits,
      attempts: attempts.length,
    };

    canvas.width = 0;
    canvas.height = 0;
    return result;
  } finally {
    release();
  }
}

export interface CropRect {
  /** Normalised 0–1 crop rectangle within the source image. */
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropOptions {
  rect: CropRect;
  rotation?: 0 | 90 | 180 | 270;
  flipX?: boolean;
  flipY?: boolean;
  /** Longest edge of the output; 0 keeps the crop's own pixel size. */
  maxEdge?: number;
  background?: string;
  keepAlpha?: boolean;
  maxPixels?: number;
}

export interface CropResult {
  canvas: HTMLCanvasElement;
  sourceWidth: number;
  sourceHeight: number;
  cropWidth: number;
  cropHeight: number;
}

/**
 * Crops a region out of an image, then rotates and/or flips it.
 *
 * The crop rectangle is normalised so the same numbers work for a preview drawn
 * at 600 px wide and the full-resolution export — the preview cannot lie about
 * what will be saved.
 */
export async function renderCrop(file: File, options: CropOptions): Promise<CropResult> {
  const { rect, rotation = 0, flipX = false, flipY = false, maxEdge = 0, background = "#FFFFFF", keepAlpha = false, maxPixels } = options;
  const { bitmap, width, height, release } = await decodeImage(file);

  try {
    const safe = {
      x: Math.min(Math.max(rect.x, 0), 1),
      y: Math.min(Math.max(rect.y, 0), 1),
      width: Math.min(Math.max(rect.width, 0.01), 1),
      height: Math.min(Math.max(rect.height, 0.01), 1),
    };
    const cropX = Math.round(safe.x * width);
    const cropY = Math.round(safe.y * height);
    const cropW = Math.max(1, Math.round(Math.min(safe.width, 1 - safe.x) * width));
    const cropH = Math.max(1, Math.round(Math.min(safe.height, 1 - safe.y) * height));

    let outW = cropW;
    let outH = cropH;
    if (maxEdge > 0 && Math.max(outW, outH) > maxEdge) {
      const scale = maxEdge / Math.max(outW, outH);
      outW = Math.max(1, Math.round(outW * scale));
      outH = Math.max(1, Math.round(outH * scale));
    }
    if (rotation === 90 || rotation === 270) {
      [outW, outH] = [outH, outW];
    }
    const clamped = clampToCanvasLimits(outW, outH, maxPixels);
    outW = clamped.width;
    outH = clamped.height;

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const context = canvas.getContext("2d", { alpha: keepAlpha });
    if (!context) throw new Error("Canvas is not available in this browser.");

    if (!keepAlpha) {
      context.fillStyle = background;
      context.fillRect(0, 0, outW, outH);
    }
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.save();
    context.translate(outW / 2, outH / 2);
    if (rotation) context.rotate((rotation * Math.PI) / 180);
    if (flipX || flipY) context.scale(flipX ? -1 : 1, flipY ? -1 : 1);

    // Draw the cropped source into the (possibly swapped) canvas box.
    const drawW = rotation === 90 || rotation === 270 ? outH : outW;
    const drawH = rotation === 90 || rotation === 270 ? outW : outH;
    context.drawImage(bitmap, cropX, cropY, cropW, cropH, -drawW / 2, -drawH / 2, drawW, drawH);
    context.restore();

    return { canvas, sourceWidth: width, sourceHeight: height, cropWidth: cropW, cropHeight: cropH };
  } finally {
    release();
  }
}

export interface ResizeResult {
  canvas: HTMLCanvasElement;
  sourceWidth: number;
  sourceHeight: number;
}

export interface ResizeOptions {
  width: number;
  height: number;
  /** Stretch to exactly width × height, or fit inside it and keep the ratio. */
  mode: "exact" | "fit";
  background?: string;
  keepAlpha?: boolean;
  maxPixels?: number;
}

/** Resizes to exact dimensions, or fits inside a box without distorting. */
export async function renderResize(file: File, options: ResizeOptions): Promise<ResizeResult> {
  const { width: boxW, height: boxH, mode, background = "#FFFFFF", keepAlpha = false, maxPixels } = options;
  if (!(boxW > 0) || !(boxH > 0)) throw new Error("Width and height must both be positive numbers.");

  const { bitmap, width, height, release } = await decodeImage(file);
  try {
    let outW = boxW;
    let outH = boxH;
    if (mode === "fit") {
      const scale = Math.min(boxW / width, boxH / height);
      outW = Math.max(1, Math.round(width * scale));
      outH = Math.max(1, Math.round(height * scale));
    }
    const clamped = clampToCanvasLimits(outW, outH, maxPixels);
    outW = clamped.width;
    outH = clamped.height;

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const context = canvas.getContext("2d", { alpha: keepAlpha });
    if (!context) throw new Error("Canvas is not available in this browser.");
    if (!keepAlpha) {
      context.fillStyle = background;
      context.fillRect(0, 0, outW, outH);
    }
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, outW, outH);
    return { canvas, sourceWidth: width, sourceHeight: height };
  } finally {
    release();
  }
}
