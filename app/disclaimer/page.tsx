import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, SITE_NAME } from "@/data/site";
import { buildMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = buildMetadata({
  title: "Disclaimer",
  description:
    "What Filecraft's tools can and cannot guarantee: no legal or professional advice, output must be checked, and results vary by browser.",
  path: "/disclaimer/",
});

export default function DisclaimerPage() {
  return (
    <LegalPage
      title="Disclaimer"
      intro={`${SITE_NAME} exists to do a specific, mechanical job: convert, compress or reorganise a file on your device. This page sets out the limits of what that guarantees.`}
      updated="2026-10-27"
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Disclaimer", path: "/disclaimer/" },
      ]}
    >
      <h2>No professional advice</h2>
      <p>
        Nothing on this site is legal, medical, financial, tax or immigration advice. Guides and tool pages explain
        how file formats and upload limits behave; they are general technical information. For a decision that
        matters — a court filing, a visa application, a contract submission — confirm the requirements with the
        receiving organisation and, where appropriate, a qualified professional.
      </p>

      <h2>Check your output before relying on it</h2>
      <p>
        Conversion and compression alter a file. A PDF that looks fine on your screen can lose a signature, a
        barcode or a line of small print when it is rasterised, and a spreadsheet can lose columns when it is
        squeezed onto a page. Always keep the original, open the result in a normal viewer, and inspect the pages
        or fields that matter before sending it anywhere important.
      </p>

      <h2>Upload limits are not ours to set</h2>
      <p>
        When a page mentions a size such as “2 MB” or “200 KB”, that is typical of the portals and mail servers
        people commonly deal with. It is not a guarantee of any particular organisation's current limit, which
        can change without notice. Verify the requirement in the portal or form you are submitting to.
      </p>

      <h2>Browser differences are real</h2>
      <p>
        The tools rely on the browser's own decoders and encoders. Which formats can be written depends on your
        browser and its version: Safari can read AVIF but cannot encode it, older phones may run out of memory on
        large batches, and a browser extension that blocks canvas access can break image export. Each tool page
        names the limitations we know about. If you find one we have not documented, please tell us.
      </p>

      <h2>No guarantee of fitness for a purpose</h2>
      <p>
        The tools are not certified for regulated workflows. Do not use them as the only step in producing a
        document that must comply with a standard (PDF/A archiving, accessibility-tagged PDFs for public-sector
        publishing, print-ready CMYK output). They are everyday utilities, not compliance instruments.
      </p>

      <h2>Third-party content</h2>
      <p>
        Advertisements and links to other sites are provided for convenience. We do not control, verify or endorse
        the products, claims or practices of advertisers or third-party sites, and we are not responsible for their
        content or their handling of your data.
      </p>

      <h2>Accuracy and updates</h2>
      <p>
        We try to keep every page accurate and review it when a tool changes. Software changes quickly, and a page
        can be out of date between reviews. Each tool page shows its last review date. Found an error? Email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we will correct it.
      </p>

      <h2>Related pages</h2>
      <p>
        <Link href="/terms/">Terms of Use</Link> · <Link href="/privacy-policy/">Privacy Policy</Link> ·{" "}
        <Link href="/cookie-policy/">Cookie Policy</Link> · <Link href="/faq/">FAQ</Link>
      </p>
    </LegalPage>
  );
}
