"use client";

import dynamic from "next/dynamic";
import type { WidgetKey } from "@/lib/tool-types";

function WidgetSkeleton() {
  return (
    <div className="rounded-[22px] border border-line bg-white p-4 shadow-card sm:p-6" aria-busy="true">
      <div className="h-[168px] animate-pulse rounded-2xl border-2 border-dashed border-line bg-surface sm:h-[196px]" />
      <div className="mt-4 flex items-center justify-between">
        <div className="h-4 w-40 animate-pulse rounded bg-surface" />
        <div className="h-4 w-24 animate-pulse rounded bg-surface" />
      </div>
      <p className="mt-4 text-center text-[12.5px] text-subtle">Loading the tool — still no upload, ever.</p>
    </div>
  );
}

const ImageToPdf = dynamic(() => import("./ImageToPdf").then((mod) => mod.ImageToPdf), {
  loading: () => <WidgetSkeleton />,
});

const CompressPdf = dynamic(() => import("./CompressPdf").then((mod) => mod.CompressPdf), {
  loading: () => <WidgetSkeleton />,
});

const ImageConverter = dynamic(() => import("./ImageConverter").then((mod) => mod.ImageConverter), {
  loading: () => <WidgetSkeleton />,
});

export function ToolWidget({
  widget,
  presetFormat,
  conversionLabel,
  toolSlug,
}: {
  widget: WidgetKey;
  presetFormat?: "image/png" | "image/jpeg" | "image/webp";
  conversionLabel?: string;
  toolSlug?: string;
}) {
  switch (widget) {
    case "image-to-pdf":
      return <ImageToPdf />;
    case "compress-pdf":
      return <CompressPdf />;
    case "image-converter":
      return (
        <ImageConverter
          presetFormat={presetFormat}
          conversionLabel={conversionLabel}
          toolSlug={toolSlug}
        />
      );
    default:
      return (
        <div className="rounded-card border border-line bg-surface p-6 text-[14px] text-body">
          This tool is not available yet. It is listed on the roadmap and will appear here when it is
          finished and tested.
        </div>
      );
  }
}
