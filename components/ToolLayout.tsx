import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import type { Tool } from "@/lib/tool-types";
import { breadcrumbJsonLd, faqJsonLd, toolJsonLd, type Crumb } from "@/lib/jsonld";
import { SITE_NAME, SITE_URL } from "@/data/site";
import { toolCount } from "@/data/tools";
import { AdSlot } from "./AdSlot";
import { Breadcrumbs } from "./Breadcrumbs";
import { Disclosure } from "./Disclosure";
import { Faq } from "./Faq";
import { RelatedTools } from "./RelatedTools";
import { StructuredData } from "./StructuredData";
import { ToolIcon } from "./icons";
import { ToolWidget } from "./tools/ToolWidgets";

const TRUST_POINTS = ["Runs in your browser", "No sign-up", "No watermark", "Free"];

/**
 * Tool page shell.
 *
 * Order is deliberate: one line of promise, then the tool itself, then the
 * reading material folded away underneath. Someone who came to convert a file
 * should never have to scroll past an essay to reach the drop zone, and someone
 * who is deciding whether to trust the tool should still find the detail.
 */
export function ToolLayout({ tool, crumbs }: { tool: Tool; crumbs: Crumb[] }) {
  return (
    <>
      <StructuredData data={[breadcrumbJsonLd(crumbs), toolJsonLd(tool), faqJsonLd(tool.faqs)]} />

      <div className="container-page pb-16 pt-5 sm:pt-7">
        <Breadcrumbs crumbs={crumbs} />

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
          <div className="min-w-0">
            <header className="max-w-2xl">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                  <ToolIcon name={tool.icon} className="h-4.5 w-4.5" />
                </span>
                <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-brand-600">
                  Free {tool.category === "image-tools" ? "image" : "PDF"} tool
                </p>
              </div>

              <h1 className="mt-3 text-[28px] font-extrabold leading-[1.14] tracking-[-0.025em] text-ink sm:text-[36px]">
                {tool.h1}
              </h1>
              <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-body">{tool.tagline}</p>

              <ul className="mt-3.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] font-medium text-body">
                {TRUST_POINTS.map((point) => (
                  <li key={point} className="inline-flex items-center gap-1.5">
                    <span className="grid h-4 w-4 place-items-center rounded-full bg-success/10 text-success">
                      <Check className="h-3 w-3" aria-hidden="true" />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </header>

            <div className="mt-5">
              <ToolWidget
                widget={tool.widget}
                presetFormat={tool.preset?.outputFormat}
                conversionLabel={tool.preset?.conversionLabel}
                toolSlug={tool.slug}
                preset={tool.preset}
              />
            </div>

            {/* Ad position 1: after the tool, well clear of the drop zone and the download button. */}
            <AdSlot variant="leaderboard" className="mt-8" />

            <section aria-labelledby="how-to" className="mt-10 scroll-mt-24">
              <h2 id="how-to" className="text-[20px] font-bold tracking-tight text-ink">
                How it works
              </h2>
              <ol className="mt-4 grid gap-3 sm:grid-cols-2">
                {tool.steps.map((step, index) => (
                  <li key={step.title} className="glass-panel p-4">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-50 text-[12.5px] font-bold text-brand-700 ring-1 ring-brand-100">
                      {index + 1}
                    </span>
                    <p className="mt-2.5 text-[14px] font-semibold text-ink">{step.title}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-body">{step.text}</p>
                  </li>
                ))}
              </ol>
            </section>

            <div className="mt-10">
              <h2 className="text-[20px] font-bold tracking-tight text-ink">The details</h2>
              <p className="mt-1 text-[13.5px] text-subtle">
                Everything below is optional reading — open what you need.
              </p>

              <Disclosure
                id="what-it-does"
                title="What this tool does"
                summary={`${tool.bullets.length} things worth knowing before you start`}
              >
                <div className="article">
                  {tool.intro.map((paragraph) => (
                    <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                  ))}
                  <ul>
                    {tool.bullets.map((bullet) => (
                      <li key={bullet.title}>
                        <strong>{bullet.title}.</strong> {bullet.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </Disclosure>

              <Disclosure
                id="formats"
                title="Files it accepts and what comes out"
                summary={`${tool.inputFormats.slice(0, 3).join(", ")} → ${tool.outputFormats.join(", ")}`}
              >
                <div className="article">
                  <div className="overflow-x-auto">
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">{tool.category === "utilities" ? "You provide" : "Accepted input"}</th>
                          <th scope="col">What you get</th>
                          <th scope="col">{tool.category === "utilities" ? "Delivery" : "Batch"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{tool.inputFormats.join(", ")}</td>
                          <td>{tool.outputFormats.join(", ")}</td>
                          <td>
                            {tool.category === "utilities"
                              ? "Copy to the clipboard, or download where it makes sense"
                              : "Multiple files, individual or ZIP download"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </Disclosure>

              <Disclosure
                id="limits"
                title="Limits worth knowing first"
                summary="What this tool honestly cannot do"
              >
                <div className="article">
                  <ul>
                    {tool.limits.map((limit) => (
                      <li key={limit.title}>
                        <strong>{limit.title}.</strong> {limit.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </Disclosure>

              <Disclosure id="tips" title="Practical tips" summary="Small things that make a visible difference">
                <div className="article">
                  <ul>
                    {tool.tips.map((tip) => (
                      <li key={tip.title}>
                        <strong>{tip.title}.</strong> {tip.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </Disclosure>

              <Disclosure
                id="privacy"
                title="Where your files go (nowhere)"
                summary="How the in-browser processing actually works"
              >
                <div className="article">
                  <p>
                    The file picker gives {SITE_NAME} a local reference to your file; it is never copied to a
                    server. All decoding, conversion and writing happens inside this tab using JavaScript and
                    WebAssembly that you downloaded with the page. There is no upload endpoint, no temporary
                    storage bucket and no account that could own a copy.
                  </p>
                  <p>
                    You can check this yourself: open your browser&apos;s developer tools, switch to the Network
                    tab, clear it, then run a conversion. You will see no request carrying your file. Closing the
                    tab deletes the working data from memory, and object URLs created for downloads are revoked
                    when you start over.
                  </p>
                </div>
              </Disclosure>
            </div>

            <AdSlot variant="inline" className="my-10" />

            <Faq items={tool.faqs} />

            <RelatedTools slugs={tool.related} />

            <div className="mt-10 rounded-card border border-line bg-surface p-5">
              <p className="text-[13.5px] leading-relaxed text-body">
                Something not working as described?{" "}
                <Link href="/contact/" className="link">
                  Tell us which file type, browser and step failed
                </Link>{" "}
                — accurate bug reports are how these tools get fixed. This page was last updated on{" "}
                {new Date(tool.updated).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                .
              </p>
            </div>
          </div>

          <aside className="hidden lg:block" aria-label="Tool sidebar">
            <div className="sticky top-[88px] space-y-4">
              <div className="glass-panel p-5 shadow-card">
                <p className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-ink">
                  <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />
                  Private by design
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-body">
                  Your file is opened by this tab and never uploaded. No account, no server copy, and it keeps
                  working with the network switched off.
                </p>
                <Link
                  href="/privacy-policy/"
                  className="mt-2 inline-block text-[12.5px] font-semibold text-brand-600 hover:text-brand-700"
                >
                  Read the privacy policy →
                </Link>
              </div>

              <div className="glass-panel p-5">
                <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-ink">On this page</p>
                <ul className="mt-2 space-y-1.5 text-[13px]">
                  {[
                    { href: "#how-to", label: "How it works" },
                    { href: "#what-it-does", label: "What it does" },
                    { href: "#formats", label: "Formats" },
                    { href: "#limits", label: "Limits" },
                    { href: "#faq", label: "FAQ" },
                  ].map((link) => (
                    <li key={link.href}>
                      <a href={link.href} className="text-body transition-colors hover:text-brand-600">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass-panel p-5">
                <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-ink">All {toolCount} tools</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-body">
                  Every tool on {SITE_NAME} works the same way: pick a file, do the job, download it.
                </p>
                <Link
                  href="/tools/"
                  className="mt-2 inline-block text-[12.5px] font-semibold text-brand-600 hover:text-brand-700"
                >
                  Browse the full list →
                </Link>
              </div>

              {/* Ad position 3: desktop sidebar only. */}
              <AdSlot variant="sidebar" />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
