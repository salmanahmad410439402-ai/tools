import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, FileQuestion } from "lucide-react";
import { tools } from "@/data/tools";
import { CATEGORIES } from "@/data/site";

export const metadata: Metadata = {
  title: "Page not found (404)",
  description: "That page does not exist. Browse the free PDF and image tools instead.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="container-page py-16 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <FileQuestion className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-[32px] font-extrabold tracking-tight text-ink sm:text-[40px]">
          This page does not exist
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-[15.5px] leading-relaxed text-body">
          The link may be old, mistyped or for a tool that has not shipped yet. Everything that is live right
          now is listed below — no dead ends.
        </p>

        <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
          {tools.map((tool) => (
            <Link
              key={tool.slug}
              href={`/${tool.slug}/`}
              className="group rounded-xl border border-line bg-white px-4 py-3 transition-colors hover:border-brand-200 hover:bg-brand-50/40"
            >
              <span className="flex items-center justify-between text-[14px] font-semibold text-ink">
                {tool.name}
                <ArrowRight className="h-3.5 w-3.5 text-brand-500 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
              <span className="mt-0.5 block text-[12px] text-subtle">{tool.tagline}</span>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Link href="/tools/" className="btn-primary">
            All tools
          </Link>
          <Link href="/" className="btn-secondary">
            Home
          </Link>
        </div>

        <p className="mt-8 text-[13px] text-subtle">
          Looking for a category?{" "}
          {CATEGORIES.map((category, index) => (
            <span key={category.slug}>
              {index > 0 && " · "}
              <Link href={`/${category.slug}/`} className="font-medium text-brand-600 hover:text-brand-700">
                {category.name}
              </Link>
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
