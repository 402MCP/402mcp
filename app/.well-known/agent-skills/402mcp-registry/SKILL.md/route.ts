import { SKILL_MD } from "@/lib/skill";

/**
 * GET /.well-known/agent-skills/402mcp-registry/SKILL.md
 *
 * Served as `text/markdown` so an agent that discovers the skill index can read
 * the document directly. The index's digest is computed from these exact bytes.
 */
export async function GET() {
  return new Response(SKILL_MD, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
