import type { Metadata } from "next";
import { SITE_NAME, SITE_URL, TAGLINE } from "@/data/site";

interface PageMetaInput {
  title: string;
  description: string;
  path: string;
  /** Absolute or root-relative image path. */
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
}

export const DEFAULT_OG_IMAGE = "/og-default.png";

export function buildMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  type = "website",
  publishedTime,
  modifiedTime,
  noindex = false,
}: PageMetaInput): Metadata {
  const url = `${SITE_URL}${path}`;
  const absoluteImage = image.startsWith("http") ? image : `${SITE_URL}${image}`;
  // Titles are authored to stay ≤ 50 chars so the " | Site name" suffix keeps
  // the whole <title> inside 60 characters. This is the enforceable safety net.
  const suffix = ` | ${SITE_NAME}`;
  const safeTitle =
    title.length + suffix.length <= 60
      ? `${title}${suffix}`
      : title.length > 60
        ? `${title.slice(0, 59).trimEnd()}…`
        : title;
  const safeDescription = description.length > 158 ? `${description.slice(0, 155).trimEnd()}…` : description;

  return {
    title: { absolute: safeTitle },
    description: safeDescription,
    alternates: { canonical: url },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
    openGraph: {
      title: safeTitle,
      description: safeDescription,
      url,
      siteName: SITE_NAME,
      locale: "en_US",
      type,
      images: [{ url: absoluteImage, width: 1200, height: 630, alt: `${SITE_NAME} — ${TAGLINE}` }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: { absolute: safeTitle },
      description: safeDescription,
      images: [absoluteImage],
    },
    other: {
      "google-adsense-account": "ca-pub-3078074422458018",
    },
  };
}

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
