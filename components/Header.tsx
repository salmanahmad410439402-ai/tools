"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Menu, Search, X } from "lucide-react";
import { CATEGORIES, SITE_NAME } from "@/data/site";
import { TOOL_GROUPS, tools } from "@/data/tools";
import { searchAll, type SearchEntry } from "@/lib/search";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { ToolIcon } from "./icons";

const primaryNav = [
  { href: "/tools/", label: "All tools" },
  { href: "/pdf-tools/", label: "PDF" },
  { href: "/image-tools/", label: "Images" },
  { href: "/blog/", label: "Guides" },
  { href: "/faq/", label: "FAQ" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchId = useId();

  const results = useMemo(() => searchAll(query, 7), [query]);

  const closeAll = useCallback(() => {
    setMenuOpen(false);
    setMobileOpen(false);
    setSearchOpen(false);
  }, []);

  useEffect(() => {
    closeAll();
  }, [pathname, closeAll]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      const timer = window.setTimeout(() => searchInputRef.current?.focus(), 20);
      document.documentElement.style.overflow = "hidden";
      return () => {
        window.clearTimeout(timer);
        document.documentElement.style.overflow = "";
      };
    }
    return undefined;
  }, [searchOpen]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const go = useCallback(
    (entry: SearchEntry) => {
      setSearchOpen(false);
      setQuery("");
      router.push(entry.href);
    },
    [router],
  );

  const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) {
      if (event.key === "Enter" && query.trim()) {
        setSearchOpen(false);
        router.push(`/tools/?q=${encodeURIComponent(query.trim())}`);
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(results[Math.min(activeIndex, results.length - 1)]);
    }
  };

  /** The menu shows every PDF tool in one column, grouped by task. */
  const pdfGroups = useMemo(
    () =>
      TOOL_GROUPS.map((group) => ({
        group,
        items: tools.filter((tool) => tool.category === "pdf-tools" && tool.group === group.key),
      })).filter((entry) => entry.items.length > 0),
    [],
  );

  const otherCategories = useMemo(
    () =>
      CATEGORIES.filter((category) => category.slug !== "pdf-tools" && !category.hidden).map((category) => ({
        category,
        items: tools.filter((tool) => tool.category === category.slug),
      })),
    [],
  );

  return (
    <header className="sticky top-0 z-50 border-b border-line/90 bg-white/85 backdrop-blur-md">
      <div className="container-page flex h-[68px] items-center gap-3">
        <Logo />

        <nav aria-label="Main" className="ml-2 hidden items-center gap-1 lg:flex">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              className={cn(
                "flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 text-[14.5px] font-semibold text-body transition-colors hover:bg-surface hover:text-ink",
                menuOpen && "bg-surface text-ink",
              )}
              aria-expanded={menuOpen}
              aria-haspopup="true"
              onClick={() => setMenuOpen((open) => !open)}
            >
              All tools
              <ChevronDown className={cn("h-4 w-4 transition-transform", menuOpen && "rotate-180")} aria-hidden="true" />
            </button>
            {menuOpen && (
              <div className="fixed inset-x-0 top-[68px] z-40 max-h-[calc(100vh-68px)] overflow-y-auto border-b border-line bg-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)]">
                <div className="container-page py-7">
                  <div className="grid gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-4">
                    {/* PDF tools: the whole menu, grouped by task */}
                    <div className="min-w-0 lg:col-span-3">
                      <Link
                        href="/pdf-tools/"
                        className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-brand-600 hover:text-brand-700"
                      >
                        <ToolIcon name="FileText" className="h-4 w-4" />
                        PDF tools
                        <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-600">
                          {pdfGroups.reduce((total, entry) => total + entry.items.length, 0)}
                        </span>
                      </Link>
                      <div className="mt-3 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                        {pdfGroups.map(({ group, items }) => (
                          <div key={group.key}>
                            <p className="px-2 text-[10.5px] font-bold uppercase tracking-[0.1em] text-subtle">
                              {group.label}
                            </p>
                            <ul className="mt-1">
                              {items.map((tool) => (
                                <li key={tool.slug}>
                                  <Link
                                    href={`/${tool.slug}/`}
                                    className="block rounded-lg px-2 py-1.5 text-[13.5px] font-medium text-body transition-colors hover:bg-brand-50 hover:text-brand-700"
                                  >
                                    {tool.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>

                    {otherCategories.map(({ category, items }) => (
                      <div key={category.slug}>
                        <Link
                          href={`/${category.slug}/`}
                          className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-brand-600 hover:text-brand-700"
                        >
                          <ToolIcon name={category.icon} className="h-4 w-4" />
                          {category.name}
                        </Link>
                        <ul className="mt-3 space-y-1">
                          {items.map((tool) => (
                            <li key={tool.slug}>
                              <Link
                                href={`/${tool.slug}/`}
                                className="block rounded-lg px-2 py-2 text-[13.5px] font-medium text-body transition-colors hover:bg-brand-50 hover:text-brand-700"
                              >
                                {tool.name}
                              </Link>
                            </li>
                          ))}
                          {items.length === 0 && (
                            <li className="px-2 py-2 text-[13px] text-subtle">More tools are on the way.</li>
                          )}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-line bg-surface">
                  <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3 text-[13.5px]">
                    <p className="text-subtle">
                      {tools.length} tools live now · every one runs in your browser
                    </p>
                    <Link href="/tools/" className="font-semibold text-brand-600 hover:text-brand-700">
                      Browse with search and filters →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {primaryNav.slice(1).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[40px] items-center rounded-lg px-3 text-[14.5px] font-semibold transition-colors hover:bg-surface hover:text-ink",
                pathname.startsWith(item.href) ? "text-ink" : "text-body",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex min-h-[40px] items-center gap-2 rounded-xl border border-line bg-white px-3 text-[14px] text-subtle transition-colors hover:border-brand-200 hover:text-ink"
            aria-label="Search tools"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Search tools</span>
            <kbd className="hidden rounded border border-line bg-surface px-1.5 py-0.5 text-[11px] font-semibold text-subtle md:inline">
              ⌘K
            </kbd>
          </button>

          <Link href="/tools/" className="btn-primary hidden h-10 min-h-[40px] px-4 text-[14px] sm:inline-flex">
            Browse tools
          </Link>

          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-xl border border-line text-ink lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div id="mobile-nav" className="max-h-[calc(100vh-68px)] overflow-y-auto border-t border-line bg-white lg:hidden">
          <div className="container-page py-5">
            <nav aria-label="Mobile" className="grid gap-1">
              {primaryNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-3 text-[15px] font-semibold text-ink hover:bg-surface"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 space-y-5 border-t border-line pt-4">
              {pdfGroups.map(({ group, items }) => (
                <div key={group.key}>
                  <p className="px-3 text-[11.5px] font-bold uppercase tracking-[0.12em] text-brand-600">
                    PDF · {group.label}
                  </p>
                  <ul className="mt-1 grid gap-0.5">
                    {items.map((tool) => (
                      <li key={tool.slug}>
                        <Link href={`/${tool.slug}/`} className="block rounded-lg px-3 py-2.5 text-[14.5px] text-body hover:bg-surface">
                          {tool.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {otherCategories.map(({ category, items }) => (
                <div key={category.slug}>
                  <p className="px-3 text-[11.5px] font-bold uppercase tracking-[0.12em] text-brand-600">
                    {category.name}
                  </p>
                  <ul className="mt-1 grid gap-0.5">
                    {items.map((tool) => (
                      <li key={tool.slug}>
                        <Link href={`/${tool.slug}/`} className="block rounded-lg px-3 py-2.5 text-[14.5px] text-body hover:bg-surface">
                          {tool.name}
                        </Link>
                      </li>
                    ))}
                    {items.length === 0 && (
                      <li className="px-3 py-2 text-[13px] text-subtle">More tools are on the way.</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-5 rounded-xl bg-surface px-3 py-3 text-[13px] text-subtle">
              {SITE_NAME} processes every file on your device. Nothing is uploaded.
            </p>
          </div>
        </div>
      )}

      {searchOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-ink/40 px-4 pt-[12vh] backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={searchId}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSearchOpen(false);
          }}
        >
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-white shadow-lift">
            <h2 id={searchId} className="sr-only">
              Search tools
            </h2>
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="h-4 w-4 text-subtle" aria-hidden="true" />
              <input
                ref={searchInputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={onSearchKeyDown}
                placeholder={`Search ${tools.length} tools — try “compress”, “png”, “heic”…`}
                className="h-14 w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-subtle"
                aria-label="Search tools"
                aria-controls="search-results"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="rounded-md px-2 py-1 text-[11px] font-semibold text-subtle hover:bg-surface hover:text-ink"
              >
                ESC
              </button>
            </div>
            <div id="search-results" className="max-h-[52vh] overflow-y-auto p-2">
              {query.trim() === "" && (
                <p className="px-3 py-6 text-center text-[13.5px] text-subtle">
                  Start typing a task — “merge”, “jpg to png”, “compress to 200kb”.
                </p>
              )}
              {query.trim() !== "" && results.length === 0 && (
                <p className="px-3 py-6 text-center text-[13.5px] text-subtle">
                  No tool matches “{query}”. Try the{" "}
                  <Link href="/tools/" className="link">
                    full tool list
                  </Link>
                  .
                </p>
              )}
              {results.map((entry, index) => (
                <button
                  key={entry.href}
                  type="button"
                  onClick={() => go(entry)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                    index === activeIndex ? "bg-brand-50" : "hover:bg-surface",
                  )}
                >
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-brand-600 ring-1 ring-line">
                    <ToolIcon name={tools.find((tool) => `/${tool.slug}/` === entry.href)?.icon ?? "FileText"} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14.5px] font-semibold text-ink">{entry.title}</span>
                    <span className="block truncate text-[13px] text-subtle">{entry.description}</span>
                  </span>
                  <span className="ml-auto shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-subtle ring-1 ring-line">
                    {entry.group}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
