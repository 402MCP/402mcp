import { PAYMENT_SCHEMES, SITE_NAME, SITE_URL } from "@/data/solutions";
import { cachedJson, preflight } from "@/lib/http";
import { TOOL_SUMMARIES } from "@/lib/mcp/static";
import { MCPB_DOWNLOAD_PATH, MCP_PROTOCOL_VERSION, NPM_PACKAGE, NPM_PUBLISHED, SERVER_VERSION } from "@/lib/version";

/**
 * GET /.well-known/mcp/server-card.json — lets a client find and configure the
 * MCP server from the origin alone. Tools are derived from the live
 * definitions, so the card cannot drift from the server.
 */
export async function GET(request: Request) {
  return cachedJson(request, {
    name: SITE_NAME,
    registry_name: "org.402mcp/registry",
    title: "402MCP.org — HTTP 402 & Agent Payment Registry",
    description:
      "Decode HTTP 402 challenges (L402, x402, MPP), choose a payment rail from requirements, and search an independent registry of agent payment infrastructure.",
    version: SERVER_VERSION,
    url: `${SITE_URL}/api/v1/mcp`,
    transport: "streamable-http",
    protocol_version: MCP_PROTOCOL_VERSION,
    authentication: { type: "none" },
    capabilities: {
      tools: { listChanged: false },
      resources: { listChanged: false, subscribe: false },
      prompts: { listChanged: false },
    },
    tools: TOOL_SUMMARIES.map(({ name, description }) => ({ name, description })),
    resources: ["402mcp://registry", "402mcp://methodology", "402mcp://solutions/{id}", ...PAYMENT_SCHEMES.map((s) => `402mcp://schemes/${s}`)],
    prompts: ["choose_payment_rail", "handle_402_response"],
    packages: NPM_PUBLISHED
      ? [{ registry: "npm", name: NPM_PACKAGE, transport: "stdio", command: `npx -y ${NPM_PACKAGE}` }]
      : [],
    bundles: [{ format: "mcpb", url: `${SITE_URL}${MCPB_DOWNLOAD_PATH}`, client: "Claude Desktop" }],
    documentation: `${SITE_URL}/docs#agents`,
    client_config: {
      mcpServers: { "402mcp": { type: "http", url: `${SITE_URL}/api/v1/mcp` } },
    },
  });
}

export const OPTIONS = () => preflight();
