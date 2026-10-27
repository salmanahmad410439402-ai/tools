export interface Guide {
  slug: string;
  title: string;
  excerpt: string;
  /** ISO date, used for the sitemap and article structured data. */
  date: string;
  updated?: string;
  readingMinutes: number;
  /** Tool slugs shown in the guide's sidebar. */
  relatedTools: string[];
  /** Body paragraphs. Supports a small subset: h2, h3, p, ul, ol, quote. */
  body: Array<
    | { type: "h2"; text: string }
    | { type: "h3"; text: string }
    | { type: "p"; text: string }
    | { type: "ul"; items: string[] }
    | { type: "ol"; items: string[] }
    | { type: "quote"; text: string }
  >;
  /** Shown on cards when true. */
  featured?: boolean;
}

/**
 * Guides are written in Step 5 of the build. The home page and /blog only
 * render this section when at least one guide exists, so nothing links to an
 * empty page in the meantime.
 */
export const guides: Guide[] = [];

export const guideBySlug = (slug: string) => guides.find((guide) => guide.slug === slug);
