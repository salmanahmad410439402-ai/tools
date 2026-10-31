"use client";

import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";
import type { EditorElement, FontFamily } from "@/lib/pdf/editor";

/* ───────────────────────────── colour control ───────────────────────────── */

const SWATCHES = [
  "#0F172A", "#334155", "#64748B", "#FFFFFF", "#EF4444", "#F97316",
  "#F59E0B", "#22C55E", "#10B981", "#06B6D4", "#2563EB", "#4F46E5",
  "#7C3AED", "#DB2777", "#FDE68A", "#FCA5A5",
];

/**
 * Colour control: a native colour wheel (`input[type=color]`), a hex field and
 * a swatch row. The native picker is the only in-browser colour wheel that
 * works without shipping a colour library, and it is keyboard accessible.
 */
export function ColorField({
  label,
  value,
  onChange,
  allowNone = false,
  hint,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  allowNone?: boolean;
  hint?: string;
}) {
  const inputId = useId();
  const safeValue = value ?? "#000000";

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="text-[12px] font-semibold text-ink">
          {label}
        </label>
        {allowNone && (
          <button
            type="button"
            onClick={() => onChange(value === null ? "#2563EB" : null)}
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10.5px] font-semibold transition-colors",
              value === null ? "border-primary/45 bg-primary/10 text-brand-700" : "border-line text-subtle hover:border-primary/30",
            )}
          >
            {value === null ? "None" : "No colour"}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <label
          htmlFor={inputId}
          className="relative grid h-9 w-11 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-lg border border-line"
          style={{
            backgroundColor: value ?? "#ffffff",
            backgroundImage: value === null ? "linear-gradient(45deg,#e2e8f0 25%,transparent 25%,transparent 75%,#e2e8f0 75%),linear-gradient(45deg,#e2e8f0 25%,transparent 25%,transparent 75%,#e2e8f0 75%)" : undefined,
            backgroundSize: value === null ? "8px 8px" : undefined,
            backgroundPosition: value === null ? "0 0,4px 4px" : undefined,
          }}
          aria-label={`${label}: open the colour wheel`}
        >
          <input
            id={inputId}
            type="color"
            value={safeValue}
            disabled={value === null}
            onChange={(event) => onChange(event.target.value.toUpperCase())}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>

        <input
          type="text"
          value={value ?? ""}
          placeholder="none"
          spellCheck={false}
          onChange={(event) => {
            const next = event.target.value.trim();
            if (!next) onChange(null);
            else if (/^#?[0-9a-f]{3}$/i.test(next) || /^#?[0-9a-f]{6}$/i.test(next)) {
              onChange(next.startsWith("#") ? next.toUpperCase() : `#${next.toUpperCase()}`);
            }
          }}
          className="h-9 w-full min-w-0 rounded-lg border border-line bg-raised px-2 font-mono text-[12px] uppercase text-ink outline-none focus:border-brand-400"
          aria-label={`${label} hex value`}
        />
      </div>

      <div className="mt-1.5 flex flex-wrap gap-1">
        {SWATCHES.map((swatch) => (
          <button
            key={swatch}
            type="button"
            onClick={() => onChange(swatch)}
            aria-label={`Use colour ${swatch}`}
            aria-pressed={value === swatch}
            className={cn(
              "h-4 w-4 rounded-full border transition-transform hover:scale-110",
              value === swatch ? "border-ink ring-1 ring-primary/50" : "border-line/70",
            )}
            style={{ backgroundColor: swatch }}
          />
        ))}
      </div>
      {hint && <p className="mt-1 text-[10.5px] leading-snug text-subtle">{hint}</p>}
    </div>
  );
}

/* ─────────────────────────── small form controls ────────────────────────── */

export function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max = 200,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[12px] font-semibold text-ink">
        {label}
      </label>
      <div className="flex items-center gap-1">
        <input
          id={id}
          type="number"
          value={Number.isFinite(value) ? value : 0}
          min={min}
          max={max}
          step={step}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (Number.isFinite(next)) onChange(Math.min(max, Math.max(min, next)));
          }}
          className="h-9 w-full min-w-0 rounded-lg border border-line bg-raised px-2 font-mono text-[12px] tabular-nums text-ink outline-none focus:border-brand-400"
        />
        {suffix && <span className="shrink-0 text-[11px] text-subtle">{suffix}</span>}
      </div>
    </div>
  );
}

export function SliderField({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  format,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (value: number) => string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="flex items-center justify-between text-[12px] font-semibold text-ink">
        {label}
        <span className="font-mono text-[11px] font-normal tabular-nums text-subtle">
          {format ? format(value) : value}
        </span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1.5 w-full accent-brand-500"
      />
    </div>
  );
}

export function ToggleButton({
  active,
  onClick,
  children,
  label,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cn(
        "grid h-9 min-w-9 place-items-center rounded-lg border px-2 text-[12px] font-bold transition-colors",
        active ? "border-primary/45 bg-primary/10 text-brand-700" : "border-line bg-raised text-body hover:border-primary/30",
      )}
    >
      {children}
    </button>
  );
}

/* ─────────────────────────── inline text editing ────────────────────────── */

/**
 * Type directly on the page.
 *
 * A contentEditable box is layered exactly over the text element, styled with
 * the element's own font, size, weight, alignment and colour so the caret sits
 * where the printed text will. The DOM text is never copied into the PDF — the
 * element's `text` is updated as you type and the exporter lays it out again,
 * which keeps the preview and the export in agreement.
 *
 * The initial value is written once, in an effect: passing it as React children
 * would make every keystroke re-render the node and jump the caret to the start.
 */
export function InlineTextEditor({
  element,
  scale,
  onInput,
  onGrow,
  onDone,
}: {
  element: EditorElement;
  /** CSS pixels per PDF point. */
  scale: number;
  onInput: (text: string) => void;
  /** Reports the rendered height so the box can grow instead of clipping. */
  onGrow: (heightPx: number) => void;
  onDone: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.innerText = element.text ?? "";
    onGrow(node.offsetHeight);
    node.focus({ preventScroll: true });
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    // Mount-only on purpose: re-running would reset the caret on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label="Type the text for this box"
      spellCheck={false}
      onPointerDown={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onInput={(event) => {
        const node = event.currentTarget;
        onInput(node.innerText.replace(/\u00a0/g, " ").replace(/\n$/, ""));
        onGrow(node.offsetHeight);
      }}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Escape") {
          event.preventDefault();
          onDone();
        }
      }}
      onBlur={onDone}
      style={{
        minHeight: "1em",
        outline: "2px solid hsl(var(--primary))",
        outlineOffset: "2px",
        backgroundColor: "rgba(255,255,255,0.94)",
        color: element.stroke ?? element.fill ?? "#000000",
        fontSize: `${(element.fontSize ?? 14) * scale}px`,
        lineHeight: element.lineHeight ?? 1.3,
        fontWeight: element.bold ? 700 : 400,
        fontStyle: element.italic ? "italic" : "normal",
        fontFamily: textFontCss(element.fontFamily),
        textAlign: element.align ?? "left",
        whiteSpace: "pre-wrap",
        overflowWrap: "break-word",
        cursor: "text",
      }}
    />
  );
}

/* ─────────────────────────── element rendering ──────────────────────────── */

/**
 * The CSS stack the on-screen preview uses for each family. The inline text
 * editor and the auto-height measurement both use it too, so what you type and
 * what you see are measured with the same font.
 */
export function textFontCss(family: FontFamily | undefined): string {
  if (family === "serif") return "Georgia, 'Times New Roman', serif";
  if (family === "mono") return "ui-monospace, 'JetBrains Mono', 'SF Mono', monospace";
  return "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif";
}

const ELLIPSE_KINDS = new Set(["ellipse"]);

/**
 * Draws one element into the page preview.
 *
 * Everything is plain CSS/SVG at page scale, so the preview costs nothing to
 * re-render while dragging. Text is rendered with the same wrapping rule the
 * exporter uses (break inside the box), which keeps the preview honest.
 */
export function ElementView({
  element,
  scale,
  selected,
  interactive,
  onPointerDown,
  onDoubleClick,
}: {
  element: EditorElement;
  /** CSS pixels per PDF point. */
  scale: number;
  selected: boolean;
  interactive: boolean;
  /** Wired to the element's own box, so a click anywhere inside selects it. */
  onPointerDown?: (event: React.PointerEvent) => void;
  onDoubleClick?: (event: React.MouseEvent) => void;
}) {
  const interaction = { onPointerDown, onDoubleClick };
  const style: React.CSSProperties = {
    position: "absolute",
    left: `${element.x * 100}%`,
    top: `${element.y * 100}%`,
    width: `${element.width * 100}%`,
    height: `${element.height * 100}%`,
    opacity: element.opacity ?? 1,
    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
    pointerEvents: interactive ? "auto" : "none",
  };

  const outline = selected ? "outline outline-2 outline-offset-1 outline-brand-500" : "";

  if (element.kind === "text") {
    const fontSize = (element.fontSize ?? 14) * scale;
    return (
      <div
        {...interaction}
        style={{
          ...style,
          color: element.stroke ?? element.fill ?? "#000000",
          fontSize: `${fontSize}px`,
          lineHeight: element.lineHeight ?? 1.3,
          fontWeight: element.bold ? 700 : 400,
          fontStyle: element.italic ? "italic" : "normal",
          fontFamily: textFontCss(element.fontFamily),
          textAlign: element.align ?? "left",
          whiteSpace: element.wrap === false ? "pre" : "pre-wrap",
          overflowWrap: "break-word",
          // The exported PDF wraps at the box width but never clips a line that
          // runs past the box height, so neither does the preview. Before this,
          // a box shorter than the first line looked completely empty.
          overflow: "visible",
        }}
        className={outline}
      >
        {element.text || " "}
      </div>
    );
  }

  if (element.kind === "image") {
    return (
      <div {...interaction} style={style} className={outline}>
        {element.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={element.imageUrl} alt="" className="h-full w-full object-fill" draggable={false} />
        ) : (
          <div className="grid h-full w-full place-items-center bg-surface text-[10px] text-subtle">image</div>
        )}
      </div>
    );
  }

  if (element.kind === "draw") {
    const points = element.points ?? [];
    return (
      <svg
        {...interaction}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ ...style, overflow: "visible" }}
        className={outline}
        aria-hidden="true"
      >
        <rect x="0" y="0" width="100" height="100" fill="transparent" />
        <polyline
          points={points.map((point) => `${point.x * 100},${point.y * 100}`).join(" ")}
          fill="none"
          stroke={element.stroke ?? element.fill ?? "#000"}
          strokeWidth={Math.max(0.5, (element.strokeWidth ?? 2) * scale)}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }

  if (element.kind === "line" || element.kind === "arrow") {
    const colour = element.stroke ?? element.fill ?? "#000";
    return (
      <svg {...interaction} viewBox="0 0 100 100" preserveAspectRatio="none" style={{ ...style, overflow: "visible" }} className={outline} aria-hidden="true">
        <defs>
          <marker id={`arrow-${element.id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={colour} />
          </marker>
        </defs>
        <rect x="0" y="0" width="100" height="100" fill="transparent" />
        <line
          x1="0"
          y1="0"
          x2="100"
          y2="100"
          stroke={colour}
          strokeWidth={Math.max(0.5, (element.strokeWidth ?? 2) * scale)}
          vectorEffect="non-scaling-stroke"
          markerEnd={element.kind === "arrow" ? `url(#arrow-${element.id})` : undefined}
        />
      </svg>
    );
  }

  if (element.kind === "triangle") {
    return (
      <svg {...interaction} viewBox="0 0 100 100" preserveAspectRatio="none" style={style} className={outline} aria-hidden="true">
        <rect x="0" y="0" width="100" height="100" fill="transparent" />
        <polygon
          points="50,0 100,100 0,100"
          fill={element.fill ?? "transparent"}
          stroke={element.stroke ?? undefined}
          strokeWidth={Math.max(0.5, (element.strokeWidth ?? 2) * scale)}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }

  // rect / roundrect / ellipse / highlight / whiteout
  const radius =
    element.kind === "ellipse"
      ? "50%"
      : element.kind === "roundrect"
        ? "10px"
        : "2px";

  return (
    <div
      {...interaction}
      style={{
        ...style,
        backgroundColor:
          element.kind === "whiteout" ? "#FFFFFF" : (element.fill ?? (element.kind === "highlight" ? "#FDE68A" : "transparent")),
        border: element.stroke ? `${Math.max(1, (element.strokeWidth ?? 2) * scale)}px solid ${element.stroke}` : undefined,
        borderRadius: radius,
        opacity: element.kind === "highlight" ? Math.min(0.6, (element.opacity ?? 1) * 0.45) : (element.opacity ?? 1),
      }}
      className={cn(outline, ELLIPSE_KINDS.has(element.kind) && "rounded-full")}
    />
  );
}
