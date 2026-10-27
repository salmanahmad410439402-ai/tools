"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, Loader2, Scissors, Trash2 } from "lucide-react";
import { everyNthChunks, parsePageRanges, parseRangeGroups } from "@/lib/pdf/core";
import { countPages } from "@/lib/pdf/core";
import { splitPdf } from "@/lib/pdf/ops";
import { track, sizeBucket } from "@/lib/analytics";
import { revokeResults, type ResultFile } from "@/lib/download";
import { fileBaseName, formatBytes, outputName } from "@/lib/utils";
import { Dropzone, Field, inputClass, Notice, ProgressBar, ResultsPanel, Segmented, ToolFrame } from "../kit";

type Mode = "ranges" | "every" | "single";

export function SplitPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [mode, setMode] = useState<Mode>("ranges");
  const [ranges, setRanges] = useState("1-3, 4-8");
  const [chunk, setChunk] = useState("2");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ value: 0, label: "" });
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultFile[]>([]);

  useEffect(() => {
    if (!file) {
      setPageCount(0);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const total = await countPages(await file.arrayBuffer());
        if (!cancelled) {
          setPageCount(total);
          setRanges(total > 6 ? `1-3, 4-${total}` : `1, 2-${Math.max(total, 2)}`);
        }
      } catch {
        if (!cancelled) setError("This PDF could not be opened. It may be damaged or password-protected.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file]);

  const addFiles = useCallback((files: File[]) => {
    setError(null);
    setResults([]);
    setFile(files[0]);
    track("tool_started", { tool: "split-pdf" });
  }, []);

  const reset = () => {
    revokeResults(results);
    setResults([]);
    setFile(null);
    setError(null);
    setProgress({ value: 0, label: "" });
  };

  let preview = "";
  try {
    if (file && pageCount) {
      const groups =
        mode === "ranges"
          ? parseRangeGroups(ranges, pageCount)
          : mode === "every"
            ? everyNthChunks(pageCount, Number(chunk))
            : Array.from({ length: pageCount }, (_, index) => [index]);
      preview = `${groups.length} file${groups.length === 1 ? "" : "s"}: ${groups
        .map((group) => (group.length === 1 ? `${group[0] + 1}` : `${group[0] + 1}–${group[group.length - 1] + 1}`))
        .join(", ")}`;
    }
  } catch (caught) {
    preview = caught instanceof Error ? caught.message : "";
  }

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const groups =
        mode === "ranges"
          ? parseRangeGroups(ranges, pageCount)
          : mode === "every"
            ? everyNthChunks(pageCount, Number(chunk))
            : Array.from({ length: pageCount }, (_, index) => [index]);

      setProgress({ value: 0.1, label: "Splitting pages" });
      const parts = await splitPdf(buffer, groups);
      const base = fileBaseName(file.name);
      const output: ResultFile[] = parts.map((part) => {
        const first = part.pages[0] + 1;
        const last = part.pages[part.pages.length - 1] + 1;
        const suffix = part.pages.length === 1 ? `page-${first}` : `pages-${first}-${last}`;
        const blob = new Blob([part.bytes as unknown as BlobPart], { type: "application/pdf" });
        return {
          id: `part-${part.index}`,
          name: outputName(`${base}-${suffix}`, "", "pdf"),
          blob,
          size: blob.size,
          note: `${part.pages.length} page${part.pages.length === 1 ? "" : "s"} (${first}–${last})`,
        };
      });

      setResults(output);
      setProgress({ value: 1, label: "Done" });
      track("tool_completed", {
        tool: "split-pdf",
        files: output.length,
        size: sizeBucket(output.reduce((sum, item) => sum + item.size, 0)),
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The PDF could not be split.");
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
          heading={`${results.length} file${results.length === 1 ? "" : "s"} created`}
          zipName="filecraft-split-pdf.zip"
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
          subtitle="PDF only · up to 200 MB · one document per run"
        />
      ) : (
        <>
          <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-ink">{file.name}</p>
              <p className="text-[12px] text-subtle">
                {formatBytes(file.size)}
                {pageCount ? ` · ${pageCount} page${pageCount === 1 ? "" : "s"}` : " · counting pages…"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="grid h-9 w-9 place-items-center rounded-lg text-subtle hover:bg-danger/5 hover:text-danger"
              aria-label="Remove file"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-5">
            <Segmented<Mode>
              label="How should it be split?"
              value={mode}
              onChange={setMode}
              options={[
                { value: "ranges", label: "By ranges", hint: "You type the page groups" },
                { value: "every", label: "Every N pages", hint: "Equal chunks" },
                { value: "single", label: "One file per page", hint: "Burst the document" },
              ]}
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {mode === "ranges" && (
              <Field
                label="Page ranges"
                htmlFor="split-ranges"
                hint="Each comma-separated range becomes its own file: 1-3, 4-8, 9-20"
              >
                <input
                  id="split-ranges"
                  className={inputClass}
                  value={ranges}
                  onChange={(event) => setRanges(event.target.value)}
                  placeholder="1-3, 4-8"
                  inputMode="numeric"
                />
              </Field>
            )}
            {mode === "every" && (
              <Field label="Pages per file" htmlFor="split-every" hint="For example 2 for invoices, 10 for chapters.">
                <input
                  id="split-every"
                  type="number"
                  min={1}
                  max={pageCount || 999}
                  className={inputClass}
                  value={chunk}
                  onChange={(event) => setChunk(event.target.value)}
                />
              </Field>
            )}
          </div>

          {preview && (
            <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-[12.5px] text-body">
              <span className="font-semibold text-ink">Result:</span> {preview}
            </p>
          )}

          {error && (
            <Notice tone="danger" className="mt-4" onDismiss={() => setError(null)}>
              {error}
            </Notice>
          )}

          {busy && <ProgressBar value={progress.value} label={progress.label || "Splitting…"} />}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={run} disabled={busy || !pageCount} className="btn-primary w-full sm:w-auto">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Scissors className="h-4 w-4" aria-hidden="true" />}
              {busy ? "Splitting…" : "Split PDF"}
            </button>
            <p className="text-[12.5px] text-subtle">Multiple files download as one ZIP.</p>
          </div>
        </>
      )}
    </ToolFrame>
  );
}
