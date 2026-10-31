/**
 * The font library used by the PDF editor.
 *
 * Every font here is embedded into the exported PDF (subset, so the file stays
 * small) — nothing is faked by styling the preview only. The files live in
 * `public/fonts/library/<id>/<style>.ttf`, trimmed to Latin-1 plus the
 * typographic punctuation a document actually uses, and the same family is
 * served as `woff2` for the on-screen preview so the browser does not download
 * a full 300 KB font just to draw a menu row.
 *
 * All 27 families are licensed under the SIL Open Font License 1.1 and were
 * taken from the Fontsource distribution of Google Fonts (see
 * `public/fonts/library/README.md` for per-family attribution).
 */

export type FontStyleKey = "regular" | "bold" | "italic" | "boldItalic";

export type FontCategoryId = "sans-serif" | "serif" | "slab-serif" | "script" | "handwriting" | "display" | "monospace";

export interface LibraryFont {
  readonly id: string;
  readonly label: string;
  readonly category: FontCategoryId;
  /** Which weight/slant files exist for this family, in this folder. */
  readonly styles: readonly FontStyleKey[];
}

/** The three fonts every PDF viewer already has: no download, no embedding. */
export const BUILTIN_FONTS = [
  { id: "sans", label: "Helvetica (built in)", category: "built-in" as const },
  { id: "serif", label: "Times Roman (built in)", category: "built-in" as const },
  { id: "mono", label: "Courier (built in)", category: "built-in" as const },
] as const;

export type BuiltinFontId = (typeof BUILTIN_FONTS)[number]["id"];

const ALL: readonly FontStyleKey[] = ["regular", "bold", "italic", "boldItalic"];

export const LIBRARY_FONTS = [
  { id: "inter", label: "Inter", category: "sans-serif", styles: ALL },
  { id: "poppins", label: "Poppins", category: "sans-serif", styles: ALL },
  { id: "montserrat", label: "Montserrat", category: "sans-serif", styles: ALL },
  { id: "lato", label: "Lato", category: "sans-serif", styles: ALL },
  { id: "nunito", label: "Nunito", category: "sans-serif", styles: ALL },

  { id: "playfair-display", label: "Playfair Display", category: "serif", styles: ALL },
  { id: "merriweather", label: "Merriweather", category: "serif", styles: ALL },
  { id: "lora", label: "Lora", category: "serif", styles: ALL },
  { id: "eb-garamond", label: "EB Garamond", category: "serif", styles: ALL },
  { id: "cormorant-garamond", label: "Cormorant Garamond", category: "serif", styles: ALL },

  { id: "roboto-slab", label: "Roboto Slab", category: "slab-serif", styles: ["regular", "bold"] },
  { id: "bitter", label: "Bitter", category: "slab-serif", styles: ALL },

  { id: "great-vibes", label: "Great Vibes", category: "script", styles: ["regular"] },
  { id: "dancing-script", label: "Dancing Script", category: "script", styles: ["regular", "bold"] },
  { id: "sacramento", label: "Sacramento", category: "script", styles: ["regular"] },
  { id: "parisienne", label: "Parisienne", category: "script", styles: ["regular"] },

  { id: "caveat", label: "Caveat", category: "handwriting", styles: ["regular", "bold"] },
  { id: "patrick-hand", label: "Patrick Hand", category: "handwriting", styles: ["regular"] },
  { id: "indie-flower", label: "Indie Flower", category: "handwriting", styles: ["regular"] },
  { id: "shadows-into-light", label: "Shadows Into Light", category: "handwriting", styles: ["regular"] },

  { id: "bebas-neue", label: "Bebas Neue", category: "display", styles: ["regular"] },
  { id: "anton", label: "Anton", category: "display", styles: ["regular"] },
  { id: "oswald", label: "Oswald", category: "display", styles: ["regular", "bold"] },
  { id: "lobster", label: "Lobster", category: "display", styles: ["regular"] },
  { id: "cinzel", label: "Cinzel", category: "display", styles: ["regular", "bold"] },

  { id: "jetbrains-mono", label: "JetBrains Mono", category: "monospace", styles: ALL },
  { id: "space-mono", label: "Space Mono", category: "monospace", styles: ALL },
] as const satisfies readonly LibraryFont[];

export type LibraryFontId = (typeof LIBRARY_FONTS)[number]["id"];

/** Any font an element can ask for: a built-in or a library family. */
export type FontFamily = BuiltinFontId | LibraryFontId;

export const FONT_CATEGORIES: { id: FontCategoryId; label: string }[] = [
  { id: "sans-serif", label: "Sans serif" },
  { id: "serif", label: "Serif" },
  { id: "slab-serif", label: "Slab serif" },
  { id: "script", label: "Script & calligraphy" },
  { id: "handwriting", label: "Handwriting" },
  { id: "display", label: "Display & poster" },
  { id: "monospace", label: "Monospace" },
];

/** A concrete registry entry, with its literal id. */
export type AnyLibraryFont = (typeof LIBRARY_FONTS)[number];

const BY_ID = new Map<string, AnyLibraryFont>(LIBRARY_FONTS.map((font) => [font.id, font]));

export function libraryFont(id: string | undefined): AnyLibraryFont | undefined {
  return id ? BY_ID.get(id) : undefined;
}

export function isLibraryFont(id: string | undefined): id is LibraryFontId {
  return Boolean(id && BY_ID.has(id));
}

export function fontLabel(id: string | undefined): string {
  const font = libraryFont(id);
  if (font) return font.label;
  return BUILTIN_FONTS.find((builtin) => builtin.id === id)?.label.replace(" (built in)", "") ?? "Helvetica";
}

/** URL of the embeddable TrueType file. Every family has at least `regular`. */
export function fontFileUrl(id: LibraryFontId, style: FontStyleKey): string {
  return `/fonts/library/${id}/${style}.ttf`;
}

/**
 * The closest style the family actually has.
 *
 * Script and handwriting faces often ship one weight only. Falling back to the
 * nearest real file keeps the promise that the PDF never contains a fake
 * emboldened or obliqued font — the UI says which styles exist too.
 */
export function resolveStyle(font: AnyLibraryFont, bold: boolean, italic: boolean): FontStyleKey {
  const styles = font.styles as readonly FontStyleKey[];
  const wanted: FontStyleKey = bold && italic ? "boldItalic" : bold ? "bold" : italic ? "italic" : "regular";
  if (styles.includes(wanted)) return wanted;

  const candidates: FontStyleKey[] = [];
  if (bold && italic) candidates.push("boldItalic", "bold", "italic", "regular");
  else if (bold) candidates.push("bold", "regular");
  else if (italic) candidates.push("italic", "regular");
  else candidates.push("regular");

  return candidates.find((style) => styles.includes(style)) ?? "regular";
}

export function supportsBold(id: string | undefined): boolean {
  const font = libraryFont(id);
  if (!font) return true;
  const styles = font.styles as readonly FontStyleKey[];
  return styles.includes("bold") || styles.includes("boldItalic");
}

export function supportsItalic(id: string | undefined): boolean {
  const font = libraryFont(id);
  if (!font) return true;
  const styles = font.styles as readonly FontStyleKey[];
  return styles.includes("italic") || styles.includes("boldItalic");
}

/**
 * Preview stacks. The CSS family names are `FC <name>` so they cannot collide
 * with a font the visitor happens to have installed — what you see in the
 * editor is always the file that gets embedded.
 */
export function fontCssStack(id: string | undefined): string {
  const font = libraryFont(id);
  if (!font) {
    if (id === "serif") return "Georgia, 'Times New Roman', serif";
    if (id === "mono") return "ui-monospace, 'JetBrains Mono', 'SF Mono', monospace";
    return "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif";
  }
  const fallback: Record<FontCategoryId, string> = {
    "sans-serif": "Inter, system-ui, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    "slab-serif": "Rockwell, Georgia, serif",
    script: "'Segoe Script', 'Brush Script MT', cursive",
    handwriting: "'Comic Sans MS', 'Segoe Print', cursive",
    display: "Impact, 'Arial Black', sans-serif",
    monospace: "ui-monospace, 'SF Mono', monospace",
  };
  return `'FC ${font.label}', ${fallback[font.category]}`;
}

/** Total number of choices shown in the picker. */
export const FONT_COUNT = BUILTIN_FONTS.length + LIBRARY_FONTS.length;

/** Text used under each font name in the picker. */
export const FONT_SAMPLE = "Aa Bb 123";
