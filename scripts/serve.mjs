// Zero-dependency static server for the exported site in /out.
// Used for local preview and live demos; any static host can replace it.
//   npm run build && npm start  →  http://localhost:3000
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.cwd(), "out");
const port = Number(process.env.PORT || 3000);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".wasm": "application/wasm",
  ".pdf": "application/pdf",
};

if (!existsSync(root)) {
  console.error("No /out directory. Run `npm run build` first.");
  process.exit(1);
}

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  let pathname = decodeURIComponent(url.pathname);

  // Directory URLs get index.html; bare paths fall back to the slash version.
  let filePath = normalize(join(root, pathname));
  if (!filePath.startsWith(root)) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    if (!pathname.endsWith("/")) {
      response.writeHead(308, { Location: `${pathname}/${url.search}` }).end();
      return;
    }
    filePath = join(filePath, "index.html");
  }

  if (!existsSync(filePath)) {
    const notFound = join(root, "404.html");
    response.writeHead(404, { "Content-Type": types[".html"] });
    if (existsSync(notFound)) createReadStream(notFound).pipe(response);
    else response.end("Not found");
    return;
  }

  const type = types[extname(filePath).toLowerCase()] ?? "application/octet-stream";
  const headers = { "Content-Type": type };
  if (type.startsWith("text/") || type === "application/xml") headers["Cache-Control"] = "no-cache";

  response.writeHead(200, headers);
  createReadStream(filePath).pipe(response);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Static site running at http://localhost:${port} (serving ${root})`);
});
