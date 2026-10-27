import type { Tool } from "@/lib/tool-types";

/** PDF tools that rearrange, combine or rotate existing pages. */
export const pdfOrganizeTools: Tool[] = [
  {
    slug: "merge-pdf",
    name: "Merge PDF",
    category: "pdf-tools",
    group: "organize",
    widget: "merge-pdf",
    icon: "Combine",
    tagline: "Combine several PDFs into one file, in exactly the order you choose.",
    bestFor: "You have a CV, a cover letter and certificates that a portal wants as a single PDF.",
    seoTitle: "Merge PDF Free — Combine PDF Files in Order",
    metaDescription:
      "Combine two or more PDFs into one file in your browser. Drag to reorder, keep every page intact. No upload, no sign-up, no watermark.",
    h1: "Merge PDF — Combine Files Into One Document",
    intro: [
      "Add your PDFs, drag them into the right order and download one combined document. Page sizes, text, links and form fields are copied across untouched — merging does not re-render or re-compress anything, so nothing gets blurrier and nothing gets smaller in quality.",
      "The files are read and written entirely in your browser. That matters when the documents are a passport scan, a signed contract or a medical letter: none of them leaves your device, and there is no server copy to delete afterwards.",
    ],
    bullets: [
      {
        title: "Order is yours to set",
        text: "The list you see is the page order you get. Drag entries up and down, remove one you added by mistake, or add more files halfway through — the combined document follows the list.",
      },
      {
        title: "Original quality preserved",
        text: "Pages are copied rather than reprinted: images, embedded fonts, vector graphics and annotations all survive exactly. A merged file is not a re-export.",
      },
      {
        title: "Mixed page sizes are fine",
        text: "An A4 contract plus a Letter-size certificate plus a phone-sized receipt stay at their own dimensions instead of being stretched onto one paper size.",
      },
      {
        title: "Password-protected files are flagged",
        text: "If a file is encrypted, the list says so before you start. Unlock it yourself first — this tool never breaks or removes a password.",
      },
      {
        title: "Any number of files, no queue",
        text: "Two files or twenty, they are processed locally as fast as your device allows. Nothing is queued behind other users and there is no daily cap.",
      },
      {
        title: "No watermark, no account",
        text: "The result is a plain PDF with no branding page, no footer and no login wall. You can also compress or split it afterwards with the other tools.",
      },
    ],
    steps: [
      {
        title: "Add the PDFs",
        text: "Drag them onto the dropzone, click to browse or paste from your file manager. Each file appears in the list with its size and page count.",
      },
      {
        title: "Put them in order",
        text: "Drag rows, or use the arrow buttons for keyboard and touch control. The number beside each file is its position in the finished document.",
      },
      {
        title: "Merge",
        text: "Press Merge PDF. The tool copies every page into a new document and reports the total page count and file size.",
      },
      {
        title: "Check, then download",
        text: "Open the result once and check the joins — especially where a scan meets a text page. Download it, or start over with a different order.",
      },
    ],
    limits: [
      {
        title: "Encrypted files must be unlocked first",
        text: "A PDF with a password you do not have cannot be read, so it cannot be merged. Export an unlocked copy from a viewer where you know the password, then add that copy.",
      },
      {
        title: "Bookmarks and forms are not merged intelligently",
        text: "Page content is preserved, but outlines from separate documents are not combined into one tidy table of contents, and form fields with the same name in two files may end up sharing a value in some viewers. Flatten forms before merging if that matters.",
      },
      {
        title: "Very large batches need memory",
        text: "Merging happens in RAM: a hundred-page scan-heavy set can need several hundred megabytes. On a phone, merge in groups of three or four and merge the results afterwards.",
      },
      {
        title: "No page-range selection here",
        text: "Merge takes whole documents. If you only need pages 2–5 of a file, extract them first with the page organiser, then merge.",
      },
    ],
    tips: [
      {
        title: "Job applications: CV, letter, certificates",
        text: "Most applicant tracking systems accept one attachment. Put the CV first, the cover letter second, then certificates in date order — recruiters read top down.",
      },
      {
        title: "Scans plus digital pages look uneven",
        text: "A photographed ID page next to a Word-exported page will look different. Run the scanned pages through the same margins or a light compression first so the finished document feels consistent.",
      },
      {
        title: "Name the file for the recipient",
        text: "“Smith-Jane-application-2026.pdf” is easier to handle than “merged.pdf” — rename before sending, because the receiving system often keeps your filename forever.",
      },
    ],
    faqs: [
      {
        q: "Is there a limit on how many PDFs I can merge?",
        a: "No limit set by the site. The practical ceiling is your device's memory: a dozen ordinary documents merge instantly on a phone, while hundreds of scan-heavy pages are better on a desktop.",
      },
      {
        q: "Are my PDFs uploaded while merging?",
        a: "No. The files are read with the browser's File API and combined in memory in your tab. You can watch the Network tab during a merge and see no request carrying your documents.",
      },
      {
        q: "Does merging reduce quality?",
        a: "No. Pages are copied object-for-object, so images, fonts and vector art are byte-identical to the originals. Only structural metadata is regenerated.",
      },
      {
        q: "Can I merge PDFs with different page sizes?",
        a: "Yes. Each page keeps its own size, which most viewers display as mixed sizes in one document. Printers will scale or trim; choose “fit to paper” when printing.",
      },
      {
        q: "Why does the merge button stay disabled for one file?",
        a: "Merging needs at least two documents. Add a second file, or use the page organiser if you actually want to rearrange pages inside one document.",
      },
      {
        q: "Can I merge a password-protected PDF?",
        a: "Only after you unlock it. The tool detects encryption and tells you which file is locked instead of failing silently mid-merge.",
      },
      {
        q: "Does the merged file keep links and bookmarks?",
        a: "Internal links and annotations inside each page are preserved. Document outlines are not merged into a combined table of contents.",
      },
      {
        q: "Will the result have a watermark or an extra cover page?",
        a: "Never. The output contains exactly the pages you added, in your order, with no branding.",
      },
    ],
    related: ["split-pdf", "organize-pdf", "compress-pdf"],
    inputFormats: ["PDF"],
    outputFormats: ["PDF"],
    keywords: ["merge pdf", "combine pdf", "join pdf files", "pdf merger"],
    popular: true,
    phase: 2,
    updated: "2026-10-27",
  },
  {
    slug: "split-pdf",
    name: "Split PDF",
    category: "pdf-tools",
    group: "organize",
    widget: "split-pdf",
    icon: "Scissors",
    tagline: "Split a PDF by ranges, every N pages, or into single pages — and download a ZIP.",
    bestFor: "You need to send pages 12–18 of a 60-page report, or separate a scanned bundle into files.",
    seoTitle: "Split PDF Free — Ranges or Every N Pages",
    metaDescription:
      "Split a PDF into separate files by page ranges, every N pages or one page per file. Runs in your browser, downloads as a ZIP. No upload.",
    h1: "Split PDF — Cut a Document Into Separate Files",
    intro: [
      "Choose how you want the document divided: type ranges such as 1-3, 4-8, 9-20, split every N pages, or burst it into one file per page. Every resulting file keeps its original page dimensions and quality, because pages are copied rather than re-rendered.",
      "Everything runs locally in the browser, so a confidential contract can be split before it is emailed without passing through a stranger's server. Multiple outputs are bundled into a single ZIP download.",
    ],
    bullets: [
      {
        title: "Three ways to divide",
        text: "Type ranges, split at a fixed interval (useful for 10-page chapters or 2-page invoices), or create one file per page. The page count is shown before you commit.",
      },
      {
        title: "One file per range",
        text: "Each comma-separated range becomes its own PDF, named after the source plus its range — “contract-pages-1-3.pdf”, “contract-pages-4-8.pdf”.",
      },
      {
        title: "Quality untouched",
        text: "Nothing is rasterised or recompressed, so text stays selectable and images keep their original resolution.",
      },
      {
        title: "ZIP download built in",
        text: "Ten output files arrive as one ZIP; a single range downloads directly. No extra compression is applied to the ZIP beyond storage.",
      },
      {
        title: "Validated output",
        text: "Each file is reopened before it is offered, so a page range that would produce an empty or broken PDF is reported instead of silently handing you a 0-byte file.",
      },
      {
        title: "No upload, no watermark",
        text: "The PDF is opened with pdf-lib in your tab, split in memory and written back to your disk. There is no server copy and no branding added.",
      },
    ],
    steps: [
      {
        title: "Add the PDF",
        text: "Drop one file onto the dropzone. The page count appears immediately so you can plan the ranges.",
      },
      {
        title: "Pick a split mode",
        text: "Ranges for precise control, “every N pages” for equal chunks, or single pages to burst the whole document.",
      },
      {
        title: "Check the preview line",
        text: "The tool lists exactly which pages will go into which file, for example “2 files: 1–3, 4–18”. Adjust until it matches what you need.",
      },
      {
        title: "Split and download",
        text: "Press Split PDF. Download the ZIP when there are several results, or save the single file if your ranges produced one.",
      },
    ],
    limits: [
      {
        title: "It does not compress",
        text: "Splitting a 40 MB document into four files still totals 40 MB, because the pages are copied as they are. Compress the parts afterwards if you need them small.",
      },
      {
        title: "Ranges must stay inside the document",
        text: "A range that runs past the last page is rejected with the real page count, rather than producing a file with fewer pages than you asked for.",
      },
      {
        title: "No OCR for scanned splits",
        text: "If the source is a scan, the split files are still scans. Searching them needs OCR, which is not part of this tool.",
      },
      {
        title: "Encrypted PDFs need unlocking first",
        text: "Password-protected files cannot be read here. The page count check will tell you before you waste time on ranges.",
      },
      {
        title: "Every split re-saves the pages",
        text: "Pages are copied into the new file rather than recompressed, which keeps quality identical to the source, but each output file still carries its own copy of shared resources such as embedded fonts. Splitting a 200-page scan into 200 single pages therefore uses noticeably more disk space in total than the original, even though not a single pixel changed.",
      },
    ],
    tips: [
      {
        title: "Invoices and statements",
        text: "A single 48-page annual statement from a bank is usually 12 monthly statements of four pages. Split every 4 pages to recover the individual documents.",
      },
      {
        title: "Sending one chapter from a report",
        text: "Extract the chapter as a range instead of sending the whole report. Recipients get a file small enough for email and you avoid sharing the rest.",
      },
      {
        title: "Burst then rename",
        text: "One-page-per-file is the fastest way to file scanned receipts: split, then rename the files to match your bookkeeping references while they are still small.",
      },
      {
        title: "Keep the original",
        text: "Splitting never modifies your source file. Keep it until you have confirmed the parts contain what you expected.",
      },
    ],
    faqs: [
      {
        q: "How do I split a PDF into single pages?",
        a: "Choose “One file per page”. Every page becomes a separate PDF, and all of them are delivered in one ZIP download.",
      },
      {
        q: "Can I extract just one page?",
        a: "Yes. Use ranges and type a single page number, such as 7. One page, one file, no ZIP.",
      },
      {
        q: "Does splitting keep the page size and quality?",
        a: "Completely. Pages are copied, not re-rendered, so the split files look and behave exactly like the corresponding pages of the original.",
      },
      {
        q: "Are the split files compressed?",
        a: "No. Each output is the same size as its share of the original. Use the PDF compressor afterwards if size matters.",
      },
      {
        q: "Is my document uploaded?",
        a: "No. The file is read locally and split in memory. There is no upload step and the result never passes through a server.",
      },
      {
        q: "Can I split several PDFs at once?",
        a: "One document per run keeps the range logic unambiguous and the output names clear. Run the tool again for the next file — it takes seconds.",
      },
      {
        q: "What happens if my range is wrong?",
        a: "You get a specific message, for example “This PDF has 18 pages, so 20-24 is out of range”, and no files are produced.",
      },
      {
        q: "Does it work on a phone?",
        a: "Yes, in Safari and Chrome. Large scanned documents may need a desktop, but ordinary reports split fine on a phone.",
      },
    ],
    related: ["merge-pdf", "organize-pdf", "compress-pdf"],
    inputFormats: ["PDF"],
    outputFormats: ["PDF"],
    keywords: ["split pdf", "pdf splitter", "extract pages from pdf", "separate pdf pages"],
    popular: true,
    phase: 2,
    updated: "2026-10-27",
  },
  {
    slug: "organize-pdf",
    name: "Organize PDF Pages",
    shortName: "Organize pages",
    category: "pdf-tools",
    group: "organize",
    widget: "page-organizer",
    icon: "LayoutGrid",
    tagline: "Delete, extract, reorder and rotate pages on a thumbnail grid you can drag.",
    bestFor: "A scanned bundle is out of order and you need to drop the blank pages before sending it.",
    seoTitle: "Organize PDF Pages — Delete, Reorder, Rotate",
    metaDescription:
      "Drag page thumbnails to reorder, delete blank pages, rotate individual pages and export a clean PDF. Free, in your browser, nothing uploaded.",
    h1: "Organize PDF Pages — Delete, Reorder and Rotate",
    intro: [
      "Every page of your PDF appears as a thumbnail. Drag them into the right order, delete the ones you do not need, rotate a sideways scan, then export a single clean document. It is the same idea as rearranging printed sheets on a table, without reprinting anything.",
      "The rendering happens locally with pdf.js and the writing with pdf-lib, so a 200-page document stays on your device. No page is re-encoded, which means text remains selectable and images keep full resolution.",
    ],
    bullets: [
      {
        title: "Thumbnails, not page numbers",
        text: "You see what each page actually looks like, so you can spot the blank scan, the duplicate page or the sideways receipt without opening a separate viewer.",
      },
      {
        title: "Drag to reorder",
        text: "Drag a thumbnail to a new position on desktop, or use the move buttons on a phone. The new order is applied exactly as shown.",
      },
      {
        title: "Delete without fear",
        text: "Removing a page only affects the new copy. The original file is never modified, so you can start over without re-uploading anything.",
      },
      {
        title: "Rotate individual pages",
        text: "A single rotated page in a scanned bundle is common. Rotate just that page by 90° steps — the rest of the document is untouched.",
      },
      {
        title: "Extract a subset",
        text: "Delete everything you do not want and download the remainder, or use Split PDF when you need the removed pages as their own file.",
      },
      {
        title: "Honest about big files",
        text: "Thumbnails are rendered up to a limit to protect memory. For very long documents the grid tells you when it is showing a reduced set.",
      },
    ],
    steps: [
      {
        title: "Open the PDF",
        text: "Drop the file in. Thumbnails appear as they render — a 100-page document takes a few seconds on a laptop.",
      },
      {
        title: "Reorder and remove",
        text: "Drag pages into position, press the bin icon to drop a page, or use the rotate control on any thumbnail that is sideways.",
      },
      {
        title: "Export",
        text: "Press Apply and download. The tool reports how many pages went in and how many came out.",
      },
      {
        title: "Verify the first and last page",
        text: "Open the result and check the beginning and end. Those are where an accidental deletion or duplicate is easiest to notice.",
      },
    ],
    limits: [
      {
        title: "Whole pages only",
        text: "You can move and rotate pages, not crop or edit their contents. Text changes belong in the PDF editor, which annotates on top of the page.",
      },
      {
        title: "Thumbnail limits on long documents",
        text: "Rendering hundreds of thumbnails would exhaust a phone's memory, so the grid caps how many it draws at once. Export still uses every page.",
      },
      {
        title: "Bookmarks can point to the old order",
        text: "If the source has an outline, its entries are not recalculated. Most readers simply show the pages in the new order.",
      },
      {
        title: "No form-field repair",
        text: "Interactive forms survive page moves, but fields that spanned two pages may behave oddly in some viewers.",
      },
    ],
    tips: [
      {
        title: "Sort scans before you scan again",
        text: "Reordering a stack of scans takes seconds; re-scanning 40 pages takes ten minutes. Always fix the order afterwards instead of fighting the scanner.",
      },
      {
        title: "Remove blank backs of forms",
        text: "Double-sided forms scanned single-sided create alternating blank pages. Delete them to halve the page count before emailing.",
      },
      {
        title: "Put the signature page last",
        text: "When a contract is signed on a separate sheet, move it to the end so the recipient sees the full agreement before the signature.",
      },
      {
        title: "Rotate first, compress last",
        text: "Rotation is metadata and costs nothing. Apply it before compression so the tool does not rasterise pages at the wrong orientation.",
      },
      {
        title: "Keep a master copy before you shuffle",
        text: "The organiser writes a brand-new file, so nothing you do here can damage the original. Still, keep the untouched file until the recipient confirms they received the version you meant to send, because page order is the detail people notice last and complain about first.",
      },
      {
        title: "Scan as one document when the order matters",
        text: "If a scanner already outputs pages in the right sequence, do not reverse them by hand — check the finished page numbers in the preview strip before exporting. Reordering a 60-page report by dragging is slower and more error-prone than fixing the scan settings once.",
      },
    ],
    faqs: [
      {
        q: "Can I delete pages from a PDF for free?",
        a: "Yes. Delete as many as you like, download the result, and there is no watermark, page limit or sign-up.",
      },
      {
        q: "Does this change my original file?",
        a: "No. Your file is only read. The download is a new document built from the pages you kept.",
      },
      {
        q: "Can I undo a deletion?",
        a: "Press the undo control on the page, or use “Start over” — the original is still in memory until you leave the page, so nothing is lost.",
      },
      {
        q: "Can I rotate only one page?",
        a: "Yes. Each thumbnail has its own rotate control, so a single sideways page can be fixed without touching the others.",
      },
      {
        q: "Does reordering hurt quality?",
        a: "No. Pages are copied as they are. Only the page tree changes.",
      },
      {
        q: "How large a PDF can I organise?",
        a: "Rendering thumbnails is the heavy part. Up to about 200 pages works on a modern laptop; on a phone, 50 pages is a comfortable limit.",
      },
      {
        q: "Can I extract pages to a separate file?",
        a: "Yes — either delete the rest and download, or use Split PDF with a range to produce a new file containing only those pages.",
      },
      {
        q: "Is anything uploaded while I work?",
        a: "No. Rendering and writing both happen in your browser tab.",
      },
    ],
    related: ["split-pdf", "rotate-pdf", "merge-pdf"],
    inputFormats: ["PDF"],
    outputFormats: ["PDF"],
    keywords: ["delete pdf pages", "reorder pdf", "pdf page organizer", "extract pdf pages", "rotate pdf pages"],
    popular: true,
    phase: 2,
    updated: "2026-10-27",
  },
  {
    slug: "rotate-pdf",
    name: "Rotate PDF",
    category: "pdf-tools",
    group: "organize",
    widget: "rotate-pdf",
    icon: "RotateCw",
    tagline: "Fix sideways scans by rotating all pages, or only the ones that need it.",
    bestFor: "A scanner saved every page landscape, or one page arrived upside down.",
    seoTitle: "Rotate PDF Free — Turn Pages 90° or 180°",
    metaDescription:
      "Rotate a PDF permanently: all pages or a selection, 90°, 180° or 270°. Runs in your browser with no upload and no quality loss.",
    h1: "Rotate PDF — Turn Pages the Right Way Up",
    intro: [
      "Rotate the whole document by 90, 180 or 270 degrees, or fix just the pages that are wrong. Rotation is stored in the PDF's page dictionary, so the file is not re-rendered: text stays selectable and images keep their full quality.",
      "The corrected file opens upright in Acrobat, Preview, Chrome, on phones and in print dialogs, because the rotation is part of the document rather than a temporary view setting.",
    ],
    bullets: [
      {
        title: "Whole document or selected pages",
        text: "Most fixes are “everything is landscape”. When one page is upside down, select only that page and rotate it 180°.",
      },
      {
        title: "Real rotation, not a view hint",
        text: "The page's rotation value is written into the file. Other people will see it upright even if they open it in a different application.",
      },
      {
        title: "No quality loss",
        text: "Nothing is rasterised. Text, vectors and images are untouched — the only change is an angle in the page dictionary.",
      },
      {
        title: "90°, 180°, 270°",
        text: "Choose any of the three, and combine them by running the tool again. 90 twice is 180, which the tool reports after each run.",
      },
      {
        title: "Page preview list",
        text: "Each page is listed with its current rotation so you can select precisely the pages that need turning.",
      },
      {
        title: "Local, free, no watermark",
        text: "The file is read from your disk and written back to it. There is no upload, no account and no mark on the pages.",
      },
    ],
    steps: [
      {
        title: "Add the PDF",
        text: "Drop the file on the dropzone. The page count and current rotations are listed.",
      },
      {
        title: "Choose the angle",
        text: "90° clockwise for landscape scans that should be portrait, 180° for upside-down pages, 270° for the opposite direction.",
      },
      {
        title: "Choose the pages",
        text: "Leave “all pages” selected, or tick individual pages. A range input accepts values such as 1-3, 7.",
      },
      {
        title: "Rotate and download",
        text: "Press Rotate PDF, check the first affected page in your viewer, then save the corrected file.",
      },
    ],
    limits: [
      {
        title: "Rotation applies to the whole page",
        text: "If a scan contains two documents side by side, rotating turns both. Cropping them apart needs a different tool.",
      },
      {
        title: "It does not detect orientation automatically",
        text: "Guessing the right way up needs OCR plus heuristics and gets it wrong often enough to be annoying. You choose the angle, so it is always right.",
      },
      {
        title: "Annotations rotate with the page",
        text: "Text boxes and stamps added earlier follow the page rotation. Check a signed page after rotating it.",
      },
      {
        title: "Password-protected files",
        text: "Encrypted documents cannot be read here; unlock them in a viewer you have the password for first.",
      },
      {
        title: "Rotation stores an instruction, not new pixels",
        text: "The page content is untouched; a rotation value is written next to it. A viewer that ignores page rotation would show the page as it was, which is why some very old or very minimal readers display rotated pages upright anyway. Every current viewer, printer driver and phone honours the value.",
      },
    ],
    tips: [
      {
        title: "Fix the scanner setting, not the output",
        text: "If you scan often, set the device to auto-detect orientation. Correcting pages afterwards works, but fixing it at capture saves a step every time.",
      },
      {
        title: "Check the page, not just the document",
        text: "Mixed orientation is common in bundles of receipts. Use the page list rather than rotating everything, which would break the upright pages.",
      },
      {
        title: "Rotate before adding page numbers",
        text: "Numbering a rotated page can place the number along the wrong edge in some viewers. Rotate first, then add numbers.",
      },
      {
        title: "Scanning double-sided sheets",
        text: "A duplex scanner fed landscape documents often produces upside-down back pages. Rotate every second page by 180° instead of re-scanning: the fix takes seconds and leaves the text perfectly sharp, whereas a scan at a lower setting would soften it.",
      },
      {
        title: "Check the first page, not the last",
        text: "Open the exported file and look at the page you rotated while you still remember what it should look like. Rotation is a visual change, so a wrong direction is easy to miss when you flick through quickly.",
      },
      {
        title: "Keep signatures and stamps upright",
        text: "If a scanned contract contains a handwritten signature on a sideways page, rotating the page also rotates the signature, which is usually exactly what you want — the finished document reads in one direction.",
      },
    ],
    faqs: [
      {
        q: "Is the rotation permanent?",
        a: "Yes. The angle is written into the PDF, so the document opens upright for anyone, in any viewer, and prints correctly.",
      },
      {
        q: "Will rotating reduce quality?",
        a: "No. Pages are not re-rendered; only the rotation value changes. Text stays sharp and selectable, and images are untouched.",
      },
      {
        q: "Can I rotate only one page?",
        a: "Yes. Select individual pages or type a range such as 4 or 2-3, then rotate.",
      },
      {
        q: "Can I rotate 180 degrees?",
        a: "Yes — 180° is one of the three options, useful for pages scanned upside down.",
      },
      {
        q: "Does it work with scans?",
        a: "Especially well: scanned pages are usually the ones that come out sideways, and rotation avoids re-encoding them.",
      },
      {
        q: "Is my PDF uploaded?",
        a: "No. The document is opened and rewritten inside your browser tab.",
      },
      {
        q: "What if I rotate the wrong way?",
        a: "Rotate again with the opposite angle, or start over — the original file is unchanged until you replace it.",
      },
    ],
    related: ["organize-pdf", "page-numbers-pdf", "compress-pdf"],
    inputFormats: ["PDF"],
    outputFormats: ["PDF"],
    keywords: ["rotate pdf", "turn pdf pages", "fix sideways pdf", "rotate pdf 90 degrees"],
    phase: 2,
    updated: "2026-10-27",
  },
];
