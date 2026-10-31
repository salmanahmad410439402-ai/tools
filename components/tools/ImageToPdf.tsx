"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowRight,
  Check,
  Download,
  FileText,
  GripVertical,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  Trash2,
  Wand2,
} from "lucide-react";
import { ACCEPT_IMAGE, INPUT_EXTENSIONS, decodeImage, describeImageError } from "@/lib/images";
import { buildImagePdfFromPages, type PdfImage } from "@/lib/pdf/image-to-pdf";
import { track, sizeBucket } from "@/lib/analytics";
import { downloadBlob, makePreviewUrl } from "@/lib/download";
import { cn, fileBaseName, formatBytes, outputName, percentSaved } from "@/lib/utils";
import { Dropzone, Field, Notice, ProgressBar, ToolFrame, selectClass } from "./kit";

type PageSize = "a4" | "letter" | "a5" | "fit";
type Orientation = "auto" | "portrait" | "landscape";
type QualityMode = "lossless" | "smaller";
type PerPage = 1 | 2 | 4;
type Step = 1 | 2 | 3 | 4;
type CompressLevel = "balanced" | "small";

interface Item {
  id: string;
  file: File;
  preview: string;
}

/** A finished PDF held in memory between the build and the download step. */
interface Generated {
  blob: Blob;
  name: string;
  size: number;
  pages: number;
  images: number;
  /** Total bytes of the source images, shown for context. */
  sourceBytes: number;
}

interface Compressed {
  blob: Blob;
  size: number;
  level: CompressLevel;
  note: string;
}

const MAX_EDGE = 4000;

const INPUT_PRESETS = {
  jpg: { accept: ".jpg,.jpeg,image/jpeg", extensions: ["jpg", "jpeg"], label: "JPG" },
  png: { accept: ".png,image/png", extensions: ["png"], label: "PNG" },
  webp: { accept: ".webp,image/webp", extensions: ["webp"], label: "WebP" },
};

/**
 * How the images are written into the PDF.
 *
 * `jpeg: null` means "copy the original file in untouched" — that is the
 * lossless default, and it only applies to JPEG and PNG (the two formats a PDF
 * can hold directly). Everything else, and every compression pass, is decoded
 * and re-encoded through a canvas.
 */
interface EncodeProfile {
  maxEdge: number;
  jpeg: number | null;
}

const COMPRESS_PROFILES: Record<CompressLevel, { maxEdge: number; jpeg: number; label: string; hint: string }> = {
  balanced: {
    maxEdge: 2400,
    jpeg: 78,
    label: "Balanced",
    hint: "Long edge 2400 px, JPEG 78 % — looks the same at normal reading size.",
  },
  small: {
    maxEdge: 1600,
    jpeg: 58,
    label: "Smallest",
    hint: "Long edge 1600 px, JPEG 58 % — for email and upload forms that cap the size.",
  },
};

const PER_PAGE_OPTIONS: { value: PerPage; label: string; hint: string }[] = [
  { value: 1, label: "1 per page", hint: "One picture per sheet — the usual choice for documents." },
  { value: 2, label: "2 per page", hint: "Two pictures stacked on each sheet." },
  { value: 4, label: "4 per page", hint: "A 2 × 2 grid — good for photos, contact sheets and ID copies." },
];

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: "Add images" },
  { n: 2, label: "Arrange pages" },
  { n: 3, label: "Create PDF" },
  { n: 4, label: "Size & download" },
];

const chunk = <T,>(list: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let index = 0; index < list.length; index += size) out.push(list.slice(index, index + size));
  return out;
};

export function ImageToPdf({ input }: { input?: "jpg" | "png" | "webp" } = {}) {
  const inputPreset = input ? INPUT_PRESETS[input] : null;
  const [items, setItems] = useState<Item[]>([]);
  const [step, setStep] = useState<Step>(1);
  const [perPage, setPerPage] = useState<PerPage>(1);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("auto");
  const [margin, setMargin] = useState("10");
  const [qualityMode, setQualityMode] = useState<QualityMode>("lossless");
  const [quality, setQuality] = useState(85);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ value: 0, label: "" });
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [compressed, setCompressed] = useState<Compressed | null>(null);
  const [compressing, setCompressing] = useState<CompressLevel | null>(null);
  const [compressMessage, setCompressMessage] = useState<string | null>(null);
  const [warnLarge, setWarnLarge] = useState(false);
  const dragId = useRef<string | null>(null);
  const itemsRef = useRef<Item[]>([]);

  itemsRef.current = items;

  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => URL.revokeObjectURL(item.preview));
    };
  }, []);

  /** Derived page model: the list order *is* the page order. */
  const pages = useMemo(() => chunk(items, perPage), [items, perPage]);

  const sourceBytes = useMemo(() => items.reduce((sum, item) => sum + item.file.size, 0), [items]);

  /** Any change to the inputs invalidates a PDF that was already built. */
  const invalidateOutput = () => {
    setGenerated(null);
    setCompressed(null);
    setCompressMessage(null);
    setStep((current) => (current === 4 ? 3 : current));
  };

  const addFiles = useCallback((files: File[]) => {
    setError(null);
    const next = files.map((file) => ({
      id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      preview: makePreviewUrl(file),
    }));
    setItems((current) => [...current, ...next]);
    setGenerated(null);
    setCompressed(null);
    setCompressMessage(null);
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
    invalidateOutput();
  };

  const moveItem = (index: number, target: number) => {
    setItems((current) => {
      if (target < 0 || target >= current.length || target === index) return current;
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return next;
    });
    invalidateOutput();
  };

  const reset = () => {
    setItems((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.preview));
      return [];
    });
    setGenerated(null);
    setCompressed(null);
    setCompressMessage(null);
    setError(null);
    setProgress({ value: 0, label: "" });
    setWarnLarge(false);
    setStep(1);
  };

  /**
   * Decodes every image and returns PDF-ready bytes, in list order.
   * Shared by the first build and by the compression pass.
   */
  const encodeItems = async (profile: EncodeProfile): Promise<PdfImage[]> => {
    const list = items;
    const pagesOut: PdfImage[] = [];
    for (let index = 0; index < list.length; index += 1) {
      const item = list[index];
      setProgress({
        value: 0.05 + (index / list.length) * 0.85,
        label: `Preparing ${item.file.name} (${index + 1} of ${list.length})`,
      });

      const extension = item.file.name.split(".").pop()?.toLowerCase() ?? "";
      const direct = profile.jpeg === null && (extension === "jpg" || extension === "jpeg" || extension === "png");

      if (direct) {
        const bytes = new Uint8Array(await item.file.arrayBuffer());
        const decoded = await decodeImage(item.file);
        pagesOut.push({ bytes, kind: extension === "png" ? "png" : "jpg", width: decoded.width, height: decoded.height });
        decoded.release();
        continue;
      }

      const decoded = await decodeImage(item.file);
      let width = decoded.width;
      let height = decoded.height;
      if (Math.max(width, height) > profile.maxEdge) {
        const fit = profile.maxEdge / Math.max(width, height);
        width = Math.round(width * fit);
        height = Math.round(height * fit);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Canvas is not available in this browser.");
      // Transparent PNGs are flattened onto white here, the same background the
      // page shows behind them.
      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, width, height);
      context.imageSmoothingQuality = "high";
      context.drawImage(decoded.bitmap, 0, 0, width, height);
      decoded.release();

      const asJpeg = profile.jpeg !== null;
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, asJpeg ? "image/jpeg" : "image/png", asJpeg ? profile.jpeg! / 100 : undefined),
      );
      canvas.width = 0;
      canvas.height = 0;
      if (!blob) throw new Error("This image could not be encoded.");
      pagesOut.push({ bytes: new Uint8Array(await blob.arrayBuffer()), kind: asJpeg ? "jpg" : "png", width, height });
    }
    return pagesOut;
  };

  const buildPdf = async () => {
    if (!items.length) return;
    setBusy(true);
    setError(null);
    setCompressed(null);
    setCompressMessage(null);
    try {
      const profile: EncodeProfile =
        qualityMode === "smaller" ? { maxEdge: MAX_EDGE, jpeg: quality } : { maxEdge: MAX_EDGE, jpeg: null };
      const encoded = await encodeItems(profile);

      setProgress({ value: 0.92, label: "Writing the PDF" });
      const bytes = await buildImagePdfFromPages(chunk(encoded, perPage), {
        pageSize,
        orientation,
        marginMm: Number(margin),
      });

      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      const first = items[0].file;
      const baseName = items.length === 1 ? first.name : `${fileBaseName(first.name)}-and-${items.length - 1}-more`;
      const name = outputName(baseName, "", "pdf");

      setGenerated({
        blob,
        name,
        size: blob.size,
        pages: pages.length,
        images: items.length,
        sourceBytes,
      });
      setProgress({ value: 1, label: "Done" });
      setStep(4);
      track("tool_completed", { tool: "image-to-pdf", pages: pages.length, size: sizeBucket(blob.size) });
    } catch (caught) {
      setError(describeImageError(caught));
    } finally {
      setBusy(false);
    }
  };

  /**
   * Compression re-encodes the pictures that are already in memory rather than
   * rasterising the finished PDF: the document is photographs end to end, so
   * this is both faster and better quality than rendering the pages again.
   *
   * If the result is not actually smaller, we say so and keep the original
   * instead of handing over a bigger file with a "compressed" label.
   */
  const compress = async (level: CompressLevel) => {
    if (!generated) return;
    const profile = COMPRESS_PROFILES[level];
    setCompressing(level);
    setError(null);
    setCompressMessage(null);
    setCompressed(null);
    try {
      setProgress({ value: 0.02, label: `Re-encoding at ${profile.maxEdge} px` });
      const encoded = await encodeItems({ maxEdge: profile.maxEdge, jpeg: profile.jpeg });
      const bytes = await buildImagePdfFromPages(chunk(encoded, perPage), {
        pageSize,
        orientation,
        marginMm: Number(margin),
      });
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      if (blob.size >= generated.size) {
        setCompressMessage(
          `Re-encoding at ${profile.maxEdge} px did not make the file smaller than ${formatBytes(
            generated.size,
          )}, so the original is kept — compressing a PDF that is already lean only adds noise.`,
        );
        setProgress({ value: 1, label: "" });
        return;
      }
      setCompressed({
        blob,
        size: blob.size,
        level,
        note: `Pictures re-encoded as JPEG ${profile.jpeg} % with a ${profile.maxEdge} px long edge.`,
      });
      setProgress({ value: 1, label: "" });
      track("tool_completed", { tool: "image-to-pdf", compressed: level, size: sizeBucket(blob.size) });
    } catch (caught) {
      setError(describeImageError(caught));
    } finally {
      setCompressing(null);
    }
  };

  const download = () => {
    if (!generated) return;
    if (compressed) {
      downloadBlob(compressed.blob, outputName(fileBaseName(generated.name), "compressed", "pdf"));
    } else {
      downloadBlob(generated.blob, generated.name);
    }
  };

  // Removing every image sends you back to the start, and the download step
  // only exists while a PDF is in memory.
  const activeStep: Step = items.length === 0 ? 1 : generated ? step : (Math.min(step, 3) as Step);

  /* ── shared bits ──────────────────────────────────────────────────────── */

  const stepper = (
    <ol className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1.5" aria-label="Steps">
      {STEPS.map((entry, index) => {
        const done = entry.n < activeStep;
        const current = entry.n === activeStep;
        const reachable = entry.n < activeStep && !busy;
        return (
          <li key={entry.n} className="flex items-center gap-2">
            <button
              type="button"
              disabled={!reachable}
              onClick={() => reachable && setStep(entry.n)}
              aria-current={current ? "step" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition-colors",
                current && "border-primary/45 bg-primary/10 text-brand-700",
                done && "border-line bg-raised text-body hover:border-primary/35",
                !current && !done && "border-line/60 bg-transparent text-subtle",
              )}
            >
              <span
                className={cn(
                  "grid h-4 w-4 place-items-center rounded-full text-[9.5px] font-bold",
                  current ? "bg-primary text-white" : done ? "bg-success/15 text-success" : "bg-line/50 text-subtle",
                )}
                aria-hidden="true"
              >
                {done ? <Check className="h-2.5 w-2.5" /> : entry.n}
              </span>
              {entry.label}
            </button>
            {index < STEPS.length - 1 && <span className="h-px w-3 bg-line" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );

  const backButton = (target: Step, label: string) => (
    <button type="button" onClick={() => setStep(target)} disabled={busy} className="btn-secondary">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );

  /* ── step 1: add images ───────────────────────────────────────────────── */

  if (activeStep === 1) {
    return (
      <ToolFrame labelledBy="tool-title">
        {stepper}
        <Dropzone
          accept={inputPreset?.accept ?? ACCEPT_IMAGE}
          acceptedLabel={inputPreset ? `${inputPreset.label} only` : "JPG, PNG, WebP, HEIC, GIF, BMP"}
          extensions={inputPreset ? [...inputPreset.extensions] : INPUT_EXTENSIONS}
          onFiles={addFiles}
          maxSizeMb={150}
          title={items.length ? "Add more images" : "Drop images here or click to choose"}
          subtitle="JPG, PNG, WebP, HEIC, GIF, BMP, TIFF · up to 150 MB per file · paste with ⌘V"
        />

        {warnLarge && (
          <Notice tone="warning" className="mt-4">
            These images add up to more than 100 MB. On a phone this can run out of memory — consider converting them
            in smaller batches.
          </Notice>
        )}

        {items.length > 0 ? (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5">
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink">
                <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                {items.length} image{items.length === 1 ? "" : "s"} ready
              </span>
              <span className="text-[12px] text-subtle">
                {formatBytes(sourceBytes)} · {pages.length} page{pages.length === 1 ? "" : "s"} at {perPage} per page
              </span>
              <div className="ml-auto flex items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-line bg-raised px-2.5 py-1.5 text-[12px] font-semibold text-body hover:border-primary/40">
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Add more
                  <input
                    type="file"
                    multiple
                    accept={inputPreset?.accept ?? ACCEPT_IMAGE}
                    className="sr-only"
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? []);
                      if (files.length) addFiles(files);
                      event.target.value = "";
                    }}
                  />
                </label>
                <button type="button" onClick={() => setStep(2)} className="btn-primary min-h-[38px] px-3.5 text-[13.5px]">
                  Arrange pages
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4" aria-label="Added images">
              {items.map((item, index) => (
                <li key={item.id} className="flex items-center gap-2 rounded-lg border border-line bg-raised p-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.preview}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-medium text-ink">{item.file.name}</span>
                    <span className="text-[10.5px] text-subtle">
                      Page {Math.floor(index / perPage) + 1} · {formatBytes(item.file.size)}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded text-subtle hover:bg-danger/5 hover:text-danger"
                    aria-label={`Remove ${item.file.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-surface px-4 py-3 text-center text-[12.5px] text-subtle">
            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
            Step 1 add images · Step 2 arrange the pages · Step 3 create the PDF · Step 4 check the size and download.
          </p>
        )}
      </ToolFrame>
    );
  }

  /* ── step 2: arrange ──────────────────────────────────────────────────── */

  if (activeStep === 2) {
    return (
      <ToolFrame labelledBy="tool-title">
        {stepper}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[13.5px] font-semibold text-ink">Arrange the images on the pages</p>
            <p className="mt-0.5 text-[12px] text-subtle">
              The order below is the page order. Drag a picture, or use the arrows, to move it — including onto
              another page.
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-line bg-raised px-2.5 py-1.5 text-[12px] font-semibold text-body hover:border-primary/40">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Add more
            <input
              type="file"
              multiple
              accept={inputPreset?.accept ?? ACCEPT_IMAGE}
              className="sr-only"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                if (files.length) addFiles(files);
                event.target.value = "";
              }}
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="Images per page">
          {PER_PAGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={perPage === option.value}
              title={option.hint}
              onClick={() => {
                setPerPage(option.value);
                invalidateOutput();
              }}
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold transition-colors",
                perPage === option.value
                  ? "border-primary/45 bg-primary/10 text-brand-700"
                  : "border-line bg-raised text-body hover:border-primary/30",
              )}
            >
              {option.label}
            </button>
          ))}
          <span className="ml-1 text-[11.5px] text-subtle">{PER_PAGE_OPTIONS.find((o) => o.value === perPage)?.hint}</span>
        </div>

        <ol className="mt-4 space-y-2" aria-label="Pages">
          {pages.map((group, pageIndex) => (
            <li key={pageIndex} className="rounded-xl border border-line bg-surface p-2.5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[12.5px] font-semibold text-ink">
                  Page {pageIndex + 1}
                  <span className="ml-2 font-normal text-subtle">
                    {group.length} image{group.length === 1 ? "" : "s"}
                  </span>
                </p>
              </div>
              <ul className="flex flex-wrap gap-2">
                {group.map((item) => {
                  const index = items.findIndex((entry) => entry.id === item.id);
                  return (
                    <li
                      key={item.id}
                      draggable
                      onDragStart={() => {
                        dragId.current = item.id;
                      }}
                      onDragEnd={() => {
                        dragId.current = null;
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        const from = items.findIndex((entry) => entry.id === dragId.current);
                        dragId.current = null;
                        if (from === -1 || from === index) return;
                        moveItem(from, index);
                      }}
                      className="group flex w-full items-center gap-2 rounded-lg border border-line bg-raised p-1.5 sm:w-[248px]"
                    >
                      <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-line" aria-hidden="true" />
                      <span className="w-4 shrink-0 text-center text-[11px] font-semibold text-subtle">{index + 1}</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.preview}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded border border-line object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] font-medium text-ink">{item.file.name}</span>
                        <span className="text-[10.5px] text-subtle">{formatBytes(item.file.size)}</span>
                      </span>
                      <span className="flex shrink-0 flex-col">
                        <button
                          type="button"
                          onClick={() => moveItem(index, index - 1)}
                          disabled={index === 0}
                          className="grid h-5 w-6 place-items-center rounded text-subtle hover:bg-surface hover:text-ink disabled:opacity-30"
                          aria-label={`Move ${item.file.name} earlier`}
                        >
                          <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItem(index, index + 1)}
                          disabled={index === items.length - 1}
                          className="grid h-5 w-6 place-items-center rounded text-subtle hover:bg-surface hover:text-ink disabled:opacity-30"
                          aria-label={`Move ${item.file.name} later`}
                        >
                          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded text-subtle hover:bg-danger/5 hover:text-danger"
                        aria-label={`Remove ${item.file.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>

        {error && (
          <Notice tone="danger" className="mt-4" onDismiss={() => setError(null)}>
            {error}
          </Notice>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {backButton(1, "Back to images")}
          <button type="button" onClick={() => setStep(3)} className="btn-primary">
            Continue
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <p className="text-[12px] text-subtle">
            {items.length} image{items.length === 1 ? "" : "s"} → {pages.length} page{pages.length === 1 ? "" : "s"}
          </p>
        </div>
      </ToolFrame>
    );
  }

  /* ── step 3: page setup and create ────────────────────────────────────── */

  if (activeStep === 3) {
    return (
      <ToolFrame labelledBy="tool-title">
        {stepper}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Page size" htmlFor="i2p-page">
            <select
              id="i2p-page"
              className={selectClass}
              value={pageSize}
              onChange={(event) => {
                setPageSize(event.target.value as PageSize);
                invalidateOutput();
              }}
            >
              <option value="a4">A4 (210 × 297 mm)</option>
              <option value="letter">US Letter (8.5 × 11 in)</option>
              <option value="a5">A5 (148 × 210 mm)</option>
              <option value="fit">Fit to image</option>
            </select>
          </Field>

          <Field
            label="Orientation"
            htmlFor="i2p-orientation"
            hint={pageSize === "fit" ? "Ignored when fitting to the image" : undefined}
          >
            <select
              id="i2p-orientation"
              className={selectClass}
              value={orientation}
              onChange={(event) => {
                setOrientation(event.target.value as Orientation);
                invalidateOutput();
              }}
              disabled={pageSize === "fit"}
            >
              <option value="auto">Match each image</option>
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </Field>

          <Field label="Margin" htmlFor="i2p-margin">
            <select
              id="i2p-margin"
              className={selectClass}
              value={margin}
              onChange={(event) => {
                setMargin(event.target.value);
                invalidateOutput();
              }}
            >
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
              onChange={(event) => {
                setQualityMode(event.target.value as QualityMode);
                invalidateOutput();
              }}
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
              onChange={(event) => {
                setQuality(Number(event.target.value));
                invalidateOutput();
              }}
              className="mt-2 w-full accent-brand-500"
            />
            <p className="mt-1 text-[11.5px] text-subtle">
              Lower quality makes a smaller file. Photos stay sharp down to about 75.
            </p>
          </div>
        )}

        <div className="mt-4 rounded-xl border border-line bg-surface px-3 py-2.5 text-[12.5px] text-body">
          <p className="font-semibold text-ink">Ready to build</p>
          <p className="mt-0.5 text-subtle">
            {items.length} image{items.length === 1 ? "" : "s"} · {pages.length} page{pages.length === 1 ? "" : "s"} at{" "}
            {perPage} per page · {formatBytes(sourceBytes)} of sources
          </p>
        </div>

        {warnLarge && (
          <Notice tone="warning" className="mt-4">
            These images add up to more than 100 MB. On a phone this can run out of memory — consider converting them in
            smaller batches.
          </Notice>
        )}

        {error && (
          <Notice tone="danger" className="mt-4" onDismiss={() => setError(null)}>
            {error}
          </Notice>
        )}

        {busy && <ProgressBar value={progress.value} label={progress.label || "Working…"} />}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {backButton(2, "Back to arranging")}
          <button type="button" onClick={buildPdf} disabled={busy || !items.length} className="btn-primary w-full sm:w-auto">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Wand2 className="h-4 w-4" aria-hidden="true" />}
            {busy ? "Building the PDF…" : `Create PDF (${pages.length} page${pages.length === 1 ? "" : "s"})`}
          </button>
          <p className="inline-flex items-center gap-1.5 text-[12.5px] text-subtle">
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            Nothing is uploaded while this runs.
          </p>
        </div>
      </ToolFrame>
    );
  }

  /* ── step 4: size, compression and download ───────────────────────────── */

  if (!generated) return null;

  const finalSize = compressed?.size ?? generated.size;
  const saved = compressed ? percentSaved(generated.size, compressed.size) : 0;
  const finalName = compressed ? outputName(fileBaseName(generated.name), "compressed", "pdf") : generated.name;

  return (
    <ToolFrame labelledBy="tool-title">
      {stepper}

      <div role="status" aria-live="polite" className="animate-fade-up rounded-xl border border-success/20 bg-success/5 px-4 py-3">
        <p className="inline-flex items-center gap-2 text-[14px] font-semibold text-success">
          <Check className="h-4 w-4" aria-hidden="true" />
          Your PDF is ready
        </p>
        <p className="mt-1 text-[13px] text-body">
          <span className="font-semibold text-ink">{generated.name}</span> is{" "}
          <span className="font-semibold text-ink">{formatBytes(finalSize)}</span> — {generated.pages} page
          {generated.pages === 1 ? "" : "s"} from {generated.images} image{generated.images === 1 ? "" : "s"}.
          {compressed && (
            <>
              {" "}
              The original was {formatBytes(generated.size)}.
            </>
          )}
        </p>
      </div>

      {/* Compression offer */}
      <div className="mt-3 rounded-xl border border-line bg-surface p-3">
        <p className="text-[13px] font-semibold text-ink">Do you want a smaller file?</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-subtle">
          The pictures are re-encoded at a smaller size — nothing else changes, because this PDF is made of images.
          Leave it alone if the file already fits where you are sending it.
        </p>

        <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
          {(Object.keys(COMPRESS_PROFILES) as CompressLevel[]).map((level) => {
            const profile = COMPRESS_PROFILES[level];
            const active = compressed?.level === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => compress(level)}
                disabled={Boolean(compressing) || busy}
                aria-pressed={active}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left transition-colors",
                  active
                    ? "border-primary/45 bg-primary/10"
                    : "border-line bg-raised hover:border-primary/35 disabled:opacity-50",
                )}
              >
                <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink">
                  {compressing === level ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Minus className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
                  )}
                  Compress — {profile.label}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-subtle">{profile.hint}</span>
              </button>
            );
          })}
        </div>

        {compressing && <ProgressBar value={progress.value} label={progress.label || "Compressing…"} />}

        {compressed && (
          <div role="status" aria-live="polite" className="mt-3 rounded-lg border border-success/25 bg-success/5 px-3 py-2">
            <p className="text-[12.5px] font-semibold text-success">
              {formatBytes(generated.size)} → {formatBytes(compressed.size)} · {saved}% smaller
            </p>
            <p className="mt-0.5 text-[11.5px] text-subtle">{compressed.note} Open it once and check the small print.</p>
          </div>
        )}

        {compressMessage && (
          <p role="status" aria-live="polite" className="mt-3 rounded-lg border border-warning/25 bg-warning/5 px-3 py-2 text-[11.5px] leading-relaxed text-body">
            {compressMessage}
          </p>
        )}

        {error && (
          <Notice tone="danger" className="mt-3" onDismiss={() => setError(null)}>
            {error}
          </Notice>
        )}

        <p className="mt-2.5 text-[11.5px] text-subtle">
          Happy with {formatBytes(generated.size)}? Skip compression and use Download below — the offer is optional.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={download} className="btn-primary w-full sm:w-auto">
          <Download className="h-4 w-4" aria-hidden="true" />
          {compressed ? `Download compressed (${formatBytes(finalSize)})` : `Download PDF (${formatBytes(finalSize)})`}
        </button>
        {compressed && (
          <button
            type="button"
            onClick={() => downloadBlob(generated.blob, generated.name)}
            className="btn-secondary"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Keep the original ({formatBytes(generated.size)})
          </button>
        )}
        <button type="button" onClick={() => setStep(2)} className="btn-secondary">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Change the pages
        </button>
        <button type="button" onClick={reset} className="btn-secondary">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Start over
        </button>
      </div>

      <p className="mt-3 text-[11.5px] leading-relaxed text-subtle">
        Saved as <span className="font-medium text-body">{finalName}</span>. Open it once before sending — check that
        the page order matches the document you photographed and that the smallest text is still readable.
      </p>
    </ToolFrame>
  );
}
