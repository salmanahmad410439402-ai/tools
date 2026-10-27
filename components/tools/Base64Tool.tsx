"use client";

import { useCallback, useState } from "react";
import { Check, Clipboard, Code2, ImageDown, Loader2, TextCursorInput } from "lucide-react";
import { ACCEPT_IMAGE, INPUT_EXTENSIONS } from "@/lib/images";
import {
  base64SizeEstimate,
  detectMime,
  extensionForMime,
  parseBase64Input,
  snippets,
} from "@/lib/base64";
import { sizeBucket, track } from "@/lib/analytics";
import { downloadBlob } from "@/lib/download";
import { cn, formatBytes, outputName } from "@/lib/utils";
import { Dropzone, Notice, Segmented, ToolFrame, inputClass } from "./kit";

type Mode = "encode" | "decode";
type Snippet = "dataUri" | "raw" | "css" | "html";

const SNIPPET_TABS: { value: Snippet; label: string; hint: string }[] = [
  { value: "dataUri", label: "Data URI", hint: "src=\"data:image/…\"" },
  { value: "raw", label: "Raw base64", hint: "No prefix" },
  { value: "css", label: "CSS", hint: "background-image" },
  { value: "html", label: "HTML", hint: "<img src=…>" },
];

interface Encoded {
  name: string;
  mime: string;
  size: number;
  snippets: Record<Snippet, string>;
  preview: string | null;
}

interface Props {
  toolSlug?: string;
}

export function Base64Tool({ toolSlug = "image-to-base64" }: Props) {
  const [mode, setMode] = useState<Mode>("encode");
  const [encoded, setEncoded] = useState<Encoded | null>(null);
  const [snippet, setSnippet] = useState<Snippet>("dataUri");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pasted, setPasted] = useState("");
  const [decoded, setDecoded] = useState<{ bytes: Uint8Array; mime: string; detected: boolean; preview: string | null } | null>(null);

  const encode = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setWorking(true);
      setError(null);
      setEncoded(null);
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const mime = detectMime(bytes) ?? (file.type || "application/octet-stream");
        const parts = snippets(bytes, mime, file.name);
        setEncoded({
          name: file.name,
          mime,
          size: bytes.length,
          snippets: parts,
          preview: mime.startsWith("image/") ? URL.createObjectURL(file) : null,
        });
        setSnippet("dataUri");
        track("tool_started", { tool: toolSlug, files: 1 });
        track("tool_completed", { tool: toolSlug, format: mime, files: 1, size: sizeBucket(bytes.length) });
      } catch {
        setError("That file could not be read. Try choosing it again.");
      } finally {
        setWorking(false);
      }
    },
    [toolSlug],
  );

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Your browser blocked clipboard access. Select the text and copy it manually.");
    }
  };

  const decode = () => {
    setError(null);
    setDecoded(null);
    try {
      const parsed = parseBase64Input(pasted);
      const mime = parsed.detectedMime ?? parsed.declaredMime ?? "application/octet-stream";
      const blob = new Blob([parsed.bytes as unknown as BlobPart], { type: mime });
      setDecoded({
        bytes: parsed.bytes,
        mime,
        detected: Boolean(parsed.detectedMime),
        preview: mime.startsWith("image/") ? URL.createObjectURL(blob) : null,
      });
      track("tool_completed", { tool: toolSlug, format: mime, files: 1, size: sizeBucket(parsed.bytes.length) });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That base64 string could not be decoded.");
    }
  };

  return (
    <ToolFrame labelledBy="tool-title">
      <Segmented<Mode>
        label="What do you want to do?"
        value={mode}
        onChange={(next) => {
          setMode(next);
          setError(null);
        }}
        options={[
          { value: "encode", label: "Image → Base64", hint: "File to text" },
          { value: "decode", label: "Base64 → Image", hint: "Text back to a file" },
        ]}
      />

      {mode === "encode" ? (
        <div className="mt-4">
          <Dropzone
            accept={`${ACCEPT_IMAGE},.pdf`}
            acceptedLabel="JPG, PNG, WebP, GIF, SVG, AVIF, ICO or PDF"
            extensions={[...INPUT_EXTENSIONS, "pdf"]}
            onFiles={encode}
            multiple={false}
            maxSizeMb={40}
            title={encoded ? "Encode a different file" : "Drop an image here or click to choose"}
            subtitle="Produces a data URI, raw base64, CSS or HTML · up to 40 MB · no upload"
          />

          {working && (
            <p className="mt-3 inline-flex items-center gap-2 text-[12.5px] text-subtle">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Encoding on your device…
            </p>
          )}

          {encoded && (
            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-raised p-3">
                {encoded.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={encoded.preview} alt="" className="h-12 w-12 rounded-lg border border-line object-cover" />
                ) : (
                  <span className="grid h-12 w-12 place-items-center rounded-lg border border-line bg-surface text-subtle">
                    <Code2 className="h-5 w-5" aria-hidden="true" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-ink">{encoded.name}</p>
                  <p className="text-[12px] text-subtle">
                    {encoded.mime} · {formatBytes(encoded.size)} → {formatBytes(base64SizeEstimate(encoded.size))} of text
                    <span className="ml-1 text-subtle">(+33% is normal)</span>
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {SNIPPET_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setSnippet(tab.value)}
                    title={tab.hint}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition-colors",
                      snippet === tab.value
                        ? "border-primary/40 bg-primary/10 text-brand-700"
                        : "border-line bg-surface text-subtle hover:border-primary/30",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <label htmlFor="b64-output" className="mt-2 block text-[12px] font-semibold text-ink">
                {SNIPPET_TABS.find((tab) => tab.value === snippet)?.label} — select and copy, or use the buttons
              </label>
              <textarea
                id="b64-output"
                readOnly
                value={encoded.snippets[snippet]}
                rows={6}
                spellCheck={false}
                onFocus={(event) => event.currentTarget.select()}
                className="mt-1 w-full resize-y rounded-xl border border-line bg-raised p-3 font-mono text-[11.5px] leading-relaxed text-body"
              />

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => copy(encoded.snippets[snippet])} className="btn-primary min-h-[40px] px-3.5 text-[13px]">
                  {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Clipboard className="h-4 w-4" aria-hidden="true" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={() => downloadBlob(new Blob([encoded.snippets[snippet]], { type: "text/plain" }), outputName(encoded.name, "base64", "txt"))}
                  className="btn-secondary min-h-[40px] px-3.5 text-[13px]"
                >
                  <ImageDown className="h-4 w-4" aria-hidden="true" />
                  Download as .txt
                </button>
                <span className="text-[11.5px] text-subtle">{encoded.snippets[snippet].length.toLocaleString()} characters</span>
              </div>
            </div>
          )}

          {error && (
            <Notice tone="danger" className="mt-3" onDismiss={() => setError(null)}>
              {error}
            </Notice>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <label htmlFor="b64-input" className="mb-1.5 block text-[12.5px] font-semibold text-ink">
            Paste base64 or a full data URI
          </label>
          <textarea
            id="b64-input"
            value={pasted}
            onChange={(event) => setPasted(event.target.value)}
            rows={7}
            spellCheck={false}
            placeholder="data:image/png;base64,iVBORw0KGgoAAAANSUhEUg…"
            className={cn(inputClass, "h-auto resize-y py-3 font-mono text-[12px] leading-relaxed")}
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button type="button" onClick={decode} disabled={!pasted.trim()} className="btn-primary min-h-[40px] px-3.5 text-[13px]">
              <TextCursorInput className="h-4 w-4" aria-hidden="true" />
              Decode
            </button>
            <button
              type="button"
              onClick={() => {
                setPasted("");
                setDecoded(null);
                setError(null);
              }}
              className="btn-secondary min-h-[40px] px-3.5 text-[13px]"
            >
              Clear
            </button>
            <span className="text-[11.5px] text-subtle">Whitespace, line breaks and missing padding are tolerated.</span>
          </div>

          {error && (
            <Notice tone="danger" className="mt-3" onDismiss={() => setError(null)}>
              {error}
            </Notice>
          )}

          {decoded && (
            <div className="mt-4 rounded-xl border border-line bg-raised p-4">
              <div className="flex flex-wrap items-center gap-3">
                {decoded.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={decoded.preview} alt="Decoded preview" className="h-16 w-16 rounded-lg border border-line object-cover" />
                ) : (
                  <span className="grid h-16 w-16 place-items-center rounded-lg border border-line bg-surface text-subtle">
                    <Code2 className="h-5 w-5" aria-hidden="true" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold text-ink">
                    {decoded.mime} · {formatBytes(decoded.bytes.length)}
                  </p>
                  <p className="text-[12px] text-subtle">
                    {decoded.detected
                      ? "The file type was identified from the bytes themselves, not from the label."
                      : "The bytes do not match a known image type, so the declared label is being used."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    downloadBlob(
                      new Blob([decoded.bytes as unknown as BlobPart], { type: decoded.mime }),
                      `decoded.${extensionForMime(decoded.mime)}`,
                    )
                  }
                  className="btn-primary min-h-[40px] px-3.5 text-[13px]"
                >
                  <ImageDown className="h-4 w-4" aria-hidden="true" />
                  Download
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-[11.5px] leading-relaxed text-subtle">
        Base64 is about 33% larger than the original file and cannot be compressed by gzip on top — which is why it is
        best for small icons, inline email images and SVG logos rather than a 5 MB phone photo.
      </p>
    </ToolFrame>
  );
}
