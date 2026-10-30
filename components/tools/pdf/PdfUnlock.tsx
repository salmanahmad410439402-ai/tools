"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { unlockPdf, looksEncrypted } from "@/lib/pdf/security";
import { track } from "@/lib/analytics";
import { revokeResults, type ResultFile } from "@/lib/download";
import { fileBaseName, formatBytes, outputName } from "@/lib/utils";
import { Field, inputClass, Notice, ProgressBar, ResultsPanel, ToolFrame } from "../kit";
import { PdfSource } from "./PdfSource";

export function PdfUnlock() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [results, setResults] = useState<ResultFile[]>([]);

  const reset = () => {
    revokeResults(results);
    setResults([]);
    setFile(null);
    setPassword("");
    setShow(false);
    setError(null);
    setNote(null);
  };

  const pick = async (next: File) => {
    setFile(next);
    setError(null);
    setNote(null);
    // A structural check gives a useful hint before the user types anything.
    const encrypted = looksEncrypted(await next.arrayBuffer());
    setNote(
      encrypted
        ? null
        : "This file does not look encrypted — it has no password entry at all. Downloading it again would give you the same file, so nothing is written unless a password is supplied.",
    );
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const result = await unlockPdf(await file.arrayBuffer(), password);
      const blob = new Blob([result.bytes as unknown as BlobPart], { type: "application/pdf" });
      setResults([
        {
          id: "unlocked",
          name: outputName(fileBaseName(file.name), "unlocked", "pdf"),
          blob,
          size: blob.size,
          originalSize: file.size,
          note: `${result.pages} page${result.pages === 1 ? "" : "s"} · no password, no permission flags`,
        },
      ]);
      track("tool_completed", { tool: "unlock-pdf", pages: result.pages });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The file could not be unlocked.");
    } finally {
      setBusy(false);
    }
  };

  if (results.length) {
    return (
      <ToolFrame labelledBy="tool-title">
        <ResultsPanel files={results} onReset={reset} heading="Password removed" />
        <div className="mt-4">
          <Notice tone="warning">
            The unlocked copy is readable by anyone you send it to. Document properties are cleared in the process, so
            the unlocked file starts with a clean title and author.
          </Notice>
        </div>
      </ToolFrame>
    );
  }

  return (
    <ToolFrame labelledBy="tool-title">
      <PdfSource
        file={file}
        onFile={pick}
        onRemove={() => setFile(null)}
        subtitle="PDF only · you need the password · nothing is uploaded"
      />

      {file && (
        <>
          <div className="mt-5">
            <Field
              label="Password"
              htmlFor="unlock-password"
              hint="The password that opens the file. An owner password works too, and removes the permission flags as well."
            >
              <div className="relative">
                <input
                  id="unlock-password"
                  className={`${inputClass} pr-11`}
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Type the password you already use"
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
          </div>

          <p className="mt-3 text-[12px] text-subtle">{formatBytes(file.size)}</p>

          <Notice tone="info" className="mt-4">
            This removes a password you already know from a file you can already open. It has no guessing, no
            dictionary and no recovery: a password you have forgotten cannot be undone here, and guessing at somebody
            else&apos;s file is not something this tool does.
          </Notice>

          {note && (
            <Notice tone="warning" className="mt-4" onDismiss={() => setNote(null)}>
              {note}
            </Notice>
          )}
          {error && (
            <Notice tone="danger" className="mt-4" onDismiss={() => setError(null)}>
              {error}
            </Notice>
          )}
          {busy && <ProgressBar value={0.6} label="Decrypting and rewriting the document" />}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={run}
              disabled={busy || password.length === 0}
              className="btn-primary w-full sm:w-auto"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <KeyRound className="h-4 w-4" aria-hidden="true" />}
              {busy ? "Unlocking…" : "Unlock PDF"}
            </button>
            <p className="text-[12.5px] text-subtle">
              {password.length === 0 ? "Enter the password first." : "AES-256, AES-128 and RC4 passwords are supported."}
            </p>
          </div>
        </>
      )}
    </ToolFrame>
  );
}
