/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EXIF reading and metadata stripping
 *
 *  Two different jobs live here:
 *
 *  1. `readExif` decodes the metadata a camera writes into a JPEG, PNG or WebP
 *     so the EXIF page can show it. Nothing is uploaded; the file is read as an
 *     ArrayBuffer in the tab.
 *  2. `stripMetadata` rewrites the container and drops those blocks. For JPEG
 *     and WebP this is a **lossless** operation — no pixel is decoded, so the
 *     image is bit-identical apart from the removed metadata. That is the whole
 *     reason this page is worth having: most "EXIF removers" re-encode the photo
 *     and quietly damage it.
 *
 *  Honest limits, mirrored in the page copy:
 *  - only the structures documented below are parsed; unusual vendor blocks are
 *    reported as "unreadable" rather than guessed at
 *  - HEIC, TIFF and RAW files are not parsed here
 *  - removing the orientation tag without baking the rotation into pixels can
 *    make a rotated photo display sideways in some viewers, so orientation is
 *    surfaced prominently
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface ExifTag {
  group: string;
  name: string;
  value: string;
}

export interface ExifReport {
  /** Human label for the container we parsed, e.g. "JPEG". */
  container: string;
  tags: ExifTag[];
  /** 1 when absent or unreadable. */
  orientation: number;
  hasGps: boolean;
  /** Blocks present in the file that `stripMetadata` can remove. */
  removable: string[];
  /** Approximate number of bytes those blocks occupy. */
  metadataBytes: number;
  /** Set when a container was recognised but its metadata could not be parsed. */
  problem?: string;
}

export interface StripResult {
  blob: Blob;
  removed: string[];
  removedBytes: number;
  /** False when nothing was found, so the caller can say so honestly. */
  changed: boolean;
  notes: string[];
}

/* ───────────────────────────── tag dictionaries ────────────────────────── */

const IFD0_NAMES: Record<number, string> = {
  0x010e: "Image description",
  0x010f: "Camera make",
  0x0110: "Camera model",
  0x0112: "Orientation",
  0x011a: "X resolution",
  0x011b: "Y resolution",
  0x0128: "Resolution unit",
  0x0131: "Software",
  0x0132: "Last modified",
  0x013b: "Artist",
  0x8298: "Copyright",
  0x8769: "Exif IFD",
  0x8825: "GPS IFD",
};

const EXIF_NAMES: Record<number, string> = {
  0x829a: "Exposure time",
  0x829d: "Aperture (f-number)",
  0x8822: "Exposure program",
  0x8827: "ISO speed",
  0x9003: "Date taken",
  0x9004: "Date digitised",
  0x9201: "Shutter speed",
  0x9202: "Aperture value",
  0x9204: "Exposure bias",
  0x9207: "Metering mode",
  0x9209: "Flash",
  0x920a: "Focal length",
  0x9290: "Sub-second (original)",
  0xa002: "Pixel width",
  0xa003: "Pixel height",
  0xa405: "Focal length (35 mm)",
  0xa430: "Camera owner",
  0xa431: "Body serial number",
  0xa432: "Lens specification",
  0xa433: "Lens make",
  0xa434: "Lens model",
  0xa435: "Lens serial number",
  0xc4a5: "Print IM",
};

const GPS_NAMES: Record<number, string> = {
  0x0000: "GPS version",
  0x0001: "Latitude ref",
  0x0002: "Latitude",
  0x0003: "Longitude ref",
  0x0004: "Longitude",
  0x0005: "Altitude ref",
  0x0006: "Altitude",
  0x0007: "GPS time",
  0x0012: "Map datum",
  0x001d: "Date stamped",
};

const ORIENTATION_LABELS: Record<number, string> = {
  1: "Normal (1)",
  2: "Mirrored horizontally (2)",
  3: "Rotated 180° (3)",
  4: "Mirrored vertically (4)",
  5: "Mirrored and rotated 90° (5)",
  6: "Rotated 90° clockwise (6)",
  7: "Mirrored and rotated 270° (7)",
  8: "Rotated 270° clockwise (8)",
};

/* ─────────────────────────────── helpers ────────────────────────────────── */

const ascii = (bytes: Uint8Array, start: number, length: number) => {
  let text = "";
  for (let i = 0; i < length; i += 1) {
    const code = bytes[start + i];
    if (code === 0) break;
    text += String.fromCharCode(code);
  }
  return text;
};

const startsWith = (bytes: Uint8Array, pattern: number[], offset = 0) =>
  pattern.every((value, index) => bytes[offset + index] === value);

const isJpeg = (bytes: Uint8Array) => startsWith(bytes, [0xff, 0xd8, 0xff]);
const isPng = (bytes: Uint8Array) => startsWith(bytes, [0x89, 0x50, 0x4e, 0x47]);
const isWebp = (bytes: Uint8Array) => startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && ascii(bytes, 8, 4) === "WEBP";

function view(bytes: Uint8Array) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

/* ─────────────────────────────── TIFF / EXIF ────────────────────────────── */

interface TiffEntry {
  tag: number;
  type: number;
  count: number;
  valueOffset: number;
}

const TYPE_SIZES: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };

function readEntryValue(
  bytes: Uint8Array,
  dv: DataView,
  entryBase: number,
  entry: TiffEntry,
  little: boolean,
): string | number | number[] | null {
  const unit = TYPE_SIZES[entry.type] ?? 1;
  const size = unit * entry.count;
  // A value that fits in four bytes is stored inline in the entry itself;
  // anything larger lives at an offset inside the TIFF block.
  const at = size <= 4 ? entryBase + 8 : entry.valueOffset;

  try {
    switch (entry.type) {
      case 2: // ASCII
        return ascii(bytes, at, entry.count).trim();
      case 1:
      case 7: {
        const out: number[] = [];
        for (let i = 0; i < Math.min(entry.count, 16); i += 1) out.push(bytes[at + i]);
        return entry.count === 1 ? out[0] : out;
      }
      case 3: {
        const out: number[] = [];
        for (let i = 0; i < Math.min(entry.count, 8); i += 1) {
          out.push(little ? dv.getUint16(at + i * 2, true) : dv.getUint16(at + i * 2, false));
        }
        return entry.count === 1 ? out[0] : out;
      }
      case 4:
      case 9: {
        const out: number[] = [];
        for (let i = 0; i < Math.min(entry.count, 8); i += 1) {
          out.push(little ? dv.getUint32(at + i * 4, true) : dv.getUint32(at + i * 4, false));
        }
        return entry.count === 1 ? out[0] : out;
      }
      case 5:
      case 10: {
        const out: number[] = [];
        for (let i = 0; i < Math.min(entry.count, 8); i += 1) {
          const numerator = little ? dv.getUint32(at + i * 8, true) : dv.getUint32(at + i * 8, false);
          const denominator = little ? dv.getUint32(at + i * 8 + 4, true) : dv.getUint32(at + i * 8 + 4, false);
          out.push(denominator === 0 ? 0 : numerator / denominator);
        }
        return entry.count === 1 ? out[0] : out;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

function parseIfd(
  bytes: Uint8Array,
  dv: DataView,
  ifdOffset: number,
  little: boolean,
  group: string,
  names: Record<number, string>,
  tags: ExifTag[],
  depth = 0,
): { orientation: number; hasGps: boolean } {
  let orientation = 1;
  let hasGps = false;

  const readIfd = (offset: number, currentGroup: string, currentNames: Record<number, string>, level: number) => {
    if (level > 2 || offset <= 0 || offset + 2 > bytes.length) return;
    const count = little ? dv.getUint16(offset, true) : dv.getUint16(offset, false);
    if (count > 512) return;

    for (let i = 0; i < count; i += 1) {
      const entryBase = offset + 2 + i * 12;
      if (entryBase + 12 > bytes.length) return;
      const tag = little ? dv.getUint16(entryBase, true) : dv.getUint16(entryBase, false);
      const type = little ? dv.getUint16(entryBase + 2, true) : dv.getUint16(entryBase + 2, false);
      const entryCount = little ? dv.getUint32(entryBase + 4, true) : dv.getUint32(entryBase + 4, false);
      const valueOffset = little ? dv.getUint32(entryBase + 8, true) : dv.getUint32(entryBase + 8, false);
      const entry: TiffEntry = { tag, type, count: entryCount, valueOffset };

      // Pointer tags: follow them instead of printing a number.
      if (currentGroup === "Image" && tag === 0x8769) {
        readIfd(valueOffset, "Exif", EXIF_NAMES, level + 1);
        continue;
      }
      if (currentGroup === "Image" && tag === 0x8825) {
        hasGps = true;
        readIfd(valueOffset, "GPS", GPS_NAMES, level + 1);
        continue;
      }
      if (currentGroup === "Image" && tag === 0xa005) {
        readIfd(valueOffset, "Interop", {}, level + 1);
        continue;
      }

      const raw = readEntryValue(bytes, dv, entryBase, entry, little);
      if (raw === null) continue;

      if (currentGroup === "Image" && tag === 0x0112) {
        const parsed = Array.isArray(raw) ? Number(raw[0]) : Number(raw);
        if (parsed >= 1 && parsed <= 8) orientation = parsed;
        tags.push({ group: currentGroup, name: "Orientation", value: ORIENTATION_LABELS[parsed] ?? String(parsed) });
        continue;
      }

      const name = currentNames[tag] ?? `Unknown tag 0x${tag.toString(16).padStart(4, "0")}`;
      const value = Array.isArray(raw)
        ? raw.map((entry) => (typeof entry === "number" ? Number(entry.toFixed(4)) : entry)).join(", ")
        : typeof raw === "number"
          ? String(Number(raw.toFixed(4)))
          : raw;

      if (name.startsWith("Unknown") && (value === "" || value === "0")) continue;
      if (name.startsWith("Unknown") && typeof raw === "number" && type !== 2) continue;
      tags.push({ group: currentGroup, name, value: String(value).slice(0, 160) });
    }
  };

  readIfd(ifdOffset, group, names, depth);
  return { orientation, hasGps };
}

/** Parses a TIFF-structured EXIF block (the payload after "Exif\0\0"). */
function parseTiffBlock(block: Uint8Array, tags: ExifTag[]): { orientation: number; hasGps: boolean } {
  if (block.length < 8) return { orientation: 1, hasGps: false };
  const dv = view(block);
  const byteOrder = ascii(block, 0, 2);
  const little = byteOrder === "II";
  if (!little && byteOrder !== "MM") return { orientation: 1, hasGps: false };
  const magic = little ? dv.getUint16(2, true) : dv.getUint16(2, false);
  if (magic !== 42) return { orientation: 1, hasGps: false };
  const ifd0 = little ? dv.getUint32(4, true) : dv.getUint32(4, false);
  if (ifd0 <= 0 || ifd0 >= block.length) return { orientation: 1, hasGps: false };
  return parseIfd(block, dv, ifd0, little, "Image", IFD0_NAMES, tags);
}

/* ───────────────────────────── container walkers ────────────────────────── */

interface JpegSegment {
  marker: number;
  start: number;
  dataStart: number;
  end: number;
  kind: string;
}

function jpegSegments(bytes: Uint8Array): JpegSegment[] {
  const segments: JpegSegment[] = [];
  let i = 2; // skip SOI
  while (i + 3 < bytes.length) {
    if (bytes[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = bytes[i + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    if (marker === 0xda) {
      // Start of scan: everything after this is entropy-coded image data.
      segments.push({ marker, start: i, dataStart: i + 2, end: bytes.length, kind: "scan" });
      break;
    }
    const length = (bytes[i + 2] << 8) | bytes[i + 3];
    const end = i + 2 + length;
    segments.push({ marker, start: i, dataStart: i + 2, end, kind: "segment" });
    i = end;
  }
  return segments;
}

function jpegKind(bytes: Uint8Array, segment: JpegSegment): string {
  const header = ascii(bytes, segment.dataStart + 2, 5);
  switch (segment.marker) {
    case 0xe0:
      return header.startsWith("JFIF") ? "JFIF header" : "APP0";
    case 0xe1:
      return header.startsWith("Exif") ? "EXIF (APP1)" : "XMP / APP1";
    case 0xe2:
      return header.startsWith("ICC_PROFILE") ? "ICC colour profile (APP2)" : "APP2";
    case 0xed:
      return "Photoshop / IPTC (APP13)";
    case 0xee:
      return "Adobe (APP14)";
    case 0xfe:
      return "Comment (COM)";
    case 0xdb:
      return "Quantisation table";
    case 0xc0:
    case 0xc2:
      return "Frame header";
    case 0xc4:
      return "Huffman table";
    default:
      return `Marker 0x${segment.marker.toString(16)}`;
  }
}

const STRIPPABLE_JPEG = new Set(["Exif", "Xmp", "Iptc", "Comment", "Other"]);

function jpegCategory(bytes: Uint8Array, segment: JpegSegment): "Exif" | "Xmp" | "Iptc" | "Comment" | "Icc" | "Other" | "Keep" {
  if (segment.marker === 0xe1) return ascii(bytes, segment.dataStart + 2, 4) === "Exif" ? "Exif" : "Xmp";
  if (segment.marker === 0xed) return "Iptc";
  if (segment.marker === 0xfe) return "Comment";
  if (segment.marker === 0xe2 && ascii(bytes, segment.dataStart + 2, 11) === "ICC_PROFILE") return "Icc";
  if (segment.marker >= 0xe0 && segment.marker <= 0xef) return "Other";
  return "Keep";
}

interface Chunk {
  type: string;
  start: number;
  end: number;
  length: number;
}

function pngChunks(bytes: Uint8Array): Chunk[] {
  const chunks: Chunk[] = [];
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const dv = view(bytes);
    const length = dv.getUint32(offset, false);
    const type = ascii(bytes, offset + 4, 4);
    const end = offset + 12 + length;
    if (!type || end > bytes.length + 12) break;
    chunks.push({ type, start: offset, end: Math.min(end, bytes.length), length });
    if (type === "IEND") break;
    offset = end;
  }
  return chunks;
}

const STRIPPABLE_PNG = new Set(["eXIf", "tEXt", "iTXt", "zTXt", "tIME"]);

interface WebpChunk {
  type: string;
  start: number;
  payloadStart: number;
  payloadLength: number;
  end: number;
}

function webpChunks(bytes: Uint8Array): WebpChunk[] {
  const chunks: WebpChunk[] = [];
  let offset = 12;
  const dv = view(bytes);
  while (offset + 8 <= bytes.length) {
    const type = ascii(bytes, offset, 4);
    const payloadLength = dv.getUint32(offset + 4, true);
    const payloadStart = offset + 8;
    const end = payloadStart + payloadLength + (payloadLength % 2);
    chunks.push({ type, start: offset, payloadStart, payloadLength, end: Math.min(end, bytes.length) });
    offset = end;
  }
  return chunks;
}

/* ─────────────────────────────── public API ─────────────────────────────── */

export async function readExif(file: Blob): Promise<ExifReport> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (isJpeg(bytes)) {
    const tags: ExifTag[] = [];
    const removable: string[] = [];
    let metadataBytes = 0;
    let orientation = 1;
    let hasGps = false;
    let problem: string | undefined;

    for (const segment of jpegSegments(bytes)) {
      const category = jpegCategory(bytes, segment);
      const size = segment.end - segment.start;
      if (category === "Exif") {
        metadataBytes += size;
        removable.push(`EXIF block (${size.toLocaleString()} bytes)`);
        const payload = bytes.subarray(segment.dataStart + 8, segment.end);
        try {
          const parsed = parseTiffBlock(payload, tags);
          orientation = parsed.orientation;
          hasGps = parsed.hasGps;
        } catch {
          problem = "The EXIF block is present but its structure could not be read.";
        }
      } else if (category === "Xmp") {
        metadataBytes += size;
        removable.push(`XMP metadata (${size.toLocaleString()} bytes)`);
      } else if (category === "Iptc") {
        metadataBytes += size;
        removable.push(`Photoshop / IPTC block (${size.toLocaleString()} bytes)`);
      } else if (category === "Comment") {
        metadataBytes += size;
        removable.push(`JPEG comment (${size.toLocaleString()} bytes)`);
      } else if (category === "Icc") {
        removable.push(`ICC colour profile (${size.toLocaleString()} bytes) — kept, it is colour, not identity`);
      }
    }

    return { container: "JPEG", tags, orientation, hasGps, removable, metadataBytes, problem };
  }

  if (isPng(bytes)) {
    const tags: ExifTag[] = [];
    const removable: string[] = [];
    let metadataBytes = 0;
    let orientation = 1;
    let hasGps = false;
    let problem: string | undefined;

    for (const chunk of pngChunks(bytes)) {
      if (chunk.type === "eXIf") {
        metadataBytes += chunk.length;
        removable.push(`eXIf metadata (${chunk.length.toLocaleString()} bytes)`);
        try {
          const parsed = parseTiffBlock(bytes.subarray(chunk.start + 8, chunk.end - 4), tags);
          orientation = parsed.orientation;
          hasGps = parsed.hasGps;
        } catch {
          problem = "The PNG carries an eXIf block that could not be read.";
        }
      } else if (chunk.type === "tEXt" || chunk.type === "iTXt" || chunk.type === "zTXt") {
        metadataBytes += chunk.length;
        const text = ascii(bytes, chunk.start + 8, Math.min(chunk.length, 120)).replace(/\0/g, " · ");
        tags.push({ group: "Text", name: chunk.type, value: text });
        removable.push(`Text chunk "${asPromiseFree(text)}" (${chunk.length.toLocaleString()} bytes)`);
      } else if (chunk.type === "tIME") {
        metadataBytes += chunk.length;
        removable.push("Last-modified chunk (tIME)");
      }
    }

    return { container: "PNG", tags, orientation, hasGps, removable, metadataBytes, problem };
  }

  if (isWebp(bytes)) {
    const dv = view(bytes);
    const tags: ExifTag[] = [];
    const removable: string[] = [];
    let metadataBytes = 0;
    let orientation = 1;
    let hasGps = false;
    let problem: string | undefined;

    for (const chunk of webpChunks(bytes)) {
      if (chunk.type === "EXIF") {
        metadataBytes += chunk.payloadLength;
        removable.push(`EXIF payload (${chunk.payloadLength.toLocaleString()} bytes)`);
        const payload = bytes.subarray(chunk.payloadStart, chunk.payloadStart + chunk.payloadLength);
        try {
          const parsed = parseTiffBlock(payload, tags);
          orientation = parsed.orientation;
          hasGps = parsed.hasGps;
        } catch {
          problem = "The WebP carries an EXIF payload that could not be read.";
        }
      } else if (chunk.type === "XMP ") {
        metadataBytes += chunk.payloadLength;
        removable.push(`XMP metadata (${chunk.payloadLength.toLocaleString()} bytes)`);
      } else if (chunk.type === "ICCP") {
        removable.push("ICC colour profile — kept, it is colour, not identity");
      }
    }

    void dv;
    return { container: "WebP", tags, orientation, hasGps, removable, metadataBytes, problem };
  }

  const name = ascii(bytes, 0, 12).trim();
  return {
    container: "Unknown",
    tags: [],
    orientation: 1,
    hasGps: false,
    removable: [],
    metadataBytes: 0,
    problem: isHeicLike(bytes)
      ? "HEIC/HEIF is not parsed here. Convert it to JPEG first, or remove metadata by re-exporting from Photos."
      : `This file is not a JPEG, PNG or WebP. ${name ? `It starts with "${name}".` : ""} TIFF, HEIC and RAW containers are out of scope on this page.`,
  };
}

function asPromiseFree(text: string) {
  return text.replace(/[^\x20-\x7e]+/g, " ").trim().slice(0, 40) || "text";
}

function isHeicLike(bytes: Uint8Array) {
  return ascii(bytes, 4, 4) === "ftyp" && /hei|mif1|heix|hevc|avif/i.test(ascii(bytes, 8, 4));
}

export interface StripOptions {
  /** Keep the ICC colour profile (default true — it is not personal data). */
  keepColorProfile?: boolean;
}

/**
 * Removes EXIF/XMP/IPTC/text metadata **without re-encoding pixels** for JPEG,
 * PNG and WebP. Unsupported containers throw, so the page can explain instead
 * of handing back an unchanged file labelled "cleaned".
 */
export async function stripMetadata(file: Blob, options: StripOptions = {}): Promise<StripResult> {
  const keepIcc = options.keepColorProfile ?? true;
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const removed: string[] = [];
  const notes: string[] = [];

  if (isJpeg(bytes)) {
    const segments = jpegSegments(bytes);
    const pieces: Uint8Array[] = [bytes.subarray(0, 2)]; // SOI
    let removedBytes = 0;

    for (const segment of segments) {
      if (segment.kind === "scan") {
        pieces.push(bytes.subarray(segment.start));
        continue;
      }
      const category = jpegCategory(bytes, segment);
      const size = segment.end - segment.start;
      const strip =
        category === "Exif" ||
        category === "Xmp" ||
        category === "Iptc" ||
        category === "Comment" ||
        (category === "Other" && segment.marker !== 0xe0) ||
        (category === "Icc" && !keepIcc);

      if (strip) {
        removedBytes += size;
        if (category === "Exif") removed.push("EXIF block (camera, dates, possibly GPS)");
        else if (category === "Xmp") removed.push("XMP metadata");
        else if (category === "Iptc") removed.push("Photoshop / IPTC block");
        else if (category === "Comment") removed.push("JPEG comment");
        else if (category === "Icc") removed.push("ICC colour profile");
        else removed.push(`Metadata segment 0x${segment.marker.toString(16)}`);
        continue;
      }
      pieces.push(bytes.subarray(segment.start, segment.end));
    }

    if (!removed.length) {
      return { blob: file, removed: [], removedBytes: 0, changed: false, notes: ["No removable metadata was found in this JPEG."] };
    }

    const total = pieces.reduce((sum, piece) => sum + piece.length, 0);
    const out = new Uint8Array(total);
    let cursor = 0;
    for (const piece of pieces) {
      out.set(piece, cursor);
      cursor += piece.length;
    }
    notes.push("Pixels were not decoded or re-encoded, so image quality is exactly what you started with.");
    return {
      blob: new Blob([out as unknown as BlobPart], { type: "image/jpeg" }),
      removed,
      removedBytes,
      changed: true,
      notes,
    };
  }

  if (isPng(bytes)) {
    const chunks = pngChunks(bytes);
    const pieces: Uint8Array[] = [bytes.subarray(0, 8)];
    let removedBytes = 0;

    for (const chunk of chunks) {
      const type = chunk.type;
      const slice = bytes.subarray(chunk.start, chunk.end);
      if (STRIPPABLE_PNG.has(type)) {
        removedBytes += chunk.length;
        removed.push(
          type === "eXIf" ? "eXIf metadata (camera, dates, GPS)" : type === "tIME" ? "Last-modified chunk (tIME)" : `Text chunk (${type})`,
        );
        continue;
      }
      pieces.push(slice);
    }

    if (!removed.length) {
      return { blob: file, removed: [], removedBytes: 0, changed: false, notes: ["This PNG carries no EXIF or text chunks."] };
    }

    const total = pieces.reduce((sum, piece) => sum + piece.length, 0);
    const out = new Uint8Array(total);
    let cursor = 0;
    for (const piece of pieces) {
      out.set(piece, cursor);
      cursor += piece.length;
    }
    notes.push("Only the metadata chunks were dropped; the compressed image data is untouched.");
    return {
      blob: new Blob([out as unknown as BlobPart], { type: "image/png" }),
      removed,
      removedBytes,
      changed: true,
      notes,
    };
  }

  if (isWebp(bytes)) {
    const chunks = webpChunks(bytes);
    const kept: { type: string; payload: Uint8Array }[] = [];
    let removedBytes = 0;
    let hasVp8x = false;

    for (const chunk of chunks) {
      const payload = bytes.subarray(chunk.payloadStart, chunk.payloadStart + chunk.payloadLength);
      if (chunk.type === "EXIF" || chunk.type === "XMP ") {
        removedBytes += chunk.payloadLength;
        removed.push(chunk.type === "EXIF" ? "EXIF payload" : "XMP payload");
        continue;
      }
      if (chunk.type === "VP8X") hasVp8x = true;
      kept.push({ type: chunk.type, payload });
    }

    if (!removed.length) {
      return { blob: file, removed: [], removedBytes: 0, changed: false, notes: ["This WebP has no EXIF or XMP chunks."] };
    }

    // Clear the EXIF (0x08) and XMP (0x04) bits in the VP8X feature flags so the
    // container stays consistent with what it actually contains.
    const rebuilt = kept.map((chunk) => {
      if (chunk.type !== "VP8X" || chunk.payload.length < 1) return chunk;
      const copy = chunk.payload.slice();
      copy[0] = copy[0] & ~0x0c;
      return { type: chunk.type, payload: copy };
    });

    let total = 12;
    for (const chunk of rebuilt) total += 8 + chunk.payload.length + (chunk.payload.length % 2);
    const out = new Uint8Array(total);
    out.set(bytes.subarray(0, 12), 0);
    let cursor = 12;
    const dv = new DataView(out.buffer);
    for (const chunk of rebuilt) {
      for (let i = 0; i < 4; i += 1) out[cursor + i] = chunk.type.charCodeAt(i);
      dv.setUint32(cursor + 4, chunk.payload.length, true);
      out.set(chunk.payload, cursor + 8);
      cursor += 8 + chunk.payload.length;
      if (chunk.payload.length % 2) {
        out[cursor] = 0;
        cursor += 1;
      }
    }
    dv.setUint32(4, total - 8, true);
    if (!hasVp8x) notes.push("This WebP has no VP8X header, so feature flags were left alone.");
    notes.push("Riff container rebuilt without the metadata chunks; the compressed pixels are unchanged.");
    return {
      blob: new Blob([out as unknown as BlobPart], { type: "image/webp" }),
      removed,
      removedBytes,
      changed: true,
      notes,
    };
  }

  throw new Error(
    "Metadata removal here supports JPEG, PNG and WebP. Other formats (HEIC, TIFF, RAW) are not parsed, so nothing is changed.",
  );
}

export { ORIENTATION_LABELS, STRIPPABLE_JPEG };
