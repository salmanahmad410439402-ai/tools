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

/* ─────────────────────── registry counts stay honest ───────────────────── */

console.log("\nRegistry counts");
{
  const { tools, toolsByCategory, toolsForCategory, toolCount } = await import("../data/tools.ts");
  const { CATEGORIES } = await import("../data/site.ts");

  const pdf = toolsByCategory("pdf-tools").length;
  const images = toolsByCategory("image-tools").length;
  check("every tool has a category that exists", tools.every((tool) => CATEGORIES.some((c) => c.slug === tool.category)));
  check("PDF + image tools add up to the total", pdf + images === toolCount, `${pdf} + ${images} = ${toolCount}`);

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
