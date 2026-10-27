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

/* ───────────────────────────── Compression ──────────────────────────────── */

{
  slug: "compress-image",
  name: "Compress Image",
  shortName: "Compress Image",
  category: "image-tools",
  widget: "image-compressor",
  icon: "Minimize2",
  tagline: "Shrink a photo until it fits a number — 200 KB, 1 MB, whatever the form demands.",
  bestFor: "A job portal, visa form or marketplace rejects your photo for being too large.",
  seoTitle: "Compress Image to Target Size Free",
  metaDescription:
    "Compress JPG, PNG, WebP and HEIC images to an exact KB size in your browser. Quality is found automatically, nothing is uploaded, batch and ZIP supported.",
  h1: "Compress Image to an Exact File Size in Your Browser",
  intro: [
    "Most compressors give you a quality slider and leave you guessing. This one starts from the number you actually need: 50 KB, 200 KB, 1 MB. It encodes the image, measures the result, and adjusts until the file fits — then tells you the quality and dimensions it settled on.",
    "Everything happens in your tab. The photo is decoded by the browser's own image pipeline and re-encoded on a canvas, so a passport scan or a photo of your ID never touches a server.",
  ],
  bullets: [
    {
      title: "Your target, not a guess",
      text: "Enter the limit your form states and the tool searches for the highest JPEG or WebP quality that still fits. You get the smallest file that looks as good as possible, rather than a file that happens to be small enough.",
    },
    {
      title: "Tells you the truth when a target is impossible",
      text: "A 24-megapixel photo cannot be squeezed into 20 KB without turning it into mush. When the search bottoms out, the tool says so, shows you the smallest result it could reach, and suggests lowering the resolution cap instead of silently missing the number.",
    },
    {
      title: "Resolution cap as a second lever",
      text: "File size falls faster with fewer pixels than with lower quality. Capping the longest edge at 1920 or 1280 pixels often hits a hard limit with far better-looking output than crushing quality to 30%.",
    },
    {
      title: "Batch compression with a ZIP",
      text: "Queue a whole folder, watch per-file progress, and download the results individually or together in one ZIP. Each row reports before and after size so you can see exactly what changed.",
    },
    {
      title: "Refuses to make files bigger",
      text: "An already-optimised JPEG can grow when re-encoded. If the new file would be larger than the original, the tool leaves that file alone and tells you to keep the original, instead of handing back a worse file with a proud green tick.",
    },
    {
      title: "No upload, no watermark, no queue",
      text: "There is no server, account, daily cap or logo. The bytes stay in your browser's memory, which is also why the tool works on a plane once the page has loaded.",
    },
  ],
  steps: [
    {
      title: "Add the images",
      text: "Drop files, browse, or paste from the clipboard. JPG, PNG, WebP, HEIC, AVIF, GIF and BMP are accepted; anything the browser cannot decode is reported with a reason.",
    },
    {
      title: "Set the target size",
      text: "Type the kilobytes your form allows, or tap a preset for the usual limits: 20 KB for avatars, 100 KB for job portals, 200 KB for most government forms, 1 MB for email attachments.",
    },
    {
      title: "Choose the format and resolution",
      text: "JPG works everywhere; WebP is usually 20–30% smaller at the same visual quality but not every old system accepts it. If you are still over the target, cap the longest edge and compress again.",
    },
    {
      title: "Compress and download",
      text: "Press Compress. Each finished file shows its quality, dimensions and whether it met the target. Download one file or everything as a ZIP.",
    },
  ],
  limits: [
    {
      title: "Small targets cost resolution, not just quality",
      text: "Below roughly 30 KB, a photographic image has to lose either pixels or visible detail. Both are destructive and neither can be undone, so keep your original. The tool will not invent sharpness that is not there.",
    },
    {
      title: "Only lossy output can be size-driven",
      text: "PNG compression is lossless, so it cannot be told to hit 100 KB without changing pixels. This tool therefore writes JPG or WebP. If you need a PNG that small, resize it first or accept a lossy format.",
    },
    {
      title: "The search optimises bytes, not perception",
      text: "The quality it picks is the highest that fits your budget. It does not run a perceptual quality metric, so look at the preview before you submit the file — text on a scanned page degrades faster than a landscape photo at the same quality.",
    },
    {
      title: "Very large photos are clamped by the browser",
      text: "A canvas tops out around 40 megapixels on desktop and 16 on iOS. Anything larger is scaled down to fit and the result says so.",
    },
  ],
  tips: [
    {
      title: "Match the format to the destination",
      text: "Government and job portals frequently accept only JPG. When the form lists a single format, compress to that format rather than the technically better one — a rejected upload wastes more time than a slightly larger file.",
    },
    {
      title: "Downscale before you crush quality",
      text: "A 4000 px photo displayed at 800 px is carrying four times the pixels it needs. Capping the edge at 1600 px often halves the file with no visible change, leaving quality high for text and edges.",
    },
    {
      title: "Keep the original",
      text: "Compression is one-way. Store the untouched photo and upload the compressed copy, so the next form with a different limit does not force you to start from the damaged version.",
    },
    {
      title: "Watch the preview on screenshots",
      text: "Screenshots and scans of documents compress badly at low quality: JPEG artefacts around black text look like smudges. For those, lower the resolution and keep quality above 70.",
    },
  ],
  faqs: [
    {
      q: "Is there a limit on how small I can go?",
      a: "No hard limit in the interface, but physics applies. Below about 10–15 KB a photograph stops being a photograph. The tool will produce the smallest file it can at the lowest quality and note that the target was not reached, so you can decide whether to reduce the resolution instead.",
    },
    {
      q: "Does compressing remove EXIF and GPS data?",
      a: "Yes. Re-encoding through a canvas drops EXIF, GPS coordinates and camera details entirely. That is usually desirable before publishing a photo. If you want to remove metadata while keeping the image bit-for-bit identical, use the EXIF remover instead.",
    },
    {
      q: "Why did my file get bigger?",
      a: "Some files are already compressed harder than this tool would compress them — messaging apps and social platforms re-encode on upload. Re-encoding that copy again can add bytes. The tool detects that case, skips the file and tells you to keep the original.",
    },
    {
      q: "Is the image quality checked after compression?",
      a: "The tool reports the quality it used, the exact output dimensions and the byte size of every result, so nothing is hidden. There is no automated perceptual score, because a single number cannot tell you whether the text in your scan is still readable — the preview can.",
    },
    {
      q: "Can I compress a HEIC photo from my iPhone?",
      a: "Yes, HEIC is decoded locally and re-encoded to JPG or WebP. If one particular file fails to decode, export it from Photos as a JPEG and compress that copy instead.",
    },
    {
      q: "Which is better for a 100 KB limit: JPG or WebP?",
      a: "WebP usually looks better at the same byte budget, but several government portals still accept only JPG while rejecting WebP outright. Check the accepted list first; a file that is 20% smaller but refused is worth nothing.",
    },
    {
      q: "Does this work offline?",
      a: "Once the page has loaded, yes. The compressor, the encoders and the ZIP writer all run in the tab, so no network request is made while you work.",
    },
  ],
  related: ["resize-image", "image-converter", "exif-remover"],
  inputFormats: ["JPG", "PNG", "WebP", "HEIC", "AVIF", "GIF", "BMP"],
  outputFormats: ["JPG", "WebP"],
  keywords: ["compress image", "compress jpg to 100kb", "compress image to 200kb", "reduce image size", "photo compressor", "image size reducer"],
  popular: true,
  isNew: true,
  phase: 4,
  updated: "2026-10-27",
},

/* ─────────────────────────────── Resize ─────────────────────────────────── */

{
  slug: "resize-image",
  name: "Resize Image",
  shortName: "Resize Image",
  category: "image-tools",
  widget: "image-resizer",
  icon: "Maximize2",
  tagline: "Set exact pixels, fit inside a box, or scale by percentage without distorting the photo.",
  bestFor: "A platform demands 1200 × 630, or your upload is twice the recommended width.",
  seoTitle: "Resize Image to Exact Pixels Free",
  metaDescription:
    "Resize JPG, PNG, WebP or HEIC images to exact pixels, a bounding box or a percentage in your browser. Ratio lock, batch resize, ZIP download, no upload.",
  h1: "Resize Image to Exact Pixels, a Box or a Percentage",
  intro: [
    "Resizing is the most misused image operation on the internet, because two very different things share the name: changing the pixel dimensions, and cutting the picture down to a different shape. This page does the first properly and points you at the crop tool for the second.",
    "Give it a width and height for exact output, a box to fit inside without distortion, or a percentage for a quick halving. The pixels are resampled in your browser with high-quality smoothing, and nothing is uploaded.",
  ],
  bullets: [
    {
      title: "Three honest ways to set a size",
      text: "Exact pixels force the output to the numbers you type. Fit inside a box scales the image down proportionally until both sides fit — the mode social platforms mean by recommended size. Percentage halves or doubles both sides at once.",
    },
    {
      title: "Aspect ratio lock that respects the source",
      text: "With the lock on, the height follows the width using the original photo's ratio, so portraits stay portraits. Turn it off when a form gives you literal dimensions and you accept that the picture will be stretched.",
    },
    {
      title: "Presets for the sizes people actually need",
      text: "One click fills in 1920 × 1080, 1080 × 1080, 1200 × 630, 800 × 800, 400 × 400 and 1280 × 720, which between them cover most social, storefront and Open Graph requirements.",
    },
    {
      title: "Upscaling is labelled, not hidden",
      text: "Enlarging a 600 px image to 1800 px invents no detail. The result row says the image was upscaled rather than quietly handing you a soft file that looks like a bigger one.",
    },
    {
      title: "Choose what comes back out",
      text: "Export as JPG for photographs, PNG when you need lossless output or transparency, WebP for the web. A quality slider appears for the lossy formats so you can trade size against fidelity.",
    },
    {
      title: "Batch, with dimensions in the filename",
      text: "Queue many images and each download is named with its new size, for example holiday-1200x800.jpg, which saves opening twelve files to find the one you need.",
    },
  ],
  steps: [
    {
      title: "Add your images",
      text: "Drop one or many. HEIC from an iPhone is decoded locally; anything unsupported is listed with the reason rather than failing silently.",
    },
    {
      title: "Pick how the size applies",
      text: "Exact pixels when a form states a width and height, fit inside a box for recommended sizes where only the longest edge matters, or percentage for a quick scale.",
    },
    {
      title: "Enter the numbers or a preset",
      text: "Type the width and height, or tap a preset. Keep the ratio lock on unless the destination really does want a stretched image.",
    },
    {
      title: "Resize and download",
      text: "Every result shows source dimensions, output dimensions and file size. Download individually or as a ZIP.",
    },
  ],
  limits: [
    {
      title: "Resizing is not cropping",
      text: "If you resize a 3:2 photo to a 1:1 frame, something has to give: either the image is stretched or the sides are trimmed. This tool stretches only when you turn the ratio lock off. To keep the subject and lose the edges, use the crop and rotate page.",
    },
    {
      title: "Enlarging cannot add detail",
      text: "Interpolation smooths what exists. A 500 px image blown up to 2000 px looks soft at full size and cannot be sharpened back. Start from the largest original you have.",
    },
    {
      title: "One canvas ceiling applies",
      text: "Output is limited by the browser canvas, roughly 16,384 px per side and 40 megapixels of area on desktop, less on iOS. Requests beyond that are clamped and reported.",
    },
    {
      title: "No print resolution metadata",
      text: "The tool changes pixels, not DPI metadata. A 3000 px photo resized to 1200 px is still a 1200 px file regardless of what a print dialogue claims. Print workflows that depend on DPI tags need a desktop editor.",
    },
  ],
  tips: [
    {
      title: "Downsize in one step, not three",
      text: "Repeatedly halving an image loses a little quality each time. Resize once from the original to the final size — the browser's resampling does a better job in a single pass.",
    },
    {
      title: "Retina screens double the number",
      text: "A hero image displayed at 800 CSS pixels looks sharpest at 1600 real pixels on a modern laptop. Resize for the device pixel ratio, not just the layout width.",
    },
    {
      title: "Screenshots deserve an exact width",
      text: "Documentation screenshots look sloppy at odd widths. Resize to a fixed 1200 or 1600 px and let every image in a set share the same width.",
    },
    {
      title: "Fewer pixels is the cheapest compression",
      text: "If a file is too large for a form, resizing to the size it will actually be viewed at usually beats compressing a huge image down in quality.",
    },
  ],
  faqs: [
    {
      q: "What is the difference between resizing and compressing?",
      a: "Resizing changes the number of pixels; compressing changes how many bytes those pixels take. A 2000 px photo resized to 800 px is genuinely smaller in every sense, while a compressed 2000 px photo keeps its dimensions and loses fine detail. Forms that state a kilobyte limit want compression; forms that state pixel dimensions want resizing.",
    },
    {
      q: "Will resizing distort my photo?",
      a: "Only if the ratio lock is off and you give a width and height of a different shape. With the lock on, or in fit-inside-a-box mode, the original proportions are preserved and nothing is stretched.",
    },
    {
      q: "What happens if I make an image bigger?",
      a: "The browser interpolates between existing pixels. The file gets larger, the edges get softer, and no new detail appears. The result is labelled as upscaled so you can judge whether it is good enough.",
    },
    {
      q: "Which format should I export?",
      a: "JPG for photographs and anything that will be emailed, PNG for screenshots, logos and transparency, WebP for websites where you control the markup. Resizing to PNG a photograph produces a large file for no visible gain.",
    },
    {
      q: "Does resizing delete metadata?",
      a: "Yes. Re-encoding discards EXIF, including GPS. If you want to keep the metadata or remove it losslessly without touching pixels, use the EXIF remover page instead.",
    },
    {
      q: "Can I resize several images to the same size at once?",
      a: "Yes. Queue them all and choose the target size once. In exact mode every output is that size; in fit mode each image keeps its own ratio inside the same box, which is what batch processing should do.",
    },
    {
      q: "Is anything uploaded?",
      a: "No. Files are read with the File API, resampled on a canvas and encoded in the tab. Nothing leaves your device and nothing is stored after you close the page.",
    },
  ],
  related: ["compress-image", "crop-image", "image-converter"],
  inputFormats: ["JPG", "PNG", "WebP", "HEIC", "AVIF", "GIF", "BMP"],
  outputFormats: ["JPG", "PNG", "WebP"],
  keywords: ["resize image", "resize jpg", "image resizer", "change image dimensions", "scale image", "1200x630"],
  popular: true,
  isNew: true,
  phase: 4,
  updated: "2026-10-27",
},

/* ──────────────────────────────── Crop ──────────────────────────────────── */

{
  slug: "crop-image",
  name: "Crop Image",
  shortName: "Crop Image",
  category: "image-tools",
  widget: "image-crop",
  icon: "Crop",
  tagline: "Drag a box over the part you want, then rotate, flip and export at full resolution.",
  bestFor: "A profile picture needs a square, or a screenshot has a toolbar you do not want to publish.",
  seoTitle: "Crop Image, Rotate and Flip Free",
  metaDescription:
    "Crop an image with a draggable box, rotate it in 90° steps and flip it horizontally or vertically in your browser. Full-resolution export, no upload.",
  h1: "Crop Image, Rotate and Flip Without Uploading It",
  intro: [
    "Cropping is how you tell a picture what to be about. This tool puts a draggable box over your image, dims everything outside it, and exports only what is inside — at the original resolution, not the resolution of the preview.",
    "Rotation and flips are applied to the cropped result, so a sideways phone photo becomes upright and a mirror selfie stops being reversed. All of it happens on a canvas in your browser.",
  ],
  bullets: [
    {
      title: "A box you can actually position",
      text: "Drag anywhere inside the box to move it and drag any corner to resize. The area outside is dimmed so you see the final frame, not the part you are cutting away.",
    },
    {
      title: "Aspect ratio presets that stay honest",
      text: "Free, 1:1, 4:3, 3:2, 16:9 and 9:16. Choosing one re-shapes the box and keeps it locked while you drag, taking the image's own proportions into account so a square is genuinely square in pixels.",
    },
    {
      title: "Live result preview",
      text: "A small preview of the final crop — including rotation and flipping — updates as you move the box, so the download cannot surprise you.",
    },
    {
      title: "Rotate 90° and flip on either axis",
      text: "Phone photos that were taken sideways, scanned pages that came in landscape, mirrored front-camera shots: rotate and flip before exporting rather than opening a desktop editor.",
    },
    {
      title: "Exports the full-resolution original",
      text: "The box works on a scaled preview but the crop is taken from the source pixels. Cropping a 6000 px photo to a third of its width still gives you a 2000 px image.",
    },
    {
      title: "JPG, PNG or WebP out",
      text: "Choose PNG to keep transparency and lossless edges, JPG with a quality slider for photographs, WebP for the web. Dimensions appear in the filename.",
    },
  ],
  steps: [
    {
      title: "Add one image",
      text: "Drop a file or browse. HEIC from an iPhone is decoded locally, and the source dimensions are shown under the preview.",
    },
    {
      title: "Drag the crop box",
      text: "Move the box over the part you want to keep and pull a corner to resize it. Pick an aspect preset if the destination demands a shape, such as 1:1 for an avatar.",
    },
    {
      title: "Rotate or flip if needed",
      text: "Use the rotate button for 90° steps and the flip buttons for mirroring. The preview updates immediately, and the output size under it tells you the real pixel dimensions.",
    },
    {
      title: "Export",
      text: "Choose a format, set quality if it is lossy, and press Crop and download. The result is named with its dimensions, such as photo-1200x1200.jpg.",
    },
  ],
  limits: [
    {
      title: "One image at a time",
      text: "A crop is a visual decision, so this page works on a single image rather than a batch. For resizing many files to the same dimensions, use the resizer.",
    },
    {
      title: "The crop is rectangular",
      text: "There is no ellipse, freeform lasso or perspective correction. Radial crops and straightening a skewed scan belong in a desktop editor, and pretending otherwise would produce a worse result.",
    },
    {
      title: "Drag precision on a phone",
      text: "Touch dragging works, but corners are small on a 5-inch screen. If a crop must be exact to the pixel, set the aspect preset first and nudge with the preview rather than fighting the handles.",
    },
    {
      title: "Re-encoding is lossy for JPG and WebP",
      text: "Exporting a crop to JPG re-encodes the pixels. Export to PNG when the cropped art has hard edges or transparency and you want no further loss.",
    },
  ],
  tips: [
    {
      title: "Crop before you resize",
      text: "Cropping first means the resizer only has to scale the part you keep, which keeps file sizes down and avoids throwing away pixels you already paid for in resolution.",
    },
    {
      title: "Leave breathing room for avatars",
      text: "Profile pictures are often displayed as circles, cutting the corners off. Crop a square and keep the face slightly inside the frame rather than tight to the edge.",
    },
    {
      title: "Straighten first, crop second",
      text: "If a photo is tilted, rotate in 90° steps only, then let the crop box cut the worst of the tilt away. This tool does not do arbitrary-angle straightening, so the box is your straightening tool.",
    },
    {
      title: "Keep the original orientation in mind",
      text: "Some phone photos carry an orientation tag rather than rotated pixels. This tool bakes the rotation you choose into the output, which is why the exported file looks the same everywhere.",
    },
  ],
  faqs: [
    {
      q: "Does cropping reduce image quality?",
      a: "The pixels you keep are copied at full resolution. Quality only changes because of the export format: PNG is lossless, while JPG and WebP re-encode and lose a little detail — keep quality high for artwork and text.",
    },
    {
      q: "Can I crop to an exact pixel size?",
      a: "Choose the aspect preset that matches the shape you need, then read the output dimensions under the preview while you drag. For a guaranteed exact size, crop first and then pass the result through the resizer, which takes literal width and height numbers.",
    },
    {
      q: "What is the difference between rotating and flipping?",
      a: "Rotating turns the image in 90° steps without mirroring it. Flipping mirrors it — horizontally like a mirror selfie, vertically like a reflection in water. Both can be combined with a crop in one export.",
    },
    {
      q: "Can I crop a HEIC photo from my iPhone?",
      a: "Yes. HEIC is decoded in the browser before cropping, so you do not need to convert it first. If a particular file refuses to decode, export it from Photos as JPEG and use that copy.",
    },
    {
      q: "Does cropping remove metadata?",
      a: "Yes. The cropped image is drawn onto a fresh canvas, so EXIF, GPS and camera details do not survive. If you need the metadata kept, crop in an editor that preserves it — nothing on this page can copy tags into a new image honestly.",
    },
    {
      q: "Is the file uploaded to crop it?",
      a: "No. The original is decoded, the crop is calculated and the export is encoded inside your tab. There is no server component to upload to.",
    },
  ],
  related: ["resize-image", "compress-image", "image-converter"],
  inputFormats: ["JPG", "PNG", "WebP", "HEIC", "AVIF", "GIF", "BMP"],
  outputFormats: ["JPG", "PNG", "WebP"],
  keywords: ["crop image", "crop picture", "rotate image", "flip image", "square crop", "crop photo online"],
  popular: true,
  isNew: true,
  phase: 4,
  updated: "2026-10-27",
},

/* ──────────────────────────────── EXIF ──────────────────────────────────── */

{
  slug: "exif-remover",
  name: "EXIF Remover",
  shortName: "EXIF Remover",
  category: "image-tools",
  widget: "exif",
  icon: "Eye",
  tagline: "See what your photo is carrying — GPS, camera, timestamps — then strip it without re-encoding.",
  bestFor: "You are about to publish a photo and would rather not share where and when it was taken.",
  seoTitle: "EXIF Remover and Viewer Free",
  metaDescription:
    "View a photo's EXIF data — GPS, camera, timestamps — then remove it from JPEG, PNG and WebP without re-encoding, so image quality is untouched.",
  h1: "EXIF Remover and Viewer — Strip GPS and Camera Data",
  intro: [
    "A phone photo is not just pixels. It usually carries the camera model, the exact date and time, the exposure settings, and — if location services were on — the latitude and longitude where you took it. That metadata travels with the file through email, chat apps and upload forms.",
    "This page shows you everything it can read, then removes it. For JPEG, PNG and WebP the removal is done by rebuilding the container without those blocks, so the image data is never decoded or re-encoded and the picture is byte-for-byte identical.",
  ],
  bullets: [
    {
      title: "Lossless removal, not another re-save",
      text: "Most online removers load the photo, save it again and quietly lose quality. Here the metadata blocks are cut out of the file structure and the compressed pixels are copied untouched, so the result looks exactly like the original.",
    },
    {
      title: "Everything readable is listed first",
      text: "Camera make and model, lens, exposure, ISO, the exact timestamps, software that edited it, and any GPS coordinates. Nothing is removed until you have seen what is there.",
    },
    {
      title: "GPS is called out loudly",
      text: "If the photo contains coordinates, the page says so at the top rather than burying it in a table. Location is the field that matters most if the picture is going somewhere public.",
    },
    {
      title: "Keeps the colour profile",
      text: "ICC profiles are colour management, not identity. They are kept by default so the image does not shift hue after cleaning, with a checkbox for the rare case you want them gone too.",
    },
    {
      title: "Works on JPEG, PNG and WebP",
      text: "JPEG APP1/APP2/APP13 segments, PNG eXIf and text chunks, and WebP EXIF/XMP chunks are all handled, with the VP8X feature flags updated so the container stays consistent.",
    },
    {
      title: "Shows the byte cost",
      text: "Each block is listed with its size, so you can see that the 38 KB XMP block was bigger than the thumbnail you thought was the problem.",
    },
  ],
  steps: [
    {
      title: "Drop a photo",
      text: "Choose a JPEG, PNG or WebP. The file is read as bytes in your browser; no upload request is made.",
    },
    {
      title: "Read what it carries",
      text: "Fields are grouped into image, EXIF and GPS sections. Coordinates, camera serial numbers and edit history are the usual surprises.",
    },
    {
      title: "Decide about the colour profile",
      text: "Leave it on unless you have a specific reason. Removing a wide-gamut profile can make colours look flat in other applications.",
    },
    {
      title: "Download the cleaned copy",
      text: "The cleaned file is named with a no-metadata suffix. Your original is untouched on disk, so you can compare the two before publishing.",
    },
  ],
  limits: [
    {
      title: "HEIC, TIFF and RAW are not parsed",
      text: "iPhone HEIC files and camera RAW containers use different structures. Rather than guess and hand back an unchanged file labelled clean, this tool says it cannot handle them. Convert to JPEG first, or remove metadata by exporting from Photos.",
    },
    {
      title: "Removing metadata is not redaction",
      text: "It deletes tags, not pixels. A face, a street sign or a reflection in a window is still in the image. If the content itself is sensitive, crop or edit it out on the crop page.",
    },
    {
      title: "Orientation tags can matter to other apps",
      text: "Many photos store rotation as a tag rather than rotated pixels. Browsers and gallery apps honour it, some desktop viewers do not, so a photo can look sideways elsewhere after cleaning. If that happens, open it on the crop page and rotate it into the pixels.",
    },
    {
      title: "Some files carry nothing to remove",
      text: "Screenshots, exported PNGs and images that already passed through a converter often have no EXIF at all. The tool reports that instead of claiming to have cleaned something.",
    },
  ],
  tips: [
    {
      title: "Clean before publishing, not after",
      text: "Each platform re-processes uploads and may regenerate its own metadata. Strip the original before the first upload so no copy carries the location.",
    },
    {
      title: "Check images you received too",
      text: "Photos sent to you can contain the sender's home coordinates. If you plan to republish them, inspect first — it is their privacy as well as yours.",
    },
    {
      title: "Turn off location for the camera app",
      text: "The most reliable fix is not to record GPS in the first place. Both iOS and Android let you deny location to the camera app while leaving it available elsewhere.",
    },
    {
      title: "Keep the ICC profile",
      text: "It is tempting to remove everything, but a stripped colour profile can shift saturated colours noticeably. Profile data describes colour, not identity.",
    },
  ],
  faqs: [
    {
      q: "Does removing EXIF reduce image quality?",
      a: "No. For JPEG, PNG and WebP this tool rebuilds the container and copies the compressed image data exactly as it was. There is no decode and no re-encode, so the pixels are identical. Only the metadata segments disappear.",
    },
    {
      q: "What exactly gets removed?",
      a: "For JPEG: the EXIF block, XMP metadata, Photoshop/IPTC segments, comments and other application segments, with the colour profile kept unless you untick it. For PNG: eXIf, tEXt, iTXt, zTXt and tIME chunks. For WebP: EXIF and XMP chunks, with the VP8X flags updated to match.",
    },
    {
      q: "Can I see the metadata without removing it?",
      a: "Yes, that is the first half of the page. Drop a file and the fields are listed before you decide anything. Nothing is written to your file or downloaded until you press the remove button.",
    },
    {
      q: "Why does my photo say it has no metadata?",
      a: "Screenshots do not carry camera data, and many export paths — including this site's own converter and resizer — produce files without EXIF. Social platforms strip most tags on upload, so a downloaded Instagram image usually has nothing left.",
    },
    {
      q: "Will the file get smaller?",
      a: "Usually, by the size of the removed blocks. EXIF is often 10–40 KB, XMP can be larger, and a thumbnail inside the EXIF block can be another 20 KB. The result row shows the before and after size.",
    },
    {
      q: "Can I remove metadata from a PDF or a video?",
      a: "Not here. For PDFs there is a separate metadata editor that clears title, author, subject, keywords and producer fields. Video containers are out of scope on this site.",
    },
    {
      q: "Is the photo uploaded to check it?",
      a: "No. The bytes are read with the File API and parsed in the tab. Nothing is sent anywhere, which is the only defensible way to handle a file whose GPS tag is the reason you came.",
    },
  ],
  related: ["remove-metadata-from-pdf", "compress-image", "crop-image"],
  inputFormats: ["JPG", "PNG", "WebP"],
  outputFormats: ["JPG", "PNG", "WebP"],
  keywords: ["exif remover", "remove exif data", "exif viewer", "remove gps from photo", "strip metadata", "photo metadata"],
  popular: true,
  isNew: true,
  phase: 4,
  updated: "2026-10-27",
},

/* ─────────────────────────────── Base64 ─────────────────────────────────── */

{
  slug: "image-to-base64",
  name: "Image to Base64",
  shortName: "Base64",
  category: "image-tools",
  widget: "base64",
  icon: "FileCode2",
  tagline: "Turn an image into a data URI, CSS or HTML snippet — and decode one back into a real file.",
  bestFor: "You need an inline icon in CSS, an image in an email template, or a pasted blob turned back into a picture.",
  seoTitle: "Image to Base64 Converter Free",
  metaDescription:
    "Convert an image to base64 or a data URI, copy it as CSS or HTML, and decode base64 back into a real image file. Runs in your browser, nothing uploaded.",
  h1: "Image to Base64 Converter — Encode and Decode Locally",
  intro: [
    "Base64 turns bytes into text so an image can live inside a stylesheet, an HTML attribute or a JSON payload instead of being fetched as a separate file. This page encodes an image into four ready-to-paste forms, and decodes base64 back into a real file you can open.",
    "The converter never uploads anything: the file is read with the File API and converted with the browser's own encoder. Decoding checks the bytes themselves to work out whether you have a PNG, a JPEG, a WebP or something else entirely.",
  ],
  bullets: [
    {
      title: "Four output shapes, not one",
      text: "A full data URI for an img src, raw base64 for APIs and JSON, a CSS background-image rule, and an HTML img tag with the alt text filled in from the filename.",
    },
    {
      title: "Type detected from the bytes",
      text: "When decoding, the MIME type is read from the file signature rather than the label in the data URI. A string that claims to be a PNG but starts with JPEG bytes is reported as a JPEG, because that is what it is.",
    },
    {
      title: "Paste-tolerant decoding",
      text: "Line breaks, spaces, URL-safe characters and missing padding are all accepted, so a base64 string copied out of an email or a JSON log does not fail for cosmetic reasons.",
    },
    {
      title: "Live preview both ways",
      text: "See the image you encoded and the file you decoded before you download or paste it, so a wrong clipboard is obvious immediately.",
    },
    {
      title: "Copy or download",
      text: "One click copies the snippet, or downloads it as a .txt file — useful when the string is too long to paste into a chat window without truncation.",
    },
    {
      title: "No size guessing",
      text: "The page shows how many bytes the file is, how many characters the text version takes, and the 33% overhead that base64 always adds.",
    },
  ],
  steps: [
    {
      title: "Choose a direction",
      text: "Image to Base64 for encoding, or Base64 to image for decoding. Both work locally and neither has a server behind it.",
    },
    {
      title: "Encode: drop a file and pick a format",
      text: "Choose the data URI, raw base64, CSS rule or HTML tag, then copy it or download the text file.",
    },
    {
      title: "Decode: paste the string",
      text: "Paste the whole data URI or just the base64 body and press Decode. The detected type and byte size appear with a preview.",
    },
    {
      title: "Download or copy the result",
      text: "Decoded files download with the correct extension for their real format, not the one the string claimed.",
    },
  ],
  limits: [
    {
      title: "Base64 makes files bigger",
      text: "Encoding adds a third in size, and gzip cannot recover it because the data is already incompressible. Inlining a 200 KB photo adds roughly 270 KB to the document that every visitor must download before the page renders.",
    },
    {
      title: "Not every context allows data URIs",
      text: "A strict Content-Security-Policy may need img-src data:, some email clients strip them, and a few CMS fields have character limits. Check the destination before committing to a 200,000-character string.",
    },
    {
      title: "40 MB is the practical ceiling",
      text: "Browsers can build much larger strings, but the tab has to hold the bytes, the text and the preview at once. For huge files, a URL to the file is always a better transport.",
    },
    {
      title: "No compression, no resizing",
      text: "This page converts, it does not optimise. If the goal is a smaller page, compress or resize the image first, then encode the result.",
    },
  ],
  tips: [
    {
      title: "Inline only what is small",
      text: "Icons, logos and tiny decorative graphics under about 4 KB are good candidates. Photographs and anything responsive should stay as separate files that the browser can cache and resize.",
    },
    {
      title: "One request saved, one cache lost",
      text: "Inlining removes an HTTP request but also removes caching: the base64 is downloaded again with every page that embeds it, including when it changes by one byte.",
    },
    {
      title: "Use SVG for vector logos",
      text: "If the source is a logo, base64-encoding a PNG still ships raster pixels. Inline the SVG markup instead and it scales perfectly and stays tiny.",
    },
    {
      title: "Check the type before you trust the string",
      text: "A mislabelled data URI is a common bug: the browser refuses to render it and nothing explains why. This decoder tells you what the bytes really are.",
    },
  ],
  faqs: [
    {
      q: "Is base64 the same as encryption?",
      a: "No. Base64 is a reversible encoding with no key — anyone can decode it in one step. It hides nothing and protects nothing; if a file must be private, it needs encryption, not encoding.",
    },
    {
      q: "Why does my base64 string look 33% longer than the file?",
      a: "Base64 represents every three bytes as four characters from a 64-character alphabet. That is a fixed 4/3 expansion. The page shows both numbers so you can see the cost before pasting it into a document.",
    },
    {
      q: "Can I decode a base64 string that has no data: prefix?",
      a: "Yes. Paste the raw base64 and the decoder will work out the format from the decoded bytes. A data URI prefix is only needed when something else has to know the type before decoding.",
    },
    {
      q: "Which formats can I encode?",
      a: "Any image your browser can read plus PDF: JPG, PNG, WebP, GIF, SVG, AVIF, BMP, ICO and PDF. The output is plain text, so the input format only matters for the MIME type written into the data URI.",
    },
    {
      q: "Will the decoded file be identical to the original?",
      a: "Yes, as long as the base64 came from the same bytes. Base64 is exact and lossless in both directions; a decoded file is byte-identical to what was encoded.",
    },
    {
      q: "Is anything uploaded when I encode or decode?",
      a: "No. Both directions run entirely in the tab using the browser's own atob and btoa implementations. There is no network request and nothing is stored.",
    },
  ],
  related: ["image-converter", "compress-image", "resize-image"],
  inputFormats: ["JPG", "PNG", "WebP", "GIF", "SVG", "AVIF", "ICO", "PDF"],
  outputFormats: ["Base64 text", "Data URI", "CSS", "HTML"],
  keywords: ["image to base64", "base64 to image", "data uri converter", "base64 encoder", "image to data uri", "decode base64"],
  isNew: true,
  phase: 4,
  updated: "2026-10-27",
},
];
