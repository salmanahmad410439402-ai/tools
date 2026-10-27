"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Maximize2, Trash2 } from "lucide-react";
import { ACCEPT_IMAGE, INPUT_EXTENSIONS, decodeImage, describeImageError, encodeCanvas, type OutputMime } from "@/lib/images";
import { renderResize } from "@/lib/images/transform";
import { sizeBucket, track } from "@/lib/analytics";
import { makePreviewUrl, revokeResults, type ResultFile } from "@/lib/download";
import { cn, formatBytes, outputName } from "@/lib/utils";
import { Dropzone, Field, Notice, ProgressBar, ResultsPanel, Segmented, ToolFrame, inputClass, selectClass } from "./kit";

interface Item {
  id: string;
  file: File;
  preview: string;
}

type Mode = "exact" | "fit" | "percent";

const PRESETS = [
  { label: "1920 × 1080", width: 1920, height: 1080 },
  { label: "1280 × 720", width: 1280, height: 720 },
  { label: "1080 × 1080", width: 1080, height: 1080 },
  { label: "1200 × 630", width: 1200, height: 630 },
  { label: "800 × 800", width: 800, height: 800 },
  { label: "400 × 400", width: 400, height: 400 },
];

const FORMATS: { value: OutputMime; label: string; extension: string; lossy: boolean }[] = [
  { value: "image/jpeg", label: "JPG", extension: "jpg", lossy: true },
  { value: "image/png", label: "PNG", extension: "png", lossy: false },
  { value: "image/webp", label: "WebP", extension: "webp", lossy: true },
];

interface Props {
  toolSlug?: string;
}

export function ImageResizer({ toolSlug = "resize-image" }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [mode, setMode] = useState<Mode>("exact");
  const [width, setWidth] = useState("1920");
  const [height, setHeight] = useState("1080");
  const [percent, setPercent] = useState("50");
  const [lockRatio, setLockRatio] = useState(true);
  const [format, setFormat] = useState<OutputMime>("image/jpeg");
  const [quality, setQuality] = useState(90);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ value: 0, label: "" });
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultFile[]>([]);

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
    (files: File[]) => {
      setError(null);
      const next = files.map((file) => ({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        preview: createUrl(file),
      }));
      setItems((current) => [...current, ...next]);
      track("tool_started", { tool: toolSlug, files: next.length });
    },
    [createUrl, toolSlug],
  );

  const reset = () => {
    revokeResults(results);
    urls.current.forEach((url) => URL.revokeObjectURL(url));
    urls.current.clear();
    setResults([]);
    setItems([]);
    setError(null);
    setProgress({ value: 0, label: "" });
  };

  const activeFormat = useMemo(() => FORMATS.find((entry) => entry.value === format)!, [format]);
  const widthNumber = Number(width);
  const heightNumber = Number(height);
  const percentNumber = Number(percent);
  const inputsValid =
    mode === "percent"
      ? percentNumber > 0 && percentNumber <= 400
      : widthNumber > 0 && heightNumber > 0 && widthNumber <= 16384 && heightNumber <= 16384;

  const resize = async () => {
    if (!items.length || !inputsValid) return;
    setBusy(true);
    setError(null);
    setResults([]);
    const output: ResultFile[] = [];
    const failures: string[] = [];
    const warnings: string[] = [];

    try {
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        setProgress({
          value: index / items.length,
          label: `Resizing ${item.file.name} (${index + 1} of ${items.length})`,
        });

        try {
          let boxWidth = widthNumber;
          let boxHeight = heightNumber;
          let resizeMode: "exact" | "fit" = mode === "exact" ? "exact" : "fit";

          if (mode === "percent") {
            const probe = await decodeImage(item.file);
            boxWidth = Math.max(1, Math.round((probe.width * percentNumber) / 100));
            boxHeight = Math.max(1, Math.round((probe.height * percentNumber) / 100));
            probe.release();
            resizeMode = "exact";
          }

          if (lockRatio && mode !== "percent" && items.length === 1) {
            const probe = await decodeImage(item.file);
            const ratio = probe.width / probe.height;
            probe.release();
            if (resizeMode === "exact") boxHeight = Math.max(1, Math.round(boxWidth / ratio));
          }

          const rendered = await renderResize(item.file, {
            width: boxWidth,
            height: boxHeight,
            mode: resizeMode,
            keepAlpha: format !== "image/jpeg",
          });
          const { canvas, sourceWidth, sourceHeight } = rendered;
          const outWidth = canvas.width;
          const outHeight = canvas.height;
          const blob = await encodeCanvas(canvas, format, quality / 100);
          canvas.width = 0;
          canvas.height = 0;

          const upscaled = outWidth > sourceWidth || outHeight > sourceHeight;
          if (upscaled) warnings.push(`${item.file.name} was smaller than the requested size, so it was enlarged.`);

          output.push({
            id: item.id,
            name: outputName(item.file.name, `${outWidth}x${outHeight}`, activeFormat.extension),
            blob,
            size: blob.size,
            originalSize: item.file.size,
            originalName: item.file.name,
            note: `${sourceWidth} × ${sourceHeight} → ${outWidth} × ${outHeight} px${upscaled ? " (upscaled)" : ""}`,
            previewUrl: index < 12 ? createUrl(blob) : undefined,
          });
        } catch (caught) {
          failures.push(`${item.file.name}: ${describeImageError(caught)}`);
        }
      }

      if (!output.length) {
        setError(failures[0] ?? "None of the images could be resized.");
        return;
      }

      setResults(output);
      setProgress({ value: 1, label: "Done" });
      if (failures.length || warnings.length) {
        setError([...failures, ...warnings].slice(0, 2).join(" "));
      }
      track("tool_completed", {
        tool: toolSlug,
        format: activeFormat.label,
        files: output.length,
        size: sizeBucket(output.reduce((sum, file) => sum + file.size, 0)),
      });
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
        <ResultsPanel
          files={results}
          onReset={reset}
          heading={`${results.length} image${results.length === 1 ? "" : "s"} resized`}
          compare="conversion"
          zipName="filecraft-resized-images.zip"
        />
      </ToolFrame>
    );
  }

  return (
    <ToolFrame labelledBy="tool-title">
      <Dropzone
        accept={ACCEPT_IMAGE}
        acceptedLabel="JPG, PNG, WebP, HEIC, AVIF, GIF, BMP"
        extensions={INPUT_EXTENSIONS}
        onFiles={addFiles}
        maxSizeMb={100}
        title={items.length ? "Add more images" : "Drop images here or click to choose"}
        subtitle="Resize for social posts, forms, stores or the web · batch supported"
      />

      {items.length > 0 && (
        <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12.5px] font-semibold text-ink">
              {items.length} image{items.length === 1 ? "" : "s"} queued
            </p>
            <button type="button" onClick={reset} className="text-[12px] font-medium text-subtle hover:text-danger">
              Clear all
            </button>
          </div>

          <ul className="mt-2 grid gap-2 sm:grid-cols-2" aria-label="Queued images">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-2 rounded-xl border border-line bg-raised p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.preview}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-lg border border-line object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-ink">{item.file.name}</span>
                  <span className="text-[11px] text-subtle">{formatBytes(item.file.size)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(item.preview);
                    urls.current.delete(item.preview);
                    setItems((current) => current.filter((entry) => entry.id !== item.id));
                  }}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-subtle hover:bg-danger/5 hover:text-danger"
                  aria-label={`Remove ${item.file.name}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-5">
            <Segmented<Mode>
              label="How should the size be applied?"
              value={mode}
              onChange={setMode}
              options={[
                { value: "exact", label: "Exact pixels", hint: "Set a width and height" },
                { value: "fit", label: "Fit inside a box", hint: "Keeps the aspect ratio" },
                { value: "percent", label: "Percentage", hint: "Half or double the size" },
              ]}
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {mode === "percent" ? (
              <Field label="Scale" htmlFor="rs-percent" hint="100% keeps the original size. 50% halves both dimensions.">
                <div className="flex items-center gap-2">
                  <input
                    id="rs-percent"
                    type="number"
                    min={1}
                    max={400}
                    step={5}
                    value={percent}
                    onChange={(event) => setPercent(event.target.value)}
                    className={cn(inputClass, "tabular-nums")}
                  />
                  <span className="text-[13px] font-semibold text-subtle">%</span>
                </div>
              </Field>
            ) : (
              <>
                <Field label="Width (px)" htmlFor="rs-width">
                  <input
                    id="rs-width"
                    type="number"
                    min={1}
                    max={16384}
                    value={width}
                    onChange={(event) => setWidth(event.target.value)}
                    className={cn(inputClass, "tabular-nums")}
                  />
                </Field>
                <Field label="Height (px)" htmlFor="rs-height">
                  <input
                    id="rs-height"
                    type="number"
                    min={1}
                    max={16384}
                    value={height}
                    onChange={(event) => setHeight(event.target.value)}
                    className={cn(inputClass, "tabular-nums")}
                  />
                </Field>
              </>
            )}

            {mode === "exact" && (
              <label className="flex items-center gap-2 text-[13px] text-body sm:col-span-2">
                <input
                  type="checkbox"
                  checked={lockRatio}
                  onChange={(event) => setLockRatio(event.target.checked)}
                  className="h-4 w-4 accent-brand-500"
                />
                Keep the aspect ratio (height follows the width; only applies to a single image)
              </label>
            )}

            <Field label="Output format" htmlFor="rs-format" hint={activeFormat.lossy ? "JPG and WebP re-encode, so quality matters." : "PNG is lossless and keeps transparency."}>
              <select
                id="rs-format"
                className={selectClass}
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
                <label htmlFor="rs-quality" className="flex items-center justify-between text-[12.5px] font-semibold text-ink">
                  Quality
                  <span className="tabular-nums text-subtle">{quality}</span>
                </label>
                <input
                  id="rs-quality"
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

          {mode !== "percent" && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setWidth(String(preset.width));
                    setHeight(String(preset.height));
                    setLockRatio(false);
                  }}
                  className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11.5px] font-semibold text-subtle transition-colors hover:border-primary/30 hover:text-body"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}

          {!inputsValid && (
            <Notice tone="warning" className="mt-3">
              Enter positive numbers — a browser canvas tops out at 16,384 px per side.
            </Notice>
          )}

          {error && (
            <Notice tone="danger" className="mt-4" onDismiss={() => setError(null)}>
              {error}
            </Notice>
          )}

          {busy && <ProgressBar value={progress.value} label={progress.label || "Resizing…"} />}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={resize} disabled={busy || !inputsValid} className="btn-primary w-full sm:w-auto">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Maximize2 className="h-4 w-4" aria-hidden="true" />}
              {busy ? "Resizing…" : `Resize ${items.length > 1 ? `${items.length} images` : "image"}`}
            </button>
            <p className="text-[12.5px] text-subtle">No upload — the pixels never leave your device.</p>
          </div>
        </>
      )}

      {items.length === 0 && (
        <p className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-surface px-4 py-3 text-[12.5px] text-subtle">
          <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
          Resizing changes dimensions; compressing changes the file size. Use both if a form limits each.
        </p>
      )}
    </ToolFrame>
  );
}
