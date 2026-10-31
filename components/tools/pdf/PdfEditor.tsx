"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Circle,
  Copy,
  CornerDownRight,
  Download,
  Eraser,
  FileText,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  Minimize2,
  Minus,
  MousePointer2,
  PenTool,
  Plus,
  Search,
  Square,
  SquareDashed,
  Star,
  Hexagon,
  Trash2,
  Triangle,
  Type,
  Undo2,
  Redo2,
  Wand2,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import {
  EDITOR_PAGE_SIZES,
  renderEditorPdf,
  rotatePoint,
  strokeBox,
  textBoxHeight,
  type EditorElement,
  type EditorElementKind,
  type FontFamily,
  type PageSizeKey,
  type PageSlot,
  type TextAlign,
} from "@/lib/pdf/editor";
import { track } from "@/lib/analytics";
import { makePreviewUrl, revokeResults, type ResultFile } from "@/lib/download";
import { cn } from "@/lib/utils";
import { useAutoFocus, useToolFocus } from "@/components/ToolFocusShell";
import { Field, Notice, ProgressBar, ResultsPanel, ToolFrame, selectClass } from "../kit";
import { PdfSource, usePdfInfo } from "./PdfSource";
import { usePageThumbs } from "./usePageThumbs";
import {
  ColorField,
  ElementView,
  InlineTextEditor,
  NumberField,
  SliderField,
  ToggleButton,
  measuredTextHeight,
} from "./editor/ui";

type Tool = "select" | EditorElementKind;

interface ToolSpec {
  key: Tool;
  label: string;
  keywords: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  group: "Essentials" | "Shapes" | "Annotate" | "Insert";
}

const TOOLS: ToolSpec[] = [
  { key: "select", label: "Select & move", keywords: "select pointer move pick", icon: MousePointer2, group: "Essentials" },
  { key: "text", label: "Text", keywords: "text type write label font paragraph", icon: Type, group: "Essentials" },
  { key: "image", label: "Image", keywords: "image photo picture logo png jpg insert", icon: ImageIcon, group: "Insert" },
  { key: "rect", label: "Rectangle", keywords: "square box rect border rectangle frame", icon: Square, group: "Shapes" },
  { key: "roundrect", label: "Rounded box", keywords: "rounded corner box card", icon: SquareDashed, group: "Shapes" },
  { key: "ellipse", label: "Ellipse", keywords: "circle oval ellipse round", icon: Circle, group: "Shapes" },
  { key: "triangle", label: "Triangle", keywords: "triangle arrow head shape", icon: Triangle, group: "Shapes" },
  { key: "polygon", label: "Polygon", keywords: "polygon pentagon hexagon octagon sides", icon: Hexagon, group: "Shapes" },
  { key: "star", label: "Star", keywords: "star badge burst sparkle points", icon: Star, group: "Shapes" },
  { key: "line", label: "Line", keywords: "line rule divider stroke", icon: Minus, group: "Shapes" },
  { key: "arrow", label: "Arrow", keywords: "arrow direction pointer callout", icon: CornerDownRight, group: "Shapes" },
  { key: "highlight", label: "Highlight", keywords: "highlight marker emphasis yellow", icon: Wand2, group: "Annotate" },
  { key: "whiteout", label: "White-out", keywords: "whiteout cover hide erase block", icon: Eraser, group: "Annotate" },
  { key: "draw", label: "Pen", keywords: "pen draw freehand sketch signature scribble", icon: PenTool, group: "Annotate" },
];

const TOOL_GROUPS: ToolSpec["group"][] = ["Essentials", "Shapes", "Annotate", "Insert"];

const SHAPE_TOOLS = new Set<Tool>([
  "rect",
  "roundrect",
  "ellipse",
  "triangle",
  "polygon",
  "star",
  "line",
  "arrow",
  "highlight",
  "whiteout",
]);

/**
 * Illustrator-style defaults for the shape tools: a rectangle starts square-
 * cornered, a rounded box starts at 8 pt, a polygon at six sides and a star at
 * five points with a 45 % waist. The inspector tunes each one afterwards.
 */
const SHAPE_DEFAULTS = {
  rectRadius: 0,
  roundrectRadius: 8,
  polygonSides: 6,
  starPoints: 5,
  starInner: 0.45,
};

/** The dummy copy a new text box starts with, like a design app's placeholder. */
const PLACEHOLDER_TEXT = "Lorem ipsum dolor sit amet";

interface Style {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  fontSize: number;
  fontFamily: FontFamily;
  bold: boolean;
  italic: boolean;
  align: TextAlign;
  lineHeight: number;
}

const DEFAULT_STYLE: Style = {
  fill: "#2563EB",
  stroke: "#0F172A",
  strokeWidth: 2,
  opacity: 1,
  fontSize: 18,
  fontFamily: "sans",
  bold: false,
  italic: false,
  align: "left",
  lineHeight: 1.3,
};

interface PageEntry extends PageSlot {
  id: string;
}

type DragMode = "create" | "move" | "resize" | "draw";

interface DragState {
  mode: DragMode;
  id?: string;
  corner?: "nw" | "ne" | "sw" | "se";
  origin: { x: number; y: number };
  element?: EditorElement;
  moved: boolean;
}

/** Human names for the inspector header and the objects list. */
const KIND_LABELS: Record<EditorElementKind, string> = {
  text: "Text",
  rect: "Rectangle",
  roundrect: "Rounded box",
  ellipse: "Ellipse",
  triangle: "Triangle",
  polygon: "Polygon",
  star: "Star",
  line: "Line",
  arrow: "Arrow",
  highlight: "Highlight",
  whiteout: "White-out",
  draw: "Drawing",
  image: "Image",
};

/** Zoom stops. 1 is fit-to-width; the text on the page scales with it. */
const ZOOM_LEVELS = [0.5, 0.67, 0.8, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function PdfEditor({ initialTool = "text", toolSlug = "pdf-editor" }: { initialTool?: Tool; toolSlug?: string } = {}) {
  /* ── document ─────────────────────────────────────────────────────────── */
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<ArrayBuffer | null>(null);
  const [blank, setBlank] = useState<{ size: PageSizeKey; orientation: "portrait" | "landscape" } | null>(null);
  // The start screen keeps its own copy of the choices: writing them straight
  // into `blank` would count as "a document is open" before the visitor has
  // asked for one.
  const [newSheet, setNewSheet] = useState<{ size: PageSizeKey; orientation: "portrait" | "landscape" }>({
    size: "a4",
    orientation: "portrait",
  });
  const [blankPages, setBlankPages] = useState("1");
  const [pages, setPages] = useState<PageEntry[]>([]);
  const [pageSizes, setPageSizes] = useState<{ width: number; height: number }[]>([]);
  const [activePage, setActivePage] = useState(0);

  /* ── scene ────────────────────────────────────────────────────────────── */
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>(initialTool);
  const [style, setStyle] = useState<Style>(DEFAULT_STYLE);
  const [draft, setDraft] = useState<EditorElement | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toolSearch, setToolSearch] = useState("");
  const [imageBytes, setImageBytes] = useState<{ bytes: ArrayBuffer; url: string } | null>(null);

  /* ── history ──────────────────────────────────────────────────────────── */
  const [past, setPast] = useState<{ elements: EditorElement[]; pages: PageEntry[] }[]>([]);
  const [future, setFuture] = useState<{ elements: EditorElement[]; pages: PageEntry[] }[]>([]);

  /* ── status ───────────────────────────────────────────────────────────── */
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultFile[]>([]);
  const [docTitle, setDocTitle] = useState("");

  const drag = useRef<DragState | null>(null);
  /** Absolute (page-space) points of the stroke being drawn right now. */
  const strokePoints = useRef<{ x: number; y: number }[]>([]);
  const lastRecord = useRef<{ key: string; at: number }>({ key: "", at: 0 });
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [stageWidth, setStageWidth] = useState(640);
  const [zoom, setZoom] = useState(1);
  const { focused, setFocused } = useToolFocus();

  const info = usePdfInfo(file);
  const preview = usePageThumbs(file, { maxWidth: 900, maxPages: 60 });

  /* ── measuring the frame so the preview matches PDF points ─────────────── */
  // The observer watches the frame around the page, never the page itself:
  // the page is as wide as `zoom` says, so measuring it here would feed the
  // zoom back into its own input and the stage would grow on every frame.
  useEffect(() => {
    const node = frameRef.current;
    if (!node) return undefined;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setStageWidth(width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [blank, file]);

  /* ── reading page sizes ───────────────────────────────────────────────── */
  useEffect(() => {
    if (blank) {
      const { width, height } = EDITOR_PAGE_SIZES[blank.size];
      const size = blank.orientation === "landscape" ? { width: height, height: width } : { width, height };
      setPageSizes(pages.map(() => size));
      return;
    }
    if (!bytes) {
      setPageSizes([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const doc = await PDFDocument.load(bytes, { updateMetadata: false, ignoreEncryption: false });
        if (cancelled) return;
        setPageSizes(doc.getPages().map((page) => page.getSize()));
      } catch {
        if (!cancelled) setPageSizes([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [blank, bytes, pages.length]);

  /* ── opening a document ───────────────────────────────────────────────── */
  const openFile = useCallback(async (next: File) => {
    setError(null);
    try {
      const buffer = await next.arrayBuffer();
      setBytes(buffer);
      setFile(next);
      setBlank(null);
      setElements([]);
      setSelectedId(null);
      setPast([]);
      setFuture([]);
      setActivePage(0);
      setZoom(1);
      track("tool_started", { tool: toolSlug, files: 1 });
    } catch {
      setError("That file could not be read. Try choosing it again.");
    }
  }, [toolSlug]);

  useEffect(() => {
    if (!file || !info.pages) return;
    setPages((current) => {
      if (current.length) return current;
      return Array.from({ length: info.pages }, (_, index) => ({ id: uid("p"), sourceIndex: index }));
    });
  }, [file, info.pages]);

  const startBlank = () => {
    const count = Math.max(1, Math.min(20, Number(blankPages) || 1));
    setBlank(newSheet);
    setPages(Array.from({ length: count }, () => ({ id: uid("p"), sourceIndex: null })));
    setElements([]);
    setSelectedId(null);
    setPast([]);
    setFuture([]);
    setActivePage(0);
    setFile(null);
    setBytes(null);
    setZoom(1);
    track("tool_started", { tool: toolSlug });
  };

  const reset = () => {
    revokeResults(results);
    if (imageBytes) URL.revokeObjectURL(imageBytes.url);
    setImageBytes(null);
    setResults([]);
    setFile(null);
    setBytes(null);
    setBlank(null);
    setPages([]);
    setPageSizes([]);
    setElements([]);
    setSelectedId(null);
    setEditingId(null);
    setError(null);
    setPast([]);
    setFuture([]);
    setActivePage(0);
    setDocTitle("");
  };

  const documentOpen = Boolean(blank || file);

  /* ── zoom ─────────────────────────────────────────────────────────────── */
  // A document being open is the cue to give the stage the whole page: the
  // sidebar and the hero header collapse and never come back until the visitor
  // asks for them, or closes the document.
  useAutoFocus(documentOpen);

  const zoomStep = (direction: 1 | -1) => {
    setZoom((current) => {
      if (direction === 1) {
        return ZOOM_LEVELS.find((level) => level > current + 0.001) ?? ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
      }
      const lower = [...ZOOM_LEVELS].reverse().find((level) => level < current - 0.001);
      return lower ?? ZOOM_LEVELS[0];
    });
  };

  /* ── history helpers ──────────────────────────────────────────────────── */
  const snapshot = useCallback(() => ({ elements, pages }), [elements, pages]);

  const pushHistory = useCallback(() => {
    setPast((current) => [...current.slice(-49), snapshot()]);
    setFuture([]);
  }, [snapshot]);

  /** Collapses rapid edits of the same field into one undo step. */
  const record = useCallback(
    (key: string) => {
      const now = Date.now();
      if (lastRecord.current.key === key && now - lastRecord.current.at < 1200) {
        lastRecord.current.at = now;
        return;
      }
      lastRecord.current = { key, at: now };
      pushHistory();
    },
    [pushHistory],
  );

  const undo = () => {
    setPast((current) => {
      if (!current.length) return current;
      const previous = current[current.length - 1];
      setFuture((next) => [snapshot(), ...next].slice(0, 50));
      setElements(previous.elements);
      setPages(previous.pages);
      setSelectedId(null);
      setActivePage((page) => Math.min(page, Math.max(0, previous.pages.length - 1)));
      return current.slice(0, -1);
    });
  };

  const redo = () => {
    setFuture((current) => {
      if (!current.length) return current;
      const next = current[0];
      setPast((previous) => [...previous, snapshot()].slice(-50));
      setElements(next.elements);
      setPages(next.pages);
      setSelectedId(null);
      return current.slice(1);
    });
  };

  /* ── element helpers ──────────────────────────────────────────────────── */
  const selected = elements.find((element) => element.id === selectedId) ?? null;

  const elementDefaults = useCallback(
    (kind: EditorElementKind, rect: { x: number; y: number; width: number; height: number }): EditorElement => {
      const base: EditorElement = {
        id: uid("el"),
        kind,
        pageIndex: activePage,
        ...rect,
        opacity: style.opacity,
        rotation: 0,
      };
      switch (kind) {
        case "text":
          return {
            ...base,
            text: "",
            fontSize: style.fontSize,
            fontFamily: style.fontFamily,
            bold: style.bold,
            italic: style.italic,
            align: style.align,
            lineHeight: style.lineHeight,
            fill: style.stroke,
            stroke: style.stroke,
            wrap: true,
          };
        case "line":
        case "arrow":
          return { ...base, stroke: style.stroke, strokeWidth: style.strokeWidth, fill: null };
        case "draw":
          return { ...base, stroke: style.stroke, strokeWidth: style.strokeWidth, points: [] };
        case "rect":
          return { ...base, fill: style.fill, stroke: style.stroke, strokeWidth: style.strokeWidth, radius: SHAPE_DEFAULTS.rectRadius };
        case "roundrect":
          return { ...base, fill: style.fill, stroke: style.stroke, strokeWidth: style.strokeWidth, radius: SHAPE_DEFAULTS.roundrectRadius };
        case "polygon":
          return { ...base, fill: style.fill, stroke: style.stroke, strokeWidth: style.strokeWidth, sides: SHAPE_DEFAULTS.polygonSides };
        case "star":
          return {
            ...base,
            fill: style.fill,
            stroke: style.stroke,
            strokeWidth: style.strokeWidth,
            sides: SHAPE_DEFAULTS.starPoints,
            innerRatio: SHAPE_DEFAULTS.starInner,
          };
        case "highlight":
          return { ...base, fill: "#FDE68A", stroke: null };
        case "whiteout":
          return { ...base, fill: "#FFFFFF", stroke: null };
        case "image":
          return { ...base, imageBytes: imageBytes?.bytes, imageUrl: imageBytes?.url };
        default:
          return { ...base, fill: style.fill, stroke: style.stroke, strokeWidth: style.strokeWidth };
      }
    },
    [activePage, imageBytes, style],
  );

  const addElement = (element: EditorElement) => {
    pushHistory();
    setElements((current) => [...current, element]);
    setSelectedId(element.id);
  };

  /** Starts typing in an existing text box, as one undoable step. */
  const beginEdit = (id: string) => {
    pushHistory();
    setSelectedId(id);
    setTool("select");
    setEditingId(id);
  };

  const updateSelected = (patch: Partial<EditorElement>, historyKey: string) => {
    if (!selected) return;
    record(historyKey);
    setElements((current) => current.map((element) => (element.id === selected.id ? { ...element, ...patch } : element)));
  };

  const removeSelected = () => {
    if (!selected) return;
    pushHistory();
    if (editingId === selected.id) setEditingId(null);
    setElements((current) => current.filter((element) => element.id !== selected.id));
    setSelectedId(null);
  };

  const duplicateSelected = () => {
    if (!selected) return;
    pushHistory();
    const copy: EditorElement = {
      ...selected,
      id: uid("el"),
      x: clamp01(selected.x + 0.02),
      y: clamp01(selected.y + 0.02),
    };
    setElements((current) => [...current, copy]);
    setSelectedId(copy.id);
  };

  const reorder = (direction: "up" | "down") => {
    if (!selected) return;
    pushHistory();
    setElements((current) => {
      const index = current.findIndex((element) => element.id === selected.id);
      if (index === -1) return current;
      const target = direction === "up" ? index + 1 : index - 1;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  /* ── pointer geometry ─────────────────────────────────────────────────── */
  const point = (event: React.PointerEvent | PointerEvent) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: clamp01((event.clientX - rect.left) / rect.width),
      y: clamp01((event.clientY - rect.top) / rect.height),
    };
  };

  const onStagePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!documentOpen) return;
    const start = point(event);
    setError(null);

    if (tool === "select") {
      setSelectedId(null);
      return;
    }

    if (tool === "text") {
      const pageHeight = pageSizes[activePage]?.height ?? 842;
      const pageWidth = pageSizes[activePage]?.width ?? 595;
      const width = Math.min(0.6, Math.max(0.22, 260 / pageWidth));
      // Room for two lines at the current size plus a comfortable margin, so the
      // first keystroke is never clipped by the box it lives in.
      const height = textBoxHeight(style.fontSize, style.lineHeight, pageHeight);
      const element = {
        ...elementDefaults("text", {
          x: Math.min(clamp01(start.x), 1 - width),
          y: Math.min(clamp01(start.y), 1 - height),
          width,
          height,
        }),
        // Dummy copy, exactly like a design app: something visible lands on the
        // page, and the first keystroke replaces it.
        text: PLACEHOLDER_TEXT,
      };
      addElement(element);
      setTool("select");
      setEditingId(element.id);
      return;
    }

    if (tool === "image") {
      if (!imageBytes) {
        setError("Choose an image in the Insert panel first.");
        return;
      }
      addElement(elementDefaults("image", { x: clamp01(start.x), y: clamp01(start.y), width: 0.3, height: 0.2 }));
      setTool("select");
      return;
    }

    if (tool === "draw") {
      drag.current = { mode: "draw", origin: start, moved: false };
      // Capture keeps the stroke alive when the pointer leaves the page, so a
      // long line does not stop at the edge of the sheet.
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* unsupported pointer type — the plain handlers still work */
      }
      strokePoints.current = [start];
      setDraft({
        ...elementDefaults("draw", { x: start.x, y: start.y, width: 0, height: 0 }),
        points: [{ x: 0, y: 0 }],
      });
      return;
    }

    if (SHAPE_TOOLS.has(tool)) {
      drag.current = { mode: "create", origin: start, moved: false };
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
      setDraft(elementDefaults(tool, { x: start.x, y: start.y, width: 0, height: 0 }));
    }
  };

  const onStagePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state) return;
    const current = point(event);

    if (state.mode === "create") {
      state.moved = true;
      const pageW = pageSizes[activePage]?.width ?? 595.28;
      const pageH = pageSizes[activePage]?.height ?? 841.89;
      let dx = current.x - state.origin.x;
      let dy = current.y - state.origin.y;

      // Shift draws a perfect square (or circle), exactly as design apps do.
      if (event.shiftKey) {
        const widthPt = Math.abs(dx) * pageW;
        const heightPt = Math.abs(dy) * pageH;
        const side = Math.max(widthPt, heightPt);
        dx = (Math.sign(dx) || 1) * (side / pageW);
        dy = (Math.sign(dy) || 1) * (side / pageH);
      }

      setDraft((draftElement) =>
        draftElement
          ? {
              ...draftElement,
              x: Math.min(state.origin.x, state.origin.x + dx),
              y: Math.min(state.origin.y, state.origin.y + dy),
              width: Math.abs(dx),
              height: Math.abs(dy),
            }
          : draftElement,
      );
      return;
    }

    if (state.mode === "draw") {
      state.moved = true;
      strokePoints.current = [...strokePoints.current, current];
      const { points, ...box } = strokeBox(strokePoints.current);
      setDraft((draftElement) => (draftElement ? { ...draftElement, ...box, points } : draftElement));
      return;
    }

    if (state.mode === "move" && state.id && state.element) {
      const dx = current.x - state.origin.x;
      const dy = current.y - state.origin.y;
      if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) state.moved = true;
      const element = state.element;
      setElements((all) =>
        all.map((entry) =>
          entry.id === state.id
            ? {
                ...entry,
                x: Math.min(1 - element.width, Math.max(0, element.x + dx)),
                y: Math.min(1 - element.height, Math.max(0, element.y + dy)),
              }
            : entry,
        ),
      );
      return;
    }

    if (state.mode === "resize" && state.id && state.element) {
      const element = state.element;
      state.moved = true;
      const pageW = pageSizes[activePage]?.width ?? 595.28;
      const pageH = pageSizes[activePage]?.height ?? 841.89;
      const angle = element.rotation ?? 0;

      // Work in PDF points: a 45° rotation is only 45° on screen if x and y are
      // measured in the same unit, and a page is rarely square.
      const centre = { x: (element.x + element.width / 2) * pageW, y: (element.y + element.height / 2) * pageH };
      const pointer = { x: current.x * pageW, y: current.y * pageH };
      const local = rotatePoint(pointer, centre, -angle);

      const rect = {
        x: element.x * pageW,
        y: element.y * pageH,
        width: element.width * pageW,
        height: element.height * pageH,
      };
      const right = rect.x + rect.width;
      const bottom = rect.y + rect.height;
      const minSide = 6;

      let x = rect.x;
      let y = rect.y;
      let width = rect.width;
      let height = rect.height;

      if (state.corner === "nw" || state.corner === "sw") {
        x = Math.min(local.x, right - minSide);
        width = right - x;
      } else {
        width = Math.max(minSide, local.x - rect.x);
      }
      if (state.corner === "nw" || state.corner === "ne") {
        y = Math.min(local.y, bottom - minSide);
        height = bottom - y;
      } else {
        height = Math.max(minSide, local.y - rect.y);
      }

      // Shift keeps the original proportions, like every design tool.
      if (event.shiftKey && rect.width > 0 && rect.height > 0) {
        const ratio = rect.width / rect.height;
        if (width / ratio >= minSide) {
          const fitted = width / ratio;
          if (state.corner === "nw" || state.corner === "ne") {
            y = bottom - fitted;
            height = fitted;
          } else {
            height = fitted;
          }
        } else {
          const fitted = height * ratio;
          if (state.corner === "nw" || state.corner === "sw") {
            x = right - fitted;
            width = fitted;
          } else {
            width = fitted;
          }
        }
      }

      // The corner opposite the one being dragged must not move on screen, even
      // when the box is rotated — so the centre shifts by the rotated delta.
      const fixed = {
        x: state.corner === "nw" || state.corner === "sw" ? right : rect.x,
        y: state.corner === "nw" || state.corner === "ne" ? bottom : rect.y,
      };
      const oldOffset = { x: fixed.x - centre.x, y: fixed.y - centre.y };
      const newOffset = { x: fixed.x - (x + width / 2), y: fixed.y - (y + height / 2) };
      const shift = rotatePoint(
        { x: oldOffset.x - newOffset.x, y: oldOffset.y - newOffset.y },
        { x: 0, y: 0 },
        angle,
      );
      const newCentre = { x: centre.x + shift.x, y: centre.y + shift.y };

      setElements((all) =>
        all.map((entry) =>
          entry.id === state.id
            ? {
                ...entry,
                x: (newCentre.x - width / 2) / pageW,
                y: (newCentre.y - height / 2) / pageH,
                width: width / pageW,
                height: height / pageH,
              }
            : entry,
        ),
      );
    }
  };

  /** Rebuilds the pre-drag element list so a drag is one undo step. */
  const elementsBeforeDrag = (state: DragState, current: EditorElement[]) =>
    current.map((entry) => (entry.id === state.id && state.element ? state.element : entry));

  const onStagePointerUp = () => {
    const state = drag.current;
    const finished = draft;
    drag.current = null;
    setDraft(null);
    if (!state) return;

    if ((state.mode === "create" || state.mode === "draw") && finished) {
      if (state.mode === "draw") {
        const drawn = strokePoints.current;
        strokePoints.current = [];
        // A tap with the pen leaves a dot; a stroke keeps the size it was drawn.
        if (drawn.length > 1) {
          const { points, ...box } = strokeBox(drawn);
          addElement({ ...finished, ...box, points });
        } else if (drawn.length === 1) {
          const dot = drawn[0];
          addElement({
            ...finished,
            x: Math.max(0, Math.min(1, dot.x)),
            y: Math.max(0, Math.min(1, dot.y)),
            width: 0.006,
            height: 0.006,
            points: [
              { x: 0, y: 0 },
              { x: 1, y: 1 },
            ],
          });
        }
        return;
      }
      if (finished.width < 0.01 || finished.height < 0.01) {
        // A click rather than a drag: give the shape a sensible default size.
        // Polygons and stars start as true squares, not squashed rectangles.
        const pageW = pageSizes[activePage]?.width ?? 595.28;
        const pageH = pageSizes[activePage]?.height ?? 841.89;
        const points = finished.kind === "polygon" || finished.kind === "star" || finished.kind === "ellipse";
        const width = points ? 0.2 : 0.25;
        const height = points ? (0.2 * pageW) / pageH : 0.12;
        addElement({ ...finished, width, height });
        return;
      }
      addElement(finished);
      return;
    }

    if (state.moved && (state.mode === "move" || state.mode === "resize")) {
      // The geometry has already been applied live, so the undo entry is the
      // element as it was before the drag started.
      setPast((current) => [...current.slice(-49), { elements: elementsBeforeDrag(state, elements), pages }]);
      setFuture([]);
    }
  };

  const startMove = (event: React.PointerEvent, element: EditorElement) => {
    event.stopPropagation();
    setSelectedId(element.id);
    // With the text tool in hand, clicking existing text edits it — creating a
    // second empty box on top of the first one helps nobody.
    if (tool === "text" && element.kind === "text") {
      beginEdit(element.id);
      return;
    }
    if (tool !== "select") return;
    drag.current = { mode: "move", id: element.id, origin: point(event), element, moved: false };
  };

  const startResize = (event: React.PointerEvent, element: EditorElement, corner: "nw" | "ne" | "sw" | "se") => {
    event.stopPropagation();
    setSelectedId(element.id);
    try {
      // Keep receiving moves when the pointer runs past the page edge.
      stageRef.current?.setPointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
    drag.current = { mode: "resize", id: element.id, corner, origin: point(event), element, moved: false };
  };

  /* ── keyboard ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable)) return;

      if ((event.metaKey || event.ctrlKey) && ["=", "+", "-", "_", "0"].includes(event.key)) {
        event.preventDefault();
        if (event.key === "0") setZoom(1);
        else zoomStep(event.key === "-" || event.key === "_" ? -1 : 1);
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if ((event.key === "Delete" || event.key === "Backspace") && selectedId) {
        event.preventDefault();
        removeSelected();
        return;
      }
      if (event.key === "Escape") {
        setSelectedId(null);
        setTool("select");
        return;
      }
      if (selectedId && /^Arrow/.test(event.key)) {
        event.preventDefault();
        const step = event.shiftKey ? 0.02 : 0.002;
        const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
        const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
        setElements((current) =>
          current.map((entry) =>
            entry.id === selectedId
              ? {
                  ...entry,
                  x: Math.min(1 - entry.width, Math.max(0, entry.x + dx)),
                  y: Math.min(1 - entry.height, Math.max(0, entry.y + dy)),
                }
              : entry,
          ),
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // Handlers close over current state on purpose; the listeners are cheap.
  }, [selectedId, past, future, elements, pages]);

  /* ── pages ────────────────────────────────────────────────────────────── */
  const addPage = () => {
    pushHistory();
    setPages((current) => [...current, { id: uid("p"), sourceIndex: blank ? null : null }]);
    setActivePage(pages.length);
  };

  const duplicatePage = (index: number) => {
    const page = pages[index];
    if (!page) return;
    pushHistory();
    setPages((current) => [...current.slice(0, index + 1), { id: uid("p"), sourceIndex: page.sourceIndex }, ...current.slice(index + 1)]);
    setElements((current) => {
      const copies = current
        .filter((element) => element.pageIndex === index)
        .map((element) => ({ ...element, id: uid("el"), pageIndex: index + 1 }));
      return [...current.map((element) => (element.pageIndex > index ? { ...element, pageIndex: element.pageIndex + 1 } : element)), ...copies];
    });
    setActivePage(index + 1);
  };

  const deletePage = (index: number) => {
    if (pages.length === 1) {
      setError("A document needs at least one page.");
      return;
    }
    pushHistory();
    setPages((current) => current.filter((_, position) => position !== index));
    setElements((current) =>
      current
        .filter((element) => element.pageIndex !== index)
        .map((element) => (element.pageIndex > index ? { ...element, pageIndex: element.pageIndex - 1 } : element)),
    );
    setActivePage((page) => Math.max(0, page >= index ? page - 1 : page));
    setSelectedId(null);
  };

  const movePage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= pages.length) return;
    pushHistory();
    setPages((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setElements((current) =>
      current.map((element) => {
        if (element.pageIndex === index) return { ...element, pageIndex: target };
        if (element.pageIndex === target) return { ...element, pageIndex: index };
        return element;
      }),
    );
    setActivePage(target);
  };

  /* ── export ───────────────────────────────────────────────────────────── */
  const exportPdf = async () => {
    if (!documentOpen) return;
    if (!elements.length && !blank) {
      setError("Add something to the page before exporting, or start a blank document to export an empty page.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await renderEditorPdf({
        source: blank
          ? { kind: "blank", pages: pages.length, size: blank.size, orientation: blank.orientation }
          : { kind: "pdf", bytes: bytes! },
        pages: blank ? undefined : pages.map((page) => ({ sourceIndex: page.sourceIndex })),
        elements,
        title: docTitle.trim() || undefined,
      });

      const blob = new Blob([result.bytes as unknown as BlobPart], { type: "application/pdf" });
      const name = blank
        ? `filecraft-document.pdf`
        : `${(file?.name ?? "document").replace(/\.pdf$/i, "")}-edited.pdf`;

      setResults([
        {
          id: uid("result"),
          name,
          blob,
          size: blob.size,
          originalSize: blank ? undefined : file?.size,
          note: `${result.pages} page${result.pages === 1 ? "" : "s"} · ${result.elements} object${
            result.elements === 1 ? "" : "s"
          } drawn${result.dropped ? ` · ${result.dropped} skipped` : ""}`,
        },
      ]);
      track("tool_completed", { tool: toolSlug, elements: result.elements, pages: result.pages });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The document could not be exported.");
    } finally {
      setBusy(false);
    }
  };

  /* ── text boxes stay taller than their text ───────────────────────────── */
  // Growing only: a box the user resized by hand is never yanked back, but a
  // bigger font or narrower box can no longer leave text hanging outside the
  // selection frame.
  useEffect(() => {
    if (!pageSizes.length) return;
    setElements((current) => {
      let changed = false;
      const next = current.map((element) => {
        if (element.kind !== "text" || element.id === editingId) return element;
        const page = pageSizes[element.pageIndex] ?? pageSizes[0];
        if (!page) return element;
        const needed = (measuredTextHeight(element, element.width * page.width) + 2) / page.height;
        const target = Math.min(1 - element.y, needed);
        // Compare against the target, not the raw measurement, so a box that
        // already reaches the page bottom cannot trigger another update.
        if (target <= element.height + 0.004) return element;
        changed = true;
        return { ...element, height: target };
      });
      return changed ? next : current;
    });
  }, [elements, editingId, pageSizes]);

  /* ── derived ──────────────────────────────────────────────────────────── */
  const filteredTools = useMemo(() => {
    const query = toolSearch.trim().toLowerCase();
    if (!query) return TOOLS;
    return TOOLS.filter((entry) => `${entry.label} ${entry.keywords} ${entry.key}`.toLowerCase().includes(query));
  }, [toolSearch]);

  const pageSize = pageSizes[activePage] ?? pageSizes[0] ?? null;
  // 100 % is fit-to-width, capped so an ultra-wide monitor does not render a
  // billboard. Anything above that scrolls inside the frame.
  const fitWidth = Math.min(stageWidth, 760);
  const renderWidth = Math.max(160, Math.round(fitWidth * zoom));
  const scale = pageSize ? renderWidth / pageSize.width : 1;
  const pageElements = elements.filter((element) => element.pageIndex === activePage);
  const activeThumb = pages[activePage]?.sourceIndex != null
    ? preview.thumbs.find((thumb) => thumb.pageIndex === pages[activePage].sourceIndex)
    : null;
  const aspect = pageSize ? pageSize.height / pageSize.width : activeThumb ? activeThumb.height / activeThumb.width : 1.414;

  /* ── inline text editing ──────────────────────────────────────────────── */
  // Typing happens on the page, in a box that matches the printed text — font,
  // size, weight, alignment and colour all come from the element. The HTML text
  // is never copied straight into the PDF: the element's `text` is updated as
  // you type and the exporter lays it out again, which is why the preview and
  // the export agree.
  const stopEditing = () => {
    if (editingId) {
      const element = elements.find((entry) => entry.id === editingId);
      // An empty text box has nothing to show and nothing to export.
      if (element && element.kind === "text" && !(element.text ?? "").trim()) {
        setElements((current) => current.filter((entry) => entry.id !== editingId));
        setSelectedId(null);
      }
    }
    setEditingId(null);
  };

  const editing = editingId ? elements.find((element) => element.id === editingId && element.kind === "text") ?? null : null;

  const inlineEditor = editing ? (
    <div
      key={editing.id}
      className="absolute"
      style={{
        left: `${editing.x * 100}%`,
        top: `${editing.y * 100}%`,
        width: `${editing.width * 100}%`,
        minHeight: `${editing.height * 100}%`,
        transform: editing.rotation ? `rotate(${editing.rotation}deg)` : undefined,
        opacity: editing.opacity ?? 1,
      }}
    >
      <InlineTextEditor
        element={editing}
        scale={scale}
        selectAll={(editing.text ?? "") === PLACEHOLDER_TEXT}
        onInput={(text) =>
          setElements((current) => current.map((entry) => (entry.id === editing.id ? { ...entry, text } : entry)))
        }
        // The box tracks the text in both directions, so the selection frame
        // hugs the words instead of hanging below them.
        onGrow={(heightPx) => {
          const pageHeight = pageSizes[activePage]?.height ?? 842;
          const rendered = pageHeight * scale;
          if (!rendered) return;
          const needed = Math.min(1 - editing.y, Math.max(0.012, (heightPx + 2) / rendered));
          if (Math.abs(needed - editing.height) < 0.002) return;
          setElements((current) =>
            current.map((entry) => (entry.id === editing.id ? { ...entry, height: needed } : entry)),
          );
        }}
        onDone={stopEditing}
      />
      <span className="pointer-events-none mt-1 block text-[10px] font-semibold uppercase tracking-wide text-white/60">
        Esc or click outside to finish
      </span>
    </div>
  ) : null;

  if (results.length) {
    return (
      <ToolFrame labelledBy="tool-title">
        <ResultsPanel
          files={results}
          onReset={reset}
          heading="Your document is ready"
          compare={blank ? "conversion" : "compression"}
          zipLabel="Download"
        />
      </ToolFrame>
    );
  }

  /* ── start screen ─────────────────────────────────────────────────────── */
  if (!documentOpen) {
    return (
      <ToolFrame labelledBy="tool-title">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
              <FileText className="h-4 w-4 text-brand-600" aria-hidden="true" />
              Start a blank document
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-subtle">
              An empty page you fill yourself — title pages, invoices, certificates, posters.
            </p>
            <div className="mt-3 grid gap-3">
              <Field label="Page size" htmlFor="new-size">
                <select
                  id="new-size"
                  className={selectClass}
                  value={newSheet.size}
                  onChange={(event) => setNewSheet({ size: event.target.value as PageSizeKey, orientation: newSheet.orientation })}
                >
                  {Object.entries(EDITOR_PAGE_SIZES).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.label}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Orientation" htmlFor="new-orientation">
                  <select
                    id="new-orientation"
                    className={selectClass}
                    value={newSheet.orientation}
                    onChange={(event) =>
                      setNewSheet({ size: newSheet.size, orientation: event.target.value as "portrait" | "landscape" })
                    }
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </Field>
                <Field label="Pages" htmlFor="new-pages">
                  <input
                    id="new-pages"
                    type="number"
                    min={1}
                    max={20}
                    value={blankPages}
                    onChange={(event) => setBlankPages(event.target.value)}
                    className="h-11 w-full rounded-xl border border-line bg-raised px-3 font-mono text-[14px] tabular-nums text-ink outline-none focus:border-brand-400"
                  />
                </Field>
              </div>
              <button type="button" onClick={startBlank} className="btn-primary w-full">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Create blank document
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
              <PenTool className="h-4 w-4 text-brand-600" aria-hidden="true" />
              Open a PDF to edit
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-subtle">
              Add text, shapes, images, highlights and white-out on top of the pages.
            </p>
            <div className="mt-3">
              <PdfSource file={null} onFile={openFile} onRemove={() => setFile(null)} title="Drop your PDF here" subtitle="PDF only · up to 200 MB · nothing is uploaded" />
            </div>
            <p className="mt-2 rounded-lg bg-raised px-3 py-2 text-[11px] leading-relaxed text-subtle">
              Existing text cannot be retyped in a browser — a PDF stores positioned glyphs, not paragraphs. Cover a
              line with white-out and write over it, or rebuild the page in a blank document.
            </p>
          </div>
        </div>
      </ToolFrame>
    );
  }

  /* ── editor ───────────────────────────────────────────────────────────── */
  return (
    <ToolFrame labelledBy="tool-title">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11.5px] font-semibold text-body">
          {blank ? `Blank · ${EDITOR_PAGE_SIZES[blank.size].label.split(" (")[0]}` : (file?.name ?? "Document")}
        </span>
        <span className="text-[11.5px] text-subtle">
          {pages.length} page{pages.length === 1 ? "" : "s"} · {elements.length} object{elements.length === 1 ? "" : "s"}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={undo}
            disabled={!past.length}
            className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-raised text-body disabled:opacity-40"
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!future.length}
            className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-raised text-body disabled:opacity-40"
            aria-label="Redo"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={reset} className="ml-1 text-[11.5px] font-semibold text-subtle hover:text-danger">
            Start over
          </button>
        </div>
      </div>

      {/* Three columns only when there is room for a readable page; below that the
          inspector moves under the stage instead of squeezing it to a strip. */}
      <div className="grid gap-4 lg:grid-cols-[190px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,1fr)_240px]">
        {/* Tools */}
        <div className="lg:order-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle" aria-hidden="true" />
            <input
              type="search"
              value={toolSearch}
              onChange={(event) => setToolSearch(event.target.value)}
              placeholder="Search tools…"
              aria-label="Search editing tools"
              className="h-9 w-full rounded-lg border border-line bg-raised pl-8 pr-2 text-[12px] text-ink outline-none focus:border-brand-400"
            />
          </div>

          {/* Grouped like a design app's toolbox, so the shapes do not blur into
              one long list once you are hunting for the star tool. */}
          <div className="mt-2 grid grid-cols-2 gap-1.5 lg:grid-cols-1">
            {TOOL_GROUPS.map((group) => {
              const entries = filteredTools.filter((entry) => entry.group === group);
              if (!entries.length) return null;
              return (
                <div key={group} className="col-span-2 lg:col-span-1">
                  <p className="mb-1 mt-1.5 px-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-subtle first:mt-0">
                    {group}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-1">
                    {entries.map((entry) => {
                      const Icon = entry.icon;
                      const active = tool === entry.key;
                      return (
                        <button
                          key={entry.key}
                          type="button"
                          onClick={() => setTool(entry.key)}
                          aria-pressed={active}
                          className={cn(
                            "flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-[12px] font-semibold transition-colors",
                            active
                              ? "border-primary/45 bg-primary/10 text-brand-700"
                              : "border-line bg-raised text-body hover:border-primary/30",
                          )}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span className="truncate">{entry.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {!filteredTools.length && (
              <p className="col-span-2 rounded-lg border border-dashed border-line px-2 py-3 text-center text-[11.5px] text-subtle">
                No tool matches “{toolSearch}”.
              </p>
            )}
          </div>

          {tool === "image" && (
            <div className="mt-2">
              <label className="block text-[11.5px] font-semibold text-ink" htmlFor="editor-image">
                Image file
              </label>
              <input
                id="editor-image"
                type="file"
                accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                onChange={async (event) => {
                  const picked = event.target.files?.[0];
                  if (!picked) return;
                  if (imageBytes) URL.revokeObjectURL(imageBytes.url);
                  setImageBytes({ bytes: await picked.arrayBuffer(), url: makePreviewUrl(picked) });
                  setError(null);
                }}
                className="mt-1 block w-full cursor-pointer rounded-lg border border-line bg-raised px-2 py-1.5 text-[11.5px] file:mr-2 file:rounded file:border-0 file:bg-brand-50 file:px-2 file:py-1 file:text-[11px] file:font-semibold file:text-brand-700"
              />
              <p className="mt-1 text-[10.5px] leading-snug text-subtle">PNG or JPG. Then click the page to place it.</p>
            </div>
          )}
        </div>

        {/* Stage */}
        <div className="min-w-0 lg:order-2">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <div
              className="inline-flex items-center gap-0.5 rounded-lg border border-line bg-surface p-0.5"
              role="group"
              aria-label="Zoom the page"
            >
              <button
                type="button"
                onClick={() => zoomStep(-1)}
                disabled={zoom <= ZOOM_LEVELS[0]}
                aria-label="Zoom out"
                title="Zoom out (Ctrl or ⌘ and −)"
                className="grid h-7 w-7 place-items-center rounded-md text-body transition-colors hover:bg-raised disabled:opacity-40"
              >
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <output aria-live="polite" className="min-w-[44px] text-center text-[11.5px] font-semibold tabular-nums text-ink">
                {Math.round(zoom * 100)}%
              </output>
              <button
                type="button"
                onClick={() => zoomStep(1)}
                disabled={zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
                aria-label="Zoom in"
                title="Zoom in (Ctrl or ⌘ and +)"
                className="grid h-7 w-7 place-items-center rounded-md text-body transition-colors hover:bg-raised disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setZoom(1)}
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors",
                zoom === 1
                  ? "border-line bg-surface text-subtle"
                  : "border-primary/45 bg-primary/10 text-brand-700 hover:border-primary/60",
              )}
              title="Back to the page filling the width (Ctrl or ⌘ and 0)"
            >
              Fit width
            </button>

            <button
              type="button"
              onClick={() => setFocused(!focused)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11.5px] font-semibold text-body transition-colors hover:border-primary/45 hover:text-brand-600"
              title={focused ? "Bring the sidebar and page header back" : "Hide the sidebar and page header to work wider"}
            >
              {focused ? (
                <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {focused ? "Normal width" : "Full width"}
            </button>
          </div>

          <div className="rounded-xl border border-line bg-[#0b1020] p-2">
            <div
              ref={frameRef}
              className="w-full overflow-auto"
              style={{ maxHeight: zoom > 1 ? "74vh" : undefined }}
            >
              <div className="mx-auto" style={{ width: renderWidth }}>
                <div
                  ref={stageRef}
                  onPointerDown={onStagePointerDown}
                  onPointerMove={onStagePointerMove}
                  onPointerUp={onStagePointerUp}
                  onPointerCancel={onStagePointerUp}
                  onPointerLeave={(event) => {
                    // While the stage holds pointer capture, leaving its box
                    // must not end the stroke — that is the whole point of it.
                    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) return;
                    onStagePointerUp();
                  }}
                  className="relative w-full touch-none select-none overflow-hidden rounded bg-white shadow-card"
                  style={{ aspectRatio: `1 / ${aspect}`, cursor: tool === "select" ? "default" : tool === "text" ? "text" : "crosshair" }}
                >
                  {activeThumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={activeThumb.url} alt={`Page ${activePage + 1}`} className="pointer-events-none absolute inset-0 h-full w-full object-fill" draggable={false} />
                  ) : blank ? null : (
                    <div className="absolute inset-0 grid place-items-center text-[11px] text-subtle">
                      {preview.loading ? "Rendering the page…" : "This page could not be previewed"}
                    </div>
                  )}

                  {pageElements.map((element) => (
                    <ElementView
                      key={element.id}
                      element={element.id === editingId ? { ...element, text: "" } : element}
                      scale={scale}
                      selected={element.id === selectedId}
                      interactive
                      onPointerDown={
                        tool === "select" || tool === "text" ? (event) => startMove(event, element) : undefined
                      }
                      onDoubleClick={(event) => {
                        if (element.kind !== "text" || tool !== "select") return;
                        event.stopPropagation();
                        beginEdit(element.id);
                      }}
                    />
                  ))}
                  {inlineEditor}

                  {/* Selection frame: the same box and the same rotation as the
                      object itself, so the outline and the handles sit exactly on
                      its edges instead of on an axis-aligned guess. */}
                  {selected && !editing && (
                    <div
                      className="pointer-events-none absolute z-10 outline outline-1 outline-offset-0 outline-brand-500"
                      style={{
                        left: `${selected.x * 100}%`,
                        top: `${selected.y * 100}%`,
                        width: `${selected.width * 100}%`,
                        height: `${selected.height * 100}%`,
                        transform: selected.rotation ? `rotate(${selected.rotation}deg)` : undefined,
                      }}
                    >
                      {(["nw", "ne", "sw", "se"] as const).map((corner) => (
                        <span
                          key={corner}
                          role="presentation"
                          onPointerDown={(event) => startResize(event, selected, corner)}
                          className={cn(
                            "pointer-events-auto absolute h-3 w-3 rounded-full border-2 border-brand-500 bg-white shadow-sm",
                            corner === "nw" && "-left-1.5 -top-1.5 cursor-nwse-resize",
                            corner === "ne" && "-right-1.5 -top-1.5 cursor-nesw-resize",
                            corner === "sw" && "-bottom-1.5 -left-1.5 cursor-nesw-resize",
                            corner === "se" && "-bottom-1.5 -right-1.5 cursor-nwse-resize",
                          )}
                        />
                      ))}
                    </div>
                  )}

                  {draft && <ElementView element={draft} scale={scale} selected={false} interactive={false} />}

                  {!blank && !activeThumb && !preview.loading && (
                    <div className="pointer-events-none absolute inset-0 bg-white/95 p-4 text-[12px] text-subtle">
                      Preview unavailable — objects you add are still written into the exported PDF.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <p className="mt-2 text-[11.5px] leading-relaxed text-subtle">
            {tool === "select"
              ? "Drag to move, corner handles to resize, double-click text to type in it, arrow keys to nudge."
              : tool === "text"
                ? "Click the page: a Lorem ipsum box appears, already selected — type to replace it, Esc to finish."
                : tool === "draw"
                  ? "Draw at any size — the stroke keeps the size and thickness you drew it with."
                  : SHAPE_TOOLS.has(tool)
                    ? "Click for a default size, drag for the exact box, or hold Shift for a square."
                    : "Choose an image in the tool panel, then click the page to place it."}
          </p>

          {/* page strip */}
          <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1">
            {pages.map((page, index) => {
              const thumb = page.sourceIndex != null ? preview.thumbs.find((item) => item.pageIndex === page.sourceIndex) : null;
              return (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => setActivePage(index)}
                  aria-pressed={index === activePage}
                  className={cn(
                    "relative h-12 w-9 shrink-0 overflow-hidden rounded border bg-white text-[10px] font-semibold",
                    index === activePage ? "border-brand-500 ring-1 ring-brand-500" : "border-line",
                  )}
                  aria-label={`Go to page ${index + 1}`}
                >
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb.url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-subtle">{index + 1}</span>
                  )}
                </button>
              );
            })}
            <button
              type="button"
              onClick={addPage}
              className="grid h-12 w-9 shrink-0 place-items-center rounded border border-dashed border-line text-subtle hover:border-primary/40 hover:text-body"
              aria-label="Add a blank page"
              title="Add a blank page"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
            <button type="button" onClick={() => movePage(activePage, -1)} disabled={activePage === 0} className="rounded border border-line bg-raised px-2 py-1 text-subtle disabled:opacity-40">
              <ArrowUp className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">Move page earlier</span>
            </button>
            <button
              type="button"
              onClick={() => movePage(activePage, 1)}
              disabled={activePage === pages.length - 1}
              className="rounded border border-line bg-raised px-2 py-1 text-subtle disabled:opacity-40"
            >
              <ArrowDown className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">Move page later</span>
            </button>
            <button type="button" onClick={() => duplicatePage(activePage)} className="rounded border border-line bg-raised px-2 py-1 text-subtle hover:text-body">
              <Copy className="mr-1 inline h-3 w-3" aria-hidden="true" />
              Duplicate page
            </button>
            <button type="button" onClick={() => deletePage(activePage)} className="rounded border border-line bg-raised px-2 py-1 text-subtle hover:text-danger">
              <Trash2 className="mr-1 inline h-3 w-3" aria-hidden="true" />
              Delete page
            </button>
          </div>
        </div>

        {/* Inspector */}
        <div className="order-3 min-w-0 space-y-3 lg:col-span-2 lg:mx-auto lg:w-full lg:max-w-lg xl:col-span-1 xl:mx-0 xl:max-w-none">
          {selected ? (
            <>
              <div className="flex items-center justify-between gap-1">
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-subtle">
                  {KIND_LABELS[selected.kind]}
                </p>
                <div className="flex items-center gap-1">
                  <ToggleButton active={false} onClick={() => reorder("up")} label="Bring forward">
                    <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                  </ToggleButton>
                  <ToggleButton active={false} onClick={() => reorder("down")} label="Send backward">
                    <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </ToggleButton>
                  <ToggleButton active={false} onClick={duplicateSelected} label="Duplicate">
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  </ToggleButton>
                  <ToggleButton active={false} onClick={removeSelected} label="Delete">
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </ToggleButton>
                </div>
              </div>

              {selected.kind === "text" && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="el-text" className="text-[12px] font-semibold text-ink">
                      Text
                    </label>
                    <button
                      type="button"
                      onClick={() => beginEdit(selected.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-line bg-raised px-2 py-0.5 text-[10.5px] font-semibold text-body transition-colors hover:border-primary/45 hover:text-brand-600"
                    >
                      <Type className="h-3 w-3" aria-hidden="true" />
                      Edit on page
                    </button>
                  </div>
                  <textarea
                    id="el-text"
                    value={selected.text ?? ""}
                    onChange={(event) => updateSelected({ text: event.target.value }, "text")}
                    rows={3}
                    placeholder="Type here, or press “Edit on page” and type where it will appear"
                    className="w-full resize-y rounded-lg border border-line bg-raised px-2 py-1.5 text-[12px] leading-relaxed text-ink outline-none focus:border-brand-400"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Font" htmlFor="el-font">
                      <select
                        id="el-font"
                        className="h-9 w-full rounded-lg border border-line bg-raised px-2 text-[12px] text-ink"
                        value={selected.fontFamily ?? "sans"}
                        onChange={(event) => updateSelected({ fontFamily: event.target.value as FontFamily }, "font")}
                      >
                        <option value="sans">Sans</option>
                        <option value="serif">Serif</option>
                        <option value="mono">Mono</option>
                      </select>
                    </Field>
                    <NumberField
                      label="Size (pt)"
                      value={selected.fontSize ?? 14}
                      min={4}
                      max={200}
                      onChange={(value) => updateSelected({ fontSize: value }, "size")}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1">
                    {[10, 12, 14, 18, 24, 36].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => updateSelected({ fontSize: size }, "size")}
                        aria-pressed={(selected.fontSize ?? 14) === size}
                        className={cn(
                          "rounded-md border px-1.5 py-1 text-[10.5px] font-semibold tabular-nums transition-colors",
                          (selected.fontSize ?? 14) === size
                            ? "border-primary/45 bg-primary/10 text-brand-700"
                            : "border-line bg-raised text-body hover:border-primary/30",
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <ToggleButton active={Boolean(selected.bold)} onClick={() => updateSelected({ bold: !selected.bold }, "bold")} label="Bold">
                      B
                    </ToggleButton>
                    <ToggleButton active={Boolean(selected.italic)} onClick={() => updateSelected({ italic: !selected.italic }, "italic")} label="Italic">
                      <span className="italic">I</span>
                    </ToggleButton>
                    {(["left", "center", "right"] as TextAlign[]).map((align) => (
                      <ToggleButton
                        key={align}
                        active={(selected.align ?? "left") === align}
                        onClick={() => updateSelected({ align }, "align")}
                        label={`Align ${align}`}
                      >
                        <span className="text-[11px] font-semibold">{align === "left" ? "L" : align === "center" ? "C" : "R"}</span>
                      </ToggleButton>
                    ))}
                  </div>

                  <SliderField
                    label="Line spacing"
                    value={Math.round((selected.lineHeight ?? 1.3) * 100)}
                    min={90}
                    max={220}
                    onChange={(value) => updateSelected({ lineHeight: value / 100 }, "lineHeight")}
                    format={(value) => `${(value / 100).toFixed(2)}×`}
                  />
                </>
              )}

              {(selected.kind === "rect" ||
                selected.kind === "roundrect" ||
                selected.kind === "ellipse" ||
                selected.kind === "triangle" ||
                selected.kind === "image" ||
                selected.kind === "whiteout" ||
                selected.kind === "highlight") && (
                <ColorField
                  label="Fill"
                  value={selected.fill ?? null}
                  allowNone
                  onChange={(value) => updateSelected({ fill: value }, "fill")}
                />
              )}

              {(selected.kind === "rect" ||
                selected.kind === "roundrect" ||
                selected.kind === "ellipse" ||
                selected.kind === "triangle" ||
                selected.kind === "line" ||
                selected.kind === "arrow" ||
                selected.kind === "draw" ||
                selected.kind === "text") && (
                <ColorField
                  label={selected.kind === "text" ? "Text colour" : "Line / outline"}
                  value={selected.stroke ?? null}
                  allowNone={selected.kind !== "text"}
                  onChange={(value) =>
                    updateSelected(selected.kind === "text" ? { stroke: value, fill: value } : { stroke: value }, "stroke")
                  }
                />
              )}

              {(selected.kind === "rect" ||
                selected.kind === "line" ||
                selected.kind === "arrow" ||
                selected.kind === "draw" ||
                selected.kind === "roundrect" ||
                selected.kind === "ellipse" ||
                selected.kind === "triangle" ||
                selected.kind === "polygon" ||
                selected.kind === "star") && (
                <NumberField
                  label="Outline width"
                  value={selected.strokeWidth ?? 2}
                  min={0}
                  max={24}
                  step={0.5}
                  suffix="pt"
                  onChange={(value) => updateSelected({ strokeWidth: value }, "strokeWidth")}
                />
              )}

              {/* ── shape geometry, the same knobs a design app puts in its
                     shape options ─────────────────────────────────────────── */}
              {(selected.kind === "rect" || selected.kind === "roundrect" || selected.kind === "ellipse") && (
                <button
                  type="button"
                  onClick={() => {
                    const pageW = pageSizes[activePage]?.width ?? 595.28;
                    const pageH = pageSizes[activePage]?.height ?? 841.89;
                    const side = (selected.width * pageW) / pageH;
                    updateSelected({ height: Math.min(1 - selected.y, side) }, "square");
                  }}
                  className="w-full rounded-lg border border-line bg-raised px-2 py-1.5 text-[11.5px] font-semibold text-body transition-colors hover:border-primary/45 hover:text-brand-600"
                >
                  {selected.kind === "ellipse" ? "Make it a circle" : "Make it a square"}
                </button>
              )}

              {(selected.kind === "rect" || selected.kind === "roundrect") && (
                <SliderField
                  label="Corner radius"
                  value={Math.round(selected.radius ?? (selected.kind === "roundrect" ? SHAPE_DEFAULTS.roundrectRadius : 0))}
                  min={0}
                  max={90}
                  onChange={(value) => updateSelected({ radius: value }, "radius")}
                  format={(value) => `${value} pt`}
                />
              )}

              {selected.kind === "polygon" && (
                <SliderField
                  label="Sides"
                  value={selected.sides ?? SHAPE_DEFAULTS.polygonSides}
                  min={3}
                  max={16}
                  onChange={(value) => updateSelected({ sides: value }, "sides")}
                  format={(value) => `${value}`}
                />
              )}

              {selected.kind === "star" && (
                <>
                  <SliderField
                    label="Points"
                    value={selected.sides ?? SHAPE_DEFAULTS.starPoints}
                    min={3}
                    max={16}
                    onChange={(value) => updateSelected({ sides: value }, "star-points")}
                    format={(value) => `${value}`}
                  />
                  <SliderField
                    label="Inner radius"
                    value={Math.round((selected.innerRatio ?? SHAPE_DEFAULTS.starInner) * 100)}
                    min={10}
                    max={95}
                    onChange={(value) => updateSelected({ innerRatio: value / 100 }, "inner")}
                    format={(value) => `${value}%`}
                  />
                </>
              )}

              <SliderField
                label="Opacity"
                value={Math.round((selected.opacity ?? 1) * 100)}
                onChange={(value) => updateSelected({ opacity: value / 100 }, "opacity")}
                format={(value) => `${value}%`}
              />

              <SliderField
                label="Rotation"
                value={Math.round(selected.rotation ?? 0)}
                min={-180}
                max={180}
                onChange={(value) => updateSelected({ rotation: value }, "rotation")}
                format={(value) => `${value}°`}
              />

              <div className="grid grid-cols-2 gap-2">
                <NumberField label="X" value={Math.round(selected.x * 1000) / 10} min={0} max={100} step={0.5} suffix="%" onChange={(value) => updateSelected({ x: value / 100 }, "x")} />
                <NumberField label="Y" value={Math.round(selected.y * 1000) / 10} min={0} max={100} step={0.5} suffix="%" onChange={(value) => updateSelected({ y: value / 100 }, "y")} />
                <NumberField label="Width" value={Math.round(selected.width * 1000) / 10} min={1} max={100} step={0.5} suffix="%" onChange={(value) => updateSelected({ width: value / 100 }, "width")} />
                <NumberField label="Height" value={Math.round(selected.height * 1000) / 10} min={1} max={100} step={0.5} suffix="%" onChange={(value) => updateSelected({ height: value / 100 }, "height")} />
              </div>
            </>
          ) : (
            <>
              <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-subtle">New object style</p>
              <p className="text-[11.5px] leading-relaxed text-subtle">
                {tool === "select"
                  ? "Pick a tool on the left, then click or drag on the page. Select an object to edit it."
                  : tool === "text"
                    ? "Click the page and type straight onto it — the box grows with your text. These settings apply to the next box."
                    : SHAPE_TOOLS.has(tool)
                      ? "Click the page for a default size, or drag the exact box — hold Shift for a perfect square or circle. Polygon sides, star points and corner radius are in the inspector once it is selected."
                      : "Draw on the page with the mouse or a finger."}
              </p>
              <ColorField label="Fill" value={style.fill} onChange={(value) => setStyle((current) => ({ ...current, fill: value ?? "#2563EB" }))} />
              <ColorField label="Line / text" value={style.stroke} onChange={(value) => setStyle((current) => ({ ...current, stroke: value ?? "#0F172A" }))} />
              <div className="grid grid-cols-2 gap-2">
                <NumberField label="Outline" value={style.strokeWidth} min={0} max={24} step={0.5} suffix="pt" onChange={(value) => setStyle((current) => ({ ...current, strokeWidth: value }))} />
                <NumberField label="Text size" value={style.fontSize} min={4} max={200} step={1} suffix="pt" onChange={(value) => setStyle((current) => ({ ...current, fontSize: value }))} />
              </div>
              {(tool === "text" || tool === "select") && (
                <>
                  <Field label="Font" htmlFor="style-font">
                    <select
                      id="style-font"
                      className="h-9 w-full rounded-lg border border-line bg-raised px-2 text-[12px] text-ink"
                      value={style.fontFamily}
                      onChange={(event) => setStyle((current) => ({ ...current, fontFamily: event.target.value as FontFamily }))}
                    >
                      <option value="sans">Sans</option>
                      <option value="serif">Serif</option>
                      <option value="mono">Mono</option>
                    </select>
                  </Field>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <ToggleButton active={style.bold} onClick={() => setStyle((current) => ({ ...current, bold: !current.bold }))} label="Bold">
                      B
                    </ToggleButton>
                    <ToggleButton active={style.italic} onClick={() => setStyle((current) => ({ ...current, italic: !current.italic }))} label="Italic">
                      <span className="italic">I</span>
                    </ToggleButton>
                    {(["left", "center", "right"] as TextAlign[]).map((align) => (
                      <ToggleButton
                        key={align}
                        active={style.align === align}
                        onClick={() => setStyle((current) => ({ ...current, align }))}
                        label={`Align ${align}`}
                      >
                        <span className="text-[11px] font-semibold">{align === "left" ? "L" : align === "center" ? "C" : "R"}</span>
                      </ToggleButton>
                    ))}
                  </div>
                </>
              )}
              <SliderField label="Opacity" value={Math.round(style.opacity * 100)} onChange={(value) => setStyle((current) => ({ ...current, opacity: value / 100 }))} format={(value) => `${value}%`} />
            </>
          )}

          <div className="border-t border-line pt-3">
            <p className="mb-1.5 flex items-center justify-between text-[12px] font-semibold text-ink">
              On this page
              <span className="font-mono text-[11px] font-normal tabular-nums text-subtle">{pageElements.length}</span>
            </p>
            {pageElements.length ? (
              <ul className="max-h-40 space-y-1 overflow-y-auto pr-0.5">
                {[...pageElements].reverse().map((element) => (
                  <li key={element.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(element.id);
                        setTool("select");
                      }}
                      onDoubleClick={() => {
                        if (element.kind !== "text") return;
                        beginEdit(element.id);
                      }}
                      className={cn(
                        "flex w-full items-center gap-1.5 rounded-md border px-1.5 py-1 text-left text-[11px] transition-colors",
                        element.id === selectedId
                          ? "border-primary/45 bg-primary/10 text-brand-700"
                          : "border-line bg-raised text-body hover:border-primary/30",
                      )}
                    >
                      <span className="shrink-0 font-semibold">{KIND_LABELS[element.kind]}</span>
                      <span className="min-w-0 flex-1 truncate text-subtle">
                        {element.kind === "text" ? element.text || "(empty)" : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] leading-snug text-subtle">Nothing on this page yet.</p>
            )}
          </div>

          <div className="border-t border-line pt-3">
            <label htmlFor="doc-title" className="mb-1 block text-[12px] font-semibold text-ink">
              Document title <span className="font-normal text-subtle">(optional)</span>
            </label>
            <input
              id="doc-title"
              value={docTitle}
              onChange={(event) => setDocTitle(event.target.value)}
              placeholder="Invoice 2026-04"
              className="h-9 w-full rounded-lg border border-line bg-raised px-2 text-[12px] text-ink outline-none focus:border-brand-400"
            />
          </div>
        </div>
      </div>

      {error && (
        <Notice tone="warning" className="mt-3" onDismiss={() => setError(null)}>
          {error}
        </Notice>
      )}

      {preview.truncated && (
        <Notice tone="info" className="mt-3">
          This document has more pages than the preview renders. You can still add objects to every page and export.
        </Notice>
      )}

      <Notice tone="warning" className="mt-3">
        White-out covers text visually but leaves it extractable in the file. It is not redaction, and existing text
        cannot be retyped in a browser — cover and retype, or rebuild the page.
      </Notice>

      {busy && <ProgressBar value={0.7} label="Writing your document" />}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={exportPdf} disabled={busy} className="btn-primary w-full sm:w-auto">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
          {busy ? "Building the PDF…" : "Download PDF"}
        </button>
        <p className="text-[12px] text-subtle">
          Text stays selectable in the exported PDF. Everything is written in your browser.
        </p>
      </div>
    </ToolFrame>
  );
}
