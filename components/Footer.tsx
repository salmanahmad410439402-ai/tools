import Link from "next/link";
import { CONTACT_EMAIL, LEGAL_LINKS, SITE_LAUNCH_YEAR, SITE_NAME } from "@/data/site";
import { CATEGORIES } from "@/data/site";
import { tools } from "@/data/tools";
import { Logo } from "./Logo";
import { ShieldCheck } from "lucide-react";
import { CookieSettingsButton } from "./CookieSettingsButton";

export function Footer() {
  const year = new Date().getFullYear();
  const currentYear = Math.max(year, SITE_LAUNCH_YEAR);
  const popular = tools.filter((tool) => tool.popular).slice(0, 6);

  return (
    <footer className="mt-20 border-t border-line bg-surface/60">
      <div className="container-page py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-body">
              Free PDF and image tools that open, change and save your files on your own device.
              No account, no watermark, no upload.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] font-medium text-body">
              <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />
              Files are processed in your browser
            </p>
          </div>

          <nav aria-label="Tool categories">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.12em] text-ink">Categories</h2>
            <ul className="mt-3 space-y-2 text-[14px]">
              {CATEGORIES.map((category) => (
                <li key={category.slug}>
                  <Link href={`/${category.slug}/`} className="text-body transition-colors hover:text-brand-600">
                    {category.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/tools/" className="text-body transition-colors hover:text-brand-600">
                  All tools
                </Link>
              </li>
              <li>
                <Link href="/blog/" className="text-body transition-colors hover:text-brand-600">
                  Guides
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Popular tools">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.12em] text-ink">Popular tools</h2>
            <ul className="mt-3 space-y-2 text-[14px]">
              {popular.map((tool) => (
                <li key={tool.slug}>
                  <Link href={`/${tool.slug}/`} className="text-body transition-colors hover:text-brand-600">
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Site information">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.12em] text-ink">Site</h2>
            <ul className="mt-3 space-y-2 text-[14px]">
              <li>
                <Link href="/about/" className="text-body transition-colors hover:text-brand-600">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact/" className="text-body transition-colors hover:text-brand-600">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/faq/" className="text-body transition-colors hover:text-brand-600">
                  FAQ
                </Link>
              </li>
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-body transition-colors hover:text-brand-600">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                {/* Re-opens the consent panel; analytics and ads stay off until
                    the visitor allows them. */}
                <CookieSettingsButton className="text-left text-body transition-colors hover:text-brand-600" />
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 text-[13px] text-minimal sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {currentYear} {SITE_NAME}. Built and maintained by one developer.
          </p>
          <p>
            Questions?{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-brand-600 hover:text-brand-700">
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
