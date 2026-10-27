/**
 * Small, dependency-free encoders for the formats browsers cannot write
 * themselves: 24-bit BMP, uncompressed RGB TIFF, single-image ICO and GIF89a.
 *
 * Everything here works on plain pixel data (RGBA, top-down) so it can be
 * unit-tested outside a browser.
 */

export interface PixelSource {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

class ByteWriter {
  private bytes: number[] = [];

  u8(value: number) {
    this.bytes.push(value & 0xff);
    return this;
  }

  u16le(value: number) {
    this.bytes.push(value & 0xff, (value >> 8) & 0xff);
    return this;
  }

  u32le(value: number) {
    this.bytes.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
    return this;
  }

  ascii(text: string) {
    for (let i = 0; i < text.length; i += 1) this.bytes.push(text.charCodeAt(i) & 0xff);
    return this;
  }

  raw(data: ArrayLike<number>) {
    for (let i = 0; i < data.length; i += 1) this.bytes.push(data[i] & 0xff);
    return this;
  }

  toUint8Array() {
    return new Uint8Array(this.bytes);
  }

  get length() {
    return this.bytes.length;
  }
}

/* ─────────────────────────────── BMP ────────────────────────────────────── */

/** Uncompressed 24-bit Windows BMP, bottom-up rows, 4-byte row padding. */
export function encodeBmp(image: PixelSource): Blob {
  const { width, height, data } = image;
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const pixelBytes = rowSize * height;
  const fileSize = 14 + 40 + pixelBytes;

  const out = new ByteWriter();
  out.ascii("BM").u32le(fileSize).u16le(0).u16le(0).u32le(14 + 40);
  out.u32le(40).u32le(width).u32le(height).u16le(1).u16le(24).u32le(0);
  out.u32le(pixelBytes).u32le(2835).u32le(2835).u32le(0).u32le(0);

  const padding = rowSize - width * 3;
  for (let y = height - 1; y >= 0; y -= 1) {
    let offset = y * width * 4;
    for (let x = 0; x < width; x += 1) {
      out.u8(data[offset + 2]);
      out.u8(data[offset + 1]);
      out.u8(data[offset]);
      offset += 4;
    }
    for (let p = 0; p < padding; p += 1) out.u8(0);
  }

  return new Blob([out.toUint8Array() as unknown as BlobPart], { type: "image/bmp" });
}

/* ─────────────────────────────── TIFF ───────────────────────────────────── */

/** Baseline little-endian TIFF, uncompressed RGB, one strip. */
export function encodeTiff(image: PixelSource): Blob {
  const { width, height, data } = image;
  const entryCount = 11;
  const ifdOffset = 8;
  const ifdSize = 2 + entryCount * 12 + 4;
  const bitsOffset = ifdOffset + ifdSize; // 6 bytes: 8,8,8
  const pixelOffset = bitsOffset + 6;
  const pixelBytes = width * height * 3;

  const out = new ByteWriter();
  out.ascii("II").u16le(42).u32le(ifdOffset);
  out.u16le(entryCount);

  const entry = (tag: number, type: number, count: number, value: number) => {
    out.u16le(tag).u16le(type).u32le(count).u32le(value);
  };
  const SHORT = 3;
  const LONG = 4;

  entry(256, LONG, 1, width);
  entry(257, LONG, 1, height);
  entry(258, SHORT, 3, bitsOffset);
  entry(259, SHORT, 1, 1); // no compression
  entry(262, SHORT, 1, 2); // RGB
  entry(273, LONG, 1, pixelOffset);
  entry(277, SHORT, 1, 3);
  entry(278, LONG, 1, height);
  entry(279, LONG, 1, pixelBytes);
  entry(282, SHORT, 1, 72); // XResolution (roughly 72 dpi)
  entry(284, SHORT, 1, 1); // chunky
  out.u32le(0); // next IFD

  out.u16le(8).u16le(8).u16le(8);

  for (let i = 0; i < data.length; i += 4) {
    out.u8(data[i]);
    out.u8(data[i + 1]);
    out.u8(data[i + 2]);
  }

  return new Blob([out.toUint8Array() as unknown as BlobPart], { type: "image/tiff" });
}

/* ─────────────────────────────── ICO ────────────────────────────────────── */

/** ICO container with one PNG-compressed image (supported since Windows Vista). */
export function encodeIco(pngBytes: Uint8Array, width: number, height: number): Blob {
  const header = new ByteWriter();
  header.u16le(0).u16le(1).u16le(1);
  header.u8(width >= 256 ? 0 : width).u8(height >= 256 ? 0 : height);
  header.u8(0).u8(0).u16le(1).u16le(32).u32le(pngBytes.length).u32le(22);
  const bytes = new Uint8Array(22 + pngBytes.length);
  bytes.set(header.toUint8Array(), 0);
  bytes.set(pngBytes, 22);
  return new Blob([bytes as unknown as BlobPart], { type: "image/x-icon" });
}

/* ─────────────────────────────── GIF ────────────────────────────────────── */

/** 6×6×6 colour cube — 216 colours, fast to map, no dithering. */
function quantise(data: Uint8ClampedArray): { indices: Uint8Array; palette: Uint8Array } {
  const palette = new Uint8Array(256 * 3);
  const levels = [0, 51, 102, 153, 204, 255];
  for (let r = 0; r < 6; r += 1) {
    for (let g = 0; g < 6; g += 1) {
      for (let b = 0; b < 6; b += 1) {
        const i = (r * 36 + g * 6 + b) * 3;
        palette[i] = levels[r];
        palette[i + 1] = levels[g];
        palette[i + 2] = levels[b];
      }
    }
  }

  const pixelCount = data.length / 4;
  const indices = new Uint8Array(pixelCount);
  for (let p = 0; p < pixelCount; p += 1) {
    const o = p * 4;
    const r = Math.round(data[o] / 51);
    const g = Math.round(data[o + 1] / 51);
    const b = Math.round(data[o + 2] / 51);
    indices[p] = r * 36 + g * 6 + b;
  }
  return { indices, palette };
}

function lzwEncode(indices: Uint8Array, minCodeSize = 8): Uint8Array {
  const clearCode = 1 << minCodeSize;
  const endCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let nextCode = endCode + 1;
  const dictionary = new Map<number, number>();
  const out: number[] = [];
  let bitBuffer = 0;
  let bitCount = 0;

  const emit = (code: number) => {
    bitBuffer |= code << bitCount;
    bitCount += codeSize;
    while (bitCount >= 8) {
      out.push(bitBuffer & 0xff);
      bitBuffer >>>= 8;
      bitCount -= 8;
    }
  };

  emit(clearCode);
  let prefix = indices[0] ?? 0;

  for (let i = 1; i < indices.length; i += 1) {
    const k = indices[i];
    const key = prefix * 256 + k;
    const existing = dictionary.get(key);
    if (existing !== undefined) {
      prefix = existing;
      continue;
    }
    emit(prefix);
    if (nextCode < 4096) {
      dictionary.set(key, nextCode);
      nextCode += 1;
      if (nextCode - 1 === 1 << codeSize && codeSize < 12) codeSize += 1;
    } else {
      emit(clearCode);
      dictionary.clear();
      codeSize = minCodeSize + 1;
      nextCode = endCode + 1;
    }
    prefix = k;
  }

  emit(prefix);
  emit(endCode);
  if (bitCount > 0) out.push(bitBuffer & 0xff);
  return new Uint8Array(out);
}

/** Single-frame GIF89a. Animated sources keep only their first frame. */
export function encodeGif(image: PixelSource): Blob {
  const { width, height } = image;
  const { indices, palette } = quantise(image.data);
  const compressed = lzwEncode(indices);

  const out = new ByteWriter();
  out.ascii("GIF89a");
  out.u16le(width).u16le(height);
  out.u8(0xf7).u8(0).u8(0); // global colour table, 256 entries
  out.raw(palette);
  out.u8(0x2c).u16le(0).u16le(0).u16le(width).u16le(height).u8(0);
  out.u8(8); // LZW minimum code size
  for (let offset = 0; offset < compressed.length; offset += 255) {
    const chunk = compressed.subarray(offset, offset + 255);
    out.u8(chunk.length).raw(chunk);
  }
  out.u8(0).u8(0x3b);
  return new Blob([out.toUint8Array() as unknown as BlobPart], { type: "image/gif" });
}
