import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { guideBySlug, guides } from "@/data/guides";
import { GuideArticle, guideMetadata } from "@/components/guides/GuideArticle";

/**
 * Guide route. Static export needs a non-empty generateStaticParams(), which is
 * why this file appeared together with the first guide rather than before it.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = guideBySlug(slug);
  return guide ? guideMetadata(guide) : {};
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = guideBySlug(slug);
  if (!guide) notFound();
  return <GuideArticle guide={guide} />;
}
