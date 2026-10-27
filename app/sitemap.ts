import type { MetadataRoute } from "next";
import { SITE_URL } from "@/data/site";
import { tools } from "@/data/tools";
import { guides } from "@/data/guides";
import { CATEGORIES } from "@/data/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/tools/", priority: 0.9, changeFrequency: "weekly" },
    { path: "/blog/", priority: 0.7, changeFrequency: "weekly" },
    { path: "/about/", priority: 0.5, changeFrequency: "yearly" },
    { path: "/contact/", priority: 0.5, changeFrequency: "yearly" },
    { path: "/faq/", priority: 0.6, changeFrequency: "monthly" },
    { path: "/privacy-policy/", priority: 0.4, changeFrequency: "yearly" },
    { path: "/terms/", priority: 0.4, changeFrequency: "yearly" },
    { path: "/disclaimer/", priority: 0.4, changeFrequency: "yearly" },
    { path: "/cookie-policy/", priority: 0.4, changeFrequency: "yearly" },
  ];

  // Utilities has no live tools yet and is noindexed, so it stays out of the sitemap.
  const categoryPages = CATEGORIES.filter(
    (category) => category.slug !== "utilities" || tools.some((tool) => tool.category === "utilities"),
  ).map((category) => ({
    url: `${SITE_URL}/${category.slug}/`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    ...staticPages.map((page) => ({
      url: `${SITE_URL}${page.path}`,
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...categoryPages,
    ...tools.map((tool) => ({
      url: `${SITE_URL}/${tool.slug}/`,
      lastModified: new Date(tool.updated),
      changeFrequency: "monthly" as const,
      priority: tool.popular ? 0.9 : 0.8,
    })),
    ...guides.map((guide) => ({
      url: `${SITE_URL}/blog/${guide.slug}/`,
      lastModified: new Date(guide.updated ?? guide.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
