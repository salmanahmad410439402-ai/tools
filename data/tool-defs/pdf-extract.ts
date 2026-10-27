import type { Tool } from "@/lib/tool-types";

/** Tools that take content back out of a PDF. */
export const pdfExtractTools: Tool[] = [
  {
    slug: "pdf-to-jpg",
    name: "PDF to JPG",
    shortName: "PDF to JPG",
    category: "pdf-tools",
    group: "extract",
    widget: "pdf-to-image",
    icon: "ImageDown",
    tagline: "Turn PDF pages into JPG or PNG images at the resolution you choose, zipped.",
    bestFor: "A site only accepts images, or you need a page as a picture for a slide or a chat message.",
    seoTitle: "PDF to JPG Free — Convert Pages to Images",
    metaDescription:
      "Convert PDF pages to JPG or PNG images at 72–300 DPI with adjustable quality. Batch convert and download a ZIP. Free, no upload.",
    h1: "PDF to JPG — Convert Pages Into Images",
    intro: [
      "Every page of your PDF is rendered into an image at the resolution you pick, then offered as individual downloads or a single ZIP. JPG keeps file sizes small for sharing; PNG keeps crisp edges for screenshots and diagrams.",
      "Rendering happens with pdf.js inside your browser, so a signed contract or a medical record does not need to be uploaded. You control the DPI, which is the difference between a 90 KB thumbnail and a 4 MB print-quality page.",
    ],
    bullets: [
      {
        title: "Choose the resolution",
        text: "72 DPI is screen size, 150 DPI suits presentations and most web uploads, 300 DPI is print quality. Higher DPI means sharper images and much larger files.",
      },
      {
        title: "JPG or PNG",
        text: "JPG with a quality slider for photos and scans; PNG for pages with sharp text, line drawings or transparency-sensitive graphics.",
      },
      {
        title: "Pick the pages",
        text: "Convert all pages or a range such as 1-3, 7. Page numbers in the downloaded filenames always match the original document.",
      },
      {
        title: "Batch + ZIP download",
        text: "A 30-page PDF produces 30 images in one ZIP, named “document-page-01.jpg” and so on, so the order is obvious.",
      },
      {
        title: "Real rendering, not extraction",
        text: "Pages are drawn exactly as they appear — including stamps, signatures, highlights and form fields — rather than pulling out only the original embedded images.",
      },
      {
        title: "Private and free",
        text: "No upload, no account, no watermark and no page limit other than your device's memory.",
      },
    ],
    steps: [
      {
        title: "Add the PDF",
        text: "Drop the file in. The page count appears before you choose anything.",
      },
      {
        title: "Set format and DPI",
        text: "JPG at 150 DPI and quality 85 covers most sharing needs. Use 300 DPI only if the image will be printed.",
      },
      {
        title: "Choose pages",
        text: "All pages, or a range. Everything is converted locally, one page at a time, with a progress bar.",
      },
      {
        title: "Download",
        text: "Grab a single image when you converted one page, or the ZIP when there are several.",
      },
    ],
    limits: [
      {
        title: "Text stops being text",
        text: "The output is a picture of the page. You cannot select or search it, and OCR is needed to get text back.",
      },
      {
        title: "Huge files at 300 DPI",
        text: "A 40-page document at 300 DPI can produce hundreds of megabytes of images. Convert in ranges if your device struggles.",
      },
      {
        title: "No vector export",
        text: "This produces raster images. For vector graphics, use the original design file — a PDF is not a reliable SVG source.",
      },
      {
        title: "Links and fields are flattened",
        text: "Hyperlinks, buttons and form fields become part of the picture and stop working.",
      },
      {
        title: "The output is a picture, not text",
        text: "A rendered page has no selectable characters unless you run OCR afterwards. That is fine for slides, thumbnails and previews; for a document someone will need to search or copy from, keep the PDF or convert with an OCR step.",
      },
    ],
    tips: [
      {
        title: "Slides and presentations",
        text: "150 DPI gives a sharp page image for a 1920-pixel-wide slide without bloating the deck.",
      },
      {
        title: "Forms that demand an image",
        text: "Some portals accept only JPG. Convert at 200 DPI so any small print and barcodes stay legible.",
      },
      {
        title: "Screenshots versus photographs",
        text: "A page of text converted to JPG at low quality shows grey fringing around letters. Use PNG, or JPG at quality 90 or above.",
      },
      {
        title: "Check the page count after downloading",
        text: "ZIP filenames include the page number, so a quick count confirms nothing was skipped before you send them on.",
      },
      {
        title: "Match DPI to the destination",
        text: "72 DPI is a screen preview, 150 DPI is comfortable for a document read on a laptop, and 300 DPI is the point where printing a page at full size looks sharp. Higher than 300 DPI rarely helps and multiplies file size.",
      },
      {
        title: "JPG for photos, PNG for text",
        text: "Screenshots of text and page scans with crisp lines stay clean as PNG. JPG compresses photographic content well but puts faint halos around lettering at small quality settings, which looks blurred on a retina screen.",
      },
      {
        title: "Extract one page, not the whole report",
        text: "If you only need the cover, set the range to that page rather than converting 80 pages and deleting 79. It runs faster and keeps the download small enough to send in a chat message.",
      },
    ],
    faqs: [
      {
        q: "What DPI should I use?",
        a: "72–96 for screen viewing, 150 for presentations and web uploads, 300 for printing. Each step up roughly doubles the pixel dimensions and quadruples the file size.",
      },
      {
        q: "Should I choose JPG or PNG?",
        a: "JPG for scanned documents and photos where small files matter. PNG for text-heavy pages, diagrams and anything with sharp edges.",
      },
      {
        q: "Can I convert only some pages?",
        a: "Yes — enter a range such as 1-3, 8 or 12-15. Each converted page keeps its original page number in the filename.",
      },
      {
        q: "Does the image include signatures and stamps?",
        a: "Yes. Pages are rendered as they appear, so annotations, stamps and filled fields are included.",
      },
      {
        q: "Will the images be searchable?",
        a: "No. They are pictures; searching them needs OCR. Keep the PDF if you need searchable text.",
      },
      {
        q: "How many pages can I convert at once?",
        a: "There is no hard limit, but the browser must hold each image in memory. Very large documents are better converted in ranges.",
      },
      {
        q: "Is my PDF uploaded?",
        a: "No. Rendering happens in your browser with pdf.js and the images are created locally.",
      },
      {
        q: "Can I convert to PNG instead?",
        a: "Yes. Choose PNG in the format selector; the same page selection and DPI options apply.",
      },
    ],
    related: ["organize-pdf", "image-to-pdf", "compress-pdf"],
    inputFormats: ["PDF"],
    outputFormats: ["JPG", "PNG"],
    keywords: ["pdf to jpg", "pdf to png", "pdf to image", "convert pdf pages to images"],
    popular: true,
    phase: 2,
    updated: "2026-10-27",
  },
];
