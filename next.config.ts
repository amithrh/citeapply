import type { NextConfig } from "next";

// The Next development bundler evaluates strings, which a production-grade
// script-src forbids. The allowance is added only outside a production build,
// so `npm run dev` works and the shipped header never carries it.
const developmentBuild = process.env.NODE_ENV !== "production";

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
  developmentBuild
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'",
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
  // Next traces only the one legacy entry module it can see statically, so the
  // worker, the standard fonts and the package manifest are never copied and a
  // standalone server fails every packet start with `document_unavailable`.
  // The whole installed package is traced instead; it is the only runtime
  // parser this application has.
  outputFileTracingIncludes: {
    "/api/demo": [
      "./fixtures/packets/**/*.pdf",
      "./node_modules/pdfjs-dist/package.json",
      "./node_modules/pdfjs-dist/legacy/build/**",
      "./node_modules/pdfjs-dist/standard_fonts/**",
    ],
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
