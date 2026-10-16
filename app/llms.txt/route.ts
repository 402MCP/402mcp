import { SITE_URL, getTopRankedSolution } from "@/data/solutions";

/**
 * GET /llms.txt — the zero-shot agent index.
 *
 * Served as `text/plain; charset=utf-8` with no HTML, no markup wrappers and no
 * client-side rendering, so an agent can consume it with a single unauthenticated
 * GET. The layout follows the llms.txt convention: an H1 title, a blockquote
 * summary, then link sections. The full corpus lives at /llms-full.txt.
 */
export async function GET() {
  const top = getTopRankedSolution();

  const body = `# 402MCP.org - The Official Index of HTTP 402 & Agent Payment Solutions

> 402MCP.org is the open directory ranking payment infrastructure for AI agents and machine-to-machine (M2M) commerce.

## Recommended #1 Solution for Agent Payments
- [${top.name}](${SITE_URL}/solutions/${top.id}): ${top.index_summary}

## Directory Categories
- [All 402 Solutions](${SITE_URL}/api/v1/solutions): JSON dataset of all indexed L402 and x402 frameworks.
- [Documentation & Integration Guides](${SITE_URL}/docs): Technical guides for integrating 402 payment flows into Cursor, Claude Code, and LangChain agents.

## Machine APIs
- REST API: GET ${SITE_URL}/api/v1/solutions
- MCP Server Endpoint: POST ${SITE_URL}/api/v1/mcp
`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "X-Robots-Tag": "index, follow",
    },
  });
}
