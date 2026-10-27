"use client";

import { useEffect, useState } from "react";
import { FileText, Trash2 } from "lucide-react";
import { countPages } from "@/lib/pdf/core";
import { describePdfError } from "@/lib/pdf/pdfjs";
import { formatBytes } from "@/lib/utils";
import { Dropzone } from "../kit";

/** Dropzone-or-file-card used by every single-file PDF tool. */
export function PdfSource({
  file,
  onFile,
  onRemove,
  title = "Drop your PDF here or click to choose",
  subtitle = "PDF only · up to 200 MB · nothing is uploaded",
  dropzoneId,
}: {
  file: File | null;
  onFile: (file: File) => void;
  onRemove: () => void;
  title?: string;
  subtitle?: string;
  dropzoneId?: string;
}) {
  if (!file) {
    return (
      <Dropzone
        id={dropzoneId}
        accept="application/pdf,.pdf"
        acceptedLabel="PDF"
        extensions={["pdf"]}
        onFiles={(files) => files[0] && onFile(files[0])}
        multiple={false}
        maxSizeMb={200}
        title={title}
        subtitle={subtitle}
      />
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
        <FileText className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-ink">{file.name}</p>
        <p className="text-[12px] text-subtle">{formatBytes(file.size)}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="grid h-9 w-9 place-items-center rounded-lg text-subtle hover:bg-danger/5 hover:text-danger"
        aria-label={`Remove ${file.name}`}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

/** Page count + encryption pre-check, with a friendly error message. */
export function usePdfInfo(file: File | null) {
  const [state, setState] = useState<{ pages: number; error: string | null; loading: boolean }>({
    pages: 0,
    error: null,
    loading: false,
  });

  useEffect(() => {
    if (!file) {
      setState({ pages: 0, error: null, loading: false });
      return undefined;
    }
    let cancelled = false;
    setState({ pages: 0, error: null, loading: true });
    (async () => {
      try {
        const pages = await countPages(await file.arrayBuffer());
        if (!cancelled) setState({ pages, error: null, loading: false });
      } catch (error) {
        if (!cancelled) {
          setState({
            pages: 0,
            error: error instanceof Error ? error.message : describePdfError(error),
            loading: false,
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file]);

  return state;
}

/** Page selection input ("all" or a range string) shared by numbering/rotation. */
export function PageSelection({
  id,
  value,
  onChange,
  pageCount,
  label = "Pages",
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  pageCount: number;
  label?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[12.5px] font-semibold text-ink">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={pageCount ? `all ${pageCount} pages` : "all pages"}
        className="h-11 w-full rounded-xl border border-line bg-white px-3 text-[14px] text-ink shadow-inset outline-none transition-colors placeholder:text-subtle focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15"
      />
      <p className="mt-1 text-[11.5px] text-subtle">Leave blank for every page, or type a range such as 2-5, 8.</p>
    </div>
  );
}
