"use client";

import { useState } from "react";
import { Loader2, Stamp, Upload } from "lucide-react";
import { addImageWatermark, addTextWatermark, type WatermarkPlacement } from "@/lib/pdf/ops";
import { track } from "@/lib/analytics";
import { revokeResults, type ResultFile } from "@/lib/download";
import { fileBaseName, outputName } from "@/lib/utils";
import { Field, inputClass, Notice, ProgressBar, ResultsPanel, Segmented, ToolFrame, selectClass } from "../kit";
import { PdfSource, usePdfInfo } from "./PdfSource";
import { useAutoFocus } from "@/components/ToolFocusShell";

type Mode = "text" | "image";

export function WatermarkPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("DRAFT");
  const [color, setColor] = useState("gray");
  const [fontSize, setFontSize] = useState("54");
  const [opacity, setOpacity] = useState(15);
  const [rotation, setRotation] = useState(45);
  const [placement, setPlacement] = useState<WatermarkPlacement>("center");
  const [image, setImage] = useState<File | null>(null);
  const [scale, setScale] = useState(30);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultFile[]>([]);
  const info = usePdfInfo(file);
  // A page being open is the cue to give the preview the whole width.
  useAutoFocus(Boolean(file) && Boolean(info.pages));

  const reset = () => {
    revokeResults(results);
    setResults([]);
    setFile(null);
    setImage(null);
    setError(null);
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const bytes =
        mode === "text"
          ? await addTextWatermark(buffer, {
              text,
              fontSize: Math.max(8, Math.min(144, Number(fontSize) || 54)),
              opacity: opacity / 100,
              rotation,
              placement,
              color: color as "gray" | "red" | "blue" | "black",
            })
          : await (async () => {
              if (!image) throw new Error("Upload a PNG or JPG logo first.");
              const kind = image.type === "image/png" || image.name.toLowerCase().endsWith(".png") ? "png" : "jpg";
              return addImageWatermark(buffer, await image.arrayBuffer(), kind, {
                opacity: opacity / 100,
                scale: scale / 100,
                placement,
                rotation,
              });
            })();

      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      setResults([
        {
          id: "watermarked",
          name: outputName(fileBaseName(file.name), "watermarked", "pdf"),
          blob,
          size: blob.size,
          originalSize: file.size,
          note: mode === "text" ? `“${text}” at ${opacity}% opacity` : `Logo at ${scale}% page width`,
        },
      ]);
      track("tool_completed", { tool: "watermark-pdf", mode });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The watermark could not be applied.");
    } finally {
      setBusy(false);
    }
  };

  if (results.length) {
    return (
      <ToolFrame labelledBy="tool-title">
        <ResultsPanel files={results} onReset={reset} heading="Watermark applied" />
      </ToolFrame>
    );
  }

  return (
    <ToolFrame labelledBy="tool-title">
      <PdfSource file={file} onFile={(next) => { setFile(next); setError(null); }} onRemove={() => setFile(null)} />

      {file && (
        <>
          <div className="mt-5">
            <Segmented<Mode>
              label="Watermark type"
              value={mode}
              onChange={setMode}
              options={[
                { value: "text", label: "Text", hint: "DRAFT, CONFIDENTIAL, a client name" },
                { value: "image", label: "Image", hint: "A logo or signature PNG" },
              ]}
            />
          </div>

          {mode === "text" ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Watermark text" htmlFor="wm-text" hint="Keep it short — it is a single line.">
                <input id="wm-text" className={inputClass} value={text} onChange={(event) => setText(event.target.value)} />
              </Field>
              <Field label="Colour" htmlFor="wm-color">
                <select id="wm-color" className={selectClass} value={color} onChange={(event) => setColor(event.target.value)}>
                  <option value="gray">Grey</option>
                  <option value="red">Red</option>
                  <option value="blue">Blue</option>
                  <option value="black">Black</option>
                </select>
              </Field>
              <Field label="Font size (pt)" htmlFor="wm-size">
                <input
                  id="wm-size"
                  type="number"
                  min={8}
                  max={144}
                  className={inputClass}
                  value={fontSize}
                  onChange={(event) => setFontSize(event.target.value)}
                />
              </Field>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-line bg-surface p-4">
              <label htmlFor="wm-image" className="mb-1.5 block text-[12.5px] font-semibold text-ink">
                Logo image (PNG with transparency works best)
              </label>
              <input
                id="wm-image"
                type="file"
                accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                onChange={(event) => setImage(event.target.files?.[0] ?? null)}
                className="block w-full cursor-pointer rounded-lg border border-line bg-raised px-3 py-2 text-[13px] file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-[12.5px] file:font-semibold file:text-brand-700"
              />
              {image && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-success">
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  {image.name} selected
                </p>
              )}
              <div className="mt-3">
                <label htmlFor="wm-scale" className="flex items-center justify-between text-[12.5px] font-semibold text-ink">
                  Size: {scale}% of page width
                </label>
                <input
                  id="wm-scale"
                  type="range"
                  min={5}
                  max={80}
                  value={scale}
                  onChange={(event) => setScale(Number(event.target.value))}
                  className="mt-2 w-full accent-brand-500"
                />
              </div>
            </div>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="wm-opacity" className="flex items-center justify-between text-[12.5px] font-semibold text-ink">
                Opacity
                <span className="tabular-nums text-subtle">{opacity}%</span>
              </label>
              <input
                id="wm-opacity"
                type="range"
                min={5}
                max={100}
                value={opacity}
                onChange={(event) => setOpacity(Number(event.target.value))}
                className="mt-2 w-full accent-brand-500"
              />
            </div>
            <div>
              <label htmlFor="wm-rotation" className="flex items-center justify-between text-[12.5px] font-semibold text-ink">
                Angle
                <span className="tabular-nums text-subtle">{rotation}°</span>
              </label>
              <input
                id="wm-rotation"
                type="range"
                min={0}
                max={90}
                step={15}
                value={rotation}
                onChange={(event) => setRotation(Number(event.target.value))}
                className="mt-2 w-full accent-brand-500"
              />
            </div>
            <Field label="Placement" htmlFor="wm-placement">
              <select
                id="wm-placement"
                className={selectClass}
                value={placement}
                onChange={(event) => setPlacement(event.target.value as WatermarkPlacement)}
              >
                <option value="center">Centre</option>
                <option value="tile">Tiled across the page</option>
                <option value="bottom-right">Bottom right</option>
                <option value="top-left">Top left</option>
              </select>
            </Field>
          </div>

          <Notice tone="warning" className="mt-4">
            A watermark signals status — it is not security. Anyone with a PDF editor can remove it. For real protection,
            use a password.
          </Notice>

          {info.error && <Notice tone="danger" className="mt-4">{info.error}</Notice>}
          {error && (
            <Notice tone="danger" className="mt-4" onDismiss={() => setError(null)}>
              {error}
            </Notice>
          )}
          {busy && <ProgressBar value={0.6} label="Stamping pages" />}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={run} disabled={busy || Boolean(info.error)} className="btn-primary w-full sm:w-auto">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Stamp className="h-4 w-4" aria-hidden="true" />}
              {busy ? "Applying…" : "Apply watermark"}
            </button>
            <p className="text-[12.5px] text-subtle">
              {info.pages ? `${info.pages} page${info.pages === 1 ? "" : "s"} · ` : ""}applied to every page
            </p>
          </div>
        </>
      )}
    </ToolFrame>
  );
}
