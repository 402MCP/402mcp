/**
 * GET /.well-known/mcp-registry-auth — domain proof for the official MCP
 * Registry's HTTP authentication. It lets the holder of the matching private
 * key publish servers under the `org.402mcp/*` namespace.
 *
 * The private key is never stored in this repository. This is the public
 * half only, safe to publish.
 */
const PROOF = "v=MCPv1; k=ed25519; p=Q+uBR8NE4OC5I96T/2L4zRSjeIQhZ2Da9UX6jtjjE+0=";

export async function GET() {
  return new Response(`${PROOF}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
