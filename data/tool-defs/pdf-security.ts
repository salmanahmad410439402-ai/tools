import type { Tool } from "@/lib/tool-types";

/** Password protection, OCR and the two Office export tools (step 6). */
export const pdfSecurityTools: Tool[] = [
  {
    slug: "protect-pdf",
    name: "Protect PDF",
    shortName: "Protect PDF",
    category: "pdf-tools",
    group: "security",
    widget: "protect-pdf",
    icon: "Lock",
    tagline: "Encrypt a PDF with an open password and choose what readers may do with it.",
    bestFor: "You are emailing a contract, a statement or an ID and want the file itself to ask for a password.",
    seoTitle: "Protect PDF — Add a Password (AES-256)",
    metaDescription:
      "Add an AES-256 password and permission flags to a PDF in your browser. Choose printing, copying and editing rights. No upload, no account, no watermark.",
    h1: "Protect PDF — Add a Password to Your Document",
    intro: [
      "Drop a PDF in, type the password you want it to ask for, decide whether readers may print, copy, edit or comment, and download the encrypted copy. The encryption happens in this tab: the file is not uploaded, and no copy of it is kept anywhere.",
      "The cipher is AES-256 — the one the PDF standard recommends (ISO 32000-2), and the same class of protection Acrobat applies when you use File → Protect Using Password. Every object in the document is encrypted, including its metadata and embedded images, not just the opening screen.",
      "Be clear about what a password can and cannot do. It stops the file being opened without it. It does not stop somebody who can already see the page from photographing the screen, and the permission ticks are a request that most readers honour rather than a hard technical barrier.",
    ],
    bullets: [
      {
        title: "AES-256 encryption",
        text: "The strongest cipher in the PDF standard, applied to every object. Old RC4 encryption is deliberately not offered: it is broken and gives a false sense of safety.",
      },
      {
        title: "Two passwords if you want them",
        text: "The user password opens the file. An optional owner password opens it with full rights and ignores the permission ticks — the setup most offices use for internal documents.",
      },
      {
        title: "Four permission flags",
        text: "Allow or block printing, copying text, editing the content and adding comments. The panel tells you in plain English what the combination means before you commit.",
      },
      {
        title: "Nothing leaves the tab",
        text: "The page you are reading has no server handling your file. Encryption runs in JavaScript, so the same tool works on a plane and on a locked-down office laptop.",
      },
      {
        title: "Pages are untouched",
        text: "Text, fonts, images, links and bookmarks survive exactly as they were. Only the trailer and the object streams change.",
      },
      {
        title: "A clear warning before you close the tab",
        text: "There is no recovery route, so the result panel says so — store the password before you move on.",
      },
    ],
    steps: [
      {
        title: "Drop the PDF in",
        text: "One file at a time, up to 200 MB. The page count and size are read locally so you can confirm you have the right document.",
      },
      {
        title: "Type the password twice",
        text: "Use the eye button to check what you typed. Passwords are case-sensitive and can contain spaces.",
      },
      {
        title: "Choose the permissions",
        text: "Tick what a reader should be allowed to do. Printing is on by default; copying, editing and commenting are off.",
      },
      {
        title: "Protect and download",
        text: "Press Protect PDF, then open the result once to confirm it asks for the password. That single check has saved more embarrassment than any other step.",
      },
    ],
    limits: [
      {
        title: "Permission ticks are advisory",
        text: "PDF permission flags are read by Acrobat, Preview, Chrome and most corporate tools, but a determined person with a PDF library can ignore them. The open password is the real lock; treat the ticks as guidance for honest readers.",
      },
      {
        title: "There is no password recovery",
        text: "Not here and nowhere else. If you forget the password, the file is unreadable — that is what encryption means. Keep the unencrypted original until you are sure.",
      },
      {
        title: "It cannot protect what is already visible",
        text: "A password stops opening, not photographing. If the screen is being shared or the printed page is on a desk, the content is out.",
      },
      {
        title: "Already-encrypted files are refused",
        text: "A PDF that already asks for a password is not re-encrypted. Unlock it first with Unlock PDF, then protect the clean copy with the password you want.",
      },
    ],
    tips: [
      {
        title: "Send the password on a different channel",
        text: "Email the file and text the password, or use a password manager share. A password sent in the same email as the attachment is decoration, not protection.",
      },
      {
        title: "Owners vs users",
        text: "Give the recipient the user password when they must obey the ticks. Keep the owner password for yourself so you can still print or edit your own document.",
      },
      {
        title: "Protect the final copy",
        text: "Encrypt the version you are sending, not the one you are still editing. Re-exporting an encrypted file means unlocking it first.",
      },
      {
        title: "Ticks for internal documents",
        text: "For a staff handbook, set an owner password and leave the user password empty: the file opens without a prompt but copying and editing are restricted.",
      },
    ],
    faqs: [
      {
        q: "How strong is the encryption?",
        a: "AES-256 with a randomly generated file key, the same scheme the PDF 2.0 specification recommends. Brute-forcing a decent password is not practical; guessing a weak one still is, so use a long passphrase rather than four digits.",
      },
      {
        q: "Can I remove the password later?",
        a: "Yes — with the password. Open the file here with Unlock PDF, type the password, and download an unlocked copy. Without the password there is no route, which is the point.",
      },
      {
        q: "Do the permission ticks actually stop copying?",
        a: "They stop the polite, standard route: a reader that honours the flags will grey out copy and print. They are not cryptography. If the content must not be extracted, do not send it in a format that can display it.",
      },
      {
        q: "Is my file uploaded anywhere?",
        a: "No. The encryption library runs in this tab and the bytes never leave it. You can watch the Network panel in developer tools while it works — you will see no request carrying your document.",
      },
      {
        q: "Will the protected file open on a phone?",
        a: "Yes. iOS Files, Android's PDF viewers, Chrome, Edge, Preview and Acrobat all read AES-256 encrypted PDFs and ask for the password once.",
      },
      {
        q: "Does it work on scanned PDFs?",
        a: "Yes. Scans are images, and images are encrypted the same way as text. A 40-page scan takes a few seconds longer because every image object has to be rewritten.",
      },
      {
        q: "What happens to the document properties?",
        a: "They are encrypted with the rest of the file, so they are not readable without the password. A viewer that ignores the title field still cannot see it until the document is opened.",
      },
    ],
    related: ["unlock-pdf", "watermark-pdf", "pdf-metadata"],
    inputFormats: ["PDF"],
    outputFormats: ["Encrypted PDF"],
    keywords: ["protect pdf", "password protect pdf", "encrypt pdf", "add password to pdf", "lock pdf", "secure pdf"],
    isNew: true,
    phase: 6,
    updated: "2026-10-30",
  },
  {
    slug: "unlock-pdf",
    name: "Unlock PDF",
    shortName: "Unlock PDF",
    category: "pdf-tools",
    group: "security",
    widget: "unlock-pdf",
    icon: "Unlock",
    tagline: "Remove a password from a PDF when you already know it.",
    bestFor: "Your own statement or contract asks for a password every time you open it and you want a clean copy.",
    seoTitle: "Unlock PDF — Remove a Password You Know",
    metaDescription:
      "Remove a password from a PDF you can already open. Type the password once and download an unencrypted copy. No guessing tools, no upload, no account.",
    h1: "Unlock PDF — Remove a Password You Already Know",
    intro: [
      "Type the password, get a copy that opens without one. Everything happens in this tab: the file is decrypted with the password you supply and rewritten as a fresh, unencrypted document. Nothing is uploaded and nothing is stored.",
      "This is not a cracking tool. It has no dictionary, no guessing and no recovery: the only way in is the password the document already uses. That is the honest boundary — any site promising to open a protected file without the password is either lying, using a known-password database, or breaking the law in your jurisdiction.",
      "What you get back is a normal PDF with every page, link and annotation intact. The document properties are cleared in the process, because the information dictionary is encrypted and it is worse to guess at it than to start clean.",
    ],
    bullets: [
      {
        title: "One password, one copy",
        text: "Enter the password that already opens the file. The tool decrypts locally and writes a new PDF with no security handler at all.",
      },
      {
        title: "Owner passwords work too",
        text: "If the file opens without a prompt but refuses printing or copying, the owner password removes those restriction flags as well.",
      },
      {
        title: "Every page preserved",
        text: "Pages are copied into the new document in their original order with their sizes, links and annotations — nothing is re-rendered or re-compressed.",
      },
      {
        title: "Verified before download",
        text: "The result is reopened with a plain PDF reader that refuses encrypted files. If it loads, the file really is unlocked.",
      },
      {
        title: "Friendly failures",
        text: "A wrong password says so rather than showing a stack trace, and a certificate-protected file is explained instead of silently failing.",
      },
      {
        title: "Works offline",
        text: "Once the page is loaded there is no network request at all, so a confidential statement never touches a server.",
      },
    ],
    steps: [
      {
        title: "Drop the PDF in",
        text: "The page checks the file structure and tells you whether it looks encrypted before you type anything.",
      },
      {
        title: "Type the password",
        text: "The one you use to open the file. Use the eye button if you are not sure about capitals.",
      },
      {
        title: "Unlock and download",
        text: "Press Unlock PDF. The decrypted copy downloads immediately and opens like any other PDF.",
      },
    ],
    limits: [
      {
        title: "No password, no entry",
        text: "A forgotten password cannot be recovered here. Brute force and dictionary attacks are not built in, by design, and the tool will not be extended to include them.",
      },
      {
        title: "Some encryption cannot be opened",
        text: "Certificate-based (public-key) PDFs and files encrypted with a damaged security handler need the original software or the certificate. The tool says so rather than pretending.",
      },
      {
        title: "Document properties are cleared",
        text: "The title, author and subject live in an encrypted dictionary. Rather than inventing values, the unlocked copy starts with an empty property set and a producer line.",
      },
      {
        title: "Only for files you may use",
        text: "Removing a password from a document you do not own or have permission to modify may breach a contract or a law. It is your call, and the tool does not check.",
      },
    ],
    tips: [
      {
        title: "Unlock once, then protect again",
        text: "Need to change the password or the permissions? Unlock the file here, then re-run Protect PDF with the settings you actually want.",
      },
      {
        title: "Fix the printing problem",
        text: "Statements from banks often allow reading but block printing. Unlocking with the owner password removes that restriction so you can print your own document.",
      },
      {
        title: "Keep the original",
        text: "Store the encrypted original somewhere safe before you work with the unlocked copy — that original is the only thing a future password check will accept.",
      },
      {
        title: "Check the pages afterwards",
        text: "Open the unlocked file and glance at the last page. A truncated download is the most common cause of a 'damaged' result, not the decryption.",
      },
    ],
    faqs: [
      {
        q: "I forgot the password — can you open it?",
        a: "No. AES encryption cannot be reversed without the key, and this tool has no guessing engine. The only realistic options are the sender's copy, your password manager, or the service that produced the document.",
      },
      {
        q: "Is this legal?",
        a: "Removing a password from a document you own or are authorised to modify is routine — it is what Acrobat's own 'Remove Security' does. Doing it to somebody else's protected file may break a contract or a law, and the tool makes no attempt to verify ownership.",
      },
      {
        q: "Does it remove the permission restrictions too?",
        a: "Yes. The output has no encryption and no permission flags at all, so printing, copying and editing are unrestricted in any reader.",
      },
      {
        q: "Which kinds of PDF password are supported?",
        a: "The standard security handler: RC4 40/128-bit, AES-128 and AES-256, with either a user or an owner password. Certificate-based encryption is not supported.",
      },
      {
        q: "Why are the title and author empty afterwards?",
        a: "Those fields are stored inside the encrypted part of the file. The decrypting reader does not expose them, and copying a partial guess would be worse than a clean slate.",
      },
      {
        q: "Is the file uploaded?",
        a: "No. Decryption and the rewrite happen in the tab. You can disconnect from the network after the page loads and it will still work.",
      },
      {
        q: "Does unlocking reduce quality?",
        a: "No. Pages are copied, not re-rendered: text stays text, images keep their original encoding and links keep working. The file may even get slightly smaller because the encryption dictionaries are gone.",
      },
    ],
    related: ["protect-pdf", "repair-pdf", "pdf-metadata"],
    inputFormats: ["Encrypted PDF"],
    outputFormats: ["PDF"],
    keywords: ["unlock pdf", "remove pdf password", "decrypt pdf", "pdf password remover", "unsecure pdf"],
    isNew: true,
    phase: 6,
    updated: "2026-10-30",
  },
  {
    slug: "ocr-pdf",
    name: "OCR PDF",
    shortName: "OCR",
    category: "pdf-tools",
    group: "extract",
    widget: "ocr-pdf",
    icon: "ScanText",
    tagline: "Turn a scanned page into searchable text, entirely inside your browser.",
    bestFor: "A scanned contract or a photographed invoice that you cannot search, copy from or quote.",
    seoTitle: "OCR PDF — Make a Scan Searchable and Copyable",
    metaDescription:
      "Recognise text in a scanned PDF, JPG or PNG in your browser. Download a searchable PDF or a plain text file. Nothing is uploaded.",
    h1: "OCR PDF — Make a Scanned PDF Searchable",
    intro: [
      "OCR (optical character recognition) looks at the shapes on a scanned page and works out which letters they are. Feed this tool a scanned PDF or a photograph, choose the pages, and it returns the recognised words plus an optional searchable PDF where the original scan is untouched and the text sits underneath it, invisible but findable.",
      "The engine is Tesseract compiled to WebAssembly, running in a worker thread on your own device. The engine files and the English language data are served from this site and cached after the first run, so there is no third-party CDN and no upload — a page full of passport numbers never leaves the laptop.",
      "Recognition is good on clean, straight, well-lit text and unreliable on everything else. Treat the output as a first draft to check, not as a transcript to trust.",
    ],
    bullets: [
      {
        title: "Searchable PDF output",
        text: "The scan stays exactly as it was; the recognised words are drawn underneath as invisible text, so Ctrl+F, selection and copy all work in Acrobat, Preview, Chrome and Firefox.",
      },
      {
        title: "Plain text as well",
        text: "Every run also produces a .txt transcript with page markers, ready to paste into Word, a translation tool or a spreadsheet.",
      },
      {
        title: "PDFs, JPGs and PNGs",
        text: "Drop a multi-page scan or a single phone photo. Pages are rendered at up to 2.5× for recognition, which is roughly what a 200–300 dpi scan provides.",
      },
      {
        title: "Page ranges",
        text: "Recognition is slow, so you can point it at pages 1-3 or 12-14 and leave the other 180 alone. The first thirty pages are the default ceiling.",
      },
      {
        title: "Confidence reporting",
        text: "The result shows an average confidence figure and a word count, so a page that came out badly is visible before you build a workflow on it.",
      },
      {
        title: "Runs in a worker",
        text: "Recognition happens off the main thread, so the tab stays scrollable and a long job does not freeze the rest of the interface.",
      },
    ],
    steps: [
      {
        title: "Add the scan",
        text: "A scanned PDF, a JPG or a PNG. If the PDF already has a text layer, the page says so — OCR would only add a second, worse copy of the same words.",
      },
      {
        title: "Choose the pages",
        text: "Type a range like 1-5 or leave it empty for the first thirty pages. Choose whether you want the searchable PDF as well as the text file.",
      },
      {
        title: "Let it recognise",
        text: "Each page is rendered, recognised and given a progress line. Expect a few seconds per page on a laptop and longer on a phone.",
      },
      {
        title: "Check, then download",
        text: "Read the transcript preview before using it. Misread digits and punctuation are the usual errors, and a wrong amount in an invoice matters.",
      },
    ],
    limits: [
      {
        title: "English only, for now",
        text: "The bundled language data recognises English text. Other languages would need their own trained data, which is several megabytes each — that is a future addition, not a hidden setting.",
      },
      {
        title: "Printed text, not handwriting",
        text: "Tesseract reads machine-set type well. Cursive handwriting, signatures, stamps and most stylised display fonts come back as nonsense or nothing.",
      },
      {
        title: "Accuracy depends on the scan",
        text: "Skewed pages, low resolution, shadows, coloured backgrounds and tight columns all reduce accuracy. Typically a clean 300 dpi scan lands in the high 90s per cent; a phone photo of a form on a desk is much worse.",
      },
      {
        title: "Slow by nature",
        text: "Recognition is CPU-heavy. Thirty pages can take several minutes on a laptop, and a phone will be slower and may need the page range kept short.",
      },
      {
        title: "The searchable PDF is a scan plus text",
        text: "It is not a rebuilt document. The page is still a picture, so the text layer is approximate in position and does not reflow. For an editable document, run PDF to Word on the searchable result.",
      },
    ],
    tips: [
      {
        title: "Scan straight and bright",
        text: "A 300 dpi greyscale scan of a straight page is the ideal input. Rotate a crooked page before running OCR; a few degrees of skew costs a lot of accuracy.",
      },
      {
        title: "Crop the margins",
        text: "Scanner edges, black borders and a hand holding the page all produce garbage words. Drop them from the image first with the crop tool.",
      },
      {
        title: "Check numbers twice",
        text: "OCR confuses 8/B, 1/l, 0/O and 5/S. If the document contains amounts, account numbers or reference codes, read those characters against the scan.",
      },
      {
        title: "Searchable PDF, then Word",
        text: "Two honest steps beat one magical one: recognise the scan into a searchable PDF, then run PDF to Word on it to get paragraphs you can edit.",
      },
    ],
    faqs: [
      {
        q: "What does OCR actually do?",
        a: "It finds letter-shaped regions, groups them into words and lines using spacing, then matches them against a language model. The output is a guess with a confidence score, which is why a scan that looks perfect to you can still produce odd characters.",
      },
      {
        q: "Is the searchable PDF really searchable?",
        a: "Yes in Acrobat, Preview, Chrome, Firefox and Edge: the recognised words are in the content stream, drawn with zero alpha. The page still looks like the scan because the image sits on top.",
      },
      {
        q: "Can it read handwriting?",
        a: "Practically, no. Tesseract is trained on printed type. A short form field in block capitals sometimes works; cursive, signatures and clinical notes do not.",
      },
      {
        q: "Why is it slow?",
        a: "Recognition is a neural network running on your CPU, not a server farm. A page takes a few seconds; thirty pages takes minutes. That is the price of keeping the file on your machine.",
      },
      {
        q: "Is my document uploaded?",
        a: "No. The engine, its WebAssembly core and the language data are downloaded from this site (about 7 MB, then cached), but the page images are processed in the tab and are never sent anywhere.",
      },
      {
        q: "Does it work on a phone?",
        a: "It runs, but slowly. A single photographed page is fine; a 30-page scan will drain battery and may hit memory limits. Keep the page range small on mobile.",
      },
      {
        q: "What if the result is empty?",
        a: "The page was too small, too blurry, too dark or upside down. Re-scan at a higher resolution, straighten it and try again. The tool says when nothing was recognised rather than handing you an empty file.",
      },
    ],
    related: ["pdf-to-word", "pdf-to-txt", "pdf-to-excel"],
    inputFormats: ["PDF", "JPG", "PNG", "WebP"],
    outputFormats: ["PDF", "TXT"],
    keywords: ["ocr pdf", "ocr scan", "make pdf searchable", "image to text", "scan to text", "recognise text"],
    isNew: true,
    phase: 6,
    updated: "2026-10-30",
  },
  {
    slug: "pdf-to-word",
    name: "PDF to Word",
    shortName: "PDF to Word",
    category: "pdf-tools",
    group: "extract",
    widget: "pdf-to-word",
    icon: "FileType2",
    tagline: "Turn a PDF's text into an editable Word document with real paragraphs.",
    bestFor: "A report or a contract you need to quote, amend or reuse rather than just read.",
    seoTitle: "PDF to Word — Editable .docx Converter",
    metaDescription:
      "Convert a PDF into an editable .docx in your browser. Paragraphs, headings and page breaks are rebuilt from its text. Nothing is uploaded.",
    h1: "PDF to Word — Convert a PDF Into an Editable Document",
    intro: [
      "The text pages of your PDF are read, the lines are rebuilt into paragraphs, and the result is written as a real .docx file that opens in Word, Pages, LibreOffice and Google Docs. The PDF's own layout is not copied — it is recreated as flowing text you can edit.",
      "That distinction matters. A PDF stores glyphs at fixed coordinates; it has no idea what a paragraph is. Converting means inferring structure from position: lines that sit close together become one paragraph, gaps become new ones, and noticeably larger text becomes a heading. The result is a document you can edit, not a facsimile of the original design.",
      "If the PDF is a scan with no text layer, this tool will tell you and point you to OCR PDF, which is the step that has to happen first. There is no way to convert letters that are only pixels.",
    ],
    bullets: [
      {
        title: "Real, editable paragraphs",
        text: "Text arrives as flowing Word paragraphs — not line breaks at every PDF line — so editing a sentence does not break the layout around it.",
      },
      {
        title: "Headings detected by size",
        text: "Lines set clearly larger than the body text become Heading 1–3, which means Word's navigation pane and a table of contents work straight away.",
      },
      {
        title: "Running headers removed",
        text: "Lines that repeat at the top or bottom of most pages — company names, confidential stamps and page numbers — are skipped, so the body text does not start with clutter.",
      },
      {
        title: "Optional page breaks",
        text: "Keep each PDF page starting a new Word page when page references matter, or let the text flow freely for editing.",
      },
      {
        title: "Page ranges",
        text: "Convert the whole document or a chapter at a time. Fine for a 200-page report because each page is processed and released as it goes.",
      },
      {
        title: "Nothing uploaded",
        text: "The text is extracted with pdf.js and the .docx is built in the tab with a small OOXML writer. No server, no queue, no account.",
      },
    ],
    steps: [
      {
        title: "Add the PDF",
        text: "One file, up to 200 MB. The page count is read immediately so you can confirm it is the version you meant.",
      },
      {
        title: "Choose the options",
        text: "Page range, whether to skip repeated headers and footers, and whether to keep page breaks.",
      },
      {
        title: "Convert",
        text: "Each page's text is extracted and grouped into lines by baseline, then into paragraphs by spacing, size and indentation.",
      },
      {
        title: "Download the .docx",
        text: "Open it in Word or Google Docs, then apply your own styles. The content is yours to edit; the original design is not carried over.",
      },
    ],
    limits: [
      {
        title: "Layout is rebuilt, not preserved",
        text: "Two-column pages, text boxes, sidebars and floating images are flattened into one column of paragraphs. This is a conversion of the words, not of the design.",
      },
      {
        title: "Tables become text",
        text: "A PDF table is just text at positions; the grid lines carry no structure. Rows come through as paragraphs, so a table-heavy page needs re-typing or the PDF to Excel tool.",
      },
      {
        title: "Images are not extracted",
        text: "Pictures stay in the PDF. This tool moves text; use PDF to JPG for the images or copy them from a viewer.",
      },
      {
        title: "Scans contain no text",
        text: "If the pages are pictures, there is nothing to convert. Run OCR PDF first and convert the searchable result — the honest two-step route.",
      },
      {
        title: "Bold and italics may be lost",
        text: "A PDF often stores a font reference rather than a style name, so runs are written as plain text. Headings keep their size-based structure, but inline emphasis may need re-applying.",
      },
    ],
    tips: [
      {
        title: "Fix the styles once",
        text: "Convert, then edit the Heading 1 and Normal styles in Word. Every converted paragraph inherits the change, which is much faster than formatting as you go.",
      },
      {
        title: "Leave page breaks on for legal work",
        text: "When a clause is cited by page number, keeping the breaks means the converted document still matches the PDF you sent.",
      },
      {
        title: "Turn off header removal for short documents",
        text: "The header filter needs at least three pages before it can spot a pattern. On a two-page letter there is nothing to remove and the option does nothing.",
      },
      {
        title: "Convert a chapter at a time",
        text: "For a 300-page book, run the range for the chapter you are editing. It is faster and the resulting file is easier to navigate.",
      },
    ],
    faqs: [
      {
        q: "Will the Word file look exactly like the PDF?",
        a: "No, and no browser converter can make it. A PDF is a fixed page description; Word is a flowing document. You get the words, the paragraph order and heading levels, then you restyle to taste.",
      },
      {
        q: "Does it keep tables?",
        a: "Not as tables. Each row arrives as a line of text because the PDF does not record which cells belong together. For a data-heavy document, use PDF to Excel, which rebuilds rows and columns from positions.",
      },
      {
        q: "What about bold and italic?",
        a: "Often lost. A PDF frequently references a font object rather than naming 'bold', so the safest output is plain text with heading levels preserved by size. Re-apply emphasis once in Word.",
      },
      {
        q: "Can it convert a scanned PDF?",
        a: "Not on its own — there are no characters to read. Run OCR PDF first, download the searchable PDF, then convert that. Two steps, honest results.",
      },
      {
        q: "Is the .docx compatible with Google Docs and Pages?",
        a: "Yes. The file is standard OOXML (the same format Word writes), with a styles part so headings map to real heading styles in every editor.",
      },
      {
        q: "How large a PDF can it handle?",
        a: "Up to 200 MB, though the practical limit is page count rather than size: a 500-page document takes a minute or two and a lot of memory. Use the page range for very long files.",
      },
      {
        q: "Is my document uploaded?",
        a: "No. Extraction and the .docx writer both run in the tab. Nothing about the document is sent anywhere, which is why it works with the network switched off.",
      },
    ],
    related: ["pdf-to-excel", "ocr-pdf", "pdf-to-txt"],
    inputFormats: ["PDF"],
    outputFormats: ["DOCX"],
    keywords: ["pdf to word", "pdf to docx", "convert pdf to word", "editable pdf", "pdf to document"],
    isNew: true,
    phase: 6,
    updated: "2026-10-30",
  },
  {
    slug: "pdf-to-excel",
    name: "PDF to Excel",
    shortName: "PDF to Excel",
    category: "pdf-tools",
    group: "extract",
    widget: "pdf-to-excel",
    icon: "FileSpreadsheet",
    tagline: "Rebuild the tables in a PDF as rows and columns in a real workbook.",
    bestFor: "A bank statement, invoice or stock report whose numbers you need to total and sort.",
    seoTitle: "PDF to Excel — Extract PDF Tables to .xlsx",
    metaDescription:
      "Extract tables from a PDF into an .xlsx workbook in your browser. Rows and columns are rebuilt from text positions; numbers stay numbers. Nothing uploaded.",
    h1: "PDF to Excel — Turn PDF Tables Into a Spreadsheet",
    intro: [
      "This tool reads the text layer of a PDF, works out which words sit on the same line and which sit in the same column, and writes the result into a proper .xlsx workbook with one sheet per page or a single long sheet. Numbers are written as numbers, so SUM and sorting work immediately.",
      "It is extraction, not magic. A PDF has no concept of a table — only characters at coordinates. Columns are inferred from the horizontal gaps between words, which works well when a table has clear whitespace between its columns and badly when it does not. Merged cells, vertical rules and wrapped cell text are the usual places it needs help.",
      "Everything runs in the tab. Drop a statement in, get a workbook out, and the document never leaves the machine — which is the only sensible arrangement for financial data.",
    ],
    bullets: [
      {
        title: "Rows from baselines",
        text: "Words on the same baseline become one row, in left-to-right order, so a printed line stays a line instead of exploding into separate cells.",
      },
      {
        title: "Columns from gaps",
        text: "The tool clusters the left edge of every cell across the page, so columns line up even when a row leaves one of them empty.",
      },
      {
        title: "Numbers stay numeric",
        text: "Values like 1,234.50 are written as numbers with their thousands separators removed, so formulas work without retyping.",
      },
      {
        title: "One sheet per page, or one long sheet",
        text: "Statements read better with a page tab each; a single exported table reads better stacked. Both are one click.",
      },
      {
        title: "Sensible column widths",
        text: "Each column is sized to its longest value so nothing starts as a row of ##### signs.",
      },
      {
        title: "Works with any spreadsheet app",
        text: "The .xlsx opens in Excel, Numbers, LibreOffice Calc and Google Sheets without conversion.",
      },
    ],
    steps: [
      {
        title: "Add the PDF",
        text: "The page count is read locally so you can decide whether to convert everything or just the pages with the table.",
      },
      {
        title: "Choose the page range and layout",
        text: "One sheet per page keeps the page numbers visible in the tab names; one long sheet is easier to filter.",
      },
      {
        title: "Convert",
        text: "Each page's words are grouped into lines, split into cells at the gaps, then aligned into columns across the whole page.",
      },
      {
        title: "Tidy in Excel",
        text: "Delete the totals rows, fix any merged headers by hand, and check a few numbers against the PDF. Ten seconds of checking beats a wrong sum.",
      },
    ],
    limits: [
      {
        title: "Columns need whitespace",
        text: "If a table draws vertical rules right against the text, or the text nearly touches the next column, the gap is too small to detect and cells merge. Widen the page or split the columns by hand in Excel.",
      },
      {
        title: "No merged cells",
        text: "A header spanning three columns arrives in one cell with the neighbouring cells empty. There is no reliable way to infer a span from coordinates alone.",
      },
      {
        title: "Wrapped cells land on two rows",
        text: "When a cell's text wraps, the second line is a new row in the output. Merging those rows is a manual step.",
      },
      {
        title: "Scans have no cells at all",
        text: "A photographed statement has no text layer. Run OCR PDF first, then convert the searchable result — expect more stray cells because OCR positions are approximate.",
      },
      {
        title: "Formatting is not copied",
        text: "Colours, borders and fonts from the PDF are not reproduced. You get the values in the right cells, which is what a spreadsheet is for.",
      },
    ],
    tips: [
      {
        title: "Delete the page furniture",
        text: "Bank statements repeat a header block on every page, which becomes repeated rows in the sheet. Sort by the first column, select the repeated rows and delete them.",
      },
      {
        title: "Check the sign column",
        text: "Credit and debit are often separate columns in the PDF but adjacent in the export. Add a helper column before you total anything.",
      },
      {
        title: "Use one sheet per page for audit trails",
        text: "Keeping a sheet per page means a figure can be traced back to the page it came from, which matters if somebody questions the numbers.",
      },
      {
        title: "Convert only the pages you need",
        text: "A 300-page annual report has maybe eight pages of tables. Type the range, get a clean sheet, skip the rest.",
      },
    ],
    faqs: [
      {
        q: "Why is my table split into the wrong columns?",
        a: "Columns are found from the gaps between words. If two columns are closer together than about fourteen points, or if their text runs into each other, they merge. Try selecting a narrower page range and fixing the affected columns manually.",
      },
      {
        q: "Do the numbers come through as numbers?",
        a: "Yes when they look like numbers: integers, decimals and thousands separators become numeric cells. Anything with a currency symbol or a stray character stays text so nothing is silently altered.",
      },
      {
        q: "Can it handle scanned bank statements?",
        a: "Only after OCR. Run OCR PDF to create a searchable copy, then convert that. Positions will be slightly approximate, so expect to clean up a few cells.",
      },
      {
        q: "Does it keep colours and formatting?",
        a: "No. The tool transfers values and structure, not presentation. You get the data in the right place, which is what lets you total and filter it.",
      },
      {
        q: "Can I convert several PDFs at once?",
        a: "One file at a time. For a batch, convert each and paste the sheets together, or use one long sheet per document and stack them with a source column.",
      },
      {
        q: "Which workbook format is produced?",
        a: "A standard .xlsx (Office Open XML). It opens in Excel 2007 and later, Numbers, LibreOffice and Google Sheets with no conversion step.",
      },
      {
        q: "Is my financial document uploaded?",
        a: "No. Text extraction and workbook writing happen in the tab. There is no server involved and no copy of the statement is retained anywhere.",
      },
    ],
    related: ["pdf-to-word", "ocr-pdf", "csv-to-pdf"],
    inputFormats: ["PDF"],
    outputFormats: ["XLSX"],
    keywords: ["pdf to excel", "pdf table to excel", "convert pdf to xlsx", "extract table from pdf", "pdf to spreadsheet"],
    isNew: true,
    phase: 6,
    updated: "2026-10-30",
  },
];
