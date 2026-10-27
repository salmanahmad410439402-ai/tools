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
import { encodeBmp, encodeTiff, encodeGif, encodeIco } from "../lib/images/codecs.ts";

const work = mkdtempSync(join(tmpdir(), "filecraft-smoke-"));
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

  // ICO needs PNG bytes; reuse the BMP payload's header check instead of PNG.
  const ico = encodeIco(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), 32, 32);
  const icoBytes = Buffer.from(await ico.arrayBuffer());
  check(
    "ICO header is valid",
    icoBytes.readUInt16LE(0) === 0 && icoBytes.readUInt16LE(2) === 1 && icoBytes.readUInt16LE(4) === 1,
  );
  check("ICO payload follows the 22-byte header", icoBytes.length === 22 + 4);
}

/* ───────────────────────── result ───────────────────────── */

console.log(`\n${failures === 0 ? "All smoke tests passed." : `${failures} failure(s).`}`);
process.exit(failures === 0 ? 0 : 1);
