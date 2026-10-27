import type { Tool } from "@/lib/tool-types";

/** Tools that build a new PDF out of another kind of file. */
export const pdfCreateTools: Tool[] = [
  {
    slug: "txt-to-pdf",
    name: "TXT to PDF",
    shortName: "TXT to PDF",
    category: "pdf-tools",
    group: "create",
    widget: "txt-to-pdf",
    icon: "FileType2",
    tagline: "Turn a .txt file or pasted text into a clean, paginated PDF with your margins.",
    bestFor: "You wrote notes in Notepad and need a printable PDF, or a plain-text log must be archived.",
    seoTitle: "TXT to PDF — Convert Text or Paste It",
    metaDescription:
      "Convert .txt files or pasted text into a PDF with selectable text, custom margins, page size and font size. Free, in your browser.",
    h1: "TXT to PDF — Turn Plain Text Into a Clean Document",
    intro: [
      "Paste text or drop a .txt file, choose a page size, margin and font size, and get a paginated PDF with real, selectable text. Paragraph breaks are respected, long lines wrap properly, and pages break where the text runs out of room.",
      "Everything runs locally. Latin text uses the PDF's built-in fonts, so the result stays under 50 KB; if your text needs Cyrillic, Greek, Hebrew, Arabic or typographic quotes, a Unicode font is fetched from this site and embedded automatically.",
    ],
    bullets: [
      {
        title: "Selectable, searchable text",
        text: "The PDF contains actual text, not an image of text. You can select it, copy it, search it and have a screen reader read it.",
      },
      {
        title: "Proper wrapping and pagination",
        text: "Long lines wrap at the margin, blank lines separate paragraphs, and new pages start exactly when the text runs out of space.",
      },
      {
        title: "Page size and margins",
        text: "A4, Letter, A5 or Legal, portrait or landscape, with a margin from 0 to 40 mm — useful when text has to fit an existing form or binder.",
      },
      {
        title: "Unicode when you need it",
        text: "Latin text stays small. Non-Latin scripts trigger the bundled Unicode font, which is embedded as a subset so the file stays reasonable.",
      },
      {
        title: "Font size and leading",
        text: "Choose a size from 8 to 16 pt and a line height that suits dense notes or large-print documents.",
      },
      {
        title: "No upload, no watermark",
        text: "The text never leaves the tab. Nothing is added to your pages and no account is required.",
      },
    ],
    steps: [
      {
        title: "Add your text",
        text: "Drop a .txt, .md or .csv file, or paste directly into the box. Pasting is often faster for a few paragraphs.",
      },
      {
        title: "Set the layout",
        text: "Pick the page size, orientation, margin, font size and line height. The preview counter shows characters and estimated pages.",
      },
      {
        title: "Convert",
        text: "Press Create PDF. Text is laid out line by line and written with an embedded font.",
      },
      {
        title: "Download and check the breaks",
        text: "Open the PDF and scan the page transitions for awkward breaks — for example a heading stranded at the bottom of a page.",
      },
    ],
    limits: [
      {
        title: "No rich formatting",
        text: "Plain text has no bold, italic or headings. Use the Markdown tool if the text carries structure, or the Word tool for a .docx.",
      },
      {
        title: "Not every script is supported",
        text: "The bundled font covers Latin, Greek, Cyrillic, Hebrew, Arabic and common symbols. Devanagari (Hindi), Urdu-specific forms, Chinese, Japanese and Korean are not fully covered and will show as blank glyphs — the tool warns you before converting.",
      },
      {
        title: "Right-to-left text is not reordered",
        text: "Arabic and Hebrew characters are drawn in the order they appear in the file. Correct bidi shaping needs a full text-shaping engine, which this tool does not include.",
      },
      {
        title: "Tabs become spaces",
        text: "Tabs are expanded to four spaces; column alignment from a text file will not survive exactly.",
      },
    ],
    tips: [
      {
        title: "Log files and transcripts",
        text: "Use 8–9 pt with 1.25 line height for dense logs, and a 15 mm margin. You will fit roughly 60 lines per A4 page.",
      },
      {
        title: "Large-print copies",
        text: "For accessibility, 14 pt with 1.6 line height on A4 gives about 30 lines per page and reads comfortably when printed.",
      },
      {
        title: "Keep the .txt as the archive",
        text: "The PDF is the presentation format. Keep the original text file — it is searchable by anything and will never need re-OCRing.",
      },
      {
        title: "Keep the original line breaks in mind",
        text: "Plain text files have hard line breaks at the width the author used, and those breaks are treated as paragraph breaks here. If a file was hard-wrapped at 80 characters, unwrap it in a text editor first or the PDF will show a short line followed by a gap.",
      },
      {
        title: "Perfect for logs and transcripts",
        text: "Server logs, chat transcripts and notes pasted from a terminal convert cleanly because they are plain monospaced text. Use a smaller font and tighter line height for those, and keep margins narrow to fit more per page.",
      },
      {
        title: "Fix formatting before converting",
        text: "There is no bold or heading markup in a .txt file, so anything that needs emphasis should be converted from Markdown instead. That keeps headings as headings and saves a second pass in a word processor.",
      },
    ],
    faqs: [
      {
        q: "Is the text in the PDF selectable?",
        a: "Yes. It is written as real text with an embedded font, so you can select, copy and search it, and screen readers can read it.",
      },
      {
        q: "Does it support non-English characters?",
        a: "Latin, Greek, Cyrillic, Hebrew and Arabic characters are supported through a bundled Unicode font. Indic scripts, Chinese, Japanese and Korean are not fully supported — the tool warns you if it sees them.",
      },
      {
        q: "Can I control margins and page size?",
        a: "Yes: A4, Letter, A5 or Legal, portrait or landscape, and a margin from 0 to 40 mm.",
      },
      {
        q: "How many pages will my text produce?",
        a: "It depends on font size, line height and margins, but the tool shows a page estimate as you change settings, before you convert.",
      },
      {
        q: "Can I paste text instead of uploading a file?",
        a: "Yes. Pasting is supported and nothing is uploaded either way.",
      },
      {
        q: "Does it preserve blank lines?",
        a: "Yes. Blank lines separate paragraphs, and multiple blank lines are condensed rather than producing empty pages.",
      },
      {
        q: "Why is my PDF file so large?",
        a: "A Unicode font was embedded because the text was not plain Latin. Subsetting keeps it to a few hundred kilobytes. Latin-only text produces files of about 20–40 KB.",
      },
    ],
    related: ["word-to-pdf", "markdown-to-pdf", "merge-pdf"],
    inputFormats: ["TXT", "MD", "CSV", "pasted text"],
    outputFormats: ["PDF"],
    keywords: ["txt to pdf", "text to pdf", "convert notepad to pdf", "plain text pdf"],
    phase: 3,
    updated: "2026-10-27",
  },
  {
    slug: "word-to-pdf",
    name: "Word to PDF",
    shortName: "Word to PDF",
    category: "pdf-tools",
    group: "create",
    widget: "docx-to-pdf",
    icon: "FileText",
    tagline: "Convert a .docx into a PDF with real, selectable text — and an honest fidelity note.",
    bestFor: "You need to send a Word document as a PDF so its layout stops changing on other people's machines.",
    seoTitle: "Word to PDF Free — DOCX Converter",
    metaDescription:
      "Convert Word .docx files to PDF in your browser. Headings, bold, lists and tables preserved, text stays selectable. No upload, no account.",
    h1: "Word to PDF — Convert DOCX Without Uploading It",
    intro: [
      "Drop a .docx and get a PDF with your headings, paragraphs, bold and italic runs, lists and tables laid out on A4 or Letter pages. The text is real text — selectable, searchable and accessible — rather than a screenshot of a page.",
      "This is a browser conversion, so it reads the document's structure and re-lays it out rather than running Word itself. Simple documents come out very close to the original; heavily designed documents with floating text boxes, multi-column layouts and precise page breaks will shift. The page explains exactly what is and is not preserved.",
    ],
    bullets: [
      {
        title: "Structure, not screenshots",
        text: "Headings, paragraphs, bold, italic, bullet and numbered lists and simple tables are mapped to PDF text and layout. The result is small, searchable and clean at any zoom.",
      },
      {
        title: "Real typography control",
        text: "Choose page size, margins, base font size and line height, so the PDF fits a report template, a binder or a two-page brief.",
      },
      {
        title: "Lists and tables survive",
        text: "Bullets keep their markers, numbered lists keep their numbers, and tables are drawn with borders and a repeated header row across page breaks.",
      },
      {
        title: "Automatic pagination",
        text: "Content flows onto new pages as it fills, with no clipped lines and no text hidden behind a margin.",
      },
      {
        title: ".docx only — honestly stated",
        text: "Old .doc files are a different binary format no browser can read reliably. Save as .docx (or export a PDF from Word) if you have a .doc.",
      },
      {
        title: "Nothing uploaded",
        text: "The document is unzipped and parsed in the tab. Contracts and CVs never reach a server, which is the whole point of doing it here.",
      },
    ],
    steps: [
      {
        title: "Add the .docx",
        text: "Drag it onto the dropzone. Files with images, tables and long lists all work; the file stays on your device.",
      },
      {
        title: "Choose the page setup",
        text: "A4 or Letter, portrait or landscape, margins and font size. Defaults suit a standard report.",
      },
      {
        title: "Convert",
        text: "The document is read, its structure extracted and the PDF laid out. A note tells you how many elements could not be represented.",
      },
      {
        title: "Compare against the original",
        text: "Open both files side by side for anything important. Check headings, tables and the last page before sending the PDF.",
      },
    ],
    limits: [
      {
        title: "Layout is re-created, not copied",
        text: "Word's exact page breaks, section breaks and headers/footers are not reproduced. A document that fits two pages in Word may run to two and a bit pages here.",
      },
      {
        title: "Floating objects are dropped",
        text: "Text boxes, positioned images, SmartArt, charts and footnotes are not rendered. Mammoth (the parser used here) reports them, and the page warns that the output may omit them.",
      },
      {
        title: "Fonts are substituted",
        text: "The PDF uses a standard font family. A Word document set in Calibri or Garamond will look different — the text and structure match, the typeface does not.",
      },
      {
        title: "No .doc, .docm macros or password-protected files",
        text: "Only modern .docx archives are readable. Encrypted documents cannot be opened at all.",
      },
      {
        title: "Not for pixel-exact proofs",
        text: "If a document must match a template exactly (letterheads, design proofs, legal exhibits), export the PDF from Word or LibreOffice instead. This tool is for everyday paperwork.",
      },
    ],
    tips: [
      {
        title: "CVs: keep it simple",
        text: "A CV built from headings, paragraphs and bullet lists converts almost perfectly. Heavy two-column layouts with text boxes convert badly — use a single-column version for the PDF.",
      },
      {
        title: "Check tables first",
        text: "Wide tables are the most likely thing to shift. If a table has more than six columns, consider exporting the PDF from Word instead.",
      },
      {
        title: "Set the margin before converting",
        text: "A 20–25 mm margin looks right for letters and reports. Zero margins make paragraphs run to the paper edge when printed.",
      },
      {
        title: "Convert the final draft, once",
        text: "Every edit means re-converting. Finish the wording in Word, then produce the PDF as the last step so the two never diverge.",
      },
    ],
    faqs: [
      {
        q: "Will the PDF look exactly like my Word document?",
        a: "For simple documents, very close. For complex layouts with text boxes, columns, charts or specific fonts, no — the browser re-creates the layout from the document structure. If exact appearance matters, export the PDF from Word.",
      },
      {
        q: "Is the text selectable in the PDF?",
        a: "Yes. It is written as real text with an embedded font, not as an image, so it can be selected, searched and read by assistive technology.",
      },
      {
        q: "Does it keep images from the document?",
        a: "Inline images are not currently rendered. Documents that are mostly images should be exported as PDF from Word instead.",
      },
      {
        q: "Can I convert a .doc file?",
        a: "No — .doc is a legacy binary format browsers cannot parse. Open it in Word, LibreOffice or Google Docs and save as .docx first.",
      },
      {
        q: "Does it support tables?",
        a: "Yes, simple tables are reproduced with borders and a header row that repeats when the table continues onto another page.",
      },
      {
        q: "Is my document uploaded to a server?",
        a: "No. The .docx is unzipped and parsed in your browser tab and never transmitted.",
      },
      {
        q: "Why is the font different from Word?",
        a: "The PDF is typeset with a standard font family rather than your Word fonts, which may not be installed anywhere else. That keeps the file small and rendering consistent.",
      },
      {
        q: "Can I convert several documents at once?",
        a: "Convert them one at a time; each produces its own PDF. Use Merge PDF afterwards if you need a single file.",
      },
    ],
    related: ["txt-to-pdf", "markdown-to-pdf", "merge-pdf"],
    inputFormats: ["DOCX"],
    outputFormats: ["PDF"],
    keywords: ["word to pdf", "docx to pdf", "convert word document to pdf", "docx converter"],
    popular: true,
    phase: 3,
    updated: "2026-10-27",
  },
  {
    slug: "csv-to-pdf",
    name: "CSV & Excel to PDF",
    shortName: "CSV to PDF",
    category: "pdf-tools",
    group: "create",
    widget: "csv-to-pdf",
    icon: "FileSpreadsheet",
    tagline: "Print a spreadsheet as a readable table with a repeating header row.",
    bestFor: "You need to send a price list or an expense sheet as a document nobody can accidentally edit.",
    seoTitle: "CSV to PDF — Clean Table Layout, No Upload",
    metaDescription:
      "Convert CSV, TSV or Excel .xlsx files into a PDF table with repeated headers, landscape support and sensible column widths. In your browser.",
    h1: "CSV to PDF — Turn a Spreadsheet Into a Document",
    intro: [
      "Load a .csv, .tsv or .xlsx file and get a PDF containing a properly drawn table: header row, borders, alternating shading and automatic page breaks with the header repeated on every page.",
      "Column widths are calculated from the content, so a “notes” column gets more room than an “id” column instead of every column being equally squeezed. Long cells wrap rather than being cut off, and nothing is truncated silently.",
    ],
    bullets: [
      {
        title: "CSV, TSV and .xlsx",
        text: "Delimiter detection handles comma, semicolon, tab and pipe files, including quoted fields with embedded commas and newlines. Excel workbooks are read with SheetJS.",
      },
      {
        title: "Readable column widths",
        text: "Widths are proportional to the average content length in each column, with a minimum so short columns do not collapse.",
      },
      {
        title: "Header repeats on every page",
        text: "The first row is repeated when the table continues onto a new page, so a printed page can still be understood on its own.",
      },
      {
        title: "Landscape for wide sheets",
        text: "Wide spreadsheets fit far better sideways. Choose landscape and a smaller font size instead of shrinking to unreadable.",
      },
      {
        title: "Choose the sheet",
        text: "Excel files with several worksheets list them, so you convert the one you mean rather than whichever happens to be first.",
      },
      {
        title: "No upload, no formulas",
        text: "Values are read from the file; formulas are not recalculated. Nothing is sent anywhere and no account is needed.",
      },
    ],
    steps: [
      {
        title: "Add the spreadsheet",
        text: "Drop a .csv, .tsv or .xlsx file. The first rows are previewed so you can confirm the delimiter and the header.",
      },
      {
        title: "Check the structure",
        text: "Confirm row and column counts. If the first row is data rather than headings, turn off “first row is a header”.",
      },
      {
        title: "Set page and type size",
        text: "A4 or Letter, portrait or landscape, and a font size from 7 to 12 pt. Landscape plus 8 pt handles most wide sheets.",
      },
      {
        title: "Convert and check a page break",
        text: "Open the PDF and look at where the table continues onto page two — the header should be there and no row should be split mid-cell.",
      },
    ],
    limits: [
      {
        title: "No formulas or charts",
        text: "Only the stored values are read. A chart in an .xlsx is not rendered, and a cell containing a formula appears as its last calculated value.",
      },
      {
        title: "One sheet at a time",
        text: "Each worksheet converts separately; a workbook with five sheets needs five runs, or five merged PDFs afterwards.",
      },
      {
        title: "Very wide tables shrink",
        text: "A 30-column sheet will not fit legibly on A4. The tool keeps text wrapped but at some point the honest answer is to split the columns or use a spreadsheet viewer.",
      },
      {
        title: "No cell colours or merged cells",
        text: "Formatting from the spreadsheet — fills, merged cells, number formats — is not reproduced. Values are rendered as text.",
      },
    ],
    tips: [
      {
        title: "Trim before converting",
        text: "Delete empty columns and rows first. A sheet with 1,000 blank rows produces empty pages.",
      },
      {
        title: "Landscape plus 8 pt",
        text: "This combination handles up to about twelve columns legibly on A4. Beyond that, split the sheet.",
      },
      {
        title: "Invoices and quotes",
        text: "For a client-facing table, keep it to six columns and use 10 pt. Dense 7 pt tables read as internal working papers, not as documents to send.",
      },
      {
        title: "Landscape for wide sheets",
        text: "A table with more than six or seven columns will shrink to unreadable type in portrait. Switch to landscape, drop the margin to 15 mm, and let the header row repeat on every page so a printed sheet still makes sense on page 4.",
      },
      {
        title: "Numbers arrive as text",
        text: "Spreadsheet cells are read as displayed values, which is what you want for a printable copy: formatting such as two decimal places survives. If you need to recalculate anything, do it in the spreadsheet first — the PDF is a snapshot.",
      },
      {
        title: "Trim the columns first",
        text: "An export with 40 columns of internal IDs produces six pages of near-illegible cells. Delete the columns nobody will read, then convert — a printable table should fit on one or two A4 pages.",
      },
    ],
    faqs: [
      {
        q: "Can I convert an Excel file directly?",
        a: "Yes — .xlsx works. Older .xls files are not supported by the browser parser; save them as .xlsx or .csv first.",
      },
      {
        q: "Does it handle semicolon-separated files?",
        a: "Yes. The delimiter is detected automatically for comma, semicolon, tab and pipe files, and you can override it.",
      },
      {
        q: "Will the header repeat on each page?",
        a: "Yes. The first row is treated as a header and repeated whenever the table continues onto a new page.",
      },
      {
        q: "What happens to very long cell values?",
        a: "They wrap inside the column instead of being cut off, and the row height grows to fit.",
      },
      {
        q: "Are formulas evaluated?",
        a: "No. The stored values are used; nothing is recalculated. Open the file in a spreadsheet application first if a formula needs recalculating.",
      },
      {
        q: "Can I convert several sheets at once?",
        a: "One sheet per run. Convert each and merge the PDFs if you need them in one document.",
      },
      {
        q: "Is my spreadsheet uploaded?",
        a: "No. The file is parsed in your browser and the PDF is generated locally.",
      },
    ],
    related: ["txt-to-pdf", "add-page-numbers-to-pdf", "merge-pdf"],
    inputFormats: ["CSV", "TSV", "XLSX"],
    outputFormats: ["PDF"],
    keywords: ["csv to pdf", "excel to pdf", "xlsx to pdf", "spreadsheet to pdf"],
    phase: 3,
    updated: "2026-10-27",
  },
  {
    slug: "markdown-to-pdf",
    name: "Markdown & HTML to PDF",
    shortName: "Markdown to PDF",
    category: "pdf-tools",
    group: "create",
    widget: "markdown-to-pdf",
    icon: "FileCode2",
    tagline: "Turn README files, notes and simple HTML into a tidy, selectable PDF.",
    bestFor: "You wrote documentation in Markdown and need a PDF copy for a client or a printed handover.",
    seoTitle: "Markdown to PDF — Convert MD or HTML",
    metaDescription:
      "Convert Markdown or simple HTML to a PDF with headings, lists, code blocks and tables. Real selectable text, in your browser, no upload.",
    h1: "Markdown to PDF — Convert MD, HTML or a README",
    intro: [
      "Paste Markdown or HTML, or drop a .md/.html file, and get a PDF with headings, paragraphs, lists, block quotes, code blocks and tables. Styling comes from a clean default typographic scale rather than your CSS, so the output is consistent and readable.",
      "It is aimed at documentation, notes and handover packs. Markdown converts very faithfully because the structure is explicit; HTML is reduced to its structural elements, so a full website layout will not survive — and the page says so instead of pretending.",
    ],
    bullets: [
      {
        title: "Markdown that behaves",
        text: "Headings (# to ####), bold, italic, inline code, fenced code blocks, bullet and numbered lists, links, quotes, horizontal rules and pipe tables.",
      },
      {
        title: "Sensible typography",
        text: "A consistent heading scale, space before headings, indented quotes and shaded code blocks — without needing to write any CSS.",
      },
      {
        title: "Links stay readable",
        text: "A Markdown link prints as “label (url)” so the address survives on paper, where a click is not possible.",
      },
      {
        title: "HTML structure, not design",
        text: "Pasted HTML is reduced to headings, paragraphs, lists, tables and quotes. CSS, columns and scripted content are deliberately ignored.",
      },
      {
        title: "Code blocks",
        text: "Fenced code keeps its line breaks and is rendered in a shaded block with a monospaced font, wrapping long lines rather than running off the page.",
      },
      {
        title: "Fully local",
        text: "No upload, no rendering service, no account. Your notes stay in the tab.",
      },
    ],
    steps: [
      {
        title: "Add the source",
        text: "Paste Markdown or HTML into the box, or drop a .md, .markdown or .html file.",
      },
      {
        title: "Pick the page setup",
        text: "A4 or Letter, margins and font size. Defaults read well for technical documentation.",
      },
      {
        title: "Convert",
        text: "The document is parsed into blocks and laid out with automatic pagination and page numbers if you enable them.",
      },
      {
        title: "Proofread the rendered structure",
        text: "Check heading levels and tables — the two places where a malformed source shows up first.",
      },
    ],
    limits: [
      {
        title: "No CSS layout",
        text: "Pasted HTML loses styling, floats, grids and media queries. This is a document converter, not a headless browser.",
      },
      {
        title: "Images are not embedded",
        text: "Markdown images are noted as “Image: alt text” in the output instead of being downloaded. Add the pictures afterwards with the PDF editor if they matter.",
      },
      {
        title: "Partial Markdown support",
        text: "Tables, lists, code, quotes and emphasis work. Footnotes, definition lists, task lists and raw HTML inside Markdown are not rendered specially.",
      },
      {
        title: "No syntax highlighting",
        text: "Code is shown in a monospaced block without colour highlighting.",
      },
    ],
    tips: [
      {
        title: "Handover packs",
        text: "Convert each README separately, then merge them, then add page numbers. You get one clean document with a proper contents order.",
      },
      {
        title: "Print-friendly code",
        text: "Keep code lines under about 90 characters. Longer lines wrap, which is readable but harder to copy from a printout.",
      },
      {
        title: "Turn on the footer",
        text: "“Page {n} of {total}” makes a printed handover much easier to reassemble when someone drops the stack.",
      },
      {
        title: "Render the source, not a screenshot",
        text: "Headings, lists, tables, quotes and code blocks are read from the Markdown and rebuilt as real PDF paragraphs, so the text stays selectable and searchable. Copy the text out of the finished file and you get the words back, not an image.",
      },
      {
        title: "Paste a web page as HTML",
        text: "Saving a page as HTML and dropping it in keeps headings, lists and basic tables. Stylesheets, scripts and layout are discarded, which is usually what you want: you get the content without the navigation, banners and cookie bars.",
      },
      {
        title: "Code blocks keep their shape",
        text: "Fenced code is rendered in a monospaced font with whitespace preserved, so indentation survives. Long lines still wrap rather than overflowing the margin, which keeps the page printable.",
      },
      {
        title: "Watch what happens to long tables",
        text: "A wide Markdown table is rebuilt with real columns and repeats its header on each page, but a twelve-column table still has to fit the page. For those, convert in landscape with a narrow margin, or split the table into two logical pieces before exporting.",
      },
      {
        title: "One source, two outputs",
        text: "Write a README in Markdown, convert it for the colleague who wants a document, and keep the Markdown as the editable master. Regenerating takes seconds and avoids the classic problem of a PDF drifting out of date from its source.",
      },
    ],
    faqs: [
      {
        q: "Which Markdown features are supported?",
        a: "Headings, bold, italic, inline code, fenced code blocks, bullet and numbered lists, block quotes, horizontal rules, links and pipe tables.",
      },
      {
        q: "Can I convert a website to PDF?",
        a: "Only its text structure. Paste the HTML source and you get headings, paragraphs, lists and tables without the design. Use your browser's print dialog if you need the page to look exactly as it does on screen.",
      },
      {
        q: "Are images included?",
        a: "No. Each image is noted as a line of text so you know where it belonged; add the picture afterwards with the PDF editor.",
      },
      {
        q: "Is the text selectable?",
        a: "Yes, including inside code blocks. Everything is real text.",
      },
      {
        q: "Can I add page numbers?",
        a: "Yes, there is a footer toggle with a {n} of {total} format.",
      },
      {
        q: "Does it support task lists?",
        a: "They render as ordinary bullet items; the checkbox syntax is shown as text.",
      },
      {
        q: "Is my document uploaded?",
        a: "No. Parsing and PDF writing happen in your browser.",
      },
    ],
    related: ["txt-to-pdf", "word-to-pdf", "merge-pdf"],
    inputFormats: ["MD", "HTML", "TXT"],
    outputFormats: ["PDF"],
    keywords: ["markdown to pdf", "html to pdf", "md to pdf", "readme to pdf"],
    phase: 3,
    updated: "2026-10-27",
  },
  {
    slug: "image-to-pdf",
    name: "Image to PDF",
    shortName: "Image to PDF",
    category: "pdf-tools",
    widget: "image-to-pdf",
    icon: "Images",
    group: "create",
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
];
