"use client";

import { useMemo, useState } from "react";
import { Check, Clipboard, Eraser, FileText } from "lucide-react";
import { countText, formatDuration, topWords } from "@/lib/text/tools";
import { sizeBucket, track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { ToolFrame, inputClass } from "./kit";

/** The limits people actually run into. Characters unless stated otherwise. */
const LIMITS: { name: string; limit: number; unit: "characters" | "words"; note: string }[] = [
  { name: "X / Twitter post", limit: 280, unit: "characters", note: "Free accounts; links count as 23" },
  { name: "Meta description", limit: 155, unit: "characters", note: "Google truncates around here" },
  { name: "SEO title", limit: 60, unit: "characters", note: "Anything longer gets cut in results" },
  { name: "Email subject", limit: 78, unit: "characters", note: "Inbox previews vary" },
  { name: "SMS message", limit: 160, unit: "characters", note: "Longer texts split and cost more" },
  { name: "YouTube title", limit: 100, unit: "characters", note: "Mobile cuts near 40" },
  { name: "Instagram caption", limit: 2200, unit: "characters", note: "First 125 shown before “more”" },
  { name: "LinkedIn post", limit: 3000, unit: "characters", note: "About 200 before the fold" },
];

const SAMPLE = `Filecraft runs every PDF and image tool inside your browser. That single design decision removes uploads, accounts and file-size queues in one step, and it means the tools keep working on a plane.\n\nIt also sets an honest limit: a phone cannot do unlimited work. Very large batches are slower than a server would be, and a few heavy operations stay out of reach.`;

interface Props {
  toolSlug?: string;
}

export function WordCounter({ toolSlug = "word-counter" }: Props) {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => countText(text), [text]);
  const frequent = useMemo(() => topWords(text, 8), [text]);

  const summary = useMemo(
    () =>
      [
        `${stats.words.toLocaleString()} words`,
        `${stats.characters.toLocaleString()} characters (${stats.charactersNoSpaces.toLocaleString()} without spaces)`,
        `${stats.sentences.toLocaleString()} sentences`,
        `${stats.paragraphs.toLocaleString()} paragraphs`,
        `Reading time ${formatDuration(stats.readingMinutes)}`,
        `Speaking time ${formatDuration(stats.speakingMinutes)}`,
      ].join("\n"),
    [stats],
  );

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
      track("tool_completed", { tool: toolSlug, files: 1, size: sizeBucket(stats.characters) });
    } catch {
      /* clipboard blocked — the numbers are on screen anyway */
    }
  };

  const cells = [
    { label: "Words", value: stats.words.toLocaleString() },
    { label: "Characters", value: stats.characters.toLocaleString() },
    { label: "No spaces", value: stats.charactersNoSpaces.toLocaleString() },
    { label: "Sentences", value: stats.sentences.toLocaleString() },
    { label: "Paragraphs", value: stats.paragraphs.toLocaleString() },
    { label: "Lines", value: stats.lines.toLocaleString() },
  ];

  return (
    <ToolFrame labelledBy="tool-title">
      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="wc-text" className="text-[12.5px] font-semibold text-ink">
              Paste or type your text
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setText(SAMPLE);
                  track("tool_started", { tool: toolSlug, files: 1 });
                }}
                className="text-[11.5px] font-semibold text-subtle hover:text-body"
              >
                Try a sample
              </button>
              <button
                type="button"
                onClick={() => setText("")}
                className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-subtle hover:text-danger"
              >
                <Eraser className="h-3 w-3" aria-hidden="true" />
                Clear
              </button>
            </div>
          </div>
          <textarea
            id="wc-text"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              if (event.target.value.length === 1) track("tool_started", { tool: toolSlug, files: 1 });
            }}
            rows={12}
            placeholder="Paste an article, a caption, a thesis abstract or a CV paragraph…"
            className={cn(inputClass, "h-auto resize-y py-3 text-[14px] leading-relaxed")}
          />
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-subtle">
            Nothing is sent anywhere. The count is calculated as you type, in this tab. Characters are Unicode code
            points, so a skin-toned emoji counts as two — several platforms count it as two as well.
          </p>
        </div>

        <div>
          <dl className="grid grid-cols-2 gap-2">
            {cells.map((cell) => (
              <div key={cell.label} className="rounded-xl border border-line bg-surface px-3 py-2.5">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-subtle">{cell.label}</dt>
                <dd className="mt-0.5 font-mono text-[18px] font-semibold tabular-nums text-ink">{cell.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-line bg-raised px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">Reading time</p>
              <p className="mt-0.5 text-[14px] font-semibold text-ink">{formatDuration(stats.readingMinutes)}</p>
              <p className="text-[11px] text-subtle">225 words/min</p>
            </div>
            <div className="rounded-xl border border-line bg-raised px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">Speaking time</p>
              <p className="mt-0.5 text-[14px] font-semibold text-ink">{formatDuration(stats.speakingMinutes)}</p>
              <p className="text-[11px] text-subtle">130 words/min</p>
            </div>
          </div>

          <button type="button" onClick={copySummary} disabled={!stats.characters} className="btn-secondary mt-3 min-h-[40px] w-full text-[13px]">
            {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Clipboard className="h-4 w-4" aria-hidden="true" />}
            {copied ? "Copied the summary" : "Copy the summary"}
          </button>

          {stats.longestWord && (
            <p className="mt-2 truncate text-[11.5px] text-subtle">
              Longest word: <span className="font-mono text-body">{stats.longestWord}</span> · average{" "}
              {stats.averageWordLength} letters per word
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <h3 className="text-[13px] font-semibold text-ink">How this text fits common limits</h3>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {LIMITS.map((limit) => {
            const used = limit.unit === "characters" ? stats.characters : stats.words;
            const over = used - limit.limit;
            const ratio = Math.min(100, (used / limit.limit) * 100);
            return (
              <li key={limit.name} className="rounded-xl border border-line bg-raised px-3 py-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[12.5px] font-semibold text-ink">{limit.name}</span>
                  <span
                    className={cn(
                      "font-mono text-[11.5px] tabular-nums",
                      over > 0 ? "font-semibold text-danger" : used ? "text-success" : "text-subtle",
                    )}
                  >
                    {used.toLocaleString()} / {limit.limit.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface" aria-hidden="true">
                  <div
                    className={cn("h-full rounded-full transition-[width]", over > 0 ? "bg-danger" : "bg-success")}
                    style={{ width: `${ratio}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-subtle">
                  {over > 0 ? `${over.toLocaleString()} over · ` : ""}
                  {limit.note}
                </p>
              </li>
            );
          })}
        </ul>
      </div>

      {frequent.length > 0 && (
        <div className="mt-5">
          <h3 className="text-[13px] font-semibold text-ink">Most-used words (stop words removed)</h3>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {frequent.map((entry) => (
              <li
                key={entry.word}
                className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11.5px] font-medium text-body"
              >
                {entry.word} <span className="font-mono text-[11px] text-subtle">×{entry.count}</span>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-subtle">
            <FileText className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
            Keyword density is a weak signal on its own. Read the list as “what am I repeating”, not as a target to hit.
          </p>
        </div>
      )}
    </ToolFrame>
  );
}
