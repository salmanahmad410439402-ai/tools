/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SITE CONFIG — change these three lines once your name, domain and inbox
 *  are final. Everything else on the site (canonical URLs, sitemap, robots.txt,
 *  structured data, footer, contact page, legal pages) is generated from here.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const SITE_NAME = "Filecraft";
/**
 * Canonical origin, no trailing slash.
 *
 * Set NEXT_PUBLIC_SITE_URL at build time (and in your host's environment) to
 * the domain you actually deploy to. Canonicals, sitemap.xml, robots.txt,
 * structured data and Open Graph URLs are all derived from this one value.
 * The fallback keeps a local build working; `npm run check` warns while it is
 * still in place, and README.md has the two-line launch step.
 */
const PLACEHOLDER_ORIGIN = "https://example.com";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || PLACEHOLDER_ORIGIN).replace(/\/+$/, "");
/** True while the site is still on the placeholder — copy avoids printing a fake domain. */
export const SITE_URL_IS_PLACEHOLDER = SITE_URL === PLACEHOLDER_ORIGIN;
/** Hostname for display, e.g. "filecraft.app"; a neutral phrase before launch. */
export const SITE_DOMAIN_LABEL = SITE_URL_IS_PLACEHOLDER ? "this site" : SITE_URL.replace(/^https?:\/\//, "");
export const CONTACT_EMAIL = "Alhamdstudio839@gmail.com";
/** ─────────────────────────────────────────────────────────────────────────── */

/** AdSense publisher ID (same account as tagyfy.com). */
export const ADSENSE_PUBLISHER_ID = "ca-pub-3078074422458018";
/** ads.txt line that must match the publisher ID above. */
export const ADS_TXT_LINE = "google.com, pub-3078074422458018, DIRECT, f08c47fec0942fa0";

/**
 * Ad units stay switched off until AdSense approves the site.
 * Set NEXT_PUBLIC_ADS_ENABLED=true (and redeploy) when approval arrives.
 */
export const ADS_ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";
/**
 * The AdSense library is not loaded while no ads are shown, so a site with ads
 * switched off also makes zero requests to Google. Set
 * NEXT_PUBLIC_ADSENSE_SCRIPT=on if Google's review asks for the snippet to be
 * present before approval.
 */
export const ADSENSE_SCRIPT_ENABLED =
  ADS_ENABLED || process.env.NEXT_PUBLIC_ADSENSE_SCRIPT === "on";
export const ADS_SLOT_TOOL_TOP = process.env.NEXT_PUBLIC_ADS_SLOT_TOOL_TOP ?? "";
export const ADS_SLOT_INLINE = process.env.NEXT_PUBLIC_ADS_SLOT_INLINE ?? "";
export const ADS_SLOT_SIDEBAR = process.env.NEXT_PUBLIC_ADS_SLOT_SIDEBAR ?? "";

/*
 * ── Analytics ─────────────────────────────────────────────────────────────
 * Two cookie-free options, both off unless configured. Never a tracked file,
 * never a file name: only page views and the two tool events, with a coarse
 * size bucket.
 *
 * 1. Vercel Analytics. The script is served by the deployment itself at
 *    /_vercel/insights/script.js, so it only works on Vercel hosting — on any
 *    other static host that path 404s. That is why it is opt-in rather than
 *    automatic, and why the flag is public: the value has to be identical in
 *    the server render and the client bundle.
 *      NEXT_PUBLIC_VERCEL_ANALYTICS=true
 *    In Vercel: Project → Settings → Environment Variables, then redeploy.
 *
 * 2. Any Plausible/Umami-compatible script, for every other host:
 *      NEXT_PUBLIC_ANALYTICS_SCRIPT_URL=https://plausible.io/js/script.js
 *      NEXT_PUBLIC_ANALYTICS_DOMAIN=yourdomain.com
 */
export const VERCEL_ANALYTICS_ENABLED = process.env.NEXT_PUBLIC_VERCEL_ANALYTICS === "true";

export const ANALYTICS_SCRIPT_URL = process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT_URL ?? "";
export const ANALYTICS_DOMAIN = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN ?? "";
/** True when any cookie-free analytics will actually load on this build. */
export const ANALYTICS_ENABLED =
  VERCEL_ANALYTICS_ENABLED || Boolean(ANALYTICS_SCRIPT_URL && ANALYTICS_DOMAIN);

/**
 * Optional search-engine verification tokens. Set these in the host's
 * environment at deploy time; the meta tag is emitted on every page, which is
 * the easiest way to verify a static site in Search Console and Bing Webmaster
 * Tools without uploading HTML files.
 */
export const GOOGLE_SITE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "";
export const BING_SITE_VERIFICATION = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ?? "";

export const TAGLINE = "Free PDF & image tools that run privately in your browser";
export const SITE_DESCRIPTION =
  "Merge, compress and convert PDFs and images entirely in your browser. No uploads, no sign-up, no watermarks — your files never leave your device.";

/**
 * How the site refers to whoever runs it. One person built and maintains it;
 * keep the copy in the first person singular or neutral. Do not inflate this
 * into a "team".
 */
export const OPERATOR_NAME = "the Filecraft maintainer";
export const SITE_LAUNCH_YEAR = 2026;

export type CategorySlug = "pdf-tools" | "convert-to-pdf" | "image-tools" | "utilities";

export interface Category {
  slug: CategorySlug;
  name: string;
  shortName: string;
  title: string;
  metaDescription: string;
  heading: string;
  intro: string[];
  /** Shown at the top of the category page, above the tool grid. */
  facts: { label: string; value: string }[];
  icon: string;
  /** Hidden categories keep their page (SEO hub) but leave the menu. */
  hidden?: boolean;
}

export const CATEGORIES: Category[] = [
  {
    slug: "pdf-tools",
    name: "PDF tools",
    shortName: "PDF",
    title: "Free PDF Tools — Edit, Convert, Merge, Compress",
    metaDescription:
      "Merge, split, compress, edit, sign and convert PDFs for free in your browser. Plus Word, text and spreadsheet to PDF. No upload, no sign-up.",
    heading: "Free PDF tools — no upload, no sign-up",
    intro: [
      "These PDF tools open your file straight from your device, change it in the browser and hand it back as a download. Nothing is uploaded to a server, so there is no queue, no daily limit and no copy of your document sitting in someone else's storage.",
      "Start with the job you actually need: shrink a PDF before emailing it, combine scans into one file, or pull a few pages out of a report. Each tool page explains what it can and cannot do before you pick a file.",
    ],
    facts: [
      { label: "Upload", value: "None" },
      { label: "Account", value: "Not needed" },
      { label: "Watermark", value: "Never" },
    ],
    icon: "FileText",
  },
  {
    slug: "convert-to-pdf",
    name: "Convert to PDF",
    shortName: "To PDF",
    title: "Convert to PDF — Images, Word, Text and CSV",
    metaDescription:
      "Turn images, Word documents, text files, spreadsheets or Markdown into a PDF in your browser. Free, private and watermark-free.",
    heading: "Convert to PDF — from images, Word, text or a spreadsheet",
    intro: [
      "Photos, plain text, Word documents, spreadsheets and Markdown all make sense as a PDF once they need to be sent, printed or archived. These converters do that work locally in your browser, so contracts, payslips and holiday photos never leave your device.",
      "Format conversion is rarely pixel-perfect. Each page states the fidelity you can expect — for example, Word conversion keeps your text selectable but does not reproduce complex layouts exactly.",
    ],
    facts: [
      { label: "Formats", value: "JPG, PNG, HEIC, DOCX, TXT, CSV, MD" },
      { label: "Output", value: "Real PDF (selectable text where possible)" },
      { label: "Batch", value: "Yes, many files at once" },
    ],
    icon: "FilePlus2",
    hidden: true,
  },
  {
    slug: "image-tools",
    name: "Image tools",
    shortName: "Images",
    title: "Free Image Tools — Convert, Compress, Resize",
    metaDescription:
      "Convert JPG, PNG, WebP, HEIC and more, compress photos to a target size, resize and crop — free, in your browser, with no upload.",
    heading: "Image tools that never upload your photos",
    intro: [
      "Convert between JPG, PNG and WebP, shrink a photo to an exact file-size target, resize for a social platform or crop a screenshot — all using the image engine already built into your browser.",
      "Because the work happens on your device, large batches are limited by your phone or laptop rather than by our server capacity. A 20 MB photo is fine; a folder of 500 RAW files is not what these tools are for.",
    ],
    facts: [
      { label: "Privacy", value: "Images never uploaded" },
      { label: "Batch", value: "Multi-file + ZIP download" },
      { label: "Metadata", value: "Stripped on export" },
    ],
    icon: "Image",
  },
  {
    slug: "utilities",
    name: "Utilities",
    shortName: "Utilities",
    title: "Free Browser Utilities — QR Codes, Word Count, Case Converter",
    metaDescription:
      "Small, fast, free browser utilities: QR code generator, word and character counter, case converter and lorem ipsum generator.",
    heading: "Small utilities that do one job well",
    intro: [
      "Everyday jobs that should not need an account, an app install or a page full of adverts. Everything here runs offline in the browser tab, works on a phone and copies its result to your clipboard in one tap.",
      "These tools are deliberately small. If a utility grows big enough to need its own settings and explanation, it gets its own page with proper documentation.",
    ],
    facts: [
      { label: "Speed", value: "Instant" },
      { label: "Offline", value: "Works after first load" },
      { label: "Sign-up", value: "None" },
    ],
    icon: "Wrench",
  },
];

export const categoryBySlug = (slug: string) => CATEGORIES.find((c) => c.slug === slug);

export const LEGAL_LINKS = [
  { href: "/privacy-policy/", label: "Privacy Policy" },
  { href: "/terms/", label: "Terms of Use" },
  { href: "/disclaimer/", label: "Disclaimer" },
  { href: "/cookie-policy/", label: "Cookie Policy" },
];
