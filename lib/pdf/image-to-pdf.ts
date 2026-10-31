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

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Space between two pictures sharing a page, in points (~2.8 mm). */
export const GRID_GUTTER_PT = 8;

/** How many pictures a page can carry, and how they are arranged. */
export function gridShape(count: number): { columns: number; rows: number } {
  if (count <= 1) return { columns: 1, rows: 1 };
  // Two stack; three and four make a 2 × 2 grid (the third spans a full row).
  if (count === 2) return { columns: 1, rows: 2 };
  return { columns: 2, rows: Math.ceil(count / 2) };
}

/**
 * Splits a page's usable area into one cell per picture.
 *
 * Two pictures always stack (the reading order of a scanned document), four
 * make a 2×2 grid, and an odd number out gets a full-width row at the bottom so
 * nothing is left as an empty half. Exported for the geometry tests.
 */
export function computeGridCells(
  pageWidth: number,
  pageHeight: number,
  marginPt: number,
  count: number,
  gutterPt = GRID_GUTTER_PT,
): Box[] {
  if (count <= 0) return [];
  const left = marginPt;
  const top = marginPt;
  const usableWidth = Math.max(1, pageWidth - marginPt * 2);
  const usableHeight = Math.max(1, pageHeight - marginPt * 2);
  const { columns, rows } = gridShape(count);

  const cellWidth = (usableWidth - gutterPt * (columns - 1)) / columns;
  const cellHeight = (usableHeight - gutterPt * (rows - 1)) / rows;

  const cells: Box[] = [];
  for (let index = 0; index < count; index += 1) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    // A single picture alone on the last row spans the whole width.
    const isLast = index === count - 1;
    const alone = isLast && count % columns === 1 && columns > 1;
    cells.push({
      x: left + column * (cellWidth + gutterPt),
      // PDF coordinates grow upwards, so row 0 is at the top.
      y: top + (rows - 1 - row) * (cellHeight + gutterPt),
      width: alone ? usableWidth : cellWidth,
      height: cellHeight,
    });
  }
  return cells;
}

/** Illustration geometry for one page holding one or more pictures. */
export interface PageLayout {
  pageWidth: number;
  pageHeight: number;
  /** One box per picture, in the order they were supplied, plus where the art goes inside it. */
  placements: (PagePlacement & { cell: Box })[];
}

/**
 * The page box and every picture's box for a page that holds `images`.
 *
 * A single picture keeps the exact behaviour of `computePlacement` (so existing
 * one-image-per-page documents do not move by a point). With two or more, the
 * page keeps its own orientation — a landscape sheet does not flip because the
 * first photo was landscape — and the pictures are fitted inside a grid.
 */
export function layoutImagePage(
  images: { width: number; height: number }[],
  options: ImagePdfOptions,
): PageLayout {
  if (!images.length) throw new Error("A page needs at least one image.");
  const margin = mmToPt(Math.max(0, options.marginMm));

  if (images.length === 1) {
    const placement = computePlacement(images[0].width, images[0].height, options);
    return {
      pageWidth: placement.pageWidth,
      pageHeight: placement.pageHeight,
      placements: [
        {
          ...placement,
          cell: {
            x: margin,
            y: margin,
            width: Math.max(1, placement.pageWidth - margin * 2),
            height: Math.max(1, placement.pageHeight - margin * 2),
          },
        },
      ],
    };
  }

  let pageWidth: number;
  let pageHeight: number;

  if (options.pageSize === "fit") {
    // Fit means "as tall as the tallest picture"; the grid then does the rest.
    const tallest = images.reduce((best, image) => (image.height / image.width > best.height / best.width ? image : best), images[0]);
    pageWidth = (tallest.width * 72) / 96 + margin * 2;
    pageHeight = (tallest.height * 72) / 96 + margin * 2;
    const shrink = Math.min(1, MAX_PAGE_SIDE / Math.max(pageWidth, pageHeight));
    pageWidth *= shrink;
    pageHeight *= shrink;
  } else {
    const base = PAGE_SIZES[options.pageSize];
    // A single picture lets "auto" pick the page orientation (see
    // computePlacement); a grid stays upright unless landscape is asked for.
    const landscape = options.orientation === "landscape";
    pageWidth = landscape ? base.h : base.w;
    pageHeight = landscape ? base.w : base.h;
  }

  const cells = computeGridCells(pageWidth, pageHeight, margin, images.length);
  const placements = images.map((image, index) => {
    const cell = cells[index];
    const scale = Math.min(cell.width / image.width, cell.height / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    return {
      pageWidth,
      pageHeight,
      drawWidth,
      drawHeight,
      drawX: cell.x + (cell.width - drawWidth) / 2,
      drawY: cell.y + (cell.height - drawHeight) / 2,
      cell,
    };
  });

  return { pageWidth, pageHeight, placements };
}

/**
 * Assembles a PDF from pages that each hold one or more pictures.
 * `buildImagePdf` is the one-picture-per-page shorthand for this.
 */
export async function buildImagePdfFromPages(
  pages: PdfImage[][],
  options: ImagePdfOptions,
): Promise<Uint8Array> {
  const filled = pages.filter((page) => page.length > 0);
  if (!filled.length) throw new Error("Add at least one image first.");

  const doc = await PDFDocument.create();
  doc.setProducer("Filecraft (browser)");
  doc.setCreator("Filecraft Image to PDF");
  doc.setCreationDate(new Date());

  for (const images of filled) {
    for (const image of images) {
      if (!image.width || !image.height) {
        throw new Error("An image had no readable dimensions.");
      }
    }
    const layout = layoutImagePage(images, options);
    const page = doc.addPage([layout.pageWidth, layout.pageHeight]);
    for (let index = 0; index < images.length; index += 1) {
      const image = images[index];
      const embedded =
        image.kind === "png" ? await doc.embedPng(image.bytes) : await doc.embedJpg(image.bytes);
      const placement = layout.placements[index];
      page.drawImage(embedded, {
        x: placement.drawX,
        y: placement.drawY,
        width: placement.drawWidth,
        height: placement.drawHeight,
      });
    }
  }

  return doc.save();
}

/** One picture per page. */
export async function buildImagePdf(images: PdfImage[], options: ImagePdfOptions): Promise<Uint8Array> {
  return buildImagePdfFromPages(
    images.map((image) => [image]),
    options,
  );
}
