import type { Metadata } from "next";
import { CATEGORIES } from "@/data/site";
import { buildMetadata } from "@/lib/seo";
import { CategoryPage } from "@/components/CategoryPage";

const category = CATEGORIES.find((entry) => entry.slug === "image-tools")!;

export const metadata: Metadata = buildMetadata({
  title: category.title,
  description: category.metaDescription,
  path: "/image-tools/",
});

const faqs = [
  {
    q: "Which image format should I choose?",
    a: "JPG for photographs you will email, PNG for screenshots, logos and anything with transparency, WebP for websites, and AVIF when you want the smallest file and can accept slower encoding. TIFF and BMP belong to print and legacy workflows where a specific application demands them.",
  },
  {
    q: "Does converting an image lose quality?",
    a: "Only when the target format is lossy. PNG, BMP and TIFF output are lossless. JPG, WebP and AVIF discard a little detail at every save, so convert once from the original rather than repeatedly from a converted copy.",
  },
  {
    q: "Why is my PNG so much bigger than the JPG?",
    a: "PNG stores every pixel exactly, while JPG discards detail the eye is less likely to notice. A 3 MB photograph can become a 12 MB PNG. That is expected — use PNG when exactness matters, not when file size does.",
  },
  {
    q: "Is my photo metadata removed?",
    a: "Yes. Re-encoding through the browser canvas drops EXIF, including GPS coordinates, camera model and the original capture date. For photos you are about to publish, that is usually the outcome you want.",
  },
  {
    q: "Can I convert HEIC photos from my iPhone?",
    a: "Yes. HEIC is decoded locally in the browser and re-encoded to JPG, PNG or WebP. If one particular file refuses to decode, export it from the Photos app as a JPEG and convert that instead.",
  },
  {
    q: "How many images can I process at once?",
    a: "As many as your device's memory allows. Ten to twenty phone photos at a time is comfortable on a phone; hundreds belong on a desktop. Very large batches are slow because each image is decoded and re-encoded in full resolution.",
  },
];

export default function ImageToolsPage() {
  return (
    <CategoryPage
      category={category}
      faqs={faqs}
      intro={
        <>
          <h2>Format is a decision, not a detail</h2>
          <p>
            The same photograph can be 400 KB or 4 MB depending on the format and quality you pick. That
            difference shows up directly in page speed, email deliverability and whether an upload form accepts
            your file at all.
          </p>
          <p>
            A rough guide that holds up in practice: <strong>JPG</strong> for photographs where a little loss is
            invisible, <strong>PNG</strong> for screenshots and graphics with sharp edges or transparency,{" "}
            <strong>WebP</strong> for anything that will be served on a website, <strong>AVIF</strong> when
            smallest-possible wins over encoding time, and <strong>HEIC</strong> only as a camera format — almost
            nothing else accepts it.
          </p>

          <h2>Compression without the guesswork</h2>
          <p>
            “Compressed” on its own means nothing. What matters is whether the file meets a number: 200 KB for a
            job portal, 2 MB for a visa form, 100 KB for a thumbnail. A target-size compressor works backwards
            from that number — it lowers quality and resolution until the file fits, then shows you exactly what
            it did so you can judge whether the result is still acceptable.
          </p>
          <p>
            Quality settings are not linear. Between 90 and 100 the file grows quickly for almost no visible
            gain; between 70 and 80 you halve the size with a change most people cannot see on a screen. That is
            why the sliders here default to the 75–85 range rather than to maximum.
          </p>

          <h2>Resizing, cropping and the aspect ratio trap</h2>
          <p>
            Resizing changes pixel dimensions; compressing changes how those pixels are stored. Doing both at
            once is fine, but keep the aspect ratio unless the destination specifies exact dimensions — a
            profile picture that must be 400 × 400 should be cropped to square first, then resized, otherwise it
            stretches.
          </p>
          <p>
            Screenshots deserve special treatment: convert them to PNG or WebP, never JPG. Text edges in JPG pick
            up grey fringing that makes small type look blurry, while the file gets no smaller than a well-made
            PNG.
          </p>

          <h2>Where your images actually go</h2>
          <p>
            Nowhere. Decoding uses the browser's own image pipeline, encoding uses the canvas plus a few local
            encoders for formats browsers cannot write, and the download is assembled in memory. There is no
            upload, no storage bucket and no account, which matters most for the photographs people never intend
            to publish: documents, ID cards and pictures of their children.
          </p>
        </>
      }
    />
  );
}
