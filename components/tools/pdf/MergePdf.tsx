"use client";

import { useCallback, useState } from "react";
import { ArrowDown, ArrowUp, Combine, FileText, Loader2, Trash2 } from "lucide-react";
import { mergePdfs } from "@/lib/pdf/ops";
import { track, sizeBucket } from "@/lib/analytics";
import { revokeResults, type ResultFile } from "@/lib/download";
import { formatBytes, fileBaseName, outputName } from "@/lib/utils";
import { Dropzone, Notice, ProgressBar, ResultsPanel, ToolFrame } from "../kit";

interface Item {
  id: string;
  file: File;
  pages?: number;
}

export function MergePdf() {
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ value: 0, label: "" });
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultFile[]>([]);

  const addFiles = useCallback((files: File[]) => {
    setError(null);
    const next = files.map((file) => ({
      id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
      file,
    }));
    setItems((current) => [...current, ...next]);
    track("tool_started", { tool: "merge-pdf", files: files.length });
  }, []);

  const move = (index: number, direction: -1 | 1) => {
    setItems((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const reset = () => {
    revokeResults(results);
    setResults([]);
    setItems([]);
    setError(null);
    setProgress({ value: 0, label: "" });
  };

  const merge = async () => {
    if (items.length < 2) {
      setError("Add at least two PDFs to merge.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload = [];
      for (let index = 0; index < items.length; index += 1) {
        setProgress({ value: index / (items.length + 1), label: `Reading ${items[index].file.name}` });
        payload.push({ name: items[index].file.name, bytes: await items[index].file.arrayBuffer() });
      }
      setProgress({ value: 0.75, label: "Combining pages" });
      const bytes = await mergePdfs(payload);
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      const name = outputName(`${fileBaseName(items[0].file.name)}-merged`, "", "pdf");
      setResults([
        {
          id: "merged",
          name,
          blob,
          size: blob.size,
          originalName: `${items.length} files`,
          note: `Combined from ${items.length} documents`,
        },
      ]);
      setProgress({ value: 1, label: "Done" });
      track("tool_completed", { tool: "merge-pdf", files: items.length, size: sizeBucket(blob.size) });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The PDFs could not be merged.");
    } finally {
      setBusy(false);
    }
  };

  if (results.length) {
    return (
      <ToolFrame labelledBy="tool-title">
        <ResultsPanel files={results} onReset={reset} heading="Your merged PDF is ready" />
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
        title={items.length ? "Add more PDFs" : "Drop your PDFs here or click to choose"}
        subtitle="PDF only · up to 150 MB per file · add two or more files"
      />

      {items.length > 0 && (
        <>
          <p className="mt-4 text-[12.5px] font-semibold text-ink">Merge order ({items.length} files)</p>
          <ul className="mt-2 space-y-2" aria-label="Files in merge order">
            {items.map((item, index) => (
              <li key={item.id} className="flex items-center gap-2 rounded-xl border border-line bg-raised p-2 pl-3">
                <span className="w-5 shrink-0 text-center text-[11.5px] font-semibold text-subtle">{index + 1}</span>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium text-ink">{item.file.name}</span>
                  <span className="text-[11.5px] text-subtle">{formatBytes(item.file.size)}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="grid h-8 w-8 place-items-center rounded-lg text-subtle hover:bg-surface hover:text-ink disabled:opacity-30"
                    aria-label={`Move ${item.file.name} earlier`}
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1}
                    className="grid h-8 w-8 place-items-center rounded-lg text-subtle hover:bg-surface hover:text-ink disabled:opacity-30"
                    aria-label={`Move ${item.file.name} later`}
                  >
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
                    className="grid h-8 w-8 place-items-center rounded-lg text-subtle hover:bg-danger/5 hover:text-danger"
                    aria-label={`Remove ${item.file.name}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </span>
              </li>
            ))}
          </ul>

          {error && (
            <Notice tone="danger" className="mt-4" onDismiss={() => setError(null)}>
              {error}
            </Notice>
          )}

          {busy && <ProgressBar value={progress.value} label={progress.label || "Merging…"} />}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={merge} disabled={busy || items.length < 2} className="btn-primary w-full sm:w-auto">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Combine className="h-4 w-4" aria-hidden="true" />}
              {busy ? "Merging…" : `Merge ${items.length} PDFs`}
            </button>
            <p className="text-[12.5px] text-subtle">Pages are copied, not re-rendered — quality stays identical.</p>
          </div>
        </>
      )}

      {items.length === 0 && (
        <p className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-surface px-4 py-3 text-[12.5px] text-subtle">
          <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
          Everything stays on your device — merging a contract never uploads it.
        </p>
      )}
    </ToolFrame>
  );
}
