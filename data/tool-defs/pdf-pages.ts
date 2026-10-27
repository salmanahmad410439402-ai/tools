import type { Tool } from "@/lib/tool-types";

/** Page-level surgery: delete, extract, rebuild. */
export const pdfPageTools: Tool[] = [
  {
    slug: "remove-pages-from-pdf",
    name: "Remove Pages From PDF",
    shortName: "Remove Pages",
    category: "pdf-tools",
    group: "organize",
    widget: "remove-pages",
    icon: "Trash2",
    tagline: "Click the pages you do not want, download the rest — no reprinting, no quality loss.",
    bestFor: "A scanned bundle contains blank backs, duplicates or an advert page you need gone.",
    seoTitle: "Remove Pages From PDF — Delete Pages Free",
    metaDescription:
      "Delete pages from a PDF in your browser. Tap thumbnails or type a range, then download the rest. No upload, no watermark, original quality kept.",
    h1: "Remove Pages From PDF — Delete the Pages You Do Not Need",
    intro: [
      "Load the PDF, tap every page you want gone — or type a range like 2, 5-7 — and download a document that simply does not contain them. The pages you keep are copied byte for byte, so text stays selectable and photos keep their original compression.",
      "Because the file never leaves your device, this works on contracts, payslips and medical letters without handing a copy to a stranger's server.",
    ],
    bullets: [
      {
        title: "Tap to delete, with a real preview",
        text: "Every page is rendered as a thumbnail, so you are deleting what you can see rather than guessing from page numbers. Selected pages turn red with a count at the bottom.",
      },
      {
        title: "A range box for long documents",
        text: "Nobody wants to click through a 300-page report. Type 4-9, 12, 40-51 and press Apply to select those pages in one go, then confirm the count before exporting.",
      },
      {
        title: "Survivors are copied, not re-rendered",
        text: "Kept pages are lifted from the original file object by object. Nothing is re-compressed and nothing is flattened, so the output is visually identical to the source.",
      },
      {
        title: "Pages stay in their original order",
        text: "Deleting page 4 of 10 does not shuffle the rest. The sequence you see in the preview is the sequence in the download.",
      },
      {
        title: "One guard rail that matters",
        text: "The tool refuses to output a zero-page file, because a PDF with no pages will not open in most viewers and looks like a download failure.",
      },
    ],
    steps: [
      {
        title: "Add the PDF",
        text: "Drop the file on the page or click to choose it. The page count is read immediately and thumbnails start rendering.",
      },
      {
        title: "Mark the pages to delete",
        text: "Tap thumbnails, or type a range and press Apply. The line underneath shows exactly which pages will be removed.",
      },
      {
        title: "Check the numbers",
        text: "The counter reads “Removing 2-3, 7 · 11 of 14 pages stay”. If that is not what you meant, tap Clear and start again.",
      },
      {
        title: "Download",
        text: "Press Remove pages and download. The new file is written in your tab and saved with a -pages-removed suffix so it cannot overwrite your original.",
      },
    ],
    limits: [
      {
        title: "Deleted means gone from the new file",
        text: "There is no undo in the download, so keep the original until you have checked the result. The tool never modifies your source file, which is the safety net.",
      },
      {
        title: "Huge documents need patience",
        text: "Thumbnails are rendered one page at a time in your browser. A 500-page scan can take a minute to preview, and the range box is the faster route for documents that size.",
      },
      {
        title: "Encrypted files must be unlocked first",
        text: "A password-protected PDF is refused with an explanation. Open it once in a viewer where you know the password, export an unlocked copy, then delete pages from that.",
      },
    ],
    tips: [
      {
        title: "Remove the blank backs of scans",
        text: "A duplex scanner fed single-sided pages produces a blank sheet after every real page. Deleting every second page halves the file and makes the document read straight through.",
      },
      {
        title: "Strip adverts from downloaded statements",
        text: "Bank and utility exports often end with a promotional page. Removing it keeps the transaction history intact while dropping the marketing material before you forward it.",
      },
      {
        title: "Deleting pages is not redaction",
        text: "If a page contains one confidential sentence, deleting the whole page is the safe move — but text elsewhere in the file is untouched. For information inside a page that must stay, real redaction is a different job.",
      },
    ],
    faqs: [
      {
        q: "Does removing pages reduce the file size?",
        a: "Usually, and often by more than expected, because each page drags its own images and fonts with it. A 40-page scan reduced to 30 pages typically loses about a quarter of its weight. Pages left in place are untouched, so quality never drops.",
      },
      {
        q: "Can I remove pages from several PDFs at once?",
        a: "This tool handles one document at a time. If you need to merge first, delete after, the order that works is: combine in Merge PDF, then remove the pages you do not want from the combined file.",
      },
      {
        q: "Will the page numbers inside the document change?",
        a: "No. Any numbers printed on the page are part of the page content and stay exactly as they were, so a document numbered 1–20 keeps its printed numbers even if you delete pages 4 and 5. If you need numbering that follows the new order, add numbers after removing pages.",
      },
      {
        q: "What happens to links and bookmarks pointing at deleted pages?",
        a: "Links to removed pages are dropped by the writer, and internal bookmarks that survive still work. External web links on the kept pages are preserved.",
      },
      {
        q: "Can I delete the first or last page?",
        a: "Yes — any page, including covers and signature pages. The only restriction is that at least one page has to remain, since a PDF with no pages is not a usable document.",
      },
      {
        q: "Is this safe for confidential documents?",
        a: "Yes, in the sense that matters: the file is read and written inside your browser tab and never uploaded, so there is no server that could keep a copy. You can confirm it in the Network tab of your browser's developer tools.",
      },
    ],
    related: ["extract-pages-from-pdf", "organize-pdf", "split-pdf"],
    inputFormats: ["PDF"],
    outputFormats: ["PDF"],
    keywords: ["remove pages from pdf", "delete pages from pdf", "remove pdf pages online", "delete blank pages pdf"],
    popular: true,
    phase: 2,
    updated: "2026-10-27",
  },
  {
    slug: "extract-pages-from-pdf",
    name: "Extract Pages From PDF",
    shortName: "Extract Pages",
    category: "pdf-tools",
    group: "organize",
    widget: "extract-pages",
    icon: "Scissors",
    tagline: "Pick the pages worth keeping and save them as a new, smaller PDF.",
    bestFor: "A 60-page report contains the four pages you actually need to send on.",
    seoTitle: "Extract Pages From PDF — Save a Range Free",
    metaDescription:
      "Extract pages from a PDF in your browser. Tap thumbnails or type a range and download a new file with just those pages, in order. No upload.",
    h1: "Extract Pages From PDF — Save Only the Pages You Need",
    intro: [
      "This is the mirror image of deleting: mark the pages you want to keep and download a new document containing only those, in their original order and at their original quality.",
      "It is the fastest way to turn a 60-page annual report into the six pages someone asked for, or to pull a single signed page out of a contract.",
    ],
    bullets: [
      {
        title: "Keep-selection, not delete-selection",
        text: "Marking what you want is safer than marking what you do not: if you miss a page in a keep list, you see it missing in the count before you download.",
      },
      {
        title: "Typed ranges for big documents",
        text: "Enter 3-8, 12 and press Apply to select a run of pages instantly — much faster than clicking through 200 thumbnails.",
      },
      {
        title: "Order is preserved, never sorted",
        text: "Pages come out in document order even if you tapped them out of order, so a report keeps reading correctly.",
      },
      {
        title: "Original quality, no re-render",
        text: "Extraction copies the page objects themselves. Text stays selectable, images keep their compression and vectors stay vectors.",
      },
      {
        title: "A genuinely smaller file",
        text: "Only the resources used by the kept pages travel with them, which is why a six-page extraction from a scanned report can be a tenth of the original size.",
      },
    ],
    steps: [
      {
        title: "Add the PDF",
        text: "Drop the document in. The page count appears straight away and thumbnails load as you scroll.",
      },
      {
        title: "Select the pages to keep",
        text: "Tap the thumbnails, or type a range such as 2-4, 9 and press Apply. Selected pages turn indigo.",
      },
      {
        title: "Read the summary line",
        text: "“Keeping 2-4, 9 · 4 of 62 pages” confirms the selection before anything is written.",
      },
      {
        title: "Download the extract",
        text: "Press Extract pages and download. The file is named after the original with a -pages suffix so the source stays untouched.",
      },
    ],
    limits: [
      {
        title: "Extraction is not compression",
        text: "The pages keep their full quality, so extracting half of an image-heavy document does not halve the file — it removes what only the other pages needed. To shrink further, run the result through Compress PDF.",
      },
      {
        title: "Forms and signatures may lose their context",
        text: "If you extract a page from a signed or form-filled document, the extracted page keeps what is drawn on it. Interactive form fields that span pages are not guaranteed to survive extraction.",
      },
      {
        title: "Password-protected files are refused",
        text: "Unlock the file in a viewer you have the password for, then extract from the unlocked copy.",
      },
    ],
    tips: [
      {
        title: "Pull the signature page out of a contract",
        text: "Send only the executed page when someone asks for proof of signature. It is smaller, quicker to read and does not expose commercial terms that are not their business.",
      },
      {
        title: "Extract a chapter, not a re-export",
        text: "Rebuilding a chapter by re-exporting from Word costs you the typography. Extracting the pages keeps the document exactly as designed.",
      },
      {
        title: "Extract before you compress",
        text: "Compressing first wastes work on pages you are about to drop. Extract, then compress the smaller file for the best final size.",
      },
      {
        title: "Extracting a single page? Use the page number, not the thumbnails",
        text: "On a long document the thumbnail strip takes longer to render than the extraction itself. Typing the page number and pressing Apply skips that wait entirely, and the summary line still confirms which page you are taking before the file is written, so the shortcut costs you nothing in certainty.",
      },
    ],
    faqs: [
      {
        q: "How is this different from Split PDF?",
        a: "Split produces several files from one document — by ranges, by fixed chunk size or one file per page. Extract produces a single file containing only the pages you picked. Use extract for “just these pages”, split for “break this into parts”.",
      },
      {
        q: "Can I extract pages into a new PDF and keep the bookmarks?",
        a: "Bookmarks that point inside the selected pages are kept where the writer can resolve them; bookmarks pointing at pages you did not take are dropped. The visible page content is always identical to the source.",
      },
      {
        q: "Does extracting pages keep the original page size?",
        a: "Yes. Each page keeps its own width and height, so a document that mixes A4 and landscape pages produces an extract with the same mixture, not a uniform file.",
      },
      {
        q: "Can I extract pages from a scanned PDF?",
        a: "Yes — every page is copied as an image. The extracted text will still not be selectable, because scanned pages are pictures of text. If you need the words, PDF to TXT will tell you whether a text layer exists at all.",
      },
      {
        q: "What is the maximum number of pages?",
        a: "There is no hard cap. Practical limits depend on device memory: a few hundred pages is comfortable on a laptop, while a phone handles smaller documents more smoothly.",
      },
      {
        q: "Are my pages uploaded anywhere?",
        a: "No. Parsing and writing happen in the tab with pdf-lib, and you can watch the Network tab while it runs — no request carries the document.",
      },
      {
        q: "Can I keep the original file untouched while extracting?",
        a: "Yes. The source is opened read-only and never rewritten, so the extraction is a new file with its own name. That means you can extract a second, different set of pages from the same document without reloading it, and the original stays exactly as it arrived, including its metadata and signatures.",
      },
    ],
    related: ["remove-pages-from-pdf", "split-pdf", "organize-pdf"],
    inputFormats: ["PDF"],
    outputFormats: ["PDF"],
    keywords: ["extract pages from pdf", "extract pdf pages", "save pages from pdf", "pdf page extractor"],
    phase: 2,
    updated: "2026-10-27",
  },
  {
    slug: "repair-pdf",
    name: "Repair PDF",
    shortName: "Repair",
    category: "pdf-tools",
    group: "optimize",
    widget: "repair-pdf",
    icon: "Wrench",
    tagline: "Rebuild a damaged PDF structure so a stubborn file opens again.",
    bestFor: "A download stopped early, or an old file reports “cannot open” in every viewer.",
    seoTitle: "Repair PDF Free — Fix a PDF That Will Not Open",
    metaDescription:
      "Rebuild a damaged PDF in your browser: repair the cross-reference table, drop duplicate objects, remove stale edit history. Free, private, no upload.",
    h1: "Repair PDF — Rebuild a File That Will Not Open",
    intro: [
      "PDFs break in boring, predictable ways: a transfer that stopped at 98%, an editor that wrote a second copy of every object, a cross-reference table pointing at offsets that no longer exist. Repair reads what is actually in the file and writes a clean, complete document from it.",
      "The tool then re-opens its own output and checks the page count, so you find out here — not in front of the person you are sending it to.",
    ],
    bullets: [
      {
        title: "Lenient parsing, strict output",
        text: "The reader recovers objects even when the file's index is wrong, then writes a brand-new file with a correct cross-reference table instead of patching the old one.",
      },
      {
        title: "Drops the usual bloat",
        text: "Embedded page thumbnails, orphaned objects and accumulated incremental-update history are removed. Old files often shrink noticeably after a rebuild.",
      },
      {
        title: "Page count is verified, not assumed",
        text: "The rebuilt file is parsed again before download. If the page count does not match, nothing is offered — you get an explanation instead of a silently truncated document.",
      },
      {
        title: "A straight answer when nothing is wrong",
        text: "If the file was already structurally sound, the repair writes an equivalent file and says so. A clean bill of health is useful information too.",
      },
      {
        title: "Works on the file other tools refuse",
        text: "A file that throws an “invalid PDF structure” error in an editor will often load here, because the parser is deliberately forgiving about damage.",
      },
    ],
    steps: [
      {
        title: "Add the damaged file",
        text: "Drop the PDF in. If it cannot be parsed at all, you will know within a second and the message will say why.",
      },
      {
        title: "Read what repair can and cannot do",
        text: "The panel above the button lists the four problems a browser can genuinely fix, and the one it cannot: missing bytes.",
      },
      {
        title: "Rebuild",
        text: "Press Repair this PDF. The file is parsed, rebuilt and re-opened in the same tab.",
      },
      {
        title: "Check the report",
        text: "You get the page count, what was removed and the before/after size — plus a download if the result verified.",
      },
    ],
    limits: [
      {
        title: "Repair cannot invent missing data",
        text: "If a download stopped halfway, the missing pages were never in the file you hold. Repair recovers everything up to the last intact object; it cannot reconstruct what a server never sent.",
      },
      {
        title: "Zeroed files stay broken",
        text: "A file whose bytes are all zeros — which happens with failing drives and interrupted disk writes — contains no PDF at all. Nothing can be recovered from it.",
      },
      {
        title: "Passwords are not removed",
        text: "An encrypted PDF stays encrypted. Repairing a locked file needs the password first, and this tool will not attempt to break it.",
      },
    ],
    tips: [
      {
        title: "Re-download before you repair",
        text: "Half of all “corrupt” PDFs are simply incomplete downloads. Fetch the file again, check the size matches the sender's, and only then reach for a repair tool.",
      },
      {
        title: "Try a different viewer to diagnose",
        text: "If a file opens in one viewer and not another, it is usually a damaged index rather than missing content — exactly the case a rebuild fixes. If no viewer opens it, expect less.",
      },
      {
        title: "Rebuild before compressing old archives",
        text: "Decades-old PDFs accumulate edit history and thumbnails. A rebuild often removes more weight than compression would, without touching the page images.",
      },
      {
        title: "Keep the damaged original next to the repair",
        text: "Repair produces a new file and never edits the source. If the result turns out to be missing the page you needed, you still have the original to try a different route with — a different viewer, a re-download, or asking the sender for a fresh copy before the trail goes cold.",
      },
      {
        title: "Watch for the second repair succeeding",
        text: "Some files fail because two problems stack: a broken trailer and an unreadable object stream. If the first attempt reports that no pages were found, the file may still be recoverable by a desktop tool that can guess the page tree; it is worth trying before you give up on the content.",
      },
    ],
    faqs: [
      {
        q: "Will repair recover my missing pages?",
        a: "Only if their data is still in the file. Repair rebuilds the structure around the objects that exist; it cannot re-create a page whose bytes were never written or were overwritten. If the page count after repair is lower than expected, the original was genuinely truncated.",
      },
      {
        q: "Is a repaired file identical to the original?",
        a: "The page content is byte-identical, because pages are copied rather than re-rendered. What changes is the surrounding structure: the file is written fresh, so object numbering, compression streams and any orphaned data differ.",
      },
      {
        q: "Why did the repaired file get smaller?",
        a: "Most often because stale incremental updates and embedded page thumbnails were dropped. Some files that have been edited dozens of times carry several complete copies of their content streams.",
      },
      {
        q: "Does this work on a PDF that says “file is damaged and could not be repaired” in Acrobat?",
        a: "Sometimes. Acrobat's message usually means the trailer or cross-reference table is broken, which this tool rewrites. If the content streams themselves are corrupted, no repair tool can rebuild them.",
      },
      {
        q: "Can I repair several files at once?",
        a: "One at a time, deliberately. Repair reports what it found per file, and a batch would hide the detail you need to judge whether the result is trustworthy.",
      },
      {
        q: "Is my file uploaded while repairing?",
        a: "No. The file is read through the browser's File API and rebuilt in memory. Nothing is transmitted, so even a confidential damaged document stays on your machine.",
      },
    ],
    related: ["compress-pdf", "merge-pdf", "pdf-metadata"],
    inputFormats: ["PDF"],
    outputFormats: ["PDF"],
    keywords: ["repair pdf", "fix corrupted pdf", "pdf file damaged", "rebuild pdf structure"],
    isNew: true,
    phase: 2,
    updated: "2026-10-27",
  },
];
