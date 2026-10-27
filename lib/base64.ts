/**
 * Base64 helpers for the Image to Base64 page.
 *
 * Deliberately dependency-free: `btoa`/`atob` exist in every browser, and the
 * only real work is (a) not blowing the call stack on a 5 MB photo and (b)
 * identifying what the decoded bytes actually are instead of trusting the MIME
 * type written in the data URI.
 */

export interface DecodedBase64 {
  bytes: Uint8Array;
  /** MIME type declared in the data URI, if there was one. */
  declaredMime?: string;
  /** MIME type derived from the bytes themselves, if recognised. */
  detectedMime?: string;
  /** True when the input was a full `data:` URI. */
  wasDataUri: boolean;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunk) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunk));
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function toDataUri(bytes: Uint8Array, mime: string): string {
  return `data:${mime};base64,${bytesToBase64(bytes)}`;
}

const ascii = (bytes: Uint8Array, start: number, length: number) => {
  let text = "";
  for (let i = 0; i < length; i += 1) text += String.fromCharCode(bytes[start + i] ?? 0);
  return text;
};

const startsWith = (bytes: Uint8Array, pattern: number[]) =>
  pattern.every((value, index) => bytes[index] === value);

/** Identifies an image (or PDF) from its magic bytes, never from its name. */
export function detectMime(bytes: Uint8Array): string | null {
  if (!bytes.length) return null;
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47])) return "image/png";
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38])) return "image/gif";
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return "image/webp";
  if (startsWith(bytes, [0x42, 0x4d])) return "image/bmp";
  if (startsWith(bytes, [0x49, 0x49, 0x2a, 0x00]) || startsWith(bytes, [0x4d, 0x4d, 0x00, 0x2a])) return "image/tiff";
  if (startsWith(bytes, [0x00, 0x00, 0x01, 0x00])) return "image/x-icon";
  if (ascii(bytes, 0, 4) === "%PDF") return "application/pdf";
  if (ascii(bytes, 4, 4) === "ftyp") {
    const brand = ascii(bytes, 8, 8);
    if (/avi[fs]/i.test(brand)) return "image/avif";
    if (/hei|heix|hevc|mif1|msf1/i.test(brand)) return "image/heic";
  }
  const head = ascii(bytes, 0, 400).trimStart();
  if (head.startsWith("<?xml") || head.startsWith("<svg")) {
    if (/<svg[\s>]/i.test(ascii(bytes, 0, 2000))) return "image/svg+xml";
  }
  return null;
}

/** Strips whitespace and a `data:` prefix, then decodes nothing else. */
export function parseBase64Input(input: string): DecodedBase64 {
  let text = input.trim();
  if (!text) throw new Error("Paste a base64 string or a data URI first.");

  let declaredMime: string | undefined;
  let wasDataUri = false;
  const dataUri = /^data:([^;,]*)((?:;[^,]*)*),([\s\S]*)$/i.exec(text);
  if (dataUri) {
    wasDataUri = true;
    declaredMime = dataUri[1] || undefined;
    const isBase64 = /;base64/i.test(dataUri[2]);
    text = dataUri[3];
    if (!isBase64) {
      // Plain (percent-encoded) data URIs are not base64; decode as text so the
      // error message is about the content rather than a confusing atob failure.
      const decoded = decodeURIComponent(text);
      const bytes = new TextEncoder().encode(decoded);
      return { bytes, declaredMime, detectedMime: detectMime(bytes) ?? undefined, wasDataUri };
    }
  }

  text = text.replace(/\s+/g, "");
  // Tolerate URL-safe base64 and a missing padding character.
  text = text.replace(/-/g, "+").replace(/_/g, "/");
  if (text.length % 4) text = text.padEnd(text.length + (4 - (text.length % 4)), "=");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(text)) {
    throw new Error("That does not look like base64 — it contains characters outside A–Z, a–z, 0–9, +, / and =.");
  }

  let bytes: Uint8Array;
  try {
    bytes = base64ToBytes(text);
  } catch {
    throw new Error("This base64 string is malformed and could not be decoded.");
  }
  if (!bytes.length) throw new Error("The base64 string decoded to zero bytes.");

  return { bytes, declaredMime, detectedMime: detectMime(bytes) ?? undefined, wasDataUri };
}

/** Base64 inflates data by a third; quote it before someone pastes 12 MB. */
export function base64SizeEstimate(bytes: number): number {
  return Math.ceil(bytes / 3) * 4;
}

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
  "image/x-icon": "ico",
  "image/avif": "avif",
  "image/heic": "heic",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
  "text/plain": "txt",
};

export function extensionForMime(mime: string): string {
  return EXTENSIONS[mime] ?? "bin";
}

/** The snippets a developer actually wants to paste somewhere. */
export function snippets(bytes: Uint8Array, mime: string, name: string) {
  const base64 = bytesToBase64(bytes);
  const uri = `data:${mime};base64,${base64}`;
  return {
    raw: base64,
    dataUri: uri,
    css: `.image {\n  background-image: url("${uri}");\n  background-size: cover;\n}`,
    html: `<img src="${uri}" alt="${name.replace(/"/g, "")}" />`,
  };
}
