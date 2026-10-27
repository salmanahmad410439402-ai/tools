import { CATEGORIES } from "@/data/site";
import { tools } from "@/data/tools";
import type { Tool } from "./tool-types";

export interface SearchEntry {
  title: string;
  href: string;
  description: string;
  group: string;
  haystack: string;
}

const staticPages: SearchEntry[] = [
  { title: "All tools", href: "/tools/", description: "Search and filter every tool on the site", group: "Pages" },
  { title: "Guides", href: "/blog/", description: "How-to articles about PDFs, images and file sizes", group: "Pages" },
  { title: "Frequently asked questions", href: "/faq/", description: "Privacy, limits and how the tools work", group: "Pages" },
  { title: "About", href: "/about/", description: "Who runs this site and why it exists", group: "Pages" },
  { title: "Contact", href: "/contact/", description: "Send a bug report, question or request", group: "Pages" },
].map((page) => ({ ...page, haystack: `${page.title} ${page.description}`.toLowerCase() }));

const toolEntries: SearchEntry[] = tools.map((tool: Tool) => ({
  title: tool.name,
  href: `/${tool.slug}/`,
  description: tool.tagline,
  group: CATEGORIES.find((c) => c.slug === tool.category)?.name ?? "Tools",
  haystack: [
    tool.name,
    tool.tagline,
    tool.keywords.join(" "),
    tool.inputFormats.join(" "),
    tool.outputFormats.join(" "),
  ]
    .join(" ")
    .toLowerCase(),
}));

export const searchEntries: SearchEntry[] = [...toolEntries, ...staticPages];

export function searchAll(query: string, limit = 8): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  return searchEntries
    .map((entry) => {
      let score = 0;
      for (const term of terms) {
        if (entry.title.toLowerCase().startsWith(term)) score += 6;
        else if (entry.title.toLowerCase().includes(term)) score += 4;
        else if (entry.haystack.includes(term)) score += 1;
        else return null;
      }
      return { entry, score };
    })
    .filter((item): item is { entry: SearchEntry; score: number } => item !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.entry);
}
