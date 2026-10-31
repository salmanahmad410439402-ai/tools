# Filecraft — free PDF & image tools that run in the browser

A static, SEO-first website of file tools. Every tool processes files **on the user's device**:
there is no upload endpoint, no backend, no database and no account system.

- **Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · static export (`out/`)
- **Deploy target:** any static host (Netlify, Cloudflare Pages, Vercel, S3 + CDN, GitHub Pages, nginx)
- **Ads:** Google AdSense wired up but switched **off** until approval (`ADS_ENABLED=false`); no Google
  request is made while it stays off
- **Theme:** light + dark, following the visitor's system preference, with a header switch

---

## Quick start

```bash
npm install          # also copies the pdf.js worker and the OCR runtime into /public via predev/prebuild
npm run dev          # http://localhost:3000
```

Both generated asset sets are gitignored and rebuilt from `node_modules`:

- `public/pdf.worker.min.mjs` — `scripts/copy-pdf-worker.mjs`
- `public/ocr/` — `scripts/copy-ocr-assets.mjs`: the tesseract worker, the two LSTM WASM cores
  (SIMD and plain) and the English language data. `npm run sync:ocr` re-runs just this step.

Production build and local preview of the exported site:

```bash
npm run build        # writes static HTML + JS to ./out
npm start            # zero-dependency static server on :3000 (PORT=… to change)
```

Checks that run in CI or before a deploy:

```bash
npm run typecheck    # tsc --noEmit
npm run validate     # content + registry rules (title lengths, FAQs, word counts, links)
npm test             # Node smoke tests for the PDF, DOCX and image engines
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

`data/site.ts` holds the identity of the site:

```ts
export const SITE_NAME = "Filecraft";
export const CONTACT_EMAIL = "Alhamdstudio839@gmail.com";
// Set at build time — this is the only place the domain lives:
// NEXT_PUBLIC_SITE_URL=https://your-domain.tld
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
```

Canonical URLs, Open Graph tags, structured data, `sitemap.xml`, `robots.txt` and the footer
email are all generated from those constants. **The fallback origin is a placeholder:**
`npm run validate` prints a warning while it is in use, because shipping it would publish
canonicals and a sitemap for `example.com`.

---

## Launch checklist

1. **Domain.** Set `NEXT_PUBLIC_SITE_URL` in the host's build environment (no trailing slash),
   rebuild, then confirm `out/sitemap.xml`, `out/robots.txt` and a canonical tag on any page all
   show the real host. `npm run validate` must print no placeholder warning.
2. **Host.** Deploy `out/` and check that `/foo/` resolves to `foo/index.html`
   (`trailingSlash: true`), that `sitemap.xml` and `robots.txt` are served at the root, and that
   `ads.txt` is reachable.
3. **Search Console.** Add the domain as a property (use the Domain property with DNS
   verification if you can), submit `https://your-domain.tld/sitemap.xml`, and use *URL
   inspection* on the homepage, one category page and one tool page. If you prefer the meta-tag
   method, set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` (and optionally
   `NEXT_PUBLIC_BING_SITE_VERIFICATION`) and rebuild — the tag is emitted only when set.
4. **Ads.** Leave `NEXT_PUBLIC_ADS_ENABLED` unset until AdSense approves the site. Set
   `NEXT_PUBLIC_ADSENSE_SCRIPT=on` only if the review asks for the library to be present.
5. **Before asking for review**, read the About, Privacy, Cookie and Contact pages once more and
   make sure every sentence still describes the code that ships.

## Advertising (AdSense)

The publisher ID `ca-pub-3078074422458018` is already in:

- `<meta name="google-adsense-account">` on every page (`app/layout.tsx`)
- `public/ads.txt`
- the async AdSense script in `<head>`, which is **only injected when ads are enabled** (or when
  `NEXT_PUBLIC_ADSENSE_SCRIPT=on`). A site with ads switched off therefore makes no requests to
  Google at all, which is what the Privacy and Cookie pages state.

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
| Editor font library | 27 families from Google Fonts via `@fontsource/*` 5.3.0 (SIL OFL 1.1, notices in `public/fonts/library/README.md`) | a family's files are fetched only when the editor shows or exports that family |
| BMP / TIFF / GIF / PPM / SVG / ICO output | local encoders in `lib/images/codecs.ts` | tiny, bundled |
| Embedding the Unicode font | `@pdf-lib/fontkit` 1.1.1 (MIT) | first time text needs a glyph outside WinAnsi |
| QR encoding | `qrcode-generator` 2.0.4 (MIT, no runtime deps) | only on the QR page |
| PDF passwords (encrypt / decrypt) | `@cantoo/pdf-lib` 2.11.1 (MIT — a pdf-lib fork adding the standard security handler) | only on Protect PDF and Unlock PDF, and only when the button is pressed |
| Writing `.docx` | our own OOXML writer in `lib/convert/docx-write.ts` | bundled, no dependency |
| Writing `.xlsx` | `xlsx` 0.18.5 (Apache-2.0) | only when a workbook is downloaded |
| OCR | `tesseract.js` 7 (Apache-2.0) + `tesseract.js-core` WASM + `@tesseract.js-data/eng` (MIT), all served from `/ocr/` | only on the OCR page, on first run (~7 MB, cached) |
| PowerPoint parsing | `jszip` (MIT) + the DOM's `DOMParser` + local code in `lib/convert/pptx.ts` | only on the PowerPoint to PDF page |

Analytics is opt-in and cookie-free. Two options, both off unless configured:

```bash
# 1. Vercel Web Analytics — only works on Vercel hosting, because the script is
#    served by the deployment at /_vercel/insights/script.js
NEXT_PUBLIC_VERCEL_ANALYTICS=true

# 2. Any Plausible/Umami-compatible script, for every other static host
NEXT_PUBLIC_ANALYTICS_SCRIPT_URL=https://plausible.io/js/script.js
NEXT_PUBLIC_ANALYTICS_DOMAIN=yourdomain.com
```

On Vercel, add the first variable under Project → Settings → Environment Variables and redeploy.
The flag is public (`NEXT_PUBLIC_`) on purpose: the server render and the client bundle must agree
on whether the script exists. When it is off, the Vercel client code is not even bundled — it is a
lazy chunk behind `next/dynamic`.

**Consent comes first.** Even when a provider is enabled, nothing loads until the visitor presses
"Allow analytics" in the cookie panel (`lib/consent.ts` stores `filecraft-consent` in localStorage
and broadcasts changes; `CookieNotice`, `Analytics`, `AdSlot` and `AdSenseScript` all subscribe).
Declining or closing the panel means no measurement request and no ad request. The panel is not
modal — no overlay, no scroll lock, no focus trap — and the tools never depend on it. The footer's
"Cookie settings" button clears the record and reopens the panel. Set
`NEXT_PUBLIC_ADSENSE_SCRIPT=on` if Google's review needs the AdSense snippet present before consent.

Events recorded (when enabled): `tool_started`, `tool_completed` — no file names, no content, only a
coarse size bucket. `lib/analytics.ts` is the single place that emits them; `components/Analytics.tsx`
is the single place that loads a provider. The Privacy Policy and Cookie Policy branch on the same
flags, so the legal copy cannot claim something the build does not do.

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

**Note on `/blog/[slug]`:** the route exists as of the first guide. Adding a guide to
`data/guides.ts` is enough — `/blog/`, the homepage section, the sitemap and the article
structured data all read the same array. If the array is ever emptied again, `/blog/` flips back
to `noindex` and leaves the sitemap automatically.

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

## Design system (dark-first midnight navy)

`app/globals.css` is the single source of truth. `:root` is the **default** theme — deep midnight
navy canvas (`#070B13`), ice-white type, frosted navy panels; `html.light` overrides the same
variables with the cool-alabaster theme. `components/ThemeToggle.tsx` holds the button, the storage
key (`filecraft-theme`) and the inline head script that picks the theme before first paint (stored
choice, else an explicit light system preference; dark otherwise, so the site is complete with no
JavaScript at all).

Colour variables are shadcn-style HSL triplets (`222 47% 5%`) and every Tailwind token wraps them
as `hsl(var(--token) / <alpha-value>)`, which is what makes `bg-primary/10`, `border-primary/25` and
`text-emerald-500` work as translucent tints:

| Purpose | Tokens |
| --- | --- |
| Surfaces | `background`, `card`, `popover`, `secondary`, `muted` |
| Text | `foreground`, `text-secondary`, `text-tertiary`, `text-minimal` (via `ink` / `body` / `subtle` / `minimal`) |
| Brand | `primary` `#645CFF` dark / `#4F46E5` light, `accent` mint `#12D393` |
| Feedback | `destructive`, `success`, `warning` |
| Chrome | `border`, `input`, `ring`, `--radius: 1rem` |

The older names the components use (`page`, `raised`, `surface`, `line`, `ink`, `body`, `subtle`,
`brand-50…900`) are aliases of those tokens, so ~60 files did not have to change and nothing can
drift.

**Utilities** (all in `globals.css`): `.text-gradient-flow` and `.bg-gradient-flow` (emerald →
indigo → blue, 4s linear loop), `.text-gradient` (2-stop 135°), `.glass-panel` (frosted, blurred),
`.card` (glass look without the blur — a grid of blurred cards is a scroll cost on phones),
`.grid-bg` (40px indigo grid with a radial fade), `.orb` / `.orb-1` / `.orb-2` (drifting blurred
radials), `.card-hover` (4px lift + indigo border + coloured shadow) and the translucent pill set
`.pill-indigo` / `.pill-emerald` / `.pill-amber` / `.pill-sky` / `.pill-rose`.

**Two deliberate deviations, both for legibility:** filled buttons use `--primary-strong` (a
slightly deeper indigo) so white labels stay above 4.5:1, and the light theme deepens the flow
gradient's emerald stop (`#059669`), because `#10B981` is only 2.4:1 on alabaster. Gradient text
also falls back to `currentColor` under `forced-colors`.

**Type:** Outfit (headings, 800, tracking `-0.03em`), Inter (body/UI), JetBrains Mono (counts,
code, `kbd`, file sizes), all self-hosted through `@fontsource-variable/*`.

## Tests and what they do not cover

`npm test` runs engines in Node with no browser: page geometry, image→PDF, the merge/split/
extract/rotate/organise/page-number/watermark/metadata operations, the rebuild path used by
Repair, DOCX → HTML → blocks → PDF via Mammoth, CSV/Markdown/HTML parsing, the custom image
encoders and the canvas-limit guard. `jsdom` supplies `DOMParser` for the HTML/DOCX/PPTX steps.

Step 6's engines are covered too: a real AES-256 encrypt → decrypt round trip (including a wrong
password, an owner password and a refusal to re-encrypt an already-protected file), the .docx
writer (validated by reading its own output back with Mammoth), the .xlsx writer (read back with
SheetJS), the PDF text-layout heuristics (line grouping, heading detection, column clustering,
running-header detection) and a synthetic .pptx parsed into a PDF page at the deck's size.

Anything that needs a canvas, a camera or a worker is verified manually: PDF compression levels
(the *strong* level rasterises), PDF → JPG/PNG/WebP rendering, the image converter and its AVIF
probe, Scan to PDF (`getUserMedia`), and the editor/signature canvases. The manual pass is: open
the page in Chrome and Firefox, run one real file through it, check the download opens, then
break it on purpose (wrong type, encrypted PDF, huge image) and confirm the error message is a
sentence rather than a blank screen.

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
- Every tool page carries 800–1200 words of original copy and 6–8 FAQs; `npm run validate`
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
- Content: 850–1200 words of hand-written copy per tool page, 6–8 FAQs each.

**Correction:** the TXT/DOCX/CSV/Markdown converters originally planned for Step 3 shipped
in Step 2, because they belong in the same PDF menu.

**Step 4 (image tools) — done**

- Five new tools, each with its own page, engine and Node smoke tests:
  - **Compress Image** (`/compress-image/`) — target-size compression. It encodes at 0.92,
    then binary-searches the quality until the file fits, and keeps the highest quality that
    does. When the target is impossible it says so and offers the smallest result it reached.
  - **Resize Image** (`/resize-image/`) — exact pixels, fit-inside-a-box or percentage, with a
    ratio lock, six presets, JPG/PNG/WebP output and upscaling labelled as upscaling.
  - **Crop Image** (`/crop-image/`) — draggable crop box with four corner handles, aspect
    presets, 90° rotation, horizontal and vertical flips, a live result preview, and export
    from the full-resolution original.
  - **EXIF Remover** (`/exif-remover/`) — reads EXIF, GPS, XMP and text metadata from JPEG,
    PNG and WebP, then removes it **without re-encoding the pixels**.
  - **Image to Base64** (`/image-to-base64/`) — encode to a data URI, raw base64, CSS or HTML
    snippet, and decode base64 back into a real file with the type sniffed from the bytes.
- Engines: `lib/images/transform.ts` (target-size search, crop, resize), `lib/images/exif.ts`
  (EXIF/TIFF parsing, PNG/WebP chunk surgery), `lib/base64.ts` (encode, decode, signature
  detection). 24 new assertions in `npm test` cover EXIF parsing and stripping, PNG/WebP chunk
  removal, refusal of unsupported containers, base64 round-trips and the quality search.

**Step 5 (utilities) — done**

- Four utilities, `/utilities` switched from `noindex` to a live, indexed category page:
  - **QR Code Generator** (`/qr-code-generator/`) — real ISO/IEC 18004 symbols from
    `qrcode-generator` (MIT, no runtime dependencies), levels L/M/Q/H, quiet-zone control, a
    contrast check with an inverted-colour warning, and both a **vector SVG** (one rect per
    module) and a **PNG at an exact pixel size**. No redirect, no short link, no scan counting.
  - **Word Counter** (`/word-counter/`) — words, characters with and without spaces,
    sentences, paragraphs, lines, reading time at 225 wpm, speaking time at 130 wpm, a live
    eight-destination limit panel (X, meta description, SEO title, email subject, SMS,
    YouTube, Instagram, LinkedIn) and a stop-word-filtered repetition list.
  - **Case Converter** (`/case-converter/`) — 13 conversions: sentence, Title (with the
    small-word rule and acronym preservation), UPPER, lower, camelCase, PascalCase,
    snake_case, kebab-case, CONSTANT_CASE, dot.case, URL slug, alternating and inverted.
  - **Lorem Ipsum Generator** (`/lorem-ipsum-generator/`) — 1–20 paragraphs × 1–12 sentences,
    optional classical opening, plain text / HTML `<p>` / Markdown output, copy and download.
- Engines: `lib/qr.ts` (matrix encoding, SVG serialiser, canvas painter, contrast maths) and
  `lib/text/tools.ts` (counts, frequency, casing, filler with an injectable RNG), both pure and
  covered by 30 new assertions in `npm test`.
- The content validator learned one exception: the lorem-ipsum page is *about* placeholder text,
  so its own copy is not flagged as unfinished placeholder copy (TODO/TBD/“coming soon” still are).

**Step 6 (advanced tools) — done**

- Six new tools, 48 in total, each with its own page, engine and Node assertions:
  - **Protect PDF** (`/protect-pdf/`) — AES-256 encryption (`/V 5`, `/R 6`) with a user password,
    an optional owner password and the five permission flags. Uses `@cantoo/pdf-lib` (MIT, an
    API-compatible fork adding the standard security handler), imported dynamically so only this
    page loads it.
  - **Unlock PDF** (`/unlock-pdf/`) — decrypts with a password the user already knows, then copies
    the pages into a brand-new document. Clearing the trailer is not enough: the fork's writer
    still emits the original `/Encrypt` dictionary, so a fresh document is the only way to be sure.
    The output is re-opened with plain `pdf-lib` (which refuses encrypted files) as proof.
  - **OCR PDF** (`/ocr-pdf/`) — `tesseract.js` (Apache-2.0) compiled to WebAssembly in a worker,
    with the engine, WASM cores and English `traineddata` self-hosted from `/ocr/`. Produces a
    `.txt` transcript and a searchable PDF: the scan stays as an image and the recognised words go
    underneath it as zero-alpha text, so find and copy work while the page still looks scanned.
  - **PDF to Word** (`/pdf-to-word/`) — pdf.js text items → lines (by baseline) → paragraphs (by
    gap, size and indent) → a real `.docx` written by `lib/convert/docx-write.ts`, a five-part
    OOXML writer of our own instead of a 300 KB dependency. Running headers, footers and page
    numbers are detected across pages and dropped; page breaks are optional.
  - **PDF to Excel** (`/pdf-to-excel/`) — the same line model, split into cells at visible gaps and
    aligned into columns by clustering their left edges, written with SheetJS (already a dependency
    for CSV → PDF) as numeric-where-possible cells. One sheet per page or one long sheet.
  - **PowerPoint to PDF** (`/powerpoint-to-pdf/`) — a .pptx is unzipped and parsed with `jszip` +
    `DOMParser`: slide order, slide size, shape transforms, text runs (size, bold, colour,
    alignment, bullets), pictures and solid fills are drawn into pdf-lib pages. Placeholder
    geometry inherited from the slide layout and master is resolved, which is what makes
    template-built decks land in the right place.
- Engines: `lib/pdf/security.ts`, `lib/ocr.ts`, `lib/pdf/ocr-pdf.ts`, `lib/convert/pdf-layout.ts`,
  `lib/convert/pdf-text.ts`, `lib/convert/docx-write.ts`, `lib/convert/xlsx-write.ts`,
  `lib/convert/pptx.ts`. 60+ new assertions in `npm test`.
- Copy that used to say “OCR is not built yet” now points at the OCR tool, and the roadmap is empty
  apart from the remaining conversion and guide work.

**Not built yet (next steps)**

- Step 4 remainder: more conversion landing pages (e.g. PNG → WebP, WebP → JPG).
- Step 5 remainder: the guide library (three are published; the plan called for more).
- OCR languages beyond English, and a “searchable PDF” option on Scan to PDF.

---

## Known limitations (documented on the pages themselves)

- **Compress PDF, Light/Recommended** rewrite the file structure, strip metadata and recompress
  oversized embedded JPEG images. They do **not** re-encode every image: a browser has no safe
  way to do that without risking broken pages. Savings are modest (2–10%) on already-optimised
  PDFs, large on scans.
- **Compress PDF, Strong** rasterises pages at 150 DPI or lower → text is no longer selectable.
  This is stated in the UI before the user starts.
- **Protect PDF** adds AES-256 with a user password, an optional owner password and the five
  permission flags. The flags are a request the reader is asked to honour, not a lock: a viewer
  that ignores them can still copy or print. There is no password recovery, by design.
- **Unlock PDF** removes a password the user already knows, and never guesses. Certificate-based
  encryption is not supported, and the document information dictionary is encrypted in the source
  so the unlocked copy starts with empty properties rather than a partial guess.
- **OCR PDF** recognises English printed text with tesseract.js in a worker. Handwriting, stamps and
  stylised display fonts are unreliable; accuracy depends on resolution, skew and contrast. The
  searchable PDF keeps the scan as an image with a zero-alpha text layer underneath — it is not a
  rebuilt document. About 7 MB of engine and language data is downloaded and cached on first use.
- **PDF to Word** rebuilds paragraphs, headings and page order from text positions. Tables arrive as
  text, images are not extracted, and inline bold/italic is often lost because a PDF stores a font
  reference rather than a style name. Scans need OCR first.
- **PDF to Excel** infers columns from the horizontal gaps between words. Merged cells, vertical
  rules and wrapped cell text survive badly; numbers are written as numbers when they look numeric,
  and anything with a currency symbol stays text so nothing is silently altered.
- **PowerPoint to PDF** draws text, pictures, solid shapes and backgrounds at their slide positions,
  at the deck's own page size. Animations, transitions, charts, SmartArt, gradients, shadows and
  video cannot be reproduced; tables are flattened to aligned text; speaker notes are not included.
- **PDF editor** either starts a blank document (A4/Letter/Legal/A5/A3/square, portrait or
  landscape, any page count up to 20 at creation) or opens an existing PDF and draws over it. It
  offers fourteen tools — select, text, image, rectangle, rounded box, ellipse, triangle, polygon,
  star, line, arrow, highlight, white-out and pen — with a searchable, grouped palette, a full
  colour wheel/hex/swatch picker, opacity, rotation, layer order, undo/redo and a page strip for
  adding, duplicating, reordering and deleting pages. Shapes carry their own geometry: a corner
  radius on rectangles (0–120 pt, all corners at once or each corner on its own, plus a live corner
  handle to drag on the page), corner rounding on polygons and stars, 3–16 sides on polygons, and
  3–16 points with an adjustable inner radius on stars. Placed images keep their own aspect ratio —
  a photo is never stretched into a default box — and stay at that ratio when a corner is dragged,
  because the export places the picture *inside* its frame (like `object-fit: contain`) rather
  than stretching it to fill the frame. Shift draws a perfect square or circle, "Make it a square/circle" snaps a selected
  shape, and every object rotates and resizes about its own centre — the on-screen frame and the
  exported PDF agree. Text is typed directly on the page in a box that grows with the
  words — a new box starts with "Lorem ipsum" selected, so the first keystroke replaces it — and is
  re-opened by double-clicking it (any tool) or with "Edit on page" in the inspector. The Text tool
  stays in hand after placing a box, so consecutive notes do not need the tool re-selected. The
  selection frame is the object's own box, handles centred on its corners; the pen
  keeps the size and thickness it was drawn with rather than snapping to a default box. The stage
  zooms from 50 % to 300 % with fit-width (buttons or
  Ctrl/⌘ plus − + 0) and scrolls inside its frame instead of stretching the page, and opening a
  document — here and in every tool with a page preview — collapses the sidebar and the page header
  into one sticky line, so the working area gets the full width; "Exit full-width view" brings the
  rest back. Text is written as real selectable text. It still cannot rewrite
  existing body text: a PDF stores positioned glyphs, not paragraphs, and no browser library can
  reflow them. White-out covers text visually but leaves the original characters in the file, so
  it is explicitly *not* redaction.
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
  preselected, so text you type there can be re-opened and restyled with the editor's full
  inspector (family, size, weight, alignment, colour). They draw into the page — they never rewrite existing text, and a highlight or a
  shape over text is not redaction. DejaVu Sans covers the fallback ranges for non-Latin-1 text but
  ships without italic or bold-italic faces, so italic is dropped rather than faked for those
  scripts.
- **Remove Metadata From PDF** clears the document information fields; it does not touch page
  content, and an office suite that re-saves the file may stamp its own fields back in.
- **iOS Safari** may return HEIC from the file picker instead of JPEG; HEIC is decoded in the
  browser, but very large HEIC batches are slow on older phones.
- **Compress Image** writes JPG or WebP only: PNG compression is lossless, so it cannot be
  steered to a byte target. The search optimises bytes, not perceived quality, and a file that
  would grow is skipped with a note rather than handed back bigger.
- **Resize Image** changes dimensions, not shape. Stretching only happens when the ratio lock is
  off; cropping to a different shape belongs to the crop tool. Upscaling interpolates and is
  labelled as such.
- **Crop Image** is rectangular only — no ellipse, lasso or perspective correction — and works on
  one image at a time.
- **QR codes are static**: no redirect, so they cannot be repointed and scans cannot be counted
  without handing every visitor to a third-party redirector. No logo overlay or rounded modules.
- **Word Counter** splits on whitespace, which is right for English and wrong for Chinese,
  Japanese and Thai (their character counts stay accurate, their word counts do not); characters
  are Unicode code points, so a skin-toned emoji counts as two.
- **Case Converter** applies English casing rules — German nouns and French title conventions
  need a manual pass, and scripts without letter case pass through untouched.
- **Lorem Ipsum Generator** produces paragraphs only (no lists or tables) from classical filler
  vocabulary, not grammatical Latin. It is for judging layout, never for publishing.
- **EXIF Remover** parses JPEG, PNG and WebP only. HEIC, TIFF and RAW are refused rather than
  silently returned unchanged. It removes tags, not pixels: metadata removal is not redaction.

---

## Manual QA checklist (browser-only paths)

The sandbox this was built in has no browser, so canvas/Web Worker paths were verified by code
review plus `npm test` for the DOM-free engine parts. Please run this on a real device before
launch (Chrome, Safari iOS, Firefox, Edge):

1. **Image to PDF** — walk the four-step flow: 1 photo, 10 photos, a HEIC photo, a transparent PNG, a 20 MB JPEG.
   On the arrange step confirm the page cards regroup when you switch 1 / 2 / 4 pictures per page, that dragging
   and the arrows move a picture across a page break, and that a portrait photo in a landscape grid cell keeps its
   proportions. On the setup step check A4/Letter/A5/fit, orientation, 0/10/40 mm margins. After Create PDF the
   result must state the exact size — then press each compression level and confirm the before/after figure, that
   "Keep the original" still downloads the first file, and that a file which cannot shrink says so rather than
   handing over something larger. Open the PDF in Acrobat + Preview + iOS Files.
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
5. **Image tools (step 4)** — Compress Image: a 4 MB photo to 100 KB (should hit the target),
   then to 5 KB (should report that it could not); try a 12 KB file that is already tiny (should
   tell you to keep the original). Resize: exact 1200 × 630, fit-inside 800, 50%, and confirm
   no distortion with the lock on. Crop: drag the box, pull each corner, try 1:1 and 9:16, rotate
   90°, flip both ways, and confirm the export is full resolution. EXIF: a phone photo with GPS
   (warning shown), the cleaned copy opens normally and still looks identical, and a PNG
   screenshot reports nothing to remove. Base64: encode a PNG, copy the data URI into a browser
   address bar (it should render), then paste it back and decode.
6. **Utilities (step 5)** — QR: encode a URL, scan it with two phones from the screen and from
   a print; confirm the SVG opens in a browser and scales sharply; set a near-identical
   background and confirm the contrast warning appears. Word counter: paste 500 words and compare
   with Word/Google Docs, then check a 300-character post against the X bar. Case converter: run
   each of the 13 buttons on text with existing capitals, and confirm “Use as input” chains. Lorem:
   change paragraph counts, switch to HTML and confirm the tags appear verbatim.
7. **Passwords (step 6)** — Protect PDF: protect a 3-page file with a password, open it in Acrobat,
   Preview and Chrome and confirm each asks for the password; try the wrong one (must fail with a
   message, not a crash); then unlock it here with the right one and confirm the pages are intact
   and no password is asked for. Repeat with an owner password and with permissions-only (empty
   user password). Try a PDF that is already protected (must be refused with an explanation) and a
   one-page file with a 40-character password.
8. **OCR** — scan or photograph a page of printed text, then run it through OCR PDF. Expect a few
   seconds per page; confirm the searchable PDF opens with the scan intact, that Ctrl+F finds a word
   from the page, and that copying gives the recognised characters. Try a skewed photo and a
   handwriting sample — both should produce visibly worse results and the confidence figure should
   drop. Check the first run downloads ~7 MB from `/ocr/` (Network panel) and that a second run is
   cached.
9. **PDF → Word / Excel** — convert a text PDF with headings and a paragraph that wraps across
   lines; open the .docx in Word and Google Docs and confirm real paragraphs (not one per line),
   heading styles in the navigation pane, and no repeated header at the top of each page. Convert
   an invoice or statement to .xlsx and check that numbers arrive as numbers (SUM works) and that
   columns line up. Run both on a scanned PDF and confirm the message points at OCR instead of
   producing an empty file.
10. **PowerPoint → PDF** — convert a 16:9 deck with a title slide, bullets, a picture and a coloured
   shape; confirm one page per slide at 960 × 540 points, text selectable, picture in place. Then try
   a deck with a chart or SmartArt: the slide should still appear with its other elements, and the
   warning list should say what was approximated. A .ppt file must be refused with the re-save hint.
11. **PDF editor (the creator)** — this is the largest widget on the site, so walk it end to end:
   start a blank A4 document and add three pages; place text (type, change family, size, bold,
   italic, alignment and line spacing), a rectangle, an ellipse, a triangle, a line and an arrow;
   open the font picker and confirm it lists 30 choices in seven groups, that every row is drawn in
   its own typeface, that search finds "script" and "garamond", and that picking Great Vibes or
   Caveat renders on the page in that face — then export and open the PDF in Acrobat/Preview to
   confirm the same face is embedded (the text must look identical, not fall back to Helvetica).
   Pick a one-weight script font and confirm Bold/Italic are disabled with a reason. Put a Cyrillic
   word in a Latin-only family and confirm the export still prints it and the result note names the
   family that was swapped;
   draw a freehand stroke; insert a PNG logo and resize it by a corner handle. Open every colour
   field and confirm the system colour wheel opens, that a pasted hex code applies, that a swatch
   applies, and that "No colour" clears a fill. Drag an element, nudge it with the arrow keys,
   rotate it past 90°, change opacity, send it backward and forward, duplicate it and delete it.
   Type on the page with the Text tool: a Lorem ipsum box must appear under the caret with the dummy
   words selected, the caret where the printed text will be, and typing must replace them. Confirm
   the tool stays on Text so a second click makes a second box, that Esc/click-outside finishes, that
   clicking a box (or double-clicking it with any tool, or "Edit on page") reopens it, and that an
   emptied box disappears when you leave it.
   Draw a large freehand squiggle and a small tick and confirm both keep their drawn size, then
   resize a drawing by its corner handle. Draw a rectangle, drag the round handle on its top-left
   corner and watch the corners follow; switch to "Adjust corners separately" and give one corner a
   different radius, then check the exported PDF matches. Place a wide photo and a tall photo and
   confirm neither is stretched, that the Insert panel shows their pixel sizes, that dragging a
   corner only scales them, and that typing a deliberately wrong Width/Height in the inspector
   still exports the picture undistorted (the frame goes off-shape, the photo does not). Set
   a star's corner rounding, then a hexagon
   (6 sides) and a star (5 points, 45 % inner radius) and check the on-screen outline against the
   exported PDF; hold Shift while dragging for a square and confirm it stays square. Rotate a shape
   to 30° and confirm the selection frame turns with it, that dragging a corner keeps the opposite
   corner still, and that the exported shape sits exactly where the preview shows it. Then open a PDF instead: add an inserted page, duplicate a
   page with its objects, reorder pages, delete one, and confirm the thumbnail strip follows. Use
   Ctrl+Z / Ctrl+Shift+Z through all of the above. Export and open the result in Acrobat, Preview and iOS Files: text must be
   selectable, shapes must be in the same place as the preview, and the page order must match the
   strip. Also test on a phone: the palette, inspector and page strip must all be reachable at
   360 px without horizontal scroll, and drawing must work with a finger.
12. **Full-width view and zoom** — open a PDF in the editor (or any of the annotate, sign, watermark,
   page-number, rotate or organise tools): the sidebar and the page header must collapse the moment
   the file is read, leaving the stage the full container width, with a small sticky bar carrying the
   H1 and an "Exit full-width view" button. Zoom the editor page with the − / + buttons and with
   Ctrl/⌘ + − 0 from 50% to 300%; drag, resize and type at 300% and confirm objects land under the
   cursor and that the exported PDF matches the preview at every zoom level. Check "Fit width" and
   the "Full width"/"Normal width" toggle, then Sign PDF's 100/150/200% preview: the click position
   must still be accurate at 200%. Confirm the page still scrolls (no horizontal page scroll) and that
   the rail, ads and header come back when the view is exited or the document closed.
13. **Mobile at 360 px** — dropzone tappable, options readable, buttons reachable, no horizontal
   scroll; the crop handles must be draggable with a finger.
14. **Network tab** — run any tool, including the editor export, and confirm no request carries
   file data. Note that the analytics script only loads after **Allow** in the consent panel.
15. **Lighthouse mobile** — target 90+ on Performance, Accessibility, Best Practices, SEO.
