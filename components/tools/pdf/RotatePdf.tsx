"use client";

import { useState } from "react";
import { Loader2, RotateCw } from "lucide-react";
import { parsePageRanges } from "@/lib/pdf/core";
import { rotatePdf } from "@/lib/pdf/ops";
import { track } from "@/lib/analytics";
import { revokeResults, type ResultFile } from "@/lib/download";
import { fileBaseName, outputName } from "@/lib/utils";
import { Field, Notice, ProgressBar, ResultsPanel, Segmented, ToolFrame } from "../kit";
import { PageSelection, PdfSource, usePdfInfo } from "./PdfSource";
import { useAutoFocus } from "@/components/ToolFocusShell";

type Angle = "90" | "180" | "270";

export function RotatePdf() {
  const [file, setFile] = useState<File | null>(null);
  const [angle, setAngle] = useState<Angle>("90");
  const [pages, setPages] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultFile[]>([]);
  const info = usePdfInfo(file);
  // A page being open is the cue to give the preview the whole width.
  useAutoFocus(Boolean(file) && Boolean(info.pages));

  const reset = () => {
    revokeResults(results);
    setResults([]);
    setFile(null);
    setPages("");
    setError(null);
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const selection = pages.trim() ? parsePageRanges(pages, info.pages) : undefined;
      const bytes = await rotatePdf(await file.arrayBuffer(), Number(angle) as 90 | 180 | 270, { pages: selection });
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      setResults([
        {
          id: "rotated",
          name: outputName(fileBaseName(file.name), "rotated", "pdf"),
          blob,
          size: blob.size,
          originalSize: file.size,
          note: selection
            ? `Rotated ${selection.length} page${selection.length === 1 ? "" : "s"} by ${angle}°`
            : `All pages rotated by ${angle}°`,
        },
      ]);
      track("tool_completed", { tool: "rotate-pdf", angle });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The PDF could not be rotated.");
    } finally {
      setBusy(false);
    }
  };

  if (results.length) {
    return (
      <ToolFrame labelledBy="tool-title">
        <ResultsPanel files={results} onReset={reset} heading="Rotation applied" />
      </ToolFrame>
    );
  }

  return (
    <ToolFrame labelledBy="tool-title">
      <PdfSource file={file} onFile={(next) => { setFile(next); setError(null); }} onRemove={() => setFile(null)} />

      {file && (
        <>
          <div className="mt-5">
            <Segmented<Angle>
              label="Rotate"
              value={angle}
              onChange={setAngle}
              options={[
                { value: "90", label: "90° clockwise", hint: "Landscape scan → portrait" },
                { value: "180", label: "180°", hint: "Upside-down pages" },
                { value: "270", label: "90° anticlockwise", hint: "The other direction" },
              ]}
            />
          </div>

          <div className="mt-4 sm:max-w-xs">
            <PageSelection id="rotate-pages" value={pages} onChange={setPages} pageCount={info.pages} label="Pages to rotate" />
          </div>

          {info.error && <Notice tone="danger" className="mt-4">{info.error}</Notice>}
          {error && (
            <Notice tone="danger" className="mt-4" onDismiss={() => setError(null)}>
              {error}
            </Notice>
          )}
          {busy && <ProgressBar value={0.6} label="Rotating pages" />}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={run} disabled={busy || Boolean(info.error)} className="btn-primary w-full sm:w-auto">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RotateCw className="h-4 w-4" aria-hidden="true" />}
              {busy ? "Rotating…" : "Rotate PDF"}
            </button>
            <p className="text-[12.5px] text-subtle">
              {info.pages ? `${info.pages} page${info.pages === 1 ? "" : "s"} · ` : ""}rotation is stored in the file, no re-rendering
            </p>
          </div>
        </>
      )}
    </ToolFrame>
  );
}
