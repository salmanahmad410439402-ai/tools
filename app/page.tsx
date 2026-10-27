import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Check,
  ChevronRight,
  FileText,
  Lock,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { CATEGORIES, SITE_NAME, TAGLINE } from "@/data/site";
import { toolsForCategory, popularTools, toolCount, tools } from "@/data/tools";
import { roadmap } from "@/data/roadmap";
import { guides } from "@/data/guides";
import { buildMetadata } from "@/lib/seo";
import { faqJsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/jsonld";
import { StructuredData } from "@/components/StructuredData";
import { ToolCard } from "@/components/ToolCard";
import { ToolIcon } from "@/components/icons";
import { Faq } from "@/components/Faq";
import { AdSlot } from "@/components/AdSlot";

export const metadata: Metadata = buildMetadata({
  title: `${SITE_NAME} — Free PDF & Image Tools, No Upload`,
  description:
    "Merge, compress and convert PDFs and images free in your browser. No uploads, no sign-up, no watermark — your files never leave your device.",
  path: "/",
});

const FACTS = [
  { value: `${toolCount}`, label: "tools live today", detail: "Each one works in your browser" },
  { value: "0", label: "files uploaded", detail: "Processing happens in your tab" },
  { value: "0", label: "accounts needed", detail: "No email, no login, no paywall" },
  { value: "100%", label: "browser-based", detail: "Works offline after the page loads" },
];

/**
 * The home page shows a curated set, not all of them: the point of the section
 * is to get someone to the right tool quickly, and 33 cards is a wall.
 */
const featuredTools = popularTools.slice(0, 8);
const newestTools = tools.filter((tool) => tool.isNew).slice(0, 5);

const STEPS = [
  {
    title: "Pick the tool for the job",
    text: "Search by task — “compress”, “jpg to png”, “heic” — or browse by category. Each tool page states exactly what it can and cannot do before you choose a file.",
  },
  {
    title: "Open your file locally",
    text: "Drag it onto the dropzone, click to browse or paste it. Your browser reads the file from your disk; nothing is uploaded and there is no queue to wait in.",
  },
  {
    title: "Set the few options that matter",
    text: "A page size, a quality level, a target size. The defaults are chosen for the common case, so most people finish without touching anything.",
  },
  {
    title: "Download the result",
    text: "You get the finished file with its real size, and how much it changed. Download individually or everything as a ZIP, then close the tab — the working data goes with it.",
  },
];

const HIGHLIGHTS = [
  {
    icon: ShieldCheck,
    title: "Private by construction",
    text: "There is no upload endpoint to trust. Files are decoded with the browser's own APIs and written back in the same tab.",
  },
  {
    icon: Zap,
    title: "No queue, no daily limit",
    text: "Server-based converters meter you because every file costs them money. Yours costs nothing extra, so there is nothing to meter.",
  },
  {
    icon: FileText,
    title: "Honest about limits",
    text: "When a browser cannot do something well — true text reflow in an editor, for example — the page says so instead of quietly producing a worse file.",
  },
  {
    icon: Lock,
    title: "No watermark, no sign-up",
    text: "Nothing is stamped on your output and no account is created. Free tools should not need a marketing funnel to work.",
  },
];

const CONVERSIONS: { from: string; to: string; href: string; tool: string; note: string }[] = [
  { from: "JPG", to: "PNG", href: "/jpg-to-png/", tool: "JPG to PNG", note: "Lossless output, keeps every pixel" },
  { from: "Photos", to: "PDF", href: "/image-to-pdf/", tool: "Image to PDF", note: "One A4 PDF from many photos" },
  { from: "PDF", to: "Smaller PDF", href: "/compress-pdf/", tool: "Compress PDF", note: "Hit 200 KB, 500 KB or 2 MB" },
  { from: "HEIC", to: "JPG", href: "/image-converter/", tool: "Image Converter", note: "iPhone photos, decoded locally" },
  { from: "PNG", to: "WebP", href: "/image-converter/", tool: "Image Converter", note: "25–35% smaller for websites" },
  { from: "WebP", to: "JPG", href: "/image-converter/", tool: "Image Converter", note: "For apps that still reject WebP" },
];

const HOME_FAQ = [
  {
    q: "Are my files really never uploaded?",
    a: "Correct. The tools use the browser's File API to read your file from disk and process it in memory. There is no server endpoint that accepts file data, and you can confirm this in your browser's Network tab. The site works with the internet disconnected once the page has loaded.",
  },
  {
    q: "Is it genuinely free, or free until I need the result?",
    a: "Genuinely free. No watermark, no export paywall, no sign-up and no daily quota. The tools are funded by advertising on the pages around them, not by holding your file hostage.",
  },
  {
    q: "Which browser do I need?",
    a: "Any current version of Chrome, Edge, Firefox or Safari, on desktop or mobile. Some encoding formats depend on the browser: Safari can read AVIF but cannot write it, for example, and each tool page tells you when that applies.",
  },
  {
    q: "How large can my files be?",
    a: "It depends on your device rather than on us. Files under 25 MB are comfortable on a phone; a desktop with 8 GB of RAM handles documents and images well above 100 MB. The tools warn you before they start if a batch looks heavy.",
  },
  {
    q: "Do you keep copies of anything?",
    a: "No. There is no file storage, no temporary bucket and no account. Downloads are generated with in-memory object URLs that are released when you start over or leave the page.",
  },
];

export default function HomePage() {
  return (
    <>
      <StructuredData data={[websiteJsonLd(), organizationJsonLd(), faqJsonLd(HOME_FAQ)]} />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-brand-50/70 via-page to-page">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-32 h-[380px] w-[380px] rounded-full bg-brand-100/60 blur-3xl"
        />
        <div className="container-page relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div>
            <p className="eyebrow">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              No upload · No sign-up · No watermark
            </p>
            <h1 className="mt-4 max-w-2xl text-[34px] font-extrabold leading-[1.08] tracking-[-0.03em] text-ink sm:text-[46px] lg:text-[52px]">
              Free PDF &amp; image tools that run{" "}
              <span className="relative whitespace-nowrap text-brand-600">
                privately
                <svg
                  className="absolute -bottom-1 left-0 h-[8px] w-full text-brand-200"
                  viewBox="0 0 200 8"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M2 6c40-4 90-5 196-2" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>{" "}
              in your browser
            </h1>
            <p className="mt-5 max-w-xl text-[16.5px] leading-relaxed text-body sm:text-[17.5px]">
              Compress, merge and convert PDFs, and change image formats or sizes — all on your own device.
              Nothing is uploaded, so there is no waiting, no account and no copy of your file anywhere but
              here.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/compress-pdf/" className="btn-primary h-12 px-6 text-[15px]">
                Compress a PDF free
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/tools/" className="btn-secondary h-12 px-6 text-[15px]">
                Browse all {toolCount} tools
              </Link>
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-medium text-body">
              {["Files stay on your device", "No account needed", "No watermark", "Free, no limits"].map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5">
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-success/10 text-success">
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* CSS-only product mock: no image request, so the LCP stays fast. */}
          <div className="relative">
            <div className="rounded-[22px] border border-line bg-raised p-4 shadow-lift sm:p-5">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <p className="text-[13px] font-bold text-ink">Compress PDF</p>
                <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-success">
                  In browser
                </span>
              </div>
              <div className="mt-3 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/60 px-4 py-6 text-center">
                <p className="text-[13.5px] font-semibold text-ink">report-2026.pdf</p>
                <p className="mt-1 text-[11.5px] text-subtle">3 pages · 12.4 MB</p>
                <div className="mx-auto mt-3 h-1.5 w-32 overflow-hidden rounded-full bg-raised">
                  <div className="h-full w-4/5 rounded-full bg-brand-500" />
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Before", value: "12.4 MB" },
                  { label: "After", value: "1.8 MB" },
                  { label: "Saved", value: "85%" },
                ].map((stat, index) => (
                  <div key={stat.label} className="rounded-lg bg-surface px-2 py-2">
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-subtle">{stat.label}</dt>
                    <dd className={index === 2 ? "text-[14px] font-bold text-success" : "text-[14px] font-bold text-ink"}>
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-subtle">
                <Lock className="h-3 w-3" aria-hidden="true" />
                Example result — no file leaves your device
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Facts strip ──────────────────────────────────────────────────── */}
      <section aria-label="Site facts" className="border-b border-line bg-raised">
        <div className="container-page grid grid-cols-2 divide-line py-6 sm:grid-cols-4 sm:divide-x">
          {FACTS.map((fact) => (
            <div key={fact.label} className="px-2 py-3 text-center sm:px-4">
              <p className="text-[26px] font-extrabold tracking-tight text-ink">{fact.value}</p>
              <p className="text-[12.5px] font-semibold text-body">{fact.label}</p>
              <p className="mt-0.5 text-[11.5px] text-subtle">{fact.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Which tool ───────────────────────────────────────────────────── */}
      <section className="container-page py-14 sm:py-16" aria-labelledby="which-tool">
        <div className="max-w-2xl">
          <p className="eyebrow">Start here</p>
          <h2 id="which-tool" className="mt-3 text-[28px] font-extrabold tracking-[-0.02em] text-ink sm:text-[34px]">
            Which tool do you need?
          </h2>
          <p className="mt-3 text-[15.5px] leading-relaxed text-body">
            {toolCount} tools are live today, each documented with its real limits. These cover the everyday
            jobs — combine, shrink, convert, sign — and the full list is one click away.
          </p>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>

        <div className="mt-6">
          <Link
            href="/tools/"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-line bg-raised px-4 text-[13.5px] font-semibold text-ink transition-colors hover:border-brand-200 hover:bg-brand-50/40"
          >
            See all {toolCount} tools
            <ArrowRight className="h-4 w-4 text-brand-600" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((category) => {
            const count = toolsForCategory(category.slug).length;
            const planned = roadmap.filter((item) => item.category === category.slug).length;
            return (
              <Link
                key={category.slug}
                href={`/${category.slug}/`}
                className="group flex items-center gap-3 rounded-xl border border-line bg-raised px-4 py-3 transition-colors hover:border-brand-200 hover:bg-brand-50/40"
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface text-brand-600 ring-1 ring-line">
                  <ToolIcon name={category.icon} className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold text-ink">{category.name}</span>
                  <span className="text-[11.5px] text-subtle">
                    {count > 0
                      ? `${count} tool${count === 1 ? "" : "s"}`
                      : planned > 0
                        ? `${planned} planned`
                        : "Coming later"}
                  </span>
                </span>
                <ChevronRight className="ml-auto h-4 w-4 text-subtle transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="border-y border-line bg-surface" aria-labelledby="how-it-works">
        <div className="container-page py-14 sm:py-16">
          <div className="max-w-2xl">
            <p className="eyebrow">How it works</p>
            <h2 id="how-it-works" className="mt-3 text-[28px] font-extrabold tracking-[-0.02em] text-ink sm:text-[34px]">
              Four steps, usually under 30 seconds
            </h2>
            <p className="mt-3 text-[15.5px] leading-relaxed text-body">
              There is no sign-up gate and no upload progress bar to watch. The only thing that takes time is
              the actual work on your file.
            </p>
          </div>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-card border border-line bg-raised p-5">
                <span className="inline-grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-[14px] font-bold text-brand-600">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-[15.5px] font-bold text-ink">{step.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-body">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Highlights ───────────────────────────────────────────────────── */}
      <section className="container-page py-14 sm:py-16" aria-labelledby="why-here">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="eyebrow">Why these tools exist</p>
            <h2 id="why-here" className="mt-3 text-[28px] font-extrabold tracking-[-0.02em] text-ink sm:text-[34px]">
              Built the way file tools should be
            </h2>
            <p className="mt-3 text-[15.5px] leading-relaxed text-body">
              Most “free” converters are free because you pay with something else: a mandatory account, a
              watermark, a 30-minute upload queue or a copy of your document on a machine you will never see.
              Browsers can do this work now, so all four of those costs are unnecessary.
            </p>
            <p className="mt-3 text-[15.5px] leading-relaxed text-body">
              {SITE_NAME} is a one-person project: every tool page is written by hand, checked in a real browser
              before it goes live, and kept honest about what a browser can and cannot do.
            </p>
            <Link href="/about/" className="btn-secondary mt-6">
              About {SITE_NAME}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {HIGHLIGHTS.map((highlight) => (
              <div key={highlight.title} className="rounded-card border border-line bg-raised p-5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600">
                  <highlight.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-[15px] font-bold text-ink">{highlight.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-body">{highlight.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AdSlot variant="leaderboard" className="container-page" />

      {/* ── Popular conversions ──────────────────────────────────────────── */}
      <section className="container-page py-14 sm:py-16" aria-labelledby="popular-conversions">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="eyebrow">Popular conversions</p>
            <h2 id="popular-conversions" className="mt-3 text-[28px] font-extrabold tracking-[-0.02em] text-ink sm:text-[34px]">
              The jobs people actually come here for
            </h2>
          </div>
          <Link href="/tools/" className="text-[14px] font-semibold text-brand-600 hover:text-brand-700">
            See every conversion →
          </Link>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CONVERSIONS.map((conversion) => (
            <Link
              key={`${conversion.from}-${conversion.to}`}
              href={conversion.href}
              className="group rounded-card border border-line bg-raised p-4 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
            >
              <p className="flex items-center gap-1.5 text-[14.5px] font-bold text-ink">
                {conversion.from}
                <ArrowRight className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
                {conversion.to}
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-subtle">{conversion.note}</p>
              <p className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-semibold text-brand-600">
                via {conversion.tool}
                <ChevronRight className="h-3 w-3" aria-hidden="true" />
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Latest guides (hidden until the first guide exists) ──────────── */}
      {guides.length > 0 && (
        <section className="container-page pb-14" aria-labelledby="latest-guides">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <p className="eyebrow">Latest guides</p>
              <h2 id="latest-guides" className="mt-3 text-[28px] font-extrabold tracking-[-0.02em] text-ink sm:text-[34px]">
                Practical writing about files
              </h2>
            </div>
            <Link href="/blog/" className="text-[14px] font-semibold text-brand-600 hover:text-brand-700">
              All guides →
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guides.slice(0, 3).map((guide) => (
              <Link
                key={guide.slug}
                href={`/blog/${guide.slug}/`}
                className="rounded-card border border-line bg-raised p-5 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
              >
                <p className="text-[11.5px] font-semibold uppercase tracking-wide text-subtle">
                  {guide.readingMinutes} min read
                </p>
                <h3 className="mt-2 text-[15.5px] font-bold leading-snug text-ink">{guide.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-body">{guide.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Popular tools + FAQ ──────────────────────────────────────────── */}
      <section className="border-t border-line bg-surface" aria-labelledby="faq-home">
        <div className="container-page grid gap-10 py-14 sm:py-16 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="eyebrow">New in this release</p>
            <h2 className="mt-3 text-[24px] font-extrabold tracking-[-0.02em] text-ink sm:text-[28px]">
              Recently added tools
            </h2>
            <ul className="mt-4 divide-y divide-line overflow-hidden rounded-card border border-line bg-raised">
              {newestTools.map((tool) => (
                <li key={tool.slug}>
                  <Link href={`/${tool.slug}/`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-brand-50/50">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                      <ToolIcon name={tool.icon} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-semibold text-ink">{tool.name}</span>
                      <span className="block truncate text-[12px] text-subtle">{tool.tagline}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-subtle" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12px] text-subtle">
              Straight from the tool registry in shipping order — no invented popularity numbers.
            </p>
          </div>

          <div>
            <p className="eyebrow">Quick answers</p>
            <h2 id="faq-home" className="mt-3 text-[24px] font-extrabold tracking-[-0.02em] text-ink sm:text-[28px]">
              Questions people ask first
            </h2>
            <div className="mt-4 divide-y divide-line overflow-hidden rounded-card border border-line bg-raised">
              {HOME_FAQ.slice(0, 4).map((item) => (
                <details key={item.q} className="group">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 text-[15px] font-semibold text-ink marker:hidden [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-subtle transition-transform group-open:rotate-90" aria-hidden="true" />
                  </summary>
                  <div className="px-5 pb-4 text-[14px] leading-relaxed text-body">{item.a}</div>
                </details>
              ))}
            </div>
            <Link href="/faq/" className="mt-4 inline-flex items-center gap-1 text-[14px] font-semibold text-brand-600 hover:text-brand-700">
              Read the full FAQ
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Closing links ────────────────────────────────────────────────── */}
      <section className="container-page py-14">
        <div className="rounded-[22px] border border-brand-100 bg-brand-50/60 p-6 sm:p-10">
          <div className="max-w-2xl">
            <h2 className="text-[24px] font-extrabold tracking-[-0.02em] text-ink sm:text-[28px]">
              Pick a tool and finish the job
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-body">
              No account, no upload, no watermark. If something does not work on your file, tell us — the
              contact form reaches a real inbox.
            </p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/tools/", label: "All tools", detail: "Search and filter everything" },
              { href: "/pdf-tools/", label: "PDF tools", detail: "Compress, merge, split, edit" },
              { href: "/image-tools/", label: "Image tools", detail: "Convert, resize, compress" },
              { href: "/contact/", label: "Contact", detail: "Bugs, questions, requests" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group rounded-xl border border-line bg-raised px-4 py-3 transition-colors hover:border-brand-300"
              >
                <span className="flex items-center justify-between text-[14px] font-semibold text-ink">
                  {link.label}
                  <ArrowRight className="h-3.5 w-3.5 text-brand-500 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
                <span className="mt-0.5 block text-[12px] text-subtle">{link.detail}</span>
              </Link>
            ))}
          </div>
        </div>
        <p className="mt-6 text-center text-[12.5px] text-subtle">
          {SITE_NAME} · {TAGLINE} ·{" "}
          {/* Relative link: the exported sitemap is served from this origin. */}
          <Link href="/sitemap.xml" prefetch={false} className="hover:text-brand-600">
            Sitemap
          </Link>
        </p>
      </section>
    </>
  );
}
