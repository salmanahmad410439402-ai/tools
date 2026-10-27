/**
 * Tools that are planned but NOT built yet. They are listed as plain text (no
 * links, no pages) so nobody lands on a thin "coming soon" page and Google
 * never indexes an empty URL. Delete an entry when its tool ships.
 */
export interface RoadmapItem {
  name: string;
  category: "pdf-tools" | "convert-to-pdf" | "image-tools" | "utilities";
  phase: 2 | 3 | 4 | 5 | 6;
  note?: string;
}

export const roadmap: RoadmapItem[] = [
  { name: "Merge PDF", category: "pdf-tools", phase: 2 },
  { name: "Split PDF", category: "pdf-tools", phase: 2 },
  { name: "Rotate PDF", category: "pdf-tools", phase: 2 },
  { name: "Delete, extract and reorder pages", category: "pdf-tools", phase: 2 },
  { name: "Add page numbers", category: "pdf-tools", phase: 2 },
  { name: "Add a watermark", category: "pdf-tools", phase: 2 },
  { name: "Sign a PDF", category: "pdf-tools", phase: 2 },
  { name: "Basic PDF editor (text, shapes, highlights)", category: "pdf-tools", phase: 2 },
  { name: "PDF to JPG or PNG", category: "pdf-tools", phase: 2 },
  { name: "PDF metadata editor", category: "pdf-tools", phase: 2 },
  { name: "TXT to PDF", category: "convert-to-pdf", phase: 3 },
  { name: "Word (DOCX) to PDF", category: "convert-to-pdf", phase: 3 },
  { name: "CSV and Excel to PDF", category: "convert-to-pdf", phase: 3 },
  { name: "Markdown and HTML to PDF", category: "convert-to-pdf", phase: 3 },
  { name: "Image compressor with target size", category: "image-tools", phase: 4 },
  { name: "Image resizer", category: "image-tools", phase: 4 },
  { name: "Crop, rotate and flip", category: "image-tools", phase: 4 },
  { name: "EXIF viewer and remover", category: "image-tools", phase: 4 },
  { name: "Image to Base64 and back", category: "image-tools", phase: 4 },
  { name: "QR code generator", category: "utilities", phase: 5 },
  { name: "Word and character counter", category: "utilities", phase: 5 },
  { name: "Case converter", category: "utilities", phase: 5 },
  { name: "Lorem ipsum generator", category: "utilities", phase: 5 },
  { name: "More image conversion landing pages", category: "image-tools", phase: 4 },
  { name: "Protect and unlock PDF", category: "pdf-tools", phase: 6, note: "Unlock only with the correct password" },
  { name: "OCR: image to text", category: "pdf-tools", phase: 6 },
  { name: "PDF to Word and Excel", category: "pdf-tools", phase: 6 },
];
