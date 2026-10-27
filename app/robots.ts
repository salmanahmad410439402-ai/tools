import type { MetadataRoute } from "next";
import { SITE_URL } from "@/data/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Never block /_next/ assets: Googlebot needs the JS and CSS to render
        // pages. Only the raw pdf.js worker (a 1.4 MB bundle nobody should
        // index) is excluded.
        disallow: ["/pdf.worker.min.mjs"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
