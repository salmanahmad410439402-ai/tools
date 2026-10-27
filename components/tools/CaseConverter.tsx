"use client";

import { useMemo, useState } from "react";
import { ArrowDownToLine, Check, Clipboard, Eraser } from "lucide-react";
import {
  invertCase,
  sentenceCase,
  toAlternatingCase,
  toCamelCase,
  toConstantCase,
  toDotCase,
  toKebabCase,
  toPascalCase,
  toSlug,
  toSnakeCase,
  titleCase,
} from "@/lib/text/tools";
import { sizeBucket, track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { Notice, ToolFrame, inputClass } from "./kit";

type TransformKey =
  | "sentence"
  | "title"
  | "upper"
  | "lower"
  | "camel"
  | "pascal"
  | "snake"
  | "kebab"
  | "constant"
  | "dot"
  | "slug"
  | "alternating"
  | "invert";

const TRANSFORMS: { key: TransformKey; label: string; example: string; apply: (input: string) => string }[] = [
  { key: "sentence", label: "Sentence case", example: "Only the first letter is capitalised.", apply: sentenceCase },
  { key: "title", label: "Title Case", example: "Small Words Stay Lowercase", apply: titleCase },
  { key: "upper", label: "UPPERCASE", example: "FOR HEADINGS AND SHOUTING", apply: (input) => input.toUpperCase() },
  { key: "lower", label: "lowercase", example: "for tags and tidy data", apply: (input) => input.toLowerCase() },
  { key: "camel", label: "camelCase", example: "forVariablesAndKeys", apply: toCamelCase },
  { key: "pascal", label: "PascalCase", example: "ForComponents", apply: toPascalCase },
  { key: "snake", label: "snake_case", example: "for_database_columns", apply: toSnakeCase },
  { key: "kebab", label: "kebab-case", example: "for-urls-and-css", apply: toKebabCase },
  { key: "constant", label: "CONSTANT_CASE", example: "FOR_ENV_VARS", apply: toConstantCase },
  { key: "dot", label: "dot.case", example: "for.config.keys", apply: toDotCase },
  { key: "slug", label: "Url slug", example: "for-page-addresses", apply: toSlug },
  { key: "alternating", label: "aLtErNaTiNg", example: "because the internet asked", apply: toAlternatingCase },
  { key: "invert", label: "Invert case", example: "hELLO wORLD", apply: invertCase },
];

const SAMPLE = "the quick brown fox jumps over the lazy dog";

interface Props {
  toolSlug?: string;
}

export function CaseConverter({ toolSlug = "case-converter" }: Props) {
  const [text, setText] = useState("");
  const [active, setActive] = useState<TransformKey>("title");
  const [copied, setCopied] = useState(false);

  const transform = TRANSFORMS.find((entry) => entry.key === active)!;
  const output = useMemo(() => (text ? transform.apply(text) : ""), [text, transform]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
      track("tool_completed", { tool: toolSlug, files: 1, size: sizeBucket(output.length) });
    } catch {
      /* clipboard blocked: the text is selectable */
    }
  };

  return (
    <ToolFrame labelledBy="tool-title">
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <label htmlFor="cc-input" className="text-[12.5px] font-semibold text-ink">
          Your text
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
        id="cc-input"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          if (event.target.value.length === 1) track("tool_started", { tool: toolSlug, files: 1 });
        }}
        rows={5}
        placeholder="Paste a heading, a list of names, a variable name that needs renaming…"
        className={cn(inputClass, "h-auto resize-y py-3 text-[14px] leading-relaxed")}
      />

      <fieldset className="mt-4">
        <legend className="mb-2 text-[12.5px] font-semibold text-ink">Convert to</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {TRANSFORMS.map((entry) => {
            const isActive = entry.key === active;
            return (
              <button
                key={entry.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActive(entry.key)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-left transition-colors",
                  isActive
                    ? "border-primary/45 bg-primary/10"
                    : "border-line bg-raised hover:border-primary/30",
                )}
              >
                <span className={cn("block text-[12.5px] font-semibold", isActive ? "text-brand-700" : "text-ink")}>
                  {entry.label}
                </span>
                <span className="mt-0.5 block text-[10.5px] leading-snug text-subtle">{entry.example}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4">
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="cc-output" className="text-[12.5px] font-semibold text-ink">
            Result — {transform.label}
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (output) setText(output);
              }}
              disabled={!output}
              className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-subtle hover:text-body disabled:opacity-50"
            >
              <ArrowDownToLine className="h-3 w-3" aria-hidden="true" />
              Use as input
            </button>
            <button type="button" onClick={copy} disabled={!output} className="btn-primary min-h-[36px] px-3 text-[12.5px]">
              {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Clipboard className="h-3.5 w-3.5" aria-hidden="true" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
        <textarea
          id="cc-output"
          readOnly
          value={output}
          rows={5}
          onFocus={(event) => event.currentTarget.select()}
          placeholder="The converted text appears here as you choose a case."
          className={cn(inputClass, "h-auto resize-y py-3 text-[14px] leading-relaxed")}
        />
      </div>

      <Notice tone="info" className="mt-3">
        Programming cases split the input into words first, so <code className="font-mono text-[12px]">user account settings</code>{" "}
        becomes <code className="font-mono text-[12px]">userAccountSettings</code>,{" "}
        <code className="font-mono text-[12px]">user_account_settings</code> or{" "}
        <code className="font-mono text-[12px]">user-account-settings</code> from the same sentence. Nothing is sent
        anywhere.
      </Notice>
    </ToolFrame>
  );
}
