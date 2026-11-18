import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Content-Security-Policy (B-09).
//
// Shipped as *Report-Only*: browsers log violations to the console but block nothing.
// Origin inventory (src/ + data/db.json):
//   - images:  images.unsplash.com by default, but admins can paste any remote image URL
//              (package/gallery/blog/review images), so img-src allows any https: host.
//   - media:   assets.mixkit.co (hero background video, Hero.tsx)
//   - frames:  www.google.com (Google Maps embed, Contact.tsx)
//   - fonts:   self-hosted by next/font (no Google Fonts / cdnjs requests at runtime)
//   - wa.me, social links: plain navigation, not subject to CSP fetch directives
// 'unsafe-inline' is required for script-src/style-src: Next.js injects inline bootstrap
// scripts, the pre-paint theme script lives in layout.tsx, and components use inline
// style={} attributes and <style> blocks. Removing it would require per-request nonces
// (middleware + dynamic rendering). 'unsafe-eval' and ws: are dev-only (React Refresh / HMR).
//
// To enforce: browse every page (home, /login, /admin incl. image uploads by URL) with
// DevTools open, confirm no "[Report Only]" CSP violations, then rename the header key
// below from "Content-Security-Policy-Report-Only" to "Content-Security-Policy".
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' https://assets.mixkit.co",
  "frame-src https://www.google.com",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy-Report-Only", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  // N-9: the optimiser (/_next/image, same origin, so CSP img-src 'self' covers it) only runs for
  // local images and images.unsplash.com. Admins can paste any https: image URL; those are
  // rendered `unoptimized` by src/components/SmartImage.tsx (rule: src/lib/images.ts). Never add
  // an open `**` pattern — it would make this server a public image proxy.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com", pathname: "/**" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
