"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Download,
  FileText,
  FolderOpen,
  Info,
  Loader2,
  RotateCcw,
  Upload,
  X,
} from "lucide-react";
import { downloadBlob, downloadZip, type ResultFile } from "@/lib/download";
import { cn, formatBytes, percentSaved } from "@/lib/utils";

/* ────────────────────────────── Containers ─────────────────────────────── */

export function ToolFrame({
  children,
  className,
  labelledBy,
}: {
  children: React.ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  return (
    <section
      aria-labelledby={labelledBy}
      className={cn(
        "rounded-[22px] border border-line bg-raised p-4 shadow-card sm:p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function ToolHeading({
  id = "tool-title",
  children,
  hint,
}: {
  id?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h2 id={id} className="sr-only">
        {children}
      </h2>
      {hint && <p className="text-[13px] text-subtle">{hint}</p>}
    </div>
  );
}

/* ─────────────────────────────── Dropzone ──────────────────────────────── */

interface DropzoneProps {
  accept: string;
  acceptedLabel: string;
  extensions: string[];
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  maxSizeMb?: number;
  disabled?: boolean;
  compact?: boolean;
  title?: string;
  subtitle?: string;
  id?: string;
}

export function Dropzone({
  accept,
  acceptedLabel,
  extensions,
  onFiles,
  multiple = true,
  maxSizeMb = 200,
  disabled = false,
  compact = false,
  title = "Drop files here or click to choose",
  subtitle,
  id,
}: DropzoneProps) {
  const generatedId = useId();
  const inputId = id ?? `dropzone-${generatedId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState<string[]>([]);
  const dragDepth = useRef(0);

  const handleFiles = useCallback(
    (incoming: FileList | File[] | null) => {
      if (!incoming) return;
      const list = Array.from(incoming);
      if (!list.length) return;
      const accepted: File[] = [];
      const problems: string[] = [];

      for (const file of list) {
        const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
        const typeOk =
          extensions.includes(extension) ||
          file.type === accept ||
          (accept.endsWith("/*") && file.type.startsWith(accept.replace("*", "")));
        if (!typeOk) {
          problems.push(`${file.name}: this file type is not supported here (${acceptedLabel}).`);
          continue;
        }
        if (file.size > maxSizeMb * 1024 * 1024) {
          problems.push(`${file.name}: ${formatBytes(file.size)} is over the ${maxSizeMb} MB limit for one file.`);
          continue;
        }
        if (file.size === 0) {
          problems.push(`${file.name}: the file is empty.`);
          continue;
        }
        accepted.push(file);
      }

      setRejected(problems.slice(0, 3));
      if (accepted.length) onFiles(multiple ? accepted : accepted.slice(0, 1));
    },
    [accept, acceptedLabel, extensions, maxSizeMb, multiple, onFiles],
  );

  // Paste support: images and files copied from the file manager.
  useEffect(() => {
    if (disabled) return undefined;
    const onPaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      const files = event.clipboardData?.files;
      if (files && files.length) {
        event.preventDefault();
        handleFiles(files);
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [handleFiles, disabled]);

  return (
    <div>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-describedby={`${inputId}-hint`}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          dragDepth.current += 1;
          if (!disabled) setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault();
          dragDepth.current -= 1;
          if (dragDepth.current <= 0) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          dragDepth.current = 0;
          setDragging(false);
          if (!disabled) handleFiles(event.dataTransfer?.files ?? null);
        }}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 text-center transition-colors duration-150",
          compact ? "py-6" : "py-10 sm:py-12",
          dragging
            ? "border-brand-500 bg-brand-50"
            : "border-line bg-surface hover:border-brand-300 hover:bg-brand-50/50",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <span
          className={cn(
            "grid place-items-center rounded-2xl bg-raised text-brand-600 shadow-sm ring-1 ring-line transition-transform group-hover:scale-[1.03]",
            compact ? "h-10 w-10" : "h-14 w-14",
          )}
        >
          <Upload className={compact ? "h-4 w-4" : "h-6 w-6"} aria-hidden="true" />
        </span>
        <span className={cn("mt-3 font-semibold text-ink", compact ? "text-[14px]" : "text-[16px] sm:text-[17px]")}>
          {title}
        </span>
        <span id={`${inputId}-hint`} className="mt-1 max-w-md text-[13px] leading-relaxed text-subtle">
          {subtitle ?? `${acceptedLabel} · up to ${maxSizeMb} MB per file · or paste with ⌘V`}
        </span>
        {!compact && (
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-raised px-3 py-1 text-[11.5px] font-medium text-body ring-1 ring-line">
            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
            Files stay on your device
          </span>
        )}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="sr-only"
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {rejected.length > 0 && (
        <ul className="mt-3 space-y-1" role="alert">
          {rejected.map((message) => (
            <li key={message} className="flex items-start gap-2 rounded-lg bg-danger/5 px-3 py-2 text-[12.5px] text-danger">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ────────────────────────────── Progress ───────────────────────────────── */

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const percent = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  return (
    <div className="mt-4" aria-live="polite">
      <div className="flex items-center justify-between text-[13px] font-medium text-body">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-500" aria-hidden="true" />
          {label}
        </span>
        <span className="tabular-nums text-subtle">{percent}%</span>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-brand-50"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={label}
      >
        <div
          className="h-full rounded-full bg-brand-500 transition-[width] duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────── Alerts ────────────────────────────────── */

const toneStyles = {
  info: { wrap: "border-brand-100 bg-brand-50 text-brand-700", icon: Info },
  success: { wrap: "border-success/20 bg-success/5 text-success", icon: CheckCircle2 },
  warning: { wrap: "border-warning/25 bg-warning/5 text-warning", icon: AlertCircle },
  danger: { wrap: "border-danger/25 bg-danger/5 text-danger", icon: AlertCircle },
} as const;

export function Notice({
  tone = "info",
  children,
  className,
  onDismiss,
}: {
  tone?: keyof typeof toneStyles;
  children: React.ReactNode;
  className?: string;
  onDismiss?: () => void;
}) {
  const style = toneStyles[tone];
  const Icon = style.icon;
  return (
    <div className={cn("flex items-start gap-2.5 rounded-xl border px-4 py-3 text-[13px] leading-relaxed", style.wrap, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded p-1 opacity-70 transition-opacity hover:opacity-100"
          aria-label="Dismiss message"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/* ──────────────────────────── Results panel ────────────────────────────── */

export function ResultsPanel({
  files,
  onReset,
  zipName,
  zipLabel = "Download all as ZIP",
  heading = "Your files are ready",
  extra,
  compare = "compression",
}: {
  files: ResultFile[];
  onReset: () => void;
  zipName?: string;
  zipLabel?: string;
  heading?: string;
  extra?: React.ReactNode;
  /**
   * "compression" reports savings (the default, right for PDF/image compression);
   * "conversion" reports the size change in either direction, because a format
   * change is not supposed to shrink anything.
   */
  compare?: "compression" | "conversion";
}) {
  const [zipping, setZipping] = useState(false);
  if (!files.length) return null;
  const total = files.reduce((sum, file) => sum + file.size, 0);

  return (
    <div className="animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-success/20 bg-success/5 px-4 py-3">
        <p className="inline-flex items-center gap-2 text-[14px] font-semibold text-success">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {heading}
        </p>
        <p className="text-[12.5px] text-body">
          {files.length} file{files.length === 1 ? "" : "s"} · {formatBytes(total)}
        </p>
      </div>

      <ul className="mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line">
        {files.map((file) => {
          const saved = file.originalSize ? percentSaved(file.originalSize, file.size) : null;
          return (
            <li key={file.id} className="flex flex-wrap items-center gap-3 bg-raised px-4 py-3">
              {file.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={file.previewUrl}
                  alt={`Preview of ${file.name}`}
                  className="h-11 w-11 shrink-0 rounded-lg border border-line object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-surface text-subtle ring-1 ring-line">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </span>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-ink">{file.name}</p>
                <p className="mt-0.5 text-[12.5px] text-subtle">
                  {formatBytes(file.size)}
                  {file.originalSize != null && (
                    <>
                      {" "}
                      <span className="text-line">·</span> was {formatBytes(file.originalSize)}
                      {saved !== null && compare === "compression" && saved > 0 && (
                        <span className="ml-1 font-semibold text-success">{saved}% smaller</span>
                      )}
                      {saved !== null && compare === "compression" && saved <= 0 && (
                        <span className="ml-1 font-semibold text-warning">no saving</span>
                      )}
                      {saved !== null && compare === "conversion" && saved > 0 && (
                        <span className="ml-1 font-semibold text-success">{saved}% smaller</span>
                      )}
                      {saved !== null && compare === "conversion" && saved < 0 && (
                        <span className="ml-1 font-semibold text-subtle">{Math.abs(saved)}% larger</span>
                      )}
                      {saved !== null && compare === "conversion" && saved === 0 && (
                        <span className="ml-1 text-subtle">same size</span>
                      )}
                    </>
                  )}
                  {file.note && <span className="block text-subtle">{file.note}</span>}
                </p>
              </div>

              <button
                type="button"
                onClick={() => downloadBlob(file.blob, file.name)}
                className="btn-secondary min-h-[40px] px-3.5 text-[13.5px]"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Download
              </button>
            </li>
          );
        })}
      </ul>

      {extra}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {files.length > 1 && (
          <button
            type="button"
            disabled={zipping}
            onClick={async () => {
              setZipping(true);
              try {
                await downloadZip(files, zipName);
              } finally {
                setZipping(false);
              }
            }}
            className="btn-primary"
          >
            {zipping ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FolderOpen className="h-4 w-4" aria-hidden="true" />}
            {zipping ? "Building ZIP…" : zipLabel}
          </button>
        )}
        <button type="button" onClick={onReset} className="btn-secondary">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Process another file
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────── Form primitives ───────────────────────────── */

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[12.5px] font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11.5px] leading-relaxed text-subtle">{hint}</p>}
    </div>
  );
}

export const inputClass =
  "h-11 w-full rounded-xl border border-line bg-raised px-3 text-[14px] text-ink shadow-inset outline-none transition-colors placeholder:text-subtle focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15";

export const selectClass =
  "h-11 w-full appearance-none rounded-xl border border-line bg-raised bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat px-3 pr-9 text-[14px] text-ink shadow-inset outline-none transition-colors focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15";

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  hint,
}: {
  options: { value: T; label: string; hint?: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  hint?: string;
}) {
  const groupId = useId();
  return (
    <fieldset>
      <legend id={`${groupId}-legend`} className="mb-1.5 text-[12.5px] font-semibold text-ink">
        {label}
      </legend>
      <div role="radiogroup" aria-labelledby={`${groupId}-legend`} className="grid gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer flex-col gap-0.5 rounded-xl border p-3 transition-colors",
                active
                  ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                  : "border-line bg-raised hover:border-brand-200",
              )}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name={groupId}
                  value={option.value}
                  checked={active}
                  onChange={() => onChange(option.value)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid h-4 w-4 place-items-center rounded-full border",
                    active ? "border-brand-500 bg-brand-500" : "border-line bg-raised",
                  )}
                >
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
                <span className="text-[13.5px] font-semibold text-ink">{option.label}</span>
              </span>
              {option.hint && <span className="pl-6 text-[11.5px] leading-snug text-subtle">{option.hint}</span>}
            </label>
          );
        })}
      </div>
      {hint && <p className="mt-1.5 text-[11.5px] text-subtle">{hint}</p>}
    </fieldset>
  );
}

export function PendingBar({ label }: { label: string }) {
  return (
    <p className="mt-2 inline-flex items-center gap-2 text-[12.5px] text-subtle">
      <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-500" aria-hidden="true" />
      {label}
    </p>
  );
}

export function ContinueHint() {
  return (
    <span className="inline-flex items-center gap-1 text-[12px] text-subtle">
      Continue <ArrowRight className="h-3 w-3" aria-hidden="true" />
    </span>
  );
}
