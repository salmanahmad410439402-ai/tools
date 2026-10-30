"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, LayoutGrid, Loader2, RotateCw, Trash2, Undo2 } from "lucide-react";
import { rebuildPdf, type PageEdit } from "@/lib/pdf/ops";
import { track, sizeBucket } from "@/lib/analytics";
import { revokeResults, type ResultFile } from "@/lib/download";
import { cn, fileBaseName, formatBytes, outputName } from "@/lib/utils";
import { Dropzone, Notice, ProgressBar, ResultsPanel, ToolFrame } from "../kit";
import { usePageThumbs } from "./usePageThumbs";
import { useAutoFocus } from "@/components/ToolFocusShell";

interface Entry extends PageEdit {
  key: string;
  url: string;
  aspect: number;
  pageNumber: number;
}

export function OrganizePdf() {
  const [file, setFile] = useState<File | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ value: 0, label: "" });
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultFile[]>([]);
  const dragKey = useRef<string | null>(null);
  const thumbs = usePageThumbs(file);
  // A page being open is the cue to give the preview the whole width.
  useAutoFocus(Boolean(file));

  // Build the working list whenever thumbnails finish rendering.
  const [builtFor, setBuiltFor] = useState<File | null>(null);
  useEffect(() => {
    if (!file || builtFor === file || thumbs.loading || !thumbs.thumbs.length) return;
    setBuiltFor(file);
    setEntries(
      thumbs.thumbs.map((thumb) => ({
        key: `p-${thumb.pageIndex}`,
        source: thumb.pageIndex,
        rotation: 0,
        url: thumb.url,
        aspect: thumb.aspect,
        pageNumber: thumb.pageIndex + 1,
      })),
    );
  }, [file, builtFor, thumbs.loading, thumbs.thumbs]);

  const addFiles = useCallback((files: File[]) => {
    setError(null);
    setResults([]);
    setFile(files[0]);
    setEntries([]);
    setBuiltFor(null);
    track("tool_started", { tool: "organize-pdf" });
  }, []);

  const reset = () => {
    revokeResults(results);
    setResults([]);
    setFile(null);
    setEntries([]);
    setBuiltFor(null);
    setError(null);
  };

  const moveEntry = (from: number, to: number) => {
    setEntries((current) => {
      if (from === to) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const run = async () => {
    if (!file || !entries.length) return;
    setBusy(true);
    setError(null);
    try {
      setProgress({ value: 0.2, label: "Rebuilding the document" });
      const bytes = await rebuildPdf(
        await file.arrayBuffer(),
        entries.map((entry) => ({ source: entry.source, rotation: entry.rotation })),
      );
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      setResults([
        {
          id: "organized",
          name: outputName(fileBaseName(file.name), "organized", "pdf"),
          blob,
          size: blob.size,
          originalSize: file.size,
          note: `${entries.length} page${entries.length === 1 ? "" : "s"} kept in the new order`,
        },
      ]);
      setProgress({ value: 1, label: "Done" });
      track("tool_completed", { tool: "organize-pdf", pages: entries.length, size: sizeBucket(blob.size) });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The document could not be rebuilt.");
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
          heading="Your reordered PDF is ready"
          extra={
            <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-[12.5px] text-subtle">
              Check the first and last page in your viewer — that is where a deleted or duplicated page shows up first.
            </p>
          }
        />
      </ToolFrame>
    );
  }

  return (
    <ToolFrame labelledBy="tool-title">
      {!file ? (
        <Dropzone
          accept="application/pdf,.pdf"
          acceptedLabel="PDF"
          extensions={["pdf"]}
          onFiles={addFiles}
          multiple={false}
          maxSizeMb={200}
          title="Drop your PDF here or click to choose"
          subtitle="PDF only · up to 200 MB · thumbnails are rendered locally"
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                <FileText className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-semibold text-ink">{file.name}</p>
                <p className="text-[11.5px] text-subtle">
                  {formatBytes(file.size)}
                  {thumbs.pageCount ? ` · ${thumbs.pageCount} pages` : ""} · {entries.length} kept
                </p>
              </div>
            </div>
            <button type="button" onClick={() => setFile(null)} className="text-[12px] font-medium text-subtle hover:text-danger">
              Choose another file
            </button>
          </div>

          {thumbs.loading && <ProgressBar value={thumbs.progress} label="Rendering page thumbnails" />}
          {thumbs.error && <Notice tone="danger" className="mt-3">{thumbs.error}</Notice>}

          {entries.length > 0 && (
            <>
              <p className="mt-4 text-[12px] text-subtle">
                Drag pages to reorder, rotate with the arrow button, or delete with the bin. Original pages that you
                remove are not touched on disk.
              </p>
              <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-label="Pages in the new order">
                {entries.map((entry, index) => (
                  <li
                    key={entry.key}
                    draggable
                    onDragStart={() => {
                      dragKey.current = entry.key;
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      const fromKey = dragKey.current;
                      dragKey.current = null;
                      if (!fromKey) return;
                      const from = entries.findIndex((item) => item.key === fromKey);
                      if (from >= 0) moveEntry(from, index);
                    }}
                    className="group relative rounded-xl border border-line bg-raised p-2"
                  >
                    <div className="relative overflow-hidden rounded-lg bg-surface">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={entry.url}
                        alt={`Page ${entry.pageNumber}`}
                        className="mx-auto h-auto w-full transition-transform"
                        style={{ transform: `rotate(${entry.rotation}deg)` }}
                        loading="lazy"
                        decoding="async"
                      />
                      <span className="absolute left-1 top-1 rounded bg-scrim px-1.5 py-0.5 text-[10.5px] font-semibold text-white">
                        {index + 1}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-subtle">page {entry.pageNumber}</span>
                      <span className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            setEntries((current) =>
                              current.map((item) =>
                                item.key === entry.key ? { ...item, rotation: (item.rotation + 90) % 360 } : item,
                              ),
                            )
                          }
                          className="grid h-7 w-7 place-items-center rounded text-subtle hover:bg-surface hover:text-ink"
                          aria-label={`Rotate page ${entry.pageNumber} 90 degrees`}
                        >
                          <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEntries((current) => current.filter((item) => item.key !== entry.key))}
                          className="grid h-7 w-7 place-items-center rounded text-subtle hover:bg-danger/5 hover:text-danger"
                          aria-label={`Delete page ${entry.pageNumber}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEntries([]);
                    setBuiltFor(null);
                  }}
                  className="btn-secondary min-h-[40px] px-3 text-[13px]"
                >
                  <Undo2 className="h-4 w-4" aria-hidden="true" />
                  Reset to original order
                </button>
                <p className="text-[12px] text-subtle">Removed pages are only excluded from the new file.</p>
              </div>
            </>
          )}

          {error && (
            <Notice tone="danger" className="mt-4" onDismiss={() => setError(null)}>
              {error}
            </Notice>
          )}

          {busy && <ProgressBar value={progress.value} label={progress.label || "Working…"} />}

          {entries.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button type="button" onClick={run} disabled={busy} className={cn("btn-primary w-full sm:w-auto")}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <LayoutGrid className="h-4 w-4" aria-hidden="true" />}
                {busy ? "Building…" : `Export ${entries.length} pages`}
              </button>
              <p className="text-[12.5px] text-subtle">Pages are copied, so text stays selectable.</p>
            </div>
          )}
        </>
      )}
    </ToolFrame>
  );
}
