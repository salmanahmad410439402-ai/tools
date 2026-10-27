import { CATEGORIES, SITE_NAME, SITE_URL } from "@/data/site";
import type { Tool } from "./tool-types";

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path}`,
    })),
  };
}

export function toolJsonLd(tool: Tool) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${tool.name} — ${SITE_NAME}`,
    url: `${SITE_URL}/${tool.slug}/`,
    applicationCategory: "UtilitiesApplication",
    applicationSubCategory: tool.category === "image-tools" ? "Image converter" : "PDF tool",
    operatingSystem: "Any (browser-based)",
    browserRequirements: "Requires JavaScript. Works in Chrome, Safari, Firefox and Edge.",
    description: tool.metaDescription,
    isAccessibleForFree: true,
    inLanguage: "en",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: tool.bullets.map((b) => b.title),
    softwareHelp: {
      "@type": "CreativeWork",
      name: `${tool.name} — how to use`,
      url: `${SITE_URL}/${tool.slug}/#how-to`,
    },
  };
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "en",
    description:
      "Free browser-based PDF and image tools. Files are processed on your device and never uploaded.",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/tools/?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    description:
      "A small independent site building free file tools that run entirely in the browser.",
  };
}

export function collectionJsonLd(options: {
  name: string;
  description: string;
  path: string;
  items: { name: string; url: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: options.name,
    description: options.description,
    url: `${SITE_URL}${options.path}`,
    hasPart: options.items.map((item) => ({
      "@type": "WebApplication",
      name: item.name,
      url: `${SITE_URL}${item.url}`,
      applicationCategory: "UtilitiesApplication",
    })),
  };
}

export function categoryCrumb(slug: string): Crumb {
  const category = CATEGORIES.find((c) => c.slug === slug);
  return { name: category?.name ?? "Tools", path: `/${slug}/` };
}
