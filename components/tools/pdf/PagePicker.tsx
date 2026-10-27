"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Eye, Loader2, Scissors, Trash2 } from "lucide-react";
import { extractPages, rebuildPdf } from "@/lib/pdf/ops";
import { formatPageList, parsePageRanges } from "@/lib/pdf/core";
import { track, sizeBucket } from "@/lib/analytics";
import { revokeResults, type ResultFile } from "@/lib/download";
import { fileBaseName, outputName, cn } from "@/lib/utils";
import { Field, inputClass, Notice, ProgressBar, ResultsPanel, ToolFrame } from "../kit";
import { PdfSource, usePdfInfo } from "./PdfSource";
import { usePageThumbs } from "./usePageThumbs";

export type PageMode = "remove" | "extract";

/**
 * One widget, two jobs: mark the pages to delete, or mark the pages to keep.
 * Thumbnails for the common case, a range box for documents too long to click.
 */
export function PagePicker({ mode, toolSlug }: { mode: PageMode; toolSlug: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [ranges, setRanges] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultFile[]>([]);

  const info = usePdfInfo(file);
  const preview = usePageThumbs(file, { maxPages: 120, maxWidth: 220 });
  const removing = mode === "remove";

  useEffect(() => {
    setSelected(new Set());
    setRanges("");
  }, [file]);

  const pageCount = info.pages || preview.pageCount;
  const keptCount = removing ? pageCount - selected.size : selected.size;

  const toggle = (index: number) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const applyRanges = () => {
    if (!pageCount) return;
    try {
      const pages = parsePageRanges(ranges, pageCount);
      setSelected(new Set(pages));
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That page range could not be read.");
    }
  };

  const reset = () => {
    revokeResults(results);
    setResults([]);
    setFile(null);
    setSelected(new Set());
    setRanges("");
    setError(null);
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const bytes = await file.arrayBuffer();
      let output: Uint8Array;

      if (removing) {
        if (!selected.size) throw new Error("Click the pages you want to remove first.");
        if (keptCount < 1) throw new Error("At least one page has to stay in the document.");
        const edits = Array.from({ length: pageCount }, (_, index) => index)
          .filter((index) => !selected.has(index))
          .map((index) => ({ source: index, rotation: 0 }));
        output = await rebuildPdf(bytes, edits);
      } else {
        if (!selected.size) throw new Error("Click the pages you want to keep first.");
        output = await extractPages(bytes, Array.from(selected).sort((a, b) => a - b));
      }

      const blob = new Blob([output as unknown as BlobPart], { type: "application/pdf" });
      setResults([
        {
          id: "pages",
          name: outputName(fileBaseName(file.name), removing ? "pages-removed" : "pages", "pdf"),
          blob,
          size: blob.size,
          originalSize: file.size,
          note: removing
            ? `${selected.size} page${selected.size === 1 ? "" : "s"} removed · ${keptCount} kept`
            : `${keptCount} page${keptCount === 1 ? "" : "s"} extracted, in document order`,
        },
      ]);
      track("tool_completed", { tool: toolSlug, pages: keptCount, size: sizeBucket(blob.size) });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The PDF could not be written.");
    } finally {
      setBusy(false);
    }
  };

  if (results.length) {
    return (
      <ToolFrame labelledBy="tool-title">
        <ResultsPanel files={results} onReset={reset} heading="Your new PDF is ready" />
      </ToolFrame>
    );
  }

  return (
    <ToolFrame labelledBy="tool-title">
      <PdfSource
        file={file}
        onFile={(next) => {
          setFile(next);
          setError(null);
        }}
        onRemove={() => setFile(null)}
        title={removing ? "Drop the PDF whose pages you want to delete" : "Drop the PDF you want pages from"}
      />

      {file && (
        <>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <Field
              label="Or type the page numbers"
              htmlFor="page-ranges"
              hint="For example 2, 5-7 — then press Apply."
              className="min-w-[200px] flex-1"
            >
              <div className="flex gap-2">
                <input
                  id="page-ranges"
                  className={inputClass}
                  value={ranges}
                  onChange={(event) => setRanges(event.target.value)}
                  placeholder="1-3, 8"
                  inputMode="numeric"
                />
                <button type="button" onClick={applyRanges} className="btn-secondary min-h-[44px] shrink-0 px-3">
                  Apply
                </button>
              </div>
            </Field>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelected(new Set(Array.from({ length: pageCount }, (_, index) => index)))}
                className="btn-secondary min-h-[44px] px-3 text-[13px]"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                disabled={!selected.size}
                className="btn-secondary min-h-[44px] px-3 text-[13px]"
              >
                Clear
              </button>
            </div>
          </div>

          {preview.thumbs.length ? (
            <>
              <p className="mt-4 text-[12.5px] text-subtle">
                {removing
                  ? "Tap the pages you want to delete — they turn red."
                  : "Tap the pages you want to keep — they turn indigo."}
              </p>
              <ul
                className="mt-2 grid max-h-[520px] grid-cols-3 gap-2 overflow-y-auto rounded-xl border border-line bg-surface/60 p-2 sm:grid-cols-4 md:grid-cols-5"
                aria-label="Pages"
              >
                {preview.thumbs.map((thumb) => {
                  const active = selected.has(thumb.pageIndex);
                  return (
                    <li key={thumb.pageIndex}>
                      <button
                        type="button"
                        onClick={() => toggle(thumb.pageIndex)}
                        aria-pressed={active}
                        aria-label={`Page ${thumb.pageIndex + 1}${active ? ", selected" : ""}`}
                        className={cn(
                          "group relative block w-full overflow-hidden rounded-lg border-2 bg-raised transition-all",
                          active
                            ? removing
                              ? "border-danger shadow-sm"
                              : "border-brand-500 shadow-sm"
                            : "border-transparent hover:border-primary/50",
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumb.url}
                          alt=""
                          className="block w-full"
                          loading="lazy"
                          decoding="async"
                          draggable={false}
                        />
                        <span
                          className={cn(
                            "absolute inset-x-0 bottom-0 flex items-center justify-between px-1.5 py-1 text-[10.5px] font-semibold",
                            active
                              ? removing
                                ? "bg-danger text-white"
                                : "bg-brand-500 text-white"
                              : "bg-raised/90 text-body",
                          )}
                        >
                          {thumb.pageIndex + 1}
                          {active && <Check className="h-3 w-3" aria-hidden="true" />}
                        </span>
                      </button>
                    </li>
                  );
                })}
                {preview.truncated && (
                  <li className="col-span-full rounded-lg bg-raised px-3 py-2 text-[12px] text-subtle">
                    Showing the first {preview.thumbs.length} pages — use the page box above for the rest.
                  </li>
                )}
              </ul>
            </>
          ) : (
            <ProgressBar value={preview.progress} label="Rendering page thumbnails" />
          )}

          <p className="mt-3 text-[13px] font-medium text-body">
            {selected.size
              ? removing
                ? `Removing ${formatPageList(Array.from(selected))} · ${keptCount} of ${pageCount} pages stay`
                : `Keeping ${formatPageList(Array.from(selected))} · ${keptCount} of ${pageCount} pages`
              : "No pages selected yet."}
          </p>

          {info.error && <Notice tone="danger" className="mt-3">{info.error}</Notice>}
          {error && (
            <Notice tone="danger" className="mt-3" onDismiss={() => setError(null)}>
              {error}
            </Notice>
          )}
          {busy && <ProgressBar value={0.6} label="Writing the new PDF" />}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={run} disabled={busy || !selected.size} className="btn-primary w-full sm:w-auto">
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : removing ? (
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Scissors className="h-4 w-4" aria-hidden="true" />
              )}
              {busy ? "Working…" : removing ? "Remove pages and download" : "Extract pages and download"}
            </button>
            <p className="inline-flex items-center gap-1.5 text-[12.5px] text-subtle">
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              Other pages are copied untouched, not re-rendered.
            </p>
          </div>
        </>
      )}
    </ToolFrame>
  );
}
