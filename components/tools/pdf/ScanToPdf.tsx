"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, RotateCcw, Trash2, X } from "lucide-react";
import { buildImagePdf, type PdfImage } from "@/lib/pdf/image-to-pdf";
import { encodeCanvas } from "@/lib/images";
import { track, sizeBucket } from "@/lib/analytics";
import { revokeResults, type ResultFile } from "@/lib/download";
import { fileBaseName, formatBytes, outputName } from "@/lib/utils";
import { Field, inputClass, Notice, ProgressBar, ResultsPanel, ToolFrame, selectClass } from "../kit";

interface Shot {
  id: string;
  blob: Blob;
  url: string;
  width: number;
  height: number;
  bytes: number;
}

type PageSize = "a4" | "letter" | "fit";

/**
 * Phone-camera scanning without an app: open the rear camera, take shots, and
 * turn them into one PDF. Everything — frames included — stays in the tab.
 *
 * The camera needs a secure origin (https or localhost), which is why the tool
 * always offers the file picker as well: on http:// or on a locked-down device
 * the camera is simply unavailable, and that is not an error worth shouting about.
 */
export function ScanToPdf() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [margin, setMargin] = useState("10");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ value: 0, label: "" });
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultFile[]>([]);
  const shotsRef = useRef<Shot[]>([]);
  shotsRef.current = shots;

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      shotsRef.current.forEach((shot) => URL.revokeObjectURL(shot.url));
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("This browser does not expose a camera to web pages. Use the file picker instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 2560 }, height: { ideal: 1440 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
      // Wait for the element before attaching the stream.
      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      }, 0);
    } catch {
      setCameraError(
        "The camera was blocked or is unavailable. Cameras only open on https pages with permission; you can still add photos with the button below.",
      );
      setCameraOn(false);
    }
  };

  const addShot = (shot: Shot) => setShots((current) => [...current, shot]);

  const capture = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await encodeCanvas(canvas, "image/jpeg", 0.9);
    canvas.width = 0;
    canvas.height = 0;
    addShot({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      blob,
      url: URL.createObjectURL(blob),
      width: video.videoWidth,
      height: video.videoHeight,
      bytes: blob.size,
    });
  };

  const addPhotos = async (files: File[]) => {
    setError(null);
    for (const file of files) {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.src = url;
      try {
        await image.decode();
      } catch {
        URL.revokeObjectURL(url);
        setError(`${file.name} could not be read as an image.`);
        continue;
      }
      addShot({
        id: `${file.name}-${Math.random().toString(36).slice(2, 6)}`,
        blob: file,
        url,
        width: image.naturalWidth,
        height: image.naturalHeight,
        bytes: file.size,
      });
    }
  };

  const reset = () => {
    revokeResults(results);
    shots.forEach((shot) => URL.revokeObjectURL(shot.url));
    stopCamera();
    setShots([]);
    setResults([]);
    setError(null);
    setProgress({ value: 0, label: "" });
  };

  const run = async (): Promise<void> => {
    if (!shots.length) {
      setError("Take at least one photo first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const pages: PdfImage[] = [];
      for (let index = 0; index < shots.length; index += 1) {
        setProgress({ value: index / shots.length, label: `Adding photo ${index + 1} of ${shots.length}` });
        const shot = shots[index];
        // buildImagePdf embeds JPEG and PNG directly, so photos are copied as-is.
        pages.push({
          bytes: new Uint8Array(await shot.blob.arrayBuffer()),
          kind: shot.blob.type === "image/png" ? "png" : "jpg",
          width: shot.width,
          height: shot.height,
        });
      }
      const bytes = await buildImagePdf(pages, {
        pageSize: pageSize === "fit" ? "fit" : pageSize,
        orientation: "portrait",
        marginMm: Number(margin) || 0,
      });
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      setResults([
        {
          id: "scan",
          name: outputName(shots.length === 1 ? "scan" : `scan-${shots.length}-pages`, "", "pdf"),
          blob,
          size: blob.size,
          note: `${shots.length} page${shots.length === 1 ? "" : "s"} · photos embedded as images`,
        },
      ]);
      stopCamera();
      track("tool_completed", { tool: "scan-to-pdf", pages: shots.length, size: sizeBucket(blob.size) });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The scan could not be turned into a PDF.");
    } finally {
      setBusy(false);
    }
  };

  if (results.length) {
    return (
      <ToolFrame labelledBy="tool-title">
        <ResultsPanel files={results} onReset={reset} heading="Your scan is a PDF" compare="conversion" />
      </ToolFrame>
    );
  }

  const totalBytes = shots.reduce((sum, shot) => sum + shot.bytes, 0);

  return (
    <ToolFrame labelledBy="tool-title">
      {!cameraOn ? (
        <div className="rounded-2xl border-2 border-dashed border-line bg-surface/60 p-6 text-center sm:p-8">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-brand-600 shadow-card ring-1 ring-line">
            <Camera className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="mt-3 text-[15.5px] font-semibold text-ink">Scan a document with your camera</p>
          <p className="mx-auto mt-1 max-w-md text-[13px] leading-relaxed text-subtle">
            Nothing is recorded or uploaded: frames are captured straight into this tab and turned into a PDF here.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button type="button" onClick={startCamera} className="btn-primary">
              <Camera className="h-4 w-4" aria-hidden="true" />
              Open the camera
            </button>
            <label
              htmlFor="scan-upload"
              className="btn-secondary min-h-[44px] cursor-pointer px-4 text-[13.5px]"
            >
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
              Add photos instead
            </label>
            <input
              id="scan-upload"
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(event) => {
                void addPhotos(Array.from(event.target.files ?? []));
                event.currentTarget.value = "";
              }}
            />
          </div>
          {cameraError && (
            <p className="mx-auto mt-3 max-w-md rounded-lg bg-warning/5 px-3 py-2 text-[12.5px] leading-relaxed text-body">
              {cameraError}
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-ink/95">
          <video ref={videoRef} playsInline muted className="block max-h-[52vh] w-full object-contain" />
          <div className="flex flex-wrap items-center justify-between gap-2 bg-ink px-3 py-2.5">
            <p className="text-[12px] text-white/70">Fill the frame with the page, hold steady, then capture.</p>
            <div className="flex gap-2">
              <button type="button" onClick={capture} className="btn-primary min-h-[40px] px-4 text-[13px]">
                <Camera className="h-4 w-4" aria-hidden="true" />
                Capture ({shots.length})
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/20 px-3 text-[13px] font-semibold text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {shots.length > 0 && (
        <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12.5px] font-semibold text-ink">
              {shots.length} page{shots.length === 1 ? "" : "s"} · {formatBytes(totalBytes)}
            </p>
            <div className="flex gap-2">
              <label htmlFor="scan-more" className="cursor-pointer text-[12px] font-medium text-brand-600 hover:text-brand-700">
                Add more photos
                <input
                  id="scan-more"
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(event) => {
                    void addPhotos(Array.from(event.target.files ?? []));
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              {!cameraOn && (
                <button type="button" onClick={startCamera} className="text-[12px] font-medium text-brand-600 hover:text-brand-700">
                  Camera
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  shots.forEach((shot) => URL.revokeObjectURL(shot.url));
                  setShots([]);
                }}
                className="text-[12px] font-medium text-subtle hover:text-danger"
              >
                Clear
              </button>
            </div>
          </div>

          <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5" aria-label="Captured pages">
            {shots.map((shot, index) => (
              <li key={shot.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={shot.url}
                  alt={`Captured page ${index + 1}`}
                  className="aspect-[3/4] w-full rounded-lg border border-line object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <span className="absolute bottom-1 left-1 rounded bg-ink/80 px-1.5 text-[10.5px] font-semibold text-white">
                  {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(shot.url);
                    setShots((current) => current.filter((entry) => entry.id !== shot.id));
                  }}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white/95 text-danger shadow-sm ring-1 ring-line"
                  aria-label={`Remove captured page ${index + 1}`}
                >
                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Page size" htmlFor="scan-size">
              <select
                id="scan-size"
                className={selectClass}
                value={pageSize}
                onChange={(event) => setPageSize(event.target.value as PageSize)}
              >
                <option value="a4">A4 — standard document</option>
                <option value="letter">US Letter</option>
                <option value="fit">Fit the photo exactly</option>
              </select>
            </Field>
            <Field label="Margin (mm)" htmlFor="scan-margin" hint="0 fills the page edge to edge.">
              <input
                id="scan-margin"
                type="number"
                min={0}
                max={40}
                className={inputClass}
                value={margin}
                onChange={(event) => setMargin(event.target.value)}
              />
            </Field>
          </div>
        </>
      )}

      {error && (
        <Notice tone="danger" className="mt-4" onDismiss={() => setError(null)}>
          {error}
        </Notice>
      )}
      {busy && <ProgressBar value={progress.value} label={progress.label || "Building the PDF"} />}

      {shots.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" onClick={run} disabled={busy} className="btn-primary w-full sm:w-auto">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RotateCcw className="h-4 w-4" aria-hidden="true" />}
            {busy ? "Building…" : `Create PDF from ${shots.length} page${shots.length === 1 ? "" : "s"}`}
          </button>
          <p className="text-[12.5px] text-subtle">Photos are embedded as images — no OCR, so the text is not selectable.</p>
        </div>
      )}
    </ToolFrame>
  );
}
