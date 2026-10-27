import type { Tool } from "@/lib/tool-types";

/** Image conversion tools. */
export const imageTools: Tool[] = [
{
    slug: "image-converter",
    name: "Image Converter",
    shortName: "Image Converter",
    category: "image-tools",
    widget: "image-converter",
    icon: "Repeat2",
    tagline: "Pick any target format — JPG, PNG, WebP, AVIF, ICO, PDF, SVG and more — in bulk.",
    bestFor: "A site rejects your PNG, your CMS wants WebP, or you need an app icon in ICO.",
    seoTitle: "Image Converter — JPG, PNG, WebP, PDF",
    metaDescription:
      "Convert images between JPG, PNG, WebP, AVIF, GIF, BMP, TIFF, ICO, PDF, SVG and PPM in your browser. Batch, quality, ZIP. No upload.",
    h1: "Free Image Converter — Change Any Format in Your Browser",
    intro: [
      "Load one image or a hundred, pick a target format, adjust quality and download the results individually or as a ZIP. Transparency is preserved where the format supports it and flattened honestly where it does not.",
      "The conversion uses your browser's own image engine plus small local encoders for the formats browsers cannot write, so nothing is uploaded and there is no per-file limit other than your device's memory.",
    ],
    bullets: [
      {
        title: "Eleven output formats, chosen after you upload",
        text: "JPG, PNG, WebP, AVIF, GIF, BMP, TIFF, ICO, PDF, SVG and PPM from any image your browser can open, including HEIC from iPhones and SVG files. Add your images first, then pick the target — each file in the list shows its own conversion, such as JPG → PNG.",
      },
      {
        title: "Every file is checked before you get it",
        text: "The tool re-opens what it just encoded and compares it against the format you asked for. Browser-decodable formats are decoded back to full pixels; the rest are checked against their file signature. A file that claims to be PNG really is a PNG.",
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
        text: "PNG, WebP, AVIF, ICO and SVG keep the alpha channel. JPG, BMP, TIFF, GIF and PDF cannot, so transparent areas are filled with a background colour you choose — and the interface says so instead of quietly turning them white.",
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
        text: "After the images are in, choose the target for the whole batch from eleven formats grouped by purpose: JPG, PNG, WebP or AVIF for the web, GIF and ICO for icons, TIFF, BMP or PDF for print and documents, SVG and PPM for developer workflows. The hint under the grid explains what the format does and does not keep.",
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
        title: "Huge photos are scaled to fit the canvas",
        text: "A browser canvas has a hard pixel ceiling, and asking for more than that returns a blank image rather than an error. Output is therefore capped at 40 megapixels on desktop and 16 megapixels on iOS; anything bigger is scaled down and the result says so. Use the resize option when you want a specific size.",
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
        title: "ICO is built from four sizes",
        text: "The ICO output contains 16, 32, 48 and 256 px frames in one file, which is what Windows and browsers expect from a favicon or app icon. Each frame is centre-cropped to a square, so start from an image whose subject sits in the middle.",
      },
      {
        title: "PDF output is one image per page",
        text: "Choosing PDF wraps each image in its own single-page PDF sized to the picture, with photos kept as JPEG inside. For several images in one document with A4 pages and margins, use the Image to PDF tool instead.",
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
        q: "How do I know the conversion actually worked?",
        a: "Every result is verified before it appears in the download list. Formats the browser can decode — JPG, PNG, WebP, GIF, AVIF and SVG — are opened again and their pixel dimensions compared with the ones requested. BMP, TIFF, ICO, PPM and PDF are checked against their file signature and, for PDF, the end-of-file marker. If a file fails, you get the reason instead of a corrupt download.",
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
        q: "Does the conversion reduce image quality?",
        a: "PNG, BMP, TIFF and PPM output are lossless. JPG, WebP, AVIF and the JPEG inside PDF output are lossy at any quality below 100, so keep those at 85–95 for archival copies and 70–80 for web delivery. SVG here embeds a PNG, so it is lossless but not vectorised.",
      },
      {
        q: "Is there a file-size or daily limit?",
        a: "No daily limit and no account. Individual files up to roughly 50 MB work in most browsers; beyond that, memory on the device becomes the practical constraint.",
      },
    ],
    related: ["jpg-to-png", "image-to-pdf", "compress-pdf"],
    inputFormats: ["JPG", "PNG", "WebP", "HEIC", "AVIF", "GIF", "BMP", "SVG", "TIFF"],
    outputFormats: ["JPG", "PNG", "WebP", "AVIF", "GIF", "BMP", "TIFF", "ICO", "PDF", "SVG", "PPM"],
    keywords: ["image converter", "png to jpg", "webp converter", "heic converter", "avif converter", "ico converter", "jpg to pdf", "image to svg"],
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
