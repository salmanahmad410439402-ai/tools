import { PDFDocument } from "pdf-lib";

/**
 * Page assembly for the Image to PDF tool.
 *
 * Kept free of DOM APIs so the maths can be tested outside a browser
 * (see scripts/smoke-test.mjs). The React component only decodes images and
 * hands over bytes + dimensions.
 */

export type PageSizeKey = "a4" | "letter" | "a5" | "fit";
export type PageOrientation = "auto" | "portrait" | "landscape";

/** A4, Letter and A5 in PDF points (1 pt = 1/72 inch). */
export const PAGE_SIZES: Record<Exclude<PageSizeKey, "fit">, { w: number; h: number }> = {
  a4: { w: 595.28, h: 841.89 },
  letter: { w: 612, h: 792 },
  a5: { w: 419.53, h: 595.28 },
};

export interface PdfImage {
  bytes: Uint8Array;
  kind: "jpg" | "png";
  /** Pixel dimensions as decoded. */
  width: number;
  height: number;
}

export interface ImagePdfOptions {
  pageSize: PageSizeKey;
  orientation: PageOrientation;
  /** Margin in millimetres, applied evenly on all four sides. */
  marginMm: number;
}

export interface PagePlacement {
  pageWidth: number;
  pageHeight: number;
  drawX: number;
  drawY: number;
  drawWidth: number;
  drawHeight: number;
}

const mmToPt = (mm: number) => (mm / 25.4) * 72;
/** A3 is the largest page we generate from a photo; bigger is not printable. */
const MAX_PAGE_SIDE = 1683.78;

/**
 * Works out the page box and where the image sits inside it.
 * Exported so the geometry can be asserted in tests.
 */
export function computePlacement(
  imageWidth: number,
  imageHeight: number,
  options: ImagePdfOptions,
): PagePlacement {
  const margin = mmToPt(Math.max(0, options.marginMm));
  const ratio = imageWidth / imageHeight;

  let pageWidth: number;
  let pageHeight: number;

  if (options.pageSize === "fit") {
    // 96 px/inch source → points, plus the margins.
    pageWidth = (imageWidth * 72) / 96 + margin * 2;
    pageHeight = (imageHeight * 72) / 96 + margin * 2;
    const shrink = Math.min(1, MAX_PAGE_SIDE / Math.max(pageWidth, pageHeight));
    pageWidth *= shrink;
    pageHeight *= shrink;
  } else {
    const base = PAGE_SIZES[options.pageSize];
    const landscape =
      options.orientation === "landscape" || (options.orientation === "auto" && ratio > 1);
    pageWidth = landscape ? base.h : base.w;
    pageHeight = landscape ? base.w : base.h;
  }

  const availableWidth = Math.max(1, pageWidth - margin * 2);
  const availableHeight = Math.max(1, pageHeight - margin * 2);
  const scale = Math.min(availableWidth / imageWidth, availableHeight / imageHeight);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;

  return {
    pageWidth,
    pageHeight,
    drawWidth,
    drawHeight,
    drawX: (pageWidth - drawWidth) / 2,
    drawY: (pageHeight - drawHeight) / 2,
  };
}

export async function buildImagePdf(images: PdfImage[], options: ImagePdfOptions): Promise<Uint8Array> {
  if (!images.length) throw new Error("Add at least one image first.");

  const doc = await PDFDocument.create();
  doc.setProducer("Filecraft (browser)");
  doc.setCreator("Filecraft Image to PDF");
  doc.setCreationDate(new Date());

  for (const image of images) {
    if (!image.width || !image.height) {
      throw new Error("An image had no readable dimensions.");
    }
    const embedded =
      image.kind === "png" ? await doc.embedPng(image.bytes) : await doc.embedJpg(image.bytes);
    const placement = computePlacement(image.width, image.height, options);
    const page = doc.addPage([placement.pageWidth, placement.pageHeight]);
    page.drawImage(embedded, {
      x: placement.drawX,
      y: placement.drawY,
      width: placement.drawWidth,
      height: placement.drawHeight,
    });
  }

  return doc.save();
}
