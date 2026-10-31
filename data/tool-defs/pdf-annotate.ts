import type { Tool } from "@/lib/tool-types";

/**
 * Annotation landing pages. Each one opens the same editor with a different
 * tool preselected — the slug says what the person came to do, and the page
 * gets them there in one click instead of hunting through a toolbar.
 */
export const pdfAnnotateTools: Tool[] = [
  {
    slug: "add-text-to-pdf",
    name: "Add Text to PDF",
    shortName: "Add Text",
    category: "pdf-tools",
    group: "edit",
    widget: "pdf-editor",
    icon: "Type",
    preset: { editorTool: "text" },
    tagline: "Type a correction, a date or a note anywhere on the page.",
    bestFor: "A form needs a value filled in, or a date is missing from a signed letter.",
    seoTitle: "Add Text to PDF — Type Anywhere on the Page",
    metaDescription:
      "Add text to a PDF in your browser: click where the text goes, choose a colour and size, then download. No upload, no account, no watermark.",
    h1: "Add Text to PDF — Type Anywhere on a Page",
    intro: [
      "Click a spot on the page and a text box is placed exactly there. That is the honest version of “editing” a PDF: the page image is unchanged underneath, and your text sits on top of it, written into the file when you export.",
      "It is the right tool for filling a blank, adding a date, marking a clause or correcting an address — not for rewriting paragraphs, which needs the original document.",
    ],
    bullets: [
      {
        title: "Click to place, type where it lands",
        text: "Click where the text should go and type straight onto the page, in a box that grows with the words. Double-click any text box later to change what it says — nothing is flattened until you export.",
      },
      {
        title: "Real type controls",
        text: "Three font families, sizes from 4 to 200 pt, bold, italic, three alignments and adjustable line spacing, plus sixteen swatches, a hex field and the system colour wheel for the colour.",
      },
      {
        title: "Page-by-page precision",
        text: "Switch pages with the selector and each annotation remembers the page it belongs to. A preview shows exactly where everything sits before export.",
      },
      {
        title: "Text becomes part of the page",
        text: "On export the text is drawn into the page content, so it prints, appears in every viewer and cannot be dragged around by the recipient.",
      },
      {
        title: "Nothing is uploaded",
        text: "The page is rendered, annotated and re-written in the tab. Text you type never touches a server — which matters when the note is confidential.",
      },
    ],
    steps: [
      {
        title: "Open the PDF",
        text: "Drop the file in and wait for the page preview to appear.",
      },
      {
        title: "Type your text",
        text: "Enter it in the text field and pick a colour and size before placing it.",
      },
      {
        title: "Click where it should go",
        text: "Click on the page and the text appears at that point. Add more notes the same way, or select one and press Delete (or Ctrl+Z to undo).",
      },
      {
        title: "Export",
        text: "Press Export PDF. The download contains your text written into the pages, ready to send.",
      },
    ],
    limits: [
      {
        title: "Existing text cannot be edited",
        text: "A PDF stores glyphs at fixed coordinates with no paragraph structure, so there is nothing to reflow. Adding text is possible; modifying the original characters is not. If you need that, edit the source document and re-export.",
      },
      {
        title: "Fonts are limited",
        text: "Placed text uses a standard PDF font for Latin characters, with a bundled Unicode font for Greek, Cyrillic, Hebrew and Arabic. Indic scripts, Chinese, Japanese, Korean and emoji are not supported yet.",
      },
      {
        title: "No text wrapping",
        text: "Each placement is a single line. Long sentences run to the page edge, so write short notes or place them in several pieces.",
      },
    ],
    tips: [
      {
        title: "Match the document's look",
        text: "Body text at 10–11 pt is usually right for a form field; 14 pt reads like a stamp. Black for form values, red for corrections a reviewer should notice.",
      },
      {
        title: "Place text before signing",
        text: "If a page needs both a note and a signature, add the note first so the signature does not end up underneath it.",
      },
      {
        title: "Keep a copy of the original",
        text: "The export is a new file, so your source stays clean. Still, check the result on the page you edited before sending it onwards.",
      },
      {
        title: "Match the type around it",
        text: "A note looks pasted-on when it is the wrong size. Body text in most PDFs is 10 or 11 pt, so start there and nudge until the height of your letters matches the line beside them. Long notes wrap inside the box, so drag the box wide enough for the break you want.",
      },
    ],
    faqs: [
      {
        q: "Can I edit the text that is already in the PDF?",
        a: "No, and no browser tool honestly can. Existing characters are positioned instructions, not editable paragraphs. You can cover a mistake with a white box or a highlight, or add corrected text next to it — but the original characters remain in the file.",
      },
      {
        q: "Does the added text show up when printed?",
        a: "Yes. The text is drawn into the page content, so it prints exactly as it appears on screen and in any other PDF viewer.",
      },
      {
        q: "Can I use a non-Latin script?",
        a: "Greek, Cyrillic, Hebrew and Arabic work because a Unicode font is embedded automatically. Chinese, Japanese, Korean, Hindi and other Indic scripts are not supported yet, and the tool will not pretend otherwise.",
      },
      {
        q: "How do I remove text I placed?",
        a: "Select the note and press Delete, or use Undo (Ctrl+Z) while you are still on the page. Nothing is written to the file until you press Download PDF.",
      },
      {
        q: "Can I add text to several pages?",
        a: "Yes. Annotations are kept per page, so you can move through the document and place text on each page before exporting once.",
      },
      {
        q: "Is the result a flattened image?",
        a: "No. The page keeps its original quality and its text layer; your addition is drawn on top. That means the file stays small and the original text remains selectable.",
      },
      {
        q: "Can I move text after I place it?",
        a: "Yes, before you export. A placed note is an object like any other: select it and drag it where you want it, or delete it and click again. Nothing is written to the file until you press Download PDF, so a bad placement is a two-second correction rather than a permanent mistake.",
      },
    ],
    related: ["highlight-pdf", "draw-on-pdf", "pdf-editor"],
    inputFormats: ["PDF"],
    outputFormats: ["PDF"],
    keywords: ["add text to pdf", "type on pdf", "write on pdf", "add text pdf online"],
    popular: true,
    phase: 2,
    updated: "2026-10-27",
  },
  {
    slug: "highlight-pdf",
    name: "Highlight PDF",
    shortName: "Highlight",
    category: "pdf-tools",
    group: "edit",
    widget: "pdf-editor",
    icon: "Highlighter",
    preset: { editorTool: "highlight" },
    tagline: "Mark the sentences that matter, in colour, without printing anything.",
    bestFor: "Reviewing a contract, a paper or a report and marking what needs attention.",
    seoTitle: "Highlight PDF — Mark Text Without Printing",
    metaDescription:
      "Highlight text in a PDF in your browser. Drag over a line to mark it in yellow, red, blue or green, then download. No upload, no account.",
    h1: "Highlight PDF — Mark Up Pages in the Browser",
    intro: [
      "Drag across a line of text and the area is filled with a translucent colour that lets the words show through — exactly like a highlighter on paper, except the file stays a file and the marking takes seconds.",
      "Multiple colours let you run a simple system: yellow for interesting, red for problems, green for approved. Everything is written into the page when you export.",
    ],
    bullets: [
      {
        title: "Drag, don't click",
        text: "Highlights are areas: press, drag across the text, release. The preview shows the exact rectangle before you commit.",
      },
      {
        title: "Translucent, so the text stays readable",
        text: "The fill is a semi-transparent wash rather than a solid block, which is the difference between highlighting and redacting.",
      },
      {
        title: "Five colours, one system",
        text: "Yellow, red, blue, near-black and green — enough for a review workflow without a colour picker slowing you down.",
      },
      {
        title: "Page by page",
        text: "Highlights are stored per page and shown in the preview as you move through the document.",
      },
      {
        title: "Written into the file",
        text: "Export draws the highlights into the page content, so the recipient sees them without installing anything or enabling comments.",
      },
    ],
    steps: [
      {
        title: "Add the PDF",
        text: "Drop the file in and navigate to the page you are reviewing.",
      },
      {
        title: "Pick a colour",
        text: "Yellow is the default. Choose red for anything that must change before sign-off.",
      },
      {
        title: "Drag across the text",
        text: "Press at the start of the phrase and release at the end. Repeat for each sentence.",
      },
      {
        title: "Export and send",
        text: "Press Export PDF and download. Clear a page if a highlight landed in the wrong place.",
      },
    ],
    limits: [
      {
        title: "Highlights are rectangles, not text selection",
        text: "You mark an area, so a highlight over a paragraph spans its full width. Thin precision work — marking one word inside a line — needs a smaller drag.",
      },
      {
        title: "Not the same as a PDF comment",
        text: "Real annotations in the PDF spec can be toggled, listed and replied to. These marks are drawn into the page, which means they always print and cannot be switched off.",
      },
      {
        title: "A highlight is not redaction",
        text: "The text underneath is completely readable, and the words will still copy out of the file. Never use a highlight to hide confidential information.",
      },
      {
        title: "Marks are not comment objects",
        text: "Nothing appears in a comments sidebar, nothing can be replied to and no reviewer name is attached. If a workflow depends on trackable annotations, this tool produces a marked-up PDF rather than a review thread.",
      },
    ],
    tips: [
      {
        title: "One colour per meaning",
        text: "Agreeing a key before a review saves an email thread: yellow to discuss, red to fix, green approved. Enforcing it is easier when there are only five options.",
      },
      {
        title: "Highlight the clause, not the page",
        text: "A reviewer who sees eight full-page highlights will skip them. Short marks on the operative sentence carry more weight.",
      },
      {
        title: "Export before the meeting",
        text: "Marks live in the tab until you export. If the laptop sleeps, they go with it — download the file once the review is done.",
      },
      {
        title: "Dark colours read as emphasis, not highlighting",
        text: "The near-black option looks like a black marker: use it only when you mean “this is final” rather than “consider this”. On a form or a dense table, a thin yellow wash preserves the legibility that a saturated colour would destroy.",
      },
      {
        title: "Two passes beat one long session",
        text: "Highlight everything you consider relevant in yellow first, then go back over the document in red for the handful of points that must change. Splitting the job keeps the colours meaningful, and it stops a long review from becoming one undifferentiated mass of yellow.",
      },
    ],
    faqs: [
      {
        q: "Can I remove a highlight later?",
        a: "Before exporting, yes: select it, drag it, or delete it and draw again. Once exported, the highlight is part of the page content and needs an editor to cover or rebuild — so check the preview before you download.",
      },
      {
        q: "Will the recipient see my highlights without special software?",
        a: "Yes. Highlights are drawn into the page, so any viewer shows them — Acrobat, Preview, a phone, a printout. Nothing needs to be enabled.",
      },
      {
        q: "Can I highlight text on a scanned PDF?",
        a: "Yes, because you are marking an area rather than selecting characters. It works on any page, including a photo of a page.",
      },
      {
        q: "Do highlights change the selectable text?",
        a: "No. The text layer is untouched, so copying a highlighted sentence still gives you the sentence. Only the appearance of the page changes.",
      },
      {
        q: "Can I add notes in the margin as well?",
        a: "Use Add Text to PDF for margin notes — it places a text box wherever you click. The two tools share the same editor, so you can do both in one pass.",
      },
      {
        q: "Is anything uploaded while I highlight?",
        a: "No. The page is rendered and the marks are burned in locally. The file never leaves your device.",
      },
      {
        q: "Can I highlight several lines in one drag?",
        a: "Yes, though the result is a single tall rectangle rather than a set of separate line highlights. For a paragraph that is usually exactly what you want. For scattered phrases on the same line, separate short drags look tidier and keep unmarked words visually distinct.",
      },
    ],
    related: ["add-text-to-pdf", "draw-on-pdf", "pdf-editor"],
    inputFormats: ["PDF"],
    outputFormats: ["PDF"],
    keywords: ["highlight pdf", "highlight text in pdf", "mark up pdf", "annotate pdf"],
    phase: 2,
    updated: "2026-10-27",
  },
  {
    slug: "draw-on-pdf",
    name: "Draw on PDF",
    shortName: "Draw",
    category: "pdf-tools",
    group: "edit",
    widget: "pdf-editor",
    icon: "PenTool",
    preset: { editorTool: "draw" },
    tagline: "Sketch, circle and scribble freehand on any page with a mouse or finger.",
    bestFor: "Circling a figure in a diagram, or scrawling a quick mark on a form.",
    seoTitle: "Draw on PDF — Freehand Markup, No Printing",
    metaDescription:
      "Draw freehand on a PDF in your browser with a mouse, stylus or finger. Pick a colour, sketch, then download the file. No upload, no account.",
    h1: "Draw on PDF — Sketch and Mark Pages Freehand",
    intro: [
      "Freehand drawing is the fastest way to point at something: circle a number in a table, draw an arrow to a paragraph, or underline a clause with a wobbly hand-drawn line that reads as human.",
      "Everything you draw is captured as a path and written into the page on export, so it prints and shows in every viewer.",
    ],
    bullets: [
      {
        title: "Mouse, stylus or finger",
        text: "Drawing works with a pointer, so a laptop trackpad, a tablet stylus and a phone finger all behave the same way.",
      },
      {
        title: "Colour with meaning",
        text: "Red for “look at this”, blue for personal notes, green for sign-off — five options, chosen before you draw.",
      },
      {
        title: "Circles, arrows and underlines",
        text: "Nothing here is a shape tool. What makes a circle convincing is that it is drawn, which is exactly what freehand gives you.",
      },
      {
        title: "Per-page strokes",
        text: "Drawings belong to the page you drew them on, so a multi-page review stays organised.",
      },
      {
        title: "Flattened on export",
        text: "Strokes are written into the page, so there is nothing for the recipient to hide, move or accidentally delete.",
      },
    ],
    steps: [
      {
        title: "Open the PDF",
        text: "Drop the file and move to the page you want to mark.",
      },
      {
        title: "Choose a colour",
        text: "Pick the colour before you start; every stroke on the page uses it until you change it.",
      },
      {
        title: "Draw",
        text: "Press and move over the page. Lift and start again for a new stroke. Short taps do not create stray dots.",
      },
      {
        title: "Export",
        text: "Press Download PDF once everything is drawn. Objects can be selected, moved and deleted until you do.",
      },
    ],
    limits: [
      {
        title: "No eraser, only clearing",
        text: "You cannot rub out one stroke; you clear the page's annotations and draw again. That keeps the interface honest and simple, but it means long sessions are best done in one pass.",
      },
      {
        title: "Fixed line weight",
        text: "Stroke width is set for readability on screen and in print. Pressure sensitivity and brush sizes are not implemented.",
      },
      {
        title: "Not a vector-editable drawing",
        text: "On export the strokes become drawing operations in the page content. They are not a separate object you can select later in another editor.",
      },
      {
        title: "Drag performance drops on very large pages",
        text: "Strokes are captured as pointer events and redrawn as you move. A high-DPI laptop rendering a complex page can lag behind your hand on long strokes. Shorter strokes, lifted between them, stay responsive and produce cleaner mark-up.",
      },
      {
        title: "No pressure or tilt",
        text: "A stylus with pressure support is treated as an ordinary pointer, so every line has the same weight. For a signature that looks natural, Sign PDF uses a dedicated pad with smoothing and trimming.",
      },
    ],
    tips: [
      {
        title: "Zoom with your browser for precision",
        text: "A trackpad circle on a dense table is hard to control. Zoom the browser to 150–200% first — the drawing coordinates follow the rendered page.",
      },
      {
        title: "Underline rather than cross out",
        text: "Strokes over text hide the words. An underline or a bracket in the margin preserves readability while still pointing at exactly the sentence you mean.",
      },
      {
        title: "Draw after typing",
        text: "If a page needs both a note and a circle, place the text first. A stroke drawn across a text box makes the text harder to read.",
      },
      {
        title: "Trace, do not freehand, for diagrams",
        text: "If you need a precise arrow or a neat underline, place two or three short strokes end to end rather than one long sweep; each stroke starts fresh from where you press, which is far easier to control on a trackpad than a continuous line drawn across a moving page.",
      },
    ],
    faqs: [
      {
        q: "Can I undo a stroke?",
        a: "Yes, individually now. Click an object to select it and press Delete, or use Undo (Ctrl+Z) to step back. Nothing reaches the file until you press Download PDF.",
      },
      {
        q: "Does drawing work on a phone?",
        a: "Yes — touch input is handled as pointer events, so a finger works. A capacitive stylus is more precise; a rubber-tipped one is closer to a pencil.",
      },
      {
        q: "Will my drawing print?",
        a: "Yes. Strokes are written into the page content on export, so they appear in printouts and in every PDF viewer.",
      },
      {
        q: "Can I draw on a scanned document?",
        a: "Yes, and it is one of the better uses: circling a receipt line or ticking a box on a photographed form works exactly the same way.",
      },
      {
        q: "Is there an eraser tool?",
        a: "No. Rather than pretend to erase — which would leave the original stroke in the file — the tool clears annotations and lets you redraw. The page beneath is never damaged.",
      },
      {
        q: "Does this alter the original file?",
        a: "Never. Your source file is opened read-only; the export is a new document with your drawings added.",
      },
      {
        q: "Does my drawing stay in place if the page is printed larger?",
        a: "Yes. Strokes are stored as positions on the page, not as pixels, so they scale with the page and stay over the same words whether it is viewed on a phone or printed at A3. That is also why a drawing stays crisp instead of turning into a blurry smear.",
      },
    ],
    related: ["add-shapes-to-pdf", "highlight-pdf", "sign-pdf"],
    inputFormats: ["PDF"],
    outputFormats: ["PDF"],
    keywords: ["draw on pdf", "freehand pdf", "sketch on pdf", "scribble on pdf"],
    phase: 2,
    updated: "2026-10-27",
  },
  {
    slug: "add-shapes-to-pdf",
    name: "Add Shapes to PDF",
    shortName: "Add Shapes",
    category: "pdf-tools",
    group: "edit",
    widget: "pdf-editor",
    icon: "SquareDashed",
    preset: { editorTool: "rect" },
    tagline: "Draw boxes and outlines around whatever needs attention.",
    bestFor: "Pointing at a figure in a technical drawing or framing a form field for review.",
    seoTitle: "Add Shapes to PDF — Boxes and Callouts Free",
    metaDescription:
      "Add boxes and outlines to a PDF in your browser. Drag to draw, pick a colour, then download the marked file. No upload, no watermark, no account.",
    h1: "Add Shapes to PDF — Draw Boxes and Callouts",
    intro: [
      "A rectangle is the most efficient annotation in the world: it says “this part” without adding a single word. Drag one around a number, a clause or a figure and the reader's eye goes exactly where you want it.",
      "The editor here draws clean outlines rather than hand-drawn loops, which suits technical documents, invoices and forms where a wobbly circle would look careless.",
    ],
    bullets: [
      {
        title: "Drag to size, exactly",
        text: "Press and drag from one corner to the other. A dashed preview follows your pointer so the box lands where you intended.",
      },
      {
        title: "Clean outlines",
        text: "A crisp stroke rather than a filled block, so the content inside stays fully readable.",
      },
      {
        title: "Every colour you need",
        text: "Sixteen ready swatches — red for attention, blue for internal markup, green for approved, dark for official — plus a hex field and your system colour wheel for an exact brand shade.",
      },
      {
        title: "More than boxes",
        text: "The same palette draws ellipses, triangles, polygons (3 to 16 sides), stars (3 to 16 points with an adjustable inner radius) and rounded boxes with a corner radius you control. Hold Shift while dragging for a perfect square or circle, and resize anything afterwards by its corner handles.",
      },
      {
        title: "Any page, many boxes",
        text: "Add as many boxes as the page needs; each is stored with its page and shown in the preview.",
      },
      {
        title: "Burned in on export",
        text: "The outlines become part of the page content, so they print and travel with the file.",
      },
    ],
    steps: [
      {
        title: "Load the PDF",
        text: "Drop the file in and go to the page that needs marking.",
      },
      {
        title: "Switch to Box",
        text: "The shapes tool is preselected on this page. Choose a colour first.",
      },
      {
        title: "Drag a rectangle",
        text: "Press at one corner, drag to the opposite corner and release. Small accidental drags are ignored.",
      },
      {
        title: "Export",
        text: "Press Export PDF and download. Clear the page if a box is misplaced.",
      },
    ],
    limits: [
      {
        title: "Rectangles only",
        text: "Arrows, ellipses and callout bubbles are not implemented. A rectangle plus a line of added text covers most of the same ground.",
      },
      {
        title: "Not editable objects",
        text: "On export the rectangle is drawn into the page. Another PDF editor will not show it as a selectable shape, so make changes before you download.",
      },
      {
        title: "No fill option",
        text: "Outlines only, deliberately: a filled box over text is a redaction attempt, and this tool does not pretend to do that.",
      },
      {
        title: "Boxes do not snap to text or fields",
        text: "Alignment is by eye and by how steady your hand is at the end of a drag. Zooming the browser to 150% or more makes it far easier to line a box up with a figure or a table cell.",
      },
      {
        title: "No rotation or resize after drawing",
        text: "A rectangle is fixed once you release the pointer. Clear the page and redraw if it is off; the file is not touched until you export, so redrawing costs nothing but a few seconds.",
      },
    ],
    tips: [
      {
        title: "Box the number, not the paragraph",
        text: "A tight box around the figure that is wrong communicates faster than a large box around the surrounding text.",
      },
      {
        title: "Use boxes for review, highlights for reading",
        text: "Highlights show what you read; boxes show what needs changing. Mixing them on one page is fine — colours keep the intent clear.",
      },
      {
        title: "Number your callouts in text",
        text: "Add “1”, “2”, “3” next to each box with the text tool, then list them in the covering email. Reviewers can answer by number.",
      },
      {
        title: "Box the same element on every page",
        text: "In a form where the same field appears repeatedly, draw the box on page one, note its rough position, and repeat it on later pages at the same spot. Consistency reads as care; slightly different boxes on each page read as haste.",
      },
      {
        title: "Turn a shape into a signature line",
        text: "A rectangle across the bottom of a page, with a line of text underneath reading “Name, date”, makes a printable signing block on a document that never had one — useful when someone emails a letter as a PDF and asks you to sign it by hand.",
      },
    ],
    faqs: [
      {
        q: "Can I draw a circle or an arrow?",
        a: "Not with this tool. Boxes are the shape it draws. For an emphasis loop, Draw on PDF gives you freehand strokes; for underlines and arrows, a freehand line is usually enough.",
      },
      {
        q: "Can I redact by covering text with a filled box?",
        a: "No, and this tool will not tempt you into it. A drawn box never removes the text underneath, which can still be copied. Genuine redaction requires removing the content itself.",
      },
      {
        q: "Will the boxes appear in a printout?",
        a: "Yes. The rectangle is written into the page content, so it appears everywhere — screen, print and any viewer.",
      },
      {
        q: "Can I move a box after drawing it?",
        a: "Not yet. Clear the page's annotations and draw it again; nothing reaches the downloaded file until you export.",
      },
      {
        q: "Does this work on a form?",
        a: "Yes, and it is a common use: boxing the fields someone must fill in, with a short text note beside them.",
      },
      {
        q: "Are my files uploaded?",
        a: "No. Everything is drawn in the browser and written locally. You can verify it in the Network tab while the tool runs.",
      },
      {
        q: "Can a box span two pages?",
        a: "No — each rectangle lives on one page. If a table or a section runs across a page break, draw a box on each page and add a small text note such as “continued” so the reader is not left wondering whether the mark was cut off by accident.",
      },
    ],
    related: ["add-text-to-pdf", "draw-on-pdf", "highlight-pdf"],
    inputFormats: ["PDF"],
    outputFormats: ["PDF"],
    keywords: ["add shapes to pdf", "draw box on pdf", "rectangle annotation pdf", "mark pdf"],
    phase: 2,
    updated: "2026-10-27",
  },
  {
    slug: "remove-metadata-from-pdf",
    name: "Remove Metadata From PDF",
    shortName: "Remove Metadata",
    category: "pdf-tools",
    group: "security",
    widget: "pdf-metadata",
    icon: "ShieldCheck",
    preset: { clearMetadata: true },
    tagline: "Wipe the author, dates and software stamps hidden in a PDF's properties.",
    bestFor: "Sending a document outside your organisation without leaking who wrote it and when.",
    seoTitle: "Remove Metadata From PDF — Clear Properties",
    metaDescription:
      "Remove hidden metadata from a PDF in your browser: author, title, subject, keywords, creator and producer. Pages untouched. No upload.",
    h1: "Remove Metadata From PDF — Clear the Hidden Properties",
    intro: [
      "Every PDF carries a small block of properties: who authored it, which software produced it, when it was created and last modified, sometimes a title and keywords. None of it is visible on the page, all of it travels with the file.",
      "This tool opens those fields pre-cleared, so saving gives you a document with the properties wiped — without touching a single page.",
    ],
    bullets: [
      {
        title: "Everything cleared in one pass",
        text: "Title, author, subject, keywords, creator and producer are all emptied. Nothing is left behind by default.",
      },
      {
        title: "Shows you what was there",
        text: "The original values are listed before they are removed, so you can see whether the file exposed a name, a client or a project code.",
      },
      {
        title: "Pages are not re-rendered",
        text: "Only the document catalogue is rewritten. Text stays selectable, images keep their compression, and the file opens exactly as before.",
      },
      {
        title: "Works on any PDF",
        text: "Including files that have been edited many times, where properties have accumulated from several tools.",
      },
      {
        title: "No upload, ever",
        text: "Properties are read and rewritten in the tab, which matters because metadata is precisely the thing you did not want to broadcast.",
      },
    ],
    steps: [
      {
        title: "Add the PDF",
        text: "Drop the file in. Its existing properties are read immediately and shown to you.",
      },
      {
        title: "Check what will go",
        text: "Look at the listed values. If a field you need — such as the title — should stay, switch to the metadata editor and keep it.",
      },
      {
        title: "Save the cleaned file",
        text: "Press the button and download. The new file has the fields removed and its pages untouched.",
      },
    ],
    limits: [
      {
        title: "Metadata removal is not redaction",
        text: "Clearing properties removes the labels, not the page content. Text on the page, images and anything drawn in the file stay exactly where they are.",
      },
      {
        title: "Some editors re-add their own stamp",
        text: "If you open the cleaned file in an office suite and save it again, that software may write its own author and producer fields back in. Clean last, then send.",
      },
      {
        title: "Not every vendor field is covered",
        text: "Custom properties and XMP packets written by specialised tools may survive a rebuild. For files from an unusual source, check with a metadata viewer before publishing.",
      },
      {
        title: "Timestamps inside the page content stay",
        text: "Text such as “printed on 14 March” is part of the page, not the properties. Clearing metadata removes the machine-written dates the PDF specification defines; it does not touch anything that was typeset into the document.",
      },
    ],
    tips: [
      {
        title: "Clean before you publish, not before you edit",
        text: "Any application that saves a PDF will stamp it again. Do your edits first, then remove metadata as the final step before the file leaves your control.",
      },
      {
        title: "Metadata is a paper trail",
        text: "Producer fields often reveal the software and version used, and dates can reveal internal deadlines. Clearing them is normal hygiene for anything public.",
      },
      {
        title: "Check the visible page too",
        text: "Properties are only one half of a leak. A footer with a client name is page content and will survive; look at the document, not just the panel.",
      },
      {
        title: "Check the visible footer as well",
        text: "Metadata is only one half of a leak. A footer with a client name, a header with an internal project code or a scanned signature all survive metadata removal, because they are page content. Read the document as an outsider would before sending it.",
      },
      {
        title: "Compare one file before you batch",
        text: "Send yourself a single cleaned document and open its properties in your usual viewer. If the fields are empty there, the routine is sound and you can apply it to the rest of the batch with confidence instead of hoping the panel told the truth.",
      },
    ],
    faqs: [
      {
        q: "What exactly gets removed?",
        a: "The standard document information fields — title, author, subject, keywords, creator and producer — plus the modification timestamps written by this tool. The page content, fonts and images are untouched.",
      },
      {
        q: "Does this remove text that is hidden on the page?",
        a: "No. Invisible text, white-on-white text and text under a white box stay in the file. Removing those requires genuine redaction, which works on page content rather than properties.",
      },
      {
        q: "Will my PDF still open normally?",
        a: "Yes. Only the properties are rewritten; the pages, links, bookmarks and forms are unchanged, and the result is re-opened to confirm it is valid.",
      },
      {
        q: "Can I keep the title but remove the author?",
        a: "Yes — the PDF Metadata Editor on this site lets you edit field by field, so you can clear the author and dates while keeping a useful title.",
      },
      {
        q: "Does removing metadata reduce the file size?",
        a: "Only by a few kilobytes. Metadata is tiny; if you are chasing size, Compress PDF is the tool you want.",
      },
      {
        q: "Why did the author field come back after I edited the file elsewhere?",
        a: "Because the other application wrote its own values when it saved. Clean the file as the last step, after all editing, and send that copy.",
      },
      {
        q: "Does this remove editing history as well?",
        a: "It removes the standard document properties, which include the software stamp and the recorded modification dates. Older PDFs sometimes carry incremental-update history inside the file; rebuilding the document with Repair PDF drops that, so the two tools together cover both kinds of residue.",
      },
    ],
    related: ["pdf-metadata", "watermark-pdf", "compress-pdf"],
    inputFormats: ["PDF"],
    outputFormats: ["PDF"],
    keywords: ["remove metadata from pdf", "strip pdf metadata", "remove author from pdf", "pdf properties"],
    isNew: true,
    phase: 2,
    updated: "2026-10-27",
  },
];
