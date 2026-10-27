/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static export: every page is pre-rendered to HTML at build time.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
