export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** 1_048_576 → "1.05 MB". Keeps numbers short and honest. */
export function formatBytes(bytes: number, decimals?: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes === 0) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  const places = decimals ?? (i === 0 ? 0 : value >= 100 ? 0 : value >= 10 ? 1 : 2);
  return `${value.toFixed(places)} ${units[i]}`;
}

export function percentSaved(before: number, after: number): number {
  if (!before || before <= 0) return 0;
  return Math.round(((before - after) / before) * 100);
}

export function fileBaseName(name: string): string {
  return name.replace(/\.[^.]+$/, "") || "file";
}

export function fileExtension(name: string): string {
  const match = /\.([^.]+)$/.exec(name);
  return match ? match[1].toLowerCase() : "";
}

/** Turns "report.pdf" into "report-compressed.pdf" while keeping it filesystem-safe. */
export function outputName(name: string, suffix: string, extension: string): string {
  const safe = fileBaseName(name)
    .normalize("NFKD")
    .replace(/[^\w\-. ]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80) || "file";
  return `${safe}${suffix ? `-${suffix}` : ""}.${extension}`;
}

export function prettyBytesCompact(bytes: number): string {
  return formatBytes(bytes).replace(" ", "");
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
