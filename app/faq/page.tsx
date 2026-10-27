import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/data/site";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/jsonld";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredData } from "@/components/StructuredData";
import { Faq } from "@/components/Faq";

const GROUPS: { heading: string; items: { q: string; a: string }[] }[] = [
  {
    heading: "Privacy and files",
    items: [
      {
        q: "Are my files uploaded anywhere?",
        a: "No. The tools read files through the browser's File API, process them in memory in the current tab and hand the result back as a download. There is no upload endpoint on this site. You can verify it in the Network tab of your browser's developer tools while a tool runs — no request carries your file.",
      },
      {
        q: "Do the tools work offline?",
        a: "Yes, once the page has loaded. Everything the tools need — JavaScript, the PDF engine, the image codecs — arrives with the page. Turn off Wi-Fi and a loaded tool still converts files.",
      },
      {
        q: "What happens to my file when I close the tab?",
        a: "It is discarded. Nothing is stored in your browser and nothing was stored on a server. Download links are in-memory object URLs and are released when you press “Process another file” or leave the page.",
      },
      {
        q: "Do you keep logs of the files I process?",
        a: "There is nothing to log — the server never sees a file. Aggregate, cookie-free analytics may count that a tool was used and whether it succeeded, with no file names, no content and no identifiers.",
      },
      {
        q: "Can I use these tools on a work laptop with upload restrictions?",
        a: "Usually yes, which is one of the reasons local processing matters. Upload-blocking proxies have nothing to block here, because the tool never sends the file. Your organisation's rules still apply to what you do with the output.",
      },
    ],
  },
  {
    heading: "Cost, accounts and limits",
    items: [
      {
        q: "Is everything really free?",
        a: "Yes. No account, no subscription, no watermark, no daily quota and no per-file charge. The site is funded by display advertising on the pages around the tools.",
      },
      {
        q: "Do I need to create an account?",
        a: "No, and there is no account system at all. Nothing can be tied to your email address because we never ask for it.",
      },
      {
        q: "Is there a maximum file size?",
        a: "There is no limit imposed by the site, but your device sets a practical ceiling. Files under 25 MB are comfortable on a phone; a desktop handles 100 MB documents and large photo batches. Tools warn you before starting if a batch looks heavy.",
      },
      {
        q: "How many files can I process at once?",
        a: "As many as your memory allows. Batches are processed one file at a time so the page stays responsive, and results can be downloaded individually or as a single ZIP.",
      },
      {
        q: "Does the output have a watermark?",
        a: "Never. There is no branding added to any file, and no “upgrade to remove watermark” step.",
      },
    ],
  },
  {
    heading: "The tools themselves",
    items: [
      {
        q: "Why is the text in my compressed PDF not selectable?",
        a: "You used the Strong level, which renders each page as an image to make the file as small as possible. Use Light or Recommended to keep text selectable — those levels recompress images and clean the file structure without touching the text layer.",
      },
      {
        q: "Can a browser tool edit existing PDF text?",
        a: "No, and any browser-based tool claiming otherwise is either converting the page to an image or re-running OCR. A PDF stores glyphs at fixed positions, not paragraphs. Our editor adds text boxes, shapes, highlights and signatures on top of a page — it does not reflow the original text.",
      },
      {
        q: "Which browser do you recommend?",
        a: "Any current version of Chrome, Edge, Firefox or Safari. Chrome and Edge encode AVIF; Safari can read AVIF but not write it. HEIC decoding is bundled, so iPhone photos work everywhere.",
      },
      {
        q: "Why did my file get bigger after converting?",
        a: "Some conversions are inherently lossless and therefore larger: JPG to PNG, or converting photos to uncompressed TIFF and BMP. The result card always shows the real before and after size so nothing is hidden.",
      },
      {
        q: "Can I use the output commercially?",
        a: "Yes. Your files remain yours, and nothing is added to them. We claim no rights over anything you process.",
      },
      {
        q: "Something failed on my file. What do I do?",
        a: "Note the file type, size, browser and the exact error text, then email us. Common causes are a corrupted download, a password-protected file or an unusual variant of a format — all three are fixable once we know which one it is.",
      },
    ],
  },
  {
    heading: "Advertising and cookies",
    items: [
      {
        q: "Why are there ads on the site?",
        a: "Because the tools are free and have to be paid for somehow. Ads sit around the tools, never inside them, never between your settings and the main button and never beside a download link.",
      },
      {
        q: "Do ads use cookies?",
        a: "Google AdSense may use cookies to serve and measure ads, but only after the applicable consent. Visitors in the EEA, UK and Switzerland see Google's certified consent message before any ad cookie is set. See the Cookie Policy for details and controls.",
      },
      {
        q: "Do the tools work if I block ads and trackers?",
        a: "Yes, completely. The tools do not depend on advertising code. Nothing is degraded and no message nags you to disable your blocker.",
      },
      {
        q: "Do you use Google Analytics?",
        a: "No. Any analytics used here is cookie-free and aggregate, and it is off by default in the current build.",
      },
    ],
  },
];

const allItems = GROUPS.flatMap((group) => group.items);

export const metadata: Metadata = buildMetadata({
  title: "Frequently Asked Questions",
  description:
    "Answers about privacy, file limits, pricing, browser support and what a browser-based PDF or image tool can and cannot do.",
  path: "/faq/",
});

export default function FaqPage() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "FAQ", path: "/faq/" },
  ];

  return (
    <>
      <StructuredData data={[breadcrumbJsonLd(crumbs), faqJsonLd(allItems)]} />
      <div className="container-page pb-16 pt-6 sm:pt-8">
        <Breadcrumbs crumbs={crumbs} />
        <header className="max-w-3xl">
          <h1 className="text-[30px] font-extrabold leading-[1.12] tracking-[-0.025em] text-ink sm:text-[40px]">
            Frequently asked questions
          </h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-body">
            {allItems.length} answers about privacy, limits, pricing, browser support and the honest gaps in what a
            browser can do. If your question is not here,{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="link">
              email us
            </a>{" "}
            — the answer often becomes a new entry.
          </p>
          <nav aria-label="FAQ sections" className="mt-5 flex flex-wrap gap-2">
            {GROUPS.map((group) => (
              <a
                key={group.heading}
                href={`#${group.heading.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                className="inline-flex min-h-[36px] items-center rounded-full border border-line bg-raised px-3 text-[12.5px] font-medium text-body transition-colors hover:border-brand-200 hover:text-brand-600"
              >
                {group.heading}
              </a>
            ))}
          </nav>
        </header>

        <div className="max-w-prose">
          {GROUPS.map((group) => (
            <div key={group.heading} id={group.heading.toLowerCase().replace(/[^a-z]+/g, "-")} className="scroll-mt-24">
              <Faq items={group.items} id={group.heading.toLowerCase().replace(/[^a-z]+/g, "-")} heading={group.heading} />
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-card border border-line bg-surface p-6">
          <h2 className="text-[18px] font-bold text-ink">Still stuck?</h2>
          <p className="mt-2 max-w-prose text-[14px] leading-relaxed text-body">
            Tell us the tool, the file type, your browser and the exact error, and we will look at it.{" "}
            <Link href="/contact/" className="link">
              Contact page
            </Link>{" "}
            ·{" "}
            <Link href="/tools/" className="link">
              All tools
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
