import type { Tool } from "@/lib/tool-types";

/** Optimisation tools: same pages, smaller file. */
export const pdfOptimizeTools: Tool[] = [
{
    slug: "compress-pdf",
    name: "Compress PDF",
    shortName: "Compress PDF",
    category: "pdf-tools",
    widget: "compress-pdf",
    icon: "Minimize2",
    group: "optimize",
    tagline: "Shrink a PDF for email, upload limits and forms — with a real before/after size.",
    bestFor: "You need to email a 12 MB scan or squeeze a document under a 2 MB upload limit.",
    seoTitle: "Compress PDF Free — Shrink a PDF in Your Browser",
    metaDescription:
      "Shrink PDF files free in your browser. Keep text selectable or rasterise to hit a target size. No upload, no sign-up, no watermark.",
    h1: "Compress PDF — Shrink a PDF Without Uploading It",
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
];
