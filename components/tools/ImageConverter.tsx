"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImageIcon, Loader2, Repeat2, Trash2 } from "lucide-react";
import {
  ACCEPT_IMAGE,
  INPUT_EXTENSIONS,
  OUTPUT_FORMATS,
  canEncode,
  describeImageError,
  encodeCanvas,
  renderToCanvas,
  type OutputMime,
} from "@/lib/images";
import { sizeBucket, track } from "@/lib/analytics";
import { makePreviewUrl, revokeResults, type ResultFile } from "@/lib/download";
import { cn, formatBytes, outputName } from "@/lib/utils";
import { Dropzone, Field, Notice, ProgressBar, ResultsPanel, ToolFrame, selectClass } from "./kit";

interface Item {
  id: string;
  file: File;
  preview: string;
}

interface Props {
  /** Landing pages such as /jpg-to-png/ lock the output format. */
  presetFormat?: OutputMime;
  conversionLabel?: string;
  toolSlug?: string;
}

const RESIZE_OPTIONS = [
  { value: "0", label: "Keep original size" },
  { value: "3840", label: "Max 3840 px (4K)" },
  { value: "2560", label: "Max 2560 px" },
  { value: "1920", label: "Max 1920 px (Full HD)" },
  { value: "1280", label: "Max 1280 px" },
  { value: "800", label: "Max 800 px" },
];

export function ImageConverter({ presetFormat, conversionLabel, toolSlug = "image-converter" }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [format, setFormat] = useState<OutputMime>(presetFormat ?? "image/png");
  const [quality, setQuality] = useState(88);
  const [maxEdge, setMaxEdge] = useState("0");
  const [background, setBackground] = useState("#FFFFFF");
  const [unsupported, setUnsupported] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ value: 0, label: "" });
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultFile[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const checks = await Promise.all(
        OUTPUT_FORMATS.filter((entry) => entry.native).map(async (entry) => ({
          mime: entry.mime,
          ok: await canEncode(entry.mime),
        })),
      );
      if (!cancelled) setUnsupported(checks.filter((check) => !check.ok).map((check) => check.mime));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Track every object URL we create so leaving the page releases all of them,
  // including thumbnails and result previews (no leaked memory).
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

  const addFiles = useCallback((files: File[]) => {
    setError(null);
    const next = files.map((file) => ({
      id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      preview: createUrl(file),
    }));
    setItems((current) => [...current, ...next]);
    track("tool_started", { tool: toolSlug, files: next.length });
  }, [createUrl, toolSlug]);

  const reset = () => {
    revokeResults(results);
    urls.current.forEach((url) => URL.revokeObjectURL(url));
    urls.current.clear();
    setResults([]);
    setItems([]);
    setError(null);
    setProgress({ value: 0, label: "" });
  };

  const activeFormat = OUTPUT_FORMATS.find((entry) => entry.mime === format)!;
  const formatUnavailable = activeFormat.native && unsupported.includes(activeFormat.mime);

  const convert = async () => {
    if (!items.length) return;
    setBusy(true);
    setError(null);
    setResults([]);
    const output: ResultFile[] = [];

    try {
      const edge = Number(maxEdge);
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        setProgress({
          value: index / items.length,
          label: `Converting ${item.file.name} (${index + 1} of ${items.length})`,
        });
        const canvas = await renderToCanvas(item.file, {
          maxEdge: edge > 0 ? edge : 0,
          background,
        });
        const blob = await encodeCanvas(canvas, format, quality / 100);
        canvas.width = 0;
        canvas.height = 0;

        const note =
          format === "image/gif"
            ? "Single frame, 216-colour palette."
            : format === "image/tiff"
              ? "Uncompressed RGB TIFF."
              : format === "image/bmp"
                ? "Uncompressed BMP — expect a large file."
                : format === "image/x-icon"
                  ? "Square icon, PNG-compressed."
                  : undefined;

        output.push({
          id: item.id,
          name: outputName(item.file.name, "", activeFormat.extension),
          blob,
          size: blob.size,
          originalSize: item.file.size,
          originalName: item.file.name,
          note,
          previewUrl: index < 12 ? createUrl(blob) : undefined,
        });
      }

      setResults(output);
      setProgress({ value: 1, label: "Done" });
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
        <ResultsPanel
          files={results}
          onReset={reset}
          heading={`Converted to ${activeFormat.label}`}
          zipName={`filecraft-${activeFormat.label.toLowerCase()}-images.zip`}
          extra={
            activeFormat.lossy ? (
              <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-[12.5px] text-subtle">
                {activeFormat.label} is a lossy format, so re-saving the result again will lose a little more
                detail. Keep the original if you may need it again.
              </p>
            ) : null
          }
        />
      </ToolFrame>
    );
  }

  return (
    <ToolFrame labelledBy="tool-title">
      <Dropzone
        accept={ACCEPT_IMAGE}
        acceptedLabel="JPG, PNG, WebP, HEIC, AVIF, GIF, BMP, TIFF, SVG"
        extensions={INPUT_EXTENSIONS}
        onFiles={addFiles}
        maxSizeMb={100}
        title={items.length ? "Add more images" : "Drop images here or click to choose"}
        subtitle="Any common image format · up to 100 MB per file · you can add a whole batch"
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
              <li key={item.id} className="flex items-center gap-2 rounded-xl border border-line bg-white p-2">
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

          {!presetFormat && (
            <fieldset className="mt-5">
              <legend className="mb-2 text-[12.5px] font-semibold text-ink">Convert to</legend>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                {OUTPUT_FORMATS.map((entry) => {
                  const unavailable = entry.native && unsupported.includes(entry.mime);
                  const active = entry.mime === format;
                  return (
                    <button
                      key={entry.mime}
                      type="button"
                      onClick={() => setFormat(entry.mime)}
                      disabled={unavailable}
                      aria-pressed={active}
                      title={unavailable ? `${entry.label} is not supported by this browser` : entry.hint}
                      className={cn(
                        "flex min-h-[56px] flex-col items-center justify-center rounded-xl border text-[13px] font-bold transition-colors",
                        active
                          ? "border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500"
                          : "border-line bg-white text-body hover:border-brand-200",
                        unavailable && "cursor-not-allowed opacity-40",
                      )}
                    >
                      {entry.label}
                      <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-subtle">
                        {unavailable ? "n/a" : entry.lossy ? "lossy" : "lossless"}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11.5px] leading-relaxed text-subtle">{activeFormat.hint}</p>
            </fieldset>
          )}

          {presetFormat && (
            <Notice tone="info" className="mt-4">
              This page is set to <strong className="font-semibold">{activeFormat.label}</strong> output. Need a
              different format? The{" "}
              <a href="/image-converter/" className="link">
                full image converter
              </a>{" "}
              handles JPG, PNG, WebP, AVIF, GIF, BMP, TIFF and ICO.
            </Notice>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {activeFormat.lossy && (
              <div className="rounded-xl border border-line bg-surface p-3">
                <label htmlFor="ic-quality" className="flex items-center justify-between text-[12.5px] font-semibold text-ink">
                  Quality
                  <span className="tabular-nums text-subtle">{quality}</span>
                </label>
                <input
                  id="ic-quality"
                  type="range"
                  min={30}
                  max={100}
                  step={1}
                  value={quality}
                  onChange={(event) => setQuality(Number(event.target.value))}
                  className="mt-2 w-full accent-brand-500"
                />
                <p className="mt-1 text-[11.5px] text-subtle">85–95 for keeping, 70–80 for the web.</p>
              </div>
            )}

            <Field label="Resize while converting" htmlFor="ic-resize">
              <select id="ic-resize" className={selectClass} value={maxEdge} onChange={(event) => setMaxEdge(event.target.value)}>
                {RESIZE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Background for transparent areas"
              htmlFor="ic-background"
              hint="Used when the target format has no transparency (JPG, BMP)."
            >
              <div className="flex items-center gap-2">
                <input
                  id="ic-background"
                  type="color"
                  value={background}
                  onChange={(event) => setBackground(event.target.value)}
                  className="h-11 w-14 cursor-pointer rounded-lg border border-line bg-white p-1"
                />
                <span className="font-mono text-[12.5px] uppercase text-subtle">{background}</span>
              </div>
            </Field>
          </div>

          {format === "image/avif" && (
            <Notice tone="info" className="mt-3">
              AVIF produces the smallest files but is the slowest to encode. A batch of large photos can take a
              while — the progress bar is honest about it.
            </Notice>
          )}

          {formatUnavailable && (
            <Notice tone="warning" className="mt-3">
              This browser cannot write {activeFormat.label} files. Pick another format — WebP is the closest
              substitute in Safari.
            </Notice>
          )}

          {error && (
            <Notice tone="danger" className="mt-4" onDismiss={() => setError(null)}>
              {error}
            </Notice>
          )}

          {busy && <ProgressBar value={progress.value} label={progress.label || "Converting…"} />}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={convert} disabled={busy || formatUnavailable} className="btn-primary w-full sm:w-auto">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Repeat2 className="h-4 w-4" aria-hidden="true" />}
              {busy
                ? "Converting…"
                : conversionLabel
                  ? `Convert ${conversionLabel}`
                  : `Convert to ${activeFormat.label}`}
            </button>
            <p className="inline-flex items-center gap-1.5 text-[12.5px] text-subtle">
              <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Conversion happens on your device.
            </p>
          </div>
        </>
      )}

      {items.length === 0 && (
        <p className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-surface px-4 py-3 text-[12.5px] text-subtle">
          <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
          {presetFormat ? "JPG files are decoded and re-encoded locally." : "Batch convert and download everything as one ZIP."}
        </p>
      )}
    </ToolFrame>
  );
}
