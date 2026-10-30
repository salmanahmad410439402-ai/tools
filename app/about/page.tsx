import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, SITE_NAME } from "@/data/site";
import { tools } from "@/data/tools";
import { roadmap } from "@/data/roadmap";
import { buildMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = buildMetadata({
  title: `About ${SITE_NAME} — Who Runs This Site`,
  description:
    "Who runs Filecraft, how each tool is checked before it goes live, how the site is funded and why every tool runs in your browser instead of on a server.",
  path: "/about/",
});

export default function AboutPage() {
  return (
    <LegalPage
      title={`About ${SITE_NAME}`}
      intro={`${SITE_NAME} is a small independent project that builds free file tools which run entirely inside your browser. This page explains who is behind it, how a tool gets published, and how the site pays for itself.`}
      updated="2026-10-27"
      crumbs={[
        { name: "Home", path: "/" },
        { name: "About", path: "/about/" },
      ]}
    >
      <h2>Who runs this site</h2>
      <p>
        {SITE_NAME} is built and maintained by one person — a front-end developer working alone, not a company
        and not an agency. There is no editorial department, no support desk and no investors: the same person
        designs the pages, writes the code that processes your files, and answers the email.
      </p>
      <p>
        You can reach that person at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Every message is read by a human. Bug reports
        that name the file type, the browser and the step that failed are the most useful thing you can send.
      </p>

      <h2>Why these tools exist</h2>
      <p>
        File conversion has become a toll booth. A typical free converter uploads your document to a server,
        holds the download behind a countdown, stamps a logo on the output, or asks for a card after three
        files. The work itself — merging pages, re-encoding an image, writing a PDF — is something a modern
        browser can do locally in under a second.
      </p>
      <p>
        So the brief for this site is deliberately narrow: do the whole job in the browser, say plainly that the
        file never leaves the device, and write down the limits instead of hiding them. There is no upload
        button anywhere on the site, because there is no server that stores files.
      </p>

      <h2>How a tool gets published</h2>
      <p>
        Every page on this site is honest about one of two states. A tool is either <strong>live</strong> — the
        widget on the page reads your file, processes it in the browser and gives you a download — or it is{" "}
        <strong>planned</strong>, which means the page explains what is coming and there is no widget. The
        count in the header, the cards on the homepage, the category totals and the sitemap are all generated
        from the same list, so those numbers cannot drift apart.
      </p>
      <p>
        Before a tool is marked live, the developer runs it in Chrome and Firefox on desktop and in a mobile
        browser, with a handful of real files: a short PDF, a long one, a large photo, and an image with a
        transparent background where that matters. Error paths are exercised too — a wrong file type, an
        encrypted PDF, a file that is too large for the browser's memory — so a failure produces a sentence you
        can act on rather than a blank screen. This is a single developer checking their own work, not a formal
        QA lab, and the pages are written to say so.
      </p>
      <p>
        Writing the documentation is part of shipping the tool. Each live tool has a page with steps, limits and
        FAQ answers that match what the code actually does, including the jobs it cannot do well — a browser
        cannot reflow a PDF's existing text, OCR on a scan is a guess rather than a transcript, and no tool can
        invent pages that were never written. Today{" "}
        {tools.length} tools are live and {roadmap.length} are on the roadmap; you can see both lists on the{" "}
        <Link href="/tools/">all tools page</Link>.
      </p>

      <h2>How the site is funded</h2>
      <p>
        {SITE_NAME} does not show ads yet. The plan is ordinary display advertising on the pages around the
        tools — never inside a tool, never between a setting and the button that starts the work, and never
        next to a download link. No ads are served until Google has reviewed and approved the site, and the{" "}
        <Link href="/privacy-policy/">Privacy Policy</Link> describes exactly what changes when that happens.
        There is no paid tier, no subscription and no upsell.
      </p>
      <p>
        Until then the site costs one person hosting and a domain, and the tools stay free for everyone,
        including people who cannot or will not pay for software.
      </p>

      <h2>What this site will not build</h2>
      <ul>
        <li>Tools that remove a password or DRM from files you cannot open yourself.</li>
        <li>Tools that download copyrighted media from streaming services.</li>
        <li>Anything that quietly sends a file to a server while claiming to be private.</li>
        <li>Invented testimonials, user counts or star ratings.</li>
      </ul>

      <h2>Corrections</h2>
      <p>
        Pages are updated when the code changes. If you find a sentence that no longer matches what the tool
        does — a format that fails, a limit that is wrong, a claim that reads like marketing — email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and it will be fixed or removed.
      </p>
    </LegalPage>
  );
}
