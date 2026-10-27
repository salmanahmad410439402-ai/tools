import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { tools, toolBySlug } from "@/data/tools";
import { categoryBySlug } from "@/data/site";
import { buildMetadata } from "@/lib/seo";
import { ToolLayout } from "@/components/ToolLayout";

export const dynamicParams = false;

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = toolBySlug(slug);
  if (!tool) return {};
  return buildMetadata({
    title: tool.seoTitle,
    description: tool.metaDescription,
    path: `/${tool.slug}/`,
    modifiedTime: tool.updated,
  });
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = toolBySlug(slug);
  if (!tool) notFound();
  const category = categoryBySlug(tool.category);

  return (
    <ToolLayout
      tool={tool}
      crumbs={[
        { name: "Home", path: "/" },
        { name: category?.name ?? "Tools", path: `/${tool.category}/` },
        { name: tool.name, path: `/${tool.slug}/` },
      ]}
    />
  );
}
