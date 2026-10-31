import Link from "next/link";
import type { Crumb } from "@/lib/jsonld";
import { Breadcrumbs } from "./Breadcrumbs";
import { StructuredData } from "./StructuredData";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export function LegalPage({
  title,
  intro,
  updated,
  crumbs,
  children,
}: {
  title: string;
  intro: string;
  updated: string;
  crumbs: Crumb[];
  children: React.ReactNode;
}) {
  return (
    <>
      <StructuredData data={breadcrumbJsonLd(crumbs)} />
      <div className="container-page pb-16 pt-6 sm:pt-8">
        <Breadcrumbs crumbs={crumbs} />
        <header className="max-w-prose">
          <h1 className="text-[30px] font-bold leading-[1.14] tracking-[-0.025em] text-ink sm:text-[38px]">{title}</h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-body">{intro}</p>
          <p className="mt-3 text-[12.5px] font-medium text-subtle">
            Last updated:{" "}
            {new Date(updated).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </header>
        <div className="article mt-8 max-w-prose">
          {children}
          <p className="mt-10 text-[13.5px] text-subtle">
            Questions about this page?{" "}
            <Link href="/contact/" className="link">
              Contact us
            </Link>{" "}
            and a person will answer.
          </p>
        </div>
      </div>
    </>
  );
}
