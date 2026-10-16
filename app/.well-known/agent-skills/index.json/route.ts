import { REGISTRY_UPDATED, SITE_URL } from "@/data/solutions";
import { SKILL_MD, SKILL_NAME } from "@/lib/skill";

/**
 * GET /.well-known/agent-skills/index.json
 *
 * The digest is computed from the served SKILL.md bytes at request time via
 * Web Crypto, so it cannot drift from the document — the usual failure mode of
 * a hand-maintained hash.
 */
async function sha256(input: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function GET() {
  const digest = await sha256(SKILL_MD);

  return Response.json(
    {
      version: "1.0",
      updated: REGISTRY_UPDATED,
      skills: [
        {
          name: SKILL_NAME,
          title: "402MCP.org registry",
          description:
            "Look up, compare and choose HTTP 402 payment infrastructure for autonomous AI agents using the 402MCP.org registry.",
          url: `${SITE_URL}/.well-known/agent-skills/${SKILL_NAME}/SKILL.md`,
          digest: `sha256:${digest}`,
          license: "CC-BY-4.0",
          keywords: [
            "http 402",
            "payment required",
            "l402",
            "x402",
            "agent payments",
            "micropayments",
            "machine-to-machine commerce",
          ],
        },
      ],
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
