import type { NextConfig } from "next";

import { SEARCH_PAGES } from "./src/lib/search-pages";

const isDev = process.env.NODE_ENV === "development";

// Browsers only run what the site itself serves. Photos come from free-licence libraries
// on other hosts, so images may load over any https address.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https:",
  "font-src 'self' data:",
  "connect-src 'self' blob: data:",
  // The "I'm not a robot" check works in a background worker.
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Live (https) only: a local http test server would otherwise have its requests upgraded and fail.
  ...(process.env.VERCEL ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Three guides moved to top-level pages; keep old links and search results working.
  async redirects() {
    return [
      { source: "/make/pitch-deck", destination: "/pitch-deck-generator", permanent: true },
      { source: "/make/school-presentation", destination: "/presentation-maker-for-students", permanent: true },
      { source: "/make/lesson-slides", destination: "/presentation-maker-for-teachers", permanent: true },
    ];
  },
  // The search landing pages live in app/guide/[slug] and are served at the top level, so the
  // address people see is /ai-ppt-maker, and any other unknown address is still a real 404.
  async rewrites() {
    return [{ source: `/:slug(${SEARCH_PAGES.map((p) => p.slug).join("|")})`, destination: "/guide/:slug" }];
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
