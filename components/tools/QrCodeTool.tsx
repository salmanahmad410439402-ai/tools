"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Clipboard, Download, Loader2, QrCode } from "lucide-react";
import { QR_ERROR_LEVELS, contrastRatio, drawQrToCanvas, encodeQr, qrToSvg, type QrMatrix } from "@/lib/qr";
import { sizeBucket, track } from "@/lib/analytics";
import { downloadBlob } from "@/lib/download";
import { cn } from "@/lib/utils";
import { Field, Notice, ToolFrame, inputClass, selectClass } from "./kit";

const PREVIEW_SIZE = 320;

interface Props {
  toolSlug?: string;
}

export function QrCodeTool({ toolSlug = "qr-code-generator" }: Props) {
  const [text, setText] = useState("");
  const [level, setLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [pixelSize, setPixelSize] = useState("512");
  const [margin, setMargin] = useState("4");
  const [foreground, setForeground] = useState("#0B1020");
  const [background, setBackground] = useState("#FFFFFF");
  const [matrix, setMatrix] = useState<QrMatrix | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* Encode on every change — it is microseconds of work, no debounce needed. */
  useEffect(() => {
    if (!text.trim()) {
      setMatrix(null);
      setError(null);
      return;
    }
    try {
      const next = encodeQr(text, { level, margin: Number(margin) });
      setMatrix(next);
      setError(null);
    } catch (caught) {
      setMatrix(null);
      setError(caught instanceof Error ? caught.message : "This text could not be encoded.");
    }
  }, [text, level, margin]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !matrix) return;
    try {
      drawQrToCanvas(canvas, matrix, { pixelSize: PREVIEW_SIZE, foreground, background });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The preview could not be drawn.");
    }
  }, [matrix, foreground, background]);

  const contrast = useMemo(() => contrastRatio(foreground, background), [foreground, background]);
  const inverted = useMemo(() => {
    const luminance = (hex: string) => contrastRatio(hex, "#000000");
    return luminance(foreground) > luminance(background);
  }, [foreground, background]);

  const svg = useMemo(() => (matrix ? qrToSvg(matrix, { foreground, background }) : ""), [matrix, foreground, background]);

  const downloadPng = useCallback(async () => {
    if (!matrix) return;
    setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      drawQrToCanvas(canvas, matrix, { pixelSize: Number(pixelSize), foreground, background });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      canvas.width = 0;
      canvas.height = 0;
      if (!blob) throw new Error("The browser could not export this PNG.");
      downloadBlob(blob, `filecraft-qr-${Number(pixelSize)}px.png`);
      track("tool_completed", { tool: toolSlug, format: "PNG", files: 1, size: sizeBucket(blob.size) });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The PNG could not be exported.");
    } finally {
      setBusy(false);
    }
  }, [background, foreground, matrix, pixelSize, toolSlug]);

  const downloadSvg = () => {
    if (!matrix) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    downloadBlob(blob, "filecraft-qr.svg");
    track("tool_completed", { tool: toolSlug, format: "SVG", files: 1, size: sizeBucket(blob.size) });
  };

  const copySvg = async () => {
    try {
      await navigator.clipboard.writeText(svg);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Your browser blocked clipboard access. Use Download SVG instead.");
    }
  };

  return (
    <ToolFrame labelledBy="tool-title">
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Field
            label="What should the code contain?"
            htmlFor="qr-text"
            hint="A URL, plain text, Wi-Fi details, an email address — up to about 2,000 characters at level M."
          >
            <textarea
              id="qr-text"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                if (event.target.value.trim() && !text.trim()) track("tool_started", { tool: toolSlug, files: 1 });
              }}
              rows={4}
              spellCheck={false}
              placeholder="https://example.com/my-page"
              className={cn(inputClass, "h-auto resize-y py-3 font-mono text-[13px]")}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Error correction" htmlFor="qr-level" hint="Higher levels survive more damage but hold less data.">
              <select id="qr-level" className={selectClass} value={level} onChange={(event) => setLevel(event.target.value as "L" | "M" | "Q" | "H")}>
                {QR_ERROR_LEVELS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} — {option.hint}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="PNG size" htmlFor="qr-size" hint="Print at 300 dpi: 512 px is about 43 mm wide.">
              <select id="qr-size" className={selectClass} value={pixelSize} onChange={(event) => setPixelSize(event.target.value)}>
                {["256", "512", "1024", "2048"].map((size) => (
                  <option key={size} value={size}>
                    {size} × {size} px
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Quiet zone (modules)" htmlFor="qr-margin" hint="Four is the specification minimum. Zero makes some scanners fail.">
              <input
                id="qr-margin"
                type="number"
                min={0}
                max={16}
                value={margin}
                onChange={(event) => setMargin(event.target.value)}
                className={cn(inputClass, "tabular-nums")}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Modules" htmlFor="qr-fg">
                <div className="flex items-center gap-2">
                  <input
                    id="qr-fg"
                    type="color"
                    value={foreground}
                    onChange={(event) => setForeground(event.target.value)}
                    className="h-11 w-14 cursor-pointer rounded-lg border border-line bg-raised p-1"
                  />
                  <span className="font-mono text-[11.5px] uppercase text-subtle">{foreground}</span>
                </div>
              </Field>
              <Field label="Background" htmlFor="qr-bg">
                <div className="flex items-center gap-2">
                  <input
                    id="qr-bg"
                    type="color"
                    value={background}
                    onChange={(event) => setBackground(event.target.value)}
                    className="h-11 w-14 cursor-pointer rounded-lg border border-line bg-raised p-1"
                  />
                  <span className="font-mono text-[11.5px] uppercase text-subtle">{background}</span>
                </div>
              </Field>
            </div>
          </div>

          {contrast < 3 && (
            <Notice tone="warning">
              These colours are too close together ({contrast.toFixed(1)}:1). A scanner needs a strong difference —
              dark modules on a light background is the only combination that works reliably.
            </Notice>
          )}

          {inverted && contrast >= 3 && (
            <Notice tone="info">
              Light modules on a dark background often scan, but many older readers expect dark-on-light. Test it with
              two different phones before printing.
            </Notice>
          )}

          {text.length > 0 && (
            <p className="text-[12px] text-subtle">
              {text.length.toLocaleString()} characters of content
              {matrix ? ` · ${matrix.modules} × ${matrix.modules} modules (version ${matrix.version})` : ""}
            </p>
          )}

          {error && (
            <Notice tone="danger" onDismiss={() => setError(null)}>
              {error}
            </Notice>
          )}
        </div>

        <div>
          <div className="grid place-items-center rounded-xl border border-line bg-surface p-3">
            {matrix ? (
              <canvas
                ref={canvasRef}
                className="h-auto w-full max-w-[280px] rounded"
                role="img"
                aria-label="QR code preview of the text you entered"
              />
            ) : (
              <div className="grid h-[280px] w-full max-w-[280px] place-items-center rounded border border-dashed border-line text-center text-[12px] text-subtle">
                <span className="px-4">
                  <QrCode className="mx-auto mb-2 h-6 w-6" aria-hidden="true" />
                  Your code appears here as you type
                </span>
              </div>
            )}
          </div>

          <div className="mt-3 grid gap-2">
            <button type="button" onClick={downloadPng} disabled={!matrix || busy} className="btn-primary w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
              {busy ? "Exporting…" : "Download PNG"}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={downloadSvg} disabled={!matrix} className="btn-secondary min-h-[40px] text-[13px]">
                <Download className="h-4 w-4" aria-hidden="true" />
                SVG
              </button>
              <button type="button" onClick={copySvg} disabled={!matrix} className="btn-secondary min-h-[40px] text-[13px]">
                {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Clipboard className="h-4 w-4" aria-hidden="true" />}
                {copied ? "Copied" : "Copy SVG"}
              </button>
            </div>
          </div>

          <p className="mt-2 text-[11.5px] leading-relaxed text-subtle">
            The code is generated in your tab and contains only your text — no redirect, no short link, no tracking
            pixel.
          </p>
        </div>
      </div>
    </ToolFrame>
  );
}
