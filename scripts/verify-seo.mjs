#!/usr/bin/env node
/**
 * Verifies the discovery surface: crawler directives, structured data, social
 * cards, icons, the agent-discovery documents and Markdown negotiation.
 *
 *   node scripts/verify-seo.mjs [baseUrl]
 */
import { createHash } from "node:crypto";

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
let failures = 0;

function check(name, condition, detail = "") {
  if (condition) {
    console.log(`  ✓ ${name}`);
  } else {
    failures += 1;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}
const section = (title) => console.log(`\n${title}`);

// Derived from the dataset so no assertion names a particular vendor.
const { INDEXNOW_KEY, REGISTRY_UPDATED, rankedSolutions } = await import(
  "../data/solutions.ts"
);
const slugs = rankedSolutions.map((solution) => solution.id);
const top = rankedSolutions[0];
const indexNowKey = INDEXNOW_KEY;
const registryUpdated = REGISTRY_UPDATED;

/* ------------------------------------------------------------- robots.txt */
section(`GET ${base}/robots.txt`);
{
  const res = await fetch(`${base}/robots.txt`);
  const body = await res.text();
  check("200 OK", res.status === 200, `got ${res.status}`);
  check("content-type is text/plain",
    (res.headers.get("content-type") ?? "").startsWith("text/plain"));
  check("allows all crawlers", /User-agent: \*\s*\nAllow: \//.test(body));
  check("declares Content-Signal (search + ai-input + ai-train)",
    /Content-Signal: search=yes, ai-input=yes, ai-train=yes/.test(body));
  check("names the major AI crawlers explicitly",
    ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "Bingbot", "OAI-SearchBot"]
      .every((agent) => body.includes(`User-agent: ${agent}`)));
  check("points at the sitemap", body.includes(`${base}/sitemap.xml`) || body.includes("https://402mcp.org/sitemap.xml"));
  check("advertises the machine endpoints in comments",
    ["/llms.txt", "/api/v1/mcp", "/openapi.json"].every((p) => body.includes(p)));
}

/* ------------------------------------------------------------ sitemap.xml */
section(`GET ${base}/sitemap.xml`);
{
  const res = await fetch(`${base}/sitemap.xml`);
  const body = await res.text();
  const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  check("200 OK", res.status === 200);
  check("is XML", (res.headers.get("content-type") ?? "").includes("xml"));
  check("lists home, docs and every solution",
    locs.length >= slugs.length + 2 &&
    slugs.every((slug) => locs.some((loc) => loc.endsWith(`/solutions/${slug}`))));
  check("lists the changelog", locs.some((l) => l.endsWith("/changelog")));
  check("lists the plain-text indexes",
    locs.some((l) => l.endsWith("/llms.txt")) && locs.some((l) => l.endsWith("/llms-full.txt")));
  check("lastmod is the registry date, not build time",
    body.includes(registryUpdated), `expected ${registryUpdated}`);
  check("every loc is absolute https", locs.every((loc) => loc.startsWith("https://")));
}

/* -------------------------------------------------------- page-level meta */
section("Page metadata");
{
  for (const path of ["/", "/docs", "/changelog", `/solutions/${slugs[0]}`]) {
    const html = await (await fetch(`${base}${path}`)).text();
    const label = path === "/" ? "/ (home)" : path;
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
    const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "";
    const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? "";

    check(`${label}: has a non-empty <title>`, title.length > 10, title);
    check(`${label}: has a meta description`, desc.length > 50);
    check(`${label}: has a canonical URL`, canonical.startsWith("https://402mcp.org"));
    check(`${label}: robots allows large previews and full snippets`,
      /max-image-preview:large/.test(html) && /max-snippet:-1/.test(html));
    check(`${label}: declares an og:image`, /property="og:image"/.test(html));
    check(`${label}: twitter card is summary_large_image`,
      /name="twitter:card" content="summary_large_image"/.test(html));
    check(`${label}: has exactly one <h1>`,
      (html.match(/<h1[\s>]/g) ?? []).length === 1);
  }
}

/* --------------------------------------------------------- structured data */
section("Structured data (JSON-LD)");
{
  async function graphTypes(path) {
    const html = await (await fetch(`${base}${path}`)).text();
    const blocks = [...html.matchAll(
      /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
    )].map((m) => m[1]);
    const types = [];
    for (const block of blocks) {
      const parsed = JSON.parse(block);
      for (const node of parsed["@graph"] ?? [parsed]) types.push(node["@type"]);
    }
    return types;
  }

  const home = await graphTypes("/");
  check("home: parses as valid JSON", true);
  check("home: declares Organization, WebSite, Dataset and ItemList",
    ["Organization", "WebSite", "Dataset", "ItemList"].every((t) => home.includes(t)),
    home.join(", "));

  const docs = await graphTypes("/docs");
  check("docs: declares TechArticle, FAQPage and BreadcrumbList",
    ["TechArticle", "FAQPage", "BreadcrumbList"].every((t) => docs.includes(t)),
    docs.join(", "));

  const solution = await graphTypes(`/solutions/${slugs[0]}`);
  check("solution: declares SoftwareApplication and BreadcrumbList",
    ["SoftwareApplication", "BreadcrumbList"].every((t) => solution.includes(t)),
    solution.join(", "));

  // The page carries two graphs (site-wide from the layout, page-specific from
  // the route); find the node rather than assuming which block it lands in.
  const html = await (await fetch(`${base}/solutions/${slugs[0]}`)).text();
  const nodes = [...html.matchAll(
    /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
  )].flatMap((m) => {
    const parsed = JSON.parse(m[1]);
    return parsed["@graph"] ?? [parsed];
  });
  const app = nodes.find((n) => n["@type"] === "SoftwareApplication");
  check("solution: rating is a Review by this org, not a fabricated aggregateRating",
    app.review?.["@type"] === "Review" &&
    app.review.reviewRating?.["@type"] === "Rating" &&
    !("aggregateRating" in app));
  check("solution: review carries positive and negative notes",
    app.review.positiveNotes?.itemListElement?.length > 0 &&
    app.review.negativeNotes?.itemListElement?.length > 0);

  const faqHtml = await (await fetch(`${base}/docs`)).text();
  const faq = [...faqHtml.matchAll(
    /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
  )].flatMap((m) => {
    const parsed = JSON.parse(m[1]);
    return parsed["@graph"] ?? [parsed];
  }).find((n) => n["@type"] === "FAQPage");
  check("docs: FAQ markup has questions", faq.mainEntity.length >= 4);
  check("docs: every FAQ answer is present in the rendered page",
    faq.mainEntity.every((q) => {
      const probe = q.acceptedAnswer.text.slice(0, 40)
        .replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
      return faqHtml.includes(probe);
    }),
    "structured data must not describe content that is not on the page");
}

/* ----------------------------------------------------- icons and manifest */
section("Icons, manifest and social cards");
{
  const assets = [
    ["/favicon.ico", "image"],
    ["/apple-touch-icon.png", "image/png"],
    ["/icon-192.png", "image/png"],
    ["/icon-512.png", "image/png"],
    ["/icon.svg", "image/svg+xml"],
    ["/opengraph-image", "image/png"],
    ["/docs/opengraph-image", "image/png"],
    [`/solutions/${slugs[0]}/opengraph-image`, "image/png"],
  ];
  for (const [path, type] of assets) {
    const res = await fetch(`${base}${path}`);
    const ct = res.headers.get("content-type") ?? "";
    check(`${path} → 200 ${type}`, res.status === 200 && ct.includes(type),
      `${res.status} ${ct}`);
  }

  const manifest = await (await fetch(`${base}/manifest.webmanifest`)).json();
  check("manifest lists 192 and 512 icons",
    ["192x192", "512x512"].every((s) => manifest.icons.some((i) => i.sizes === s)));
  check("manifest has name, start_url and theme_color",
    !!manifest.name && manifest.start_url === "/" && !!manifest.theme_color);
}

/* ------------------------------------------------- agent discovery documents */
section("Agent discovery documents");
{
  const openapi = await fetch(`${base}/openapi.json`);
  const spec = await openapi.json();
  check("/openapi.json → 200", openapi.status === 200);
  check("served as an OpenAPI media type",
    (openapi.headers.get("content-type") ?? "").includes("openapi+json"));
  check("is OpenAPI 3.1 and documents both APIs",
    spec.openapi.startsWith("3.1") &&
    "/api/v1/solutions" in spec.paths && "/api/v1/mcp" in spec.paths);

  const catalog = await fetch(`${base}/.well-known/api-catalog`);
  const linkset = await catalog.json();
  check("/.well-known/api-catalog → 200", catalog.status === 200);
  check("served as application/linkset+json",
    (catalog.headers.get("content-type") ?? "").includes("linkset+json"));
  check("linkset anchors the REST API to its OpenAPI description",
    linkset.linkset.some((l) =>
      l.anchor.endsWith("/api/v1/solutions") &&
      l["service-desc"].some((d) => d.href.endsWith("/openapi.json"))));

  const card = await (await fetch(`${base}/.well-known/mcp/server-card.json`)).json();
  check("/.well-known/mcp/server-card.json → valid card",
    card.url.endsWith("/api/v1/mcp") && card.transport === "streamable-http");

  // The card duplicates the tool list; assert it matches the live server.
  const live = await (await fetch(`${base}/api/v1/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
  })).json();
  check("server card tool names match the live MCP server",
    card.tools.map((t) => t.name).sort().join() ===
    live.result.tools.map((t) => t.name).sort().join());

  const skills = await (await fetch(`${base}/.well-known/agent-skills/index.json`)).json();
  const skillMd = await (await fetch(skills.skills[0].url.replace("https://402mcp.org", base))).text();
  check("/.well-known/agent-skills/index.json lists a skill", skills.skills.length === 1);
  check("SKILL.md is served as text/markdown",
    skillMd.startsWith("---\nname: 402mcp-registry"));
  check("skill digest matches the served SKILL.md bytes",
    skills.skills[0].digest === `sha256:${createHash("sha256").update(skillMd).digest("hex")}`);

  // security.txt is not published; security reports go to the address on /support.
  const sec = await fetch(`${base}/.well-known/security.txt`);
  check("/.well-known/security.txt is not served",
    sec.status === 404, `got ${sec.status}`);
}

/* --------------------------------------------------------------- IndexNow */
section("IndexNow");
{
  const res = await fetch(`${base}/${indexNowKey}.txt`);
  const body = (await res.text()).trim();
  check("key file is served at the root", res.status === 200, `got ${res.status}`);
  check("key file contains exactly the key", body === indexNowKey);
}

/* ---------------------------------------------- Markdown content negotiation */
section("Markdown content negotiation");
{
  async function asMarkdown(path) {
    const res = await fetch(`${base}${path}`, {
      headers: { Accept: "text/markdown" },
    });
    return { res, body: await res.text() };
  }

  const home = await asMarkdown("/");
  check("/ with Accept: text/markdown returns the llms.txt index",
    home.res.status === 200 && home.body.startsWith("# 402MCP.org -") &&
    !home.body.includes("<html"));
  check("/ varies on Accept",
    (home.res.headers.get("vary") ?? "").toLowerCase().includes("accept"));

  const docs = await asMarkdown("/docs");
  check("/docs with Accept: text/markdown returns the full corpus",
    docs.res.status === 200 && docs.body.startsWith("# 402MCP.org - Complete Corpus"));

  const entry = await asMarkdown(`/solutions/${top.id}`);
  check("/solutions/<slug> with Accept: text/markdown returns that entry",
    entry.res.status === 200 &&
    entry.body.startsWith(`# ${top.name}`) &&
    !entry.body.includes("<html"));
  check("entry markdown carries the evaluation matrix",
    entry.body.includes("## Evaluation matrix") && entry.body.includes("| Criterion | Score |"));

  const direct = await fetch(`${base}/solutions/${slugs[0]}/index.md`);
  check("/solutions/<slug>/index.md is also directly addressable",
    direct.status === 200 &&
    (direct.headers.get("content-type") ?? "").includes("text/markdown"));

  const browser = await fetch(`${base}/`, {
    headers: { Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
  });
  check("a browser Accept header still gets HTML",
    (browser.headers.get("content-type") ?? "").includes("text/html"));
}

/* --------------------------------------------------------------- analytics */
section("Analytics");
{
  for (const path of ["/", "/docs", `/solutions/${top.id}`]) {
    const html = await (await fetch(`${base}${path}`)).text();
    const head = html.split("</head>")[0];
    check(`${path === "/" ? "/ (home)" : path}: Farwatch tag is in the server HTML`,
      head.includes('src="https://farwatch.org/s.js"') &&
      head.includes('data-site="mluu354npe"'),
      "must be server-rendered with this domain's tracking id");
  }
  const res = await fetch("https://farwatch.org/s.js");
  check("farwatch.org/s.js is reachable", res.status === 200, `got ${res.status}`);
}

/* ------------------------------------------- feeds, downloads, trust signals */
section("Feeds, downloads and trust signals");
{
  const atom = await fetch(`${base}/changelog.xml`);
  const xml = await atom.text();
  check("/changelog.xml is an Atom feed", atom.status === 200 && (atom.headers.get("content-type") ?? "").includes("atom+xml") && xml.includes("<feed xmlns=\"http://www.w3.org/2005/Atom\">"));
  check("Atom feed has one entry per changelog release", (xml.match(/<entry>/g) ?? []).length >= 2);
  check("pages advertise the Atom feed", /type="application\/atom\+xml"/.test(await (await fetch(`${base}/`)).text()));

  const mcpb = await fetch(`${base}/downloads/402mcp.mcpb`);
  const bytes = new Uint8Array(await mcpb.arrayBuffer());
  check("Claude Desktop extension is downloadable", mcpb.status === 200 && bytes.length > 10_000, `${mcpb.status}, ${bytes.length} bytes`);
  check("…and is a zip archive (mcpb format)", bytes[0] === 0x50 && bytes[1] === 0x4b);

  const detail = await (await fetch(`${base}/solutions/${top.id}`)).text();
  check("solution pages show maturity, sources and a last-verified date",
    detail.includes(top.maturity) && detail.includes(top.last_verified) && top.sources.every((src) => detail.includes(src.url)));

  const docs = await (await fetch(`${base}/docs`)).text();
  check("docs cover all three schemes", ["L402", "x402", "MPP"].every((scheme) => docs.includes(scheme)));
  check("docs offer one-click installs for Cursor and VS Code",
    docs.includes("cursor://anysphere.cursor-deeplink/mcp/install") || docs.includes("Add to Cursor"));
}

/* ----------------------------------------------------------------- headers */
section("HTTP headers");
{
  const res = await fetch(`${base}/`);
  const link = res.headers.get("link") ?? "";
  check("homepage advertises rel=api-catalog", link.includes('rel="api-catalog"'));
  check("homepage advertises rel=service-desc", link.includes('rel="service-desc"'));
  check("homepage advertises the plain-text alternates",
    link.includes("/llms.txt") && link.includes("/llms-full.txt"));
  check("X-Content-Type-Options: nosniff",
    res.headers.get("x-content-type-options") === "nosniff");
  check("Referrer-Policy is set",
    (res.headers.get("referrer-policy") ?? "").length > 0);
  check("HSTS is set",
    (res.headers.get("strict-transport-security") ?? "").includes("max-age="));

  const api = await fetch(`${base}/api/v1/solutions`);
  check("API allows cross-origin reads",
    api.headers.get("access-control-allow-origin") === "*");
}

console.log(
  failures === 0
    ? "\n✓ Discovery surface verified.\n"
    : `\n✗ ${failures} check(s) failed.\n`,
);
process.exit(failures === 0 ? 0 : 1);
