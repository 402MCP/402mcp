import type { NextConfig } from "next";

const SITE_URL = "https://402mcp.org";

/**
 * `Link:` header advertising this origin's machine interfaces per RFC 8288 /
 * RFC 9727, so a client can discover them from a HEAD request on the homepage
 * without parsing HTML.
 */
const DISCOVERY_LINK = [
  `<${SITE_URL}/.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"`,
  `<${SITE_URL}/openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json;version=3.1"`,
  `<${SITE_URL}/docs>; rel="service-doc"; type="text/html"`,
  `<${SITE_URL}/.well-known/402.json>; rel="describedby"; type="application/json"`,
  `<${SITE_URL}/llms.txt>; rel="alternate"; type="text/plain"`,
  `<${SITE_URL}/llms-full.txt>; rel="alternate"; type="text/markdown"`,
].join(", ");

/** Baseline hardening. No inline-script CSP: Next emits inline bootstrap code. */
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
  { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      {
        // Discovery links on the pages an agent is most likely to land on.
        source: "/",
        headers: [
          { key: "Link", value: DISCOVERY_LINK },
          { key: "Vary", value: "Accept" },
        ],
      },
      {
        source: "/docs",
        headers: [
          { key: "Link", value: DISCOVERY_LINK },
          { key: "Vary", value: "Accept" },
        ],
      },
      {
        // Machine interfaces are public reads: allow cross-origin agent fetches.
        source: "/:path(llms.txt|llms-full.txt|openapi.json|robots.txt|sitemap.xml)",
        headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
      },
      {
        source: "/.well-known/:path*",
        headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Accept, MCP-Protocol-Version",
          },
        ],
      },
      {
        // Content-addressed build output never changes under the same URL.
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/:file(favicon.ico|apple-touch-icon.png|icon-16.png|icon-32.png|icon-48.png|icon-192.png|icon-512.png)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=2592000" },
        ],
      },
    ];
  },
};

export default nextConfig;
