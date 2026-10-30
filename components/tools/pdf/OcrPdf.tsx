"use client";

import { useState } from "react";
import { Loader2, ScanText } from "lucide-react";
import { canvasToJpeg, loadPdfjsDocument, renderPageToCanvas } from "@/lib/pdf/pdfjs";
import { parsePageRanges } from "@/lib/pdf/core";
import { buildSearchablePdf } from "@/lib/pdf/ocr-pdf";
import {
  averageConfidence,
  countRecognisedWords,
  createOcrWorker,
  imageToCanvas,
  recognise,
  transcriptOf,
  type OcrPage,
} from "@/lib/ocr";
import { track } from "@/lib/analytics";
import { revokeResults, type ResultFile } from "@/lib/download";
import { fileBaseName, formatBytes, outputName } from "@/lib/utils";
import { Dropzone, Field, inputClass, Notice, ProgressBar, ResultsPanel, ToolFrame } from "../kit";

const ACCEPTED = ["pdf", "png", "jpg", "jpeg", "webp"];
const MAX_PAGES = 30;

export function OcrPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState("");
  const [searchable, setSearchable] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ value: 0, label: "" });
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [textLayer, setTextLayer] = useState<boolean | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [transcript, setTranscript] = useState("");
  const [results, setResults] = useState<ResultFile[]>([]);

  const reset = () => {
    revokeResults(results);
    setResults([]);
    setFile(null);
    setPages("");
    setError(null);
    setNote(null);
    setTranscript("");
    setTextLayer(null);
    setPageCount(null);
    setProgress({ value: 0, label: "" });
  };

  const pick = async (next: File) => {
    setFile(next);
    setError(null);
    setNote(null);
    setTextLayer(null);
    setPageCount(null);
    setTranscript("");
    if (!/\.pdf$/i.test(next.name)) return;
    try {
      const pdf = await loadPdfjsDocument(await next.arrayBuffer());
      setPageCount(pdf.numPages);
      if (pdf.numPages > MAX_PAGES) {
        setNote(
          `This PDF has ${pdf.numPages} pages, so only the range you type is processed. OCR is slow — ${MAX_PAGES} pages at a time is the practical ceiling in a browser tab.`,
        );
      }
      // Is there already a text layer? Then OCR would only add noise.
      const first = await pdf.getPage(1);
      const content = await first.getTextContent();
      const characters = content.items.reduce((sum, item) => sum + ("str" in item ? (item.str as string).replace(/\s/g, "").length : 0), 0);
      setTextLayer(characters > 40);
      await pdf.destroy();
    } catch {
      setError("This PDF could not be opened. If it has a password, unlock it first.");
    }
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setTranscript("");
    setResults([]);
    const collected: OcrPage[] = [];
    const images: { bytes: Uint8Array; width: number; height: number; widthPt: number; heightPt: number }[] = [];
    let worker: Awaited<ReturnType<typeof createOcrWorker>> | null = null;

    try {
      worker = await createOcrWorker((status, value) => {
        if (/recogni|loading|initiali/i.test(status)) {
          setProgress({ value: Math.min(0.15, value * 0.15), label: `Preparing the OCR engine (${status})` });
        }
      });

      const isPdf = /\.pdf$/i.test(file.name);

      if (isPdf) {
        const pdf = await loadPdfjsDocument(await file.arrayBuffer());
        const requested = pages.trim();
        const allPages = !requested || /^(all|everything|whole document)$/i.test(requested);
        const selection = allPages
          ? Array.from({ length: Math.min(pdf.numPages, MAX_PAGES) }, (_, index) => index)
          : parsePageRanges(requested, pdf.numPages);
        if (!selection.length) throw new Error("That page selection is empty.");

        for (let index = 0; index < selection.length; index += 1) {
          const pageNumber = selection[index] + 1;
          setProgress({
            value: 0.15 + (index / selection.length) * 0.85,
            label: `Scanning page ${pageNumber} (${index + 1} of ${selection.length})`,
          });
          const page = await pdf.getPage(pageNumber);
          const base = page.getViewport({ scale: 1 });
          const scale = Math.min(2.5, Math.max(1.4, 1700 / base.width));
          const canvas = await renderPageToCanvas(page, scale);
          const result = await recognise(worker, canvas, pageNumber);
          collected.push(result);
          const jpeg = await canvasToJpeg(canvas, 0.82);
          images.push({
            bytes: new Uint8Array(await jpeg.arrayBuffer()),
            width: canvas.width,
            height: canvas.height,
            widthPt: base.width,
            heightPt: base.height,
          });
          page.cleanup();
        }
        await pdf.destroy();
      } else {
        setProgress({ value: 0.2, label: "Recognising the image" });
        const canvas = await imageToCanvas(file);
        const result = await recognise(worker, canvas, 1);
        collected.push(result);
        const jpeg = await canvasToJpeg(canvas, 0.9);
        images.push({
          bytes: new Uint8Array(await jpeg.arrayBuffer()),
          width: canvas.width,
          height: canvas.height,
          widthPt: canvas.width * 0.75,
          heightPt: canvas.height * 0.75,
        });
      }

      await worker.terminate();
      worker = null;

      const words = countRecognisedWords(collected);
      if (!words) {
        setError(
          "No characters were recognised. That usually means the scan is too small, too dark or at an angle — try a 200–300 dpi scan of a straight, well-lit page.",
        );
        return;
      }

      const output = transcriptOf(collected);
      setTranscript(output);

      const files: ResultFile[] = [];
      const textBlob = new Blob([`${output}\n`], { type: "text/plain;charset=utf-8" });
      files.push({
        id: "txt",
        name: outputName(fileBaseName(file.name), "ocr", "txt"),
        blob: textBlob,
        size: textBlob.size,
        originalSize: file.size,
        note: `${words.toLocaleString()} words · ${averageConfidence(collected)}% average confidence`,
      });

      if (searchable) {
        setProgress({ value: 0.96, label: "Adding the hidden text layer" });
        const pdfBytes = await buildSearchablePdf(
          collected.map((page, index) => ({
            image: images[index].bytes,
            imageWidth: images[index].width,
            imageHeight: images[index].height,
            width: images[index].widthPt,
            height: images[index].heightPt,
            words: page.words,
            text: page.text,
          })),
          fileBaseName(file.name),
        );
        const pdfBlob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
        files.unshift({
          id: "pdf",
          name: outputName(fileBaseName(file.name), "searchable", "pdf"),
          blob: pdfBlob,
          size: pdfBlob.size,
          note: `${collected.length} page${collected.length === 1 ? "" : "s"} · text layer searchable in most readers`,
        });
      }

      setResults(files);
      setProgress({ value: 1, label: "Done" });
      track("tool_completed", { tool: "ocr-pdf", pages: collected.length });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The recognition did not finish. A shorter page range usually helps on low-memory devices.",
      );
    } finally {
      if (worker) await worker.terminate().catch(() => undefined);
      setBusy(false);
    }
  };

  if (results.length) {
    return (
      <ToolFrame labelledBy="tool-title">
        <ResultsPanel files={results} onReset={reset} heading="Text recognised" zipName="ocr-results.zip" />
        <div className="mt-4">
          <textarea
            readOnly
            value={transcript}
            rows={12}
            className="w-full rounded-xl border border-line bg-raised p-3 font-mono text-[12px] leading-relaxed text-body"
            aria-label="Recognised text"
          />
          <p className="mt-2 text-[12px] text-subtle">
            Check the result against the page before relying on it: every OCR engine misreads punctuation, thin fonts
            and numbers. Confidence is an average — a single wrong digit is not visible in that number.
          </p>
        </div>
      </ToolFrame>
    );
  }

  return (
    <ToolFrame labelledBy="tool-title">
      {!file ? (
        <Dropzone
          accept="application/pdf,image/png,image/jpeg,image/webp"
          acceptedLabel="PDF, JPG, PNG or WebP"
          extensions={ACCEPTED}
          onFiles={(files) => files[0] && pick(files[0])}
          multiple={false}
          maxSizeMb={100}
          title="Drop a scanned PDF, a JPG or a PNG"
          subtitle="Up to 100 MB · recognised in this tab · nothing is uploaded"
        />
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-raised p-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <ScanText className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold text-ink">{file.name}</p>
            <p className="text-[12px] text-subtle">
              {formatBytes(file.size)}
              {pageCount ? ` · ${pageCount} pages` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg px-2 py-1 text-[12.5px] font-medium text-subtle hover:text-danger"
          >
            Change
          </button>
        </div>
      )}

      {file && (
        <>
          {/\.pdf$/i.test(file.name) && (
            <div className="mt-4">
              <Field
                label="Pages to recognise"
                htmlFor="ocr-pages"
                hint={`Leave empty for the first ${MAX_PAGES} pages. Use 2-5, 9 or "all".`}
              >
                <input
                  id="ocr-pages"
                  className={inputClass}
                  value={pages}
                  onChange={(event) => setPages(event.target.value)}
                  placeholder={pageCount && pageCount > MAX_PAGES ? `1-${MAX_PAGES}` : "all"}
                />
              </Field>
            </div>
          )}

          <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl border border-line bg-raised p-3">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-brand-500"
              checked={searchable}
              onChange={(event) => setSearchable(event.target.checked)}
            />
            <span>
              <span className="block text-[13px] font-medium text-ink">Also build a searchable PDF</span>
              <span className="block text-[11.5px] leading-relaxed text-subtle">
                Keeps the page exactly as scanned and adds the recognised words underneath as invisible text, so Ctrl+F
                and copy work. The text file is always produced.
              </span>
            </span>
          </label>

          {textLayer && (
            <Notice tone="warning" className="mt-4">
              This PDF already has a text layer, so it was not a scan. OCR would only add a second, less accurate copy of
              the same words — try PDF to Word or PDF to Excel instead.
            </Notice>
          )}

          <Notice tone="info" className="mt-4">
            The OCR engine and its English language data are downloaded from this site the first time you run it (about
            7 MB, then cached by the browser). Recognition happens in a separate worker thread, so the tab stays
            responsive but a long document will take a few minutes. English only for now.
          </Notice>

          {error && (
            <Notice tone="danger" className="mt-4" onDismiss={() => setError(null)}>
              {error}
            </Notice>
          )}
          {note && (
            <Notice tone="info" className="mt-4" onDismiss={() => setNote(null)}>
              {note}
            </Notice>
          )}
          {busy && <ProgressBar value={progress.value} label={progress.label} />}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={run} disabled={busy} className="btn-primary w-full sm:w-auto">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ScanText className="h-4 w-4" aria-hidden="true" />}
              {busy ? "Recognising…" : "Recognise text"}
            </button>
            <p className="text-[12.5px] text-subtle">Printed text works best. Handwriting is not supported.</p>
          </div>
        </>
      )}
    </ToolFrame>
  );
}
