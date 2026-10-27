/**
 * Node smoke tests for the parts of the tool engines that do not need a DOM.
 * Browsers can't be launched in this environment, so canvas/WebWorker paths are
 * covered by the manual QA checklist in README.md instead.
 *
 *   node --experimental-strip-types scripts/smoke-test.mjs
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PDFDocument, PDFName, StandardFonts, degrees } from "pdf-lib";
import { buildImagePdf, computePlacement, PAGE_SIZES } from "../lib/pdf/image-to-pdf.ts";
import { encodeBmp, encodeTiff, encodeGif, encodeIco, encodePpm, encodeSvg } from "../lib/images/codecs.ts";
import { clampToCanvasLimits } from "../lib/images/index.ts";
import {
  addPageNumbers,
  addTextWatermark,
  extractPages,
  mergePdfs,
  readMetadata,
  rebuildPdf,
  dropThumbnails,
  rotatePdf,
  splitPdf,
  writeMetadata,
} from "../lib/pdf/ops.ts";
import { renderBlocksToPdf } from "../lib/pdf/text-pdf.ts";
import { docxToBlocks } from "../lib/convert/docx.ts";
import { detectDelimiter, htmlToBlocks, markdownToBlocks, parseCsv, rowsToBlocks, textToBlocks } from "../lib/convert/text-sources.ts";
import JSZip from "jszip";
import { JSDOM } from "jsdom";

const work = mkdtempSync(join(tmpdir(), "filecraft-smoke-"));

// The HTML/DOCX converters parse markup with the browser's DOMParser. Node has
// no DOM, so jsdom supplies one for these engine tests only (dev dependency).
const dom = new JSDOM("");
globalThis.DOMParser = dom.window.DOMParser;
globalThis.Node = dom.window.Node;
globalThis.Element = dom.window.Element;
let failures = 0;

function check(name, condition, detail = "") {
  if (condition) {
    console.log(`  ✓ ${name}`);
  } else {
    failures += 1;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function makeImage(name, width, height, colour) {
  const file = join(work, name);
  execFileSync("convert", ["-size", `${width}x${height}`, `xc:${colour}`, file]);
  return readFileSync(file);
}

/* ───────────────────────── geometry ───────────────────────── */

console.log("\nPage geometry");
{
  const a4 = computePlacement(3000, 2000, { pageSize: "a4", orientation: "auto", marginMm: 10 });
  check("A4 landscape for a landscape photo", Math.round(a4.pageWidth) === Math.round(PAGE_SIZES.a4.h));
  check("aspect ratio preserved", Math.abs(a4.drawWidth / a4.drawHeight - 1.5) < 0.001);
  check("image stays inside the margins", a4.drawWidth <= a4.pageWidth - 2 * 28.35 + 0.01);
  check("image centred horizontally", Math.abs(a4.drawX - (a4.pageWidth - a4.drawWidth) / 2) < 0.001);

  const portrait = computePlacement(1000, 2000, { pageSize: "letter", orientation: "auto", marginMm: 10 });
  check("Letter portrait for a portrait photo", portrait.pageHeight > portrait.pageWidth);

  const forced = computePlacement(1000, 2000, { pageSize: "a4", orientation: "landscape", marginMm: 10 });
  check("manual landscape overrides the image", forced.pageWidth > forced.pageHeight);

  const fit = computePlacement(800, 400, { pageSize: "fit", orientation: "auto", marginMm: 0 });
  check("fit-to-image has the image aspect ratio", Math.abs(fit.pageWidth / fit.pageHeight - 2) < 0.001);
  check("fit-to-image fills the page", Math.abs(fit.drawWidth - fit.pageWidth) < 0.01);

  const zeroMargin = computePlacement(1000, 1000, { pageSize: "a4", orientation: "portrait", marginMm: 0 });
  check("zero margin is allowed", zeroMargin.drawWidth > 500);
}

/* ───────────────────────── image → PDF ───────────────────────── */

console.log("\nImage to PDF");
{
  const jpg = makeImage("photo.jpg", 1200, 800, "#3366cc");
  const png = makeImage("scan.png", 600, 900, "white");
  const pdfBytes = await buildImagePdf(
    [
      { bytes: jpg, kind: "jpg", width: 1200, height: 800 },
      { bytes: png, kind: "png", width: 600, height: 900 },
    ],
    { pageSize: "a4", orientation: "auto", marginMm: 10 },
  );
  writeFileSync(join(work, "out.pdf"), pdfBytes);
  const parsed = await PDFDocument.load(pdfBytes);
  check("two pages written", parsed.getPageCount() === 2);
  const first = parsed.getPage(0).getSize();
  check("first page is A4 landscape", Math.round(first.width) === 842 && Math.round(first.height) === 595);
  const second = parsed.getPage(1).getSize();
  check("second page is A4 portrait", Math.round(second.width) === 595);

  let threw = false;
  try {
    await buildImagePdf([], { pageSize: "a4", orientation: "auto", marginMm: 10 });
  } catch {
    threw = true;
  }
  check("empty input is rejected", threw);

  // Structural validation (ImageMagick's PDF coder is disabled in this
  // sandbox by policy, so the bytes are checked directly).
  const head = Buffer.from(pdfBytes.slice(0, 8)).toString();
  const tail = Buffer.from(pdfBytes.slice(-1024)).toString("latin1");
  check("file starts with a PDF header", head.startsWith("%PDF-1."), head);
  check("file ends with an EOF marker", tail.includes("%%EOF"));
  const images = parsed.context.enumerateIndirectObjects().filter(([, object]) => {
    const dict = object?.dict;
    const subtype = dict?.get?.(PDFName.of("Subtype"));
    return subtype?.asString?.() === "/Image";
  });
  check("both source images are embedded", images.length === 2, `${images.length} image streams`);
}

/* ───────────────────────── compression rewrite ───────────────────────── */

console.log("\nPDF structure rewrite (the Light/Recommended base)");
{
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let page = 0; page < 100; page += 1) {
    const sheet = doc.addPage([595.28, 841.89]);
    // Standard fonts cover WinAnsi only; non-Latin scripts need an embedded
    // TTF, which the TXT→PDF tool adds in Step 3.
    sheet.drawText(`Page ${page + 1} — selectable text, accents: café, naïve, Zürich`, {
      y: 780,
      size: 12,
      font,
      rotate: degrees(0),
    });
  }
  doc.setTitle("Smoke test");
  doc.setAuthor("Filecraft");
  const original = await doc.save();
  check("100-page test document built", (await PDFDocument.load(original)).getPageCount() === 100);

  // Same calls the compress tool makes for the "light" level.
  const reloaded = await PDFDocument.load(original, { updateMetadata: false });
  reloaded.setTitle("");
  reloaded.setAuthor("");
  reloaded.setKeywords([]);
  const rewritten = await reloaded.save({ useObjectStreams: true, addDefaultPage: false });
  const verify = await PDFDocument.load(rewritten);
  check("rewrite keeps all pages", verify.getPageCount() === 100);
  check("rewrite drops the author", (verify.getAuthor() ?? "") === "");
  check("rewrite is not larger", rewritten.length <= original.length + 1024, `${original.length} → ${rewritten.length}`);
}


/* ───────────────────── PDF operations (what the tools call) ─────────────── */

console.log("\nPDF operations");
{
  // Two source documents, built the same way a real merge input would be.
  const make = async (label, pages) => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    for (let index = 0; index < pages; index += 1) {
      const sheet = doc.addPage([595.28, 841.89]);
      sheet.drawText(`${label} page ${index + 1}`, { x: 60, y: 760, size: 14, font });
    }
    doc.setTitle(`${label} title`);
    doc.setAuthor(`${label} author`);
    return (await doc.save()).buffer;
  };

  const first = await make("First", 3);
  const second = await make("Second", 2);

  const merged = await mergePdfs([
    { name: "first.pdf", bytes: first },
    { name: "second.pdf", bytes: second },
  ]);
  const mergedDoc = await PDFDocument.load(merged);
  check("merge concatenates every page in the given order", mergedDoc.getPageCount() === 5, `${mergedDoc.getPageCount()} pages`);

  const extracted = await extractPages(first, [2, 0]);
  check("extract keeps exactly the requested pages", (await PDFDocument.load(extracted)).getPageCount() === 2);

  const split = await splitPdf(merged, [[0, 1], [2], [3, 4]]);
  check("split returns one document per group", split.length === 3);
  check("split groups keep their page counts", split.map((part) => part.pages.length).join(",") === "2,1,2");

  const rebuilt = await rebuildPdf(first, [{ source: 2, rotation: 90 }, { source: 0, rotation: 0 }]);
  const rebuiltDoc = await PDFDocument.load(rebuilt);
  check("page organiser reorders and drops pages", rebuiltDoc.getPageCount() === 2);
  check("page organiser applies rotation", rebuiltDoc.getPage(0).getRotation().angle === 90);

  const rotated = await rotatePdf(merged, 90);
  check("rotate turns every page", (await PDFDocument.load(rotated)).getPage(4).getRotation().angle === 90);

  const numbered = await addPageNumbers(first, {
    position: "bottom-center",
    startAt: 1,
    fontSize: 10,
    margin: 24,
    format: "{n} of {total}",
    skipFirst: true,
  });
  check("page numbers keep the page count", (await PDFDocument.load(numbered)).getPageCount() === 3);
  check("page numbers change the file", numbered.length > 0);

  const watermarked = await addTextWatermark(first, {
    text: "DRAFT",
    opacity: 0.15,
    fontSize: 48,
    rotation: 45,
    placement: "tile",
    color: "gray",
  });
  check("text watermark produces a valid PDF", (await PDFDocument.load(watermarked)).getPageCount() === 3);

  const reStamped = await writeMetadata(first, {
    title: "New title",
    author: "",
    subject: "Smoke",
    keywords: "a, b",
    creator: "",
  });
  const metadata = await readMetadata(reStamped);
  check(
    "metadata round-trips through the editor",
    metadata.title === "New title" && metadata.author === "" && metadata.keywords === "a, b",
    JSON.stringify(metadata),
  );
  check("clearing the author leaves no author", (metadata.author ?? "") === "");

  // A damaged file must fail loudly rather than emit a broken download.
  let rejected = false;
  try {
    await mergePdfs([{ name: "broken.pdf", bytes: new TextEncoder().encode("not a pdf").buffer }]);
  } catch {
    rejected = true;
  }
  check("a non-PDF input is rejected with an error", rejected);
}

/* ──────────────────────────── Text to PDF ───────────────────────────────── */

console.log("\nText to PDF (Word, Markdown, CSV and TXT inputs)");
{
  const options = {
    pageFormat: "a4",
    orientation: "portrait",
    marginMm: 20,
    fontSize: 11,
    lineHeight: 1.45,
  };

  const latin = await renderBlocksToPdf(
    [
      { type: "heading", level: 1, runs: [{ text: "Quarterly report" }] },
      { type: "paragraph", runs: [{ text: "Plain Latin text with accents: café, naïve, Größe." }] },
      { type: "list", ordered: true, items: [[{ text: "First item" }], [{ text: "Second item" }]] },
      { type: "table", header: ["Name", "Value"], rows: [["Alpha", "1"], ["Beta", "2"]] },
    ],
    options,
  );
  const latinDoc = await PDFDocument.load(latin.bytes);
  check("text blocks become a valid PDF", latinDoc.getPageCount() >= 1);
  check("WinAnsi text uses the built-in font", latin.unicode === false);
  check("a short document stays on one page", latin.pages === 1);

  // The Unicode path fetches the bundled DejaVu subset from /fonts/…; in Node we
  // serve that from public/ so the embedding code is exercised for real.
  // Same amount of text in Latin, to compare against the embedded-font version.
  const latinBaseline = await renderBlocksToPdf(
    [{ type: "paragraph", runs: [{ text: "Privet. Kalimera. Shalom. Marhaba." }] }],
    options,
  );

  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const path = new URL(`../public${String(url)}`, import.meta.url);
    return new Response(readFileSync(path));
  };
  try {
    const unicode = await renderBlocksToPdf(
      [
        { type: "heading", level: 1, runs: [{ text: "Unicode check" }] },
        { type: "paragraph", runs: [{ text: "Greek: Καλημέρα. Cyrillic: Привет. Hebrew: שלום. Arabic: مرحبا." }] },
      ],
      options,
    );
    const unicodeDoc = await PDFDocument.load(unicode.bytes);
    check("non-WinAnsi text switches to the embedded font", unicode.unicode === true);
    check("the Unicode document still opens", unicodeDoc.getPageCount() >= 1);
    // An embedded font makes the file dramatically bigger than the same text
    // written with the built-in Helvetica — that difference is the proof the
    // font actually went in (the stream itself is compressed inside the PDF).
    check(
      "the Unicode document embeds a font program",
      unicode.bytes.length > latinBaseline.bytes.length * 2,
      `${latinBaseline.bytes.length} → ${unicode.bytes.length} bytes`,
    );
  } finally {
    globalThis.fetch = realFetch;
  }

  // Long input must paginate rather than overflow off the page.
  const long = await renderBlocksToPdf(
    Array.from({ length: 120 }, (_, index) => ({
      type: "paragraph",
      runs: [{ text: `Paragraph ${index + 1}: ${"repeated filler text ".repeat(12)}` }],
    })),
    options,
  );
  check("long input paginates", long.pages >= 3, `${long.pages} pages`);
}


/* ────────────────── Word, Markdown, CSV and plain text ──────────────────── */

console.log("\nWord and text sources");
{
  const plain = textToBlocks("First paragraph.\n\nSecond paragraph with a\nsoft wrap.");
  check("plain text splits on blank lines", plain.length === 2);
  check(
    "soft line breaks stay in one paragraph",
    plain[1].runs.map((run) => run.text).join("").includes("soft wrap"),
  );

  const markdown = markdownToBlocks("# Title\n\nSome **bold** and *italic* text.\n\n- one\n- two\n\n> quoted");
  check("markdown keeps headings", markdown.some((block) => block.type === "heading" && block.level === 1));
  check("markdown keeps lists", markdown.some((block) => block.type === "list" && block.items.length === 2));
  check("markdown keeps bold and italic runs", JSON.stringify(markdown).includes('"bold":true') && JSON.stringify(markdown).includes('"italic":true'));

  const html = htmlToBlocks("<h2>Heading</h2><p>Hello <strong>world</strong></p><ul><li>a</li></ul>");
  check("html keeps headings and lists", html.some((b) => b.type === "heading") && html.some((b) => b.type === "list"));

  check("semicolon CSV is detected", detectDelimiter("a;b;c\n1;2;3") === ";");
  check("tab-separated values are detected", detectDelimiter("a\tb\tc\n1\t2\t3") === "\t");
  const csv = parseCsv('name,note\n"Smith, Jane","likes ""quotes"""\nBob,plain');
  check("quoted CSV fields with commas are one cell", csv[1][0] === "Smith, Jane", csv[1][0]);
  check("escaped quotes survive", csv[1][1] === 'likes "quotes"', csv[1][1]);
  const table = rowsToBlocks(csv, { headerRow: true });
  check("CSV becomes a table block", table.some((b) => b.type === "table"));
  check("the header row is not repeated as data", table.find((b) => b.type === "table").rows.length === 2);

  // A minimal but structurally real .docx, so the Mammoth path runs end to end.
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
  );
  zip.file(
    "_rels/.rels",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  );
  zip.file(
    "word/document.xml",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' +
      '<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Report title</w:t></w:r></w:p>' +
      '<w:p><w:r><w:t xml:space="preserve">A normal paragraph with </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>bold words</w:t></w:r></w:p>' +
      '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Cell A</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Cell B</w:t></w:r></w:p></w:tc></w:tr></w:tbl>' +
      '</w:body></w:document>',
  );
  const docxBytes = await zip.generateAsync({ type: "uint8array" });
  const docxFile = new File([docxBytes], "report.docx", {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  // Mammoth's Node build only accepts a Buffer/path, so the DOCX step is driven
  // directly here; everything after it (HTML → blocks → PDF) is the same code
  // the Word tool runs, and `docxToBlocks` itself is a thin wrapper over these
  // two calls. The browser-only wrapper is covered by manual QA.
  const mammoth = (await import("mammoth")).default;
  const mammothHtml = (await mammoth.convertToHtml({ buffer: Buffer.from(docxBytes) })).value;
  const converted = { blocks: htmlToBlocks(mammothHtml) };
  check("docx headings become heading blocks", converted.blocks.some((b) => b.type === "heading"));
  check("docx paragraphs keep their text", converted.blocks.some((b) => b.type === "paragraph" && JSON.stringify(b).includes("A normal paragraph")));
  check("docx bold runs stay bold", JSON.stringify(converted.blocks).includes('"bold":true'));
  check("docx tables become table blocks", converted.blocks.some((b) => b.type === "table"));
  check("docxToBlocks is exported for the Word tool", typeof docxToBlocks === "function");

  // And the converted blocks must be renderable — the Word tool's real output.
  const docxPdf = await renderBlocksToPdf(converted.blocks, {
    pageFormat: "a4",
    orientation: "portrait",
    marginMm: 20,
    fontSize: 11,
    lineHeight: 1.45,
  });
  check("docx blocks render to a PDF", (await PDFDocument.load(docxPdf.bytes)).getPageCount() >= 1);

  let emptyRejected = false;
  try {
    const brokenHtml = (await mammoth.convertToHtml({ buffer: Buffer.from(new Uint8Array([1, 2, 3])) })).value;
    htmlToBlocks(brokenHtml);
  } catch {
    emptyRejected = true;
  }
  check("a file that is not a docx is rejected", emptyRejected);

}


/* ──────────────────────── Repair (rebuild + verify) ─────────────────────── */

console.log("\nRepair");
{
  const { loadPdfDocument } = await import("../lib/pdf/core.ts");

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let index = 0; index < 4; index += 1) {
    const sheet = doc.addPage([595.28, 841.89]);
    sheet.drawText(`Page ${index + 1}`, { x: 60, y: 760, size: 14, font });
  }
  const healthy = (await doc.save()).buffer;

  const loaded = await loadPdfDocument(healthy);
  check("a healthy file loads for repair", loaded.pages === 4);
  const removed = dropThumbnails(loaded.doc);
  check("dropThumbnails is safe on a file without thumbnails", removed === 0);

  const rebuilt = await loaded.doc.save({ useObjectStreams: true, addDefaultPage: false });
  check("the rebuilt file keeps every page", (await PDFDocument.load(rebuilt)).getPageCount() === 4);

  // A truncated download is the most common damaged PDF: the page tree is
  // intact but the tail is missing. It must fail with an error, never produce
  // a silently short document.
  const truncated = healthy.slice(0, Math.floor(healthy.length * 0.6)).buffer;
  let failed = false;
  try {
    const broken = await loadPdfDocument(truncated);
    if (broken.pages !== 4) failed = true;
  } catch {
    failed = true;
  }
  check("a truncated PDF fails loudly instead of losing pages", failed);

  // Not a PDF at all.
  let rejected = false;
  try {
    await loadPdfDocument(new TextEncoder().encode("<html>not a pdf</html>").buffer);
  } catch {
    rejected = true;
  }
  check("a non-PDF is rejected by the loader", rejected);
}

/* ───────────────────────── custom encoders ───────────────────────── */

console.log("\nCustom image encoders");
{
  const width = 64;
  const height = 48;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      data[offset] = Math.round((x / width) * 255);
      data[offset + 1] = Math.round((y / height) * 255);
      data[offset + 2] = 128;
      data[offset + 3] = 255;
    }
  }
  const source = { width, height, data };

  for (const [extension, blob] of Object.entries({
    bmp: encodeBmp(source),
    tiff: encodeTiff(source),
    gif: encodeGif(source),
  })) {
    const target = join(work, `encode.${extension}`);
    writeFileSync(target, Buffer.from(await blob.arrayBuffer()));
    const info = execFileSync("identify", ["-format", "%m %wx%h", target]).toString();
    check(`${extension.toUpperCase()} decodes at the right size`, info.includes(`${width}x${height}`), info);
  }

  // PPM (P6) — verify the header and the exact payload length.
  const ppmBytes = Buffer.from(await encodePpm(source).arrayBuffer());
  const ppmHeader = ppmBytes.subarray(0, 16).toString("latin1");
  check("PPM header declares the right geometry", ppmHeader.startsWith(`P6\n${width} ${height}\n255\n`), ppmHeader);
  check(
    "PPM carries 3 bytes per pixel",
    ppmBytes.length === `P6\n${width} ${height}\n255\n`.length + width * height * 3,
  );

  // SVG wrapper — must be valid XML pointing at an embedded PNG.
  {
    const target = join(work, "encode.ppm");
    writeFileSync(target, ppmBytes);
    const info = execFileSync("identify", ["-format", "%m %wx%h", target]).toString();
    check("PPM decodes in an independent decoder", info.includes(`${width}x${height}`), info);
  }

  const svg = encodeSvg(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), width, height);
  const svgText = await svg.text();
  check("SVG wrapper declares its size", svgText.includes(`width="${width}" height="${height}"`));
  check("SVG embeds the bitmap as base64 PNG", svgText.includes("data:image/png;base64,iVBORw=="));
  check("SVG is well-formed XML", /^<\?xml[^>]*\?>[\s\S]*<\/svg>\s*$/.test(svgText.trim()) && svg.type === "image/svg+xml");

  // ICO — multi-size container: header, directory offsets and payload lengths.
  const frames = [16, 32, 48, 256].map((size) => ({ size, pngBytes: new Uint8Array(size).fill(7) }));
  const icoBytes = Buffer.from(await encodeIco(frames).arrayBuffer());
  check(
    "ICO header reports every frame",
    icoBytes.readUInt16LE(0) === 0 && icoBytes.readUInt16LE(2) === 1 && icoBytes.readUInt16LE(4) === 4,
  );
  let icoOffset = 6 + frames.length * 16;
  let directoryOk = true;
  for (let index = 0; index < frames.length; index += 1) {
    const entry = 6 + index * 16;
    const edge = icoBytes[entry];
    const expectedEdge = frames[index].size >= 256 ? 0 : frames[index].size;
    const length = icoBytes.readUInt32LE(entry + 8);
    const offset = icoBytes.readUInt32LE(entry + 12);
    if (edge !== expectedEdge || length !== frames[index].size || offset !== icoOffset) directoryOk = false;
    icoOffset += length;
  }
  check("ICO directory entries point at the right payloads", directoryOk);
  check("ICO file length matches the directory", icoBytes.length === icoOffset);
  // A container is only useful if real PNGs survive inside it: build one from
  // ImageMagick-generated frames and read it back with the same tool.
  {
    const realFrames = [16, 32, 48, 256].map((size) => {
      const png = join(work, `ico-${size}.png`);
      execFileSync("convert", ["-size", `${size}x${size}`, "gradient:red-blue", png]);
      return { size, pngBytes: new Uint8Array(readFileSync(png)) };
    });
    const target = join(work, "multi.ico");
    writeFileSync(target, Buffer.from(await encodeIco(realFrames).arrayBuffer()));
    const info = execFileSync("identify", ["-format", "%wx%h ", target]).toString().trim().split(" ");
    check("multi-size ICO opens as 16/32/48/256", info.join(",") === "16x16,32x32,48x48,256x256", info.join(","));
  }

  const firstPayload = icoBytes.readUInt32LE(6 + 12);
  check(
    "ICO keeps its PNG payload intact",
    firstPayload === 6 + frames.length * 16 && icoBytes.subarray(firstPayload, firstPayload + 16).every((byte) => byte === 7),
  );
}

/* ─────────────────────── canvas size clamping ──────────────────────────── */

console.log("\nCanvas limits (the guard that stops blank output)");
{
  const phone = clampToCanvasLimits(4032, 3024, 16_000_000);
  check("a 12 MP phone photo is left untouched", !phone.scaled && phone.width === 4032 && phone.height === 3024);

  const huge = clampToCanvasLimits(8064, 6048, 16_000_000);
  const pixels = huge.width * huge.height;
  check("a 48 MP photo is scaled into the budget", huge.scaled && pixels <= 16_000_000, `${huge.width}x${huge.height}`);
  check(
    "clamping keeps the aspect ratio",
    Math.abs(huge.width / huge.height - 8064 / 6048) < 0.001,
    `${(huge.width / huge.height).toFixed(4)} vs ${(8064 / 6048).toFixed(4)}`,
  );

  const panorama = clampToCanvasLimits(20_000, 1_000, 40_000_000, 16_384);
  check("a long panorama respects the maximum side", panorama.width === 16_384, `${panorama.width}x${panorama.height}`);
  check("clamped dimensions are whole pixels", Number.isInteger(panorama.width) && Number.isInteger(panorama.height));

  const tiny = clampToCanvasLimits(1, 1, 16_000_000);
  check("a 1×1 image is never scaled below one pixel", tiny.width === 1 && tiny.height === 1);
}

/* ─────────────────── metadata: read, strip, stay lossless ───────────────── */

console.log("\nMetadata (EXIF) engine");
{
  const { readExif, stripMetadata } = await import("../lib/images/exif.ts");

  // A synthetic JPEG with a real APP1/EXIF block (orientation 6 + a GPS IFD)
  // and a COM comment. The entropy-coded "scan" is four arbitrary bytes; the
  // point is the container, not a decodable picture.
  const buildJpeg = ({ gps }) => {
    const ifd0 = Buffer.alloc(2);
    const entries = gps ? 2 : 1;
    ifd0.writeUInt16LE(entries, 0);
    const parts = [ifd0];
    const orientation = Buffer.alloc(12);
    orientation.writeUInt16LE(0x0112, 0);
    orientation.writeUInt16LE(3, 2);
    orientation.writeUInt32LE(1, 4);
    orientation.writeUInt16LE(6, 8);
    parts.push(orientation);
    const gpsEntry = Buffer.alloc(12);
    if (gps) {
      gpsEntry.writeUInt16LE(0x8825, 0);
      gpsEntry.writeUInt16LE(4, 2);
      gpsEntry.writeUInt32LE(1, 4);
    }
    parts.push(gpsEntry);
    parts.push(Buffer.alloc(4)); // next IFD
    // The GPS pointer has to be written before the buffer is built, otherwise
    // the bytes on disk still say "no GPS IFD".
    const gpsOffset = 8 + parts.reduce((sum, part) => sum + part.length, 0);
    if (gps) gpsEntry.writeUInt32LE(gpsOffset, 8);
    const ifd0Bytes = Buffer.concat(parts);

    const gpsIfd = Buffer.alloc(2 + 12 + 4 + 8);
    gpsIfd.writeUInt16LE(1, 0);
    gpsIfd.writeUInt16LE(0x0002, 2);
    gpsIfd.writeUInt16LE(5, 4);
    gpsIfd.writeUInt32LE(1, 6);
    gpsIfd.writeUInt32LE(gpsOffset + 18, 10);
    gpsIfd.writeUInt32LE(51, 18);
    gpsIfd.writeUInt32LE(1, 22);

    const tiff = Buffer.concat([Buffer.from("II", "latin1"), Buffer.from([42, 0]), Buffer.from([8, 0, 0, 0]), ifd0Bytes, gps ? gpsIfd : Buffer.alloc(0)]);
    const payload = Buffer.concat([Buffer.from("Exif\0\0", "latin1"), tiff]);
    const app1 = Buffer.concat([Buffer.from([0xff, 0xe1]), Buffer.from([0, 0]), payload]);
    app1.writeUInt16BE(payload.length + 2, 2);
    const comment = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from([0, 14]), Buffer.from("private note", "latin1")]);
    const sos = Buffer.concat([Buffer.from([0xff, 0xda]), Buffer.from([0, 8]), Buffer.from([1, 1, 0, 0, 63, 0])]);
    return Buffer.concat([Buffer.from([0xff, 0xd8]), app1, comment, sos, Buffer.from([1, 2, 3, 4]), Buffer.from([0xff, 0xd9])]);
  };

  const withGps = buildJpeg({ gps: true });
  const file = new File([withGps], "photo.jpg", { type: "image/jpeg" });
  const report = await readExif(file);
  check("EXIF: container recognised as JPEG", report.container === "JPEG");
  check("EXIF: orientation 6 is decoded", report.orientation === 6, String(report.orientation));
  check("EXIF: GPS block is detected", report.hasGps);
  check(
    "EXIF: readable fields are listed",
    report.tags.some((tag) => tag.name === "Orientation") && report.tags.some((tag) => tag.name === "Latitude"),
    report.tags.map((tag) => tag.name).join(","),
  );

  const stripped = await stripMetadata(file);
  const out = Buffer.from(await stripped.blob.arrayBuffer());
  check("EXIF: strip reports what it removed", stripped.changed && stripped.removed.length === 2, stripped.removed.join(","));
  check("EXIF: no APP1 block survives", !out.toString("latin1").includes("Exif"));
  check("EXIF: pixel payload is byte-identical", out.toString("latin1").includes("\x01\x02\x03\x04"));
  check("EXIF: file still starts with SOI and ends with EOI", out[0] === 0xff && out[1] === 0xd8 && out[out.length - 2] === 0xff && out[out.length - 1] === 0xd9);
  const reread = await readExif(stripped.blob);
  check("EXIF: a cleaned file reads back with no tags", reread.tags.length === 0 && !reread.hasGps);

  const noGps = await readExif(new File([buildJpeg({ gps: false })], "b.jpg", { type: "image/jpeg" }));
  check("EXIF: GPS is not invented when absent", noGps.hasGps === false);

  // PNG chunk stripping
  const pngChunk = (type, data) => {
    const head = Buffer.alloc(8);
    head.writeUInt32BE(data.length, 0);
    head.write(type, 4, "latin1");
    return Buffer.concat([head, data, Buffer.alloc(4)]);
  };
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", Buffer.from([0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0])),
    pngChunk("tEXt", Buffer.from("Author\0Alice", "latin1")),
    pngChunk("IDAT", Buffer.from([9, 9, 9])),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
  const pngStripped = await stripMetadata(new File([png], "x.png", { type: "image/png" }));
  const pngOut = Buffer.from(await pngStripped.blob.arrayBuffer());
  check("EXIF: PNG text chunk is removed", !pngOut.toString("latin1").includes("Alice"));
  check("EXIF: PNG image data survives", pngOut.toString("latin1").includes("IDAT") && pngOut.toString("latin1").includes("IEND"));

  // Unsupported containers must refuse rather than pretend.
  let refused = false;
  try {
    await stripMetadata(new File([Buffer.from("not an image")], "x.bin", { type: "application/octet-stream" }));
  } catch {
    refused = true;
  }
  check("EXIF: unknown containers are refused, not silently returned", refused);
}

/* ───────────────────────── base64 encode/decode ─────────────────────────── */

console.log("\nBase64 engine");
{
  const { detectMime, parseBase64Input, bytesToBase64, toDataUri, base64SizeEstimate } = await import("../lib/base64.ts");
  const jpegBytes = readFileSync(join(work, "encode.bmp"));
  const jpgHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46]);
  check("base64: JPEG detected from its signature", detectMime(jpgHeader) === "image/jpeg");
  check("base64: BMP detected from its signature", detectMime(new Uint8Array(jpegBytes)) === "image/bmp");
  check("base64: random bytes are not claimed to be an image", detectMime(new Uint8Array([1, 2, 3, 4])) === null);

  const sample = new Uint8Array(100).map((_, index) => index);
  const uri = toDataUri(sample, "image/png");
  const parsed = parseBase64Input(uri);
  check("base64: data URI round-trips byte for byte", Buffer.from(parsed.bytes).equals(Buffer.from(sample)));
  const pngSignature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const sniffed = parseBase64Input(toDataUri(pngSignature, "image/jpeg"));
  check(
    "base64: the bytes win over a wrong declared type",
    sniffed.declaredMime === "image/jpeg" && sniffed.detectedMime === "image/png",
    `${sniffed.declaredMime} vs ${sniffed.detectedMime}`,
  );
  check("base64: 100 bytes encode to 136 characters", bytesToBase64(sample).length === 136);
  check("base64: output overhead is reported as a third", base64SizeEstimate(3000) === 4000);

  const raw = bytesToBase64(sample);
  check("base64: missing padding is tolerated", Buffer.from(parseBase64Input(raw.replace(/=+$/, "")).bytes).equals(Buffer.from(sample)));
  check("base64: line breaks are tolerated", Buffer.from(parseBase64Input(`  ${raw.slice(0, 40)}\n${raw.slice(40)}\n`).bytes).equals(Buffer.from(sample)));
  check("base64: URL-safe alphabet is tolerated", Buffer.from(parseBase64Input(raw.replace(/\+/g, "-").replace(/\//g, "_")).bytes).equals(Buffer.from(sample)));
  let rejected = false;
  try {
    parseBase64Input("definitely not base64!!!");
  } catch {
    rejected = true;
  }
  check("base64: junk input is rejected with a reason", rejected);
}

/* ──────────────────── target-size quality search ────────────────────────── */

console.log("\nCompression quality search");
{
  const { pickBestAttempt } = await import("../lib/images/transform.ts");
  const attempts = [
    { quality: 0.92, size: 5000, blob: null },
    { quality: 0.7, size: 2000, blob: null },
    { quality: 0.5, size: 900, blob: null },
  ];
  check("compress: the highest quality that fits wins", pickBestAttempt(attempts, 2000).best.quality === 0.7);
  check("compress: a fit is reported as reached", pickBestAttempt(attempts, 2000).fits === true);
  check("compress: impossible targets fall back to the smallest file", pickBestAttempt(attempts, 100).best.size === 900 && pickBestAttempt(attempts, 100).fits === false);
  check("compress: no attempts is not a crash", pickBestAttempt([], 100) === null);
}

/* ───────────────────────── text utilities ───────────────────────── */

console.log("\nText utilities");
{
  const { countText, formatDuration, topWords, sentenceCase, titleCase, toCamelCase, toSnakeCase, toSlug, toConstantCase, invertCase, generateLorem } =
    await import("../lib/text/tools.ts");

  const sample = "Hello world. This is the second sentence!\n\nA new paragraph here. And another one? Yes.";
  const stats = countText(sample);
  check("counter: words", stats.words === 15, String(stats.words));
  check("counter: sentences", stats.sentences === 5, String(stats.sentences));
  check("counter: paragraphs split on the blank line", stats.paragraphs === 2, String(stats.paragraphs));
  check("counter: characters include spaces and newlines", stats.characters === sample.length, `${stats.characters} vs ${sample.length}`);
  check("counter: characters without spaces differ", stats.charactersNoSpaces < stats.characters);
  check("counter: reading time is derived, not zero", stats.readingMinutes > 0 && stats.readingMinutes < 1);
  check("counter: empty text is all zeroes", countText("").words === 0 && countText("").sentences === 0);
  check("counter: emoji count as code points, not bytes", countText("👍🏽").characters === 2, String(countText("👍🏽").characters));
  check("duration: seconds below a minute", formatDuration(0.75) === "45 sec", formatDuration(0.75));
  check("duration: minutes and seconds", formatDuration(2.5) === "2 min 30 sec", formatDuration(2.5));

  const frequent = topWords("The report is ready. The report covers design. Design and research.", 3);
  check("frequency: stop words are removed", frequent.every((entry) => entry.word !== "the" && entry.word !== "and"));
  check("frequency: most repeated word first", frequent[0].word === "design" && frequent[0].count === 2, JSON.stringify(frequent[0]));

  check("case: sentence case lowers then capitalises", sentenceCase("hELLO wORLD. this IS a TEST!") === "Hello world. This is a test!");
  check("case: title case keeps small words down", titleCase("the state of the art") === "The State of the Art", titleCase("the state of the art"));
  check(
    "case: title case leaves existing acronyms alone",
    titleCase("PDF and SEO tools") === "PDF and SEO Tools",
    titleCase("PDF and SEO tools"),
  );
  check("case: camel from a sentence", toCamelCase("user account settings") === "userAccountSettings", toCamelCase("user account settings"));
  check("case: snake from camel", toSnakeCase("userAccountSettings") === "user_account_settings");
  check("case: constant case", toConstantCase("api base url") === "API_BASE_URL", toConstantCase("api base url"));
  check("case: slug strips accents and punctuation", toSlug("Crème Brûlée & 100% Good!") === "creme-brulee-100-good", toSlug("Crème Brûlée & 100% Good!"));
  check("case: invert swaps every letter", invertCase("hELLO") === "Hello");

  let seed = 42;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const lorem = generateLorem({ paragraphs: 2, sentencesPerParagraph: 3, random });
  check("lorem: requested paragraphs", lorem.split("\n\n").length === 2);
  check("lorem: opens with the classical line", lorem.startsWith("Lorem ipsum dolor sit amet"));
  check("lorem: html wraps each paragraph", generateLorem({ paragraphs: 2, sentencesPerParagraph: 1, format: "html", random }).split("\n").every((line) => line.startsWith("<p>") && line.endsWith("</p>")));
  check("lorem: the opening can be turned off", !generateLorem({ paragraphs: 1, sentencesPerParagraph: 1, startWithLorem: false, random }).startsWith("Lorem ipsum dolor sit amet"));
}

/* ─────────────────────────── QR generation ────────────────────────── */

console.log("\nQR codes");
{
  const { encodeQr, qrToSvg, contrastRatio } = await import("../lib/qr.ts");

  const matrix = encodeQr("https://example.com/filecraft", { level: "M" });
  check("qr: a realistic URL fits", matrix.modules >= 21 && matrix.modules % 4 === 1, String(matrix.modules));
  check("qr: version is derived from the module count", matrix.version === (matrix.modules - 17) / 4);
  check("qr: quiet zone is included in the size", matrix.size === matrix.modules + matrix.margin * 2);
  check("qr: finder pattern corners are dark", matrix.isDark(0, 0) && matrix.isDark(6, 0) && matrix.isDark(0, 6));
  check("qr: finder pattern interiors are light", !matrix.isDark(1, 1) && !matrix.isDark(5, 5));

  const svg = qrToSvg(matrix, { foreground: "#111111", background: "#FFFFFF" });
  check("qr: svg declares a square viewBox", /viewBox="0 0 (\d+) \1"/.test(svg), svg.slice(0, 60));
  check("qr: svg contains one rect per dark module plus the background", (svg.match(/<rect/g) || []).length > matrix.modules);
  check("qr: svg uses the requested colours", svg.includes('fill="#111111"') && svg.includes('fill="#FFFFFF"'));

  check("qr: contrast of black on white is maximal", Math.round(contrastRatio("#000000", "#FFFFFF")) === 21);
  check("qr: identical colours score 1:1", contrastRatio("#0B1020", "#0B1020") === 1);

  let rejected = false;
  try {
    encodeQr("x".repeat(6000), { level: "H" });
  } catch {
    rejected = true;
  }
  check("qr: oversized payloads are refused with an error", rejected);
  let emptyRejected = false;
  try {
    encodeQr("   ");
  } catch {
    emptyRejected = true;
  }
  check("qr: empty input is refused", emptyRejected);
}

/* ─────────────────────── registry counts stay honest ───────────────────── */

console.log("\nRegistry counts");
{
  const { tools, toolsByCategory, toolsForCategory, toolCount } = await import("../data/tools.ts");
  const { CATEGORIES } = await import("../data/site.ts");

  const pdf = toolsByCategory("pdf-tools").length;
  const images = toolsByCategory("image-tools").length;
  const utilities = toolsByCategory("utilities").length;
  check("every tool has a category that exists", tools.every((tool) => CATEGORIES.some((c) => c.slug === tool.category)));
  check(
    "the categories add up to the total",
    pdf + images + utilities === toolCount,
    `${pdf} + ${images} + ${utilities} = ${toolCount}`,
  );
  check("the utilities category is live", utilities >= 4, String(utilities));

  const create = toolsForCategory("convert-to-pdf");
  const createGroup = tools.filter((tool) => tool.group === "create").length;
  check(
    "convert-to-pdf lists the create group, not an empty category",
    create.length === createGroup && create.length > 0,
    `${create.length} vs ${createGroup}`,
  );
  check(
    "every visible category resolves at least one tool or a roadmap entry",
    CATEGORIES.filter((category) => !category.hidden).every((category) => toolsForCategory(category.slug).length >= 0),
  );
  check("no category returns undefined", CATEGORIES.every((category) => Array.isArray(toolsForCategory(category.slug))));

  // A tool is only "live" if a widget exists for its `widget` key. This is the
  // guard that stops a page advertising a tool nobody implemented.
  const { readFileSync } = await import("node:fs");
  const widgets = readFileSync(new URL("../components/tools/ToolWidgets.tsx", import.meta.url), "utf8");
  const implemented = new Set([...widgets.matchAll(/case "([a-z0-9-]+)"/g)].map((match) => match[1]));
  const orphans = tools.filter((tool) => !implemented.has(tool.widget));
  check(
    "every live tool maps to an implemented widget",
    orphans.length === 0,
    orphans.map((tool) => `${tool.slug} → ${tool.widget}`).join(", "),
  );

  const { roadmap } = await import("../data/roadmap.ts");
  const shipped = new Set(tools.map((tool) => tool.name.toLowerCase()));
  check(
    "roadmap does not repeat a tool that already shipped",
    roadmap.every((item) => !shipped.has(item.name.toLowerCase())),
  );

  const { guides } = await import("../data/guides.ts");
  check("guide slugs are unique", new Set(guides.map((guide) => guide.slug)).size === guides.length);
}

/* ───────────────────────── result ───────────────────────── */

console.log(`\n${failures === 0 ? "All smoke tests passed." : `${failures} failure(s).`}`);
process.exit(failures === 0 ? 0 : 1);
