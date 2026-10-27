"use client";

import { useState } from "react";
import { Copy, FileText, Loader2 } from "lucide-react";
import { loadPdfjsDocument } from "@/lib/pdf/pdfjs";
import { parsePageRanges } from "@/lib/pdf/core";
import { track } from "@/lib/analytics";
import { revokeResults, type ResultFile } from "@/lib/download";
import { fileBaseName, outputName } from "@/lib/utils";
import { Field, inputClass, Notice, ProgressBar, ResultsPanel, ToolFrame } from "../kit";
import { PdfSource, usePdfInfo } from "./PdfSource";

/** Rebuilds readable lines from pdf.js text items, which arrive as fragments. */
function itemsToLines(items: { str: string; transform: number[]; hasEOL?: boolean }[]): string {
  const lines: { y: number; parts: string[] }[] = [];
  for (const item of items) {
    if (!item.str) continue;
    const y = Math.round(item.transform[5] as number);
    const last = lines[lines.length - 1];
    if (last && Math.abs(last.y - y) <= 2) {
      last.parts.push(item.str);
    } else {
      lines.push({ y, parts: [item.str] });
    }
  }
  return lines
    .map((line) =>
      line.parts
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .join("\n");
}

export function PdfToTxt() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState("");
  const [markers, setMarkers] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ value: 0, label: "" });
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [results, setResults] = useState<ResultFile[]>([]);
  const [copied, setCopied] = useState(false);
  const info = usePdfInfo(file);

  const reset = () => {
    revokeResults(results);
    setResults([]);
    setFile(null);
    setText("");
    setNote(null);
    setError(null);
    setPages("");
    setProgress({ value: 0, label: "" });
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setNote(null);
    setResults([]);
    try {
      const bytes = await file.arrayBuffer();
      const pdf = await loadPdfjsDocument(bytes);
      const selection = pages.trim() ? parsePageRanges(pages, pdf.numPages) : null;
      const list = selection ?? Array.from({ length: pdf.numPages }, (_, index) => index);
      const chunks: string[] = [];
      let characters = 0;

      for (let index = 0; index < list.length; index += 1) {
        const pageNumber = list[index] + 1;
        setProgress({
          value: (index + 1) / list.length,
          label: `Reading page ${pageNumber} of ${pdf.numPages}`,
        });
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        const body = itemsToLines(content.items as { str: string; transform: number[] }[]);
        characters += body.replace(/\s/g, "").length;
        chunks.push(markers ? `--- Page ${pageNumber} ---\n${body}` : body);
        page.cleanup();
      }
      await pdf.destroy();

      const output = `${chunks.join("\n\n")}\n`;

      if (characters === 0) {
        setNote(
          "This PDF contains no readable text layer — every page is a picture. That happens with scans and phone photos. Converting to JPG and running OCR is the only route, and OCR is not built yet.",
        );
        setError("No text was found in the selected pages.");
        return;
      }

      setText(output);
      const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
      setResults([
        {
          id: "txt",
          name: outputName(fileBaseName(file.name), "", "txt"),
          blob,
          size: blob.size,
          originalSize: file.size,
          note: `${list.length} page${list.length === 1 ? "" : "s"} · ${characters.toLocaleString()} characters`,
        },
      ]);
      track("tool_completed", { tool: "pdf-to-txt", pages: list.length });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The text could not be extracted.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("The clipboard is blocked by the browser. Select the text and copy it manually.");
    }
  };

  if (results.length) {
    return (
      <ToolFrame labelledBy="tool-title">
        <ResultsPanel files={results} onReset={reset} heading="Text extracted" compare="conversion" />
        <div className="mt-4">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="txt-preview" className="text-[12.5px] font-semibold text-ink">
              Preview
            </label>
            <button type="button" onClick={copy} className="btn-secondary min-h-[36px] px-3 text-[12.5px]">
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              {copied ? "Copied" : "Copy text"}
            </button>
          </div>
          <textarea
            id="txt-preview"
            readOnly
            value={text}
            rows={10}
            className="mt-1.5 w-full rounded-xl border border-line bg-surface p-3 font-mono text-[12.5px] leading-relaxed text-body"
          />
        </div>
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
        title="Drop the PDF you want as plain text"
        subtitle="PDF only · text layer required · read in this tab"
      />

      {file && (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Pages (optional)"
              htmlFor="txt-pages"
              hint={info.pages ? `${info.pages} pages · blank means all` : "Blank means every page."}
            >
              <input
                id="txt-pages"
                className={inputClass}
                value={pages}
                onChange={(event) => setPages(event.target.value)}
                placeholder="1-5, 9"
              />
            </Field>
            <label className="flex cursor-pointer items-start gap-2.5 self-end rounded-xl border border-line bg-surface px-3 py-2.5">
              <input
                type="checkbox"
                checked={markers}
                onChange={(event) => setMarkers(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-brand-500"
              />
              <span className="text-[13px] text-body">
                <span className="font-semibold text-ink">Add page markers</span> — “--- Page 3 ---” between pages.
              </span>
            </label>
          </div>

          {note && <Notice tone="info" className="mt-3">{note}</Notice>}
          {error && (
            <Notice tone="danger" className="mt-3" onDismiss={() => setError(null)}>
              {error}
            </Notice>
          )}
          {busy && <ProgressBar value={progress.value} label={progress.label || "Reading the document"} />}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={run} disabled={busy} className="btn-primary w-full sm:w-auto">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FileText className="h-4 w-4" aria-hidden="true" />}
              {busy ? "Extracting…" : "Extract text"}
            </button>
            <p className="text-[12.5px] text-subtle">Works on PDFs with a real text layer; scans contain none.</p>
          </div>
        </>
      )}
    </ToolFrame>
  );
}
