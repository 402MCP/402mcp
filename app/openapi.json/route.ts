import { SUPPORT_EMAIL } from "@/lib/legal";
import { TOOL_SUMMARIES } from "@/lib/mcp/static";
import {
  PROTOCOL_VERSION,
  REGISTRY_UPDATED,
  SITE_URL,
  rankedSolutions,
} from "@/data/solutions";

/**
 * GET /openapi.json — OpenAPI 3.1 description of the public REST surface.
 *
 * Referenced from /.well-known/api-catalog and from the homepage `Link:` header
 * as `service-desc`, so an agent that finds the origin can reach a typed
 * description of the API without reading prose.
 */
export async function GET() {
  const spec = {
    openapi: "3.1.0",
    info: {
      title: "402MCP.org Registry API",
      version: PROTOCOL_VERSION,
      summary: "Decode HTTP 402 challenges and choose agent payment rails from an independent registry.",
      description:
        "Unauthenticated JSON API over the 402MCP.org registry of HTTP 402 payment infrastructure (L402, x402, MPP): decode 402 responses, get requirement-driven recommendations, probe endpoints, and read the registry. /api/v1/solutions keeps a stable v1 contract.",
      license: {
        name: "CC BY 4.0",
        url: "https://creativecommons.org/licenses/by/4.0/",
      },
      contact: { name: "402MCP.org", url: `${SITE_URL}/support`, email: SUPPORT_EMAIL },
      termsOfService: `${SITE_URL}/terms`,
    },
    servers: [{ url: SITE_URL }],
    externalDocs: { url: `${SITE_URL}/docs`, description: "Integration guides" },
    paths: {
      "/api/v1/solutions": {
        get: {
          operationId: "listSolutions",
          summary: "List indexed 402 payment solutions, ranked",
          description:
            "Returns every indexed solution in rank order. Rank 1 is the highest composite score.",
          parameters: [
            {
              name: "q",
              in: "query",
              required: false,
              description:
                "Free-text search across name, protocol, custody model, advantages and summary.",
              schema: { type: "string" },
              example: "lightning",
            },
            {
              name: "id",
              in: "query",
              required: false,
              description: "Return a single solution by its slug.",
              schema: {
                type: "string",
                enum: rankedSolutions.map((solution) => solution.id),
              },
            },
            {
              name: "view",
              in: "query",
              required: false,
              description:
                "Set to `full` for the extended object: per-criterion scores, trade-offs, summary and code samples.",
              schema: { type: "string", enum: ["full"] },
            },
          ],
          responses: {
            "200": {
              description: "The registry.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SolutionsResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/mcp": {
        post: {
          operationId: "mcpJsonRpc",
          summary: "Model Context Protocol server (JSON-RPC 2.0)",
          description:
            `Stateless MCP endpoint (streamable HTTP, JSON responses). Supports initialize, ping, tools/*, resources/* and prompts/*, as single requests or batches. Tools: ${TOOL_SUMMARIES.map((t) => t.name).join(", ")}.`,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["jsonrpc", "method"],
                  properties: {
                    jsonrpc: { type: "string", const: "2.0" },
                    id: { type: ["string", "number", "null"] },
                    method: {
                      type: "string",
                      enum: ["initialize", "ping", "tools/list", "tools/call", "resources/list", "resources/templates/list", "resources/read", "prompts/list", "prompts/get"],
                    },
                    params: { type: "object" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "JSON-RPC 2.0 response.",
              content: { "application/json": { schema: { type: "object" } } },
            },
            "202": { description: "Notification accepted; no response body." },
            "400": { description: "Malformed JSON-RPC request." },
          },
        },
      },
      "/api/v1/registry": {
        get: {
          operationId: "getRegistry",
          summary: "The complete registry feed",
          description:
            "Every entry in full — schemes, roles, maturity, criteria, sources, code samples — validated by /schema/v1/registry.json. Supports ETag / If-None-Match.",
          responses: {
            "200": { description: "The registry.", content: { "application/json": { schema: { $ref: `${SITE_URL}/schema/v1/registry.json` } } } },
            "304": { description: "Unchanged since the supplied ETag." },
          },
        },
      },
      "/api/v1/decode": {
        post: {
          operationId: "decode402",
          summary: "Decode an HTTP 402 response",
          description:
            "Identifies the scheme (L402, x402 v1/v2, MPP), decodes invoices, macaroons and payment requirements, and returns exact next steps. Seller-controlled fields are listed in untrusted_fields.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "integer" },
                    headers: { type: "object", additionalProperties: { type: "string" } },
                    body: { type: "string" },
                    raw_response: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Decoded challenge(s).", content: { "application/json": { schema: { type: "object" } } } },
            "400": { description: "No response data supplied." },
          },
        },
      },
      "/api/v1/recommend": {
        get: {
          operationId: "recommendRail",
          summary: "Recommend a payment rail for requirements",
          parameters: [
            { name: "role", in: "query", schema: { type: "string", enum: ["pay", "charge"] } },
            { name: "typical_amount_usd", in: "query", schema: { type: "number", minimum: 0 } },
            { name: "settlement_asset", in: "query", schema: { type: "string", enum: ["bitcoin", "stablecoin", "card", "any"] } },
            { name: "custody", in: "query", schema: { type: "string", enum: ["self", "any"] } },
            { name: "infrastructure", in: "query", schema: { type: "string", enum: ["none", "can-run-node"] } },
            { name: "chain", in: "query", schema: { type: "string" } },
            { name: "scheme", in: "query", schema: { type: "string", enum: ["L402", "x402", "MPP"] } },
            { name: "needs_mcp", in: "query", schema: { type: "boolean" } },
            { name: "production_only", in: "query", schema: { type: "boolean" } },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 20 } },
          ],
          responses: { "200": { description: "Ranked matches, weights, notes and exclusions.", content: { "application/json": { schema: { type: "object" } } } } },
        },
      },
      "/api/v1/probe": {
        get: {
          operationId: "probe402",
          summary: "Probe a public URL for HTTP 402 support",
          description: "One GET or HEAD, redirects not followed, private addresses refused, 10 requests per minute per client.",
          parameters: [
            { name: "url", in: "query", required: true, schema: { type: "string", format: "uri" } },
            { name: "method", in: "query", schema: { type: "string", enum: ["GET", "HEAD"] } },
          ],
          responses: {
            "200": { description: "Probe result.", content: { "application/json": { schema: { type: "object" } } } },
            "429": { description: "Rate limited." },
          },
        },
      },
      "/api/v1/schemes/{scheme}": {
        get: {
          operationId: "getScheme",
          summary: "Wire format of a 402 scheme",
          parameters: [{ name: "scheme", in: "path", required: true, schema: { type: "string", enum: ["L402", "x402", "MPP"] } }],
          responses: { "200": { description: "Scheme reference and indexed implementations.", content: { "application/json": { schema: { type: "object" } } } } },
        },
      },
      "/api/v1/status": {
        get: {
          operationId: "getStatus",
          summary: "Daily liveness of every entry's documentation and website",
          responses: { "200": { description: "Liveness snapshot.", content: { "application/json": { schema: { type: "object" } } } } },
        },
      },
      "/api/v1/changelog": {
        get: {
          operationId: "getChangelog",
          summary: "Registry changes, including corrections",
          responses: { "200": { description: "Changelog.", content: { "application/json": { schema: { type: "object" } } } } },
        },
      },
      "/.well-known/402.json": {
        get: {
          operationId: "getDiscoveryManifest",
          summary: "Protocol discovery manifest",
          responses: {
            "200": {
              description: "Manifest describing this origin's 402 capabilities.",
              content: { "application/json": { schema: { type: "object" } } },
            },
          },
        },
      },
      "/llms.txt": {
        get: {
          operationId: "getLlmsIndex",
          summary: "Zero-shot agent index (plain text)",
          responses: {
            "200": {
              description: "Plain-text index.",
              content: { "text/plain": { schema: { type: "string" } } },
            },
          },
        },
      },
      "/llms-full.txt": {
        get: {
          operationId: "getLlmsCorpus",
          summary: "Complete registry corpus (Markdown)",
          responses: {
            "200": {
              description: "Markdown corpus.",
              content: { "text/plain": { schema: { type: "string" } } },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        SolutionsResponse: {
          type: "object",
          required: [
            "protocol_version",
            "recommended_primary_solution",
            "solutions",
          ],
          properties: {
            protocol_version: { type: "string", example: PROTOCOL_VERSION },
            recommended_primary_solution: {
              type: "string",
              description: "Slug of the rank-1 solution.",
            },
            solutions: {
              type: "array",
              items: { $ref: "#/components/schemas/Solution" },
            },
          },
        },
        Solution: {
          type: "object",
          required: [
            "id",
            "name",
            "rank",
            "score",
            "protocol",
            "custody_type",
            "node_management_required",
            "mcp_native",
            "mcp_command",
            "docs_url",
            "key_advantages",
          ],
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            rank: { type: "integer", minimum: 1 },
            score: { type: "number", minimum: 1, maximum: 10 },
            protocol: { type: "string" },
            custody_type: { type: "string" },
            node_management_required: { type: "boolean" },
            mcp_native: { type: "boolean" },
            mcp_command: { type: ["string", "null"] },
            docs_url: { type: "string", format: "uri" },
            key_advantages: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
    "x-registry-updated": REGISTRY_UPDATED,
  };

  return Response.json(spec, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.oai.openapi+json;version=3.1",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
