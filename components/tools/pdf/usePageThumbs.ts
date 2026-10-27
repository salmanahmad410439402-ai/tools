"use client";

import { useEffect, useState } from "react";
import { renderThumbnails } from "@/lib/pdf/render";

export interface Thumb {
  pageIndex: number;
  url: string;
  width: number;
  height: number;
  aspect: number;
}

interface ThumbState {
  thumbs: Thumb[];
  pageCount: number;
  loading: boolean;
  progress: number;
  error: string | null;
  truncated: boolean;
}

/**
 * Renders page thumbnails for previews. Long documents are capped so a phone
 * does not run out of memory; `truncated` tells the UI to say so.
 */
export function usePageThumbs(file: File | null, options: { maxPages?: number; maxWidth?: number } = {}) {
  const { maxPages = 120, maxWidth = 150 } = options;
  const [state, setState] = useState<ThumbState>({
    thumbs: [],
    pageCount: 0,
    loading: false,
    progress: 0,
    error: null,
    truncated: false,
  });

  useEffect(() => {
    if (!file) {
      setState({ thumbs: [], pageCount: 0, loading: false, progress: 0, error: null, truncated: false });
      return undefined;
    }

    let cancelled = false;
    setState((current) => ({ ...current, loading: true, progress: 0, error: null, thumbs: [] }));

    (async () => {
      try {
        const buffer = await file.arrayBuffer();
        const all = await renderThumbnails(buffer, {
          maxWidth,
          maxPages,
          onProgress: (ratio) => {
            if (!cancelled) setState((current) => ({ ...current, progress: ratio }));
          },
        });
        if (cancelled) return;
        // Re-count the real page total independently of the thumbnail cap.
        const pageCount = all.length;
        setState({
          thumbs: all,
          pageCount,
          loading: false,
          progress: 1,
          error: null,
          truncated: pageCount >= maxPages,
        });
      } catch (error) {
        if (cancelled) return;
        setState({
          thumbs: [],
          pageCount: 0,
          loading: false,
          progress: 0,
          error: error instanceof Error ? error.message : "This PDF could not be rendered.",
          truncated: false,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file, maxPages, maxWidth]);

  return state;
}
