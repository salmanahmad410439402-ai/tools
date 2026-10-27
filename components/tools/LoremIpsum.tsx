"use client";

import { useMemo, useState } from "react";
import { Check, Clipboard, Download, RefreshCw } from "lucide-react";
import { countText, generateLorem, type LoremFormat } from "@/lib/text/tools";
import { sizeBucket, track } from "@/lib/analytics";
import { downloadBlob } from "@/lib/download";
import { cn } from "@/lib/utils";
import { Field, ToolFrame, inputClass, selectClass } from "./kit";

interface Props {
  toolSlug?: string;
}

/**
 * Deterministic PRNG (mulberry32).
 *
 * The paragraph text is generated during render, and this page is prerendered at
 * build time — so a Math.random() call here would produce different markup on the
 * server and in the browser and trigger a hydration mismatch. Seeding it means
 * the first render is identical on both sides, and "Generate again" simply moves
 * the seed forward.
 */
function mulberry32(seed: number) {
  let state = seed + 0x6d2b79f5;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function LoremIpsum({ toolSlug = "lorem-ipsum-generator" }: Props) {
  const [paragraphs, setParagraphs] = useState("3");
  const [sentences, setSentences] = useState("4");
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [format, setFormat] = useState<LoremFormat>("text");
  const [seed, setSeed] = useState(0);
  const [copied, setCopied] = useState(false);

  const output = useMemo(
    () =>
      generateLorem({
        paragraphs: Number(paragraphs),
        sentencesPerParagraph: Number(sentences),
        startWithLorem,
        format,
        random: mulberry32(seed),
      }),
    // `seed` is deliberately part of the dependency list: it is the "generate
    // again" trigger, so the same settings produce fresh filler on demand.
    [paragraphs, sentences, startWithLorem, format, seed],
  );

  const stats = useMemo(() => countText(output.replace(/<[^>]+>/g, "")), [output]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
      track("tool_completed", { tool: toolSlug, files: 1, size: sizeBucket(output.length) });
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <ToolFrame labelledBy="tool-title">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Paragraphs" htmlFor="li-paragraphs" hint="1–20. Each paragraph gets its own sentences.">
          <input
            id="li-paragraphs"
            type="number"
            min={1}
            max={20}
            value={paragraphs}
            onChange={(event) => {
              setParagraphs(event.target.value);
              track("tool_started", { tool: toolSlug, files: 1 });
            }}
            className={cn(inputClass, "tabular-nums")}
          />
        </Field>

        <Field label="Sentences per paragraph" htmlFor="li-sentences" hint="1–12 sentences, each 8–16 words long.">
          <input
            id="li-sentences"
            type="number"
            min={1}
            max={12}
            value={sentences}
            onChange={(event) => setSentences(event.target.value)}
            className={cn(inputClass, "tabular-nums")}
          />
        </Field>

        <Field label="Output format" htmlFor="li-format" hint="HTML wraps each paragraph in a <p> tag; Markdown separates them with a blank line.">
          <select id="li-format" className={selectClass} value={format} onChange={(event) => setFormat(event.target.value as LoremFormat)}>
            <option value="text">Plain text</option>
            <option value="html">HTML paragraphs</option>
            <option value="markdown">Markdown</option>
          </select>
        </Field>

        <label className="flex items-start gap-2 self-end pb-1 text-[12.5px] leading-relaxed text-body">
          <input
            type="checkbox"
            checked={startWithLorem}
            onChange={(event) => setStartWithLorem(event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-brand-500"
          />
          Start with “Lorem ipsum dolor sit amet…” — turn this off for filler that does not open with the cliché.
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-[11.5px] font-semibold text-subtle">Quick shapes:</span>
        {[
          { label: "A short block", paragraphs: "1", sentences: "2" },
          { label: "Three paragraphs", paragraphs: "3", sentences: "4" },
          { label: "A long page", paragraphs: "6", sentences: "5" },
        ].map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              setParagraphs(preset.paragraphs);
              setSentences(preset.sentences);
              setSeed((current) => current + 1);
            }}
            className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11.5px] font-semibold text-subtle transition-colors hover:border-primary/30 hover:text-body"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="li-output" className="text-[12.5px] font-semibold text-ink">
            Your filler text
          </label>
          <p className="text-[11.5px] text-subtle">
            {stats.words.toLocaleString()} words · {stats.characters.toLocaleString()} characters
          </p>
        </div>
        <textarea
          id="li-output"
          readOnly
          value={output}
          rows={10}
          onFocus={(event) => event.currentTarget.select()}
          className={cn(inputClass, "h-auto resize-y py-3 font-mono text-[12.5px] leading-relaxed text-body")}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={copy} className="btn-primary min-h-[40px] px-3.5 text-[13px]">
          {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Clipboard className="h-4 w-4" aria-hidden="true" />}
          {copied ? "Copied" : "Copy text"}
        </button>
        <button
          type="button"
          onClick={() => {
            setSeed((current) => current + 1);
            track("tool_started", { tool: toolSlug, files: 1 });
          }}
          className="btn-secondary min-h-[40px] px-3.5 text-[13px]"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Generate again
        </button>
        <button
          type="button"
          onClick={() =>
            downloadBlob(
              new Blob([output], { type: format === "html" ? "text/html" : "text/plain" }),
              `filecraft-lorem.${format === "html" ? "html" : "txt"}`,
            )
          }
          className="btn-secondary min-h-[40px] px-3.5 text-[13px]"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Download
        </button>
      </div>

      <p className="mt-3 rounded-xl bg-surface px-4 py-3 text-[11.5px] leading-relaxed text-subtle">
        The words come from the classical Latin filler derived from Cicero, not from a translation service. It means
        nothing — which is exactly why it is useful for judging typography, spacing and line length before the real
        copy exists.
      </p>
    </ToolFrame>
  );
}
