"use client";

import { useCallback, useState } from "react";
import { FileText, Loader2, Minimize2, Trash2 } from "lucide-react";
import { compressPdf, inspectPdf, type CompressionLevel } from "@/lib/pdf/compress";
import { sizeBucket, track } from "@/lib/analytics";
import { revokeResults, type ResultFile } from "@/lib/download";
import { formatBytes, outputName, percentSaved } from "@/lib/utils";
import { Dropzone, Field, Notice, ProgressBar, ResultsPanel, Segmented, ToolFrame, selectClass } from "./kit";

interface QueueItem {
  id: string;
  file: File;
  pages?: number;
  encrypted?: boolean;
}

const TARGETS = [
  { value: "none", label: "No target — smallest possible", bytes: undefined },
  { value: "200", label: "Under 200 KB", bytes: 200 * 1024 },
  { value: "500", label: "Under 500 KB", bytes: 500 * 1024 },
  { value: "1024", label: "Under 1 MB", bytes: 1024 * 1024 },
  { value: "2048", label: "Under 2 MB", bytes: 2048 * 1024 },
  { value: "5120", label: "Under 5 MB", bytes: 5 * 1024 * 1024 },
];

export function CompressPdf() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [level, setLevel] = useState<CompressionLevel>("recommended");
  const [target, setTarget] = useState("none");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ value: 0, label: "" });
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultFile[]>([]);

  const addFiles = useCallback(async (files: File[]) => {
    setError(null);
    const queued: QueueItem[] = files.map((file) => ({
      id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
      file,
    }));
    setItems((current) => [...current, ...queued]);
    track("tool_started", { tool: "compress-pdf", files: files.length });
    for (const item of queued) {
      const info = await inspectPdf(item.file);
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, pages: info.pages, encrypted: info.encrypted } : entry,
        ),
      );
    }
  }, []);

  const reset = () => {
    revokeResults(results);
    setResults([]);
    setItems([]);
    setError(null);
    setProgress({ value: 0, label: "" });
  };

  const run = async () => {
    if (!items.length) return;
    setBusy(true);
    setError(null);
    setResults([]);
    const targetBytes = TARGETS.find((entry) => entry.value === target)?.bytes;
    const output: ResultFile[] = [];

    try {
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        const outcome = await compressPdf(item.file, {
          level,
          targetBytes: level === "strong" ? targetBytes : undefined,
          onProgress: (ratio, label) =>
            setProgress({
              value: (index + ratio) / items.length,
              label: items.length > 1 ? `${item.file.name}: ${label}` : label,
            }),
        });

        const name = outputName(item.file.name, "compressed", "pdf");
        const saved = percentSaved(item.file.size, outcome.blob.size);
        const bigger = outcome.blob.size >= item.file.size;
        const notes = [outcome.note];
        if (bigger) {
          notes.push("This file is larger than the original — download only if you need the rasterised version.");
        } else if (level === "strong" && targetBytes && outcome.blob.size > targetBytes) {
          notes.push(`It could not reach ${formatBytes(targetBytes)} without destroying legibility, so this is the smallest honest attempt.`);
        }

        output.push({
          id: item.id,
          name,
          blob: outcome.blob,
          size: outcome.blob.size,
          originalSize: item.file.size,
          originalName: item.file.name,
          note: notes.join(" "),
        });
      }

      setResults(output);
      setProgress({ value: 1, label: "Done" });
      track("tool_completed", {
        tool: "compress-pdf",
        level,
        files: output.length,
        size: sizeBucket(output.reduce((sum, file) => sum + file.size, 0)),
        saved: output.reduce((sum, file) => sum + (file.originalSize ?? 0) - file.size, 0),
      });
      if (output.every((file) => file.size >= (file.originalSize ?? 0))) {
        setError("None of these files got smaller. They are probably already optimised — the original is the better file to keep.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Compression failed. Try a different level or file.");
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
          heading="Compression finished"
          extra={
            <div className="mt-3">
              <Notice tone="info">
                Open the compressed file before you send it. Small print, signatures and barcodes are the first
                things to suffer — if they look mushy, re-run at Light and keep text selectable.
              </Notice>
            </div>
          }
        />
        {error && (
          <Notice tone="warning" className="mt-3" onDismiss={() => setError(null)}>
            {error}
          </Notice>
        )}
      </ToolFrame>
    );
  }

  return (
    <ToolFrame labelledBy="tool-title">
      <Dropzone
        accept="application/pdf,.pdf"
        acceptedLabel="PDF"
        extensions={["pdf"]}
        onFiles={addFiles}
        maxSizeMb={150}
        title={items.length ? "Add more PDFs" : "Drop your PDF here or click to choose"}
        subtitle="PDF only · up to 150 MB per file · several files at once is fine"
      />

      {items.length > 0 && (
        <>
          <ul className="mt-4 space-y-2" aria-label="PDFs to compress">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-xl border border-line bg-white px-3 py-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium text-ink">{item.file.name}</span>
                  <span className="text-[11.5px] text-subtle">
                    {formatBytes(item.file.size)}
                    {item.pages ? ` · ${item.pages} page${item.pages === 1 ? "" : "s"}` : ""}
                    {item.encrypted ? " · password-protected" : ""}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
                  className="grid h-8 w-8 place-items-center rounded-lg text-subtle hover:bg-danger/5 hover:text-danger"
                  aria-label={`Remove ${item.file.name}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>

          {items.some((item) => item.encrypted) && (
            <Notice tone="warning" className="mt-3">
              One of these PDFs is password-protected. Export an unlocked copy from a viewer where you know the
              password, then compress that copy. This tool never removes protection from files it cannot open.
            </Notice>
          )}

          <div className="mt-5">
            <Segmented<CompressionLevel>
              label="Compression level"
              value={level}
              onChange={setLevel}
              options={[
                { value: "light", label: "Light", hint: "Cleanest file, keeps text, small saving" },
                { value: "recommended", label: "Recommended", hint: "Recompresses images, keeps text" },
                { value: "strong", label: "Strong", hint: "Rasterises pages — text becomes an image" },
              ]}
            />
          </div>

          {level === "strong" && (
            <>
              <div className="mt-4 grid gap-4 sm:max-w-sm">
                <Field
                  label="Target size"
                  htmlFor="cpdf-target"
                  hint="Only the Strong level can chase a target size, because it is allowed to change the page images."
                >
                  <select id="cpdf-target" className={selectClass} value={target} onChange={(event) => setTarget(event.target.value)}>
                    {TARGETS.map((entry) => (
                      <option key={entry.value} value={entry.value}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Notice tone="warning" className="mt-3">
                <strong className="font-semibold">Strong makes text unselectable.</strong> Each page is re-rendered at
                150 DPI or lower, so links, form fields and searchable text are lost. Use it for scans and photos,
                not for documents you may need to edit or search later.
              </Notice>
            </>
          )}

          <Notice tone="info" className="mt-3">
            <strong className="font-semibold">What Light and Recommended actually do:</strong> they rebuild the PDF
            structure, drop metadata and recompress oversized JPEG images. Text stays selectable. Scanned PDFs gain
            most; text-only PDFs are already efficient and may only save 2–10%.
          </Notice>

          {error && (
            <Notice tone="danger" className="mt-4" onDismiss={() => setError(null)}>
              {error}
            </Notice>
          )}

          {busy && <ProgressBar value={progress.value} label={progress.label || "Compressing…"} />}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={run} disabled={busy} className="btn-primary w-full sm:w-auto">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Minimize2 className="h-4 w-4" aria-hidden="true" />}
              {busy ? "Compressing…" : "Compress PDF"}
            </button>
            <p className="text-[12.5px] text-subtle">You will see the exact before and after size.</p>
          </div>
        </>
      )}

      {items.length === 0 && (
        <p className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-surface px-4 py-3 text-[12.5px] text-subtle">
          <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
          Your PDF is opened locally, so compression starts instantly — there is no upload wait.
        </p>
      )}
    </ToolFrame>
  );
}
