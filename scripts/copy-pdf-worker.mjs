// Copies the pdf.js worker into /public so it can be served as a static asset
// from a static host (needed because the whole site is exported as HTML + JS).
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const from = resolve(root, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
const to = resolve(root, "public/pdf.worker.min.mjs");

if (!existsSync(from)) {
  console.error("[copy-pdf-worker] pdfjs-dist worker not found. Run npm install first.");
  process.exit(1);
}

mkdirSync(dirname(to), { recursive: true });
copyFileSync(from, to);
console.log("[copy-pdf-worker] public/pdf.worker.min.mjs updated");
