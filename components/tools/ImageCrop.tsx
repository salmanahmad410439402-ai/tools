"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Crop, FlipHorizontal2, FlipVertical2, Loader2, RotateCw } from "lucide-react";
import { ACCEPT_IMAGE, INPUT_EXTENSIONS, decodeImage, describeImageError, encodeCanvas, type OutputMime } from "@/lib/images";
import { renderCrop, type CropRect } from "@/lib/images/transform";
import { sizeBucket, track } from "@/lib/analytics";
import { makePreviewUrl, revokeResults, type ResultFile } from "@/lib/download";
import { cn, formatBytes, outputName } from "@/lib/utils";
import { Dropzone, Field, Notice, ResultsPanel, ToolFrame } from "./kit";

interface Props {
  toolSlug?: string;
}

type DragMode = "move" | "nw" | "ne" | "sw" | "se";

const FULL: CropRect = { x: 0.05, y: 0.05, width: 0.9, height: 0.9 };
const MIN = 0.05;

const ASPECTS: { label: string; value: number | null }[] = [
  { label: "Free", value: null },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:2", value: 3 / 2 },
  { label: "16:9", value: 16 / 9 },
  { label: "9:16", value: 9 / 16 },
];

const FORMATS: { value: OutputMime; label: string; extension: string; lossy: boolean }[] = [
  { value: "image/jpeg", label: "JPG", extension: "jpg", lossy: true },
  { value: "image/png", label: "PNG", extension: "png", lossy: false },
  { value: "image/webp", label: "WebP", extension: "webp", lossy: true },
];

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export function ImageCrop({ toolSlug = "crop-image" }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [rect, setRect] = useState<CropRect>(FULL);
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [aspect, setAspect] = useState<number | null>(null);
  const [format, setFormat] = useState<OutputMime>("image/jpeg");
  const [quality, setQuality] = useState(92);
  const [busy, setBusy] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultPreview, setResultPreview] = useState<string | null>(null);
  const [results, setResults] = useState<ResultFile[]>([]);

  const boxRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ mode: DragMode; startX: number; startY: number; rect: CropRect } | null>(null);
  const urls = useRef<Set<string>>(new Set());

  const createUrl = useCallback((blob: Blob) => {
    const url = makePreviewUrl(blob);
    urls.current.add(url);
    return url;
  }, []);

  useEffect(() => {
    const created = urls.current;
    return () => {
      created.forEach((url) => URL.revokeObjectURL(url));
      created.clear();
    };
  }, []);

  const addFiles = useCallback(
    async (files: File[]) => {
      const next = files[0];
      if (!next) return;
      setError(null);
      setResults([]);
      try {
        const decoded = await decodeImage(next);
        setDims({ width: decoded.width, height: decoded.height });
        decoded.release();
        const old = preview;
        const url = createUrl(next);
        if (old) {
          URL.revokeObjectURL(old);
          urls.current.delete(old);
        }
        setPreview(url);
        setFile(next);
        setRect(FULL);
        setRotation(0);
        setFlipX(false);
        setFlipY(false);
        setAspect(null);
        track("tool_started", { tool: toolSlug, files: 1 });
      } catch (caught) {
        setError(describeImageError(caught));
      }
    },
    [createUrl, preview, toolSlug],
  );

  const reset = () => {
    revokeResults(results);
    urls.current.forEach((url) => URL.revokeObjectURL(url));
    urls.current.clear();
    setResults([]);
    setFile(null);
    setPreview(null);
    setResultPreview(null);
    setError(null);
  };

  /* ── drag and resize ─────────────────────────────────────────────────── */

  const applyAspect = useCallback(
    (next: CropRect, ratio: number | null): CropRect => {
      if (!ratio || !dims.width || !dims.height) return next;
      // Normalised width and height are in different units, so the image's own
      // aspect ratio has to be folded in: a 1:1 crop of a 3:2 photo is not
      // 0.5 × 0.5 of the picture.
      const height = (next.width * dims.width) / (ratio * dims.height);
      const clampedHeight = Math.min(Math.max(height, MIN), 1);
      const y = Math.min(Math.max(next.y, 0), 1 - clampedHeight);
      return { ...next, y, height: clampedHeight };
    },
    [dims.height, dims.width],
  );

  const beginDrag = (mode: DragMode) => (event: React.PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = { mode, startX: event.clientX, startY: event.clientY, rect };
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
  };

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      const box = boxRef.current;
      if (!drag || !box) return;
      const bounds = box.getBoundingClientRect();
      const dx = (event.clientX - drag.startX) / bounds.width;
      const dy = (event.clientY - drag.startY) / bounds.height;
      const start = drag.rect;

      let next: CropRect;
      if (drag.mode === "move") {
        next = {
          ...start,
          x: clamp01(Math.min(Math.max(start.x + dx, 0), 1 - start.width)),
          y: clamp01(Math.min(Math.max(start.y + dy, 0), 1 - start.height)),
        };
      } else {
        let x = start.x;
        let y = start.y;
        let width = start.width;
        let height = start.height;

        if (drag.mode === "nw" || drag.mode === "sw") {
          const newX = Math.min(Math.max(start.x + dx, 0), start.x + start.width - MIN);
          width = start.width + (start.x - newX);
          x = newX;
        }
        if (drag.mode === "ne" || drag.mode === "se") {
          width = Math.min(Math.max(start.width + dx, MIN), 1 - start.x);
        }
        if (drag.mode === "nw" || drag.mode === "ne") {
          const newY = Math.min(Math.max(start.y + dy, 0), start.y + start.height - MIN);
          height = start.height + (start.y - newY);
          y = newY;
        }
        if (drag.mode === "sw" || drag.mode === "se") {
          height = Math.min(Math.max(start.height + dy, MIN), 1 - start.y);
        }
        next = { x, y, width, height };
      }

      setRect(applyAspect(next, aspect));
    };

    const handleUp = () => {
      dragRef.current = null;
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [applyAspect, aspect]);

  /* ── live result preview ─────────────────────────────────────────────── */

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    setRendering(true);
    const timer = window.setTimeout(async () => {
      try {
        const { canvas } = await renderCrop(file, {
          rect,
          rotation,
          flipX,
          flipY,
          maxEdge: 520,
          keepAlpha: format !== "image/jpeg",
        });
        const blob = await encodeCanvas(canvas, "image/jpeg", 0.8);
        canvas.width = 0;
        canvas.height = 0;
        if (cancelled) return;
        setResultPreview((old) => {
          if (old) {
            URL.revokeObjectURL(old);
            urls.current.delete(old);
          }
          const url = createUrl(blob);
          return url;
        });
      } catch {
        /* preview failures are not worth an error banner */
      } finally {
        if (!cancelled) setRendering(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // `file` and the transform settings are the real inputs; `format` only
    // changes the preview's alpha handling.
  }, [file, rect, rotation, flipX, flipY, format, createUrl]);

  const outputSize = useMemo(() => {
    if (!dims.width) return { width: 0, height: 0 };
    const w = Math.max(1, Math.round(rect.width * dims.width));
    const h = Math.max(1, Math.round(rect.height * dims.height));
    return rotation === 90 || rotation === 270 ? { width: h, height: w } : { width: w, height: h };
  }, [dims, rect, rotation]);

  const activeFormat = FORMATS.find((entry) => entry.value === format)!;

  const exportCrop = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { canvas } = await renderCrop(file, {
        rect,
        rotation,
        flipX,
        flipY,
        keepAlpha: format !== "image/jpeg",
      });
      const width = canvas.width;
      const height = canvas.height;
      const blob = await encodeCanvas(canvas, format, quality / 100);
      canvas.width = 0;
      canvas.height = 0;

      const next: ResultFile = {
        id: `${file.name}-crop`,
        name: outputName(file.name, `${width}x${height}`, activeFormat.extension),
        blob,
        size: blob.size,
        originalSize: file.size,
        originalName: file.name,
        note: `${width} × ${height} px${rotation ? ` · rotated ${rotation}°` : ""}${flipX || flipY ? " · flipped" : ""}`,
        previewUrl: createUrl(blob),
      };
      setResults([next]);
      track("tool_completed", { tool: toolSlug, format: activeFormat.label, files: 1, size: sizeBucket(blob.size) });
    } catch (caught) {
      setError(describeImageError(caught));
    } finally {
      setBusy(false);
    }
  };

  if (results.length) {
    return (
      <ToolFrame labelledBy="tool-title">
        {error && (
          <Notice tone="warning" className="mb-4" onDismiss={() => setError(null)}>
            {error}
          </Notice>
        )}
        <ResultsPanel files={results} onReset={reset} heading="Your cropped image is ready" compare="conversion" />
      </ToolFrame>
    );
  }

  return (
    <ToolFrame labelledBy="tool-title">
      {!file || !preview ? (
        <Dropzone
          accept={ACCEPT_IMAGE}
          acceptedLabel="JPG, PNG, WebP, HEIC, AVIF, GIF, BMP"
          extensions={INPUT_EXTENSIONS}
          onFiles={addFiles}
          multiple={false}
          maxSizeMb={100}
          title="Drop an image here or click to choose"
          subtitle="Crop, rotate and flip · one image at a time · nothing is uploaded"
        />
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <div
                ref={boxRef}
                className="relative select-none overflow-hidden rounded-xl border border-line bg-[#0b1020]"
                style={{ touchAction: "none" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Image being cropped" className="block w-full" draggable={false} />
                {/* Darkened surround: four masks instead of one huge shadow, so it works in every browser. */}
                <div className="pointer-events-none absolute inset-x-0 top-0 bg-black/55" style={{ height: `${rect.y * 100}%` }} />
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/55"
                  style={{ height: `${(1 - rect.y - rect.height) * 100}%` }}
                />
                <div
                  className="pointer-events-none absolute left-0 bg-black/55"
                  style={{ top: `${rect.y * 100}%`, height: `${rect.height * 100}%`, width: `${rect.x * 100}%` }}
                />
                <div
                  className="pointer-events-none absolute right-0 bg-black/55"
                  style={{
                    top: `${rect.y * 100}%`,
                    height: `${rect.height * 100}%`,
                    width: `${(1 - rect.x - rect.width) * 100}%`,
                  }}
                />
                <div
                  role="group"
                  tabIndex={0}
                  aria-label="Crop area — drag to move, drag a corner to resize, or use the arrow keys (with Shift to resize)"
                  className="absolute cursor-move border-2 border-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                  style={{
                    left: `${rect.x * 100}%`,
                    top: `${rect.y * 100}%`,
                    width: `${rect.width * 100}%`,
                    height: `${rect.height * 100}%`,
                  }}
                  onPointerDown={beginDrag("move")}
                  onKeyDown={(event) => {
                    // Keyboard parity for the drag: arrows move the box, Shift +
                    // arrows resize it. 1% of the image per press.
                    const step = 0.01;
                    const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
                    if (!keys.includes(event.key)) return;
                    event.preventDefault();
                    const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
                    const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
                    if (event.shiftKey) {
                      const next = {
                        ...rect,
                        width: Math.min(Math.max(rect.width + dx, MIN), 1 - rect.x),
                        height: Math.min(Math.max(rect.height + dy, MIN), 1 - rect.y),
                      };
                      setRect(applyAspect(next, aspect));
                    } else {
                      setRect({
                        ...rect,
                        x: Math.min(Math.max(rect.x + dx, 0), 1 - rect.width),
                        y: Math.min(Math.max(rect.y + dy, 0), 1 - rect.height),
                      });
                    }
                  }}
                >
                  {(["nw", "ne", "sw", "se"] as DragMode[]).map((corner) => (
                    <span
                      key={corner}
                      role="presentation"
                      onPointerDown={beginDrag(corner)}
                      className={cn(
                        "absolute h-4 w-4 rounded-full border-2 border-brand-500 bg-white",
                        corner === "nw" && "-left-2 -top-2 cursor-nwse-resize",
                        corner === "ne" && "-right-2 -top-2 cursor-nesw-resize",
                        corner === "sw" && "-bottom-2 -left-2 cursor-nesw-resize",
                        corner === "se" && "-bottom-2 -right-2 cursor-nwse-resize",
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {ASPECTS.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => {
                      setAspect(option.value);
                      if (option.value) setRect((current) => applyAspect(current, option.value));
                    }}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition-colors",
                      aspect === option.value
                        ? "border-primary/40 bg-primary/10 text-brand-700"
                        : "border-line bg-surface text-subtle hover:border-primary/30",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-subtle">Result preview</p>
                <div className="mt-1.5 grid min-h-[120px] place-items-center overflow-hidden rounded-xl border border-line bg-surface p-2">
                  {resultPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={resultPreview} alt="Preview of the cropped result" className="max-h-[150px] w-auto" />
                  ) : (
                    <span className="text-[12px] text-subtle">{rendering ? "Rendering…" : "Adjust the crop to see the result"}</span>
                  )}
                </div>
                <p className="mt-1.5 text-[11.5px] text-subtle">
                  Output: <span className="font-semibold text-body">{outputSize.width} × {outputSize.height} px</span> from{" "}
                  {dims.width} × {dims.height} px
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setRotation((current) => ((current + 90) % 360) as 0 | 90 | 180 | 270)}
                  className="btn-secondary min-h-[40px] px-3 text-[13px]"
                >
                  <RotateCw className="h-4 w-4" aria-hidden="true" />
                  Rotate {rotation ? `${rotation}°` : "90°"}
                </button>
                <button
                  type="button"
                  onClick={() => setFlipX((current) => !current)}
                  aria-pressed={flipX}
                  className={cn("btn-secondary min-h-[40px] px-3 text-[13px]", flipX && "border-primary/50 text-brand-700")}
                >
                  <FlipHorizontal2 className="h-4 w-4" aria-hidden="true" />
                  Flip
                </button>
                <button
                  type="button"
                  onClick={() => setFlipY((current) => !current)}
                  aria-pressed={flipY}
                  className={cn("btn-secondary min-h-[40px] px-3 text-[13px]", flipY && "border-primary/50 text-brand-700")}
                >
                  <FlipVertical2 className="h-4 w-4" aria-hidden="true" />
                  Flip
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRect(FULL);
                    setRotation(0);
                    setFlipX(false);
                    setFlipY(false);
                    setAspect(null);
                  }}
                  className="btn-secondary min-h-[40px] px-3 text-[13px]"
                >
                  Reset
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Format" htmlFor="cr-format">
                  <select
                    id="cr-format"
                    className="h-11 w-full appearance-none rounded-xl border border-line bg-raised px-3 text-[14px] text-ink"
                    value={format}
                    onChange={(event) => setFormat(event.target.value as OutputMime)}
                  >
                    {FORMATS.map((entry) => (
                      <option key={entry.value} value={entry.value}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                </Field>
                {activeFormat.lossy && (
                  <div className="rounded-xl border border-line bg-surface p-3">
                    <label htmlFor="cr-quality" className="flex items-center justify-between text-[12.5px] font-semibold text-ink">
                      Quality
                      <span className="tabular-nums text-subtle">{quality}</span>
                    </label>
                    <input
                      id="cr-quality"
                      type="range"
                      min={40}
                      max={100}
                      value={quality}
                      onChange={(event) => setQuality(Number(event.target.value))}
                      className="mt-2 w-full accent-brand-500"
                    />
                  </div>
                )}
              </div>

              {error && (
                <Notice tone="danger" onDismiss={() => setError(null)}>
                  {error}
                </Notice>
              )}

              <button type="button" onClick={exportCrop} disabled={busy} className="btn-primary w-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Crop className="h-4 w-4" aria-hidden="true" />}
                {busy ? "Cropping…" : "Crop and download"}
              </button>
              <p className="text-[11.5px] leading-relaxed text-subtle">
                The crop is taken from the full-resolution original, not from this preview, so a 6000 px photo stays
                6000 px sharp.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <button type="button" onClick={reset} className="text-[12.5px] font-semibold text-subtle hover:text-danger">
              Choose a different image
            </button>
            <span className="text-[11.5px] text-subtle">{file.name} · {formatBytes(file.size)}</span>
          </div>
        </>
      )}
    </ToolFrame>
  );
}
