/**
 * Shared pdf.js loader. pdf.js is ~400 KB of JavaScript plus a 1.4 MB worker,
 * so it is imported dynamically the first time a page needs to *read* a PDF.
 * It is never part of the initial page bundle.
 */
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

export function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

export async function loadPdfjsDocument(data: ArrayBuffer): Promise<PDFDocumentProxy> {
  const pdfjs = await getPdfjs();
  // pdf.js transfers the buffer to the worker, so hand it a private copy.
  return pdfjs.getDocument({ data: new Uint8Array(data.slice(0)), isEvalSupported: false }).promise;
}

export async function renderPageToCanvas(
  page: PDFPageProxy,
  scale: number,
  background = "#FFFFFF",
): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Canvas is not available in this browser.");
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: context, viewport, intent: "print" }).promise;
  return canvas;
}

export function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("The browser could not encode this page."))),
      "image/jpeg",
      quality,
    );
  });
}

export function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("The browser could not encode this page."))),
      "image/png",
    );
  });
}

/** Friendly messages for the failures people actually hit. */
export function describePdfError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/password/i.test(message)) {
    return "This PDF is password-protected. Enter the password in your PDF viewer, export an unlocked copy, then try again.";
  }
  if (/Invalid PDF|InvalidPDF|structure|Missing PDF/i.test(message)) {
    return "This file is not a valid PDF, or it is damaged. Try re-downloading it and making sure it opens in a normal PDF viewer first.";
  }
  if (/worker/i.test(message)) {
    return "The PDF engine failed to load. Check your connection, reload the page and try again.";
  }
  if (/memory|allocation/i.test(message)) {
    return "Your browser ran out of memory for this file. Close other tabs, or try a smaller file or fewer pages at once.";
  }
  return `Something went wrong while reading the PDF. ${message.slice(0, 160)}`;
}
