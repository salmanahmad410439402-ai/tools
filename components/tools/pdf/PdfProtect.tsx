"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { protectPdf, describePermissions, type ProtectOptions } from "@/lib/pdf/security";
import { track } from "@/lib/analytics";
import { revokeResults, type ResultFile } from "@/lib/download";
import { fileBaseName, formatBytes, outputName } from "@/lib/utils";
import { Field, inputClass, Notice, ProgressBar, ResultsPanel, ToolFrame } from "../kit";
import { PdfSource, usePdfInfo } from "./PdfSource";

const DEFAULTS: ProtectOptions = {
  userPassword: "",
  ownerPassword: "",
  allowPrinting: true,
  allowCopying: false,
  allowModifying: false,
  allowAnnotating: false,
};

const PERMISSIONS: { key: keyof Pick<ProtectOptions, "allowPrinting" | "allowCopying" | "allowModifying" | "allowAnnotating">; label: string; hint: string }[] = [
  { key: "allowPrinting", label: "Allow printing", hint: "High-quality printing stays available." },
  { key: "allowCopying", label: "Allow copying text", hint: "Selecting and copying text or images." },
  { key: "allowModifying", label: "Allow editing", hint: "Changing the document's content." },
  { key: "allowAnnotating", label: "Allow comments", hint: "Adding notes, highlights and form entries." },
];

export function PdfProtect() {
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState<ProtectOptions>(DEFAULTS);
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultFile[]>([]);
  const info = usePdfInfo(file);

  const mismatch = confirm.length > 0 && confirm !== options.userPassword;
  const ready = (options.userPassword.length > 0 || (options.ownerPassword ?? "").length > 0) && !mismatch;

  const reset = () => {
    revokeResults(results);
    setResults([]);
    setFile(null);
    setOptions(DEFAULTS);
    setConfirm("");
    setShow(false);
    setAdvanced(false);
    setError(null);
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const bytes = await protectPdf(await file.arrayBuffer(), options);
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      setResults([
        {
          id: "protected",
          name: outputName(fileBaseName(file.name), "protected", "pdf"),
          blob,
          size: blob.size,
          originalSize: file.size,
          note: `AES-256 · ${options.userPassword ? "asks for a password when opened" : "opens without a prompt, permissions set"}`,
        },
      ]);
      track("tool_completed", { tool: "protect-pdf" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The file could not be protected.");
    } finally {
      setBusy(false);
    }
  };

  if (results.length) {
    return (
      <ToolFrame labelledBy="tool-title">
        <ResultsPanel files={results} onReset={reset} heading="Your PDF is protected" />
        <div className="mt-4">
          <Notice tone="warning">
            There is no way to recover the password from the file — not here, and not anywhere else. Store it in your
            password manager before you close this tab.
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
        subtitle="PDF only · encrypted locally · nothing is uploaded"
      />

      {file && (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field
              label="Password to open the file"
              htmlFor="protect-password"
              hint="Case-sensitive. You will need it every time the file is opened."
            >
              <div className="relative">
                <input
                  id="protect-password"
                  className={`${inputClass} pr-11`}
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  value={options.userPassword}
                  onChange={(event) => setOptions({ ...options, userPassword: event.target.value })}
                  placeholder="Something long and memorable"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-lg text-subtle hover:text-ink"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </Field>
            <Field label="Repeat the password" htmlFor="protect-confirm" hint={mismatch ? "The two passwords do not match." : " "}>
              <input
                id="protect-confirm"
                className={inputClass}
                type={show ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
            </Field>
          </div>

          <fieldset className="mt-5">
            <legend className="mb-2 text-[12.5px] font-semibold text-ink">What readers may do</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {PERMISSIONS.map((permission) => (
                <label
                  key={permission.key}
                  className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-line bg-raised p-3 transition-colors hover:border-brand-300"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 accent-brand-500"
                    checked={Boolean(options[permission.key])}
                    onChange={(event) => setOptions({ ...options, [permission.key]: event.target.checked })}
                  />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-ink">{permission.label}</span>
                    <span className="block text-[11.5px] leading-relaxed text-subtle">{permission.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-subtle">{describePermissions(options)}</p>
          </fieldset>

          <button
            type="button"
            onClick={() => setAdvanced(!advanced)}
            className="mt-4 text-[12.5px] font-medium text-brand-600 underline-offset-2 hover:underline"
          >
            {advanced ? "Hide advanced options" : "Advanced: set a separate owner password"}
          </button>

          {advanced && (
            <div className="mt-3">
              <Field
                label="Owner password (optional)"
                htmlFor="protect-owner"
                hint="Opens the file with full rights regardless of the ticks above. Leave it empty to use the same password."
              >
                <input
                  id="protect-owner"
                  className={inputClass}
                  type="password"
                  autoComplete="new-password"
                  value={options.ownerPassword ?? ""}
                  onChange={(event) => setOptions({ ...options, ownerPassword: event.target.value })}
                />
              </Field>
            </div>
          )}

          <p className="mt-3 text-[12px] text-subtle">
            {info.pages ? `${info.pages} pages · ` : ""}
            {formatBytes(file.size)} → encrypted copy
          </p>

          <Notice tone="info" className="mt-4">
            The file is encrypted with AES-256, the cipher the PDF standard recommends. The permission ticks are a
            request to the reader — most PDF apps honour them, but they are not a technical lock the way the open
            password is. Anything that can be seen can be photographed; treat this as a deterrent, not DRM.
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
          {busy && <ProgressBar value={0.6} label="Encrypting every object in the file" />}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={run} disabled={busy || !ready} className="btn-primary w-full sm:w-auto">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Lock className="h-4 w-4" aria-hidden="true" />}
              {busy ? "Encrypting…" : "Protect PDF"}
            </button>
            <p className="text-[12.5px] text-subtle">
              {!ready && !mismatch && options.userPassword.length === 0
                ? "Type a password to continue."
                : "Pages, images and text are preserved exactly."}
            </p>
          </div>
        </>
      )}
    </ToolFrame>
  );
}
