"use client";

/**
 * Font picker for the PDF editor.
 *
 * A native `<select>` cannot show a font in its own typeface, so choosing a
 * script or handwriting face was a guess. This is a keyboard-accessible list
 * where every family is drawn in itself, grouped by category and searchable by
 * name or category.
 *
 * The families shown here are the ones the exporter embeds — see
 * `lib/pdf/font-library.ts`. Opening the list fetches a family's `woff2` only
 * when a row is actually drawn, so the page stays light until someone browses.
 */

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BUILTIN_FONTS,
  FONT_CATEGORIES,
  FONT_SAMPLE,
  LIBRARY_FONTS,
  fontCssStack,
  fontLabel,
  libraryFont,
  supportsBold,
  supportsItalic,
  type FontCategoryId,
  type FontFamily,
} from "@/lib/pdf/font-library";

interface Row {
  id: FontFamily;
  label: string;
  group: string;
  category: FontCategoryId | "built-in";
}

const ROWS: Row[] = [
  ...BUILTIN_FONTS.map((font) => ({ id: font.id as FontFamily, label: font.label, group: "Built into every PDF", category: "built-in" as const })),
  ...FONT_CATEGORIES.flatMap((category) =>
    LIBRARY_FONTS.filter((font) => font.category === category.id).map((font) => ({
      id: font.id as FontFamily,
      label: font.label,
      group: category.label,
      category: category.id,
    })),
  ),
];

const GROUPS = ["Built into every PDF", ...FONT_CATEGORIES.map((category) => category.label)];

export function FontPicker({
  value,
  onChange,
  label = "Font",
  htmlFor,
  hint,
}: {
  value: FontFamily;
  onChange: (family: FontFamily) => void;
  label?: string;
  htmlFor?: string;
  hint?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState<{ left: number; top: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  // Anchor the panel to the trigger with fixed positioning: the inspector
  // scrolls, and an absolutely positioned panel would be clipped by it.
  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    const update = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const width = Math.min(Math.max(rect.width, 264), window.innerWidth - 24);
      const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
      const below = window.innerHeight - rect.bottom;
      const height = 320;
      const top = below < height + 16 && rect.top > height + 16 ? rect.top - height - 6 : rect.bottom + 6;
      setPosition({ left, top, width });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    const timer = window.setTimeout(() => searchRef.current?.focus(), 10);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
      window.clearTimeout(timer);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return ROWS;
    return ROWS.filter((row) => `${row.label} ${row.group}`.toLowerCase().includes(term));
  }, [query]);

  const current = libraryFont(value);
  const family = value as FontFamily;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="text-[12px] font-semibold text-ink">
          {label}
        </label>
        <span className="text-[10.5px] font-medium text-subtle">{current ? current.category.replace("-", " ") : "built in"}</span>
      </div>
      <button
        ref={triggerRef}
        id={htmlFor}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => (open ? close() : setOpen(true))}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-line bg-raised px-2 text-left text-[13px] text-ink outline-none transition-colors hover:border-primary/40 focus:border-brand-400"
      >
        <span className="truncate" style={{ fontFamily: fontCssStack(family) }}>
          {fontLabel(family)}
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-subtle transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      {hint && <p className="mt-1 text-[10.5px] leading-snug text-subtle">{hint}</p>}

      {open && position && (
        <div
          ref={panelRef}
          className="fixed z-[70] overflow-hidden rounded-xl border border-line bg-card shadow-2xl"
          style={{ left: position.left, top: position.top, width: position.width }}
        >
          <div className="flex items-center gap-2 border-b border-line px-2 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-subtle" aria-hidden="true" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search fonts or styles…"
              aria-label="Search fonts"
              className="h-7 w-full bg-transparent text-[12px] text-ink outline-none placeholder:text-subtle"
            />
          </div>
          <div id={listId} role="listbox" aria-label="Fonts" className="max-h-[268px] overflow-y-auto py-1">
            {filtered.length === 0 && <p className="px-3 py-6 text-center text-[12px] text-subtle">No font matches “{query}”.</p>}
            {GROUPS.map((group) => {
              const rows = filtered.filter((row) => row.group === group);
              if (!rows.length) return null;
              return (
                <div key={group}>
                  <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.08em] text-subtle">{group}</p>
                  {rows.map((row) => {
                    const selected = row.id === family;
                    return (
                      <button
                        key={row.id}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => {
                          onChange(row.id);
                          close();
                        }}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left transition-colors hover:bg-brand-500/10",
                          selected && "bg-brand-500/12",
                        )}
                      >
                        <span className="truncate text-[13px] text-ink" style={{ fontFamily: fontCssStack(row.id) }}>
                          {row.label}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="text-[11px] text-subtle" style={{ fontFamily: fontCssStack(row.id) }}>
                            {FONT_SAMPLE}
                          </span>
                          {selected && <Check className="h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <p className="border-t border-line px-3 py-1.5 text-[10px] text-subtle">
            {ROWS.length - BUILTIN_FONTS.length} embedded fonts · chosen font is written into the PDF
          </p>
        </div>
      )}
    </div>
  );
}

/** Short note shown when a family has no italic or bold file of its own. */
export function fontStyleNote(family: FontFamily | undefined): string | null {
  if (!libraryFont(family)) return null;
  const bold = supportsBold(family);
  const italic = supportsItalic(family);
  if (bold && italic) return null;
  if (!bold && !italic) return "This font has one weight only, so bold and italic are turned off.";
  if (!bold) return "This font has no bold file; bold is turned off rather than faked.";
  return "This font has no italic file; italic is turned off rather than faked.";
}
