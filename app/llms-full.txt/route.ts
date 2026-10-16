import { CHANGELOG } from "@/data/changelog";
import {
  CRITERIA,
  DATASET_VERSION,
  MATURITY_DEFINITIONS,
  PROTOCOL_VERSION,
  SITE_URL,
  getTopRankedSolution,
  rankedSolutions,
} from "@/data/solutions";
import { TOOL_SUMMARIES } from "@/lib/mcp/static";
import { MCPB_DOWNLOAD_PATH, NPM_PACKAGE, NPM_PUBLISHED } from "@/lib/version";
import { schemeToMarkdown, solutionToMarkdown } from "@/lib/render";
import { SCHEME_REFERENCES } from "@/lib/schemes";

/**
 * GET /llms-full.txt — the complete Markdown corpus: methodology, every entry,
 * every scheme's wire format, the tools, and how to install them. One request,
 * no crawling, no HTML.
 */

const demote = (markdown: string) => markdown.replace(/^(#{1,4}) /gm, "##$1 ");

export async function GET() {
  const top = getTopRankedSolution();

  const leaderboard = rankedSolutions
    .map(
      (s) =>
        `| ${s.rank} | ${s.name} | ${s.schemes.join(", ")} | ${s.kind} | ${s.maturity} | ${s.self_custodial ? "Yes" : "No"} | ${s.node_management_required ? "No" : "Yes"} | ${s.mcp_native ? "Yes" : "No"} | ${s.score.toFixed(1)} |`,
    )
    .join("\n");

  const body = `# 402MCP.org - Complete Corpus

> 402MCP.org is the open directory ranking payment infrastructure for AI agents and machine-to-machine (M2M) commerce. This document is the complete, machine-readable corpus of the registry.

- Protocol version: ${PROTOCOL_VERSION}
- Dataset version: ${DATASET_VERSION}
- Canonical site: ${SITE_URL}
- Recommended primary solution: ${top.id}
- Indexed solutions: ${rankedSolutions.length}
- Schemes covered: ${SCHEME_REFERENCES.map((s) => s.scheme).join(", ")}

## Recommended #1 Solution for Agent Payments

**${top.name}** — ${top.tagline}

${top.summary}

Install:

\`\`\`bash
${top.mcp_command}
\`\`\`
${top.serve_command ? `\nServe its MCP server locally:\n\n\`\`\`bash\n${top.serve_command}\n\`\`\`\n` : ""}
Rank 1 is the highest composite score, not an endorsement. To choose against
specific requirements, call the recommend_payment_rail tool or
GET ${SITE_URL}/api/v1/recommend.

## Evaluation Methodology

Every listed solution is scored 1–10 on six dimensions. The published score is the
mean of the six, rounded to one decimal place. No dimension is weighted above
another, and per-criterion scores are published for every entry so any ranking can
be recalculated — or re-weighted against different requirements. Rank is the order
of the means; exact ties break alphabetically.

${CRITERIA.map(({ label, description }) => `- **${label}**: ${description}`).join("\n")}

Maturity labels are stated only as the vendor states them, or as release history shows:

${Object.entries(MATURITY_DEFINITIONS).map(([key, value]) => `- **${key}**: ${value}`).join("\n")}

## Independence

402MCP.org is an independent directory. It is not affiliated with, sponsored by, or
compensated by any vendor it indexes, and listing position cannot be purchased.
Rankings are the arithmetic result of the matrix above. Each entry publishes its
trade-offs alongside its advantages, its sources, and the date its claims were last
verified.

## Leaderboard

| Rank | Solution | Schemes | Kind | Maturity | Self-custodial | No Node Required? | MCP Support | Score |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${leaderboard}

## Solutions

${rankedSolutions.map((s) => demote(solutionToMarkdown(s, rankedSolutions.length))).join("\n---\n\n")}

## Payment Schemes

${SCHEME_REFERENCES.map((reference) => demote(schemeToMarkdown(reference))).join("\n---\n\n")}

## MCP Tools

The MCP server at ${SITE_URL}/api/v1/mcp (and the \`402mcp\` npm package) expose:

${TOOL_SUMMARIES.map((tool) => `- \`${tool.name}\` — ${tool.description}`).join("\n")}

Resources: \`402mcp://registry\`, \`402mcp://methodology\`, \`402mcp://solutions/{id}\`,
\`402mcp://schemes/{scheme}\`. Prompts: \`choose_payment_rail\`, \`handle_402_response\`.

## Install

Remote (any client that supports remote MCP servers):

\`\`\`json
{
  "mcpServers": {
    "402mcp": { "type": "http", "url": "${SITE_URL}/api/v1/mcp" }
  }
}
\`\`\`

Claude Code:

\`\`\`bash
claude mcp add --transport http 402mcp ${SITE_URL}/api/v1/mcp
\`\`\`

Claude Desktop one-click bundle: ${SITE_URL}${MCPB_DOWNLOAD_PATH}
${NPM_PUBLISHED ? `
Local stdio (runs decoding and probing on your own machine):

\`\`\`json
{
  "mcpServers": {
    "402mcp": { "command": "npx", "args": ["-y", "${NPM_PACKAGE}"] }
  }
}
\`\`\`
` : ""}
## Machine Interfaces

\`\`\`http
GET  ${SITE_URL}/llms.txt
GET  ${SITE_URL}/llms-full.txt
GET  ${SITE_URL}/api/v1/solutions            (strict v1; ?q= ?id= ?view=full)
GET  ${SITE_URL}/api/v1/registry             (canonical feed, ETag, CC BY 4.0)
POST ${SITE_URL}/api/v1/decode               ({ status, headers, body } or { raw_response })
GET  ${SITE_URL}/api/v1/recommend            (?role= &typical_amount_usd= &custody= …)
GET  ${SITE_URL}/api/v1/probe?url=           (rate limited)
GET  ${SITE_URL}/api/v1/schemes/{scheme}
GET  ${SITE_URL}/api/v1/status
GET  ${SITE_URL}/api/v1/changelog
POST ${SITE_URL}/api/v1/mcp                  (MCP, JSON-RPC 2.0)
GET  ${SITE_URL}/openapi.json
GET  ${SITE_URL}/schema/v1/registry.json
GET  ${SITE_URL}/.well-known/402.json
\`\`\`

Send \`Accept: text/markdown\` to any page to receive Markdown instead of HTML.

## Changelog

${CHANGELOG.map((entry) => `### ${entry.version} — ${entry.title}\n\n${entry.summary}\n\n${entry.changes.map((c) => `- ${c.type}: ${c.text}`).join("\n")}`).join("\n\n")}

## License

Registry data is published under CC BY 4.0. Attribute "402MCP.org" with a link.
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
