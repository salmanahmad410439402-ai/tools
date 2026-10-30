"use client";

import { useState } from "react";
import { Hash, Loader2 } from "lucide-react";
import { parsePageRanges } from "@/lib/pdf/core";
import { addPageNumbers, type NumberPosition } from "@/lib/pdf/ops";
import { track } from "@/lib/analytics";
import { revokeResults, type ResultFile } from "@/lib/download";
import { fileBaseName, outputName } from "@/lib/utils";
import { Field, inputClass, Notice, ProgressBar, ResultsPanel, ToolFrame, selectClass } from "../kit";
import { PdfSource, usePdfInfo } from "./PdfSource";
import { useAutoFocus } from "@/components/ToolFocusShell";

const POSITIONS: { value: NumberPosition; label: string }[] = [
  { value: "bottom-center", label: "Bottom centre" },
  { value: "bottom-right", label: "Bottom right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "top-center", label: "Top centre" },
  { value: "top-right", label: "Top right" },
  { value: "top-left", label: "Top left" },
];

export function PageNumbers() {
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState<NumberPosition>("bottom-center");
  const [format, setFormat] = useState("Page {n} of {total}");
  const [startAt, setStartAt] = useState("1");
  const [fontSize, setFontSize] = useState("10");
  const [margin, setMargin] = useState("28");
  const [skipFirst, setSkipFirst] = useState(false);
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
    setError(null);
    setPages("");
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const selection = pages.trim() ? parsePageRanges(pages, info.pages) : undefined;
      const bytes = await addPageNumbers(await file.arrayBuffer(), {
        position,
        format: format.trim() || "{n}",
        startAt: Math.max(1, Number(startAt) || 1),
        fontSize: Math.max(6, Math.min(24, Number(fontSize) || 10)),
        margin: Math.max(8, Math.min(80, Number(margin) || 28)),
        skipFirst,
        pages: selection,
      });
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      setResults([
        {
          id: "numbered",
          name: outputName(fileBaseName(file.name), "numbered", "pdf"),
          blob,
          size: blob.size,
          originalSize: file.size,
          note: "Numbers drawn as real text on each page",
        },
      ]);
      track("tool_completed", { tool: "add-page-numbers-to-pdf" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Page numbers could not be added.");
    } finally {
      setBusy(false);
    }
  };

  if (results.length) {
    return (
      <ToolFrame labelledBy="tool-title">
        <ResultsPanel files={results} onReset={reset} heading="Page numbers added" />
      </ToolFrame>
    );
  }

  return (
    <ToolFrame labelledBy="tool-title">
      <PdfSource file={file} onFile={(next) => { setFile(next); setError(null); }} onRemove={() => setFile(null)} />

      {file && (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Position" htmlFor="pn-position">
              <select
                id="pn-position"
                className={selectClass}
                value={position}
                onChange={(event) => setPosition(event.target.value as NumberPosition)}
              >
                {POSITIONS.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Format" htmlFor="pn-format" hint="{n} becomes the page number, {total} the page count.">
              <input id="pn-format" className={inputClass} value={format} onChange={(event) => setFormat(event.target.value)} />
            </Field>

            <Field label="Start counting at" htmlFor="pn-start">
              <input
                id="pn-start"
                type="number"
                min={1}
                className={inputClass}
                value={startAt}
                onChange={(event) => setStartAt(event.target.value)}
              />
            </Field>

            <Field label="Font size (pt)" htmlFor="pn-size">
              <input
                id="pn-size"
                type="number"
                min={6}
                max={24}
                className={inputClass}
                value={fontSize}
                onChange={(event) => setFontSize(event.target.value)}
              />
            </Field>

            <Field label="Margin from edge (pt)" htmlFor="pn-margin" hint="28 pt ≈ 10 mm.">
              <input
                id="pn-margin"
                type="number"
                min={8}
                max={80}
                className={inputClass}
                value={margin}
                onChange={(event) => setMargin(event.target.value)}
              />
            </Field>

            <Field label="Pages to number" htmlFor="pn-pages" hint="Blank numbers every page.">
              <input
                id="pn-pages"
                className={inputClass}
                value={pages}
                onChange={(event) => setPages(event.target.value)}
                placeholder={`all ${info.pages || ""} pages`}
              />
            </Field>
          </div>

          <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl border border-line bg-surface px-3 py-2.5">
            <input
              type="checkbox"
              checked={skipFirst}
              onChange={(event) => setSkipFirst(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-brand-500"
            />
            <span className="text-[13px] text-body">
              <span className="font-semibold text-ink">Skip the first page</span> — useful when page one is a cover that
              should not carry a number.
            </span>
          </label>

          {info.error && <Notice tone="danger" className="mt-4">{info.error}</Notice>}
          {error && (
            <Notice tone="danger" className="mt-4" onDismiss={() => setError(null)}>
              {error}
            </Notice>
          )}
          {busy && <ProgressBar value={0.6} label="Writing page numbers" />}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={run} disabled={busy || Boolean(info.error)} className="btn-primary w-full sm:w-auto">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Hash className="h-4 w-4" aria-hidden="true" />}
              {busy ? "Numbering…" : "Add page numbers"}
            </button>
            <p className="text-[12.5px] text-subtle">
              {info.pages ? `${info.pages} page${info.pages === 1 ? "" : "s"} · ` : ""}text stays selectable
            </p>
          </div>
        </>
      )}
    </ToolFrame>
  );
}
