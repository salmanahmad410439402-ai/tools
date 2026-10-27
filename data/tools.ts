import type { Tool, ToolGroup } from "@/lib/tool-types";
import { pdfOrganizeTools } from "./tool-defs/pdf-organize.ts";
import { pdfOptimizeTools } from "./tool-defs/pdf-optimize.ts";
import { pdfEditTools } from "./tool-defs/pdf-edit.ts";
import { pdfCreateTools } from "./tool-defs/pdf-create.ts";
import { pdfExtractTools } from "./tool-defs/pdf-extract.ts";
import { pdfPageTools } from "./tool-defs/pdf-pages.ts";
import { pdfConvertTools } from "./tool-defs/pdf-convert.ts";
import { pdfAnnotateTools } from "./tool-defs/pdf-annotate.ts";
import { imageTools } from "./tool-defs/images.ts";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  TOOL REGISTRY
 *  Every tool page, home-page card, mega-menu entry, category listing,
 *  sitemap URL, breadcrumb and JSON-LD block is generated from this array.
 *  To add a tool: append an entry to the matching file in data/tool-defs/
 *  and map its `widget` key to a client component in components/tools.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const tools: Tool[] = [
  ...pdfOrganizeTools,
  ...pdfOptimizeTools,
  ...pdfEditTools,
  ...pdfCreateTools,
  ...pdfPageTools,
  ...pdfConvertTools,
  ...pdfAnnotateTools,
  ...pdfExtractTools,
  ...imageTools,
];

/** Display order and copy for the PDF sub-groups used by the menu and /pdf-tools. */
export const TOOL_GROUPS: { key: ToolGroup; label: string; description: string }[] = [
  {
    key: "organize",
    label: "Organise",
    description: "Combine, split, reorder and rotate the pages you already have.",
  },
  {
    key: "optimize",
    label: "Optimise",
    description: "Make a document smaller without losing legibility.",
  },
  {
    key: "edit",
    label: "Edit & sign",
    description: "Type on a page, highlight, draw, add signature and numbering.",
  },
  {
    key: "create",
    label: "Create a PDF",
    description: "Turn photos, Word files, text, spreadsheets or Markdown into PDF.",
  },
  {
    key: "extract",
    label: "Extract",
    description: "Get images or text back out of a PDF.",
  },
  {
    key: "security",
    label: "Security & privacy",
    description: "Watermark a document or strip the properties that travel with it.",
  },
];

export const toolBySlug = (slug: string) => tools.find((t) => t.slug === slug);
export const toolSlugs = tools.map((t) => t.slug);
export const toolsByCategory = (category: string) => tools.filter((t) => t.category === category);
export const toolsByGroup = (group: ToolGroup) => tools.filter((t) => t.group === group);
export const popularTools = tools.filter((t) => t.popular);
export const toolCount = tools.length;

/**
 * Category listing helper.
 *
 * "convert-to-pdf" is kept as a cross-cutting hub page (it has its own intro,
 * FAQs and URL) but its items now live in the PDF category, so the menu shows
 * one complete "PDF tools" column instead of splitting creation tools away.
 */
export function toolsForCategory(category: string): Tool[] {
  if (category === "convert-to-pdf") return tools.filter((tool) => tool.group === "create");
  return toolsByCategory(category);
}

export function relatedTools(tool: { related: string[] }) {
  return tool.related.map((slug) => toolBySlug(slug)).filter((t): t is Tool => Boolean(t));
}
