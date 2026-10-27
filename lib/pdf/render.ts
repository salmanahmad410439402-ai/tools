import { loadPdfjsDocument, renderPageToCanvas, canvasToJpeg, canvasToPng, canvasToWebp } from "./pdfjs";

export interface RenderedPage {
  pageIndex: number;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

/** Renders selected pages at a target scale for previews. */
export async function renderPages(
  bytes: ArrayBuffer,
  options: { scale?: number; pages?: number[]; onProgress?: (ratio: number, label: string) => void; maxPages?: number } = {},
): Promise<RenderedPage[]> {
  const pdf = await loadPdfjsDocument(bytes);
  const total = pdf.numPages;
  const list = (options.pages ?? Array.from({ length: total }, (_, index) => index)).filter(
    (page) => page >= 0 && page < total,
  );
  const limited = options.maxPages ? list.slice(0, options.maxPages) : list;
  const results: RenderedPage[] = [];

  for (let index = 0; index < limited.length; index += 1) {
    const pageIndex = limited[index];
    const page = await pdf.getPage(pageIndex + 1);
    const canvas = await renderPageToCanvas(page, options.scale ?? 1);
    results.push({ pageIndex, canvas, width: canvas.width, height: canvas.height });
    page.cleanup();
    options.onProgress?.((index + 1) / limited.length, `Rendering page ${pageIndex + 1} of ${total}`);
  }

  await pdf.destroy();
  return results;
}

/** Data URLs for thumbnails; capped width keeps memory sane for 100-page files. */
export async function renderThumbnails(
  bytes: ArrayBuffer,
  options: { maxWidth?: number; pages?: number[]; maxPages?: number; onProgress?: (ratio: number, label: string) => void } = {},
): Promise<{ pageIndex: number; url: string; width: number; height: number; aspect: number }[]> {
  const pdf = await loadPdfjsDocument(bytes);
  const total = pdf.numPages;
  const list = (options.pages ?? Array.from({ length: total }, (_, index) => index)).filter(
    (page) => page >= 0 && page < total,
  );
  const limited = options.maxPages ? list.slice(0, options.maxPages) : list;
  const maxWidth = options.maxWidth ?? 180;
  const thumbs: { pageIndex: number; url: string; width: number; height: number; aspect: number }[] = [];

  for (let index = 0; index < limited.length; index += 1) {
    const pageIndex = limited[index];
    const page = await pdf.getPage(pageIndex + 1);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(1.4, maxWidth / base.width) || 0.3;
    const canvas = await renderPageToCanvas(page, scale);
    const url = canvas.toDataURL("image/jpeg", 0.72);
    thumbs.push({ pageIndex, url, width: canvas.width, height: canvas.height, aspect: canvas.width / canvas.height });
    canvas.width = 0;
    canvas.height = 0;
    page.cleanup();
    options.onProgress?.((index + 1) / limited.length, `Rendering page ${pageIndex + 1} of ${total}`);
  }

  await pdf.destroy();
  return thumbs;
}

export type ImageExportFormat = "jpg" | "png" | "webp";

/** PDF → JPG/PNG at a chosen DPI (72 DPI = 1:1 with the PDF's own points). */
export async function pdfToImages(
  bytes: ArrayBuffer,
  options: {
    format: ImageExportFormat;
    dpi: number;
    quality: number;
    pages?: number[];
    onProgress?: (ratio: number, label: string) => void;
  },
): Promise<{ pageIndex: number; blob: Blob }[]> {
  const pdf = await loadPdfjsDocument(bytes);
  const total = pdf.numPages;
  const list = (options.pages ?? Array.from({ length: total }, (_, index) => index)).filter(
    (page) => page >= 0 && page < total,
  );
  const results: { pageIndex: number; blob: Blob }[] = [];

  for (let index = 0; index < list.length; index += 1) {
    const pageIndex = list[index];
    const page = await pdf.getPage(pageIndex + 1);
    const canvas = await renderPageToCanvas(page, options.dpi / 72);
    const blob =
      options.format === "jpg"
        ? await canvasToJpeg(canvas, options.quality / 100)
        : options.format === "webp"
          ? await canvasToWebp(canvas, options.quality / 100)
          : await canvasToPng(canvas);
    results.push({ pageIndex, blob });
    canvas.width = 0;
    canvas.height = 0;
    page.cleanup();
    options.onProgress?.((index + 1) / list.length, `Converting page ${pageIndex + 1} of ${total}`);
  }

  await pdf.destroy();
  return results;
}
