import type { Tool } from "@/lib/tool-types";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  TOOL REGISTRY
 *  Every tool page, home-page card, mega-menu entry, category listing,
 *  sitemap URL, breadcrumb and JSON-LD block is generated from this array.
 *  To add a tool: append an entry here and map its `widget` key to a client
 *  component in components/tools/ToolWidgets.tsx.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const tools: Tool[] = [
  {
    slug: "compress-pdf",
    name: "Compress PDF",
    shortName: "Compress PDF",
    category: "pdf-tools",
    widget: "compress-pdf",
    icon: "Minimize2",
    tagline: "Shrink a PDF for email, upload limits and forms — with a real before/after size.",
    bestFor: "You need to email a 12 MB scan or squeeze a document under a 2 MB upload limit.",
    seoTitle: "Compress PDF Free — Shrink a PDF in Your Browser",
    metaDescription:
      "Shrink PDF files free in your browser. Keep text selectable or rasterise to hit a target size. No upload, no sign-up, no watermark.",
    h1: "Free PDF Compressor — Shrink a PDF Without Uploading It",
    intro: [
      "Pick a compression level, see the exact size before and after, and download the smaller file. Text-heavy documents stay sharp on the two lossless-friendly levels; scanned documents can be rasterised to hit a specific size such as 200 KB or 2 MB.",
      "The file is read from your device, compressed on your device and saved back to your device. Nothing is uploaded, so you can use it on payslips, medical letters and client contracts without thinking twice.",
    ],
    bullets: [
      {
        title: "Three levels with honest trade-offs",
        text: "Light and Recommended rebuild the PDF structure and strip unused metadata while keeping text selectable. Strong re-renders each page as an image, which shrinks scans the most but makes text unselectable.",
      },
      {
        title: "Compress to a target size",
        text: "Presets for 200 KB, 500 KB, 1 MB and 2 MB, plus a custom value. The compressor lowers resolution and JPEG quality step by step until the result fits — or tells you plainly that it could not.",
      },
      {
        title: "Real numbers, not guesswork",
        text: "Every finished file shows its original size, new size and percentage saved. If compression makes a file bigger, the tool says so instead of handing you a worse file.",
      },
      {
        title: "Batch processing with a ZIP download",
        text: "Add several PDFs at once, compress them in sequence and download everything as one ZIP, or grab files individually.",
      },
      {
        title: "Password-aware, not password-breaking",
        text: "If a PDF is encrypted with the owner password, the page says so. This tool never removes protection from files you cannot open yourself.",
      },
      {
        title: "Zero upload, zero account",
        text: "No sign-up, no daily quota and no watermark. Your browser does the work, and you can watch the Network tab to confirm no file data is sent anywhere.",
      },
    ],
    steps: [
      {
        title: "Add your PDF",
        text: "Drag a file onto the dropzone, click to browse, or paste a PDF copied from your file manager. Files up to about 100 MB work on a desktop; on a phone, stay under 25 MB for smooth results.",
      },
      {
        title: "Choose a level or a target size",
        text: "Recommended suits most documents. Choose Strong for scans, or pick a preset such as 500 KB when an upload form has a hard limit.",
      },
      {
        title: "Compress and check the numbers",
        text: "Press Compress PDF. The result card shows the old and new size plus the percentage saved, so you can judge quality by opening the file before you send it.",
      },
      {
        title: "Download or start over",
        text: "Download the compressed file, download all results as a ZIP, or press Process another file. Object URLs are released as soon as you leave the page.",
      },
    ],
    limits: [
      {
        title: "Light and Recommended cannot recompress embedded images",
        text: "A browser has no safe way to re-encode every image already inside a PDF without risking broken pages. Those levels therefore save a modest amount (often 2–10%) by rewriting the file structure and removing metadata and unused objects.",
      },
      {
        title: "Strong rasterises pages",
        text: "Pages become JPEG images, so text is no longer selectable or searchable and links and form fields disappear. That is the honest cost of the smallest files.",
      },
      {
        title: "Some files cannot get smaller",
        text: "A PDF that is already optimised, or one built mostly of vector text, may grow when rasterised at a high resolution. The tool warns you and lets you keep the original.",
      },
      {
        title: "Encrypted files need their password first",
        text: "Files locked with a password you do not have cannot be opened in the browser, so they cannot be compressed. Unlock them in a viewer you have the password for, then compress the copy.",
      },
    ],
    tips: [
      {
        title: "Email attachments: aim for 10 MB",
        text: "Gmail, Outlook and most corporate mail servers reject anything over 20–25 MB. Compressing to 10 MB leaves room for the rest of the thread and avoids the recipient's server silently dropping the message.",
      },
      {
        title: "Job and visa portals: 2 MB is the usual ceiling",
        text: "Many applicant tracking systems cap uploads at 2 MB and do not always say so clearly. Compress your CV to 2 MB before the deadline, not during it.",
      },
      {
        title: "Photo-heavy scans: use Strong at 150 DPI",
        text: "A 300 DPI scan of a 20-page contract is often 30 MB. Rasterising at 150 DPI usually lands under 4 MB while remaining readable on screen and acceptable on a home printer.",
      },
      {
        title: "Check one page before sending ten",
        text: "Open the compressed file and zoom into small print and signatures. If they are mushy, re-run at a gentler level rather than sending a document that cannot be read.",
      },
    ],
    faqs: [
      {
        q: "Is this PDF compressor really free?",
        a: "Yes. There is no paywall, no file limit per day, no account and no watermark. The tool runs in your browser, so there is no server bill to pass on to you.",
      },
      {
        q: "Are my files uploaded to a server?",
        a: "No. The PDF is read with the File API, processed in your browser tab and never sent over the network. You can verify this in your browser's Network tab while the tool runs.",
      },
      {
        q: "How much smaller will my PDF get?",
        a: "It depends entirely on what is inside. Scanned documents with big images often shrink 60–90% with Strong. Text-only PDFs generated by Word or LaTeX are already efficient and typically shrink 2–10% on Light or Recommended.",
      },
      {
        q: "Why is my text no longer selectable after compressing?",
        a: "You used the Strong level, which converts each page into an image. Use Light or Recommended when you need to keep text selectable, or keep the original alongside the compressed copy.",
      },
      {
        q: "Can you compress a password-protected PDF?",
        a: "Only if you know the password and the file allows opening. This tool does not crack or remove unknown passwords, and it will tell you when a file is encrypted instead of failing silently.",
      },
      {
        q: "Does compressing remove metadata like the author name?",
        a: "Yes. Light and Recommended rebuild the document and drop most document-information metadata, which is usually what you want before sharing a file externally.",
      },
      {
        q: "What is the largest file I can compress?",
        a: "There is no hard limit in the code, but browser memory is the real ceiling. Files under 25 MB are comfortable on a mid-range phone; 100 MB and above are best on a desktop with 8 GB of RAM or more.",
      },
      {
        q: "Can I compress several PDFs at once?",
        a: "Yes. Add multiple files to the same dropzone. They are processed one at a time to keep the page responsive, then offered individually or as a single ZIP download.",
      },
    ],
    related: ["image-to-pdf", "image-converter", "jpg-to-png"],
    inputFormats: ["PDF"],
    outputFormats: ["PDF"],
    keywords: ["reduce pdf size", "shrink pdf", "pdf compressor", "compress pdf to 200kb", "make pdf smaller"],
    popular: true,
    phase: 1,
    updated: "2026-10-27",
  },
  {
    slug: "image-to-pdf",
    name: "Image to PDF",
    shortName: "Image to PDF",
    category: "convert-to-pdf",
    widget: "image-to-pdf",
    icon: "Images",
    tagline: "Turn JPG, PNG, WebP, HEIC and more into one tidy PDF with real page sizes.",
    bestFor: "You photographed documents, receipts or ID pages and need a single PDF to send.",
    seoTitle: "Image to PDF Free — JPG, PNG & HEIC Converter",
    metaDescription:
      "Convert JPG, PNG, WebP, HEIC, GIF or BMP images into one PDF in your browser. Choose A4, Letter or fit-to-image, set margins and order. No upload.",
    h1: "Free Image to PDF Converter — One PDF From Many Photos",
    intro: [
      "Drop in one photo or forty, reorder them, choose a page size and download a single multi-page PDF. Page size, orientation, margins and image quality are all under your control, and every image is embedded losslessly unless you ask otherwise.",
      "HEIC photos straight from an iPhone work too: they are decoded on your device, so holiday photos and scanned passports never touch a server.",
    ],
    bullets: [
      {
        title: "Real page sizes, not stretched canvases",
        text: "Choose A4, US Letter, A5, A3 or 'fit to image', portrait or landscape, with margins from 0 to 40 mm. Images are scaled to fit and centred, never distorted.",
      },
      {
        title: "HEIC and WebP included",
        text: "iPhone HEIC, WebP, GIF and BMP are decoded locally and re-embedded as PNG or JPEG, so the PDF opens correctly in Acrobat, Preview and every phone viewer.",
      },
      {
        title: "Drag to reorder pages",
        text: "The file list is the page order. Drag thumbnails into place before converting, so a scanned document reads front to back the first time.",
      },
      {
        title: "Lossless by default, smaller on request",
        text: "Photos are embedded without re-compression. Turn on 'smaller file' to convert them to JPEG at a chosen quality when you need a lighter attachment.",
      },
      {
        title: "Batch convert and ZIP",
        text: "Every PDF you build in a session is listed with its size and a download button; grab them all as a ZIP when you have several documents to send.",
      },
      {
        title: "No upload, no watermark, no limit",
        text: "The conversion happens with pdf-lib in your browser. There is no server copy, no account and no mark on the finished pages.",
      },
    ],
    steps: [
      {
        title: "Add your images",
        text: "Drag them in, click to browse, or paste from the clipboard. JPG, PNG, WebP, GIF, BMP and HEIC files are accepted; each one becomes a page.",
      },
      {
        title: "Set the order and options",
        text: "Reorder thumbnails by dragging, delete anything you added by mistake, then pick page size, orientation, margin and image quality.",
      },
      {
        title: "Convert",
        text: "Press Create PDF. The tool reports how many pages were written and the final file size as soon as it is ready.",
      },
      {
        title: "Download and check a page",
        text: "Download the PDF and flip through it once in your viewer. For scanned documents, confirm the smallest text is still readable at the margin you chose.",
      },
    ],
    limits: [
      {
        title: "No OCR — images stay images",
        text: "The PDF contains pictures of your pages, not recognised text. It will not be searchable, and a text-based tool cannot edit it without OCR.",
      },
      {
        title: "HEIC decoding adds a second",
        text: "iPhone HEIC files are converted through a WebAssembly decoder. Large HEIC batches take noticeably longer than JPEG batches; the progress bar shows what is happening.",
      },
      {
        title: "Very large images are resized",
        text: "Images above about 4000 px on the long edge are scaled down to keep the PDF openable on phones. For print-quality output, use smaller batches at full resolution.",
      },
      {
        title: "No automatic rotation or straightening",
        text: "Photos are placed exactly as they are. If a page is sideways, rotate the source image first — a designer-quality auto-deskew pass is not something a browser can do reliably.",
      },
    ],
    tips: [
      {
        title: "Scan documents with your phone camera",
        text: "Shoot in good light with the phone parallel to the page, then crop with a phone editor. Convert at A4 with a 10 mm margin for a file that looks like a scan rather than a snapshot.",
      },
      {
        title: "'Fit to image' is best for receipts and screenshots",
        text: "A fixed page size adds white borders around a tall receipt or a wide screenshot. Fit-to-image keeps the page exactly the shape of the picture.",
      },
      {
        title: "Keep the order right for paperwork",
        text: "Portals usually expect pages in reading order with the photo ID first. Reorder before converting — renaming files afterwards will not change the page order.",
      },
      {
        title: "Choose quality before size when printing",
        text: "Leave lossless embedding on for anything that will be printed. Use JPEG quality 80 only for emails where a 3 MB file needs to become 800 KB.",
      },
    ],
    faqs: [
      {
        q: "Does Image to PDF upload my photos?",
        a: "No. Everything is decoded and assembled in your browser with the pdf-lib library. Disconnect from the internet after the page loads and the tool still works.",
      },
      {
        q: "Can I convert iPhone HEIC photos to PDF?",
        a: "Yes. HEIC files are decoded in the browser with a WebAssembly decoder, then embedded into the PDF. If a particular HEIC file fails, export it as JPEG from the Photos app and try again.",
      },
      {
        q: "How many images can I put in one PDF?",
        a: "There is no fixed cap, but browser memory limits you in practice. Twenty phone photos of 3–4 MB each convert comfortably on a laptop; on a phone, keep it under ten.",
      },
      {
        q: "Will the images be stretched to fill the page?",
        a: "No. Images are scaled to fit inside the page and centred, with the aspect ratio preserved. A portrait photo on an A4 sheet leaves white space at the sides rather than warping.",
      },
      {
        q: "Does the PDF include a watermark or a page number?",
        a: "No watermark, ever. No page numbers are added either — adding numbers is a separate page-numbering tool so you can decide exactly what appears.",
      },
      {
        q: "Can I reduce the PDF size after converting?",
        a: "Yes. Turn on the 'smaller file' option before converting, or run the finished PDF through the PDF compressor to hit a specific target size.",
      },
      {
        q: "Are the images compressed when embedded?",
        a: "By default no: JPEG stays JPEG and PNG stays PNG, so quality is unchanged. The optional quality setting re-encodes images as JPEG and is the only lossy path.",
      },
      {
        q: "Does it work on iOS and Android?",
        a: "Yes. Safari on iOS and Chrome on Android both support the file pickers and the pdf-lib writer used here. On older phones, convert five images at a time for the smoothest experience.",
      },
    ],
    related: ["compress-pdf", "image-converter", "jpg-to-png"],
    inputFormats: ["JPG", "PNG", "WebP", "HEIC", "GIF", "BMP"],
    outputFormats: ["PDF"],
    keywords: ["jpg to pdf", "png to pdf", "heic to pdf", "photos to pdf", "image to pdf converter"],
    popular: true,
    phase: 1,
    updated: "2026-10-27",
  },
  {
    slug: "image-converter",
    name: "Image Converter",
    shortName: "Image Converter",
    category: "image-tools",
    widget: "image-converter",
    icon: "Repeat2",
    tagline: "Convert images between JPG, PNG, WebP, AVIF, BMP, TIFF, ICO and GIF in bulk.",
    bestFor: "A site rejects your PNG, your CMS wants WebP, or you need an app icon in ICO.",
    seoTitle: "Free Image Converter — JPG, PNG, WebP, AVIF, ICO",
    metaDescription:
      "Convert images between JPG, PNG, WebP, AVIF, BMP, TIFF, ICO and GIF in your browser. Batch conversion, quality slider, ZIP download. No upload.",
    h1: "Free Image Converter — Change Any Format in Your Browser",
    intro: [
      "Load one image or a hundred, pick a target format, adjust quality and download the results individually or as a ZIP. Transparency is preserved where the format supports it and flattened honestly where it does not.",
      "The conversion uses your browser's own image engine plus small local encoders for the formats browsers cannot write, so nothing is uploaded and there is no per-file limit other than your device's memory.",
    ],
    bullets: [
      {
        title: "One tool, eight output formats",
        text: "JPG, PNG, WebP, AVIF, BMP, TIFF, ICO and GIF from any image your browser can open, including HEIC from iPhones and SVG files.",
      },
      {
        title: "Batch conversion",
        text: "Convert a whole folder in one pass, watch per-file progress, then download every result as a single ZIP with sensible filenames.",
      },
      {
        title: "Quality you can see before downloading",
        text: "A 30–100 quality slider for lossy formats, applied on top of an optional resize. File sizes update as you change settings so you can trade quality against weight deliberately.",
      },
      {
        title: "Transparency handled honestly",
        text: "PNG, WebP, AVIF, TIFF and GIF keep transparency. JPG and BMP cannot, so transparent areas are filled with the background colour you choose — usually white.",
      },
      {
        title: "Metadata stripped by default",
        text: "Re-encoding through canvas drops EXIF, GPS coordinates and camera data. That is a privacy win, and the EXIF remover page covers the details.",
      },
      {
        title: "No upload, no watermark, no queue",
        text: "The whole pipeline runs on your device: no server, no account, no daily cap, and no logo stamped on your output.",
      },
    ],
    steps: [
      {
        title: "Add your images",
        text: "Drop files, browse, or paste from the clipboard. Common camera and phone formats are accepted, and unsupported files are listed with the reason instead of failing silently.",
      },
      {
        title: "Pick the output format",
        text: "Choose the target format for the batch, or leave it on 'keep original' to only resize or re-compress. JPG for photos, PNG for screenshots and logos, WebP for websites.",
      },
      {
        title: "Adjust quality and size",
        text: "Set the quality slider for lossy formats, optionally cap the longest edge, and check the estimated sizes in the file list.",
      },
      {
        title: "Convert and download",
        text: "Press Convert, then download files one by one or everything at once as a ZIP. Clear the list when you are done to release memory.",
      },
    ],
    limits: [
      {
        title: "AVIF encoding depends on your browser",
        text: "Chrome, Edge and Firefox can write AVIF; Safari can read it but currently cannot encode it. The tool detects this and tells you rather than producing a broken file.",
      },
      {
        title: "TIFF output is uncompressed",
        text: "Browsers have no TIFF encoder, so this tool writes a standard uncompressed RGB TIFF. It opens in Photoshop, Preview and GIMP, but the file will be larger than the source.",
      },
      {
        title: "GIF is single-frame with a limited palette",
        text: "Only the first frame of an animated GIF is kept and colours are reduced to a 216-colour palette. Use WebP or MP4 when you need animation.",
      },
      {
        title: "No CMYK or print profiles",
        text: "Canvas conversion is RGB only. For print work requiring CMYK or embedded ICC profiles, use a desktop application.",
      },
    ],
    tips: [
      {
        title: "WebP first for websites",
        text: "WebP at quality 80 is typically 25–35% smaller than an equivalent JPEG and supports transparency, so it is a safe default for a fast site.",
      },
      {
        title: "PNG for screenshots, JPG for photographs",
        text: "Text and flat UI compress badly as JPEG and pick up grey fringing. Photographs are the opposite: PNG makes them several times larger for no visual gain.",
      },
      {
        title: "ICO needs square images",
        text: "Favicon and app-icon formats expect square sources. Export at 256×256, 128×128, 64×64, 48×48, 32×32 and 16×16 and pick the ICO output for each.",
      },
      {
        title: "Convert before uploading to a CMS",
        text: "If your CMS resizes images itself, converting to WebP first means the version it stores is already small — and your page weight drops for every visitor.",
      },
    ],
    faqs: [
      {
        q: "Is converting images here private?",
        a: "Yes. Files are read locally with the File API and processed on the canvas in your tab. No image data is uploaded, and nothing is stored after you close the page.",
      },
      {
        q: "Which formats can I convert from?",
        a: "Anything your browser can decode: JPG, PNG, WebP, GIF, BMP, SVG, AVIF and, with the bundled decoder, HEIC. Unsupported files are reported with a clear reason.",
      },
      {
        q: "Why does my transparent PNG have a white background as JPG?",
        a: "JPEG has no alpha channel. Flat formats fill transparent pixels with the background colour you select — pick a colour other than white if the design needs it.",
      },
      {
        q: "Can I convert AVIF on Safari?",
        a: "Safari decodes AVIF but does not encode it, so AVIF output is unavailable there. WebP output works in Safari 14 and later, which is the usual substitute.",
      },
      {
        q: "Does converting remove EXIF data?",
        a: "Yes. Re-encoding through canvas discards EXIF, GPS location and most other embedded metadata, which is generally what you want before publishing a photo.",
      },
      {
        q: "Can I convert many files at once?",
        a: "Yes. Add a batch, set one output format for the group and download all results as a ZIP. Very large batches are limited by your device's memory, not by us.",
      },
      {
        q: "Does the conversion reduce image quality?",
        a: "PNG and BMP output are lossless. JPG, WebP and AVIF are lossy at any quality below 100, so keep those at 85–95 for archival copies and 70–80 for web delivery.",
      },
      {
        q: "Is there a file-size or daily limit?",
        a: "No daily limit and no account. Individual files up to roughly 50 MB work in most browsers; beyond that, memory on the device becomes the practical constraint.",
      },
    ],
    related: ["jpg-to-png", "image-to-pdf", "compress-pdf"],
    inputFormats: ["JPG", "PNG", "WebP", "HEIC", "AVIF", "GIF", "BMP", "SVG", "TIFF"],
    outputFormats: ["JPG", "PNG", "WebP", "AVIF", "GIF", "BMP", "TIFF", "ICO"],
    keywords: ["image converter", "png to jpg", "webp converter", "heic converter", "avif converter", "ico converter"],
    popular: true,
    phase: 1,
    updated: "2026-10-27",
  },
  {
    slug: "jpg-to-png",
    name: "JPG to PNG",
    shortName: "JPG to PNG",
    category: "image-tools",
    widget: "image-converter",
    icon: "FileImage",
    tagline: "Convert JPG photos and scans to lossless PNG without re-compressing them twice.",
    bestFor: "A printer or upload form only accepts PNG, and you want no further quality loss.",
    seoTitle: "Convert JPG to PNG Free — Lossless, No Upload",
    metaDescription:
      "Convert JPG images to PNG free in your browser. Lossless output, batch conversion and ZIP download. No upload, no sign-up, no watermark.",
    h1: "Free JPG to PNG Converter — Lossless, Private, No Upload",
    intro: [
      "This page converts JPG and JPEG files to PNG in your browser. The decoded pixels are written to a lossless PNG, so nothing new is lost in the second save — the only quality ceiling is the JPEG you started with.",
      "Everything happens on your device: no upload, no account, no watermark and no daily limit. Drop a batch in, convert, and take the results as a ZIP.",
    ],
    bullets: [
      {
        title: "No extra generation loss",
        text: "PNG is lossless, so the file you download keeps every pixel the JPEG contained. Convert a JPEG to PNG and back ten times and the image still matches.",
      },
      {
        title: "Batch JPG and JPEG in one go",
        text: "Drop several files or a whole folder. Mixed extensions are handled the same way, and each result keeps its original name with a .png extension.",
      },
      {
        title: "Optional resize while converting",
        text: "Cap the longest edge for a lighter upload, or leave it untouched to keep the original resolution exactly as it was.",
      },
      {
        title: "Transparency support where it exists",
        text: "JPEG has no alpha channel, so there is nothing to preserve from the source — but if you convert a transparent PNG into this pipeline, the alpha is written correctly.",
      },
      {
        title: "Metadata removed",
        text: "EXIF, GPS coordinates and camera model are not carried into the PNG. Useful when publishing photos of your home or your children.",
      },
      {
        title: "No upload, no sign-up",
        text: "Your photos are read locally and never leave the browser tab. You can confirm in the Network tab while the conversion runs.",
      },
    ],
    steps: [
      {
        title: "Choose your JPG files",
        text: "Drag them onto the dropzone, browse, or paste from the clipboard. Each file appears in the list with its dimensions and current size.",
      },
      {
        title: "Confirm the output format",
        text: "This page is pre-set to PNG. If you need something else, the full image converter has JPG, PNG, WebP, AVIF and more.",
      },
      {
        title: "Convert",
        text: "Press Convert to PNG. Progress shows per file; failure messages name the file and the reason, usually a corrupt download or an unsupported colour profile.",
      },
      {
        title: "Download",
        text: "Save files individually or as a single ZIP. Expect PNG files to be two to five times larger than the original JPEG — that is normal for photographs.",
      },
    ],
    limits: [
      {
        title: "The file gets bigger",
        text: "PNG is a lossless format, so a 2 MB JPEG photo of a landscape often becomes 6–12 MB. Use PNG when quality or a required format matters, not to save space.",
      },
      {
        title: "It cannot recover lost detail",
        text: "Converting a heavily compressed JPEG to PNG does not remove JPEG artefacts. It preserves them exactly, blockiness included.",
      },
      {
        title: "No animation",
        text: "If the source is an animated file, only the first frame is converted because PNG in this tool is a still image format.",
      },
      {
        title: "No CMYK conversion",
        text: "Browser decoding is RGB-based. A CMYK JPEG from a print workflow is converted to sRGB, which may shift saturated colours slightly.",
      },
    ],
    tips: [
      {
        title: "Use PNG when a form insists on it",
        text: "Many government and HR portals accept only PNG or PDF. Converting a scanned ID photo to PNG satisfies the validator without another lossy save.",
      },
      {
        title: "PNG is the better base for editing",
        text: "If you are about to annotate, crop or retouch an image several times, convert to PNG first so repeated saves do not add artefacts.",
      },
      {
        title: "Compress afterwards for the web",
        text: "A PNG straight from this tool is not web-optimised. For a website, convert your original JPG to WebP instead — usually smaller than the JPEG you started with.",
      },
      {
        title: "Keep the JPG as your archive copy",
        text: "The PNG is the editing master, not a smaller file. Store the original JPEG too if you may need to email it later.",
      },
    ],
    faqs: [
      {
        q: "Is converting JPG to PNG really lossless?",
        a: "The PNG conversion itself adds no loss: it stores exactly the pixels the JPEG decoder produced. Detail that the original JPEG compression removed cannot be restored, however.",
      },
      {
        q: "Why did my file get much larger?",
        a: "JPEG discards detail to save space, PNG does not. Photographs therefore expand, often by three to five times. Screenshots and graphics grow far less because they compress well without loss.",
      },
      {
        q: "Are my images uploaded to a server?",
        a: "No. The conversion runs in your browser using canvas encoding, and no file data is transmitted. You can test this by going offline after the page has loaded.",
      },
      {
        q: "Can I convert several JPGs at once?",
        a: "Yes. Add as many as your device can hold in memory, then download the whole batch as a ZIP or pick individual files.",
      },
      {
        q: "Does the PNG keep transparent areas?",
        a: "JPEG cannot store transparency, so a JPG never has any to keep. Areas that were white in the original stay white, not transparent.",
      },
      {
        q: "Is there a file-size limit?",
        a: "No hard limit, but images above roughly 50 MB or 8000 px on a side may exceed browser memory. Convert those on a desktop in smaller groups.",
      },
      {
        q: "Can I resize the image during conversion?",
        a: "Yes. Set a maximum width or height in the options and the tool scales the image proportionally before writing the PNG.",
      },
      {
        q: "Does this work on iPhone and Android?",
        a: "Yes. The file picker and canvas encoder work in Safari on iOS and Chrome on Android. Recent iPhones may hand you HEIC files instead of JPG — convert those directly with the HEIC to JPG page or the full image converter.",
      },
    ],
    related: ["image-converter", "image-to-pdf", "compress-pdf"],
    inputFormats: ["JPG", "JPEG"],
    outputFormats: ["PNG"],
    keywords: ["jpg to png", "jpeg to png", "convert jpg to png", "jpg to png converter"],
    popular: true,
    phase: 1,
    updated: "2026-10-27",
    preset: { outputFormat: "image/png", conversionLabel: "JPG to PNG" },
  },
];

export const toolBySlug = (slug: string) => tools.find((t) => t.slug === slug);
export const toolSlugs = tools.map((t) => t.slug);
export const toolsByCategory = (category: string) => tools.filter((t) => t.category === category);
export const popularTools = tools.filter((t) => t.popular);
export const toolCount = tools.length;

export function relatedTools(tool: { related: string[] }) {
  return tool.related.map((slug) => toolBySlug(slug)).filter((t): t is Tool => Boolean(t));
}
