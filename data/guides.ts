export interface Guide {
  slug: string;
  title: string;
  excerpt: string;
  /** ISO date, used for the sitemap and article structured data. */
  date: string;
  updated?: string;
  readingMinutes: number;
  /** Tool slugs shown in the guide's sidebar. */
  relatedTools: string[];
  /** Body paragraphs. Supports a small subset: h2, h3, p, ul, ol, quote. */
  body: Array<
    | { type: "h2"; text: string }
    | { type: "h3"; text: string }
    | { type: "p"; text: string }
    | { type: "ul"; items: string[] }
    | { type: "ol"; items: string[] }
    | { type: "quote"; text: string }
  >;
  /** Shown on cards when true. */
  featured?: boolean;
}

/**
 * Hand-written guides. Every guide must point at tools that actually work, and
 * every number in it must be reproducible in the browser tool it links to.
 * `npm run validate` enforces 800+ words, a title under 50 characters and a
 * unique slug.
 */
export const guides: Guide[] = [
  {
    slug: "why-is-my-pdf-still-too-big-after-compressing",
    title: "Why Is My PDF Still Too Big After Compressing?",
    excerpt:
      "Compression saves 2% on one PDF and 80% on another. Here is what actually decides the result, and what to do when a portal still rejects your file.",
    date: "2026-10-27",
    readingMinutes: 7,
    relatedTools: ["compress-pdf", "pdf-to-jpg", "split-pdf"],
    featured: true,
    body: [
      { type: "h2", text: "The short answer" },
      {
        type: "p",
        text: "A PDF is a container, not a picture. It holds fonts, vector drawing commands, text instructions and — usually — photographs and scanned pages that were already compressed once when they were created. Whether a compressor can shrink your file depends on which of those things is taking up the space. If 90% of the bytes are photographs that a scanner already saved as JPEG, a lossless pass has almost nothing to remove. If the file is a bloated export from an old word processor, stuffed with duplicate fonts and a full-resolution image used at thumbnail size, the same pass can cut it in half.",
      },
      {
        type: "p",
        text: "That is why two people can use the same tool and report completely different results. The tool is not lying to either of them; the documents are built differently.",
      },

      { type: "h2", text: "What is actually inside your file" },
      {
        type: "p",
        text: "Before choosing a setting, work out which kind of PDF you have. There is a quick test that needs no software: open the file and try to select a sentence with your mouse.",
      },
      { type: "ul", items: [
        "If the text highlights and copies, the PDF is text-based. Its pages are instructions, and the heavy part is usually a handful of embedded images or a font set.",
        "If the text cannot be selected, it is a scan or an image-only export. Every page is a photograph, and photographs are exactly what compression is good at.",
        "If selection works on some pages and not others, it is a mixed document — typically a scanned appendix behind a typed cover sheet. Compress it as a mixed file and expect a partial saving.",
      ]},
      {
        type: "p",
        text: "The second thing worth knowing is the file's image resolution. A scan made at 600 DPI has four times the pixels of the same page at 300 DPI and roughly four times the file size. Nothing inside the PDF can undo that without re-encoding the image, which means throwing pixels away — a real trade-off, not a clever trick.",
      },

      { type: "h2", text: "What a browser can and cannot do" },
      {
        type: "p",
        text: "Recompressing every image inside a PDF safely is hard: images can be shared between pages, rotated, masked, or drawn with transparency groups, and getting any of that wrong produces broken pages. A browser-based tool that advertises a \"lossless 70% saving\" on any file is almost always either uploading your document to a server or quietly rasterising it. This site does neither. Its lighter settings rewrite the file structure, remove metadata, deduplicate objects and drop unused ones; the strong setting turns each page into a JPEG at the resolution you pick.",
      },
      {
        type: "p",
        text: "That gives three honest outcomes you can predict in advance:",
      },
      { type: "ol", items: [
        "Text-only PDF from Word, LaTeX or Google Docs: expect roughly 2–10%. The file is already efficient and the remaining bytes are fonts and page instructions.",
        "Scanned or photographed pages: expect 60–90% with the strong setting, because the pages are pictures and pictures re-encode well.",
        "Already-optimised file, or vector-heavy artwork: expect almost nothing, and sometimes a slightly larger file. Keep the original if the tool reports growth.",
      ]},
      {
        type: "quote",
        text: "If the numbers did not move, the file did not contain anything removable. That is information about the document, not a failure of the tool.",
      },

      { type: "h2", text: "When the upload portal still says no" },
      {
        type: "p",
        text: "Most rejections come from a limit you can see — 2 MB for a job portal, 5 MB for a visa form, 10 MB for an email attachment — but some come from a limit you cannot: a page count, a dimension, or an antivirus scanner that dislikes embedded JavaScript. Work through these in order.",
      },
      { type: "ol", items: [
        "Compress with the strong setting at 150 DPI. That is sharp enough to read on screen and to print acceptably, and it is where the large savings live.",
        "Remove pages you do not need. A certificate bundle often contains four pages where the form asks for one. Splitting before compressing is faster than compressing pages you will delete.",
        "Split the document into two uploads if the portal allows it. Two 3 MB files usually pass where one 6 MB file does not.",
        "Convert the pages to JPG only if the destination accepts images. Turning a PDF into pictures is not a compression step, and it loses selectable text.",
        "As a last resort, ask what the actual limit is. \"Too large\" is often a template message for a 1 MB cap.",
      ]},

      { type: "h2", text: "Mistakes that waste time" },
      { type: "ul", items: [
        "Compressing the same file repeatedly. The second pass finds nothing left to remove, and each strong pass re-encodes the JPEGs again, so quality drops while the size stays flat.",
        "Changing the extension to .zip or .rar. Upload forms read the file's signature, not its name, and the file is no smaller.",
        "Rasterising a document that must stay searchable. If a form asks for a machine-readable PDF, pictures of text will fail an automated check even when a human can read them.",
        "Assuming a password-protected file can be compressed. It cannot be opened in the browser without the password, so it cannot be re-saved smaller.",
      ]},

      { type: "h2", text: "A repeatable routine" },
      {
        type: "p",
        text: "Open the compressor, drop the PDF in, and start with the recommended level. Read the before and after sizes the tool prints rather than trusting a percentage from a blog post. If that is not enough, switch to the strong level at 150 DPI and compare again. Keep whichever file is smaller and still legible at 100% zoom.",
      },
      {
        type: "p",
        text: "Then do the check that catches every embarrassing mistake: open the downloaded file, scroll to a dense page, and zoom in. Text made of pixels shows soft edges when enlarged; text that is still text stays crisp at any zoom. If the sharpness matters for printing, use the lighter level and accept the smaller saving.",
      },
      {
        type: "p",
        text: "Because the whole process runs in your tab, you can repeat it as often as you like on the same document without waiting for an upload, and without a copy of a contract or a medical record sitting on someone else's server afterwards. That last part is the reason this tool exists at all.",
      },
    ],
  },

  {
    slug: "pdf-to-jpg-which-dpi",
    title: "PDF to JPG: Which DPI Do You Actually Need?",
    excerpt:
      "72, 150 or 300 DPI: what each one means for pixel size, file size and legibility, and the cases where a picture of a page is the wrong output entirely.",
    date: "2026-10-27",
    readingMinutes: 6,
    relatedTools: ["pdf-to-jpg", "compress-pdf", "image-converter"],
    featured: true,
    body: [
      { type: "h2", text: "What DPI means when there is no paper" },
      {
        type: "p",
        text: "DPI stands for dots per inch, and it only means something relative to a physical size. When you convert a PDF page to an image, the tool multiplies the page's dimensions in inches by the DPI you choose to get pixels. An A4 page is 8.27 by 11.69 inches, so 150 DPI gives you 1240 by 1754 pixels, and 300 DPI gives 2481 by 3508. The page did not get \"better\" — it got bigger, and the extra pixels only matter if something is going to use them.",
      },
      {
        type: "p",
        text: "That single piece of arithmetic explains most of the confusion around this setting. Doubling the DPI quadruples the number of pixels and therefore roughly quadruples the file size, while the visible improvement on a laptop screen is often zero.",
      },

      { type: "h2", text: "Pick a number by destination, not by habit" },
      { type: "ul", items: [
        "72–96 DPI — thumbnails, previews, chat messages, slides. A 72 DPI A4 page is 595 by 842 pixels, about the size of the content area of a browser window.",
        "150 DPI — the sensible default. Sharp on a retina screen, fine for printing a one-page form on an office printer, and still small enough to email or upload.",
        "200–300 DPI — printing that will be examined, or when the image will be cropped afterwards. A 40-page document at 300 DPI can easily produce several hundred megabytes of images.",
        "600 DPI — almost never. It quadruples the size again over 300 DPI and only helps for line art that will be re-vectorised, which this tool does not do.",
      ]},
      {
        type: "p",
        text: "If you are converting one page to attach to a form, 150 DPI is the answer. If you are converting for a print shop, ask them; they will usually say 300 DPI and mean it. If you are making a preview image for a website, 96 DPI and a JPEG quality setting will look identical to 300 DPI at a fraction of the weight.",
      },

      { type: "h2", text: "JPG or PNG?" },
      {
        type: "p",
        text: "The two formats fail in opposite directions. JPEG throws away fine detail to make files small, which is invisible on photographs and obvious on text: thin letters pick up grey fringing and coloured halos. PNG keeps every pixel exactly, which makes it the right choice for typed pages, diagrams, screenshots and line drawings, at the cost of a bigger file.",
      },
      { type: "ul", items: [
        "Scanned page, photo, brochure: JPG.",
        "Typed text, table, chart, logo, anything with a sharp edge: PNG.",
        "Text on a coloured background: PNG, or JPG at a high quality setting — low quality produces visible blocking around the letters.",
        "A page that will be printed and framed: PNG at 300 DPI if the file size is acceptable, otherwise JPG at the highest quality you can afford.",
      ]},

      { type: "h2", text: "When a picture of a page is the wrong output" },
      {
        type: "p",
        text: "Converting to an image is lossy in a way that has nothing to do with compression: the text stops being text. A JPG cannot be searched, cannot be selected, cannot be read by a screen reader, and cannot be copied into a document. If the destination asked for a PDF, handing it pictures wrapped in a PDF often fails automated checks, even when the file opens fine for a human.",
      },
      {
        type: "p",
        text: "There is one workaround and it is worth naming: OCR, which reads the shapes in an image and guesses the characters. This site does not ship OCR yet, and no OCR is perfect on small print, handwriting or mixed languages. If you need searchable text from a scan, that is a separate job from converting a page to a picture.",
      },
      {
        type: "quote",
        text: "Ask what the file is for. If something needs to read the words, keep them as words.",
      },

      { type: "h2", text: "Keeping the output manageable" },
      {
        type: "p",
        text: "The page range field is the most useful control on the conversion page. One PDF converted whole at 300 DPI can fill a phone's storage; the same file converted as page 4 only is a 400 kilobyte image. You can enter a single page, a list (3, 7, 12) or ranges (1-3, 8). Each file keeps its original page number in the name, which matters when you are converting the middle of a hundred-page manual.",
      },
      { type: "ol", items: [
        "Start at 150 DPI and check one page before converting forty.",
        "Convert the pages you need, not the document.",
        "If the images are still too large to send, run them through an image converter afterwards rather than starting over.",
        "Delete the downloaded ZIP once the files are where they belong — page images are much larger than the PDF they came from.",
      ]},

      { type: "h2", text: "A note on what is flattened" },
      {
        type: "p",
        text: "Everything interactive becomes part of the picture. Hyperlinks stop being clickable, form fields stop accepting input, and buttons do nothing. Filled-in values that were visible on the page are still visible, because they are drawn; the ability to change them is gone. If the form must remain fillable, keep the PDF and do not convert it.",
      },
      {
        type: "p",
        text: "The same warning applies to annotations drawn in another app: if they are saved as page content they will render, and if they are saved as separate overlay objects the converter may or may not draw them. Check the first page of the output before sending forty pages to a client.",
      },
    ],
  },

  {
    slug: "merge-pdfs-in-the-right-order",
    title: "Merging PDFs: Order, Signatures and Fields",
    excerpt:
      "How merging works, why page order is the only thing you control, what breaks in signed or fillable files, and how to check the result before sending.",
    date: "2026-10-27",
    readingMinutes: 6,
    relatedTools: ["merge-pdf", "organize-pdf", "split-pdf"],
    featured: true,
    body: [
      { type: "h2", text: "What merging does to your files" },
      {
        type: "p",
        text: "A merge copies each document's pages, object by object, into a single new PDF and then rewrites the cross-reference table that tells every viewer where each object lives. Nothing is re-rendered and nothing is re-compressed, so the images, fonts and vector art in the output are identical to the originals. That is why a merge is fast even for large files, and why quality does not change.",
      },
      {
        type: "p",
        text: "It also explains the two things people notice afterwards. The file size of the result is roughly the sum of the inputs, because all the content is still there. And the output has one metadata record — the merging tool's — instead of the title and author of each source document. If a portal indexes documents by filename, rename the output before uploading it.",
      },

      { type: "h2", text: "Order is the only editorial decision you make" },
      {
        type: "p",
        text: "Most merge mistakes are ordering mistakes, and they are cheap to avoid if you think about who reads the result. A reviewer opens the file and expects the thing they asked for first: the signed form, then the supporting evidence, then the annexes. Alphabetical order by filename is almost never what anybody wants, but it is what you get if you drag files in from a folder view.",
      },
      { type: "ol", items: [
        "Write the intended order down before you start, using the actual filenames.",
        "Add the files, then check the numbered list the tool shows — not the drop zone.",
        "Move one file at a time; long drags in a list are where items get dropped in the wrong slot.",
        "Merge, download, and open the result. Confirm page 1 is the page you think it is.",
      ]},
      {
        type: "p",
        text: "Page numbering is the second thing to check. Each source keeps its own printed page numbers, so a merged file often shows \"1\", \"1\", \"1\" at the bottom of its first three pages. If the document needs continuous numbering, merge first and add page numbers afterwards rather than editing every source.",
      },

      { type: "h2", text: "What does not survive a merge" },
      {
        type: "p",
        text: "Page content is safe. Bookkeeping is not, and it is better to know that before a client does.",
      },
      { type: "ul", items: [
        "Bookmarks and outlines from the individual documents are not combined into one tidy table of contents. A reader that relied on the sidebar will see nothing or only the first document's outline.",
        "Form fields are carried over per page, but if two sources contain a field with the same internal name, some viewers will show one value in both places. Flatten forms before merging if that would be a problem.",
        "Digital signatures are invalidated. A signature covers the exact bytes of the file it was applied to, so any change — including adding a page in front — breaks it, and viewers will say so. To keep a signed document intact, merge everything else and leave the signed page as its own file.",
        "Page labels, article threads and cross-document links do not reliably follow their pages. A link that pointed to page 5 of document B will usually still point to page 5 of the merged file, which may now be a different page.",
        "Document-level settings come from one source only: the initial view, the metadata, and the permissions of the output are whatever the merging tool writes, not a blend.",
      ]},

      { type: "h2", text: "Encrypted files and other blockers" },
      {
        type: "p",
        text: "A PDF that needs a password to open cannot be read in the browser, so it cannot be merged. The same is true of a file that is damaged: if the reader cannot parse the page tree, the merge fails at that file rather than silently producing a broken document. Open the failing file on its own first — if it does not open, the problem is the file, not the merge.",
      },
      {
        type: "p",
        text: "Memory is the other practical limit. Merging happens in the tab, so a set of scan-heavy documents can need several hundred megabytes of RAM. On a phone, merge in groups of three or four, download each result, then merge the results. On a desktop, closing other tabs is usually enough. Nothing is sent anywhere while this happens, which is the reason the tools can work this way at all.",
      },

      { type: "h2", text: "The twenty-second check before you send it" },
      {
        type: "p",
        text: "Open the merged file and scroll through it at speed, watching for three things: a page facing the wrong way, a page count that does not match what you assembled, and a blank page where a scan failed. Then click one link if the document has any, and zoom into one dense page to confirm the text is still sharp. If it is a form someone has to fill in, click the first field.",
      },
      {
        type: "p",
        text: "If something is wrong, it is usually faster to fix the sources than the output: correct the order in the merge list and run it again, or split the offending document and merge the right pages. The tools keep nothing, so re-running from the originals always gives you a clean result.",
      },
    ],
  },
];

export const guideBySlug = (slug: string) => guides.find((guide) => guide.slug === slug);
