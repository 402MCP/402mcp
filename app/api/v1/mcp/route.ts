import { hostedMcpContext } from "@/lib/hosted";
import { handleMcpPayload, parseFailure } from "@/lib/mcp/server";
import { toolDefinitions } from "@/lib/mcp/tools";
import { MCP_PROTOCOL_VERSION, SERVER_VERSION } from "@/lib/version";
import { SITE_URL } from "@/data/solutions";

/**
 * POST /api/v1/mcp — native Model Context Protocol server (stateless,
 * streamable HTTP, JSON responses).
 *
 * All protocol logic lives in lib/mcp so this endpoint and the `402mcp` stdio
 * package serve exactly the same tools, resources and prompts.
 */
export const dynamic = "force-dynamic";

const JSON_HEADERS = { "Content-Type": "application/json", "Cache-Control": "no-store" } as const;

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    const { status, body } = parseFailure();
    return Response.json(body, { status, headers: JSON_HEADERS });
  }

  const { status, body } = await handleMcpPayload(payload, hostedMcpContext(request));
  if (status === 202) return new Response(null, { status: 202 });
  return Response.json(body, { status, headers: JSON_HEADERS });
}

/**
 * The streamable-HTTP transport uses GET to open an SSE stream. This server is
 * stateless with nothing to push, so it declines per spec — with a descriptor
 * rather than an empty body.
 */
export async function GET(request: Request) {
  return Response.json(
    {
      name: "402mcp.org",
      version: SERVER_VERSION,
      transport: "streamable-http",
      protocol_version: MCP_PROTOCOL_VERSION,
      message: "Stateless MCP endpoint without SSE. Send JSON-RPC 2.0 requests via POST.",
      methods: ["initialize", "ping", "tools/list", "tools/call", "resources/list", "resources/templates/list", "resources/read", "prompts/list", "prompts/get"],
      tools: toolDefinitions(hostedMcpContext(request)).map((tool) => tool.name),
      endpoint: `${SITE_URL}/api/v1/mcp`,
    },
    { status: 405, headers: { ...JSON_HEADERS, Allow: "POST, OPTIONS" } },
  );
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: "POST, OPTIONS",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept, MCP-Protocol-Version, Mcp-Session-Id",
    },
  });
}
