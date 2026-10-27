"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Storage key + class contract shared with the inline script in app/layout.tsx.
 * Keep the two in sync: the script sets `.dark`/`.light` on <html> before first
 * paint, this button flips it afterwards.
 */
export const THEME_STORAGE_KEY = "filecraft-theme";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
  root.style.colorScheme = theme;
}

/**
 * Light/dark switch. The icon pair is driven by CSS (`.dark` on <html>), so the
 * correct icon shows even before hydration. `aria-pressed` is synced after
 * mount because the server cannot know the visitor's preference.
 */
export function ThemeToggle({ className, size = "md" }: { className?: string; size?: "sm" | "md" }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  function toggle() {
    const next: Theme = document.documentElement.classList.contains("dark") ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* Private mode / storage disabled: the choice simply does not persist. */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={mounted ? theme === "dark" : undefined}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "grid place-items-center rounded-xl border border-line bg-raised text-body transition-colors hover:border-brand-300 hover:text-ink",
        size === "sm" ? "h-9 w-9" : "h-10 w-10",
        className,
      )}
    >
      <Sun className="hidden h-[18px] w-[18px] dark:block" aria-hidden="true" />
      <Moon className="h-[18px] w-[18px] dark:hidden" aria-hidden="true" />
      <span className="sr-only">Toggle colour theme</span>
    </button>
  );
}

/**
 * Runs before paint, inside <head>. Kept as a string so it ships inline in the
 * static HTML and cannot flash the wrong theme.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var k="${THEME_STORAGE_KEY}";var s=localStorage.getItem(k);var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;var r=document.documentElement;r.classList.toggle("dark",d);r.classList.toggle("light",!d);r.style.colorScheme=d?"dark":"light";r.classList.add("js");}catch(e){document.documentElement.classList.add("js");}})();`;
