import type { CategorySlug } from "@/data/site";

export type WidgetKey =
  | "image-to-pdf"
  | "compress-pdf"
  | "image-converter"
  | "merge-pdf"
  | "split-pdf"
  | "rotate-pdf"
  | "page-organizer"
  | "page-numbers"
  | "watermark-pdf"
  | "sign-pdf"
  | "pdf-editor"
  | "pdf-to-image"
  | "pdf-metadata"
  | "txt-to-pdf"
  | "docx-to-pdf"
  | "csv-to-pdf"
  | "markdown-to-pdf"
  | "image-compressor"
  | "image-resizer"
  | "image-crop"
  | "exif"
  | "base64"
  | "qr-code"
  | "word-counter"
  | "case-converter"
  | "lorem-ipsum";

export interface ToolFaq {
  q: string;
  a: string;
}

export interface ToolPoint {
  /** Bold lead-in, e.g. "Drag to reorder". */
  title: string;
  text: string;
}

/** Sub-group used to organise the PDF mega-menu and the /pdf-tools page. */
export type ToolGroup = "organize" | "edit" | "create" | "extract" | "optimize";

export interface Tool {
  slug: string;
  name: string;
  /** Short name used in dense lists and the mega-menu. */
  shortName?: string;
  category: CategorySlug;
  widget: WidgetKey;
  /** Lucide icon name, resolved in components/ToolIcon.tsx. */
  icon: string;
  /** Menu grouping inside the PDF category. */
  group?: ToolGroup;
  /** One sentence for cards. */
  tagline: string;
  /** "Best used when..." line under the card description. */
  bestFor: string;
  seoTitle: string;
  metaDescription: string;
  h1: string;
  /** 2–3 short paragraphs under the H1. */
  intro: string[];
  bullets: ToolPoint[];
  steps: ToolPoint[];
  limits: ToolPoint[];
  tips: ToolPoint[];
  faqs: ToolFaq[];
  related: string[];
  inputFormats: string[];
  outputFormats: string[];
  /** Extra terms for the tools search box. */
  keywords: string[];
  popular?: boolean;
  isNew?: boolean;
  /** Build phase from the project plan (1 = launch foundation). */
  phase: 1 | 2 | 3 | 4 | 5 | 6;
  updated: string;
  /** Optional preset for shared widgets, e.g. force PNG output. */
  preset?: {
    outputFormat?: "image/png" | "image/jpeg" | "image/webp";
    conversionLabel?: string;
  };
}

export type { CategorySlug };
