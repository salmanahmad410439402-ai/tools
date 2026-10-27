"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, PenTool, Trash2 } from "lucide-react";
import { applyAnnotations, type Annotation, type AnnotationKind } from "@/lib/pdf/ops";
import { track } from "@/lib/analytics";
import { revokeResults, type ResultFile } from "@/lib/download";
import { cn, fileBaseName, outputName } from "@/lib/utils";
import { Field, inputClass, Notice, ProgressBar, ResultsPanel, ToolFrame, selectClass } from "../kit";
import { PdfSource, usePdfInfo } from "./PdfSource";
import { usePageThumbs } from "./usePageThumbs";

type Tool = "highlight" | "text" | "rect" | "whiteout" | "draw" | "image";

const TOOLS: { key: Tool; label: string }[] = [
  { key: "text", label: "Text" },
  { key: "highlight", label: "Highlight" },
  { key: "rect", label: "Box" },
  { key: "whiteout", label: "White-out" },
  { key: "draw", label: "Pen" },
  { key: "image", label: "Image" },
];

const COLORS = ["#F59E0B", "#DC2626", "#2563EB", "#0F172A", "#16A34A"];

interface DraftAnnotation extends Annotation {
  previewUrl?: string;
}

export function PdfEditor({
  initialTool = "text",
  toolSlug = "pdf-editor",
}: {
  initialTool?: Tool;
  toolSlug?: string;
} = {}) {
  const [file, setFile] = useState<File | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [tool, setTool] = useState<Tool>(initialTool);
  const [color, setColor] = useState(COLORS[0]);
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState(14);
  const [annotations, setAnnotations] = useState<DraftAnnotation[]>([]);
  const [drawing, setDrawing] = useState<Annotation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultFile[]>([]);
  const started = useRef<{ x: number; y: number } | null>(null);
  const imageBytes = useRef<ArrayBuffer | null>(null);
  const imageUrl = useRef<string | null>(null);

  const info = usePdfInfo(file);
  const preview = usePageThumbs(file, { maxWidth: 860, maxPages: 40 });
  const thumb = preview.thumbs.find((item) => item.pageIndex === pageIndex);

  useEffect(() => {
    setAnnotations([]);
    setPageIndex(0);
  }, [file]);

  const pointFromEvent = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
  };

  const id = () => `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!thumb) return;
    const point = pointFromEvent(event);

    if (tool === "text" || tool === "image") {
      if (tool === "text" && !text.trim()) {
        setError("Type the text you want to place first.");
        return;
      }
      if (tool === "image" && !imageBytes.current) {
        setError("Choose an image to place first.");
        return;
      }
      setError(null);
      setAnnotations((current) => [
        ...current,
        {
          id: id(),
          kind: tool as AnnotationKind,
          pageIndex,
          x: point.x,
          y: point.y,
          width: tool === "image" ? 0.28 : 0.4,
          height: tool === "image" ? 0.16 : 0.06,
          color,
          text: tool === "text" ? text : undefined,
          fontSize,
          imageBytes: tool === "image" ? imageBytes.current ?? undefined : undefined,
          previewUrl: tool === "image" ? imageUrl.current ?? undefined : undefined,
        },
      ]);
      return;
    }

    if (tool === "draw") {
      setDrawing({
        id: id(),
        kind: "draw",
        pageIndex,
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        color,
        points: [point],
      });
      return;
    }

    started.current = point;
    setDrawing({
      id: id(),
      kind: tool as AnnotationKind,
      pageIndex,
      x: point.x,
      y: point.y,
      width: 0,
      height: 0,
      color,
    });
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drawing) return;
    const point = pointFromEvent(event);
    if (drawing.kind === "draw") {
      setDrawing({ ...drawing, points: [...(drawing.points ?? []), point] });
      return;
    }
    const start = started.current;
    if (!start) return;
    setDrawing({
      ...drawing,
      x: Math.min(start.x, point.x),
      y: Math.min(start.y, point.y),
      width: Math.abs(point.x - start.x),
      height: Math.abs(point.y - start.y),
    });
  };

  const onPointerUp = () => {
    if (!drawing) return;
    const finished = drawing;
    setDrawing(null);
    started.current = null;
    if (finished.kind === "draw") {
      if ((finished.points?.length ?? 0) > 2) setAnnotations((current) => [...current, finished]);
      return;
    }
    if (finished.width < 0.01 || finished.height < 0.008) return;
    setAnnotations((current) => [...current, finished]);
  };

  const onImagePick = async (picked: File | null) => {
    if (!picked) return;
    if (imageUrl.current) URL.revokeObjectURL(imageUrl.current);
    imageBytes.current = await picked.arrayBuffer();
    imageUrl.current = URL.createObjectURL(picked);
    setTool("image");
    setError(null);
  };

  const reset = () => {
    revokeResults(results);
    if (imageUrl.current) URL.revokeObjectURL(imageUrl.current);
    imageBytes.current = null;
    imageUrl.current = null;
    setResults([]);
    setFile(null);
    setAnnotations([]);
    setError(null);
  };

  const run = async () => {
    if (!file) return;
    if (!annotations.length) {
      setError("Add at least one annotation before exporting.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const bytes = await applyAnnotations(await file.arrayBuffer(), annotations);
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      setResults([
        {
          id: "edited",
          name: outputName(fileBaseName(file.name), "edited", "pdf"),
          blob,
          size: blob.size,
          originalSize: file.size,
          note: `${annotations.length} annotation${annotations.length === 1 ? "" : "s"} written into the pages`,
        },
      ]);
      track("tool_completed", { tool: toolSlug, annotations: annotations.length });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The document could not be exported.");
    } finally {
      setBusy(false);
    }
  };

  if (results.length) {
    return (
      <ToolFrame labelledBy="tool-title">
        <ResultsPanel files={results} onReset={reset} heading="Your edited PDF is ready" />
      </ToolFrame>
    );
  }

  const pageAnnotations = annotations.filter((annotation) => annotation.pageIndex === pageIndex);

  return (
    <ToolFrame labelledBy="tool-title">
      <PdfSource file={file} onFile={(next) => { setFile(next); setError(null); }} onRemove={() => setFile(null)} />

      {file && (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-2" role="group" aria-label="Annotation tool">
            {TOOLS.map((entry) => (
              <button
                key={entry.key}
                type="button"
                onClick={() => setTool(entry.key)}
                aria-pressed={tool === entry.key}
                className={cn(
                  "min-h-[38px] rounded-lg border px-3 text-[12.5px] font-semibold transition-colors",
                  tool === entry.key
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-line bg-raised text-body hover:border-primary/40",
                )}
              >
                {entry.label}
              </button>
            ))}
            <span className="ml-auto flex items-center gap-1.5">
              {COLORS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setColor(value)}
                  aria-label={`Use colour ${value}`}
                  aria-pressed={color === value}
                  className={cn(
                    "h-6 w-6 rounded-full border-2 transition-transform",
                    color === value ? "border-ink scale-110" : "border-white ring-1 ring-line",
                  )}
                  style={{ backgroundColor: value }}
                />
              ))}
            </span>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <Field label="Page" htmlFor="editor-page">
              <select
                id="editor-page"
                className={selectClass}
                value={pageIndex}
                onChange={(event) => setPageIndex(Number(event.target.value))}
              >
                {Array.from({ length: Math.max(info.pages, 1) }, (_, index) => (
                  <option key={index} value={index}>
                    Page {index + 1}
                  </option>
                ))}
              </select>
            </Field>

            {tool === "text" && (
              <>
                <Field label="Text to place" htmlFor="editor-text" className="sm:col-span-2">
                  <input
                    id="editor-text"
                    className={inputClass}
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="Correction, note or date"
                  />
                </Field>
                <Field label="Text size" htmlFor="editor-size">
                  <input
                    id="editor-size"
                    type="number"
                    min={8}
                    max={40}
                    className={inputClass}
                    value={fontSize}
                    onChange={(event) => setFontSize(Number(event.target.value))}
                  />
                </Field>
              </>
            )}

            {tool === "image" && (
              <div className="sm:col-span-3">
                <label htmlFor="editor-image" className="mb-1.5 block text-[12.5px] font-semibold text-ink">
                  Image to place
                </label>
                <input
                  id="editor-image"
                  type="file"
                  accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                  onChange={(event) => onImagePick(event.target.files?.[0] ?? null)}
                  className="block w-full cursor-pointer rounded-lg border border-line bg-raised px-3 py-2 text-[13px] file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-[12.5px] file:font-semibold file:text-brand-700"
                />
              </div>
            )}
          </div>

          {thumb ? (
            <div className="mt-4">
              <p className="mb-1.5 text-[12px] text-subtle">
                {tool === "text" || tool === "image"
                  ? "Click on the page to place it."
                  : tool === "draw"
                    ? "Draw on the page with your mouse or finger."
                    : "Drag on the page to draw the area."}
              </p>
              <div
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
                className="relative mx-auto w-full max-w-xl touch-none overflow-hidden rounded-xl border border-line bg-raised shadow-card"
                style={{ cursor: tool === "text" ? "text" : "crosshair" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumb.url} alt={`Page ${pageIndex + 1}`} className="block w-full select-none" draggable={false} />

                {pageAnnotations.map((annotation) => {
                  if (annotation.kind === "draw") {
                    const points = annotation.points ?? [];
                    return (
                      <svg key={annotation.id} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
                        <polyline
                          points={points.map((point) => `${point.x * 100}%,${point.y * 100}%`).join(" ")}
                          fill="none"
                          stroke={annotation.color}
                          strokeWidth={2.5}
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                    );
                  }
                  if (annotation.kind === "text") {
                    return (
                      <span
                        key={annotation.id}
                        className="pointer-events-none absolute whitespace-pre"
                        style={{
                          left: `${annotation.x * 100}%`,
                          top: `${annotation.y * 100}%`,
                          color: annotation.color,
                          fontSize: `${(annotation.fontSize ?? 14) * 0.62}px`,
                        }}
                      >
                        {annotation.text}
                      </span>
                    );
                  }
                  if (annotation.kind === "image" && annotation.previewUrl) {
                    return (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={annotation.id}
                        src={annotation.previewUrl}
                        alt=""
                        className="pointer-events-none absolute object-contain"
                        style={{
                          left: `${annotation.x * 100}%`,
                          top: `${annotation.y * 100}%`,
                          width: `${annotation.width * 100}%`,
                          height: `${annotation.height * 100}%`,
                        }}
                      />
                    );
                  }
                  return (
                    <span
                      key={annotation.id}
                      className="pointer-events-none absolute"
                      style={{
                        left: `${annotation.x * 100}%`,
                        top: `${annotation.y * 100}%`,
                        width: `${annotation.width * 100}%`,
                        height: `${annotation.height * 100}%`,
                        backgroundColor:
                          annotation.kind === "highlight"
                            ? `${annotation.color}55`
                            : annotation.kind === "whiteout"
                              ? "#ffffff"
                              : "transparent",
                        border: annotation.kind === "rect" ? `2px solid ${annotation.color}` : undefined,
                      }}
                    />
                  );
                })}

                {drawing && drawing.kind !== "draw" && (
                  <span
                    className="pointer-events-none absolute border-2 border-dashed border-brand-500 bg-brand-500/10"
                    style={{
                      left: `${drawing.x * 100}%`,
                      top: `${drawing.y * 100}%`,
                      width: `${drawing.width * 100}%`,
                      height: `${drawing.height * 100}%`,
                    }}
                  />
                )}
              </div>
            </div>
          ) : (
            <ProgressBar value={preview.progress} label="Rendering the page" />
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12.5px] text-subtle">
              {annotations.length} annotation{annotations.length === 1 ? "" : "s"} · {pageAnnotations.length} on this page
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAnnotations((current) => current.filter((item) => item.pageIndex !== pageIndex))}
                disabled={!pageAnnotations.length}
                className="btn-secondary min-h-[38px] px-3 text-[12.5px]"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Clear this page
              </button>
              <button
                type="button"
                onClick={() => setAnnotations([])}
                disabled={!annotations.length}
                className="btn-secondary min-h-[38px] px-3 text-[12.5px]"
              >
                Clear all
              </button>
            </div>
          </div>

          <Notice tone="warning" className="mt-4">
            White-out covers text visually but does not remove it from the file. Never use it for confidential data —
            that needs real redaction.
          </Notice>

          {info.error && <Notice tone="danger" className="mt-4">{info.error}</Notice>}
          {error && (
            <Notice tone="danger" className="mt-4" onDismiss={() => setError(null)}>
              {error}
            </Notice>
          )}
          {busy && <ProgressBar value={0.6} label="Writing annotations into the pages" />}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={run} disabled={busy || !annotations.length} className="btn-primary w-full sm:w-auto">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <PenTool className="h-4 w-4" aria-hidden="true" />}
              {busy ? "Exporting…" : "Export PDF"}
            </button>
            <p className="inline-flex items-center gap-1.5 text-[12.5px] text-subtle">
              <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
              Existing text is not reflowed — this editor annotates the page.
            </p>
          </div>
        </>
      )}
    </ToolFrame>
  );
}
