import type { Metadata } from "next";
import Link from "next/link";
import { Inter, JetBrains_Mono } from "next/font/google";

import "./globals.css";
import { SITE_NAME, SITE_URL, rankedSolutions } from "@/data/solutions";
import {
  SITE_DESCRIPTION,
  datasetSchema,
  itemListSchema,
  jsonLd,
  organizationSchema,
  websiteSchema,
} from "@/lib/seo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "402MCP.org — The Open Registry for Agentic Commerce & HTTP 402",
    template: "%s · 402MCP.org",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "technology",
  // Topic keywords plus every indexed solution's name, derived from the dataset.
  keywords: [
    "HTTP 402",
    "Payment Required",
    "L402",
    "x402",
    "MCP",
    "Model Context Protocol",
    "agent payments",
    "machine-to-machine commerce",
    "agentic commerce",
    "micropayments",
    ...rankedSolutions.map((solution) => solution.name),
  ],
  alternates: {
    canonical: "/",
    types: {
      "text/plain": [
        { url: "/llms.txt", title: "llms.txt — agent index" },
        { url: "/llms-full.txt", title: "llms-full.txt — full corpus" },
      ],
      "application/json": [
        { url: "/api/v1/solutions", title: "Solutions REST API" },
      ],
    },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "402MCP.org",
    title: "The Open Registry for Agentic Commerce & HTTP 402",
    description:
      "Discover, compare, and integrate self-custodial payment rails built for autonomous AI agents.",
  },
  twitter: {
    card: "summary_large_image",
    title: "402MCP.org — The Open Registry for Agentic Commerce & HTTP 402",
    description:
      "Discover, compare, and integrate self-custodial payment rails built for autonomous AI agents.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      // Let Google show full snippets and large previews — this is a reference
      // work whose value to a searcher is in the detail.
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
  // Optional site-verification tokens, read from the environment. When unset,
  // no tag renders.
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : {},
  },
};

const NAV = [
  { href: "/", label: "Leaderboard" },
  { href: "/docs", label: "Docs" },
  { href: "/docs#install", label: "Install" },
  { href: "/api/v1/solutions", label: "API" },
  { href: "/llms.txt", label: "llms.txt" },
];

/**
 * Site-wide structured data.
 *
 * A single `@graph` carrying the publisher, the site, the registry-as-dataset
 * and the ranked list. Per-page graphs (a solution's SoftwareApplication +
 * Review, breadcrumbs, the docs FAQ) are emitted by those pages and reference
 * these nodes by @id.
 */
function StructuredData() {
  return (
    <script
      type="application/ld+json"
      // Serialized from build-time constants, not user input.
      dangerouslySetInnerHTML={{
        __html: jsonLd([
          organizationSchema(),
          websiteSchema(),
          datasetSchema(),
          itemListSchema(),
        ]),
      }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="alternate" type="text/plain" href="/llms.txt" title="llms.txt" />
        <link
          rel="alternate"
          type="text/markdown"
          href="/llms-full.txt"
          title="Markdown corpus"
        />
        <link
          rel="alternate"
          type="application/json"
          href="/.well-known/402.json"
          title="402 discovery manifest"
        />
        <link
          rel="service-desc"
          type="application/vnd.oai.openapi+json;version=3.1"
          href="/openapi.json"
          title="OpenAPI description"
        />
        <link
          rel="describedby"
          type="application/linkset+json"
          href="/.well-known/api-catalog"
          title="API catalog"
        />
        <link
          rel="alternate"
          type="application/atom+xml"
          href="/changelog.xml"
          title="402MCP.org registry changelog"
        />
        <meta name="theme-color" content="#ffffff" />
        <StructuredData />
        {/*
          Farwatch — first-party, cookieless analytics. Rendered directly into
          the server HTML rather than injected after hydration, because the
          script reads its site id from `document.currentScript`. It patches
          history.pushState/replaceState, so App Router client-side navigations
          are counted too.
        */}
        <script
          defer
          src="https://farwatch.org/s.js"
          data-site="mluu354npe"
        />
      </head>
      <body className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
        <header className="border-b border-foreground">
          {/* Wraps to a second line on narrow screens rather than overflowing. */}
          <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2 sm:px-6">
            <Link href="/" className="font-mono text-sm font-bold tracking-tight">
              402MCP.org
            </Link>

            <nav aria-label="Main" className="-mx-1 flex flex-wrap items-center">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-1.5 py-1 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:px-2"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-20 border-t border-foreground">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <div className="flex flex-col gap-8 md:flex-row md:justify-between">
              <div className="max-w-sm space-y-2">
                <p className="font-mono text-sm font-bold">402MCP.org</p>
                <p className="text-sm text-muted-foreground">
                  The open registry for agentic commerce and HTTP 402. Every
                  page here has a machine-readable equivalent.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-x-12 gap-y-6 text-sm sm:grid-cols-4">
                <div className="space-y-1.5">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Registry
                  </p>
                  <Link href="/" className="link block">
                    Leaderboard
                  </Link>
                  <Link href="/docs" className="link block">
                    Documentation
                  </Link>
                  <Link href="/changelog" className="link block">
                    Changelog
                  </Link>
                </div>
                <div className="space-y-1.5">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Indexes
                  </p>
                  <a href="/llms.txt" className="link block">
                    llms.txt
                  </a>
                  <a href="/llms-full.txt" className="link block">
                    llms-full.txt
                  </a>
                  <a href="/.well-known/402.json" className="link block">
                    402.json
                  </a>
                </div>
                <div className="space-y-1.5">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    APIs
                  </p>
                  <a href="/api/v1/registry" className="link block">
                    Registry feed
                  </a>
                  <a href="/openapi.json" className="link block">
                    OpenAPI
                  </a>
                  <a href="/api/v1/mcp" className="link block">
                    MCP server
                  </a>
                </div>
                <div className="space-y-1.5">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    About
                  </p>
                  <Link href="/support" className="link block">
                    Support
                  </Link>
                  <Link href="/privacy" className="link block">
                    Privacy
                  </Link>
                  <Link href="/terms" className="link block">
                    Terms
                  </Link>
                </div>
              </div>
            </div>

            <p className="mt-10 max-w-3xl border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
              402MCP.org is an independent directory. It is not affiliated with,
              sponsored by, or compensated by any vendor it indexes. Rankings
              follow the six-dimension evaluation matrix published at{" "}
              <Link href="/docs#methodology" className="link">
                /docs#methodology
              </Link>
              , and each solution&rsquo;s scores are shown on its own page so any
              ranking can be checked against the criteria.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
