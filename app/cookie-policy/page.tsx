import type { Metadata } from "next";
import Link from "next/link";
import { ADS_ENABLED, ADSENSE_PUBLISHER_ID, CONTACT_EMAIL, SITE_NAME } from "@/data/site";
import { buildMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = buildMetadata({
  title: "Cookie Policy",
  description:
    "Which cookies this site sets, what Google AdSense stores, how consent works in the EEA, UK and Switzerland, and how to control cookies.",
  path: "/cookie-policy/",
});

export default function CookiePolicyPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      intro="A short, specific inventory of what is stored in your browser when you visits this site — and what is deliberately not stored."
      updated="2026-10-27"
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Cookie Policy", path: "/cookie-policy/" },
      ]}
    >
      <h2>1. What a cookie is, briefly</h2>
      <p>
        A cookie is a small text file a website asks your browser to store, and which the browser then sends back
        with later requests. Related technologies — localStorage, sessionStorage, pixels — store similar small
        pieces of data without sending them with every request. This page covers all of them.
      </p>

      <h2>2. What this site stores</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Type</th>
            <th scope="col">Purpose</th>
            <th scope="col">Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>filecraft-cookie-notice</code></td>
            <td>localStorage (not a cookie)</td>
            <td>Remembers that you dismissed the small cookie notice. Never transmitted.</td>
            <td>Until you clear site data</td>
          </tr>
          <tr>
            <td><code>filecraft-theme</code></td>
            <td>localStorage (not a cookie)</td>
            <td>
              Remembers whether you chose the light or dark theme. Written only when you use the theme button,
              never transmitted.
            </td>
            <td>Until you clear site data</td>
          </tr>
        </tbody>
      </table>
      <p>
        That is the complete list of storage the site itself creates. There is no login cookie, no session cookie,
        no analytics cookie and no preference profile. No cookie is used to make a tool work, because the tools do
        their work in memory on your device.
      </p>

      <h2>3. Advertising cookies (Google AdSense)</h2>
      <p>
        {ADS_ENABLED ? (
          <>
            Advertising on this site is served by Google AdSense (publisher <code>{ADSENSE_PUBLISHER_ID}</code>).
            Google and its partners may set or read cookies to serve ads, limit how often the same ad appears,
            measure performance and — where consent has been given — personalise what you see.
          </>
        ) : (
          <>
            The site has a Google AdSense publisher account (<code>{ADSENSE_PUBLISHER_ID}</code>) reserved for it,
            but <strong>no ads are being served at the moment</strong> and the AdSense library is not loaded.
            While that is true this site sets no advertising cookies and makes no request to Google's ad servers.
            The paragraphs below describe what applies from the moment ads are switched on.
          </>
        )}
      </p>
      <ul>
        <li>
          <strong>Personalised ads</strong> may use a cookie to remember sites you have visited and infer
          interests. This requires your consent where the law requires it.
        </li>
        <li>
          <strong>Non-personalised ads</strong> are still served with limited cookies for frequency capping and
          aggregate reporting, and may use coarse location (derived from IP address, not stored by us).
        </li>
        <li>
          Third-party vendors and ad networks whose ads appear may also use cookies under their own policies.
        </li>
      </ul>
      <p>
        Google's own explanation of how it uses information from partner sites is at{" "}
        <a href="https://policies.google.com/technologies/partner-sites" rel="nofollow noopener" target="_blank">
          policies.google.com/technologies/partner-sites
        </a>
        . You can manage personalised advertising at{" "}
        <a href="https://adssettings.google.com" rel="nofollow noopener" target="_blank">
          adssettings.google.com
        </a>{" "}
        and opt out of many third-party advertising cookies at{" "}
        <a href="https://www.aboutads.info/choices/" rel="nofollow noopener" target="_blank">
          aboutads.info/choices
        </a>
        . Ad blockers work here without penalty: every tool keeps functioning.
      </p>

      <h2>4. Consent in the EEA, UK and Switzerland</h2>
      <p>
        Once ads are live, visitors in these regions will be shown Google's certified consent message (configured
        in AdSense under “Privacy &amp; messaging”) before any advertising cookie is used. It lets you accept or
        reject personalised advertising and explains the vendors involved; your choice is recorded by Google's
        consent management platform. You can change it later through the “Privacy settings” link on a page that
        shows the message, or by clearing cookies for this site. While ads are switched off, no consent message
        appears because there is nothing to consent to.
      </p>
      <p>
        Our own notice is informational only: it does not block the page, does not gate content and does not
        require a click to use a tool.
      </p>

      <h2>5. Analytics</h2>
      <p>
        {ADS_ENABLED
          ? "Any analytics in use is cookie-free and aggregate. No cookies are set for measurement."
          : "This build ships with no analytics at all. If cookie-free analytics (Plausible or Umami) are enabled later, no cookies would be set and no personal data would be collected."}
      </p>

      <h2>6. How to control cookies</h2>
      <ul>
        <li>All major browsers let you block third-party cookies or delete existing ones in their settings.</li>
        <li>Private/incognito windows discard cookies when you close the window.</li>
        <li>Clearing site data for this domain also removes the local dismissal preference.</li>
        <li>Blocking advertising cookies does not affect any tool on this site.</li>
      </ul>

      <h2>7. Changes and contact</h2>
      <p>
        If the cookies used here change, this page is updated in the same release, with a new date at the top.
        Questions about cookies or consent: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. See also the{" "}
        <Link href="/privacy-policy/">Privacy Policy</Link> for the wider picture on data and third parties.
      </p>
    </LegalPage>
  );
}
