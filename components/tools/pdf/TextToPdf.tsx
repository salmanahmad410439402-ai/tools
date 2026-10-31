"use client";

import { useCallback, useMemo, useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import type { Block, PageFormat } from "@/lib/pdf/text-pdf";
import { renderBlocksToPdf } from "@/lib/pdf/text-pdf";
import { describeUnicodeSupport } from "@/lib/pdf/fonts";
import { docxToBlocks } from "@/lib/convert/docx";
import {
  htmlToBlocks,
  markdownToBlocks,
  parseCsv,
  rowsToBlocks,
  textToBlocks,
} from "@/lib/convert/text-sources";
import { track, sizeBucket } from "@/lib/analytics";
import { revokeResults, type ResultFile } from "@/lib/download";
import { fileBaseName, outputName } from "@/lib/utils";
import { Dropzone, Field, inputClass, Notice, ProgressBar, ResultsPanel, ToolFrame, selectClass } from "../kit";

export type TextSourceMode = "txt" | "docx" | "csv" | "markdown";

const CONFIG: Record<
  TextSourceMode,
  { accept: string; extensions: string[]; label: string; hint: string; paste: boolean; acceptLabel: string }
> = {
  txt: {
    accept: ".txt,.text,text/plain",
    extensions: ["txt", "text"],
    label: "Drop a .txt file or paste text below",
    hint: ".txt files, or paste directly — nothing is uploaded",
    paste: true,
    acceptLabel: "TXT",
  },
  docx: {
    accept: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extensions: ["docx"],
    label: "Drop your .docx file here",
    hint: ".docx only · legacy .doc is not supported · parsed in this tab",
    paste: false,
    acceptLabel: "DOCX",
  },
  csv: {
    accept: ".csv,.tsv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extensions: ["csv", "tsv", "xlsx"],
    label: "Drop a .csv, .tsv or .xlsx file",
    hint: "Comma, semicolon, tab or Excel workbook · parsed locally",
    paste: true,
    acceptLabel: "CSV, TSV, XLSX",
  },
  markdown: {
    accept: ".md,.markdown,.html,.htm,.txt,text/markdown,text/html",
    extensions: ["md", "markdown", "html", "htm", "txt"],
    label: "Drop a .md or .html file, or paste it below",
    hint: ".md, .markdown, .html or pasted source · no upload",
    paste: true,
    acceptLabel: "MD, HTML, TXT",
  },
};

export function TextToPdf({ mode }: { mode: TextSourceMode }) {
  const config = CONFIG[mode];
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [pageFormat, setPageFormat] = useState<PageFormat>("a4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [margin, setMargin] = useState("20");
  const [fontSize, setFontSize] = useState("11");
  const [lineHeight, setLineHeight] = useState("1.45");
  const [title, setTitle] = useState("");
  const [footer, setFooter] = useState("");
  const [headerRow, setHeaderRow] = useState(true);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [sheet, setSheet] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ value: 0, label: "" });
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [results, setResults] = useState<ResultFile[]>([]);

  const onFiles = useCallback(
    async (files: File[]) => {
      const picked = files[0];
      setError(null);
      setNote(null);
      setResults([]);
      setFile(picked);
      setSheetNames([]);
      setSheet("");
      track("tool_started", { tool: `${mode}-to-pdf` });

      if (mode === "csv" && /\.xlsx$/i.test(picked.name)) {
        try {
          const XLSX = await import("xlsx");
          const workbook = XLSX.read(await picked.arrayBuffer(), { type: "array" });
          setSheetNames(workbook.SheetNames);
          setSheet(workbook.SheetNames[0] ?? "");
        } catch {
          setNote("This workbook could not be read. Try exporting it as CSV instead.");
        }
      }

      if (config.paste && /\.(txt|md|markdown|html|htm|csv|tsv)$/i.test(picked.name)) {
        const content = await picked.text();
        // Large files are truncated in the textarea only; conversion uses the file.
        if (content.length < 40_000) setText(content);
      }
    },
    [config.paste, mode],
  );

  const reset = () => {
    revokeResults(results);
    setResults([]);
    setFile(null);
    setText("");
    setNote(null);
    setError(null);
    setProgress({ value: 0, label: "" });
  };

  const sourceText = useMemo(() => (file && text ? text : text), [file, text]);

  const buildBlocks = async (): Promise<Block[]> => {
    if (mode === "docx") {
      if (!file) throw new Error("Choose a .docx file first.");
      const { blocks, warnings } = await docxToBlocks(file);
      if (warnings) {
        setNote(
          `${warnings} part${warnings === 1 ? "" : "s"} of this document could not be represented (for example text boxes, charts or footnotes). Check the result against the original.`,
        );
      }
      return blocks;
    }

    if (mode === "csv") {
      if (file && /\.xlsx$/i.test(file.name)) {
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
        const target = workbook.Sheets[sheet || workbook.SheetNames[0]];
        if (!target) throw new Error("That worksheet could not be read.");
        const rows = XLSX.utils.sheet_to_json<string[]>(target, { header: 1, raw: false, defval: "" }) as string[][];
        return rowsToBlocks(rows, { headerRow });
      }
      const csvText = file ? await file.text() : text;
      if (!csvText.trim()) throw new Error("Add a CSV file or paste its contents first.");
      return rowsToBlocks(parseCsv(csvText), { headerRow });
    }

    if (!sourceText.trim() && file) {
      const content = await file.text();
      return mode === "markdown" && /\.html?$/i.test(file.name) ? htmlToBlocks(content) : mode === "markdown" ? markdownToBlocks(content) : textToBlocks(content);
    }
    if (!sourceText.trim()) throw new Error("Add a file or paste some text first.");

    if (mode === "markdown") {
      const looksLikeHtml = /<\/?(p|div|h[1-6]|ul|ol|table|body)\b/i.test(sourceText.slice(0, 2000));
      return looksLikeHtml ? htmlToBlocks(sourceText) : markdownToBlocks(sourceText);
    }
    return textToBlocks(sourceText);
  };

  const run = async () => {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      setProgress({ value: 0.2, label: "Reading the source" });
      const blocks = await buildBlocks();

      const plain = blocks
        .map((block) => {
          if (block.type === "heading" || block.type === "paragraph" || block.type === "quote") {
            return block.runs.map((run) => run.text).join("");
          }
          if (block.type === "list") return block.items.map((item) => item.map((run) => run.text).join("")).join(" ");
          if (block.type === "table") return [...(block.header ?? []), ...block.rows.flat()].join(" ");
          if (block.type === "code") return block.text;
          return "";
        })
        .join(" ");
      const support = describeUnicodeSupport(plain);
      if (!support.supported) {
        setNote(
          `Some characters in this document (${support.missing.join(" ")}) are outside the bundled font's coverage — Indic scripts, CJK and emoji are not supported yet. They may appear blank in the PDF.`,
        );
      }

      setProgress({ value: 0.55, label: "Laying out pages" });
      const result = await renderBlocksToPdf(blocks, {
        pageFormat,
        orientation,
        marginMm: Math.max(0, Math.min(60, Number(margin) || 0)),
        fontSize: Math.max(7, Math.min(20, Number(fontSize) || 11)),
        lineHeight: Math.max(1, Math.min(2.2, Number(lineHeight) || 1.45)),
        title: title.trim() || undefined,
        footer: footer.trim() || undefined,
      });

      const blob = new Blob([result.bytes as unknown as BlobPart], { type: "application/pdf" });
      const base = file ? fileBaseName(file.name) : "pasted-text";
      setResults([
        {
          id: "text-pdf",
          name: outputName(base, "", "pdf"),
          blob,
          size: blob.size,
          note: `${result.pages} page${result.pages === 1 ? "" : "s"} · selectable text${result.unicode ? " · Unicode font embedded" : ""}`,
        },
      ]);
      setProgress({ value: 1, label: "Done" });
      track("tool_completed", { tool: `${mode}-to-pdf`, pages: result.pages, size: sizeBucket(blob.size) });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The PDF could not be created.");
    } finally {
      setBusy(false);
    }
  };

  if (results.length) {
    return (
      <ToolFrame labelledBy="tool-title">
        <ResultsPanel files={results} onReset={reset} heading="Your PDF is ready" />
      </ToolFrame>
    );
  }

  return (
    <ToolFrame labelledBy="tool-title">
      <Dropzone
        accept={config.accept}
        acceptedLabel={config.acceptLabel}
        extensions={config.extensions}
        onFiles={onFiles}
        multiple={false}
        maxSizeMb={60}
        title={config.label}
        subtitle={config.hint}
      />

      {config.paste && (
        <div className="mt-4">
          <label htmlFor={`${mode}-text`} className="mb-1.5 block text-[12.5px] font-semibold text-ink">
            …or paste the content
          </label>
          <textarea
            id={`${mode}-text`}
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={6}
            placeholder={
              mode === "markdown"
                ? "# Title\n\nSome **bold** text and a list:\n\n- first item\n- second item"
                : mode === "csv"
                  ? "name,qty,price\nWidget,4,9.99"
                  : "Paste or write your text here…"
            }
            className="w-full rounded-xl border border-line bg-raised p-3 text-[13.5px] leading-relaxed text-ink shadow-inset outline-none transition-colors placeholder:text-subtle focus:border-brand-400 focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1 text-[11.5px] text-subtle">
            {text ? `${text.length.toLocaleString()} characters pasted` : "Nothing pasted yet."}
          </p>
        </div>
      )}

      {file && (
        <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-[12.5px] text-body">
          <span className="font-semibold text-ink">File:</span> {file.name}
          {mode === "csv" && sheetNames.length > 1 && (
            <span className="ml-3 inline-flex items-center gap-2">
              <label htmlFor="csv-sheet" className="text-[12px] font-medium text-ink">
                Sheet
              </label>
              <select
                id="csv-sheet"
                className="rounded-lg border border-line bg-raised px-2 py-1 text-[12px]"
                value={sheet}
                onChange={(event) => setSheet(event.target.value)}
              >
                {sheetNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </span>
          )}
        </p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Page size" htmlFor={`${mode}-format`}>
          <select
            id={`${mode}-format`}
            className={selectClass}
            value={pageFormat}
            onChange={(event) => setPageFormat(event.target.value as PageFormat)}
          >
            <option value="a4">A4 (210 × 297 mm)</option>
            <option value="letter">US Letter (8.5 × 11 in)</option>
            <option value="a5">A5 (148 × 210 mm)</option>
            <option value="legal">Legal (8.5 × 14 in)</option>
          </select>
        </Field>

        <Field label="Orientation" htmlFor={`${mode}-orientation`}>
          <select
            id={`${mode}-orientation`}
            className={selectClass}
            value={orientation}
            onChange={(event) => setOrientation(event.target.value as "portrait" | "landscape")}
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape (wider tables)</option>
          </select>
        </Field>

        <Field label="Margin (mm)" htmlFor={`${mode}-margin`}>
          <input
            id={`${mode}-margin`}
            type="number"
            min={0}
            max={60}
            className={inputClass}
            value={margin}
            onChange={(event) => setMargin(event.target.value)}
          />
        </Field>

        <Field label="Font size (pt)" htmlFor={`${mode}-size`}>
          <input
            id={`${mode}-size`}
            type="number"
            min={7}
            max={20}
            className={inputClass}
            value={fontSize}
            onChange={(event) => setFontSize(event.target.value)}
          />
        </Field>

        <Field label="Line height" htmlFor={`${mode}-leading`} hint="1.45 is comfortable; 1.2 is dense.">
          <input
            id={`${mode}-leading`}
            type="number"
            step="0.05"
            min={1}
            max={2.2}
            className={inputClass}
            value={lineHeight}
            onChange={(event) => setLineHeight(event.target.value)}
          />
        </Field>

        <Field label="Footer (optional)" htmlFor={`${mode}-footer`} hint="{n} and {total} are replaced.">
          <input
            id={`${mode}-footer`}
            className={inputClass}
            value={footer}
            onChange={(event) => setFooter(event.target.value)}
            placeholder="Page {n} of {total}"
          />
        </Field>

        <Field label="Document title (optional)" htmlFor={`${mode}-title`} className="sm:col-span-2">
          <input
            id={`${mode}-title`}
            className={inputClass}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Printed at the top of page 1"
          />
        </Field>

        {mode === "csv" && (
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-line bg-surface px-3 py-2.5">
            <input
              type="checkbox"
              checked={headerRow}
              onChange={(event) => setHeaderRow(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-brand-500"
            />
            <span className="text-[13px] text-body">
              <span className="font-semibold text-ink">First row is a header</span> — it repeats on every page.
            </span>
          </label>
        )}
      </div>

      {note && <Notice tone="info" className="mt-4">{note}</Notice>}
      {error && (
        <Notice tone="danger" className="mt-4" onDismiss={() => setError(null)}>
          {error}
        </Notice>
      )}
      {busy && <ProgressBar value={progress.value} label={progress.label || "Creating the PDF"} />}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={run} disabled={busy} className="btn-primary w-full sm:w-auto">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Wand2 className="h-4 w-4" aria-hidden="true" />}
          {busy ? "Creating PDF…" : "Create PDF"}
        </button>
        <p className="text-[12.5px] text-subtle">Text stays selectable — this is not a screenshot.</p>
      </div>
    </ToolFrame>
  );
}
