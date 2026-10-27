"use client";

import { useState } from "react";
import { Loader2, ShieldAlert, Wrench } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { loadPdfDocument } from "@/lib/pdf/core";
import { dropThumbnails } from "@/lib/pdf/ops";
import { track, sizeBucket } from "@/lib/analytics";
import { revokeResults, type ResultFile } from "@/lib/download";
import { fileBaseName, formatBytes, outputName } from "@/lib/utils";
import { Notice, ProgressBar, ResultsPanel, ToolFrame } from "../kit";
import { PdfSource } from "./PdfSource";

interface Report {
  pages: number;
  version: string | null;
  before: number;
  after: number;
  thumbnails: number;
  repaired: boolean;
  notes: string[];
}

/**
 * Structural rewrite: parse, rebuild the object graph and write a clean file.
 *
 * This is what "repair" honestly means in a browser. It fixes the failures that
 * come from truncated downloads, broken cross-reference tables, duplicate
 * objects and files grown huge by accumulated edit history. It cannot invent
 * page content that is not in the bytes — no tool can.
 */
export function RepairPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [results, setResults] = useState<ResultFile[]>([]);

  const reset = () => {
    revokeResults(results);
    setResults([]);
    setFile(null);
    setReport(null);
    setError(null);
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const bytes = await file.arrayBuffer();
      const notes: string[] = [];

      // 1. Parse leniently. pdf-lib repairs a damaged xref table on load.
      const { doc } = await loadPdfDocument(bytes, { ignoreEncryption: false });
      const pages = doc.getPageCount();
      if (!pages) throw new Error("No pages could be found inside this file, so there is nothing to rebuild.");
      notes.push("Parsed the file and rebuilt the cross-reference table from the objects that were present.");

      // 2. Drop embedded thumbnails — usually the largest waste in old files.
      const removedThumbs = dropThumbnails(doc);
      if (removedThumbs) {
        notes.push(`Removed ${removedThumbs} embedded page thumbnail${removedThumbs === 1 ? "" : "s"} left behind by an editor.`);
      }

      // 3. Write a fresh file: deduplicated objects, object streams, no stale
      //    incremental-update history.
      const repaired = await doc.save({ useObjectStreams: true, addDefaultPage: false });

      // 4. Prove the result opens and keeps every page before handing it over.
      const check = await PDFDocument.load(repaired, { updateMetadata: false });
      if (check.getPageCount() !== pages) {
        throw new Error("The rebuilt file did not keep every page, so nothing was written. The original is likely truncated.");
      }
      notes.push(`Re-opened the result: ${check.getPageCount()} page${check.getPageCount() === 1 ? "" : "s"} intact.`);

      const blob = new Blob([repaired as unknown as BlobPart], { type: "application/pdf" });
      setReport({
        pages,
        version: null,
        before: file.size,
        after: blob.size,
        thumbnails: removedThumbs,
        repaired: true,
        notes,
      });
      setResults([
        {
          id: "repaired",
          name: outputName(fileBaseName(file.name), "repaired", "pdf"),
          blob,
          size: blob.size,
          originalSize: file.size,
          note: `${pages} page${pages === 1 ? "" : "s"} rebuilt and verified`,
        },
      ]);
      track("tool_completed", { tool: "repair-pdf", pages, size: sizeBucket(blob.size) });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "This file could not be rebuilt.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolFrame labelledBy="tool-title">
      {results.length ? (
        <>
          <ResultsPanel files={results} onReset={reset} heading="Rebuilt and verified" compare="conversion" />
          {report && (
            <div className="mt-4 rounded-xl border border-line bg-surface p-4 text-[13px] leading-relaxed text-body">
              <p className="font-semibold text-ink">What happened</p>
              <ul className="mt-2 space-y-1.5">
                {report.notes.map((note) => (
                  <li key={note} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                    {note}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-subtle">
                {formatBytes(report.before)} in · {formatBytes(report.after)} out. A repair that changes nothing is a
                useful answer too: it means the file was already structurally sound.
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          <PdfSource
            file={file}
            onFile={(next) => {
              setFile(next);
              setError(null);
            }}
            onRemove={() => setFile(null)}
            title="Drop the PDF that will not open cleanly"
            subtitle="PDF only · up to 200 MB · parsed in this tab"
          />

          {file && (
            <>
              <div className="mt-4 rounded-xl border border-line bg-surface p-4">
                <p className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink">
                  <Wrench className="h-4 w-4 text-brand-600" aria-hidden="true" />
                  What a browser-side repair can and cannot do
                </p>
                <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-body">
                  <li>· Rebuild a broken cross-reference table, object table or file trailer.</li>
                  <li>· Drop duplicate objects, stale edit history and embedded page thumbnails.</li>
                  <li>· Recover pages when a download was cut off before the last page.</li>
                  <li className="text-subtle">
                    · It cannot invent missing pages, rebuild a zeroed byte range or remove a password.
                  </li>
                </ul>
              </div>

              {error && (
                <Notice tone="danger" className="mt-3" onDismiss={() => setError(null)}>
                  {error}
                </Notice>
              )}
              <Notice tone="warning" className="mt-3">
                Keep the original file. Repair writes a new file; if a page is genuinely missing from the bytes, no
                tool can bring it back.
              </Notice>
              {busy && <ProgressBar value={0.6} label="Rebuilding the file structure" />}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button type="button" onClick={run} disabled={busy} className="btn-primary w-full sm:w-auto">
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                  )}
                  {busy ? "Rebuilding…" : "Repair this PDF"}
                </button>
                <p className="text-[12.5px] text-subtle">The result is re-opened and page-checked before you get it.</p>
              </div>
            </>
          )}
        </>
      )}
    </ToolFrame>
  );
}
