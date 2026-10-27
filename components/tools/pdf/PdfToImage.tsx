"use client";

import { useState } from "react";
import { ImageDown, Loader2 } from "lucide-react";
import { parsePageRanges } from "@/lib/pdf/core";
import { pdfToImages } from "@/lib/pdf/render";
import { track, sizeBucket } from "@/lib/analytics";
import { makePreviewUrl, revokeResults, type ResultFile } from "@/lib/download";
import { fileBaseName, outputName } from "@/lib/utils";
import { Field, inputClass, Notice, ProgressBar, ResultsPanel, Segmented, ToolFrame, selectClass } from "../kit";
import { PdfSource, usePdfInfo } from "./PdfSource";

type Format = "jpg" | "png" | "webp";

export function PdfToImage({ presetFormat }: { presetFormat?: "jpg" | "png" | "webp" } = {}) {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<Format>(presetFormat ?? "jpg");
  const [dpi, setDpi] = useState("150");
  const [quality, setQuality] = useState(85);
  const [pages, setPages] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ value: 0, label: "" });
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultFile[]>([]);
  const info = usePdfInfo(file);

  const reset = () => {
    revokeResults(results);
    setResults([]);
    setFile(null);
    setPages("");
    setError(null);
    setProgress({ value: 0, label: "" });
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const selection = pages.trim() ? parsePageRanges(pages, info.pages) : undefined;
      const rendered = await pdfToImages(await file.arrayBuffer(), {
        format,
        dpi: Math.max(50, Math.min(400, Number(dpi) || 150)),
        quality,
        pages: selection,
        onProgress: (ratio, label) => setProgress({ value: ratio, label }),
      });

      const base = fileBaseName(file.name);
      const digits = String(info.pages || rendered.length).length;
      const output: ResultFile[] = rendered.map((item) => {
        const pageNumber = String(item.pageIndex + 1).padStart(Math.max(digits, 2), "0");
        return {
          id: `page-${item.pageIndex}`,
          name: outputName(`${base}-page-${pageNumber}`, "", format),
          blob: item.blob,
          size: item.blob.size,
          previewUrl: makePreviewUrl(item.blob),
          note: `Page ${item.pageIndex + 1} · ${dpi} DPI`,
        };
      });

      setResults(output);
      setProgress({ value: 1, label: "Done" });
      track("tool_completed", {
        tool: format === "png" ? "pdf-to-png" : format === "webp" ? "pdf-to-webp" : "pdf-to-jpg",
        format,
        pages: output.length,
        size: sizeBucket(output.reduce((sum, item) => sum + item.size, 0)),
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The pages could not be converted.");
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
          heading={`${results.length} image${results.length === 1 ? "" : "s"} ready`}
          zipName={`filecraft-${format}-pages.zip`}
          extra={
            <Notice tone="info" className="mt-3">
              Images are pictures of pages: text inside them is no longer selectable. Keep the PDF if you need
              searchable text.
            </Notice>
          }
        />
      </ToolFrame>
    );
  }

  return (
    <ToolFrame labelledBy="tool-title">
      <PdfSource file={file} onFile={(next) => { setFile(next); setError(null); }} onRemove={() => setFile(null)} />

      {file && (
        <>
          <div className="mt-5">
            <Segmented<Format>
              label="Image format"
              value={format}
              onChange={setFormat}
              options={[
                { value: "jpg", label: "JPG", hint: "Smallest files, photos and scans" },
                { value: "png", label: "PNG", hint: "Sharp text, line art, no artefacts" },
                { value: "webp", label: "WebP", hint: "Smallest page images for a website" },
              ]}
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Resolution" htmlFor="p2i-dpi" hint="72–96 screen · 150 presentations · 300 print">
              <select id="p2i-dpi" className={selectClass} value={dpi} onChange={(event) => setDpi(event.target.value)}>
                <option value="72">72 DPI — screen size</option>
                <option value="96">96 DPI — web</option>
                <option value="150">150 DPI — presentations</option>
                <option value="200">200 DPI — crisp on-screen text</option>
                <option value="300">300 DPI — print quality</option>
              </select>
            </Field>

            <Field label="Pages" htmlFor="p2i-pages" hint="Blank converts every page.">
              <input
                id="p2i-pages"
                className={inputClass}
                value={pages}
                onChange={(event) => setPages(event.target.value)}
                placeholder={`all ${info.pages || ""} pages`}
              />
            </Field>

            {format === "jpg" && (
              <div className="rounded-xl border border-line bg-surface p-3">
                <label htmlFor="p2i-quality" className="flex items-center justify-between text-[12.5px] font-semibold text-ink">
                  JPG quality
                  <span className="tabular-nums text-subtle">{quality}</span>
                </label>
                <input
                  id="p2i-quality"
                  type="range"
                  min={50}
                  max={100}
                  value={quality}
                  onChange={(event) => setQuality(Number(event.target.value))}
                  className="mt-2 w-full accent-brand-500"
                />
              </div>
            )}
          </div>

          {info.error && <Notice tone="danger" className="mt-4">{info.error}</Notice>}
          {error && (
            <Notice tone="danger" className="mt-4" onDismiss={() => setError(null)}>
              {error}
            </Notice>
          )}
          {busy && <ProgressBar value={progress.value} label={progress.label || "Rendering pages"} />}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={run} disabled={busy || Boolean(info.error)} className="btn-primary w-full sm:w-auto">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ImageDown className="h-4 w-4" aria-hidden="true" />}
              {busy ? "Converting…" : `Convert to ${format.toUpperCase()}`}
            </button>
            <p className="text-[12.5px] text-subtle">
              {info.pages ? `${info.pages} page${info.pages === 1 ? "" : "s"} · ` : ""}several pages download as a ZIP
            </p>
          </div>
        </>
      )}
    </ToolFrame>
  );
}
