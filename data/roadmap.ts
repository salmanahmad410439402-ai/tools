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
  { name: "More image conversion landing pages", category: "image-tools", phase: 4 },
  { name: "QR code generator", category: "utilities", phase: 5 },
  { name: "Word and character counter", category: "utilities", phase: 5 },
  { name: "Case converter", category: "utilities", phase: 5 },
  { name: "Lorem ipsum generator", category: "utilities", phase: 5 },
  { name: "Protect and unlock PDF", category: "pdf-tools", phase: 6, note: "Unlock only with the correct password" },
  { name: "OCR: image and scan to text", category: "pdf-tools", phase: 6 },
  { name: "PDF to Word and Excel", category: "pdf-tools", phase: 6 },
  { name: "PowerPoint to PDF", category: "convert-to-pdf", phase: 6 },
];
