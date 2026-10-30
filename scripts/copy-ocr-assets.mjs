// Copies the OCR runtime into /public so a static host can serve it: the
// tesseract worker, the two LSTM WASM cores (SIMD and plain), and the English
// language data. Everything is source-controlled as a dependency version, and
// nothing is fetched from a third-party CDN at runtime.
import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = resolve(root, "public/ocr");

const files = [
  ["node_modules/tesseract.js/dist/worker.min.js", "worker.min.js"],
  ["node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js", "tesseract-core-simd-lstm.wasm.js"],
  ["node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm", "tesseract-core-simd-lstm.wasm"],
  ["node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js", "tesseract-core-lstm.wasm.js"],
  ["node_modules/tesseract.js-core/tesseract-core-lstm.wasm", "tesseract-core-lstm.wasm"],
  ["node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz", "lang/eng.traineddata.gz"],
];

mkdirSync(target, { recursive: true });
let copied = 0;

for (const [from, to] of files) {
  const source = resolve(root, from);
  if (!existsSync(source)) {
    console.error(`[copy-ocr-assets] missing ${from} — run npm install first.`);
    process.exit(1);
  }
  const destination = resolve(target, to);
  mkdirSync(dirname(destination), { recursive: true });
  const upToDate = existsSync(destination) && statSync(destination).size === statSync(source).size;
  if (!upToDate) {
    copyFileSync(source, destination);
    copied += 1;
  }
}

console.log(copied ? `[copy-ocr-assets] ${copied} OCR asset(s) updated in public/ocr` : "[copy-ocr-assets] public/ocr already up to date");
