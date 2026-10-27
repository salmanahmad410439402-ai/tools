import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import type { Tool } from "@/lib/tool-types";
import { breadcrumbJsonLd, faqJsonLd, toolJsonLd, type Crumb } from "@/lib/jsonld";
import { SITE_NAME } from "@/data/site";
import { AdSlot } from "./AdSlot";
import { Breadcrumbs } from "./Breadcrumbs";
import { Faq } from "./Faq";
import { RelatedTools } from "./RelatedTools";
import { StructuredData } from "./StructuredData";
import { ToolWidget } from "./tools/ToolWidgets";

const TRUST_POINTS = ["100% in your browser", "No sign-up", "No watermark", "Free, no limits"];

export function ToolLayout({ tool, crumbs }: { tool: Tool; crumbs: Crumb[] }) {
  return (
    <>
      <StructuredData
        data={[breadcrumbJsonLd(crumbs), toolJsonLd(tool), faqJsonLd(tool.faqs)]}
      />

      <div className="container-page pb-6 pt-6 sm:pt-8">
        <Breadcrumbs crumbs={crumbs} />

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
          <div className="min-w-0">
            <header>
              <h1 className="max-w-3xl text-[30px] font-extrabold leading-[1.15] tracking-[-0.025em] text-ink sm:text-[38px]">
                {tool.h1}
              </h1>
              <div className="mt-3 max-w-2xl space-y-2.5 text-[15.5px] leading-relaxed text-body">
                {tool.intro.map((paragraph) => (
                  <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                ))}
              </div>
              <p className="mt-3 text-[14.5px] font-semibold text-brand-600">
                Runs 100% in your browser — no login, no upload.
              </p>

              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[12.5px] font-medium text-body">
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

            <div className="mt-6">
              <ToolWidget
                widget={tool.widget}
                presetFormat={tool.preset?.outputFormat}
                conversionLabel={tool.preset?.conversionLabel}
                toolSlug={tool.slug}
              />
            </div>

            {/* Ad position 1: directly below the tool, separated by breathing room. */}
            <AdSlot variant="leaderboard" className="mt-8" />

            <div className="article mt-10 max-w-prose">
              <h2 id="what-it-does" className="scroll-mt-24">
                What this free tool does
              </h2>
              <ul className="!mt-4">
                {tool.bullets.map((bullet) => (
                  <li key={bullet.title}>
                    <strong>{bullet.title}.</strong> {bullet.text}
                  </li>
                ))}
              </ul>

              <h2 id="how-to" className="scroll-mt-24">
                How to {tool.name.toLowerCase()} step by step
              </h2>
              <ol className="!mt-4">
                {tool.steps.map((step) => (
                  <li key={step.title}>
                    <strong>{step.title}.</strong> {step.text}
                  </li>
                ))}
              </ol>

              <h2 id="formats" className="scroll-mt-24">
                Supported formats and what comes out
              </h2>
              <div className="!mt-4 overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Accepted input</th>
                      <th scope="col">Output</th>
                      <th scope="col">Batch</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{tool.inputFormats.join(", ")}</td>
                      <td>{tool.outputFormats.join(", ")}</td>
                      <td>Yes — multiple files, individual or ZIP download</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h2 id="limits" className="scroll-mt-24">
                Limits worth knowing before you start
              </h2>
              <ul className="!mt-4">
                {tool.limits.map((limit) => (
                  <li key={limit.title}>
                    <strong>{limit.title}.</strong> {limit.text}
                  </li>
                ))}
              </ul>

              <h2 id="privacy" className="scroll-mt-24">
                Where your files go (nowhere)
              </h2>
              <p>
                The file picker hands {SITE_NAME} a local reference to your file; it is never copied to a
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

              <AdSlot variant="inline" className="my-10" />

              <h2 id="tips" className="scroll-mt-24">
                Practical tips from real use
              </h2>
              <ul className="!mt-4">
                {tool.tips.map((tip) => (
                  <li key={tip.title}>
                    <strong>{tip.title}.</strong> {tip.text}
                  </li>
                ))}
              </ul>
            </div>

            <Faq items={tool.faqs} />

            <RelatedTools slugs={tool.related} />

            <div className="mt-10 rounded-card border border-line bg-surface p-5">
              <p className="text-[13.5px] leading-relaxed text-body">
                Something not working as described?{" "}
                <Link href="/contact/" className="link">
                  Tell us what file type, browser and step failed
                </Link>{" "}
                — accurate bug reports are how these tools stay reliable. This page was last reviewed on{" "}
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
              <div className="rounded-card border border-line bg-white p-5 shadow-card">
                <p className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-ink">
                  <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />
                  Privacy
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-body">
                  Your file stays on your device. No upload, no account, no server-side copy. Works
                  offline once the page has loaded.
                </p>
                <Link href="/privacy-policy/" className="mt-2 inline-block text-[12.5px] font-semibold text-brand-600 hover:text-brand-700">
                  Read the privacy policy →
                </Link>
              </div>

              <div className="rounded-card border border-line bg-white p-5">
                <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-ink">Jump to</p>
                <ul className="mt-2 space-y-1.5 text-[13px]">
                  {[
                    { href: "#what-it-does", label: "What this tool does" },
                    { href: "#how-to", label: "How to use it" },
                    { href: "#limits", label: "Limits" },
                    { href: "#privacy", label: "Privacy" },
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

              {/* Ad position 3: desktop sidebar only, sticky inside the sidebar. */}
              <AdSlot variant="sidebar" />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
