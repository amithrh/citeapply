import type { NextConfig } from "next";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'none'",
  "connect-src 'self'",
  "font-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "img-src 'self'",
  "manifest-src 'self'",
  "media-src 'none'",
  "object-src 'none'",
  // Next.js emits small inline bootstrap scripts for App Router hydration.
  "script-src 'self' 'unsafe-inline'",
  // Application styling is local; this allowance covers Next's inline style output.
  "style-src 'self' 'unsafe-inline'",
  "worker-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  {
    key: "Cross-Origin-Embedder-Policy",
    value: "require-corp",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "Origin-Agent-Cluster", value: "?1" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), geolocation=(), microphone=(), payment=(), usb=(), browsing-topics=(), tools=(self)",
  },
  { key: "Referrer-Policy", value: "no-referrer" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
];

const noStoreHeader = {
  key: "Cache-Control",
  value: "private, no-store, max-age=0",
};

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  // pdfjs-dist resolves its own worker and standard-font assets through
  // import.meta at runtime; bundling it breaks that resolution.
  serverExternalPackages: ["pdfjs-dist", "pg"],
  outputFileTracingIncludes: {
    "/api/demo": ["./fixtures/packets/**/*.pdf"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/", headers: [noStoreHeader] },
      { source: "/application", headers: [noStoreHeader] },
      { source: "/receipt", headers: [noStoreHeader] },
      { source: "/api/:path*", headers: [noStoreHeader] },
    ];
  },
};

export default nextConfig;
