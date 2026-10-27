import JSZip from "jszip";

/** A finished file plus the numbers we show in the result card. */
export interface ResultFile {
  id: string;
  name: string;
  blob: Blob;
  size: number;
  /** Size of the matching source file, when there was one. */
  originalSize?: number;
  originalName?: string;
  /** Preview object URL — remember to revoke it. */
  previewUrl?: string;
  note?: string;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give Safari a moment before releasing the URL it is still reading.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function downloadZip(files: ResultFile[], zipName = "filecraft-results.zip") {
  const zip = new JSZip();
  const used = new Set<string>();
  for (const file of files) {
    let name = file.name;
    let counter = 1;
    while (used.has(name)) {
      const dot = file.name.lastIndexOf(".");
      name = dot === -1
        ? `${file.name}-${counter}`
        : `${file.name.slice(0, dot)}-${counter}${file.name.slice(dot)}`;
      counter += 1;
    }
    used.add(name);
    zip.file(name, file.blob);
  }
  const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
  downloadBlob(blob, zipName);
}

export function revokeResults(files: ResultFile[]) {
  for (const file of files) {
    if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
  }
}

export function makePreviewUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}
