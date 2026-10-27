import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, SITE_NAME, SITE_URL } from "@/data/site";
import { buildMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Use",
  description:
    "The rules for using Filecraft: acceptable use, no warranty, ownership of your files, liability limits and how changes are handled.",
  path: "/terms/",
});

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      intro={`These terms apply to ${SITE_NAME} at ${SITE_URL}. By using the site you accept them. They are written to be readable rather than impressive, and they do not take away rights you have under the law where you live.`}
      updated="2026-10-27"
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Terms of Use", path: "/terms/" },
      ]}
    >
      <h2>1. The service</h2>
      <p>
        {SITE_NAME} provides free browser-based file tools. The tools run on your own device: no file is uploaded
        and no account is created. There is no paid tier, no service-level agreement and no guarantee of
        availability.
      </p>

      <h2>2. Acceptable use</h2>
      <p>You agree not to use the site to:</p>
      <ul>
        <li>process files you have no legal right to use, or to remove protection from files you do not own;</li>
        <li>infringe copyright, trademarks, privacy or other rights of any person;</li>
        <li>produce or distribute unlawful material, including material that harms children;</li>
        <li>attempt to break, overload, scrape aggressively or reverse-engineer the site's infrastructure;</li>
        <li>misrepresent output produced with these tools as certified, notarised or legally authenticated.</li>
      </ul>
      <p>
        Tools offered here that involve passwords are limited by design: no tool will open, decrypt or unlock a
        file unless you supply the correct password yourself, and none will bypass DRM.
      </p>

      <h2>3. Your files remain yours</h2>
      <p>
        We claim no ownership, licence or rights over any file you process. Because processing happens locally,
        we never receive your content at all. You are solely responsible for the files you choose to open and for
        what you do with the results.
      </p>

      <h2>4. No warranty</h2>
      <p>
        The tools are provided “as is” and “as available”, without warranties of any kind, express or implied,
        including fitness for a particular purpose, accuracy or non-infringement. Conversion, compression and
        editing can change a file irreversibly. Always keep your original file, and check any result before you
        rely on it — especially before sending it to a court, an employer, a landlord or a government portal.
      </p>

      <h2>5. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, {SITE_NAME} and the people who run it are not liable for any
        indirect, incidental, special or consequential loss, or for lost data, lost profits, missed deadlines or
        rejected submissions arising from use of the site. Where liability cannot be excluded, it is limited to
        the amount you paid to use the service, which is zero.
      </p>
      <p>
        Nothing in these terms limits liability that cannot be limited by law, including for death or personal
        injury caused by negligence, or for fraud.
      </p>

      <h2>6. Availability and changes</h2>
      <p>
        Tools may be added, changed, moved or withdrawn at any time without notice. The site is static and served
        from a content delivery network, but outages, browser updates and third-party service failures still
        happen. No tool is guaranteed to remain online.
      </p>

      <h2>7. Advertising and third-party links</h2>
      <p>
        The site displays advertising, including Google AdSense, and links to external resources. Ads and external
        sites are not endorsements. Your dealings with any advertiser are between you and them; see the{" "}
        <Link href="/privacy-policy/">Privacy Policy</Link> and <Link href="/cookie-policy/">Cookie Policy</Link>{" "}
        for what those services receive.
      </p>

      <h2>8. Intellectual property of the site</h2>
      <p>
        The site's own text, layout, design and code are protected by copyright and may not be republished in
        bulk, resold, or scraped to build a competing service. You may quote short passages with a link back to
        the page you took them from. Open-source libraries used by the tools remain under their own licences,
        which are listed in the project repository.
      </p>

      <h2>9. Changes to these terms</h2>
      <p>
        These terms may be updated as the site changes. The revised version takes effect when published on this
        page with a new “last updated” date. If you do not agree with a change, stop using the site.
      </p>

      <h2>10. Governing law and contact</h2>
      <p>
        These terms are governed by the laws applicable where the site operator is established, without prejudice
        to mandatory consumer protections in your own country of residence. Questions:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
