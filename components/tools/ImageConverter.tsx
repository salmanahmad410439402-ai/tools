"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ImageIcon, Loader2, Repeat2, Trash2 } from "lucide-react";
import {
  ACCEPT_IMAGE,
  INPUT_EXTENSIONS,
  OUTPUT_FORMATS,
  canEncode,
  describeImageError,
  encodeCanvas,
  renderToCanvas,
  verifyEncoded,
  type OutputFormat,
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
  /** Human label for the input format, e.g. "JPG". */
  input: string;
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

const FORMAT_GROUPS = ["Popular", "Graphics & icons", "Print & documents", "Developer"] as const;

/** Formats every current browser can show in an <img>; the rest get a file icon. */
const PREVIEWABLE = new Set<OutputMime>(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/svg+xml", "image/bmp"]);

const EXTENSION_LABELS: Record<string, string> = {
  jpg: "JPG",
  jpeg: "JPG",
  jpe: "JPG",
  png: "PNG",
  webp: "WebP",
  avif: "AVIF",
  gif: "GIF",
  bmp: "BMP",
  tif: "TIFF",
  tiff: "TIFF",
  svg: "SVG",
  heic: "HEIC",
  heif: "HEIC",
  ico: "ICO",
};

/** What the user actually handed us, so the queue can show "JPG → PNG". */
function inputFormatLabel(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (EXTENSION_LABELS[ext]) return EXTENSION_LABELS[ext];
  const subtype = file.type.split("/")[1];
  return subtype ? subtype.toUpperCase() : "Image";
}

/** Formats the browser writes itself; everything else uses the bundled encoders. */
const lossyNote = (format: OutputFormat) =>
  format.mime === "image/gif"
    ? "Single frame, 216-colour palette — transparency is flattened."
    : format.mime === "image/tiff"
      ? "Uncompressed RGB TIFF, one strip."
      : format.mime === "image/bmp"
        ? "Uncompressed BMP — expect a large file."
        : format.mime === "image/x-icon"
          ? "ICO with 16, 32, 48 and 256 px frames."
          : format.mime === "image/svg+xml"
            ? "PNG embedded in an SVG wrapper — not vectorised."
            : format.mime === "application/pdf"
              ? "One page, sized to the image."
              : format.mime === "image/x-portable-pixmap"
                ? "Uncompressed Netpbm P6."
                : undefined;

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

  const addFiles = useCallback(
    (files: File[]) => {
      setError(null);
      const next = files.map((file) => ({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        preview: createUrl(file),
        input: inputFormatLabel(file),
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

  const activeFormat = OUTPUT_FORMATS.find((entry) => entry.mime === format)!;
  const formatUnavailable = activeFormat.native && unsupported.includes(activeFormat.mime);
  const alreadyThatFormat = items.length > 0 && items.every((item) => item.input === activeFormat.label);

  const grouped = useMemo(
    () =>
      FORMAT_GROUPS.map((group) => ({
        group,
        formats: OUTPUT_FORMATS.filter((entry) => entry.group === group),
      })).filter((entry) => entry.formats.length > 0),
    [],
  );

  /** Back to the format picker without losing the images already loaded. */
  const changeFormat = () => {
    revokeResults(results);
    setResults([]);
    setProgress({ value: 0, label: "" });
  };

  const convert = async () => {
    if (!items.length) return;
    setBusy(true);
    setError(null);
    setResults([]);
    const output: ResultFile[] = [];
    const failures: string[] = [];

    try {
      const edge = Number(maxEdge);
      const keepAlpha = activeFormat.alpha;

      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        setProgress({
          value: index / items.length,
          label: `Converting ${item.file.name} (${index + 1} of ${items.length})`,
        });

        try {
          const rendered = await renderToCanvas(item.file, {
            maxEdge: edge > 0 ? edge : 0,
            background,
            alpha: keepAlpha,
          });
          const { canvas, sourceWidth, sourceHeight } = rendered;
          const width = canvas.width;
          const height = canvas.height;
          const blob = await encodeCanvas(canvas, format, quality / 100);
          canvas.width = 0;
          canvas.height = 0;

          const scaledNote =
            sourceWidth !== width || sourceHeight !== height
              ? `Scaled from ${sourceWidth} × ${sourceHeight}${edge > 0 ? ` to ${width} × ${height}` : " to fit browser canvas limits"}.`
              : undefined;

          // Re-read what we just produced: a filename is not proof of a format.
          const check = await verifyEncoded(blob, format, { width, height });
          if (!check.ok) {
            failures.push(`${item.file.name}: ${check.detail}`);
            continue;
          }

          const sameExtension = item.input === activeFormat.label;
          output.push({
            id: item.id,
            name: outputName(item.file.name, sameExtension ? "converted" : "", activeFormat.extension),
            blob,
            size: blob.size,
            originalSize: item.file.size,
            originalName: item.file.name,
            note: [lossyNote(activeFormat), scaledNote, `Verified: ${check.detail}`].filter(Boolean).join(" "),
            previewUrl: index < 12 && PREVIEWABLE.has(activeFormat.mime) ? createUrl(blob) : undefined,
          });
        } catch (caught) {
          failures.push(`${item.file.name}: ${describeImageError(caught)}`);
        }
      }

      if (!output.length) {
        setError(failures[0] ?? "None of the images could be converted to this format.");
        return;
      }

      setResults(output);
      setProgress({ value: 1, label: "Done" });
      if (failures.length) setError(`${failures.length} file(s) could not be converted. ${failures[0]}`);
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
          heading={`${results.length} image${results.length === 1 ? "" : "s"} converted to ${activeFormat.label}`}
          compare="conversion"
          zipName={`filecraft-${activeFormat.label.toLowerCase()}-images.zip`}
          extra={
            <>
              {activeFormat.lossy ? (
                <p className="rounded-lg bg-surface px-3 py-2 text-[12.5px] text-subtle">
                  {activeFormat.label} is a lossy format, so re-saving the result again will lose a little more
                  detail. Keep the original if you may need it again.
                </p>
              ) : null}
              <button type="button" onClick={changeFormat} className="btn-secondary mt-3 min-h-[40px]">
                <Repeat2 className="h-4 w-4" aria-hidden="true" />
                Convert these again to another format
              </button>
            </>
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
                  <span className="text-[11px] text-subtle">
                    {formatBytes(item.file.size)} ·{" "}
                    <span className="font-semibold text-body">
                      {item.input} → {activeFormat.label}
                    </span>
                  </span>
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
            <fieldset className="mt-5 rounded-xl border border-line bg-surface/60 p-3">
              <legend className="px-1 text-[12.5px] font-semibold text-ink">
                Convert to — choose the output format
              </legend>
              <div className="mt-1 space-y-3">
                {grouped.map(({ group, formats }) => (
                  <div key={group}>
                    <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-subtle">{group}</p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                      {formats.map((entry) => {
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
                              "flex min-h-[58px] flex-col items-center justify-center rounded-xl border bg-raised text-[13.5px] font-bold transition-colors",
                              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/25",
                              active
                                ? "border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500"
                                : "border-line text-body hover:border-primary/40",
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
                  </div>
                ))}
              </div>
              <p className="mt-2.5 text-[11.5px] leading-relaxed text-subtle">{activeFormat.hint}</p>
            </fieldset>
          )}

          {presetFormat && (
            <Notice tone="info" className="mt-4">
              This page is set to <strong className="font-semibold">{activeFormat.label}</strong> output. Need a
              different format? The{" "}
              <a href="/image-converter/" className="link">
                full image converter
              </a>{" "}
              handles JPG, PNG, WebP, AVIF, GIF, BMP, TIFF, ICO, PDF, SVG and PPM.
            </Notice>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {(activeFormat.lossy || activeFormat.mime === "application/pdf") && (
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
                <p className="mt-1 text-[11.5px] text-subtle">
                  {activeFormat.mime === "application/pdf"
                    ? "Controls the JPEG quality inside the PDF."
                    : "85–95 for keeping, 70–80 for the web."}
                </p>
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

            {activeFormat.alpha ? (
              <div className="rounded-xl border border-line bg-raised p-3 text-[12.5px] leading-relaxed text-body sm:col-span-1">
                <p className="font-semibold text-ink">Transparency is kept</p>
                <p className="mt-0.5 text-subtle">
                  {activeFormat.label} supports an alpha channel, so transparent pixels stay transparent instead of
                  being filled with a colour.
                </p>
              </div>
            ) : (
              <Field
                label="Background for transparent areas"
                htmlFor="ic-background"
                hint={`${activeFormat.label} has no alpha channel, so transparency is filled with this colour.`}
              >
                <div className="flex items-center gap-2">
                  <input
                    id="ic-background"
                    type="color"
                    value={background}
                    onChange={(event) => setBackground(event.target.value)}
                    className="h-11 w-14 cursor-pointer rounded-lg border border-line bg-raised p-1"
                  />
                  <span className="font-mono text-[12.5px] uppercase text-subtle">{background}</span>
                </div>
              </Field>
            )}
          </div>

          {alreadyThatFormat && (
            <Notice tone="warning" className="mt-3">
              Every file is already {activeFormat.label}. Converting to the same format only re-encodes it — pick a
              different target, or keep the originals.
            </Notice>
          )}

          {format === "image/avif" && (
            <Notice tone="info" className="mt-3">
              AVIF produces the smallest files but is the slowest to encode. A batch of large photos can take a
              while — the progress bar is honest about it.
            </Notice>
          )}

          {activeFormat.mime === "image/x-icon" && (
            <Notice tone="info" className="mt-3">
              ICO output is a square icon with 16, 32, 48 and 256 px frames. Each frame is centre-cropped from the
              middle of your image rather than squashed, so keep the subject near the centre.
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
                  : `Convert ${items.length > 1 ? `${items.length} images` : "to"} ${activeFormat.label}`}
            </button>
            <p className="inline-flex items-center gap-1.5 text-[12.5px] text-subtle">
              <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Conversion happens on your device.
            </p>
          </div>

          <p className="mt-2 inline-flex items-start gap-1.5 text-[11.5px] leading-relaxed text-subtle">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />
            Every result is re-opened and checked before it reaches you, so a file that claims to be{" "}
            {activeFormat.label} really is.
          </p>
        </>
      )}

      {items.length === 0 && (
        <p className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-surface px-4 py-3 text-[12.5px] text-subtle">
          <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
          {presetFormat
            ? "JPG files are decoded and re-encoded locally."
            : "Pick a target format after you add images — JPG, PNG, WebP, AVIF, GIF, BMP, TIFF, ICO, PDF, SVG or PPM."}
        </p>
      )}
    </ToolFrame>
  );
}
