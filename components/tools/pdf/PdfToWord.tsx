"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { findRepeatingLines, isRepeating, pageToParagraphs, type Paragraph } from "@/lib/convert/pdf-layout";
import { readPdfLayout } from "@/lib/convert/pdf-text";
import { buildDocx, type DocxParagraph, type DocxStyle } from "@/lib/convert/docx-write";
import { track } from "@/lib/analytics";
import { revokeResults, type ResultFile } from "@/lib/download";
import { fileBaseName, outputName } from "@/lib/utils";
import { Field, inputClass, Notice, ProgressBar, ResultsPanel, ToolFrame } from "../kit";
import { PdfSource, usePdfInfo } from "./PdfSource";

const STYLE_FOR_HEADING: Record<1 | 2 | 3, DocxStyle> = { 1: "Heading1", 2: "Heading2", 3: "Heading3" };

export function PdfToWord() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState("");
  const [skipFurniture, setSkipFurniture] = useState(true);
  const [pageBreaks, setPageBreaks] = useState(true);
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
      const { pages: layoutPages, imageOnly } = await readPdfLayout(file, pages, (value, label) =>
        setProgress({ value: value * 0.8, label }),
      );

      const repeats = skipFurniture ? findRepeatingLines(layoutPages) : new Set<string>();
      const paragraphBlocks: DocxParagraph[] = [];
      let removed = 0;

      layoutPages.forEach((page, index) => {
        const lines = page.lines.filter((line) => {
          const drop = repeats.size > 0 && isRepeating(line, repeats);
          if (drop) removed += 1;
          return !drop;
        });
        const converted: Paragraph[] = pageToParagraphs({ ...page, lines });
        converted.forEach((paragraph, paragraphIndex) => {
          paragraphBlocks.push({
            text: paragraph.text,
            style: paragraph.heading ? STYLE_FOR_HEADING[paragraph.heading] : "Normal",
            pageBreakBefore: pageBreaks && index > 0 && paragraphIndex === 0,
          });
        });
      });

      if (!paragraphBlocks.length) {
        setError(
          imageOnly
            ? "This PDF has no text layer — every page is a picture. Use OCR PDF to recognise the text first, then convert that result."
            : "No readable text was found in the selected pages.",
        );
        return;
      }

      setProgress({ value: 0.9, label: "Writing the Word document" });
      const docx = await buildDocx({ title: fileBaseName(file.name), paragraphs: paragraphBlocks });
      const blob = new Blob([docx as unknown as BlobPart], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      const notes = [
        `${layoutPages.length} page${layoutPages.length === 1 ? "" : "s"}`,
        `${paragraphBlocks.length} paragraphs`,
      ];
      if (removed) notes.push(`${removed} running header/footer lines skipped`);
      if (imageOnly) notes.push(`${imageOnly} page${imageOnly === 1 ? "" : "s"} had no text`);

      setResults([
        {
          id: "docx",
          name: outputName(fileBaseName(file.name), "", "docx"),
          blob,
          size: blob.size,
          originalSize: file.size,
          note: notes.join(" · "),
        },
      ]);
      track("tool_completed", { tool: "pdf-to-word", pages: layoutPages.length });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The document could not be converted.");
    } finally {
      setBusy(false);
    }
  };

  if (results.length) {
    return (
      <ToolFrame labelledBy="tool-title">
        <ResultsPanel files={results} onReset={reset} heading="Your Word document is ready" compare="conversion" />
        <div className="mt-4">
          <Notice tone="info">
            Open it in Word, Pages or Google Docs and check the headings and paragraph breaks. Lists and tables come
            through as plain paragraphs — a PDF does not store which text belongs to a bullet, only where it sits.
          </Notice>
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
        subtitle="PDF only · text is read in this tab · nothing is uploaded"
      />

      {file && (
        <>
          <div className="mt-4">
            <Field label="Pages" htmlFor="word-pages" hint="Leave empty for the whole document.">
              <input
                id="word-pages"
                className={inputClass}
                value={pages}
                onChange={(event) => setPages(event.target.value)}
                placeholder="all"
              />
            </Field>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-line bg-raised p-3">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-brand-500"
                checked={skipFurniture}
                onChange={(event) => setSkipFurniture(event.target.checked)}
              />
              <span>
                <span className="block text-[13px] font-medium text-ink">Skip running headers and footers</span>
                <span className="block text-[11.5px] leading-relaxed text-subtle">
                  Drops the lines that repeat at the top or bottom of most pages, including page numbers.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-line bg-raised p-3">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-brand-500"
                checked={pageBreaks}
                onChange={(event) => setPageBreaks(event.target.checked)}
              />
              <span>
                <span className="block text-[13px] font-medium text-ink">Keep page breaks</span>
                <span className="block text-[11.5px] leading-relaxed text-subtle">
                  Each PDF page starts a new page in Word, so page numbers still line up.
                </span>
              </span>
            </label>
          </div>

          <p className="mt-3 text-[12px] text-subtle">
            {info.pages ? `${info.pages} pages · ` : ""}Paragraphs, headings and line order are rebuilt from the text
            positions.
          </p>

          <Notice tone="info" className="mt-4">
            The Word file is reflowed, not copied: text arrives as editable paragraphs, but the original columns,
            tables, images and exact line breaks are not recreated. A layout-heavy PDF will look different — that is the
            honest limit of converting in a browser.
          </Notice>

          {info.error && (
            <Notice tone="danger" className="mt-4">
              {info.error}
            </Notice>
          )}
          {error && (
            <Notice tone="danger" className="mt-4" onDismiss={() => setError(null)}>
              {error}
            </Notice>
          )}
          {busy && <ProgressBar value={progress.value} label={progress.label} />}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={run} disabled={busy} className="btn-primary w-full sm:w-auto">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FileText className="h-4 w-4" aria-hidden="true" />}
              {busy ? "Converting…" : "Convert to Word"}
            </button>
            <p className="text-[12.5px] text-subtle">Text stays selectable and editable in the result.</p>
          </div>
        </>
      )}
    </ToolFrame>
  );
}
