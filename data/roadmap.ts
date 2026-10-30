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
];
