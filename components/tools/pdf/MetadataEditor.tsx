"use client";

import { useEffect, useState } from "react";
import { Loader2, Tag } from "lucide-react";
import { readMetadata, writeMetadata, type PdfMetadataFields } from "@/lib/pdf/ops";
import { track } from "@/lib/analytics";
import { revokeResults, type ResultFile } from "@/lib/download";
import { fileBaseName, formatBytes, outputName } from "@/lib/utils";
import { Field, inputClass, Notice, ProgressBar, ResultsPanel, ToolFrame } from "../kit";
import { PdfSource, usePdfInfo } from "./PdfSource";

const EMPTY: PdfMetadataFields = { title: "", author: "", subject: "", keywords: "", creator: "" };

export function MetadataEditor({ clearMode = false, toolSlug = "pdf-metadata" }: { clearMode?: boolean; toolSlug?: string } = {}) {
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<PdfMetadataFields>(EMPTY);
  const [original, setOriginal] = useState<PdfMetadataFields>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultFile[]>([]);
  const info = usePdfInfo(file);

  useEffect(() => {
    if (!file) {
      setFields(EMPTY);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const metadata = await readMetadata(await file.arrayBuffer());
        // Remove-metadata mode starts from empty fields so one click wipes them
        // all; the original values are still shown as a warning list.
        if (!cancelled) {
          setOriginal(metadata);
          setFields(clearMode ? EMPTY : metadata);
        }
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "This PDF could not be read.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file]);

  const reset = () => {
    revokeResults(results);
    setResults([]);
    setFile(null);
    setFields(EMPTY);
    setError(null);
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const bytes = await writeMetadata(await file.arrayBuffer(), fields);
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      setResults([
        {
          id: "metadata",
          name: outputName(fileBaseName(file.name), "metadata", "pdf"),
          blob,
          size: blob.size,
          originalSize: file.size,
          note: "Document properties rewritten; pages untouched",
        },
      ]);
      track("tool_completed", { tool: toolSlug });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The metadata could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  if (results.length) {
    return (
      <ToolFrame labelledBy="tool-title">
        <ResultsPanel files={results} onReset={reset} heading="Metadata saved" />
      </ToolFrame>
    );
  }

  return (
    <ToolFrame labelledBy="tool-title">
      <PdfSource
        file={file}
        onFile={(next) => { setFile(next); setError(null); }}
        onRemove={() => setFile(null)}
        subtitle="PDF only · existing title, author, subject and keywords are read locally"
      />

      {file && (
        <>
          {clearMode && !loading && (
            <div className="mt-4 rounded-xl border border-line bg-surface p-3.5">
              <p className="text-[12.5px] font-semibold text-ink">Properties found in this file</p>
              {(() => {
                const found = [
                  ["Title", original.title],
                  ["Author", original.author],
                  ["Subject", original.subject],
                  ["Keywords", original.keywords],
                  ["Creator", original.creator],
                ].filter(([, value]) => Boolean(value));
                if (!found.length) {
                  return (
                    <p className="mt-1 text-[12.5px] text-subtle">
                      None of the usual fields are set. Removing metadata will still normalise the file's dates.
                    </p>
                  );
                }
                return (
                  <ul className="mt-1.5 space-y-0.5 text-[12.5px] text-body">
                    {found.map(([label, value]) => (
                      <li key={label} className="truncate">
                        <span className="font-medium text-ink">{label}:</span> {value}
                      </li>
                    ))}
                  </ul>
                );
              })()}
              <p className="mt-1.5 text-[12px] text-subtle">All of these are cleared in the copy you download.</p>
            </div>
          )}

          {loading ? (
            <ProgressBar value={0.5} label="Reading document properties" />
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Title" htmlFor="meta-title" hint="Shown in the browser tab and in readers.">
                <input
                  id="meta-title"
                  className={inputClass}
                  value={fields.title}
                  onChange={(event) => setFields({ ...fields, title: event.target.value })}
                  placeholder="Invoice 2026-041"
                />
              </Field>
              <Field label="Author" htmlFor="meta-author">
                <input
                  id="meta-author"
                  className={inputClass}
                  value={fields.author}
                  onChange={(event) => setFields({ ...fields, author: event.target.value })}
                  placeholder="Your name or company"
                />
              </Field>
              <Field label="Subject" htmlFor="meta-subject">
                <input
                  id="meta-subject"
                  className={inputClass}
                  value={fields.subject}
                  onChange={(event) => setFields({ ...fields, subject: event.target.value })}
                  placeholder="One line describing the document"
                />
              </Field>
              <Field label="Keywords" htmlFor="meta-keywords" hint="Comma separated: invoice, 2026, supplier">
                <input
                  id="meta-keywords"
                  className={inputClass}
                  value={fields.keywords}
                  onChange={(event) => setFields({ ...fields, keywords: event.target.value })}
                />
              </Field>
              <Field label="Creator application" htmlFor="meta-creator" className="sm:col-span-2">
                <input
                  id="meta-creator"
                  className={inputClass}
                  value={fields.creator}
                  onChange={(event) => setFields({ ...fields, creator: event.target.value })}
                  placeholder="Filecraft"
                />
              </Field>
            </div>
          )}

          <p className="mt-3 text-[12px] text-subtle">
            Leave a field empty to remove that value. {info.pages ? `${info.pages} pages · ` : ""}
            {file ? formatBytes(file.size) : ""}
          </p>

          <Notice tone="info" className="mt-4">
            Editing metadata tidies the file — it does not make it anonymous. Fonts, images and annotations can still
            identify a source.
          </Notice>

          {info.error && <Notice tone="danger" className="mt-4">{info.error}</Notice>}
          {error && (
            <Notice tone="danger" className="mt-4" onDismiss={() => setError(null)}>
              {error}
            </Notice>
          )}
          {busy && <ProgressBar value={0.6} label="Writing document properties" />}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={run} disabled={busy || loading} className="btn-primary w-full sm:w-auto">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Tag className="h-4 w-4" aria-hidden="true" />}
              {busy ? "Saving…" : clearMode ? "Remove metadata and download" : "Save metadata"}
            </button>
            <p className="text-[12.5px] text-subtle">Pages, images and annotations are not re-encoded.</p>
          </div>
        </>
      )}
    </ToolFrame>
  );
}
