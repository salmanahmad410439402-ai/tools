# Filecraft — free PDF & image tools that run in the browser

A static, SEO-first website of file tools. Every tool processes files **on the user's device**:
there is no upload endpoint, no backend, no database and no account system.

- **Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · static export (`out/`)
- **Deploy target:** any static host (Netlify, Cloudflare Pages, Vercel, S3 + CDN, GitHub Pages, nginx)
- **Ads:** Google AdSense wired up but switched **off** until approval (`ADS_ENABLED=false`)

---

## Quick start

```bash
npm install          # also copies the pdf.js worker into /public via predev/prebuild
npm run dev          # http://localhost:3000
```

Production build and local preview of the exported site:

```bash
npm run build        # writes static HTML + JS to ./out
npm start            # zero-dependency static server on :3000 (PORT=… to change)
```

Checks that run in CI or before a deploy:

```bash
npm run typecheck    # tsc --noEmit
npm run validate     # content + registry rules (title lengths, FAQs, word counts, links)
npm test             # Node smoke tests for the PDF/image engines
npm run check        # all three
```

---

## Where to change things

| What | File |
| --- | --- |
| Site name, domain, contact email, tagline | `data/site.ts` (top block) |
| AdSense publisher ID, ads on/off, ad slot IDs | `data/site.ts` |
| Tool registry (single source of truth) | `data/tool-defs/*.ts` (aggregated by `data/tools.ts`) |
| Tool page layout | `components/ToolLayout.tsx` + `components/Disclosure.tsx` |
| Planned-but-not-built tools list | `data/roadmap.ts` |
| Guides | `data/guides.ts` |
| Design tokens (colors, radius, shadows, fonts) | `tailwind.config.ts`, `app/globals.css` |
| Header / footer / logo | `components/Header.tsx`, `components/Footer.tsx`, `components/Logo.tsx` |
| Tool page template | `components/ToolLayout.tsx` |
| Tool widgets | `components/tools/*` |

`data/site.ts` holds the identity of the site. The contact inbox is set; the **site name and domain
are still placeholders** and must be replaced before launch:

```ts
export const SITE_NAME = "Filecraft";                        // placeholder — confirm before launch
export const SITE_URL = "https://example.com";               // placeholder, no trailing slash
export const CONTACT_EMAIL = "Alhamdstudio839@gmail.com";    // live
```

Canonical URLs, Open Graph tags, structured data, `sitemap.xml`, `robots.txt` and the footer
email are all generated from those constants.

---

## Advertising (AdSense)

The publisher ID `ca-pub-3078074422458018` is already in:

- the async AdSense script in `<head>` (`app/layout.tsx`)
- `<meta name="google-adsense-account">` on every page
- `public/ads.txt`

Ad **units** are disabled by default. `components/AdSlot.tsx` renders `null` and makes no ad
request while the flag is off, so ad blockers and reviewers see a clean page.

To switch ads on after approval:

```bash
NEXT_PUBLIC_ADS_ENABLED=true \
NEXT_PUBLIC_ADS_SLOT_TOOL_TOP=1234567890 \
NEXT_PUBLIC_ADS_SLOT_INLINE=1234567891 \
NEXT_PUBLIC_ADS_SLOT_SIDEBAR=1234567892 \
npm run build
```

Rules baked into the layout (see `AdSlot.tsx` and `ToolLayout.tsx`):

- max 3 units per page: below the tool, mid-article, desktop sidebar;
- fixed reserved height to avoid CLS, “Advertisement” label, lazy loading below the fold;
- never inside the dropzone, never between options and the primary button, never next to a
  download button; ≥ 40 px clear space around every unit;
- no ads on 404, error or empty pages, no interstitials, no mobile anchors.

**Before switching on:** in AdSense → Privacy & messaging, publish Google's certified consent
message for the EEA/UK/Switzerland. Our own cookie notice is informational only and never blocks
content. Keep Auto ads **off** — all units are placed manually.

---

## Privacy architecture

No file ever leaves the tab. Libraries are loaded lazily so the first paint stays small:

| Work | Library | Loaded |
| --- | --- | --- |
| Reading/writing PDFs | `pdf-lib` (MIT) | on demand, per tool page |
| Rendering PDF pages | `pdfjs-dist` 4.10.38 (Apache-2.0) + `public/pdf.worker.min.mjs` | only when a tool rasterises |
| ZIP downloads | `jszip` (MIT) | on first ZIP download |
| HEIC photos | `heic2any` (MIT) | only when a HEIC file is selected |
| PDF text extraction + page rendering | `pdfjs-dist` (Apache-2.0) | only when a tool reads a PDF |
| Word `.docx` parsing | `mammoth` 1.13.0 (BSD-2-Clause) | only on the Word to PDF page |
| Excel `.xlsx` reading | `xlsx` 0.18.5 (Apache-2.0) | only when a workbook is selected |
| Unicode PDF text | bundled `DejaVu Sans` (public-domain licence, `public/fonts/LICENSE.txt`) | only when non-WinAnsi characters appear |
| BMP / TIFF / GIF / PPM / SVG / ICO output | local encoders in `lib/images/codecs.ts` | tiny, bundled |

Analytics is opt-in and cookie-free. Leave the env vars empty (default) to send nothing:

```bash
NEXT_PUBLIC_ANALYTICS_SCRIPT_URL=https://plausible.io/js/script.js
NEXT_PUBLIC_ANALYTICS_DOMAIN=yourdomain.com
```

Events recorded (when enabled): `tool_started`, `tool_completed` — no file names, no content,
only a coarse size bucket.

---

## Adding a tool (the one-entry workflow)

1. Add an entry to the matching file in `data/tool-defs/` (organise / optimise / edit / create /
   extract / images) — slug, name, category, tagline, “best used when”, SEO title
   (**≤ 50 chars**, the layout appends `" | Filecraft"`), meta description (≤ 155), H1, intro,
   4–6 feature bullets, steps, limits, tips, 5–8 FAQs, related slugs, formats, phase, date.
2. Map its `widget` key to a client component in `components/tools/ToolWidgets.tsx`
   (add the lazy `dynamic()` import — never import a PDF library at module scope).
3. Run `npm run validate` — it fails on thin content, long titles, missing FAQs or broken
   related links.
4. Remove the tool from `data/roadmap.ts` if it was listed as planned.

Navigation, home cards, category pages, search, sitemap, breadcrumbs, JSON-LD and related-tool
links all update automatically.

### Slug rule (enforced)

**The slug is the search phrase, and the same phrase must appear in that page's `<title>` and H1.**
`/word-to-pdf/`, `/image-to-pdf/`, `/jpg-to-png/`, `/add-page-numbers-to-pdf/` — words separated by
hyphens, nothing else. `npm run validate` fails if `slug.replace(/-/g, " ")` is missing from either
the SEO title or the H1, so a rename cannot leave the URL and the visible page disagreeing.

Slugs that are live today: `merge-pdf`, `split-pdf`, `organize-pdf`, `rotate-pdf`, `compress-pdf`,
`add-page-numbers-to-pdf`, `watermark-pdf`, `sign-pdf`, `pdf-editor`, `pdf-metadata`, `txt-to-pdf`,
`word-to-pdf`, `csv-to-pdf`, `markdown-to-pdf`, `image-to-pdf`, `pdf-to-jpg`, `image-converter`,
`jpg-to-png`.

**Note on `/blog/[slug]`:** the article template is finished
(`components/guides/GuideArticle.tsx`), but Next's static export refuses a dynamic route whose
`generateStaticParams()` is empty. The route file is created in the same commit as the first
guide — copy-paste instructions are in the template's header comment. Until then `/blog/` is
`noindex` and left out of the sitemap, so nothing thin gets indexed.

---

## Deployment

The build output is a plain folder of HTML, JS and assets — no server runtime.

```bash
npm run build     # → out/
```

- **Netlify:** build `npm run build`, publish dir `out`
- **Cloudflare Pages:** build `npm run build`, output `out`
- **Vercel:** framework preset Next.js, output is detected automatically
- **GitHub Pages / S3 / nginx:** upload `out/`; serve `/foo/` as `/foo/index.html`
  (the site uses `trailingSlash: true`, so every URL ends with `/`)

Set `SITE_URL` in `data/site.ts` to the live domain **before** the final build so canonicals,
the sitemap and structured data use the real host.

`public/og-default.png` is generated by `scripts/generate-og.py`
(`python3 -m venv .venv && .venv/bin/pip install pillow && .venv/bin/python scripts/generate-og.py`)
and committed, so the build itself needs no Python.

---

## Image converter: formats and verification

Eleven output formats, chosen **after** the images are added, from any input the browser can decode
(JPG, PNG, WebP, AVIF, GIF, BMP, TIFF, SVG, and HEIC via the bundled decoder):

| Format | Written by | Transparency | Notes |
| --- | --- | --- | --- |
| JPG | browser | flattened | background colour fills transparent pixels |
| PNG | browser | kept | lossless |
| WebP | browser | kept | lossy, smallest useful web format |
| AVIF | browser (Chrome/Edge/Firefox) | kept | disabled with a reason where unsupported |
| GIF | local encoder | flattened | 216-colour palette, first frame |
| ICO | local encoder | kept | 16 / 32 / 48 / 256 px frames in one file |
| TIFF | local encoder | flattened | uncompressed RGB, one strip |
| BMP | local encoder | flattened | uncompressed 24-bit |
| PDF | `pdf-lib` | flattened | one page per image, page sized to the image |
| SVG | local encoder | kept | PNG embedded in an SVG wrapper — **not** vectorised |
| PPM | local encoder | flattened | binary Netpbm P6 |

**Every result is verified before it is offered.** `verifyEncoded()` re-reads the bytes it just
produced: JPG, PNG, WebP, GIF, AVIF and SVG are decoded again and their dimensions compared with
what was requested; BMP, TIFF, ICO and PPM are checked against their file signature; PDF must have
both a `%PDF-` header and an `%%EOF` trailer. A failure is reported per file instead of handing over
a corrupt download, and each row in the results list shows what was checked.

Two failure modes are handled explicitly:

- **Format not writable in this browser** (typically AVIF in Safari): the button is disabled with
  "n/a" and an explanation, and the encoder throws a readable error rather than emitting a file
  with the wrong MIME type.
- **Image larger than the canvas ceiling**: a canvas silently returns a *blank* image above its
  limit, so output is clamped to 40 MP on desktop and 16 MP on iOS (`clampToCanvasLimits()`), and
  the result note reports the scaled dimensions.

## Build status

**Step 3 (PDF feature parity + calmer tool pages) — done**

- 15 more tools, 33 in total. Added: **Remove Pages From PDF**, **Extract Pages From PDF**,
  **Repair PDF**, **JPG to PDF**, **PNG to PDF**, **WebP to PDF**, **PDF to PNG**, **PDF to WebP**,
  **PDF to TXT**, **Scan to PDF** (phone camera), **Add Text to PDF**, **Highlight PDF**,
  **Draw on PDF**, **Add Shapes to PDF**, **Remove Metadata From PDF**.
- New engines: `PagePicker` (delete / extract with thumbnails + typed ranges), `RepairPdf`
  (rebuild, drop thumbnails, verify page count), `PdfToTxt` (pdf.js text layer, rebuilt lines),
  `ScanToPdf` (getUserMedia capture → PDF), WebP page export.
- The PDF menu now has six groups — Organise, Optimise, Edit & sign, Create a PDF, Extract,
  Security & privacy — rendered in three columns, plus jump-link chips on `/pdf-tools`.
- **Tool pages were rebuilt around the drop zone.** One line of promise, then the tool, then four
  "how it works" cards, then everything else folded into `<details>` sections (what it does,
  formats, limits, tips, privacy). Full copy is still in the HTML for crawlers and `npm run
  validate` still enforces 800+ words per tool.

**Step 2 (all PDF tools) — done**

- 18 tools, 14 of them new. Everything that touches a PDF now lives behind one “PDF tools”
  mega-menu entry, grouped by task: Organise (merge, split, page organiser, rotate), Optimise
  (compress), Edit & sign (page numbers, watermark, signature, editor, metadata), Create
  (image / Word / text / spreadsheet / Markdown → PDF) and Extract (PDF → JPG or PNG).
- `/convert-to-pdf` keeps its own page for the creation tools (the menu no longer shows it
  separately) and `/pdf-tools` renders the same grouping with jump links.
- New engines, all client-side: `lib/pdf/ops.ts` (merge, extract, split, rotate, rebuild, page
  numbers, text/image watermark, signature placement, annotations, metadata), `lib/pdf/render.ts`
  (pdf.js page rasterisation), `lib/pdf/text-pdf.ts` (a small layout engine that writes real,
  selectable text with pdf-lib) and `lib/convert/*` (text, Markdown, HTML, CSV/TSV/XLSX and DOCX
  → blocks, DOCX via `mammoth`).
- Unicode: Latin, Greek, Cyrillic, Hebrew and Arabic text needs a font with those glyphs, so
  `public/fonts/DejaVuSans(-Bold).ttf` (Bitstream Vera / public-domain licence, file included)
  is embedded only when a document actually uses characters outside WinAnsi. Indic scripts, CJK
  and emoji are not covered — the UI says so before conversion.
- Every tool page carries 800–1027 words of original copy and 7–8 FAQs; `npm run validate`
  fails the build if any of that regresses.

**Step 1 (foundation) — done**

- Design system matched to the reference brand: `#4F46E5` indigo, Inter variable, 18 px cards,
  soft shadows, light theme, sticky header with mega-menu + ⌘K search, 4-column footer.
- Pages: `/`, `/tools` (search + category filter), `/pdf-tools`, `/convert-to-pdf`,
  `/image-tools`, `/utilities`, 4 tool pages, `/blog`, `/about`, `/contact`, `/faq`,
  `/privacy-policy`, `/terms`, `/disclaimer`, `/cookie-policy`, 404, `sitemap.xml`,
  `robots.txt`, `ads.txt`.
- SEO: per-page titles/descriptions/canonicals, Open Graph + Twitter cards, one H1 per page,
  BreadcrumbList + WebApplication + FAQPage JSON-LD, sitemap generated from the registry.
- Tools live: **Image to PDF**, **Compress PDF**, **Image Converter**, **JPG to PNG**
  (same engine, different page).
- Content: 856–1027 words of hand-written copy per tool page, 8 FAQs each.

**Correction:** the TXT/DOCX/CSV/Markdown converters originally planned for Step 3 shipped
in Step 2, because they belong in the same PDF menu.

**Not built yet (next steps)**

- Step 4: image compressor with a target size, resizer, crop/rotate/flip, EXIF viewer + remover,
  Base64 encoder/decoder, extra conversion landing pages.
- Step 5: four utilities + the first 15 guides (the `/blog/[slug]` route is switched on then).
- Step 6: protect/unlock, OCR, PDF→Word/Excel, PowerPoint to PDF, and the rest.

---

## Known limitations (documented on the pages themselves)

- **Compress PDF, Light/Recommended** rewrite the file structure, strip metadata and recompress
  oversized embedded JPEG images. They do **not** re-encode every image: a browser has no safe
  way to do that without risking broken pages. Savings are modest (2–10%) on already-optimised
  PDFs, large on scans.
- **Compress PDF, Strong** rasterises pages at 150 DPI or lower → text is no longer selectable.
  This is stated in the UI before the user starts.
- **PDF editor** annotates pages (text boxes, highlights, boxes, white-out, pen, images). It cannot
  rewrite existing body text — a PDF has no paragraphs to reflow. White-out covers text visually
  but leaves the original characters in the file, so it is explicitly *not* redaction.
- **Word to PDF** rebuilds the document from its structure (headings, paragraphs, bold/italic,
  lists, tables). Layout is re-created, not copied: columns, text boxes, charts, footnotes and
  floating images are dropped, and `.doc` (pre-2007) is not supported at all.
- **Watermarks** are page content, not access control: anyone who can open the PDF can cover or
  remove them. They are not encryption and the UI says so.
- **Sign PDF** places a drawn, typed or uploaded signature image and flattens it into the page. It
  is not a certified digital signature (no certificate, no tamper evidence).
- **Text → PDF** wraps and paginates, but wide tables still have to fit the page; the CSV route
  repeats the header row and suggests landscape for wide sheets.
- **AVIF output** depends on the browser; Safari reads AVIF but cannot write it. The converter
  detects this at runtime and disables the option instead of producing broken files.
- **TIFF output** is uncompressed RGB (browsers have no TIFF encoder); files are larger than the
  source. **GIF output** is single-frame with a 216-colour palette.
- **SVG output** is a valid SVG with the bitmap embedded as a base64 PNG. It is not traced into
  vectors — the page says so, because "raster to SVG" is usually sold as tracing.
- **PDF output** from the converter is one image per page, sized to the image. For multi-image
  documents with A4 pages and margins, use Image to PDF.
- **ICO output** always contains 16, 32, 48 and 256 px frames, centre-cropped to a square; a frame
  larger than the source is upscaled.
- **PDF to TXT** reads the text layer only. Scanned pages contain no characters, and the tool says
  so instead of writing an empty file. OCR is a separate, later tool.
- **Repair PDF** rebuilds structure (broken cross-reference tables, duplicate objects, stale edit
  history, embedded thumbnails). It cannot reconstruct bytes that were never written, and it never
  removes a password.
- **Scan to PDF** captures camera frames into the page: no OCR, no auto-crop, no de-skew. Cameras
  require https and a permission grant, so the file picker is always offered as well.
- **Add Text / Highlight / Draw / Add Shapes** all open the same editor with a different tool
  preselected. They draw into the page — they never rewrite existing text, and a highlight or a
  shape over text is not redaction.
- **Remove Metadata From PDF** clears the document information fields; it does not touch page
  content, and an office suite that re-saves the file may stamp its own fields back in.
- **iOS Safari** may return HEIC from the file picker instead of JPEG; HEIC is decoded in the
  browser, but very large HEIC batches are slow on older phones.

---

## Manual QA checklist (browser-only paths)

The sandbox this was built in has no browser, so canvas/Web Worker paths were verified by code
review plus `npm test` for the DOM-free engine parts. Please run this on a real device before
launch (Chrome, Safari iOS, Firefox, Edge):

1. **Image to PDF** — 1 photo, 10 photos, a HEIC photo, a transparent PNG, a 20 MB JPEG.
   Check page count, order, A4/Letter/fit, 0/10/40 mm margins, and that the PDF opens in
   Acrobat + Preview + iOS Files.
2. **Compress PDF** — 1-page PDF, 100-page PDF, 20 MB scan, password-protected PDF (should warn),
   corrupt file (should explain, not crash). Verify Light keeps text selectable, Strong does not,
   and that the before/after sizes are honest.
3. **Image Converter / JPG to PNG** — add a photo and a transparent PNG, then walk every target:
   → JPG (transparency becomes the chosen background), → PNG/WebP/AVIF (alpha kept), → GIF, → BMP,
   → TIFF, → ICO (check the file opens as an icon with 4 sizes), → PDF (one page, opens in Acrobat),
   → SVG (opens in Chrome and shows the image), → PPM. Confirm each row says "Verified: decodes
   cleanly at W × H px", that Save reopens the file in Preview/Photos, and that a batch of 5 zips.
4. **New in this step** — Remove/Extract pages (thumbnails, typed range, red/indigo selection),
   Repair (a good file should report "nothing to fix" and a truncated file should fail loudly),
   PDF to TXT (a text PDF vs a scan), PDF to WebP, Scan to PDF on a phone over https, and each of
   the four annotation pages opening with the right tool preselected.
5. **Mobile at 360 px** — dropzone tappable, options readable, buttons reachable, no horizontal
   scroll.
6. **Network tab** — run any tool and confirm no request carries file data.
7. **Lighthouse mobile** — target 90+ on Performance, Accessibility, Best Practices, SEO.
