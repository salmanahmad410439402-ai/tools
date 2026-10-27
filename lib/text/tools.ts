/**
 * Pure text helpers behind the word counter, the case converter and the lorem
 * ipsum generator.
 *
 * Nothing here touches the DOM, which is deliberate: the numbers a writing
 * tool reports are the part people argue about, so they can be asserted in the
 * test suite instead of trusted.
 */

/* ─────────────────────────────── counting ───────────────────────────────── */

export interface TextStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  /** 225 words per minute — the usual silent-reading average. */
  readingMinutes: number;
  /** 130 words per minute — a comfortable presentation pace. */
  speakingMinutes: number;
  /** Longest word, useful for spotting a stray URL. */
  longestWord: string;
  averageWordLength: number;
}

/** Counts text in the way a writer expects, not the way `split(" ")` does. */
export function countText(input: string): TextStats {
  const text = input ?? "";
  // Array.from so an emoji counts as one character, not two surrogate halves.
  const characters = Array.from(text).length;
  const charactersNoSpaces = Array.from(text.replace(/\s/gu, "")).length;

  const words = text
    .trim()
    .split(/\s+/u)
    .filter((word) => /[\p{L}\p{N}]/u.test(word));
  const wordCount = words.length;

  const sentences = text
    .split(/(?<=[.!?…])[\s]+|\n+/u)
    .map((sentence) => sentence.trim())
    .filter((sentence) => /[\p{L}\p{N}]/u.test(sentence)).length;

  const paragraphs = text
    .split(/\n\s*\n/u)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean).length;

  const lines = text.length ? text.split("\n").length : 0;

  let longestWord = "";
  let letters = 0;
  for (const raw of words) {
    const cleaned = raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
    letters += Array.from(cleaned).length;
    if (cleaned.length > longestWord.length) longestWord = cleaned;
  }

  return {
    words: wordCount,
    characters,
    charactersNoSpaces,
    sentences,
    paragraphs,
    lines,
    readingMinutes: wordCount / 225,
    speakingMinutes: wordCount / 130,
    longestWord,
    averageWordLength: wordCount ? Number((letters / wordCount).toFixed(1)) : 0,
  };
}

/** "1 min", "0:45" style label for a duration in minutes. */
export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0 sec";
  const totalSeconds = Math.round(minutes * 60);
  if (totalSeconds < 60) return `${totalSeconds} sec`;
  const whole = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds ? `${whole} min ${seconds} sec` : `${whole} min`;
}

/**
 * The words that are said most often, with stop words removed — the honest
 * version of "keyword density", which is a weak signal at best.
 */
const STOP_WORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "your", "with", "that", "this", "have", "has", "had", "was",
  "were", "will", "would", "can", "could", "should", "from", "they", "them", "their", "there", "here", "what",
  "when", "which", "who", "whom", "how", "why", "all", "any", "both", "each", "few", "more", "most", "other",
  "some", "such", "only", "own", "same", "than", "too", "very", "just", "into", "over", "under", "again",
  "then", "once", "about", "after", "before", "also", "its", "it's", "our", "ours", "out", "off", "on", "in",
  "of", "to", "is", "it", "as", "at", "be", "by", "or", "an", "a", "i", "we", "he", "she", "his", "her", "my",
  "me", "us", "do", "does", "did", "so", "if", "no", "yes", "up", "down", "one", "two", "use", "used", "using",
]);

export interface WordFrequency {
  word: string;
  count: number;
  /** Share of all counted words, 0–100, one decimal. */
  percent: number;
}

export function topWords(input: string, limit = 8): WordFrequency[] {
  const words = (input ?? "").toLowerCase().match(/[\p{L}\p{N}'’-]+/gu) ?? [];
  const counts = new Map<string, number>();
  let considered = 0;
  for (const raw of words) {
    const word = raw.replace(/^['’-]+|['’-]+$/g, "");
    if (word.length < 3 || STOP_WORDS.has(word) || /^\d+$/.test(word)) continue;
    considered += 1;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word, count]) => ({
      word,
      count,
      percent: considered ? Number(((count / considered) * 100).toFixed(1)) : 0,
    }));
}

/* ──────────────────────────────── casing ────────────────────────────────── */

const SMALL_WORDS = new Set([
  "a", "an", "and", "as", "at", "but", "by", "for", "from", "in", "into", "nor", "of", "on", "onto", "or", "over",
  "per", "the", "to", "up", "via", "with", "vs", "v", "yet",
]);

const capitalize = (word: string) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word);

/** Lower-cases everything, then capitalises the first letter of each sentence. */
export function sentenceCase(input: string): string {
  return input
    .toLowerCase()
    .replace(/(^\s*|[.!?…]\s+|\n\s*)([\p{L}])/gu, (_match, prefix: string, letter: string) => prefix + letter.toUpperCase());
}

/** Title Case with the usual small-word exception, except at either end. */
export function titleCase(input: string): string {
  // Keep existing all-caps acronyms (SEO, PDF) as they are.
  return input.replace(/[\p{L}\p{N}'’-]+/gu, (word, offset: number, whole: string) => {
    if (word === word.toUpperCase() && word.length > 1 && /[A-Z]/.test(word)) return word;
    const lower = word.toLowerCase();
    const isFirst = offset === 0 || /[\n.!?…:]\s*$/.test(whole.slice(0, offset));
    const isLast = offset + word.length >= whole.trimEnd().length;
    if (!isFirst && !isLast && SMALL_WORDS.has(lower)) return lower;
    // Capitalise after a hyphen too: "state-of-the-art" → "State-of-the-Art"
    return lower
      .split("-")
      .map((part, index) => (index === 0 ? capitalize(part) : SMALL_WORDS.has(part) ? part : capitalize(part)))
      .join("-");
  });
}

/** Splits any identifier style into words: "myHTTPServer" → ["my","HTTP","Server"]. */
export function splitWords(input: string): string[] {
  return (input ?? "")
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, "$1 $2")
    .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, "$1 $2")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

export const toCamelCase = (input: string) =>
  splitWords(input)
    .map((word, index) => (index === 0 ? word.toLowerCase() : capitalize(word.toLowerCase())))
    .join("");

export const toPascalCase = (input: string) =>
  splitWords(input)
    .map((word) => capitalize(word.toLowerCase()))
    .join("");

export const toSnakeCase = (input: string) =>
  splitWords(input)
    .map((word) => word.toLowerCase())
    .join("_");

export const toKebabCase = (input: string) =>
  splitWords(input)
    .map((word) => word.toLowerCase())
    .join("-");

export const toConstantCase = (input: string) =>
  splitWords(input)
    .map((word) => word.toUpperCase())
    .join("_");

export const toDotCase = (input: string) =>
  splitWords(input)
    .map((word) => word.toLowerCase())
    .join(".");

export const toSlug = (input: string) =>
  (input ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** aLtErNaTiNg case, for when the internet demands it. */
export const toAlternatingCase = (input: string) =>
  Array.from(input)
    .map((char, index) => (index % 2 === 0 ? char.toLowerCase() : char.toUpperCase()))
    .join("");

export const invertCase = (input: string) =>
  Array.from(input)
    .map((char) => (char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()))
    .join("");

/* ────────────────────────────── lorem ipsum ─────────────────────────────── */

/**
 * The classical opening plus a bank of real Latin words from the original
 * Cicero-derived filler. Words, not sentences, so paragraphs can be generated
 * to a length rather than to a canned block.
 */
export const LOREM_WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do", "eiusmod",
  "tempor", "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua", "enim", "ad", "minim", "veniam",
  "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
  "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate", "velit", "esse", "cillum",
  "dolore", "eu", "fugiat", "nulla", "pariatur", "excepteur", "sint", "occaecat", "cupidatat", "non",
  "proident", "sunt", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id", "est", "laborum",
  "curabitur", "pretium", "tincidunt", "lacus", "nulla", "gravida", "orci", "a", "odio", "nullam",
  "varius", "turpis", "commodo", "condimentum", "lobortis", "feugiat", "vivamus", "elementum", "semper",
  "nisi", "vitae", "facilisis", "magna", "fermentum", "iaculis", "augue", "interdum", "velit", "euismod",
  "integer", "facilisis", "vehicula", "erat", "porttitor", "egestas", "donec", "quam", "felis", "ultricies",
];

export type LoremFormat = "text" | "html" | "markdown";

export interface LoremOptions {
  paragraphs?: number;
  sentencesPerParagraph?: number;
  /** Begin with the canonical "Lorem ipsum dolor sit amet…" sentence. */
  startWithLorem?: boolean;
  format?: LoremFormat;
  /** Injectable RNG so tests are deterministic. */
  random?: () => number;
}

const OPENING = "Lorem ipsum dolor sit amet, consectetur adipiscing elit";

function sentenceFrom(words: string[], random: () => number, min = 8, max = 16): string {
  const length = min + Math.floor(random() * (max - min + 1));
  const picked: string[] = [];
  for (let index = 0; index < length; index += 1) {
    picked.push(words[Math.floor(random() * words.length)]);
  }
  // Sprinkle a comma to break up the rhythm, as the original text does.
  if (length > 10) picked[Math.floor(length / 2)] += ",";
  return capitalize(picked.join(" ")) + ".";
}

export function generateLorem(options: LoremOptions = {}): string {
  const paragraphs = Math.max(1, Math.min(options.paragraphs ?? 3, 20));
  const sentencesPerParagraph = Math.max(1, Math.min(options.sentencesPerParagraph ?? 4, 12));
  const startWithLorem = options.startWithLorem ?? true;
  const format = options.format ?? "text";
  const random = options.random ?? Math.random;

  const blocks: string[] = [];
  for (let index = 0; index < paragraphs; index += 1) {
    const sentences: string[] = [];
    for (let sentence = 0; sentence < sentencesPerParagraph; sentence += 1) {
      if (index === 0 && sentence === 0 && startWithLorem) {
        sentences.push(OPENING + ".");
      } else {
        sentences.push(sentenceFrom(LOREM_WORDS, random));
      }
    }
    blocks.push(sentences.join(" "));
  }

  if (format === "html") return blocks.map((block) => `<p>${block}</p>`).join("\n");
  if (format === "markdown") return blocks.join("\n\n");
  return blocks.join("\n\n");
}
