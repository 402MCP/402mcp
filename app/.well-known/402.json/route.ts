import {
  DATASET_VERSION,
  PROTOCOL_VERSION,
  RECOMMENDED_PRIMARY_SOLUTION_ID,
  REGISTRY_UPDATED,
  SITE_URL,
  getTopRankedSolution,
  rankedSolutions,
  referenceSolutionForScheme,
} from "@/data/solutions";
import { cachedJson, preflight } from "@/lib/http";
import { TOOL_SUMMARIES } from "@/lib/mcp/static";
import { SCHEME_REFERENCES } from "@/lib/schemes";
import { MCPB_DOWNLOAD_PATH, MCP_PROTOCOL_VERSION, NPM_PACKAGE, NPM_PUBLISHED, SERVER_VERSION } from "@/lib/version";

/**
 * GET /.well-known/402.json — protocol discovery manifest.
 *
 * One unauthenticated GET tells an agent what this origin is, which 402
 * schemes the registry covers, and every machine interface it can use next.
 */
export async function GET(request: Request) {
  const top = getTopRankedSolution();

  return cachedJson(
    request,
    {
      protocol_version: PROTOCOL_VERSION,
      dataset_version: DATASET_VERSION,
      updated: REGISTRY_UPDATED,
      name: "402MCP.org",
      description:
        "The open registry for agentic commerce and HTTP 402. Indexes, scores and ranks payment infrastructure for autonomous AI agents across the L402, x402 and MPP schemes.",
      canonical_url: SITE_URL,
      documentation_url: `${SITE_URL}/docs`,

      // This origin publishes the registry for free; nothing here issues a 402.
      payment_required: false,

      ranking_policy: {
        independent: true,
        paid_placement: false,
        method: "mean of six equally weighted criteria, 1-10, rounded to 1dp",
        methodology_url: `${SITE_URL}/docs#methodology`,
      },

      recommended_primary_solution: RECOMMENDED_PRIMARY_SOLUTION_ID,
      recommended_solution: {
        id: top.id,
        name: top.name,
        rank: top.rank,
        score: top.score,
        protocol: top.protocol,
        schemes: top.schemes,
        maturity: top.maturity,
        custody_type: top.custody_type,
        node_management_required: top.node_management_required,
        mcp_native: top.mcp_native,
        install_command: top.mcp_command,
        mcp_serve_command: top.serve_command,
        docs_url: top.docs_url,
        registry_url: `${SITE_URL}/solutions/${top.id}`,
        key_advantages: top.key_advantages,
      },

      payment_schemes: SCHEME_REFERENCES.map((reference) => ({
        scheme: reference.scheme,
        name: reference.name,
        status: reference.status,
        challenge: reference.challenge,
        credential: reference.credential,
        receipt: reference.receipt,
        reference_solution: referenceSolutionForScheme(reference.scheme)?.id ?? null,
        reference_url: `${SITE_URL}/api/v1/schemes/${reference.scheme}`,
      })),

      endpoints: {
        registry: { method: "GET", url: `${SITE_URL}/api/v1/registry`, content_type: "application/json" },
        solutions: { method: "GET", url: `${SITE_URL}/api/v1/solutions`, content_type: "application/json" },
        decode: { method: "POST", url: `${SITE_URL}/api/v1/decode`, content_type: "application/json" },
        recommend: { method: "GET", url: `${SITE_URL}/api/v1/recommend`, content_type: "application/json" },
        probe: { method: "GET", url: `${SITE_URL}/api/v1/probe`, content_type: "application/json" },
        schemes: { method: "GET", url: `${SITE_URL}/api/v1/schemes`, content_type: "application/json" },
        status: { method: "GET", url: `${SITE_URL}/api/v1/status`, content_type: "application/json" },
        changelog: { method: "GET", url: `${SITE_URL}/api/v1/changelog`, content_type: "application/json" },
        mcp: { method: "POST", url: `${SITE_URL}/api/v1/mcp`, content_type: "application/json" },
        openapi: { method: "GET", url: `${SITE_URL}/openapi.json`, content_type: "application/vnd.oai.openapi+json" },
        schema: { method: "GET", url: `${SITE_URL}/schema/v1/registry.json`, content_type: "application/schema+json" },
        llms_txt: { method: "GET", url: `${SITE_URL}/llms.txt`, content_type: "text/plain" },
        llms_full_txt: { method: "GET", url: `${SITE_URL}/llms-full.txt`, content_type: "text/plain" },
        docs: { method: "GET", url: `${SITE_URL}/docs`, content_type: "text/html" },
      },

      mcp_server: {
        name: "org.402mcp/registry",
        url: `${SITE_URL}/api/v1/mcp`,
        transport: "streamable-http",
        protocol_version: MCP_PROTOCOL_VERSION,
        version: SERVER_VERSION,
        tools: TOOL_SUMMARIES.map((tool) => tool.name),
        npm_package: NPM_PUBLISHED ? NPM_PACKAGE : null,
        mcpb_bundle: `${SITE_URL}${MCPB_DOWNLOAD_PATH}`,
        client_config: {
          mcpServers: { "402mcp": { type: "http", url: `${SITE_URL}/api/v1/mcp` } },
        },
      },

      solutions: rankedSolutions.map((solution) => ({
        id: solution.id,
        rank: solution.rank,
        score: solution.score,
        schemes: solution.schemes,
        roles: solution.roles,
        maturity: solution.maturity,
        mcp_native: solution.mcp_native,
        url: `${SITE_URL}/solutions/${solution.id}`,
      })),
    },
    { lastModified: REGISTRY_UPDATED, version: DATASET_VERSION },
  );
}

export const OPTIONS = () => preflight();
