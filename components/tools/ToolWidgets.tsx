"use client";

import dynamic from "next/dynamic";
import type { Tool, WidgetKey } from "@/lib/tool-types";

function WidgetSkeleton() {
  return (
    <div className="glass-panel rounded-[22px] p-4 shadow-card sm:p-6" aria-busy="true">
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

const ImageCompressor = dynamic(() => import("./ImageCompressor").then((mod) => mod.ImageCompressor), {
  loading: () => <WidgetSkeleton />,
});

const ImageResizer = dynamic(() => import("./ImageResizer").then((mod) => mod.ImageResizer), {
  loading: () => <WidgetSkeleton />,
});

const ImageCrop = dynamic(() => import("./ImageCrop").then((mod) => mod.ImageCrop), {
  loading: () => <WidgetSkeleton />,
});

const ExifTool = dynamic(() => import("./ExifTool").then((mod) => mod.ExifTool), {
  loading: () => <WidgetSkeleton />,
});

const Base64Tool = dynamic(() => import("./Base64Tool").then((mod) => mod.Base64Tool), {
  loading: () => <WidgetSkeleton />,
});

const MergePdf = dynamic(() => import("./pdf/MergePdf").then((mod) => mod.MergePdf), { loading: () => <WidgetSkeleton /> });
const SplitPdf = dynamic(() => import("./pdf/SplitPdf").then((mod) => mod.SplitPdf), { loading: () => <WidgetSkeleton /> });
const OrganizePdf = dynamic(() => import("./pdf/OrganizePdf").then((mod) => mod.OrganizePdf), { loading: () => <WidgetSkeleton /> });
const RotatePdf = dynamic(() => import("./pdf/RotatePdf").then((mod) => mod.RotatePdf), { loading: () => <WidgetSkeleton /> });
const PageNumbers = dynamic(() => import("./pdf/PageNumbers").then((mod) => mod.PageNumbers), { loading: () => <WidgetSkeleton /> });
const WatermarkPdf = dynamic(() => import("./pdf/WatermarkPdf").then((mod) => mod.WatermarkPdf), { loading: () => <WidgetSkeleton /> });
const SignPdf = dynamic(() => import("./pdf/SignPdf").then((mod) => mod.SignPdf), { loading: () => <WidgetSkeleton /> });
const PdfEditor = dynamic(() => import("./pdf/PdfEditor").then((mod) => mod.PdfEditor), { loading: () => <WidgetSkeleton /> });
const PdfToImage = dynamic(() => import("./pdf/PdfToImage").then((mod) => mod.PdfToImage), { loading: () => <WidgetSkeleton /> });
const MetadataEditor = dynamic(() => import("./pdf/MetadataEditor").then((mod) => mod.MetadataEditor), { loading: () => <WidgetSkeleton /> });
const PagePicker = dynamic(() => import("./pdf/PagePicker").then((mod) => mod.PagePicker), { loading: () => <WidgetSkeleton /> });
const RepairPdf = dynamic(() => import("./pdf/RepairPdf").then((mod) => mod.RepairPdf), { loading: () => <WidgetSkeleton /> });
const PdfToTxt = dynamic(() => import("./pdf/PdfToTxt").then((mod) => mod.PdfToTxt), { loading: () => <WidgetSkeleton /> });
const ScanToPdf = dynamic(() => import("./pdf/ScanToPdf").then((mod) => mod.ScanToPdf), { loading: () => <WidgetSkeleton /> });
const TextToPdf = dynamic(() => import("./pdf/TextToPdf").then((mod) => mod.TextToPdf), { loading: () => <WidgetSkeleton /> });

export function ToolWidget({
  widget,
  presetFormat,
  conversionLabel,
  toolSlug,
  preset,
}: {
  widget: WidgetKey;
  presetFormat?: "image/png" | "image/jpeg" | "image/webp";
  conversionLabel?: string;
  toolSlug?: string;
  preset?: Tool["preset"];
}) {
  switch (widget) {
    case "image-to-pdf":
      return <ImageToPdf input={preset?.imageInput} />;
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
    case "image-compressor":
      return <ImageCompressor toolSlug={toolSlug} />;
    case "image-resizer":
      return <ImageResizer toolSlug={toolSlug} />;
    case "image-crop":
      return <ImageCrop toolSlug={toolSlug} />;
    case "exif":
      return <ExifTool toolSlug={toolSlug} />;
    case "base64":
      return <Base64Tool toolSlug={toolSlug} />;
    case "merge-pdf":
      return <MergePdf />;
    case "split-pdf":
      return <SplitPdf />;
    case "page-organizer":
      return <OrganizePdf />;
    case "rotate-pdf":
      return <RotatePdf />;
    case "page-numbers":
      return <PageNumbers />;
    case "watermark-pdf":
      return <WatermarkPdf />;
    case "sign-pdf":
      return <SignPdf />;
    case "pdf-editor":
      return <PdfEditor initialTool={preset?.editorTool} toolSlug={toolSlug} />;
    case "pdf-to-image":
      return (
        <PdfToImage
          presetFormat={
            presetFormat === "image/png" ? "png" : presetFormat === "image/webp" ? "webp" : "jpg"
          }
        />
      );
    case "pdf-metadata":
      return <MetadataEditor clearMode={preset?.clearMetadata} toolSlug={toolSlug} />;
    case "remove-pages":
      return <PagePicker mode="remove" toolSlug={toolSlug ?? "remove-pages-from-pdf"} />;
    case "extract-pages":
      return <PagePicker mode="extract" toolSlug={toolSlug ?? "extract-pages-from-pdf"} />;
    case "repair-pdf":
      return <RepairPdf />;
    case "pdf-to-text":
      return <PdfToTxt />;
    case "scan-to-pdf":
      return <ScanToPdf />;
    case "txt-to-pdf":
      return <TextToPdf mode="txt" />;
    case "docx-to-pdf":
      return <TextToPdf mode="docx" />;
    case "csv-to-pdf":
      return <TextToPdf mode="csv" />;
    case "markdown-to-pdf":
      return <TextToPdf mode="markdown" />;
    default:
      return (
        <div className="rounded-card border border-line bg-surface p-6 text-[14px] text-body">
          This tool is not built yet. It is listed on the roadmap and this page will not show a widget until
          the processing code is finished. Nothing you drop here would be processed, so there is nothing to
          drop.
        </div>
      );
  }
}
