"use client";

import { useState } from "react";
import { Loader2, Presentation } from "lucide-react";
import { describeSlideSize, parsePptx, renderPptxToPdf, type PptxDeck } from "@/lib/convert/pptx";
import { track } from "@/lib/analytics";
import { revokeResults, type ResultFile } from "@/lib/download";
import { fileBaseName, formatBytes, outputName } from "@/lib/utils";
import { Dropzone, Notice, ProgressBar, ResultsPanel, ToolFrame } from "./kit";

export function PptxToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [deck, setDeck] = useState<PptxDeck | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ value: 0, label: "" });
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultFile[]>([]);

  const reset = () => {
    revokeResults(results);
    setResults([]);
    setFile(null);
    setDeck(null);
    setError(null);
    setProgress({ value: 0, label: "" });
  };

  const pick = async (next: File) => {
    setFile(next);
    setDeck(null);
    setError(null);
    setBusy(true);
    setProgress({ value: 0.3, label: "Reading the slides" });
    try {
      const parsed = await parsePptx(await next.arrayBuffer());
      setDeck(parsed);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "This presentation could not be read.");
    } finally {
      setBusy(false);
    }
  };

  const run = async () => {
    if (!file || !deck) return;
    setBusy(true);
    setError(null);
    try {
      setProgress({ value: 0.5, label: `Drawing ${deck.slides.length} slides` });
      const bytes = await renderPptxToPdf(deck, fileBaseName(file.name));
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      setResults([
        {
          id: "pdf",
          name: outputName(fileBaseName(file.name), "", "pdf"),
          blob,
          size: blob.size,
          originalSize: file.size,
          note: `${deck.slides.length} slide${deck.slides.length === 1 ? "" : "s"} · ${describeSlideSize(deck)}`,
        },
      ]);
      track("tool_completed", { tool: "powerpoint-to-pdf", slides: deck.slides.length });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The PDF could not be built.");
    } finally {
      setBusy(false);
    }
  };

  if (results.length) {
    return (
      <ToolFrame labelledBy="tool-title">
        <ResultsPanel files={results} onReset={reset} heading="Your PDF is ready" compare="conversion" />
        <div className="mt-4">
          <Notice tone="warning">
            Open the PDF and check every slide before you send it. Animations, transitions, charts and SmartArt cannot be
            reproduced, and a slide that leans on those will look different from the original.
          </Notice>
        </div>
      </ToolFrame>
    );
  }

  return (
    <ToolFrame labelledBy="tool-title">
      {!file ? (
        <Dropzone
          accept="application/vnd.openxmlformats-officedocument.presentationml.presentation,.pptx"
          acceptedLabel="PowerPoint .pptx"
          extensions={["pptx"]}
          onFiles={(files) => files[0] && pick(files[0])}
          multiple={false}
          maxSizeMb={150}
          title="Drop a .pptx file here or click to choose"
          subtitle="PowerPoint 2007+ · converted in this tab · nothing is uploaded"
        />
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-raised p-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <Presentation className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold text-ink">{file.name}</p>
            <p className="text-[12px] text-subtle">
              {formatBytes(file.size)}
              {deck ? ` · ${deck.slides.length} slides · ${describeSlideSize(deck)}` : ""}
            </p>
          </div>
          <button type="button" onClick={reset} className="rounded-lg px-2 py-1 text-[12.5px] font-medium text-subtle hover:text-danger">
            Change
          </button>
        </div>
      )}

      {file && (
        <>
          {deck && (
            <div className="mt-4 rounded-xl border border-line bg-surface p-3.5">
              <p className="text-[12.5px] font-semibold text-ink">What was found</p>
              <ul className="mt-1.5 space-y-0.5 text-[12.5px] text-body">
                <li>
                  {deck.slides.length} slide{deck.slides.length === 1 ? "" : "s"} · {describeSlideSize(deck)}
                </li>
                <li>
                  {deck.slides.reduce((sum, slide) => sum + slide.elements.length, 0)} shapes, text boxes and pictures
                </li>
                {deck.warnings.length > 0 && (
                  <li className="text-warning">
                    {deck.warnings.filter((warning) => warning === "table flattened").length} table
                    {deck.warnings.length === 1 ? "" : "s"} flattened to text ·{" "}
                    {deck.warnings.filter((warning) => warning === "unsupported image").length} unsupported image
                    {deck.warnings.filter((warning) => warning === "unsupported image").length === 1 ? "" : "s"} skipped
                  </li>
                )}
              </ul>
            </div>
          )}

          <Notice tone="info" className="mt-4">
            Every slide becomes one PDF page at the deck&apos;s own size, with editable text and embedded pictures. Themes
            that rely on gradients, shadows, 3-D effects, charts, SmartArt, embedded fonts or video are approximated —
            this is a faithful preview, not a PowerPoint render.
          </Notice>

          {error && (
            <Notice tone="danger" className="mt-4" onDismiss={() => setError(null)}>
              {error}
            </Notice>
          )}
          {busy && <ProgressBar value={progress.value} label={progress.label} />}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={run} disabled={busy || !deck} className="btn-primary w-full sm:w-auto">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Presentation className="h-4 w-4" aria-hidden="true" />}
              {busy ? "Converting…" : "Convert to PDF"}
            </button>
            <p className="text-[12.5px] text-subtle">.pptx only — legacy .ppt files must be re-saved in PowerPoint first.</p>
          </div>
        </>
      )}
    </ToolFrame>
  );
}
