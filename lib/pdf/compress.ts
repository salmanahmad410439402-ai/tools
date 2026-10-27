import { PDFDocument, PDFName, PDFDict, PDFRawStream, PDFNumber, PDFRef } from "pdf-lib";
import { loadPdfjsDocument, renderPageToCanvas, canvasToJpeg, describePdfError } from "./pdfjs";

export type CompressionLevel = "light" | "recommended" | "strong";

export interface CompressOptions {
  level: CompressionLevel;
  /** When set (and level is "strong"), the compressor tries to land under this many bytes. */
  targetBytes?: number;
  onProgress?: (ratio: number, label: string) => void;
}

export interface CompressOutcome {
  blob: Blob;
  mode: "structure" | "images" | "raster";
  /** Human-readable note explaining what actually happened. */
  note: string;
  pages: number;
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Level 1+2: rewrite the PDF structure, keep the text layer intact          */
/* ────────────────────────────────────────────────────────────────────────── */

function stripMetadata(doc: PDFDocument) {
  try {
    doc.setTitle("");
    doc.setAuthor("");
    doc.setSubject("");
    doc.setKeywords([]);
    doc.setCreator("Filecraft");
    doc.setProducer("Filecraft (browser)");
    const info = doc.context.trailerInfo.Info;
    if (info) {
      // Drop the XMP packet too — it often carries thumbnails and app history.
      const catalog = doc.catalog;
      if (catalog.has(PDFName.of("Metadata"))) catalog.delete(PDFName.of("Metadata"));
    }
  } catch {
    /* Metadata is optional; never fail a compression because of it. */
  }
}

function isRgbJpegImage(dict: PDFDict): boolean {
  const subtype = dict.get(PDFName.of("Subtype"));
  if (!(subtype instanceof PDFName) || subtype.asString() !== "/Image") return false;

  const filter = dict.lookup(PDFName.of("Filter"));
  if (!(filter instanceof PDFName) || filter.asString() !== "/DCTDecode") return false;
  // Multi-filter chains and decode parameters change how the bytes must be read.
  if (dict.has(PDFName.of("DecodeParms"))) return false;
  const colorSpace = dict.lookup(PDFName.of("ColorSpace"));
  if (!(colorSpace instanceof PDFName) || colorSpace.asString() !== "/DeviceRGB") return false;
  if (dict.has(PDFName.of("SMask"))) return false; // keep masked images byte-identical
  const imageMask = dict.lookup(PDFName.of("ImageMask"));
  if (imageMask) return false;
  return true;
}

/**
 * Re-encodes embedded JPEG images that are larger than needed.
 * Text, vectors and layout are untouched, so the document stays selectable.
 */
async function downsampleImages(
  doc: PDFDocument,
  maxEdge: number,
  quality: number,
  onProgress?: (ratio: number, label: string) => void,
): Promise<number> {
  const candidates: { ref: PDFRef; stream: PDFRawStream; width: number; height: number }[] = [];

  for (const [ref, object] of doc.context.enumerateIndirectObjects()) {
    if (!(ref instanceof PDFRef) || !(object instanceof PDFRawStream)) continue;
    const dict = object.dict;
    if (!isRgbJpegImage(dict)) continue;
    const width = dict.lookup(PDFName.of("Width"));
    const height = dict.lookup(PDFName.of("Height"));
    if (!(width instanceof PDFNumber) || !(height instanceof PDFNumber)) continue;
    const w = width.asNumber();
    const h = height.asNumber();
    if (!w || !h) continue;
    const bytes = object.contents;
    if (bytes.length < 60_000) continue; // small images are not worth the CPU
    if (Math.max(w, h) <= maxEdge && bytes.length < 400_000) continue;
    candidates.push({ ref, stream: object, width: w, height: h });
  }

  let replaced = 0;
  for (let index = 0; index < candidates.length; index += 1) {
    const item = candidates[index];
    try {
      const jpegBlob = new Blob([item.stream.contents as unknown as BlobPart], { type: "image/jpeg" });
      const bitmap = await createImageBitmap(jpegBlob);
      const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
      const targetWidth = Math.max(1, Math.round(bitmap.width * scale));
      const targetHeight = Math.max(1, Math.round(bitmap.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Canvas unavailable");
      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, targetWidth, targetHeight);
      context.imageSmoothingQuality = "high";
      context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
      bitmap.close?.();

      const recompressed = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality),
      );
      canvas.width = 0;
      canvas.height = 0;
      if (!recompressed) throw new Error("Encode failed");
      if (recompressed.size >= item.stream.contents.length * 0.92) continue;

      const newBytes = new Uint8Array(await recompressed.arrayBuffer());
      const newDict = item.stream.dict.clone(doc.context) as PDFDict;
      newDict.set(PDFName.of("Width"), PDFNumber.of(targetWidth));
      newDict.set(PDFName.of("Height"), PDFNumber.of(targetHeight));
      doc.context.assign(item.ref, PDFRawStream.of(newDict, newBytes));
      replaced += 1;
    } catch {
      /* Leave this image exactly as it was. */
    }
    onProgress?.((index + 1) / Math.max(candidates.length, 1), "Recompressing images");
  }

  return replaced;
}

async function rebuildWithImages(
  data: ArrayBuffer,
  maxEdge: number,
  quality: number,
  onProgress?: (ratio: number, label: string) => void,
): Promise<CompressOutcome> {
  const doc = await PDFDocument.load(data, { updateMetadata: false });
  const pages = doc.getPageCount();
  onProgress?.(0.1, "Reading the PDF");
  const replaced = await downsampleImages(doc, maxEdge, quality, (ratio, label) =>
    onProgress?.(0.1 + ratio * 0.6, label),
  );
  stripMetadata(doc);
  onProgress?.(0.8, "Writing the smaller file");
  const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false });
  const note =
    replaced > 0
      ? `Text stays selectable. ${replaced} embedded image${replaced === 1 ? "" : "s"} recompressed.`
      : "Text stays selectable. No embedded images needed recompressing, so the saving comes from a cleaner file structure.";
  return { blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }), mode: "images", note, pages };
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Level 3: rasterise every page (smallest files, text becomes an image)     */
/* ────────────────────────────────────────────────────────────────────────── */

async function rasterize(
  data: ArrayBuffer,
  dpi: number,
  quality: number,
  onProgress?: (ratio: number, label: string) => void,
): Promise<{ blob: Blob; pages: number }> {
  const pdf = await loadPdfjsDocument(data);
  const out = await PDFDocument.create();
  const total = pdf.numPages;

  for (let pageNumber = 1; pageNumber <= total; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const base = page.getViewport({ scale: 1 });
    const canvas = await renderPageToCanvas(page, dpi / 72);
    const jpeg = await canvasToJpeg(canvas, quality);
    const embedded = await out.embedJpg(new Uint8Array(await jpeg.arrayBuffer()));
    const outPage = out.addPage([base.width, base.height]);
    outPage.drawImage(embedded, { x: 0, y: 0, width: base.width, height: base.height });
    canvas.width = 0;
    canvas.height = 0;
    page.cleanup();
    onProgress?.(pageNumber / total, `Rendering page ${pageNumber} of ${total}`);
  }

  try {
    await pdf.destroy();
  } catch {
    /* ignore */
  }

  const bytes = await out.save({ useObjectStreams: true });
  return { blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }), pages: total };
}

async function validatePdf(blob: Blob, expectedPages: number): Promise<boolean> {
  try {
    const buffer = await blob.arrayBuffer();
    const doc = await loadPdfjsDocument(buffer);
    const ok = doc.numPages === expectedPages;
    await doc.destroy();
    return ok;
  } catch {
    return false;
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Public entry point                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

export async function compressPdf(file: File, options: CompressOptions): Promise<CompressOutcome> {
  const data = await file.arrayBuffer();
  const { level, targetBytes, onProgress } = options;

  try {
    if (level === "strong") {
      const presets = targetBytes
        ? [
            { dpi: 150, quality: 0.72 },
            { dpi: 130, quality: 0.62 },
            { dpi: 110, quality: 0.55 },
            { dpi: 96, quality: 0.48 },
            { dpi: 80, quality: 0.42 },
            { dpi: 66, quality: 0.36 },
            { dpi: 54, quality: 0.3 },
          ]
        : [{ dpi: 150, quality: 0.7 }];

      let best: { blob: Blob; pages: number } | null = null;
      for (const preset of presets) {
        onProgress?.(0.02, `Rasterising at ${preset.dpi} DPI`);
        const attempt = await rasterize(data, preset.dpi, preset.quality, (ratio, label) =>
          onProgress?.(0.02 + ratio * 0.9, label),
        );
        if (!best || attempt.blob.size < best.blob.size) best = attempt;
        if (!targetBytes || attempt.blob.size <= targetBytes) break;
      }
      if (!best) throw new Error("Rendering produced no output.");
      const valid = await validatePdf(best.blob, best.pages);
      if (!valid) {
        onProgress?.(0.97, "Falling back to a safe mode");
        return await rebuildWithImages(data, 1400, 0.72, onProgress);
      }
      onProgress?.(1, "Done");
      return {
        blob: best.blob,
        mode: "raster",
        note: targetBytes
          ? "Pages were rasterised to reach your target size, so text is no longer selectable."
          : "Pages were rasterised at 150 DPI, so text is no longer selectable or searchable.",
        pages: best.pages,
      };
    }

    if (level === "recommended") {
      return await rebuildWithImages(data, 1400, 0.72, onProgress);
    }

    // Light: lossless structure rewrite.
    onProgress?.(0.2, "Rebuilding the file");
    const doc = await PDFDocument.load(data, { updateMetadata: false });
    const pages = doc.getPageCount();
    stripMetadata(doc);
    // Remove page thumbnails some scanners embed — they are pure dead weight.
    for (const page of doc.getPages()) {
      if (page.node.has(PDFName.of("Thumb"))) page.node.delete(PDFName.of("Thumb"));
    }
    onProgress?.(0.7, "Writing the smaller file");
    const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false });
    onProgress?.(1, "Done");
    return {
      blob: new Blob([bytes as unknown as BlobPart], { type: "application/pdf" }),
      mode: "structure",
      note: "Text stays selectable and nothing is re-rendered. Savings on already-optimised PDFs are often small.",
      pages,
    };
  } catch (error) {
    throw new Error(describePdfError(error));
  }
}

/** Cheap pre-flight check so the UI can warn before heavy work starts. */
export async function inspectPdf(file: File): Promise<{ pages: number; encrypted: boolean }> {
  try {
    const doc = await PDFDocument.load(await file.arrayBuffer(), {
      updateMetadata: false,
      ignoreEncryption: true,
    });
    return { pages: doc.getPageCount(), encrypted: doc.isEncrypted };
  } catch {
    return { pages: 0, encrypted: false };
  }
}
