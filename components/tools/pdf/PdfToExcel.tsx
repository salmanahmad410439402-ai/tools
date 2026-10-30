"use client";

import { useState } from "react";
import { Loader2, Table2 } from "lucide-react";
import { readPdfLayout } from "@/lib/convert/pdf-text";
import { cellValue, linesToTable } from "@/lib/convert/pdf-layout";
import { buildXlsx, type WorkbookSheet } from "@/lib/convert/xlsx-write";
import { track } from "@/lib/analytics";
import { revokeResults, type ResultFile } from "@/lib/download";
import { fileBaseName, outputName } from "@/lib/utils";
import { Field, inputClass, Notice, ProgressBar, ResultsPanel, Segmented, ToolFrame } from "../kit";
import { PdfSource, usePdfInfo } from "./PdfSource";

export function PdfToExcel() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState("");
  const [layout, setLayout] = useState<"sheets" | "single">("sheets");
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
        setProgress({ value: value * 0.75, label }),
      );

      const sheets: WorkbookSheet[] = [];
      let totalRows = 0;
      let totalCells = 0;

      if (layout === "single") {
        const rows: (string | number)[][] = [];
        for (const page of layoutPages) {
          const table = linesToTable(page.lines);
          if (!table.length) continue;
          if (rows.length) rows.push([]);
          for (const row of table) rows.push(row.map(cellValue));
        }
        if (rows.length) {
          sheets.push({ name: "Sheet1", rows, header: false });
          totalRows = rows.length;
          totalCells = rows.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
        }
      } else {
        for (const page of layoutPages) {
          const table = linesToTable(page.lines);
          if (!table.length) continue;
          const rows = table.map((row) => row.map(cellValue));
          sheets.push({ name: `Page ${page.pageNumber}`, rows, header: false });
          totalRows += rows.length;
          totalCells += rows.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
        }
      }

      if (!sheets.length) {
        setError(
          imageOnly
            ? "This PDF has no text layer — every page is a picture. Run OCR PDF first, then convert the searchable result."
            : "No rows could be rebuilt from the selected pages.",
        );
        return;
      }

      setProgress({ value: 0.9, label: "Writing the workbook" });
      const bytes = await buildXlsx(sheets, fileBaseName(file.name));
      const blob = new Blob([bytes as unknown as BlobPart], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      setResults([
        {
          id: "xlsx",
          name: outputName(fileBaseName(file.name), "", "xlsx"),
          blob,
          size: blob.size,
          originalSize: file.size,
          note: `${sheets.length} sheet${sheets.length === 1 ? "" : "s"} · ${totalRows} rows · ${totalCells} filled cells`,
        },
      ]);
      track("tool_completed", { tool: "pdf-to-excel", sheets: sheets.length });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The spreadsheet could not be built.");
    } finally {
      setBusy(false);
    }
  };

  if (results.length) {
    return (
      <ToolFrame labelledBy="tool-title">
        <ResultsPanel files={results} onReset={reset} heading="Your workbook is ready" compare="conversion" />
        <div className="mt-4">
          <Notice tone="info">
            Numbers were written as numbers so they can be summed; everything else is text. Column positions follow the
            gaps between words in the PDF, so a table with merged cells or vertical rules may need tidying in Excel.
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
        subtitle="PDF only · tables rebuilt in this tab · nothing is uploaded"
      />

      {file && (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Pages" htmlFor="excel-pages" hint="Leave empty for the whole document.">
              <input
                id="excel-pages"
                className={inputClass}
                value={pages}
                onChange={(event) => setPages(event.target.value)}
                placeholder="all"
              />
            </Field>
            <div />
          </div>

          <div className="mt-4">
            <Segmented
              label="How the sheets are arranged"
              value={layout}
              onChange={setLayout}
              options={[
                { value: "sheets", label: "One sheet per page", hint: "Keeps page numbers in the tab names." },
                { value: "single", label: "One long sheet", hint: "All pages stacked in a single table." },
              ]}
            />
          </div>

          <p className="mt-3 text-[12px] text-subtle">
            {info.pages ? `${info.pages} pages · ` : ""}Rows come from text baselines, columns from the gaps between words.
          </p>

          <Notice tone="info" className="mt-4">
            This is table extraction, not page copying. It works well on invoices, bank statements and reports with
            clear columns. A design with merged cells, rotated text or no whitespace between columns will need manual
            tidying — no browser tool can rebuild that reliably.
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
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Table2 className="h-4 w-4" aria-hidden="true" />}
              {busy ? "Extracting…" : "Convert to Excel"}
            </button>
            <p className="text-[12.5px] text-subtle">Opens in Excel, Numbers, LibreOffice and Google Sheets.</p>
          </div>
        </>
      )}
    </ToolFrame>
  );
}
