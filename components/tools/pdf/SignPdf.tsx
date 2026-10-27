"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, Loader2, PenLine } from "lucide-react";
import { placeSignature } from "@/lib/pdf/ops";
import { track } from "@/lib/analytics";
import { revokeResults, type ResultFile } from "@/lib/download";
import { cn, fileBaseName, outputName } from "@/lib/utils";
import { Field, inputClass, Notice, ProgressBar, ResultsPanel, Segmented, ToolFrame, selectClass } from "../kit";
import { PdfSource, usePdfInfo } from "./PdfSource";
import { usePageThumbs } from "./usePageThumbs";

type SignatureMode = "draw" | "type" | "upload";

/** Trims transparent/white margins so the signature sits cleanly on the line. */
function trimCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const context = source.getContext("2d");
  if (!context) return source;
  const { data } = context.getImageData(0, 0, source.width, source.height);
  let top = source.height;
  let left = source.width;
  let right = 0;
  let bottom = 0;

  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const alpha = data[(y * source.width + x) * 4 + 3];
      if (alpha > 12) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }

  if (right <= left || bottom <= top) return source;
  const padding = 6;
  const width = Math.min(source.width, right - left + padding * 2);
  const height = Math.min(source.height, bottom - top + padding * 2);
  const trimmed = document.createElement("canvas");
  trimmed.width = width;
  trimmed.height = height;
  const trimmedContext = trimmed.getContext("2d");
  if (!trimmedContext) return source;
  trimmedContext.drawImage(
    source,
    Math.max(0, left - padding),
    Math.max(0, top - padding),
    width,
    height,
    0,
    0,
    width,
    height,
  );
  return trimmed;
}

export function SignPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<SignatureMode>("draw");
  const [typed, setTyped] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [width, setWidth] = useState(28);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultFile[]>([]);

  const padRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const uploaded = useRef<HTMLImageElement | null>(null);
  const info = usePdfInfo(file);
  const preview = usePageThumbs(file, { maxWidth: 620, maxPages: 30 });

  // Keep the pad blank and the placement cleared when the file changes.
  useEffect(() => {
    setPosition(null);
    setPageIndex(0);
  }, [file]);

  const clearPad = useCallback(() => {
    const canvas = padRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    uploaded.current = null;
    setSignatureUrl(null);
  }, []);

  const padPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = padRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDraw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = padRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    drawing.current = true;
    canvas.setPointerCapture(event.pointerId);
    const point = padPoint(event);
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineWidth = 3.2;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#0f172a";
  };

  const moveDraw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const canvas = padRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const point = padPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
    setSignatureUrl(null);
  };

  const endDraw = () => {
    drawing.current = false;
  };

  const buildTypedSignature = useCallback(() => {
    const canvas = padRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    uploaded.current = null;
    if (!typed.trim()) {
      setSignatureUrl(null);
      return;
    }
    context.fillStyle = "#0f172a";
    context.font = 'italic 74px "Segoe Script", "Brush Script MT", "Apple Chancery", cursive';
    context.textBaseline = "middle";
    context.fillText(typed, 26, canvas.height / 2, canvas.width - 52);
    setSignatureUrl(null);
  }, [typed]);

  useEffect(() => {
    if (mode === "type") buildTypedSignature();
  }, [mode, buildTypedSignature]);

  const onUpload = async (uploadedFile: File | null) => {
    if (!uploadedFile) return;
    const url = URL.createObjectURL(uploadedFile);
    const image = new Image();
    image.src = url;
    await image.decode().catch(() => undefined);
    const canvas = padRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      context.drawImage(image, (canvas.width - drawWidth) / 2, (canvas.height - drawHeight) / 2, drawWidth, drawHeight);
      // Drop a white photo background so the signature blends into the page.
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      for (let index = 0; index < pixels.data.length; index += 4) {
        const brightness = (pixels.data[index] + pixels.data[index + 1] + pixels.data[index + 2]) / 3;
        if (brightness > 205) pixels.data[index + 3] = 0;
      }
      context.putImageData(pixels, 0, 0);
      uploaded.current = image;
      setSignatureUrl(null);
    }
    URL.revokeObjectURL(url);
  };

  const currentThumb = preview.thumbs.find((thumb) => thumb.pageIndex === pageIndex) ?? preview.thumbs[0];

  const place = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPosition({
      x: Math.min(0.98, Math.max(0.02, (event.clientX - rect.left) / rect.width)),
      y: Math.min(0.98, Math.max(0.02, 1 - (event.clientY - rect.top) / rect.height)),
    });
  };

  const run = async () => {
    if (!file) return;
    const canvas = padRef.current;
    if (!canvas) return;
    const hasContent = signatureUrl !== null || canvas.toDataURL().length > 2000;
    if (!hasContent) {
      setError("Create a signature first: draw it, type it, or upload an image of it.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const trimmed = trimCanvas(canvas);
      const blob = await new Promise<Blob | null>((resolve) => trimmed.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("The signature could not be prepared.");
      const trimmedAspect = trimmed.width / trimmed.height;
      // Keep the drawn aspect ratio: width is a fraction of the page width, and
      // the height follows from the image itself inside placeSignature().
      void trimmedAspect;

      const bytes = await placeSignature(await file.arrayBuffer(), await blob.arrayBuffer(), {
        pageIndex,
        x: position?.x ?? 0.55,
        y: position?.y ?? 0.18,
        width: width / 100,
      });
      const output = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      setResults([
        {
          id: "signed",
          name: outputName(fileBaseName(file.name), "signed", "pdf"),
          blob: output,
          size: output.size,
          originalSize: file.size,
          note: `Signature placed on page ${pageIndex + 1}`,
        },
      ]);
      track("tool_completed", { tool: "sign-pdf", mode });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The signature could not be added.");
    } finally {
      setBusy(false);
    }
  };

  if (results.length) {
    return (
      <ToolFrame labelledBy="tool-title">
        <ResultsPanel
          files={results}
          onReset={() => {
            revokeResults(results);
            setResults([]);
            setFile(null);
            setPosition(null);
          }}
          heading="Signature added"
          extra={
            <Notice tone="info" className="mt-3">
              This is a visual signature, not a certificate-based digital signature with a tamper-evident audit trail.
            </Notice>
          }
        />
      </ToolFrame>
    );
  }

  return (
    <ToolFrame labelledBy="tool-title">
      <PdfSource file={file} onFile={(next) => { setFile(next); setError(null); }} onRemove={() => setFile(null)} />

      {file && (
        <>
          <div className="mt-5">
            <Segmented<SignatureMode>
              label="Create your signature"
              value={mode}
              onChange={(next) => {
                setMode(next);
                if (next === "draw") clearPad();
              }}
              options={[
                { value: "draw", label: "Draw", hint: "Mouse, trackpad or finger" },
                { value: "type", label: "Type", hint: "Type your name" },
                { value: "upload", label: "Upload", hint: "A PNG or photo of your signature" },
              ]}
            />
          </div>

          <div className="mt-4 rounded-xl border border-line bg-surface p-3">
            {mode === "type" && (
              <Field label="Your name" htmlFor="sign-typed">
                <input
                  id="sign-typed"
                  className={inputClass}
                  value={typed}
                  onChange={(event) => setTyped(event.target.value)}
                  placeholder="Jane Smith"
                />
              </Field>
            )}
            {mode === "upload" && (
              <div className="mb-3">
                <label htmlFor="sign-upload" className="mb-1.5 block text-[12.5px] font-semibold text-ink">
                  Signature image (PNG or JPG)
                </label>
                <input
                  id="sign-upload"
                  type="file"
                  accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                  onChange={(event) => onUpload(event.target.files?.[0] ?? null)}
                  className="block w-full cursor-pointer rounded-lg border border-line bg-raised px-3 py-2 text-[13px] file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-[12.5px] file:font-semibold file:text-brand-700"
                />
              </div>
            )}
            <canvas
              ref={padRef}
              width={620}
              height={190}
              onPointerDown={startDraw}
              onPointerMove={moveDraw}
              onPointerUp={endDraw}
              onPointerLeave={endDraw}
              className={cn(
                "w-full touch-none rounded-lg border border-dashed border-line bg-raised",
                mode !== "draw" && "pointer-events-none",
              )}
              aria-label="Signature pad — draw your signature here"
            />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-[11.5px] text-subtle">
                {mode === "draw" ? "Draw inside the box." : mode === "type" ? "Typed signatures use a script style." : "White backgrounds are removed automatically."}
              </p>
              <button type="button" onClick={clearPad} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-subtle hover:text-ink">
                <Eraser className="h-3.5 w-3.5" aria-hidden="true" />
                Clear
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Field label="Page" htmlFor="sign-page">
              <select
                id="sign-page"
                className={selectClass}
                value={pageIndex}
                onChange={(event) => {
                  setPageIndex(Number(event.target.value));
                  setPosition(null);
                }}
              >
                {Array.from({ length: Math.max(info.pages, 1) }, (_, index) => (
                  <option key={index} value={index}>
                    Page {index + 1}
                  </option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <label htmlFor="sign-width" className="flex items-center justify-between text-[12.5px] font-semibold text-ink">
                Signature width
                <span className="tabular-nums text-subtle">{width}% of page</span>
              </label>
              <input
                id="sign-width"
                type="range"
                min={8}
                max={60}
                value={width}
                onChange={(event) => setWidth(Number(event.target.value))}
                className="mt-2 w-full accent-brand-500"
              />
            </div>
          </div>

          {currentThumb && (
            <div className="mt-4">
              <p className="mb-1.5 text-[12.5px] font-semibold text-ink">Click where the signature should go</p>
              <div
                onClick={place}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") setPosition({ x: 0.55, y: 0.2 });
                }}
                className="relative mx-auto w-full max-w-sm cursor-crosshair overflow-hidden rounded-xl border border-line bg-raised shadow-card"
                aria-label="Page preview — click to place the signature"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={currentThumb.url} alt={`Page ${pageIndex + 1}`} className="block w-full" />
                {position && (
                  <span
                    className="pointer-events-none absolute -translate-y-1/2 rounded border-2 border-dashed border-brand-500 bg-brand-500/15"
                    style={{
                      left: `${position.x * 100}%`,
                      top: `${(1 - position.y) * 100}%`,
                      width: `${width}%`,
                      height: "8%",
                    }}
                    aria-hidden="true"
                  />
                )}
              </div>
              <p className="mt-2 text-center text-[11.5px] text-subtle">
                {position ? "Placed. Adjust the width or click again to move it." : "No position chosen yet — the default is lower right."}
              </p>
            </div>
          )}

          {info.error && <Notice tone="danger" className="mt-4">{info.error}</Notice>}
          {error && (
            <Notice tone="danger" className="mt-4" onDismiss={() => setError(null)}>
              {error}
            </Notice>
          )}
          {busy && <ProgressBar value={0.6} label="Placing the signature" />}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={run} disabled={busy || Boolean(info.error)} className="btn-primary w-full sm:w-auto">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <PenLine className="h-4 w-4" aria-hidden="true" />}
              {busy ? "Signing…" : "Sign PDF"}
            </button>
            <p className="text-[12.5px] text-subtle">Your signature never leaves this tab.</p>
          </div>
        </>
      )}
    </ToolFrame>
  );
}
