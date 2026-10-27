import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, SITE_NAME } from "@/data/site";
import { buildMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = buildMetadata({
  title: `Contact ${SITE_NAME}`,
  description:
    "Email the developer behind Filecraft: bug reports, questions about a tool, corrections and requests for new tools. One person reads every message.",
  path: "/contact/",
});

export default function ContactPage() {
  return (
    <LegalPage
      title="Contact us"
      intro="One email address, read by the person who builds the tools. No ticket system, no chatbot and no form that quietly throws your message away."
      updated="2026-10-27"
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Contact", path: "/contact/" },
      ]}
    >
      <h2>Email</h2>
      <p className="!mt-3">
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Filecraft question")}`}
          className="inline-flex min-h-[48px] items-center rounded-xl bg-brand-500 px-5 text-[15px] font-semibold text-white no-underline transition-colors hover:bg-brand-600"
        >
          {CONTACT_EMAIL}
        </a>
      </p>
      <p>
        This is the only official contact channel for {SITE_NAME}. There is no phone number, no postal address
        and no social-media support inbox — anything claiming otherwise is not us.
      </p>

      <h2>What to include in a bug report</h2>
      <ul>
        <li>
          <strong>Which tool</strong> — the page name, for example “Compress PDF” or “Image to PDF”.
        </li>
        <li>
          <strong>The file type and rough size</strong> — “a 14 MB scanned PDF, 60 pages”. Please do not attach
          the file itself; a description is enough, and we would rather you kept your documents private.
        </li>
        <li>
          <strong>Your browser and device</strong> — “Safari 18 on iPhone 14” or “Chrome 130 on Windows 11”.
        </li>
        <li>
          <strong>What happened and what you expected</strong> — the exact error text is the single most useful
          detail.
        </li>
      </ul>

      <h2>Corrections and content questions</h2>
      <p>
        If a page states something inaccurate — a file-size limit, a browser capability, a format claim — tell
        us and we will fix it and update the review date at the bottom of the page. Accuracy matters more to us
        than looking confident.
      </p>

      <h2>Requesting a tool</h2>
      <p>
        Requests genuinely decide what gets built next. Describe the job rather than the tool name, for
        example “I need to attach 30 photos to one email under 20 MB” rather than “add an image compressor”. The
        job usually tells us whether one tool is needed or three. You can see what is already in the queue on
        the <Link href="/tools/">all tools page</Link>.
      </p>

      <h2>Privacy of your message</h2>
      <p>
        Emails are kept only as long as needed to answer you and track a fix, then deleted. We do not add
        addresses to a newsletter — there is no newsletter. Sending us a message is not consent to anything
        else; see the <Link href="/privacy-policy/">Privacy Policy</Link> for the full picture.
      </p>

      <h2>Response times</h2>
      <p>
        Typically two to three working days. There is no support contract here, so a same-day reply is not
        promised — but every genuine message gets an answer, and confirmed bugs are fixed in the next round of
        updates.
      </p>
    </LegalPage>
  );
}
