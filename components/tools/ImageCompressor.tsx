"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Gauge, Loader2, Trash2 } from "lucide-react";
import { ACCEPT_IMAGE, INPUT_EXTENSIONS, describeImageError } from "@/lib/images";
import { compressToTarget, type CompressMime } from "@/lib/images/transform";
import { sizeBucket, track } from "@/lib/analytics";
import { makePreviewUrl, revokeResults, type ResultFile } from "@/lib/download";
import { cn, formatBytes, outputName } from "@/lib/utils";
import { Dropzone, Field, Notice, ProgressBar, ResultsPanel, ToolFrame, inputClass, selectClass } from "./kit";

interface Item {
  id: string;
  file: File;
  preview: string;
}

const PRESETS = [20, 50, 100, 200, 500, 1000, 2000];

const EDGE_OPTIONS = [
  { value: "0", label: "Keep the original dimensions" },
  { value: "2560", label: "Cap the longest edge at 2560 px" },
  { value: "1920", label: "Cap the longest edge at 1920 px" },
  { value: "1280", label: "Cap the longest edge at 1280 px" },
  { value: "800", label: "Cap the longest edge at 800 px" },
];

interface Props {
  toolSlug?: string;
}

export function ImageCompressor({ toolSlug = "compress-image" }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [targetKb, setTargetKb] = useState("200");
  const [format, setFormat] = useState<CompressMime>("image/jpeg");
  const [maxEdge, setMaxEdge] = useState("0");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ value: 0, label: "" });
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
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
      setNotes([]);
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
    setNotes([]);
    setError(null);
    setProgress({ value: 0, label: "" });
  };

  const targetBytes = Math.round(Number(targetKb) * 1024);
  const targetValid = Number.isFinite(targetBytes) && targetBytes > 0;

  const compress = async () => {
    if (!items.length || !targetValid) return;
    setBusy(true);
    setError(null);
    setNotes([]);
    setResults([]);
    const output: ResultFile[] = [];
    const failures: string[] = [];
    const missed: string[] = [];

    try {
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        setProgress({
          value: index / items.length,
          label: `Compressing ${item.file.name} (${index + 1} of ${items.length})`,
        });

        try {
          const result = await compressToTarget(item.file, {
            targetBytes,
            mime: format,
            maxEdge: Number(maxEdge),
            background: "#FFFFFF",
          });

          if (!result.reachedTarget) missed.push(item.file.name);

          if (result.blob.size >= item.file.size) {
            // Re-encoding already-squeezed files often grows them. Say so
            // instead of handing over a "compressed" file that is bigger.
            failures.push(
              `${item.file.name}: this file is already ${formatBytes(item.file.size)} — smaller than anything re-encoding produced. Keep the original.`,
            );
            continue;
          }

          const notesForFile = [
            `Quality ${Math.round(result.quality * 100)}% · ${result.width} × ${result.height} px`,
            result.width !== result.sourceWidth || result.height !== result.sourceHeight
              ? `resized from ${result.sourceWidth} × ${result.sourceHeight}`
              : null,
            result.reachedTarget ? "within target" : "could not reach the target — this is the smallest result",
          ]
            .filter(Boolean)
            .join(" · ");

          output.push({
            id: item.id,
            name: outputName(item.file.name, format === "image/webp" ? "webp" : "compressed", format === "image/webp" ? "webp" : "jpg"),
            blob: result.blob,
            size: result.blob.size,
            originalSize: item.file.size,
            originalName: item.file.name,
            note: notesForFile,
            previewUrl: index < 12 ? createUrl(result.blob) : undefined,
          });
        } catch (caught) {
          failures.push(`${item.file.name}: ${describeImageError(caught)}`);
        }
      }

      if (!output.length) {
        setError(failures[0] ?? "None of the images could be compressed.");
        return;
      }

      setResults(output);
      setProgress({ value: 1, label: "Done" });
      if (missed.length) {
        setNotes([
          `${missed.length === 1 ? "One file" : `${missed.length} files`} could not reach ${targetKb} KB (${missed
            .slice(0, 3)
            .join(", ")}). The result is the smallest this browser could make at the lowest quality — lower the resolution cap or accept a larger target.`,
        ]);
      }
      if (failures.length) setError(`${failures.length} file(s) were left alone. ${failures[0]}`);
      track("tool_completed", {
        tool: toolSlug,
        format: format === "image/webp" ? "WebP" : "JPG",
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
          heading={`${results.length} image${results.length === 1 ? "" : "s"} compressed`}
          zipName="filecraft-compressed-images.zip"
          extra={
            notes.length ? (
              <div className="mt-3 space-y-2">
                {notes.map((note) => (
                  <Notice key={note} tone="info">
                    {note}
                  </Notice>
                ))}
              </div>
            ) : undefined
          }
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
        subtitle="JPG, PNG, WebP, HEIC and AVIF · up to 100 MB per file · batch supported"
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

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field
              label="Target file size (KB)"
              htmlFor="ic-target"
              hint={targetValid ? `Aim: ${formatBytes(targetBytes)} or less.` : "Enter a number of kilobytes, e.g. 200."}
            >
              <div className="flex items-center gap-2">
                <input
                  id="ic-target"
                  type="number"
                  min={5}
                  max={20_000}
                  step={5}
                  value={targetKb}
                  onChange={(event) => setTargetKb(event.target.value)}
                  className={cn(inputClass, "tabular-nums")}
                />
                <span className="text-[13px] font-semibold text-subtle">KB</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTargetKb(String(preset))}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition-colors",
                      Number(targetKb) === preset
                        ? "border-primary/40 bg-primary/10 text-brand-700"
                        : "border-line bg-surface text-subtle hover:border-primary/30",
                    )}
                  >
                    {preset >= 1000 ? `${preset / 1000} MB` : `${preset} KB`}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Output format" htmlFor="ic-format" hint="WebP is usually 20–30% smaller than JPG at the same visual quality.">
              <select
                id="ic-format"
                className={selectClass}
                value={format}
                onChange={(event) => setFormat(event.target.value as CompressMime)}
              >
                <option value="image/jpeg">JPG — works everywhere</option>
                <option value="image/webp">WebP — smaller, modern</option>
              </select>
            </Field>

            <Field
              label="Resolution cap"
              htmlFor="ic-edge"
              hint="Dropping resolution is often the better trade for a hard size limit."
              className="sm:col-span-2"
            >
              <select id="ic-edge" className={selectClass} value={maxEdge} onChange={(event) => setMaxEdge(event.target.value)}>
                {EDGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {targetBytes > 40 * 1024 * 1024 && (
            <Notice tone="warning" className="mt-3">
              A {formatBytes(targetBytes)} target is beyond what a browser compressor can meaningfully do — most photos
              start below that. Lower the target, or use the resizer instead.
            </Notice>
          )}

          {error && (
            <Notice tone="danger" className="mt-4" onDismiss={() => setError(null)}>
              {error}
            </Notice>
          )}

          {busy && <ProgressBar value={progress.value} label={progress.label || "Compressing…"} />}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={compress} disabled={busy || !targetValid} className="btn-primary w-full sm:w-auto">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Gauge className="h-4 w-4" aria-hidden="true" />}
              {busy ? "Compressing…" : `Compress ${items.length > 1 ? `${items.length} images` : "image"} to ${targetKb || "?"} KB`}
            </button>
            <p className="text-[12.5px] text-subtle">The quality search runs on your device — no upload.</p>
          </div>

          <p className="mt-2 inline-flex items-start gap-1.5 text-[11.5px] leading-relaxed text-subtle">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />
            The tool tries a high quality first, then searches downwards, and keeps the highest quality that still
            fits your target. If the target is impossible it tells you instead of pretending.
          </p>
        </>
      )}

      {items.length === 0 && (
        <p className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-surface px-4 py-3 text-[12.5px] text-subtle">
          <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
          Common targets: 100 KB for job portals, 200 KB for forms, 1 MB for email.
        </p>
      )}
    </ToolFrame>
  );
}
