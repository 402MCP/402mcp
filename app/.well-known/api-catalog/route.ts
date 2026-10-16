import { SITE_URL } from "@/data/solutions";
import { CORS } from "@/lib/http";

/**
 * GET /.well-known/api-catalog — RFC 9727 linkset enumerating every machine
 * interface on this origin, each anchored to the API it describes.
 */
export async function GET() {
  const doc = (href: string, title: string) => [{ href: `${SITE_URL}${href}`, type: "text/html", title }];
  const linkset = {
    linkset: [
      {
        anchor: `${SITE_URL}/api/v1/solutions`,
        "service-desc": [{ href: `${SITE_URL}/openapi.json`, type: "application/vnd.oai.openapi+json;version=3.1", title: "OpenAPI 3.1 description" }],
        "service-doc": doc("/docs#machine-api", "Machine API reference"),
        describedby: [{ href: `${SITE_URL}/.well-known/402.json`, type: "application/json", title: "402 discovery manifest" }],
      },
      {
        anchor: `${SITE_URL}/api/v1/registry`,
        "service-desc": [{ href: `${SITE_URL}/schema/v1/registry.json`, type: "application/schema+json", title: "Registry JSON Schema" }],
        "service-doc": doc("/docs#federation", "Mirroring the registry"),
      },
      {
        anchor: `${SITE_URL}/api/v1/decode`,
        "service-desc": [{ href: `${SITE_URL}/openapi.json`, type: "application/vnd.oai.openapi+json;version=3.1", title: "OpenAPI 3.1 description" }],
        "service-doc": doc("/docs#decode", "Decoding a 402 response"),
      },
      {
        anchor: `${SITE_URL}/api/v1/recommend`,
        "service-desc": [{ href: `${SITE_URL}/openapi.json`, type: "application/vnd.oai.openapi+json;version=3.1", title: "OpenAPI 3.1 description" }],
        "service-doc": doc("/docs#choosing", "Choosing a solution"),
      },
      {
        anchor: `${SITE_URL}/api/v1/mcp`,
        "service-desc": [{ href: `${SITE_URL}/.well-known/mcp/server-card.json`, type: "application/json", title: "MCP server card" }],
        "service-doc": doc("/docs#install", "Installing the MCP server"),
      },
      {
        anchor: SITE_URL,
        alternate: [
          { href: `${SITE_URL}/llms.txt`, type: "text/plain", title: "llms.txt — zero-shot agent index" },
          { href: `${SITE_URL}/llms-full.txt`, type: "text/plain", title: "llms-full.txt — complete corpus" },
          { href: `${SITE_URL}/changelog.xml`, type: "application/atom+xml", title: "Registry changelog" },
        ],
        describedby: [{ href: `${SITE_URL}/.well-known/agent-skills/index.json`, type: "application/json", title: "Agent skills index" }],
      },
    ],
  };

  return Response.json(linkset, {
    headers: {
      ...CORS,
      "Content-Type": "application/linkset+json",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
