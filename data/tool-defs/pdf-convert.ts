import type { Tool } from "@/lib/tool-types";

/** Format-to-format landing pages: one job per slug, shared engine. */
export const pdfConvertTools: Tool[] = [
  {
    slug: "jpg-to-pdf",
    name: "JPG to PDF",
    shortName: "JPG to PDF",
    category: "pdf-tools",
    group: "create",
    widget: "image-to-pdf",
    icon: "Image",
    preset: { imageInput: "jpg" },
    tagline: "Turn a pile of JPG photos into one tidy PDF with real page sizes.",
    bestFor: "You photographed a document, an ID or a receipt and the recipient wants a PDF.",
    seoTitle: "JPG to PDF — Combine Photos Into One File",
    metaDescription:
      "Convert JPG photos into one PDF in your browser. Choose A4, Letter or fit-to-image, set margins and order, then download. No upload, no watermark.",
    h1: "JPG to PDF — Turn JPG Photos Into a Single PDF",
    intro: [
      "Drop in one JPG or fifty, drag them into the order you want, choose a page size and download a single multi-page PDF. Each photo becomes one page, centred and scaled to fit without stretching.",
      "This page accepts JPG and JPEG only. HEIC from an iPhone, PNG screenshots and WebP go through the general Image to PDF tool instead, which accepts every format your browser can open.",
    ],
    bullets: [
      {
        title: "Photographs stay photographs",
        text: "By default each JPG is embedded as-is, so the PDF contains your original compressed image rather than a re-encoded copy. The file stays small and the quality is exactly what you shot.",
      },
      {
        title: "Real page sizes, real margins",
        text: "Pick A4, US Letter or fit-to-image, choose portrait, landscape or automatic, and set a margin in millimetres. A landscape photo on A4 automatically gets a landscape page when you leave orientation on auto.",
      },
      {
        title: "Order by dragging",
        text: "Pages come out in the order shown in the list. Drag a thumbnail to move it, remove one with its bin icon, and the PDF follows the list exactly.",
      },
      {
        title: "Optional re-compression",
        text: "For email and web uploads, switch to “smaller file” and set a quality level. That re-encodes each page and can cut a photo batch by 60–80%, at the cost of some detail.",
      },
      {
        title: "No upload at any point",
        text: "Decoding and PDF writing both happen in the tab, which is what makes a passport photo or a signed form safe to convert here.",
      },
    ],
    steps: [
      {
        title: "Add your JPGs",
        text: "Drag them onto the page or click to browse. Multiple files are added to the same document in one go.",
      },
      {
        title: "Put them in order",
        text: "Drag thumbnails until the first page is first. The numbering in the list is the numbering in the PDF.",
      },
      {
        title: "Choose page size and margin",
        text: "A4 is the default and right for most documents; pick fit-to-image if the page should be exactly the photo's proportions with no white space.",
      },
      {
        title: "Create and download",
        text: "Press Create PDF, check the page count in the result line, and download. Repeat with the same photos at a different size without re-uploading anything.",
      },
    ],
    limits: [
      {
        title: "One image per page",
        text: "Each JPG becomes a full page. Putting two photos on one sheet is not supported; the tool deliberately keeps this predictable.",
      },
      {
        title: "Huge camera files are heavy",
        text: "A 45 MP photo is a large embed. Twenty of them produce a PDF in the hundreds of megabytes. Use the “smaller file” option for batches like that.",
      },
      {
        title: "No OCR",
        text: "The PDF contains images, not text, so the words are not searchable or selectable. That is a property of photographing a page, not a bug in the converter.",
      },
      {
        title: "Colour profiles are not carried over",
        text: "Photos taken in a wide-gamut space such as Display P3 are embedded as ordinary RGB, so a colour that looked vivid on your phone may print slightly differently. For anything where brand colour matters, export the JPG in sRGB before converting.",
      },
    ],
    tips: [
      {
        title: "Photograph flat and straight",
        text: "The single biggest quality win is lighting and angle, not the converter. Put the page on a dark surface, fill the frame and avoid your own shadow.",
      },
      {
        title: "Fit-to-image for photo albums",
        text: "For holiday photos, fit-to-image removes the white border and keeps each shot's aspect ratio. For documents meant to be printed, A4 with a 10 mm margin looks like a real document.",
      },
      {
        title: "Name the file before you send it",
        text: "The download takes the first photo's name. Renaming to something a recipient can recognise saves them sorting through a downloads folder.",
      },
    ],
    faqs: [
      {
        q: "How many JPGs can I combine into one PDF?",
        a: "There is no fixed limit. Every image has to be decoded in memory, so a phone manages batches of twenty to forty typical photos comfortably, while a desktop handles several hundred. Very large batches are best split into two documents.",
      },
      {
        q: "Will the PDF be bigger than my photos?",
        a: "Slightly larger, because each page adds a small amount of structure. The images themselves are embedded unchanged by default, so the growth is a few kilobytes per page rather than a doubling.",
      },
      {
        q: "Can I add PNG or HEIC photos here?",
        a: "This page accepts JPG and JPEG. PNG, WebP, HEIC, GIF, BMP and TIFF are handled by the general Image to PDF tool, which uses the same engine and adds transparency handling.",
      },
      {
        q: "Does converting to PDF strip the photo's location data?",
        a: "The PDF writer does not copy EXIF metadata into the document, so GPS coordinates and camera details are not carried across. If you want them gone from an image outside a PDF, the EXIF remover handles that.",
      },
      {
        q: "Can I rotate a photo that came out sideways?",
        a: "Yes — the format control on most phone cameras records orientation rather than rotating pixels, and the decode step applies it. If a page still looks wrong, rotate it after conversion with Rotate PDF.",
      },
      {
        q: "Is there a watermark or a page limit on the free version?",
        a: "No watermark, no page cap, no sign-up. The tool is free and the file is never sent anywhere, so there is no server cost to ration.",
      },
    ],
    related: ["image-to-pdf", "png-to-pdf", "webp-to-pdf"],
    inputFormats: ["JPG", "JPEG"],
    outputFormats: ["PDF"],
    keywords: ["jpg to pdf", "jpeg to pdf", "convert photos to pdf", "jpg to pdf converter"],
    popular: true,
    phase: 2,
    updated: "2026-10-27",
  },
  {
    slug: "png-to-pdf",
    name: "PNG to PDF",
    shortName: "PNG to PDF",
    category: "pdf-tools",
    group: "create",
    widget: "image-to-pdf",
    icon: "FileImage",
    preset: { imageInput: "png" },
    tagline: "Convert PNGs — screenshots, logos, diagrams — into a clean document.",
    bestFor: "A design review needs a PDF made of exported PNG screens, or a chart must go into a report.",
    seoTitle: "PNG to PDF — Screenshots & Logos to PDF",
    metaDescription:
      "Convert PNG images into one PDF in your browser. Lossless, transparency handled, page size and margins under your control. No upload, no sign-up.",
    h1: "PNG to PDF — Turn PNG Images Into a Document",
    intro: [
      "PNGs are the format of screenshots, exported UI, charts and logos: sharp edges, flat colour and often a transparent background. This page turns them into a single PDF, one image per page, with the page size and margins you choose.",
      "PNG is lossless, so the converter embeds the image data directly. Text in a screenshot stays as crisp as the screenshot itself — subject, of course, to the resolution you captured it at.",
    ],
    bullets: [
      {
        title: "Lossless by default",
        text: "PNGs are embedded without re-encoding, so a screenshot does not acquire JPEG artefacts on the way into the PDF.",
      },
      {
        title: "Transparency handled honestly",
        text: "PNG alpha is flattened onto white when the page is created, because PDF pages have no background to show through. Design exports with a transparent background therefore appear on white, which is what printers expect.",
      },
      {
        title: "Crisp text, real pages",
        text: "Choose A4, Letter or fit-to-image. Fit-to-image is the right choice for long screenshots, since it keeps the exact pixel proportions instead of forcing them onto a tall page.",
      },
      {
        title: "Batch and reorder",
        text: "Add a whole folder of exports, drag them into narrative order, delete mistakes, and create one document.",
      },
      {
        title: "Optional compression",
        text: "If the PDF is going through email, “smaller file” re-encodes pages as JPEG. Use it for photographic PNGs, avoid it for screenshots where text would soften.",
      },
    ],
    steps: [
      {
        title: "Add the PNGs",
        text: "Drag them in or browse. Each file is previewed in the queue with its dimensions.",
      },
      {
        title: "Arrange the order",
        text: "Drag to reorder so the document reads in sequence — a design review usually runs from the first screen to the last.",
      },
      {
        title: "Pick a page style",
        text: "A4 portrait for printable documents, fit-to-image for full-page screenshots that should not be letterboxed.",
      },
      {
        title: "Create the PDF",
        text: "Press Create PDF and download. The result states the page count so you can confirm every image made it in.",
      },
    ],
    limits: [
      {
        title: "No transparency in the finished PDF",
        text: "A PDF page is opaque. Transparent areas become white; if you need a coloured background, composite the image in an editor first.",
      },
      {
        title: "Very tall screenshots",
        text: "A full-length page capture with a 20:1 ratio on an A4 sheet becomes a thin sliver. Use fit-to-image, or split the capture into sections before converting.",
      },
      {
        title: "The text is not searchable",
        text: "Screenshots are pictures. Anyone needing to search or copy the words needs a text-based source or OCR, which this tool does not do.",
      },
      {
        title: "Annotations and links inside the PNG are gone",
        text: "A PNG is flat pixels: anything marked up in the source application is already baked in, and nothing is clickable in the finished PDF. If the original document had links that must work, convert from that document rather than from a screenshot of it.",
      },
    ],
    tips: [
      {
        title: "Export at 2× for retina-sharp PDFs",
        text: "A screenshot exported at 2× device pixel ratio looks noticeably sharper when the PDF is read on a phone or printed, because there are more pixels to work with.",
      },
      {
        title: "Use fit-to-image for UI exports",
        text: "Design exports are rarely A4-shaped. Fit-to-image keeps the frame exactly, which matters when you are reviewing spacing and layout.",
      },
      {
        title: "Combine PNG then compress",
        text: "If the finished PDF is too large to email, run it through Compress PDF afterwards rather than re-converting with heavy JPEG compression — you keep control over what is lost.",
      },
      {
        title: "Crop the browser chrome out first",
        text: "A screenshot usually includes a tab bar, an address bar and part of your desktop. Crop those before converting — a PDF with eight screenshots that all show the same browser frame looks unprofessional and wastes vertical space on every page.",
      },
    ],
    faqs: [
      {
        q: "Does converting a PNG to PDF reduce its quality?",
        a: "No, provided you leave the quality mode on the default. The PNG data is embedded unchanged. Choosing “smaller file” re-encodes pages as JPEG, which will soften sharp text and flat colours.",
      },
      {
        q: "What happens to a transparent PNG?",
        a: "The transparent area is filled with white when the page is drawn, since a PDF page has no transparency to show through. Logos appear on a white page, which is how they look when printed.",
      },
      {
        q: "Can I mix PNG and JPG in one PDF?",
        a: "Not on this page, which accepts PNG only. The Image to PDF tool accepts any mix of JPG, PNG, WebP, GIF, BMP, TIFF and HEIC in a single document.",
      },
      {
        q: "Are my screenshots uploaded?",
        a: "No. The only network requests when this page runs are for the page itself — no image data is transmitted, which you can confirm in your browser's Network tab.",
      },
      {
        q: "Why does a very long screenshot look tiny on the page?",
        a: "Because it is scaled to fit the page height while keeping its proportions, so a 400 × 4000 capture becomes narrow. Use fit-to-image so the page takes the image's exact shape.",
      },
      {
        q: "Can I add page numbers to the result?",
        a: "Yes — convert first, then use Add Page Numbers to PDF on the finished file. Numbering an image-based PDF works exactly the same as numbering a text one.",
      },
    ],
    related: ["jpg-to-pdf", "image-to-pdf", "add-page-numbers-to-pdf"],
    inputFormats: ["PNG"],
    outputFormats: ["PDF"],
    keywords: ["png to pdf", "screenshot to pdf", "convert png to pdf", "png to pdf converter"],
    phase: 2,
    updated: "2026-10-27",
  },
  {
    slug: "webp-to-pdf",
    name: "WebP to PDF",
    shortName: "WebP to PDF",
    category: "pdf-tools",
    group: "create",
    widget: "image-to-pdf",
    icon: "Images",
    preset: { imageInput: "webp" },
    tagline: "Turn WebP images saved from the web into a document anyone can open.",
    bestFor: "Someone sent you a WebP image and the system you are uploading to only accepts PDF.",
    seoTitle: "WebP to PDF — Convert Web Images to PDF",
    metaDescription:
      "Convert WebP images to PDF in your browser. Batch, reorder, choose page size and margins, download one document. No upload, no watermark.",
    h1: "WebP to PDF — Turn WebP Images Into a Document",
    intro: [
      "WebP is what websites serve today: small files, good quality, supported by every current browser — but not by every upload form, printer or email client. This page decodes WebP in your browser and wraps the images in a standard PDF.",
      "Because WebP is decoded by the browser and then written into a PDF, the result opens anywhere, from Acrobat to the print shop's ancient workstation.",
    ],
    bullets: [
      {
        title: "Any WebP the browser can decode",
        text: "Lossy and lossless WebP both work, including images with alpha, which are flattened onto white in the PDF.",
      },
      {
        title: "Batch into one document",
        text: "Add as many WebP files as you need, drag them into order and get a single PDF rather than a folder of images the recipient cannot open.",
      },
      {
        title: "Page size you control",
        text: "A4, Letter or fit-to-image, with a margin in millimetres and automatic landscape for wide images.",
      },
      {
        title: "Quality you can dial",
        text: "Since WebP must be decoded and re-encoded for the PDF, the quality slider controls exactly how much detail that second step keeps. 90 is a good default.",
      },
      {
        title: "Works offline",
        text: "Once the page has loaded, the conversion needs no network at all — useful on a locked-down machine with a strict upload policy.",
      },
    ],
    steps: [
      {
        title: "Add WebP files",
        text: "Drag them onto the page. Any file that is not WebP is rejected with a reason rather than silently failing.",
      },
      {
        title: "Set the order",
        text: "Drag thumbnails to arrange the document, and remove anything you added by mistake.",
      },
      {
        title: "Choose page and quality",
        text: "Fit-to-image for images straight off a website; A4 with a margin for anything meant to be printed.",
      },
      {
        title: "Create and download",
        text: "Press Create PDF and save the file. The result line confirms the page count.",
      },
    ],
    limits: [
      {
        title: "WebP is re-encoded, not copied",
        text: "A PDF cannot contain WebP data, so each image is decoded and written as JPEG or PNG. Keep the quality slider high and the visible difference is negligible.",
      },
      {
        title: "Animated WebP keeps one frame",
        text: "Only the first frame of an animated WebP is used. A PDF page is static; animations have no representation in the format.",
      },
      {
        title: "No text layer",
        text: "The result is images on pages. Any words in the picture cannot be searched or selected.",
      },
      {
        title: "Colour depth is reduced on the way through",
        text: "WebP can carry more than eight bits per channel. The PDF image it becomes is standard 8-bit, so smooth gradients in the original may band very slightly. Keep the WebP source if the image is going to print large.",
      },
    ],
    tips: [
      {
        title: "Save the original if it matters",
        text: "If you only hold a WebP that came from a photo, converting to PDF adds a re-encode. Keep the source file alongside the PDF for anything archival.",
      },
      {
        title: "Check the dimensions first",
        text: "Web images are often 1200 px wide, which is fine on screen but soft when printed at A4. The tool warns on the queue card by showing pixel dimensions.",
      },
      {
        title: "Fit-to-image for receipts",
        text: "Web receipts and confirmations come in odd shapes. Fit-to-image keeps them readable instead of shrinking them onto a letterboxed A4 sheet.",
      },
      {
        title: "Convert a whole article gallery in one pass",
        text: "Web pages that offer downloads often hand you a folder of WebP files. Select them all, drop them together and reorder once, instead of converting ten files one at a time and merging them afterwards.",
      },
    ],
    faqs: [
      {
        q: "Why can't my phone open a WebP file I was sent?",
        a: "Older Android galleries and some messaging apps still do not handle WebP well, even though browsers do. Converting to PDF, or to JPG with the image converter, gives you something every device opens.",
      },
      {
        q: "Does the PDF contain WebP data?",
        a: "No. PDF supports JPEG, JPEG 2000, PNG-style flate images and a few others, but not WebP. Each image is decoded in the browser and re-encoded, which is why this page exposes a quality control.",
      },
      {
        q: "How much quality is lost?",
        a: "At quality 90 the loss is not visible at normal viewing size. At 60 files get noticeably smaller but gradients and fine detail start to smear — worth it for thumbnails, not for print.",
      },
      {
        q: "Can I mix WebP with other image formats?",
        a: "This page is WebP only. Use Image to PDF when the batch mixes formats — it accepts JPG, PNG, WebP, GIF, BMP, TIFF and HEIC together.",
      },
      {
        q: "Is there a limit on how many images I can add?",
        a: "No limit is imposed by the site. Memory is the real constraint: a few dozen web-sized images convert instantly, while hundreds of large ones will slow an older laptop.",
      },
      {
        q: "Are the images uploaded to a server?",
        a: "No. Decoding and PDF writing happen in the tab. If you disconnect from the network after the page loads, the conversion still completes.",
      },
      {
        q: "What about a WebP with a transparent background?",
        a: "Logo exports from design tools often have one. Because a PDF page is opaque, transparent pixels are filled with white when the image is placed, so the logo appears on a white sheet rather than floating. If you need a coloured background behind it, composite the image first and convert the flattened version.",
      },
    ],
    related: ["image-to-pdf", "jpg-to-pdf", "png-to-pdf"],
    inputFormats: ["WebP"],
    outputFormats: ["PDF"],
    keywords: ["webp to pdf", "convert webp to pdf", "webp pdf converter"],
    phase: 2,
    updated: "2026-10-27",
  },
  {
    slug: "pdf-to-png",
    name: "PDF to PNG",
    shortName: "PDF to PNG",
    category: "pdf-tools",
    group: "extract",
    widget: "pdf-to-image",
    icon: "ImageDown",
    preset: { outputFormat: "image/png" },
    tagline: "Export pages as lossless PNGs with sharp text and no JPEG halos.",
    bestFor: "A slide, chart or page of text must go into a document without fuzzy lettering.",
    seoTitle: "PDF to PNG — Export Pages as Sharp Images",
    metaDescription:
      "Convert PDF pages to PNG images in your browser. Choose the page range and resolution, download one file per page or a ZIP. No upload.",
    h1: "PDF to PNG — Export Pages as Lossless Images",
    intro: [
      "PNG is the right output when the page is text, line art, a chart or a screenshot of a slide: no compression artefacts, crisp edges, and a file that stays sharp at 100% zoom.",
      "Pick a resolution, choose the pages you want and download each page as its own PNG, or everything as one ZIP.",
    ],
    bullets: [
      {
        title: "Lossless page renders",
        text: "Each page is rasterised by the browser's PDF engine and written as PNG, so text edges stay hard instead of acquiring the grey fringing JPEG introduces.",
      },
      {
        title: "Resolution you choose",
        text: "72 DPI for thumbnails, 150 DPI for reading on screen, 300 DPI for print. Each page reports its pixel dimensions in the result list.",
      },
      {
        title: "Page selection",
        text: "Convert the whole document or type a range like 1-3, 8. Converting one page instead of eighty keeps the download small enough to paste into a chat.",
      },
      {
        title: "One file per page, zipped",
        text: "A 20-page conversion produces 20 PNGs and offers them as a single ZIP with numbered filenames.",
      },
      {
        title: "Transparent-free by design",
        text: "Pages are rendered on white, matching how the document actually looks, rather than transparent where the page is blank.",
      },
    ],
    steps: [
      {
        title: "Add the PDF",
        text: "Drop the file in. The page count appears immediately so you can judge how much you are exporting.",
      },
      {
        title: "Choose resolution",
        text: "150 DPI is the sweet spot for on-screen use. Only reach for 300 DPI when the image will be printed at full size.",
      },
      {
        title: "Limit the pages",
        text: "Leave the range blank for all pages, or type the handful you need.",
      },
      {
        title: "Download",
        text: "Save pages individually, or take the whole set as a ZIP.",
      },
    ],
    limits: [
      {
        title: "PNG files are large",
        text: "A 300 DPI A4 page is 2480 × 3508 pixels and can run to several megabytes. For photographic pages, JPG output is far smaller for the same visual result.",
      },
      {
        title: "The output is an image, not text",
        text: "Nobody can select or search the words in a PNG. If you need the text, use PDF to TXT; if you need a printable document, keep the PDF.",
      },
      {
        title: "Very high DPI needs memory",
        text: "600 DPI on a long document can exhaust a phone's memory. The tool renders page by page, but the finished ZIP still has to fit.",
      },
      {
        title: "Annotations from a viewer are included",
        text: "Whatever the PDF shows is what gets rendered: comments, form field values and sticky-note icons appear in the image. If you need a clean page, remove the marks before exporting rather than editing the PNG afterwards.",
      },
    ],
    tips: [
      {
        title: "PNG for charts, JPG for photos",
        text: "If a page is a photo or a scan, JPG gives a tenth of the size for a difference nobody can see. If it is text, a table or a line chart, PNG keeps the edges hard.",
      },
      {
        title: "150 DPI covers most requests",
        text: "A 150 DPI page is 1240 × 1754 pixels — enough for a slide, a website figure or a chat thumbnail. Doubling to 300 DPI quadruples the file size for no visible gain on screen.",
      },
      {
        title: "Export only the cover for a preview",
        text: "When you need a thumbnail for a link, export page 1 at 72 DPI. It takes a second and the result is small enough to email.",
      },
      {
        title: "Match the exported width to where it will be used",
        text: "A page exported at 150 DPI is about 1240 pixels wide, which fits a blog article column exactly. Exporting at 300 DPI for the same slot gives you a file four times the size that the browser then throws pixels away from.",
      },
    ],
    faqs: [
      {
        q: "Is PNG or JPG better for a PDF page?",
        a: "PNG for anything with text, tables or flat colour, because it is lossless and keeps edges crisp. JPG for photographed or scanned pages, because it compresses those far better. The PDF to JPG page uses the same engine.",
      },
      {
        q: "What resolution should I choose?",
        a: "72 DPI for previews, 150 DPI for screens and documents, 300 DPI for print. Above 300 DPI you gain nothing unless the page will be enlarged.",
      },
      {
        q: "Can I convert just one page?",
        a: "Yes. Type that page number in the range box. It is faster than converting everything, and it avoids downloading 79 files you will delete.",
      },
      {
        q: "Why is page 3 blank in my export?",
        a: "Usually because the page really is blank, or because it contains only form fields that were never filled in. Compare with the PDF opened in a viewer before assuming the converter failed.",
      },
      {
        q: "Do the images keep the page's transparency?",
        a: "Pages are rendered on a white background, which is how the document looks. A page with no content comes out white rather than transparent.",
      },
      {
        q: "Is the PDF uploaded while converting?",
        a: "No — the file is parsed and rasterised inside the tab by the bundled PDF engine, so nothing leaves your device.",
      },
      {
        q: "Why is the PNG bigger than the PDF it came from?",
        a: "Because a vector page becomes pixels. A one-page text contract can be 60 KB as a PDF and several megabytes as a 300 DPI PNG, since the image must describe every dot on the sheet. That is normal, and it is the main reason to choose JPG output for photographic pages.",
      },
    ],
    related: ["pdf-to-jpg", "pdf-to-webp", "pdf-to-txt"],
    inputFormats: ["PDF"],
    outputFormats: ["PNG"],
    keywords: ["pdf to png", "convert pdf to png", "pdf page to image", "pdf to png high quality"],
    phase: 2,
    updated: "2026-10-27",
  },
  {
    slug: "pdf-to-webp",
    name: "PDF to WebP",
    shortName: "PDF to WebP",
    category: "pdf-tools",
    group: "extract",
    widget: "pdf-to-image",
    icon: "Zap",
    preset: { outputFormat: "image/webp" },
    tagline: "Export PDF pages as WebP — the smallest page images for a website.",
    bestFor: "Page previews on a site where image weight is the difference between fast and slow.",
    seoTitle: "PDF to WebP — Small Page Images for the Web",
    metaDescription:
      "Convert PDF pages to WebP images in your browser. Smaller than JPG at the same quality, batch export as a ZIP. No upload, no account.",
    h1: "PDF to WebP — Convert Pages for a Fast Website",
    intro: [
      "WebP typically beats JPG by 25–35% at matched quality, which makes it the pragmatic choice for page previews, document thumbnails and a catalogue of downloadable PDFs.",
      "This page renders each page at the resolution you choose and exports WebP files, individually or as a ZIP.",
    ],
    bullets: [
      {
        title: "Smaller than JPG, same look",
        text: "At quality 80 a rendered page is usually a third smaller than the equivalent JPEG, with no visible difference at reading size.",
      },
      {
        title: "Every current browser reads it",
        text: "Chrome, Edge, Firefox and Safari 14+ all display WebP, so a page preview will not break for visitors.",
      },
      {
        title: "Resolution control",
        text: "Generate 600 px thumbnails for a listing grid or full 150 DPI pages for a document viewer — the same tool, different numbers.",
      },
      {
        title: "Batch with numbered filenames",
        text: "Twenty pages become page-01.webp through page-20.webp inside a ZIP, ready to drop into a project.",
      },
      {
        title: "A clear error if the browser cannot write WebP",
        text: "A few older engines silently return PNG when asked for WebP. This tool checks the actual output and tells you rather than mislabelling the file.",
      },
    ],
    steps: [
      {
        title: "Add the PDF",
        text: "Drop it in and note the page count that appears.",
      },
      {
        title: "Set the resolution",
        text: "For web previews, 96–120 DPI is plenty. Choose 150 DPI when the image will be viewed full-screen.",
      },
      {
        title: "Set quality",
        text: "80 is the usual web sweet spot; 90 for detail-heavy pages, 70 when weight matters more than nuance.",
      },
      {
        title: "Download the set",
        text: "Take single pages or the whole ZIP. Filenames are numbered so they sort correctly.",
      },
    ],
    limits: [
      {
        title: "Not every engine writes WebP",
        text: "Safari 14 and later support it, but some embedded webviews and older Android browsers do not. If encoding is unavailable the tool says so instead of producing a PNG with a .webp extension.",
      },
      {
        title: "No animated output",
        text: "Each page is a still image. Animated WebP is a different feature and is not produced here.",
      },
      {
        title: "Text-heavy pages are not ideal",
        text: "WebP is good at photographs. For a page of small type, PNG is still sharper per byte — WebP wins on weight, not on edge crispness at low quality settings.",
      },
      {
        title: "No transparency, and no alpha from the page",
        text: "Pages render on white. A PDF that appears transparent in an editor still produces an opaque WebP, because the page itself has a white media box behind everything drawn on it.",
      },
    ],
    tips: [
      {
        title: "Generate two sizes",
        text: "Export a 600 px set for listing grids and a 150 DPI set for the detail view. Serving one oversized image to both is the most common cause of slow document pages.",
      },
      {
        title: "Keep filenames meaningful",
        text: "Renaming page-01.webp to invoice-2026-01.webp helps your search results and your own sanity three months later.",
      },
      {
        title: "Check the result in the browser",
        text: "Open a couple of exports before uploading a batch — a page that contains only a scanned image can come out softer than expected at quality 70.",
      },
      {
        title: "Test one page before exporting forty",
        text: "Quality settings interact with content: a page of dense serif text can look soft at 70 while a photograph is fine. Export page one, look at it at 100%, then commit to the batch with a setting you have actually seen.",
      },
      {
        title: "Set explicit pixel sizes for a design system",
        text: "If your site uses 320, 640 and 1024 pixel previews, export three sets at DPI values that land near those widths. Browsers will not save you: serving a 1500-pixel image into a 320-pixel grid costs every visitor the difference.",
      },
    ],
    faqs: [
      {
        q: "Is WebP smaller than JPG for PDF pages?",
        a: "Usually yes, by roughly a quarter to a third at comparable quality. The gap is largest on photographic pages and smallest on pages of dense small text, where PNG can still be the better trade.",
      },
      {
        q: "Which browsers support WebP?",
        a: "Chrome, Edge, Firefox, Opera and Safari 14 or later — effectively everything in current use. Older Safari versions and some in-app browsers cannot display it, which matters if your audience is on old iPhones.",
      },
      {
        q: "What happens if my browser cannot create WebP?",
        a: "You get a clear message instead of a mislabelled file: the tool checks the MIME type of what the browser produced. Safari on iOS 13, for example, would be refused rather than silently saving a PNG.",
      },
      {
        q: "Can I choose which pages to convert?",
        a: "Yes. Leave the range blank for the whole document, or type something like 1-2, 9 to export just those pages.",
      },
      {
        q: "Does the conversion need a network connection?",
        a: "No. After the page loads, rendering and encoding happen locally. The ZIP download is generated in the browser too.",
      },
      {
        q: "Can I get a single long image instead of one per page?",
        a: "No — each page becomes its own file. Stitching pages into a tall strip is a different job and is not something this tool does.",
      },
      {
        q: "Do I need to convert to JPG first?",
        a: "No. The renderer produces pixel data and encodes it directly to WebP in one step, so a JPG intermediate would only add a second generation of compression. Pick the DPI and quality here and the output goes straight from the PDF page to the WebP file.",
      },
    ],
    related: ["pdf-to-png", "pdf-to-jpg", "image-converter"],
    inputFormats: ["PDF"],
    outputFormats: ["WebP"],
    keywords: ["pdf to webp", "convert pdf to webp", "pdf page to webp", "webp page image"],
    isNew: true,
    phase: 2,
    updated: "2026-10-27",
  },
  {
    slug: "pdf-to-txt",
    name: "PDF to TXT",
    shortName: "PDF to TXT",
    category: "pdf-tools",
    group: "extract",
    widget: "pdf-to-text",
    icon: "FileType2",
    tagline: "Pull the actual words out of a PDF as plain text you can paste anywhere.",
    bestFor: "You need the text of a report in a notes app, a spreadsheet or a translation tool.",
    seoTitle: "PDF to TXT — Extract the Text Layer Free",
    metaDescription:
      "Extract text from a PDF in your browser. Choose pages, keep or drop page markers, copy it or download a .txt file. No upload, no account.",
    h1: "PDF to TXT — Copy the Text Out of a PDF",
    intro: [
      "A PDF stores glyphs at coordinates, not paragraphs, so copying text out of one is genuinely lossy: line breaks appear where the layout broke, not where the sentence did. This tool rebuilds readable lines by grouping characters that sit on the same baseline, then hands you plain text.",
      "It reads the text layer only. If the file is a scan, there is nothing to read — and the tool says that plainly rather than giving you an empty file.",
    ],
    bullets: [
      {
        title: "Real text extraction, no OCR guessing",
        text: "The browser's PDF engine returns the actual character data stored in the file, which means no misread letters and no invented words.",
      },
      {
        title: "Lines rebuilt, not smashed together",
        text: "Text fragments are grouped by vertical position so a heading stays on its own line and a paragraph does not become one long run-on sentence.",
      },
      {
        title: "Optional page markers",
        text: "Switch on “--- Page 3 ---” separators when you need to cite a page, or leave them off for clean prose you intend to paste into an editor.",
      },
      {
        title: "Page ranges",
        text: "Extract the executive summary, not the appendices: type 1-4 and only those pages are read.",
      },
      {
        title: "Copy or download",
        text: "A preview box lets you copy the text directly, and the .txt download preserves it as UTF-8.",
      },
    ],
    steps: [
      {
        title: "Add the PDF",
        text: "Drop the file in. If it is a scan, the extraction will come back empty and tell you why.",
      },
      {
        title: "Choose pages and markers",
        text: "Blank page range means every page. Page markers help when you need to reference locations later.",
      },
      {
        title: "Extract",
        text: "The tool walks the pages, showing progress as it reads.",
      },
      {
        title: "Copy or save",
        text: "Copy straight to the clipboard, or download the .txt file for editing.",
      },
    ],
    limits: [
      {
        title: "Scans contain no text",
        text: "A photographed or scanned page is an image. Extracting from it returns nothing, because the characters were never stored. Recognise it with OCR PDF first, then extract the text from the searchable copy.",
      },
      {
        title: "Layout is not preserved",
        text: "Columns, tables and sidebars come out as a linear stream. A two-column academic paper will interleave its columns unless you extract page by page and check.",
      },
      {
        title: "Ligatures and unusual encodings can drop characters",
        text: "Fonts that map text through custom encodings occasionally produce missing or substituted characters. Always skim the preview before relying on the output.",
      },
      {
        title: "Hyphenation and ligatures travel as they are stored",
        text: "Words broken across lines by the original typesetter come out with the break intact, so “docu- ment” stays split. Replace “- ” with nothing in an editor and the text reads correctly — a small step, but one worth knowing about before you paste a quotation into a report.",
      },
    ],
    tips: [
      {
        title: "Test one page before extracting eighty",
        text: "The preview appears for the whole run, but reading page one first tells you whether the file has a usable text layer at all.",
      },
      {
        title: "Keep page markers for research",
        text: "When quoting a source, page numbers are what you need for a citation. Markers give you those without reopening the PDF.",
      },
      {
        title: "Clean the line breaks afterwards",
        text: "Every line in the PDF becomes a line in the text file. A quick find-and-replace of single newlines with spaces — in any editor — turns it into flowing paragraphs.",
      },
      {
        title: "Extract per chapter for long reports",
        text: "A 200-page extraction produces one enormous text file. Picking page ranges that match the chapters gives you files an editor can open instantly and search results you can reason about, rather than one wall of text with no structure.",
      },
    ],
    faqs: [
      {
        q: "Why did I get an empty file?",
        a: "The PDF has no text layer. Scans, photos and images exported as PDF all contain pictures of text, not text. The tool detects this case and explains it instead of saving an empty file.",
      },
      {
        q: "Can it read tables properly?",
        a: "Roughly. Cells come out as line-by-line text, so a simple table stays readable and a complex one loses its column alignment. If you need the structure preserved, converting to CSV from the original spreadsheet is a better route.",
      },
      {
        q: "Does it keep the original formatting?",
        a: "No — plain text has no formatting by definition. Bold, italics, colours and font sizes are dropped. What you get is the words in reading order, which is usually what a text file is for.",
      },
      {
        q: "Can I extract text from a password-protected PDF?",
        a: "Not while it is encrypted. Unlock it in a viewer where you know the password, save a copy, then extract from that copy.",
      },
      {
        q: "Is the text sent anywhere for processing?",
        a: "No. The PDF engine runs in the tab and the text never leaves it. Nothing is logged, stored or transmitted.",
      },
      {
        q: "Can it read a scan?",
        a: "Not directly — there are no characters in a scan to extract. The OCR PDF tool recognises the words first and writes a searchable copy; extracting text from that copy works normally. This page keeps saying plainly when a file has no text layer.",
      },
      {
        q: "Does the text keep the original line breaks?",
        a: "It keeps the breaks the PDF actually contains. Text that was typeset as separate lines stays separate; a paragraph that flowed across several lines comes back as several lines, because there is no paragraph marker in the file to recover. Most editors clean that up in one find-and-replace.",
      },
    ],
    related: ["pdf-to-png", "txt-to-pdf", "pdf-to-jpg"],
    inputFormats: ["PDF"],
    outputFormats: ["TXT"],
    keywords: ["pdf to txt", "pdf to text", "extract text from pdf", "copy text from pdf"],
    isNew: true,
    phase: 2,
    updated: "2026-10-27",
  },
  {
    slug: "scan-to-pdf",
    name: "Scan to PDF",
    shortName: "Scan to PDF",
    category: "pdf-tools",
    group: "create",
    widget: "scan-to-pdf",
    icon: "Camera",
    tagline: "Use your phone camera as a scanner and get a PDF — nothing is uploaded.",
    bestFor: "A paper form has to be signed today and there is no scanner nearby.",
    seoTitle: "Scan to PDF — Phone Camera Scanner, No App",
    metaDescription:
      "Scan documents with your phone camera and turn the photos into one PDF in your browser. A4 or Letter, margins, reorder. No upload, no app.",
    h1: "Scan to PDF — Turn Phone Photos Into a Document",
    intro: [
      "Open the camera, photograph the pages, and build a PDF in the same tab. There is no app to install and no account: the video frames are captured directly into the page and the PDF is written locally.",
      "Cameras only open on secure origins (https) and after you grant permission, so the file picker stays available as a fallback — including for photos you already took.",
    ],
    bullets: [
      {
        title: "Rear camera, held portrait or landscape",
        text: "The stream requests the environment-facing camera at up to 2560 px wide, so a page fills the frame and the text stays legible.",
      },
      {
        title: "Shoot as many pages as you need",
        text: "Capture, keep shooting, delete a bad frame, then build the document — the count is on the button the whole time.",
      },
      {
        title: "A4, Letter or fit-to-photo",
        text: "A4 with a small margin looks like a real scanned document; fit-to-photo keeps the camera frame exactly, which is better for receipts.",
      },
      {
        title: "Photos embed as photos",
        text: "Each capture is a JPEG embedded directly in the PDF, so the document is no larger than the photos it contains.",
      },
      {
        title: "Session-only by design",
        text: "Frames are held in memory as object URLs, the camera stops when you press Done, and everything is released when you close the tab.",
      },
    ],
    steps: [
      {
        title: "Open the camera",
        text: "Grant permission when the browser asks. If the camera is blocked, use “Add photos instead” and pick existing shots.",
      },
      {
        title: "Capture each page",
        text: "Fill the frame, keep the phone parallel to the page, and press Capture. Repeat for every sheet.",
      },
      {
        title: "Review and remove",
        text: "Thumbnails appear in capture order. Delete blurry or accidental frames before building the document.",
      },
      {
        title: "Build the PDF",
        text: "Choose the page size and margin, then press Create PDF and download the file.",
      },
    ],
    limits: [
      {
        title: "No OCR, no automatic cropping",
        text: "Pages are not straightened, de-skewed or turned into searchable text. You get your photograph on an A4 page — good for reading and printing, not a text extraction.",
      },
      {
        title: "The camera needs https and permission",
        text: "Browsers refuse camera access on plain http, in some embedded webviews and after a permission denial. The file picker exists precisely for those cases.",
      },
      {
        title: "Quality is your phone's camera",
        text: "There is no enhancement pass. Even lighting and a steady hand beat any post-processing this tool could apply.",
      },
      {
        title: "Nothing is straightened or cleaned up",
        text: "Scans are not de-skewed, cropped to the page edge or contrast-corrected. A tilted page stays tilted. Holding the phone parallel and filling the frame with the sheet is the entire technique, and it beats any automatic fix this tool could apply.",
      },
    ],
    tips: [
      {
        title: "Daylight beats flash",
        text: "Put the page near a window and shoot from above with the shadow out of frame. Flash creates a bright hotspot that can wash out half the page.",
      },
      {
        title: "One page per shot, not two",
        text: "Two pages in one frame halves the resolution per page. If you must, use fit-to-photo so nothing gets cropped away.",
      },
      {
        title: "Check the first capture",
        text: "Look at the thumbnail before shooting the other nine pages. If the text is soft, moving closer fixes the whole batch.",
      },
      {
        title: "Shoot in the order you want them read",
        text: "Captures are added to the document in the order you take them. Shooting page 3 before page 2 means fixing it by deleting and re-shooting, because reordering captures is not supported — so start at page one and work forwards.",
      },
    ],
    faqs: [
      {
        q: "Does this use my camera without asking?",
        a: "No. The browser shows its own permission prompt the first time, and the camera is only opened when you press the button. Nothing records until you press Capture, and the stream stops as soon as you press Done.",
      },
      {
        q: "Can I use photos I already took?",
        a: "Yes. “Add photos instead” opens the file picker and accepts any image your browser can decode, including HEIC on Safari and Android.",
      },
      {
        q: "Is the scan searchable?",
        a: "Not from this tool: the words stay pixels, because pages are embedded as images. Run the result through OCR PDF to add a text layer — that is a separate recognition step, and it is honest about its accuracy.",
      },
      {
        q: "Why is the camera button not working on my desktop?",
        a: "Desktop webcams are usually too far away to scan a page, but the same permission rules apply: https, a granted prompt, and no other app holding the camera. Use the file picker on desktop and the camera on a phone.",
      },
      {
        q: "Can I mix camera shots and existing photos?",
        a: "Yes. Capture some pages, stop the camera, then add photos from the library. The document keeps the order in which you added them.",
      },
      {
        q: "Where do my scans go when I close the tab?",
        a: "They are gone. Frames live in memory only, the camera stream is closed, and no copy exists anywhere else — there is no server involved at any point.",
      },
      {
        q: "Can I scan a multi-page document in one pass?",
        a: "Only by capturing each sheet separately — there is no automatic page detection. The flow is built for that: keep the camera open, capture a page, swap the sheet, capture again. Ten sheets take about a minute, and a mistake can be deleted from the strip before you build the PDF.",
      },
    ],
    related: ["image-to-pdf", "jpg-to-pdf", "remove-pages-from-pdf"],
    inputFormats: ["Camera", "JPG", "PNG", "HEIC"],
    outputFormats: ["PDF"],
    keywords: ["scan to pdf", "phone scanner", "camera to pdf", "scan document with phone"],
    isNew: true,
    phase: 2,
    updated: "2026-10-27",
  },
  {
    slug: "powerpoint-to-pdf",
    name: "PowerPoint to PDF",
    shortName: "PPT to PDF",
    category: "pdf-tools",
    group: "create",
    widget: "pptx-to-pdf",
    icon: "Presentation",
    tagline: "Turn a .pptx deck into one PDF page per slide, text and pictures included.",
    bestFor: "You need to send slides to somebody who does not have PowerPoint, or to keep a fixed copy of a deck.",
    seoTitle: "PowerPoint to PDF — Convert a .pptx File",
    metaDescription:
      "Convert a PowerPoint .pptx file into a PDF in your browser: one page per slide at the deck's own size, text and images included. No upload, no account.",
    h1: "PowerPoint to PDF — Convert a .pptx File in Your Browser",
    intro: [
      "Drop a .pptx in and get a PDF with one page per slide, at the presentation's own slide size (16:9, 4:3 or a custom canvas). Text stays selectable, pictures are embedded at their transformed position, and solid fills come through as real shapes rather than a screenshot.",
      "A .pptx is a ZIP of XML, so everything can be read in the tab. Nothing is uploaded, and no PowerPoint, LibreOffice or Office 365 is involved — which also means the result is a faithful reconstruction rather than a pixel-perfect render.",
      "That difference shows up in the corners of a slide: gradients, shadows, 3-D effects, charts, SmartArt, animations and video cannot be reproduced. If a deck leans on those, check the PDF page by page before you send it.",
    ],
    bullets: [
      {
        title: "One page per slide",
        text: "The page size follows the deck's own slide size, so a 13.33 × 7.5 inch widescreen deck becomes a 960 × 540 pt PDF page with no letterboxing.",
      },
      {
        title: "Selectable text",
        text: "Slide text is written as real text with wrapping, bullets, alignment, bold and colour — not flattened into an image of a slide.",
      },
      {
        title: "Pictures embedded",
        text: "PNG and JPEG images are read out of the .pptx and placed at their slide position and size, including inside grouped shapes.",
      },
      {
        title: "Template geometry resolved",
        text: "Decks built from a template store almost no coordinates on the slides themselves, so inherited positions are read from the slide layout and the master and text lands where it belongs.",
      },
      {
        title: "Shapes and backgrounds",
        text: "Solid-filled shapes, outlines and slide background colours are drawn as vector shapes, so the deck keeps its colour scheme.",
      },
      {
        title: "Honest conversion report",
        text: "Before converting, the page lists what it found — slide count, size, shape count — and warns about tables or images it had to approximate or skip.",
      },
    ],
    steps: [
      {
        title: "Drop the .pptx",
        text: "PowerPoint 2007 or later, up to 150 MB. Legacy .ppt files (1997–2003) are a different format and must be re-saved as .pptx first.",
      },
      {
        title: "Read what was found",
        text: "The summary confirms the slide count, the page size and any tables that will be flattened to text before you commit.",
      },
      {
        title: "Convert",
        text: "Each slide is parsed and drawn onto a matching PDF page: backgrounds first, then shapes, then pictures, then text.",
      },
      {
        title: "Check the deck",
        text: "Open the PDF and flip through every slide. Anything relying on animation, a chart or SmartArt will look different, and this is the moment to notice.",
      },
    ],
    limits: [
      {
        title: "No animations, transitions or video",
        text: "A PDF has one static page per slide. Builds, transitions, auto-advance and embedded video are gone — that is a property of the format, not a shortcut taken here.",
      },
      {
        title: "Charts and SmartArt are not drawn",
        text: "A chart is a link to an embedded workbook with drawing instructions; SmartArt is a layout algorithm. Neither is reproduced, so allow a blank area on those slides.",
      },
      {
        title: "Tables flatten to text",
        text: "Table cells become aligned text rows inside the table's box. The values stay readable and selectable, but the cell borders and alignment are approximations.",
      },
      {
        title: "Gradients and effects are simplified",
        text: "Solid fills come through exactly. Gradients, shadows, glow, bevels, reflections and 3-D rotation are drawn flat or skipped.",
      },
      {
        title: "Fonts are substituted",
        text: "Text uses the standard PDF fonts, or the bundled DejaVu Sans when a character needs it. A deck set in a licensed corporate typeface will not carry that typeface unless it is available.",
      },
      {
        title: "Speaker notes are not included",
        text: "Only what is on the slide goes into the PDF. Notes, handouts and hidden slides are outside the output.",
      },
    ],
    tips: [
      {
        title: "Flatten complex slides first",
        text: "If one slide is a chart, export that slide as a PNG from PowerPoint and drop the picture in. It costs a minute and keeps the deck honest.",
      },
      {
        title: "Check the master, not just the slides",
        text: "Logos and rules usually live on the slide master. If they are set as a gradient or a group of images, check the first page of the result carefully.",
      },
      {
        title: "Use it as a preview, not an archive",
        text: "For a printable handout, this conversion is fine. For an archive of the deck, export a PDF from PowerPoint itself and compare the two.",
      },
      {
        title: "Re-save old decks first",
        text: "If the file is a .ppt, open it in PowerPoint or Impress and save a .pptx copy. Converting from an old format is not supported and the tool will say so.",
      },
    ],
    faqs: [
      {
        q: "Will the PDF look exactly like my slides?",
        a: "For text, pictures, solid shapes and backgrounds, yes in position and content. Effects such as gradients, shadows, charts and SmartArt are simplified or skipped, so a design-heavy deck will differ.",
      },
      {
        q: "Can it convert .ppt files?",
        a: "No. The pre-2007 binary format is a different container. Open it in PowerPoint, LibreOffice Impress or Keynote and save a .pptx, then convert that.",
      },
      {
        q: "Are animations kept?",
        a: "There is nowhere to keep them. A PDF page is static; builds, transitions and video cannot survive the format. The result is the final state of each slide.",
      },
      {
        q: "Is the text selectable in the PDF?",
        a: "Yes. Slide text is drawn as real text, so search, selection and copying work. It is not a picture of the slide.",
      },
      {
        q: "What page size does the PDF get?",
        a: "Exactly the deck's slide size. A 16:9 deck becomes 960 × 540 points, a 4:3 deck 720 × 540, and a custom canvas keeps its own measurements.",
      },
      {
        q: "Are speaker notes included?",
        a: "No. Only the visible slide content is converted. Notes live in a separate part of the file and are deliberately left out, because notes written for the presenter are usually not for the audience.",
      },
      {
        q: "Is my presentation uploaded?",
        a: "No. The .pptx is unzipped and parsed in the tab and the PDF is built there too. Nothing is sent to a server, which is why it also works offline.",
      },
    ],
    related: ["word-to-pdf", "pdf-to-png", "jpg-to-pdf"],
    inputFormats: ["PPTX"],
    outputFormats: ["PDF"],
    keywords: ["powerpoint to pdf", "pptx to pdf", "ppt to pdf", "convert slides to pdf", "presentation to pdf"],
    isNew: true,
    phase: 6,
    updated: "2026-10-30",
  },
];
