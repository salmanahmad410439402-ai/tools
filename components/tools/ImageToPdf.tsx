"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, FileText, GripVertical, Loader2, Trash2, Wand2 } from "lucide-react";
import { ACCEPT_IMAGE, INPUT_EXTENSIONS, decodeImage, describeImageError } from "@/lib/images";
import { buildImagePdf, type PdfImage } from "@/lib/pdf/image-to-pdf";
import { track, sizeBucket } from "@/lib/analytics";
import { makePreviewUrl, revokeResults, type ResultFile } from "@/lib/download";
import { fileBaseName, formatBytes, outputName } from "@/lib/utils";
import { Dropzone, Field, Notice, ProgressBar, ResultsPanel, ToolFrame, selectClass } from "./kit";

type PageSize = "a4" | "letter" | "a5" | "fit";
type Orientation = "auto" | "portrait" | "landscape";
type QualityMode = "lossless" | "smaller";

interface Item {
  id: string;
  file: File;
  preview: string;
}

const MAX_EDGE = 4000;

export function ImageToPdf() {
  const [items, setItems] = useState<Item[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("auto");
  const [margin, setMargin] = useState("10");
  const [qualityMode, setQualityMode] = useState<QualityMode>("lossless");
  const [quality, setQuality] = useState(85);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ value: 0, label: "" });
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultFile[]>([]);
  const [warnLarge, setWarnLarge] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const itemsRef = useRef<Item[]>([]);

  itemsRef.current = items;

  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => URL.revokeObjectURL(item.preview));
    };
  }, []);

  const addFiles = useCallback((files: File[]) => {
    setError(null);
    const next = files.map((file) => ({
      id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      preview: makePreviewUrl(file),
    }));
    setItems((current) => [...current, ...next]);
    const totalBytes = [...itemsRef.current, ...next].reduce((sum, item) => sum + item.file.size, 0);
    setWarnLarge(totalBytes > 100 * 1024 * 1024);
    track("tool_started", { tool: "image-to-pdf", files: next.length });
  }, []);

  const removeItem = (id: string) => {
    setItems((current) => {
      const target = current.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return current.filter((item) => item.id !== id);
    });
  };

  const move = (index: number, direction: -1 | 1) => {
    setItems((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const reset = () => {
    revokeResults(results);
    setResults([]);
    setItems((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.preview));
      return [];
    });
    setError(null);
    setProgress({ value: 0, label: "" });
    setWarnLarge(false);
  };

  const buildPdf = async () => {
    if (!items.length) return;
    setBusy(true);
    setError(null);
    setResults([]);
    try {
      const pages: PdfImage[] = [];

      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        setProgress({
          value: index / items.length,
          label: `Preparing ${item.file.name} (${index + 1} of ${items.length})`,
        });

        const extension = item.file.name.split(".").pop()?.toLowerCase() ?? "";
        const keepOriginal = qualityMode === "lossless" && (extension === "jpg" || extension === "jpeg" || extension === "png");

        if (keepOriginal) {
          const bytes = new Uint8Array(await item.file.arrayBuffer());
          const decoded = await decodeImage(item.file);
          pages.push({ bytes, kind: extension === "png" ? "png" : "jpg", width: decoded.width, height: decoded.height });
          decoded.release();
        } else {
          const decoded = await decodeImage(item.file);
          let width = decoded.width;
          let height = decoded.height;
          if (Math.max(width, height) > MAX_EDGE) {
            const fit = MAX_EDGE / Math.max(width, height);
            width = Math.round(width * fit);
            height = Math.round(height * fit);
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d", { alpha: false });
          if (!context) throw new Error("Canvas is not available in this browser.");
          // JPEG/PNG sources may carry transparency; the canvas background
          // decides what takes its place in the PDF.
          context.fillStyle = "#FFFFFF";
          context.fillRect(0, 0, width, height);
          context.imageSmoothingQuality = "high";
          context.drawImage(decoded.bitmap, 0, 0, width, height);
          decoded.release();

          const smaller = qualityMode === "smaller";
          const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, smaller ? "image/jpeg" : "image/png", smaller ? quality / 100 : undefined),
          );
          canvas.width = 0;
          canvas.height = 0;
          if (!blob) throw new Error("This image could not be encoded.");
          pages.push({
            bytes: new Uint8Array(await blob.arrayBuffer()),
            kind: smaller ? "jpg" : "png",
            width,
            height,
          });
        }
      }

      setProgress({ value: 0.9, label: "Building the PDF" });
      const bytes = await buildImagePdf(pages, {
        pageSize,
        orientation,
        marginMm: Number(margin),
      });

      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      const first = items[0].file;
      const baseName =
        items.length === 1
          ? first.name
          : `${fileBaseName(first.name)}-and-${items.length - 1}-more`;
      const name = outputName(baseName, "", "pdf");
      const originalSize = items.reduce((sum, item) => sum + item.file.size, 0);
      const result: ResultFile = {
        id: "pdf",
        name,
        blob,
        size: blob.size,
        originalName: `${items.length} image${items.length === 1 ? "" : "s"}`,
        note: `${items.length} page${items.length === 1 ? "" : "s"} · ${formatBytes(originalSize)} of source images`,
      };
      setResults([result]);
      setProgress({ value: 1, label: "Done" });
      track("tool_completed", { tool: "image-to-pdf", pages: items.length, size: sizeBucket(blob.size) });
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
          heading="Your PDF is ready"
          extra={
            <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-[12.5px] text-subtle">
              Open it once before you send it — check that the page order matches the document you
              photographed and that the smallest text is still readable.
            </p>
          }
        />
      </ToolFrame>
    );
  }

  return (
    <ToolFrame labelledBy="tool-title">
      <Dropzone
        accept={ACCEPT_IMAGE}
        acceptedLabel="JPG, PNG, WebP, HEIC, GIF, BMP"
        extensions={INPUT_EXTENSIONS}
        onFiles={addFiles}
        maxSizeMb={150}
        title={items.length ? "Add more images" : "Drop images here or click to choose"}
        subtitle="JPG, PNG, WebP, HEIC, GIF, BMP, TIFF · up to 150 MB per file · paste with ⌘V"
      />

      {items.length > 0 && (
        <>
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[12.5px] font-semibold text-ink">
                Page order ({items.length})
              </p>
              <button type="button" onClick={reset} className="text-[12px] font-medium text-subtle hover:text-danger">
                Clear all
              </button>
            </div>
            <ul className="space-y-2" aria-label="Images in page order">
              {items.map((item, index) => (
                <li
                  key={item.id}
                  draggable
                  onDragStart={() => {
                    dragIndex.current = index;
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    const from = dragIndex.current;
                    dragIndex.current = null;
                    if (from === null || from === index) return;
                    setItems((current) => {
                      const next = [...current];
                      const [moved] = next.splice(from, 1);
                      next.splice(index, 0, moved);
                      return next;
                    });
                  }}
                  className="flex items-center gap-2 rounded-xl border border-line bg-white p-2"
                >
                  <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-line" aria-hidden="true" />
                  <span className="w-5 shrink-0 text-center text-[11.5px] font-semibold text-subtle">{index + 1}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.preview}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-lg border border-line object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium text-ink">{item.file.name}</span>
                    <span className="text-[11.5px] text-subtle">{formatBytes(item.file.size)}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      className="grid h-8 w-8 place-items-center rounded-lg text-subtle hover:bg-surface hover:text-ink disabled:opacity-30"
                      aria-label={`Move ${item.file.name} earlier`}
                    >
                      <ArrowUp className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === items.length - 1}
                      className="grid h-8 w-8 place-items-center rounded-lg text-subtle hover:bg-surface hover:text-ink disabled:opacity-30"
                      aria-label={`Move ${item.file.name} later`}
                    >
                      <ArrowDown className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-subtle hover:bg-danger/5 hover:text-danger"
                      aria-label={`Remove ${item.file.name}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Page size" htmlFor="i2p-page">
              <select id="i2p-page" className={selectClass} value={pageSize} onChange={(event) => setPageSize(event.target.value as PageSize)}>
                <option value="a4">A4 (210 × 297 mm)</option>
                <option value="letter">US Letter (8.5 × 11 in)</option>
                <option value="a5">A5 (148 × 210 mm)</option>
                <option value="fit">Fit to image</option>
              </select>
            </Field>

            <Field label="Orientation" htmlFor="i2p-orientation" hint={pageSize === "fit" ? "Ignored when fitting to the image" : undefined}>
              <select
                id="i2p-orientation"
                className={selectClass}
                value={orientation}
                onChange={(event) => setOrientation(event.target.value as Orientation)}
                disabled={pageSize === "fit"}
              >
                <option value="auto">Match each image</option>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </Field>

            <Field label="Margin" htmlFor="i2p-margin">
              <select id="i2p-margin" className={selectClass} value={margin} onChange={(event) => setMargin(event.target.value)}>
                <option value="0">None</option>
                <option value="10">10 mm</option>
                <option value="20">20 mm</option>
                <option value="40">40 mm</option>
              </select>
            </Field>

            <Field label="Image quality" htmlFor="i2p-quality">
              <select
                id="i2p-quality"
                className={selectClass}
                value={qualityMode}
                onChange={(event) => setQualityMode(event.target.value as QualityMode)}
              >
                <option value="lossless">Keep original quality</option>
                <option value="smaller">Re-encode smaller</option>
              </select>
            </Field>
          </div>

          {qualityMode === "smaller" && (
            <div className="mt-4 rounded-xl border border-line bg-surface p-4">
              <label htmlFor="i2p-jpeg-quality" className="flex items-center justify-between text-[12.5px] font-semibold text-ink">
                JPEG quality
                <span className="tabular-nums text-subtle">{quality}</span>
              </label>
              <input
                id="i2p-jpeg-quality"
                type="range"
                min={40}
                max={95}
                step={5}
                value={quality}
                onChange={(event) => setQuality(Number(event.target.value))}
                className="mt-2 w-full accent-brand-500"
              />
              <p className="mt-1 text-[11.5px] text-subtle">
                Lower quality makes a smaller file. Photos stay sharp down to about 75.
              </p>
            </div>
          )}

          {warnLarge && (
            <Notice tone="warning" className="mt-4">
              These images add up to more than 100 MB. On a phone this can run out of memory — consider
              converting them in smaller batches.
            </Notice>
          )}

          {error && (
            <Notice tone="danger" className="mt-4" onDismiss={() => setError(null)}>
              {error}
            </Notice>
          )}

          {busy && <ProgressBar value={progress.value} label={progress.label || "Working…"} />}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={buildPdf} disabled={busy || !items.length} className="btn-primary w-full sm:w-auto">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Wand2 className="h-4 w-4" aria-hidden="true" />}
              {busy ? "Building PDF…" : `Create PDF (${items.length} page${items.length === 1 ? "" : "s"})`}
            </button>
            <p className="inline-flex items-center gap-1.5 text-[12.5px] text-subtle">
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              Nothing is uploaded while this runs.
            </p>
          </div>
        </>
      )}

      {items.length === 0 && (
        <p className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-surface px-4 py-3 text-[12.5px] text-subtle">
          <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
          Step 1: add images — step 2: pick a page size — step 3: download. Usually under 30 seconds.
        </p>
      )}
    </ToolFrame>
  );
}
