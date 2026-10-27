"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { ACCEPT_IMAGE, INPUT_EXTENSIONS } from "@/lib/images";
import { readExif, stripMetadata, type ExifReport } from "@/lib/images/exif";
import { sizeBucket, track } from "@/lib/analytics";
import { downloadBlob, makePreviewUrl, revokeResults, type ResultFile } from "@/lib/download";
import { formatBytes, outputName } from "@/lib/utils";
import { Dropzone, Notice, ResultsPanel, ToolFrame } from "./kit";

interface Props {
  toolSlug?: string;
}

const GROUPS = ["Image", "Exif", "GPS", "Interop", "Text"];

export function ExifTool({ toolSlug = "exif-remover" }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [report, setReport] = useState<ExifReport | null>(null);
  const [reading, setReading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keepIcc, setKeepIcc] = useState(true);
  const [results, setResults] = useState<ResultFile[]>([]);

  const urls = useRef<Set<string>>(new Set());
  const createUrl = useCallback((blob: Blob) => {
    const url = makePreviewUrl(blob);
    urls.current.add(url);
    return url;
  }, []);
  useEffect(() => {
    const created = urls.current;
    return () => {
      created.forEach((url) => URL.revokeObjectURL(url));
      created.clear();
    };
  }, []);

  const inspect = useCallback(
    async (files: File[]) => {
      const next = files[0];
      if (!next) return;
      setError(null);
      setResults([]);
      setReading(true);
      try {
        const parsed = await readExif(next);
        setReport(parsed);
        setFile(next);
        if (preview) {
          URL.revokeObjectURL(preview);
          urls.current.delete(preview);
        }
        setPreview(createUrl(next));
        track("tool_started", { tool: toolSlug, files: 1 });
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "This file could not be read.");
      } finally {
        setReading(false);
      }
    },
    [createUrl, preview, toolSlug],
  );

  const reset = () => {
    revokeResults(results);
    urls.current.forEach((url) => URL.revokeObjectURL(url));
    urls.current.clear();
    setResults([]);
    setFile(null);
    setPreview(null);
    setReport(null);
    setError(null);
  };

  const removeMetadata = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const stripped = await stripMetadata(file, { keepColorProfile: keepIcc });
      const extension = stripped.blob.type === "image/png" ? "png" : stripped.blob.type === "image/webp" ? "webp" : "jpg";
      const result: ResultFile = {
        id: `${file.name}-clean`,
        name: outputName(file.name, "no-metadata", extension),
        blob: stripped.blob,
        size: stripped.blob.size,
        originalSize: file.size,
        originalName: file.name,
        note: stripped.changed
          ? `${stripped.removed.length} block(s) removed, ${formatBytes(stripped.removedBytes)} of metadata`
          : "Nothing was found to remove — the file is unchanged",
        previewUrl: createUrl(stripped.blob),
      };
      setResults([result]);
      if (stripped.changed) {
        track("tool_completed", { tool: toolSlug, files: 1, size: sizeBucket(stripped.blob.size) });
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Metadata could not be removed from this file.");
    } finally {
      setBusy(false);
    }
  };

  if (results.length) {
    return (
      <ToolFrame labelledBy="tool-title">
        {error && (
          <Notice tone="warning" className="mb-4" onDismiss={() => setError(null)}>
            {error}
          </Notice>
        )}
        <ResultsPanel
          files={results}
          onReset={reset}
          heading="Cleaned copy ready"
          compare="compression"
          extra={
            <div className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-subtle">
              <p>
                The pixels were copied, not re-encoded, so the image itself is byte-identical to the original — only the
                metadata blocks were cut out.
              </p>
              <p>
                Upload this copy instead of the original anywhere the location or camera model should stay private.
              </p>
            </div>
          }
        />
      </ToolFrame>
    );
  }

  return (
    <ToolFrame labelledBy="tool-title">
      {!file || !report ? (
        <Dropzone
          accept={ACCEPT_IMAGE}
          acceptedLabel="JPG, PNG or WebP"
          extensions={INPUT_EXTENSIONS}
          onFiles={inspect}
          multiple={false}
          maxSizeMb={100}
          title={reading ? "Reading the metadata…" : "Drop a photo here to inspect its metadata"}
          subtitle="JPEG, PNG and WebP · nothing is uploaded · removal is lossless"
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt=""
                className="h-16 w-16 rounded-xl border border-line object-cover"
                loading="lazy"
                decoding="async"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-ink">{file.name}</p>
              <p className="text-[12px] text-subtle">
                {formatBytes(file.size)} · {report.container} ·{" "}
                {report.metadataBytes > 0 ? `${formatBytes(report.metadataBytes)} of metadata` : "no metadata blocks found"}
              </p>
            </div>
            <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-subtle">
              {report.tags.length} field{report.tags.length === 1 ? "" : "s"}
            </span>
          </div>

          {report.hasGps && (
            <Notice tone="warning" className="mt-4">
              <strong className="font-semibold">This photo contains GPS coordinates.</strong> They travel with the file
              and can pinpoint where it was taken. Remove them before sharing it publicly.
            </Notice>
          )}

          {report.orientation !== 1 && (
            <Notice tone="info" className="mt-4">
              This photo carries an orientation tag ({report.orientation}). Browsers and phone galleries rotate it
              automatically, while some desktop viewers do not. If it looks sideways after cleaning, open it on the{" "}
              <a href="/crop-image/" className="link">
                crop and rotate page
              </a>{" "}
              first: that writes the rotation into the pixels.
            </Notice>
          )}

          {report.problem && (
            <Notice tone="info" className="mt-4">
              {report.problem}
            </Notice>
          )}

          {report.tags.length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-line">
              <table className="w-full text-left text-[12.5px]">
                <caption className="sr-only">Metadata found in this file</caption>
                <thead className="bg-surface text-[11px] uppercase tracking-wide text-subtle">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-semibold">Field</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {GROUPS.flatMap((group) =>
                    report.tags
                      .filter((tag) => tag.group === group)
                      .map((tag) => (
                        <tr key={`${group}-${tag.name}`} className="bg-raised">
                          <th scope="row" className="whitespace-nowrap px-3 py-2 font-medium text-body">
                            {tag.name}
                            <span className="ml-1.5 text-[10px] uppercase tracking-wide text-subtle">{group}</span>
                          </th>
                          <td className="break-words px-3 py-2 font-mono text-[12px] text-ink">{tag.value || "—"}</td>
                        </tr>
                      )),
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-line bg-surface px-4 py-3 text-[13px] text-subtle">
              {report.problem
                ? "No readable fields were found — the details are in the note above."
                : "This file carries no EXIF fields. Screenshots, exported PNGs and images that have already been through a converter usually look like this."}
            </p>
          )}

          {report.removable.length > 0 && (
            <div className="mt-4 rounded-xl border border-line bg-surface p-4">
              <p className="text-[12.5px] font-semibold text-ink">What would be removed</p>
              <ul className="mt-1.5 space-y-1 text-[12px] leading-relaxed text-subtle">
                {report.removable.map((item) => (
                  <li key={item} className="flex items-start gap-1.5">
                    <Trash2 className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <label className="mt-3 flex items-center gap-2 text-[12.5px] text-body">
                <input
                  type="checkbox"
                  checked={keepIcc}
                  onChange={(event) => setKeepIcc(event.target.checked)}
                  className="h-4 w-4 accent-brand-500"
                />
                Keep the ICC colour profile (recommended — colours can shift without it)
              </label>
            </div>
          )}

          {error && (
            <Notice tone="danger" className="mt-4" onDismiss={() => setError(null)}>
              {error}
            </Notice>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={removeMetadata} disabled={busy} className="btn-primary w-full sm:w-auto">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
              {busy ? "Removing…" : "Remove metadata and download"}
            </button>
            <button type="button" onClick={reset} className="btn-secondary w-full sm:w-auto">
              <Eye className="h-4 w-4" aria-hidden="true" />
              Inspect another photo
            </button>
          </div>
          <p className="mt-2 text-[11.5px] leading-relaxed text-subtle">
            The download is built in your tab and never uploaded. The original file on your disk is left untouched.
          </p>
        </>
      )}

      {file && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={reset} className="text-[12px] font-semibold text-subtle hover:text-danger">
            Clear
          </button>
          <button
            type="button"
            onClick={() => file && downloadBlob(file, file.name)}
            className="text-[12px] font-semibold text-subtle hover:text-body"
          >
            Download the original again
          </button>
        </div>
      )}
    </ToolFrame>
  );
}
