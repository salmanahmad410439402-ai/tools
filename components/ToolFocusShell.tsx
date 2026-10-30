"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

/**
 * Full-width ("focus") mode for tool pages.
 *
 * A tool page carries a lot of furniture — a hero header, a 300px sidebar with
 * the privacy card and the on-this-page list, ad slots. All of that is useful
 * while deciding whether to trust the tool and useless the moment a document is
 * open and the visitor is dragging objects around on a page. So the shell owns
 * one boolean: when a widget says a document is open, the rail and the header
 * collapse and the stage gets the full width of the container.
 *
 * Nothing is removed from the document — the header, headings, sidebar copy and
 * JSON-LD all stay in the DOM, only their layout changes — so the page stays
 * complete for crawlers while the working area grows.
 */
type FocusState = {
  focused: boolean;
  setFocused: (value: boolean) => void;
};

const FocusContext = createContext<FocusState | null>(null);
const FALLBACK: FocusState = { focused: false, setFocused: () => undefined };

export function useToolFocus(): FocusState {
  return useContext(FocusContext) ?? FALLBACK;
}

/**
 * Enters full-width mode the first time `active` becomes true — i.e. when a
 * file has been loaded or a blank document created — and restores the normal
 * width once the document is closed, so choosing another file expands again.
 * Leaving full-width by hand is never undone behind the visitor's back.
 */
export function useAutoFocus(active: boolean) {
  const { setFocused } = useToolFocus();
  const expanded = useRef(false);

  useEffect(() => {
    if (active) {
      if (!expanded.current) {
        expanded.current = true;
        setFocused(true);
      }
    } else if (expanded.current) {
      // The document was closed (or the visitor started over) — put the page
      // back the way it was so the start screen is not stuck in a wide view.
      expanded.current = false;
      setFocused(false);
    }
  }, [active, setFocused]);
}

export function ToolFocusShell({
  above,
  header,
  widget,
  below,
  aside,
}: {
  above?: ReactNode;
  header: ReactNode;
  widget: ReactNode;
  below: ReactNode;
  aside: ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const value = useMemo<FocusState>(
    () => ({ focused, setFocused: (next: boolean) => setFocused(next) }),
    [focused],
  );

  return (
    <FocusContext.Provider value={value}>
      <div className={focused ? "hidden" : undefined}>{above}</div>

      <div className={focused ? "grid gap-6" : "grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10"}>
        <div className="min-w-0">
          <div className={focused ? undefined : "mb-5"}>{header}</div>
          {widget}
          {below}
        </div>

        <aside className={focused ? "hidden" : "hidden lg:block"} aria-label="Tool sidebar">
          {aside}
        </aside>
      </div>
    </FocusContext.Provider>
  );
}
