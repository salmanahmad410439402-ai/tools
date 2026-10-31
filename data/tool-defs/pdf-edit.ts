import type { Tool } from "@/lib/tool-types";

/** PDF tools that add something to a page: numbers, stamps, signatures, notes. */
export const pdfEditTools: Tool[] = [
  {
    slug: "add-page-numbers-to-pdf",
    name: "Add Page Numbers",
    category: "pdf-tools",
    group: "edit",
    widget: "page-numbers",
    icon: "Hash",
    tagline: "Number every page, or start counting after the cover — position and format included.",
    bestFor: "A contract or report needs page numbers before it goes to a client or a court.",
    seoTitle: "Add Page Numbers to PDF Free",
    metaDescription:
      "Add page numbers to a PDF in the position you choose, with “1 of 12” style formats and a custom starting number. No upload, no watermark.",
    h1: "Add Page Numbers to PDF — Position, Format, Start",
    intro: [
      "Write real page numbers onto every page: bottom centre, bottom right, top right or any of six positions, in a size and margin you choose. The format can be a plain “3” or something more formal such as “Page 3 of 12”.",
      "Numbers are drawn as text on the page, so they print and appear everywhere — unlike a viewer's status bar. The original content is not re-encoded, which keeps text selectable and file size almost unchanged.",
    ],
    bullets: [
      {
        title: "Six positions, sensible defaults",
        text: "Bottom centre suits most documents, bottom right suits forms, top right is common for legal packs. Margin is adjustable so numbers never sit on the trim edge.",
      },
      {
        title: "Format with {n} and {total}",
        text: "Type “Page {n} of {total}” for formal documents, or just “{n}” for a clean footer. The total always reflects the actual page count.",
      },
      {
        title: "Skip the cover page",
        text: "Start numbering from the page after the cover, or start at any number — useful when a PDF is chapter three of a larger manual.",
      },
      {
        title: "Select which pages get numbers",
        text: "Number everything, or restrict to a range such as 2-40 when the appendix should not be counted.",
      },
      {
        title: "Text, not an image",
        text: "The number is drawn with an embedded standard font, so it remains crisp at any zoom and does not add weight to the file.",
      },
      {
        title: "Nothing uploaded",
        text: "The PDF is opened locally, numbered in memory and saved to your disk. No server, no account, no watermark.",
      },
    ],
    steps: [
      {
        title: "Add the PDF",
        text: "Drop the file in. The tool shows how many pages it will number.",
      },
      {
        title: "Choose position and format",
        text: "Pick a corner, set the font size and margin, and write the format using {n} and {total}.",
      },
      {
        title: "Decide where counting starts",
        text: "Skip the first page for covers, and set the starting number when this document continues another.",
      },
      {
        title: "Apply and check",
        text: "Press Add page numbers. Open one middle page and the last page to confirm placement before sending it on.",
      },
    ],
    limits: [
      {
        title: "It cannot continue an existing numbering scheme",
        text: "If page 12 already has “12” printed as part of the content, this tool will not detect it. Number the whole document in one pass instead of in pieces.",
      },
      {
        title: "No chapter-based numbering (i, ii, iii)",
        text: "Roman numerals and section-based schemes such as “4-2” are not supported. The format field accepts numbers only.",
      },
      {
        title: "Text may sit over content",
        text: "On a page with content right to the edge, a number placed in the margin can overlap a scan. Increase the margin, or choose the opposite corner.",
      },
      {
        title: "Encrypted PDFs",
        text: "Password-protected files must be unlocked before numbering.",
      },
      {
        title: "The numbers become part of the page",
        text: "Stamped numbers are drawn into the page content, not added as a separate layer that a viewer can hide. That means they print, they appear in every viewer and they cannot be switched off later — which is the point, but it also means numbering is the last styling step to take before final export.",
      },
    ],
    tips: [
      {
        title: "Courts and legal filings",
        text: "Many courts require every page numbered in a specific corner. Bottom centre with “Page {n} of {total}” is the safest general choice — check the local rule first.",
      },
      {
        title: "Skip covers and blank separators",
        text: "Numbering a cover looks amateur. Start at 1 on the page after it, and delete blank separator pages instead of numbering them.",
      },
      {
        title: "Check the last page twice",
        text: "A wrong {total} is common when pages were added after numbering. Regenerate the numbers as the final step before sending.",
      },
      {
        title: "Number after merging, not before",
        text: "If you merge three documents, number the merged file once. Numbering each part first produces two sets of numbers and documents that restart in the middle, and the stamps cannot be removed afterwards.",
      },
      {
        title: "Cover pages are usually not numbered",
        text: "Start numbering at page 2 when the first page is a title or cover sheet. The tool accepts an offset, so the printed number can match the page you would find in a printed copy of the same report.",
      },
      {
        title: "Match what a printed copy shows",
        text: "The style most offices expect is a small number centred at the bottom, roughly 10 mm from the edge, in the same font as the body text. Slightly smaller than the body — 9 or 10 pt — reads as a professional touch rather than a stamp.",
      },
    ],
    faqs: [
      {
        q: "Can I add page numbers to only some pages?",
        a: "Yes. Use the page selection field with a range such as 2-20, or tick individual pages.",
      },
      {
        q: "Can the numbering start at a number other than 1?",
        a: "Yes. Set the starting number, which is useful when this PDF is one part of a larger document.",
      },
      {
        q: "Is the number added as text or as an image?",
        a: "As real text with an embedded font, so it stays sharp, prints cleanly and adds almost nothing to the file size.",
      },
      {
        q: "Will it overwrite numbers already in the document?",
        a: "No, it draws on top. If the pages already carry printed numbers, place yours in a different corner or renumber the source document.",
      },
      {
        q: "Does it change the quality of my PDF?",
        a: "No. Content is not re-encoded; only a small text object is added to each page.",
      },
      {
        q: "Is my file uploaded?",
        a: "No. Everything happens in your browser tab.",
      },
      {
        q: "Can I use Roman numerals?",
        a: "Not currently. The format field accepts numbers, so “Page 4 of 20” works but “Page iv of xx” does not.",
      },
    ],
    related: ["watermark-pdf", "organize-pdf", "sign-pdf"],
    inputFormats: ["PDF"],
    outputFormats: ["PDF"],
    keywords: ["add page numbers to pdf", "pdf page numbering", "number pdf pages"],
    phase: 2,
    updated: "2026-10-27",
  },
  {
    slug: "watermark-pdf",
    name: "Watermark PDF",
    category: "pdf-tools",
    group: "security",
    widget: "watermark-pdf",
    icon: "Stamp",
    tagline: "Stamp text or a logo across your PDF with control over opacity, angle and position.",
    bestFor: "A draft, a quotation or a confidential document needs a visible status before it is shared.",
    seoTitle: "Watermark PDF — Add Text or Your Logo",
    metaDescription:
      "Add a text or image watermark to every page of a PDF: opacity, rotation, colour and tiling. Free, in-browser, no upload and no account.",
    h1: "Watermark PDF — Add a Text or Image Overlay",
    intro: [
      "Type “DRAFT”, “CONFIDENTIAL” or a client name, set the size, angle and opacity, and stamp it across every page. You can also drop in a logo or signature image and use that as the watermark.",
      "The watermark is drawn as a real object on each page, so it travels with the PDF — no viewer tricks, no overlay that disappears when someone prints it. Your original text stays selectable underneath.",
    ],
    bullets: [
      {
        title: "Text or image",
        text: "Text watermarks cover the usual cases (DRAFT, SPECIMEN, DO NOT COPY). Image watermarks suit a company logo or a handwritten signature block.",
      },
      {
        title: "Opacity that stays readable",
        text: "The default sits around 15%, dark enough to be seen and light enough to read the page underneath. You can go from 5% to solid.",
      },
      {
        title: "Angle and tiling",
        text: "45° across the centre for the classic diagonal look, or a repeated tile pattern that is difficult to crop out of a screenshot.",
      },
      {
        title: "Six colour choices",
        text: "Grey for documents, red for drafts and urgent notices, blue for internal notes, black for formal stamping.",
      },
      {
        title: "Applied to every page",
        text: "Consistent placement on each page, including rotated pages, so the finished file looks deliberate rather than patched.",
      },
      {
        title: "Free and private",
        text: "No upload, no account, no watermark added by us — only the one you ask for.",
      },
    ],
    steps: [
      {
        title: "Add the PDF",
        text: "Drop the document on the dropzone. The page count is shown so you know what will be stamped.",
      },
      {
        title: "Choose text or image",
        text: "Type a short phrase — long text becomes unreadable across a page — or upload a PNG with transparency for a logo.",
      },
      {
        title: "Set appearance",
        text: "Pick the size, opacity, rotation and placement. Centre plus 45° plus 15% opacity is the safe default.",
      },
      {
        title: "Apply and download",
        text: "Press Apply watermark and check a text-heavy page to make sure the stamp does not hide anything important.",
      },
    ],
    limits: [
      {
        title: "A watermark is not security",
        text: "Anyone with a PDF editor can remove a watermark. It signals status and discourages casual copying; it does not protect a document. Real protection needs a password, which is a separate tool.",
      },
      {
        title: "Very long text wraps badly",
        text: "Watermarks are single-line strings. Keep them short — “CONFIDENTIAL — Ahmed Khan” is fine, a full sentence is not.",
      },
      {
        title: "No per-page differences",
        text: "The same watermark is applied to every page. Page-specific stamps are not supported.",
      },
      {
        title: "Logo quality depends on the source",
        text: "Upload a transparent PNG at least 600 px wide. A small JPEG logo will look soft and carry a white box.",
      },
      {
        title: "A watermark is a label, not access control",
        text: "Anyone who can open the PDF can also remove or cover a text or image watermark with a PDF editor, because the watermark sits in the same page content as everything else. It signals status and origin; it does not stop copying.",
      },
    ],
    tips: [
      {
        title: "Draft versions",
        text: "“DRAFT — 27 Oct 2026” in red at 20% opacity prevents the wrong version being approved, and the date tells a reader how old the file is.",
      },
      {
        title: "Client-specific copies",
        text: "Watermark each copy with the recipient's name before sending. If it leaks, it is obvious where it came from — and clients behave differently when they can see their name on it.",
      },
      {
        title: "Keep the original unmarked",
        text: "Watermark a copy, never your master file. The watermark is baked into the pages and cannot be removed cleanly later.",
      },
      {
        title: "Ask why before you stamp “confidential”",
        text: "The word deters casual sharing and helps if a copy turns up in the wrong inbox, but it does not encrypt anything. If the document genuinely must not be read, the right tool is protection with a password on a PDF writer, not a watermark.",
      },
      {
        title: "Pick opacity by the background",
        text: "10–15% reads clearly over white pages without hiding body text. On pages with photos or dark headers, drop to 8% and use a light colour instead of grey, otherwise the mark turns into blocks of noise.",
      },
      {
        title: "Scale a diagonal mark to the page",
        text: "A diagonal watermark should span roughly 60–80% of the page width. Smaller looks like a sticker, larger gets clipped at the corners and reads as a mistake.",
      },
    ],
    faqs: [
      {
        q: "Can I add a logo as a watermark?",
        a: "Yes. Upload a PNG (transparency supported) or JPEG and it is placed on every page with the opacity and scale you choose.",
      },
      {
        q: "Can the watermark be removed by someone else?",
        a: "Yes, in principle — any PDF editor can remove a drawn object. A watermark deters casual reuse; it is not encryption.",
      },
      {
        q: "Does the watermark show when printing?",
        a: "Yes. It is part of the page content, so it prints, appears in every viewer and survives email forwarding.",
      },
      {
        q: "Will it make my file much bigger?",
        a: "Text watermarks add a few kilobytes. Image watermarks add the image once, shared across pages, so the increase stays small.",
      },
      {
        q: "Can I watermark only some pages?",
        a: "Currently the same watermark is applied to every page, which is what most people need for drafts and confidential copies.",
      },
      {
        q: "Does it work on scanned PDFs?",
        a: "Yes. Scans are pages like any other; the watermark is drawn on top without touching the scanned image.",
      },
      {
        q: "Are my documents uploaded?",
        a: "No. The PDF is opened, stamped and saved inside your browser.",
      },
    ],
    related: ["add-page-numbers-to-pdf", "sign-pdf", "compress-pdf"],
    inputFormats: ["PDF", "PNG", "JPG"],
    outputFormats: ["PDF"],
    keywords: ["watermark pdf", "add draft watermark", "stamp pdf", "confidential watermark"],
    phase: 2,
    updated: "2026-10-27",
  },
  {
    slug: "sign-pdf",
    name: "Sign PDF",
    category: "pdf-tools",
    group: "edit",
    widget: "sign-pdf",
    icon: "PenLine",
    tagline: "Draw, type or upload a signature and place it on the right spot of any page.",
    bestFor: "You need to return a signed contract and printing, signing and scanning is not practical.",
    seoTitle: "Sign PDF Free — Draw, Type or Upload",
    metaDescription:
      "Add your signature to a PDF: draw it with a mouse or finger, type it, or upload an image. Drag to place and resize. Free, in your browser.",
    h1: "Sign PDF — Draw, Type or Upload a Signature",
    intro: [
      "Create a signature by drawing with a mouse, trackpad or finger, by typing your name in a script style, or by uploading a photo of your signature on white paper. Then click the page where it belongs and resize it to fit the line.",
      "The result is a standard PDF with your signature as an image on the chosen page — the same thing you would get from a print-sign-scan workflow, minus the scanner and the hundreds of kilobytes of noise it adds.",
    ],
    bullets: [
      {
        title: "Three ways to create a signature",
        text: "Draw freehand, type your name, or upload an existing signature image. Drawing works with a finger on a phone and a mouse on a desktop.",
      },
      {
        title: "Place it precisely",
        text: "The page is rendered so you can click exactly where the signature goes — above the line, not beside it — and adjust the width until it looks right.",
      },
      {
        title: "Transparent background",
        text: "Drawn and typed signatures are exported with a transparent background, so they sit on the page instead of showing a white rectangle.",
      },
      {
        title: "Any page",
        text: "Most documents are signed on the last page, but initials pages or two-signature contracts work too: choose the page number explicitly.",
      },
      {
        title: "No account, no upload",
        text: "Your signature image and the document stay on your device. Nothing is sent to a signing service, and no audit trail is created anywhere.",
      },
      {
        title: "Honest about legality",
        text: "This adds a visual signature. It is not a certificate-based digital signature with a cryptographic audit trail — the page says so plainly.",
      },
    ],
    steps: [
      {
        title: "Add the PDF",
        text: "Drop the document in and pick the page that needs signing.",
      },
      {
        title: "Create your signature",
        text: "Draw in the pad, type your name, or upload a PNG/JPG of your signature. Trim the white background yourself if you upload a photo.",
      },
      {
        title: "Place and resize",
        text: "Click on the rendered page to place the signature, then use the width slider to match the signature line.",
      },
      {
        title: "Apply and download",
        text: "Press Sign PDF, then open the result and zoom in on the signature to confirm it sits cleanly on the line.",
      },
    ],
    limits: [
      {
        title: "Not a certified digital signature",
        text: "There is no certificate, no timestamp authority and no tamper-evident seal. For documents that require a qualified electronic signature (some contracts, tax filings, notarised papers), use a certified provider.",
      },
      {
        title: "One signature per run",
        text: "Sign one page at a time. For a document requiring several signatures from different people, run the tool again for each, or use a dedicated e-sign service with an audit trail.",
      },
      {
        title: "It does not fill in form fields",
        text: "If the PDF has interactive signature fields, this tool draws over the page instead of signing the field. Most scanned contracts have no fields at all.",
      },
      {
        title: "Photo signatures need cleanup",
        text: "A phone photo of a signature brings paper texture and shadows. Drawing it in the pad, or uploading a clean scan, looks considerably better.",
      },
    ],
    tips: [
      {
        title: "Draw larger than you need",
        text: "A signature drawn in a small pad pixelates when enlarged. Draw it big, then scale down — detail survives and edges stay smooth.",
      },
      {
        title: "Add the date next to it",
        text: "Many contracts expect a date beside the signature. Use the PDF editor's text tool afterwards, or run this tool twice with a typed date.",
      },
      {
        title: "Keep a saved signature image",
        text: "If you sign often, keep a transparent PNG of your signature. Reusing it is faster and more consistent than redrawing each time.",
      },
      {
        title: "Check the final file on another device",
        text: "Open the signed PDF on your phone as well as your computer. Placement that looks right on a wide screen can sit badly on a narrow page.",
      },
    ],
    faqs: [
      {
        q: "Is a signature added this way legally valid?",
        a: "In many jurisdictions a visible signature on an agreed document is acceptable for everyday contracts, but rules vary by country and by document type. For anything that requires a certified or qualified electronic signature, use a provider that issues certificates.",
      },
      {
        q: "Can I sign with my finger on a phone?",
        a: "Yes. The signature pad supports touch, stylus and mouse input.",
      },
      {
        q: "Will the signature have a white box behind it?",
        a: "No. Drawn and typed signatures are exported with a transparent background. Uploaded photos keep whatever background they have, so use a clean scan or PNG.",
      },
      {
        q: "Can I sign a specific page?",
        a: "Yes. Choose the page number before placing the signature — page 12 of a 14-page contract works the same as page 1.",
      },
      {
        q: "Can I resize the signature after placing it?",
        a: "Yes, with the width slider before you apply it. Once applied, run the tool again on the result if you need a different size.",
      },
      {
        q: "Do you store my signature?",
        a: "No. It exists in the page's memory while the tool is open and is written into your downloaded PDF only.",
      },
      {
        q: "Can several people sign the same PDF?",
        a: "Yes, one after another: each person signs their copy, then passes the file on. This tool is not a multi-party signing workflow with notifications.",
      },
    ],
    related: ["pdf-editor", "watermark-pdf", "add-page-numbers-to-pdf"],
    inputFormats: ["PDF", "PNG", "JPG"],
    outputFormats: ["PDF"],
    keywords: ["sign pdf", "add signature to pdf", "electronic signature", "sign document online"],
    popular: true,
    phase: 2,
    updated: "2026-10-27",
  },
  {
    slug: "pdf-editor",
    name: "PDF Editor",
    shortName: "Editor",
    category: "pdf-tools",
    group: "edit",
    widget: "pdf-editor",
    icon: "PenTool",
    tagline: "Build a PDF from a blank page or annotate an existing one — text, shapes, colours, images.",
    bestFor: "Making a one-page document from nothing, or marking up a PDF before returning it.",
    seoTitle: "PDF Editor — Create and Annotate PDFs Free",
    metaDescription:
      "Create a PDF from a blank page or annotate an existing one: text, shapes, images, colours and layers, all in your browser. No upload, no account.",
    h1: "PDF Editor — Create a PDF From Scratch or Annotate One",
    intro: [
      "There are two ways to start: open a blank page and build a document from nothing, or drop in an existing PDF and draw on top of it. Either way you get text, shapes, images, colours, opacity and layers — with undo, a searchable tool palette and a live page preview.",
      "It is honest about one thing up front: this is an object editor, not a word processor for PDFs. You cannot click a line of existing text and retype it, because a PDF stores positioned glyphs rather than paragraphs. You can cover a line and write a replacement on top, or rebuild the page in a blank document — and the page tells you which is which.",
    ],
    bullets: [
      {
        title: "Start blank or start from a file",
        text: "Blank documents come in A4, US Letter, Legal, A5, A3 or square, portrait or landscape, with as many pages as you need. Or open an existing PDF and place objects on any of its pages.",
      },
      {
        title: "Type onto the page, not into a form",
        text: "Pick Text, click where the words should go and start typing in place — the box grows as you type and the caret sits exactly where the printed text will. Double-click any text box to change it again, and choose the family, size (4–200 pt), bold, italic, alignment, spacing and colour in the inspector. The export writes real selectable text, not a picture of words.",
      },
      {
        title: "Eight shapes plus a pen",
        text: "Rectangle, rounded box, ellipse, triangle, polygon, star, line and arrow, plus freehand drawing that keeps the size and thickness you drew it with — big letters or a small tick, exactly as drawn. Every shape has fill, outline, outline width and opacity, and the geometric ones carry real shape options: corner radius from 0 to 90 pt on rectangles, 3 to 16 sides on a polygon, and 3 to 16 points with an inner-radius slider on a star.",
      },
      {
        title: "Drawn the way a design app draws",
        text: "Hold Shift while dragging for a perfect square or circle, or press Make it a square / circle afterwards. A selection frame follows the object, including when it is rotated, so the handles always sit on its real edges and resizing moves the edge you grabbed.",
      },
      {
        title: "A real colour picker",
        text: "Each colour control opens your system colour wheel, takes a hex code and offers sixteen ready swatches — so a brand colour is one paste away and a custom shade is one click.",
      },
      {
        title: "Move, resize, rotate, stack",
        text: "Select any object to drag it, pull a corner to resize, nudge it with the arrow keys, rotate it up to ±180°, duplicate it, or send it forward and backward in the layer stack.",
      },
      {
        title: "Searchable tools and full undo",
        text: "Type “oval” or “arrow” to filter the palette instead of hunting for an icon, and step back through fifty edits with Ctrl+Z — drags, typing, colour changes and page operations alike.",
      },
      {
        title: "Page control",
        text: "Add a blank page anywhere, duplicate a page with its objects, reorder pages, or delete one. A page strip with thumbnails shows where you are.",
      },
    ],
    steps: [
      {
        title: "Choose a starting point",
        text: "Pick a page size for a blank document, or drop in a PDF you want to add to. Nothing is uploaded either way — the file is read in your browser.",
      },
      {
        title: "Pick a tool",
        text: "Search the palette or click a tool: select, text, image, rectangle, rounded box, ellipse, triangle, line, arrow, highlight, white-out or pen.",
      },
      {
        title: "Draw on the page",
        text: "Click for a default-size object or drag to draw an exact box. Text is placed with a click and edited in the panel on the right.",
      },
      {
        title: "Style and arrange it",
        text: "Set fill, outline, opacity, rotation and font in the inspector. Drag to move, use the corner handles to resize, and the arrow keys for fine nudges.",
      },
      {
        title: "Download the PDF",
        text: "Press Download PDF. Every page is rebuilt in the order shown, your objects are written into them, and text remains selectable in the result.",
      },
    ],
    limits: [
      {
        title: "Existing text cannot be retyped",
        text: "There is no click-a-sentence-and-retype. A PDF page is a list of glyphs at fixed coordinates, so editing one means rewriting the page. Browsers have no library that does this safely — the products that can are paid desktop-class SDKs. Cover the line and write over it, or rebuild the page in a blank document.",
      },
      {
        title: "White-out is not redaction",
        text: "A white rectangle hides text visually, but the original characters stay in the file and can still be extracted. For genuinely confidential data, rebuild the page without it — never treat white-out as safe redaction.",
      },
      {
        title: "No reflow, no forms, no page rotation",
        text: "Objects are placed exactly where you put them; text does not reflow around an image and nothing is re-laid out. Interactive form fields are not filled, and existing pages are not rotated or cropped here.",
      },
      {
        title: "Fonts are the twelve built-in ones plus DejaVu",
        text: "Sans, serif and mono map to the standard PDF fonts (Helvetica, Times, Courier) in four styles each. Text outside Latin-1 automatically switches to the bundled DejaVu Sans, which has no italic or bold-italic — so italic is dropped rather than faked for those scripts.",
      },
      {
        title: "Images must be PNG or JPEG",
        text: "SVG and HEIC are not embedded by the PDF writer. Convert them first with the image converter; the placement box keeps the aspect ratio you give it, so set the box roughly square before inserting a logo.",
      },
    ],
    tips: [
      {
        title: "Build a letterhead once",
        text: "Start a blank A4 page, add a logo image and a thin rule, then duplicate the page. You now have a stationery template without touching a word processor.",
      },
      {
        title: "Cover, then match the type",
        text: "Correcting one word in a scan: white-out the word, add a text box in near-black, and set the size until it matches the line beside it. At 100% zoom nobody can tell.",
      },
      {
        title: "Use opacity for watermarks",
        text: "A large diagonal word at 10–15% opacity makes a convincing draft or confidential watermark without hiding the content beneath it. Rotate it to about −35°.",
      },
      {
        title: "Zoom in for exact placement",
        text: "As soon as a file is open — or a blank page started — the editor takes the full width of the window and the sidebar steps out of the way. Use the − and + buttons above the page, or Ctrl/⌘ with − + 0, to work anywhere from 50% to 300%; the objects, the text and the corner handles all scale with the page, so a caption can be lined up to the pixel. Fit width returns to 100%, and Full width switches the wide view on or off by hand.",
      },
      {
        title: "Nudge instead of dragging",
        text: "Select an object and use the arrow keys for one-pixel movements, or Shift plus arrow for bigger steps. It is far quicker than trying to drag something into exact alignment.",
      },
      {
        title: "Keep the source file",
        text: "An export is a flattening step: objects become part of the page. Keep the original PDF and your notes so a later change does not mean starting from the exported copy.",
      },
    ],
    faqs: [
      {
        q: "Can I edit the text that is already in the PDF?",
        a: "No — and no browser tool honestly can. A PDF stores each glyph at a fixed position, so changing a word means rebuilding the page's content stream. You can cover the line with white-out and type a replacement on top, or copy the text out and rebuild the page in a blank document. Anything promising true text editing online is either a paid SDK or is rebuilding the page behind the scenes.",
      },
      {
        q: "Can I create a PDF from nothing?",
        a: "Yes. Choose a page size and orientation, then add text, shapes and images. It is a practical way to make a one-page letterhead, certificate, invoice, sign or poster without installing anything.",
      },
      {
        q: "Is the text I add selectable in the exported PDF?",
        a: "Yes. Text is written as real text in the PDF, so it can be selected, searched and copied, and it stays sharp at any zoom. It is not converted to an image.",
      },
      {
        q: "What happens to the pages of my original PDF?",
        a: "They are kept in the order shown in the page strip, and your objects are drawn onto them. You can insert blank pages, duplicate a page, reorder or delete pages before exporting.",
      },
      {
        q: "Can I undo a mistake?",
        a: "Yes — Ctrl+Z (or Cmd+Z) steps back through up to fifty edits, and Ctrl+Shift+Z redoes. Dragging, typing, colour changes and page operations each record an undo step.",
      },
      {
        q: "Is my file uploaded?",
        a: "No. The PDF is read with the File API, rendered for preview in the tab, and rewritten locally when you export. Nothing is sent anywhere, which is why the tool also works offline once the page has loaded.",
      },
      {
        q: "Why did my italic text lose its italics?",
        a: "Because the text used characters the standard fonts cannot encode, so the bundled DejaVu Sans was used instead — and that font ships without an italic face. Latin text keeps bold and italic normally; other scripts are drawn upright rather than slanted artificially.",
      },
    ],
    related: ["add-text-to-pdf", "add-shapes-to-pdf", "pdf-metadata"],
    inputFormats: ["Blank page", "PDF", "PNG", "JPEG"],
    outputFormats: ["PDF", "Selectable text"],
    keywords: ["pdf editor", "edit pdf", "create pdf", "add text to pdf", "pdf maker", "draw on pdf", "free pdf editor"],
    popular: true,
    phase: 2,
    updated: "2026-10-30",
  },
  {
    slug: "pdf-metadata",
    name: "PDF Metadata Editor",
    category: "pdf-tools",
    group: "edit",
    widget: "pdf-metadata",
    icon: "Tag",
    tagline: "See and change the title, author, subject and keywords stored inside a PDF.",
    bestFor: "You are publishing a PDF and want the browser tab, search result or file listing to show the right title.",
    seoTitle: "Edit PDF Metadata — Title, Author, Keywords",
    metaDescription:
      "View and edit a PDF's document properties: title, author, subject and keywords. Clean up metadata before sharing. Free and fully in-browser.",
    h1: "PDF Metadata Editor — Fix the Properties Nobody Sees",
    intro: [
      "Every PDF carries a small block of document information: title, author, subject, keywords, the application that created it and dates. It is what your browser shows in the tab instead of the filename, and what colleagues see in a file listing.",
      "This tool reads those values, lets you correct them, and writes a clean document back. It is also the quickest way to strip a company name or a template title that should not travel with the file.",
    ],
    bullets: [
      {
        title: "See what is actually in the file",
        text: "Most PDFs contain metadata nobody remembers setting — an old author name, an internal project title, a template keyword list. This page shows it before you decide.",
      },
      {
        title: "Edit the four useful fields",
        text: "Title, author, subject and keywords. Those are the ones that show up in readers, search results and the browser tab.",
      },
      {
        title: "Clear a field completely",
        text: "Empty a box to remove the value. Useful when a document should not carry a personal or company name.",
      },
      {
        title: "Keywords as a list",
        text: "Separate with commas or semicolons; the tool stores them as a proper keyword array rather than one long string.",
      },
      {
        title: "Content untouched",
        text: "Only the document-information dictionary changes. Pages, images, fonts and annotations stay exactly as they were.",
      },
      {
        title: "Local and free",
        text: "The file is read and rewritten in your browser. No upload, no account, no watermark.",
      },
    ],
    steps: [
      {
        title: "Add the PDF",
        text: "Drop the file in. Existing metadata loads into the form within a second or two.",
      },
      {
        title: "Edit the fields",
        text: "Correct the title, add your name as author, describe the subject and add keywords. Leave a field empty to remove it.",
      },
      {
        title: "Save",
        text: "Press Save metadata. The tool rewrites the document information and reports the new file size.",
      },
      {
        title: "Check the browser tab",
        text: "Open the saved PDF in a browser: the tab should now show your title. That is the same value other readers display.",
      },
    ],
    limits: [
      {
        title: "XMP packets are only partly handled",
        text: "Many modern PDFs store metadata twice: in the classic document information dictionary and in an XMP packet. This tool updates the first and removes the second in most cases, but some scanning software re-adds its own values on open.",
      },
      {
        title: "It is not anonymisation",
        text: "Removing a name from the metadata does not remove embedded fonts, image thumbnails or annotations that may identify the source. Treat metadata editing as tidying, not as making a document anonymous.",
      },
      {
        title: "Creation dates are preserved",
        text: "The original creation date stays (the modification date is updated). Editing it would misrepresent the document's history.",
      },
      {
        title: "Encrypted PDFs",
        text: "Password-protected files cannot be read here, so their metadata cannot be edited.",
      },
    ],
    tips: [
      {
        title: "Publishing a CV or portfolio",
        text: "Set the title to “Jane Smith — CV 2026” so the browser tab and search results show something meaningful instead of “document1”.",
      },
      {
        title: "Before sending a template",
        text: "Agency templates often carry the original client's name in the author field. Clear it, or replace it with your own, before the file leaves your machine.",
      },
      {
        title: "Keywords help internal search",
        text: "If your team searches a document management system by keyword, the metadata field is often indexed. Add three to six specific terms — “invoice, 2026, Q3, supplier” beats “misc”.",
      },
      {
        title: "What metadata is actually readable",
        text: "Title, author, subject, keywords, creator and producer are the fields a file manager, email client or search index will show. Filling in a clear title and author makes a document findable in a shared drive months later.",
      },
      {
        title: "Metadata is a paper trail",
        text: "Author and producer fields often record the software and the person who last saved the file. If you are sending a document outside your organisation, check those fields rather than assuming a re-export cleaned them.",
      },
      {
        title: "Strip the tags before publishing",
        text: "Documents exported from an internal system often carry a project code or a template name in the keyword field, which is harmless internally and confusing on a public website. Clearing keywords and subject before uploading takes a few seconds.",
      },
      {
        title: "Clearing is not redaction",
        text: "Emptying the metadata removes the labels, not anything drawn or embedded in the pages. It also cannot remove text that is part of the page content, so check the visible page too before publishing.",
      },
    ],
    faqs: [
      {
        q: "What metadata does a PDF contain?",
        a: "Typically the title, author, subject, keywords, creator application, producer, and creation and modification dates. Some files also contain XMP data, thumbnails and annotations.",
      },
      {
        q: "Will editing metadata change my content?",
        a: "No. Only the document-information block is rewritten; every page and object is preserved.",
      },
      {
        q: "Why does my PDF show a strange title in the browser tab?",
        a: "Browsers show the PDF's metadata title when it exists, and the filename otherwise. Setting the title field fixes the tab, the print header and many file listings at once.",
      },
      {
        q: "Does removing the author make the file anonymous?",
        a: "Not reliably. Fonts, image hashes and software traces can still identify a source. For genuine anonymity, recreate the document or rasterise it in a controlled way.",
      },
      {
        q: "Can I add keywords for search engines?",
        a: "You can add them, but mainstream search engines largely ignore PDF keyword metadata. The visible text and the title matter far more.",
      },
      {
        q: "Is the metadata editor free?",
        a: "Yes, with no watermark and no limit on how many files you process.",
      },
    ],
    related: ["compress-pdf", "pdf-editor", "watermark-pdf"],
    inputFormats: ["PDF"],
    outputFormats: ["PDF"],
    keywords: ["pdf metadata", "edit pdf properties", "remove pdf author", "pdf title editor"],
    phase: 2,
    updated: "2026-10-27",
  },
];
