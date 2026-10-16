import { REGISTRY_UPDATED, SITE_URL, rankedSolutions } from "@/data/solutions";

/**
 * GET /robots.txt
 *
 * Hand-authored rather than generated from Next's `robots.ts` metadata helper,
 * because that helper cannot emit a `Content-Signal` line or per-agent comments.
 *
 * The policy is deliberately permissive: this registry exists to be read by
 * machines, so search indexing, AI input (RAG / grounding) and AI training are
 * all granted explicitly. Named AI crawlers are listed individually so that a
 * crawler which treats an unlisted agent as "unknown, assume deny" still sees
 * an explicit Allow.
 */
/** Major AI and search crawlers, granted the same access as everyone else. */
const NAMED_AGENTS = [
  "Googlebot",
  "Google-Extended",
  "Bingbot",
  "DuckDuckBot",
  "YandexBot",
  "Applebot",
  "Applebot-Extended",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Amazonbot",
  "Meta-ExternalAgent",
  "CCBot",
  "cohere-ai",
  "DuckAssistBot",
  "MistralAI-User",
];

export async function GET() {
  const body = `# 402MCP.org — the open registry for agentic commerce & HTTP 402.
#
# This site is built to be read by machines. Crawling, indexing, retrieval and
# training are all permitted. Start here:
#
#   /llms.txt                 zero-shot index
#   /llms-full.txt            the complete corpus as Markdown
#   /api/v1/registry          the registry as JSON (schema: /schema/v1/registry.json)
#   /api/v1/decode            decode any HTTP 402 response (POST)
#   /api/v1/recommend         choose a payment rail from requirements
#   /api/v1/mcp               native MCP server (JSON-RPC 2.0)
#   /.well-known/402.json     protocol discovery manifest
#   /openapi.json             OpenAPI 3.1 description of the REST API
#   /.well-known/api-catalog  RFC 9727 linkset of every machine interface
#   /changelog.xml            Atom feed of registry changes
#
# Registry last updated: ${REGISTRY_UPDATED}
# Indexed solutions: ${rankedSolutions.length}

User-agent: *
Allow: /
Content-Signal: search=yes, ai-input=yes, ai-train=yes

${NAMED_AGENTS.map((agent) => `User-agent: ${agent}\nAllow: /`).join("\n\n")}

Sitemap: ${SITE_URL}/sitemap.xml
`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
