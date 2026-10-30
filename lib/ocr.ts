/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  OCR — recognising text in a scan, in the browser
 *
 *  tesseract.js (Apache-2.0) compiles Tesseract to WebAssembly and runs it in a
 *  Web Worker, so no pixel ever leaves the machine. The engine, its WASM core
 *  and the English language data are served from this site (copied out of
 *  node_modules into /public/ocr by scripts/copy-ocr-assets.mjs), which means
 *  OCR works on a static host with no third-party CDN in the path.
 *
 *  Recognition is CPU-bound: expect a few seconds per page on a laptop and
 *  noticeably longer on a phone. Language data is English only, and the pages
 *  page says so rather than pretending otherwise.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface OcrWord {
  text: string;
  /** Pixels in the recognised image. */
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OcrPage {
  pageNumber: number;
  text: string;
  words: OcrWord[];
  confidence: number;
  /** Rendered image size in pixels, used to place the text layer. */
  imageWidth: number;
  imageHeight: number;
}

/** Minimal structural typing for the worker, so the type import stays optional. */
type TesseractWorker = {
  recognize: (
    image: HTMLCanvasElement | Blob | File,
    options?: Record<string, unknown>,
    output?: Record<string, boolean>,
  ) => Promise<{ data: { text: string; blocks: unknown[] | null; confidence: number } }>;
  terminate: () => Promise<unknown>;
};

export type OcrProgress = (status: string, progress: number) => void;

/** Flattens tesseract's block → paragraph → line → word tree. */
export function flattenWords(blocks: unknown[] | null): OcrWord[] {
  const words: OcrWord[] = [];
  if (!blocks) return words;
  for (const block of blocks as { paragraphs?: { lines?: { words?: { text?: string; bbox?: Record<string, number> }[] }[] }[] }[]) {
    for (const paragraph of block.paragraphs ?? []) {
      for (const line of paragraph.lines ?? []) {
        for (const word of line.words ?? []) {
          const text = (word.text ?? "").trim();
          const bbox = word.bbox;
          if (!text || !bbox) continue;
          words.push({
            text,
            x0: Number(bbox.x0 ?? 0),
            y0: Number(bbox.y0 ?? 0),
            x1: Number(bbox.x1 ?? 0),
            y1: Number(bbox.y1 ?? 0),
          });
        }
      }
    }
  }
  return words;
}

/** Creates the worker with every asset pointed at this site. */
export async function createOcrWorker(progress?: OcrProgress): Promise<TesseractWorker> {
  const { createWorker } = await import("tesseract.js");
  const simd = await supportsSimd();
  const worker = await createWorker("eng", 1, {
    workerPath: "/ocr/worker.min.js",
    corePath: simd ? "/ocr/tesseract-core-simd-lstm.wasm.js" : "/ocr/tesseract-core-lstm.wasm.js",
    langPath: "/ocr/lang",
    gzip: true,
    // The worker must load from its real URL, not a blob: the WASM core is
    // resolved relative to the worker's own location, and a blob: worker has no
    // useful base URL. Both assets are same-origin, so no CORS is involved.
    workerBlobURL: false,
    logger: (message: { status?: string; progress?: number }) => {
      if (progress && message.status) progress(message.status, Number(message.progress ?? 0));
    },
    errorHandler: (error: unknown) => {
      console.error("[ocr]", error);
    },
  });
  return worker as unknown as TesseractWorker;
}

/** Feature-detects WASM SIMD so the right core build is downloaded. */
async function supportsSimd(): Promise<boolean> {
  try {
    // A tiny module that uses a v128 instruction; instantiation is not needed.
    return WebAssembly.validate(
      new Uint8Array([
        0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 10, 9, 1, 7, 0, 65, 0, 253, 15, 26, 11,
      ]),
    );
  } catch {
    return false;
  }
}

/** Image → canvas, so tesseract gets a predictable input. */
export async function imageToCanvas(source: Blob): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(source);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot prepare the image for OCR.");
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  return canvas;
}

/** Recognises one image and returns its text, words and confidence. */
export async function recognise(
  worker: TesseractWorker,
  image: HTMLCanvasElement,
  pageNumber: number,
): Promise<OcrPage> {
  const result = await worker.recognize(image, {}, { text: true, blocks: true });
  return {
    pageNumber,
    text: result.data.text ?? "",
    words: flattenWords(result.data.blocks),
    confidence: Number(result.data.confidence ?? 0),
    imageWidth: image.width,
    imageHeight: image.height,
  };
}

/** Joins pages into one transcript, keeping a page marker the user can search. */
export function transcriptOf(pages: OcrPage[], includeMarkers = true): string {
  return pages
    .map((page) => {
      const body = page.text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
      return includeMarkers ? `--- Page ${page.pageNumber} ---\n${body}` : body;
    })
    .join("\n\n")
    .trim();
}

export function averageConfidence(pages: OcrPage[]): number {
  if (!pages.length) return 0;
  return Math.round(pages.reduce((sum, page) => sum + page.confidence, 0) / pages.length);
}

export function countRecognisedWords(pages: OcrPage[]): number {
  return pages.reduce((sum, page) => sum + (page.text.match(/\S+/g)?.length ?? 0), 0);
}
