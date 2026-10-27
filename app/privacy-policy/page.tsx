import type { Metadata } from "next";
import Link from "next/link";
import {
  ADS_ENABLED,
  ADSENSE_PUBLISHER_ID,
  ANALYTICS_SCRIPT_URL,
  CONTACT_EMAIL,
  SITE_NAME,
  SITE_URL,
  VERCEL_ANALYTICS_ENABLED,
} from "@/data/site";
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
        {SITE_NAME} ({SITE_URL}) is an independent website run by one person. For any privacy question or
        request, contact <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. There is no separate data
        protection officer because this is not a business that requires one; the person who runs the site
        answers privacy email personally.
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
        run any tool. No request carries your file. Once a tool page and its code have fully loaded, that tool
        keeps working even if you disconnect from the network — the first use of a tool fetches its processing
        code, which is why a freshly opened tab needs the page to load once.
      </p>

      <h2>3. What we do collect</h2>
      <p>
        The site itself does not set accounts, collect names, ask for email addresses or store documents. What
        remains is ordinary technical data created by any web request:
      </p>
      <ul>
        <li>
          <strong>Server and CDN logs.</strong> The static host that serves these pages logs the IP address, user
          agent, requested URL, timestamp and response status for each request. Those logs belong to the host, are
          used for security and to diagnose outages, and are kept only for the retention period set on the host
          account — not by this site, which stores nothing about your visit.
        </li>
        <li>
          <strong>Local browser storage.</strong> A few small preferences — your answer to the consent panel
          (whether analytics and advertising are allowed), and whether you chose the light or dark theme — are
          stored in your browser's localStorage.
          They are not cookies, are not shared and never leave your device. Clearing site data removes them.
        </li>
        <li>
          <strong>Emails you send us.</strong> If you email {CONTACT_EMAIL}, we receive your address, your message
          and anything you choose to include. We keep it only as long as needed to answer and to track a
          confirmed bug, then delete it.
        </li>
      </ul>

      <h2>4. Advertising and Google AdSense</h2>
      {ADS_ENABLED ? (
        <p>
          This site is supported by advertising served by Google. Google is a third-party vendor and uses
          cookies to serve ads based on your prior visits to this and other websites. The AdSense publisher
          account used here is <code>{ADSENSE_PUBLISHER_ID}</code>.
        </p>
      ) : (
        <p>
          <strong>No advertisements are being served right now.</strong> A Google AdSense publisher account (
          <code>{ADSENSE_PUBLISHER_ID}</code>) is reserved for the site, but no ad is displayed and the AdSense
          library is not loaded, so no advertising cookie is set and no request reaches Google's ad servers. The
          rest of this section describes what applies from the moment ads are switched on; this page is updated
          in the same release when that happens.
        </p>
      )}
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
        Once ads are live, visitors in the European Economic Area, the United Kingdom and Switzerland will be
        shown Google's certified consent management message (configured in AdSense under “Privacy &amp;
        messaging”) before any advertising cookie is used, and it records the choice. You can change the answer
        at any time by selecting “Privacy settings” in the footer of a page where the message is available, or by
        clearing site data in your browser. While ads are switched off, no consent message appears because there
        are no advertising cookies to consent to.
      </p>
      <p>
        Our own cookie notice does not block the page and does not gate the tools. Nothing on this site depends
        on advertising consent: if you decline, every tool still works exactly the same.
      </p>

      <h2>6. Analytics</h2>
      <p>
        Analytics runs only after you press “Allow” in the consent panel — nothing is measured beforehand, and
        the choice can be changed at any time with <strong>Cookie settings</strong> in the footer.
      </p>
      {VERCEL_ANALYTICS_ENABLED ? (
        <>
          <p>
            This site uses <strong>Vercel Web Analytics</strong>, provided by Vercel Inc., to count page views
            and to see which tools are started and finished. It is cookieless and does not build a profile of
            you: there is no cookie, no localStorage entry, no fingerprint and no identifier that follows you to
            another site. Vercel derives aggregate numbers — page, referrer, country, device type — from the
            request itself, and the result is only ever visible to us as totals.
          </p>
          <p>
            The custom events this site sends are <code>tool_started</code> and <code>tool_completed</code>. They
            carry the tool&apos;s slug, a page or file count, and a coarse size bucket such as “1–10 MB”. Never a
            file name, never file content, never anything you typed into a document.
          </p>
          <p>
            Vercel acts as our processor for this data. See{" "}
            <a href="https://vercel.com/docs/analytics/privacy-policy" rel="nofollow noopener" target="_blank">
              Vercel&apos;s analytics privacy notice
            </a>{" "}
            and the{" "}
            <a href="https://vercel.com/legal/privacy-policy" rel="nofollow noopener" target="_blank">
              Vercel privacy policy
            </a>
            . Because no cookie is set and no personal identifier is stored, this measurement would not require
            consent under current EU guidance — we ask anyway, and refuse to load anything if you decline.
          </p>
        </>
      ) : ANALYTICS_SCRIPT_URL ? (
        <>
          <p>
            This site uses a cookie-free analytics script (Plausible or Umami compatible) to count page views.
            It sets no cookies, does no fingerprinting and cannot follow you to another site. The only events
            recorded are that a tool page was viewed, that a conversion started, that it completed or failed,
            and a coarse size bucket such as “1–10 MB”. Never a file name, never file content.
          </p>
        </>
      ) : (
        <p>
          <strong>This build ships with no analytics at all:</strong> no analytics script is loaded and no
          measurement request leaves your browser. If cookie-free analytics are switched on later (Vercel Web
          Analytics, or Plausible/Umami — none of which set cookies, fingerprint, or track you across sites), the
          only events recorded would be coarse and non-identifying: that a tool page was viewed, that a
          conversion started, that it completed or failed, and a file-size bucket such as “1–10 MB”. Never a file
          name, never file content, never an identifier that follows you elsewhere. This page changes before that
          happens.
        </p>
      )}

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
