import type { Metadata } from "next";
import Link from "next/link";
import { ADSENSE_PUBLISHER_ID, CONTACT_EMAIL, SITE_NAME, SITE_URL } from "@/data/site";
import { buildMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "How Filecraft handles your files, what Google AdSense receives, which cookies exist, your GDPR and CCPA rights, and how to contact us.",
  path: "/privacy-policy/",
});

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={`This policy explains what ${SITE_NAME} does and does not collect, what happens to files you open, and which third parties are involved. The short version: your files never leave your device, and we hold no personal data about you unless you email us.`}
      updated="2026-10-27"
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Privacy Policy", path: "/privacy-policy/" },
      ]}
    >
      <h2>1. Who is responsible</h2>
      <p>
        {SITE_NAME} ({SITE_URL}) is a website operated by an independent team. For any privacy question or
        request, contact <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. There is no separate data
        protection officer because the site does not run a business that requires one; the people who run the
        site answer privacy emails themselves.
      </p>

      <h2>2. Your files are never uploaded</h2>
      <p>
        Every tool on this site processes files in your browser. When you choose a file, the browser gives the
        page a local reference to it; the contents are read into memory in that tab and are never transmitted to
        us or to anyone else. There is no upload endpoint, no file storage, no database and no queue on a server.
      </p>
      <p>
        When you close the tab, the working data in memory is released. Download links are created in memory for
        the current session only. Because no file ever reaches a server, we cannot access, inspect, retain or
        recover your documents — and neither can anyone who compromises the site, which is the point.
      </p>
      <p>
        You can verify this yourself: open your browser's developer tools, select the Network tab, clear it and
        run any tool. No request carries your file. The tools continue to work with the network disconnected
        after the page has loaded.
      </p>

      <h2>3. What we do collect</h2>
      <p>
        The site itself does not set accounts, collect names, ask for email addresses or store documents. What
        remains is ordinary technical data created by any web request:
      </p>
      <ul>
        <li>
          <strong>Server and CDN logs.</strong> Our static host records the IP address, user agent, requested URL,
          timestamp and response status for each request. These logs are used for security and to diagnose
          outages, and are retained for a short period (typically up to 30 days) before being deleted.
        </li>
        <li>
          <strong>Local browser storage.</strong> One small preference — whether you dismissed the cookie notice
          — is stored in your browser's localStorage. It is not a cookie, is not shared and never leaves your
          device. Clearing site data removes it.
        </li>
        <li>
          <strong>Emails you send us.</strong> If you email {CONTACT_EMAIL}, we receive your address, your message
          and anything you choose to include. We keep it only as long as needed to answer and to track a
          confirmed bug, then delete it.
        </li>
      </ul>

      <h2>4. Advertising and Google AdSense</h2>
      <p>
        This site is supported by advertising served by Google. Google is a third-party vendor and uses cookies
        to serve ads based on your prior visits to this and other websites. The AdSense publisher account used
        here is <code>{ADSENSE_PUBLISHER_ID}</code>.
      </p>
      <ul>
        <li>
          Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit
          to this site and/or other sites on the internet.
        </li>
        <li>
          Third-party vendors and ad networks may also place or read cookies, web beacons or similar technologies
          in the course of serving ads. They act under their own privacy policies.
        </li>
        <li>
          You may opt out of personalised advertising by visiting{" "}
          <a href="https://adssettings.google.com" rel="nofollow noopener" target="_blank">
            Google Ads Settings
          </a>
          , and opt out of third-party vendor cookies at{" "}
          <a href="https://www.aboutads.info/choices/" rel="nofollow noopener" target="_blank">
            aboutads.info
          </a>
          .
        </li>
        <li>
          Google explains how it uses information from sites and apps that use its services at{" "}
          <a href="https://policies.google.com/technologies/partner-sites" rel="nofollow noopener" target="_blank">
            policies.google.com/technologies/partner-sites
          </a>
          .
        </li>
      </ul>
      <p>
        Ads are never placed inside a tool, between your settings and the main button, or next to a download
        link. There are no pop-ups, no interstitials and no mobile bottom-anchor ads on this site.
      </p>

      <h2>5. Consent in the EEA, UK and Switzerland</h2>
      <p>
        For visitors in the European Economic Area, the United Kingdom and Switzerland, Google's certified
        consent management message (configured in AdSense under “Privacy &amp; messaging”) asks for your consent
        before advertising cookies are used, and records your choice. You can change your answer at any time by
        selecting “Privacy settings” in the footer of a page where the message is available, or by clearing site
        data in your browser.
      </p>
      <p>
        Our own cookie notice does not block the page and does not gate the tools. Nothing on this site depends
        on advertising consent: if you decline, every tool still works exactly the same.
      </p>

      <h2>6. Analytics</h2>
      <p>
        The current build ships with no third-party analytics. If lightweight, cookie-free analytics are enabled
        in future (for example Plausible or Umami — tools that do not set cookies, do not fingerprint and do not
        track you across sites), the only events recorded would be coarse and non-identifying: that a tool page
        was viewed, that a conversion started, that it completed or failed, and a file-size bucket such as
        “1–10 MB”. Never a file name, never file content, never an identifier that follows you elsewhere.
      </p>

      <h2>7. Legal bases (GDPR)</h2>
      <p>Where the GDPR applies, we rely on the following legal bases:</p>
      <ul>
        <li>
          <strong>Legitimate interests</strong> (Art. 6(1)(f)) for serving the site, keeping it secure and
          recording aggregate, non-identifying usage.
        </li>
        <li>
          <strong>Consent</strong> (Art. 6(1)(a)) for advertising cookies that require it, collected through
          Google's certified consent message.
        </li>
        <li>
          <strong>Contract or pre-contract</strong> (Art. 6(1)(b)) where you email us and we reply.
        </li>
      </ul>

      <h2>8. Your rights</h2>
      <p>
        Depending on where you live, you may have the right to access, correct, delete, restrict or object to the
        processing of your personal data, to data portability, and to withdraw consent at any time. Because we
        hold almost no personal data, most requests reduce to one of two things: deleting an email you sent us,
        or explaining what Google receives. Write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we
        will respond within 30 days.
      </p>
      <p>
        Under the CCPA/CPRA, we do not sell or share personal information as those terms are defined by the
        California statute. We do not knowingly collect information from anyone under 16. You also have the right
        to lodge a complaint with your local data protection authority.
      </p>

      <h2>9. Children</h2>
      <p>
        The site is a set of file utilities, not a service for children. It is not directed at children under 13,
        no account is offered and no personal data is knowingly collected from them. If you believe a child has
        sent us personal information by email, contact us and we will delete it.
      </p>

      <h2>10. International transfers and security</h2>
      <p>
        Our static host and Google may process technical data — IP addresses and request metadata — in countries
        outside your own, under their own safeguards (standard contractual clauses and equivalent mechanisms).
        The site is served over HTTPS. Since no file data is transmitted, the most sensitive material you work
        with never leaves your device and cannot be exposed by a breach of this website.
      </p>

      <h2>11. Third-party links</h2>
      <p>
        Some pages link to external resources, such as Google's advertising settings or a standards document. We
        are not responsible for the privacy practices of other sites; read their policies.
      </p>

      <h2>12. Changes to this policy</h2>
      <p>
        If this policy changes materially — for example if an optional server-side feature is ever added — the
        change will be published here with a new “last updated” date, and the difference will be explained in
        plain language. Continuing to use the site after a change means you accept the updated policy.
      </p>

      <h2>13. Contact</h2>
      <p>
        Privacy questions, data requests and complaints:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Related pages:{" "}
        <Link href="/cookie-policy/">Cookie Policy</Link>, <Link href="/terms/">Terms of Use</Link>,{" "}
        <Link href="/disclaimer/">Disclaimer</Link>.
      </p>
    </LegalPage>
  );
}
