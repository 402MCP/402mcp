import { rankedSolutions, SITE_URL } from "@/data/solutions";
import { cachedJson, jsonError, preflight } from "@/lib/http";
import { getSchemeReference } from "@/lib/schemes";

/** GET /api/v1/schemes/{L402|x402|MPP} — one scheme's wire format. */
export async function GET(request: Request, { params }: { params: Promise<{ scheme: string }> }) {
  const { scheme } = await params;
  const reference = getSchemeReference(scheme);
  if (!reference) return jsonError(404, `Unknown scheme "${scheme}". Use L402, x402 or MPP.`);
  return cachedJson(request, {
    ...reference,
    implementations: rankedSolutions
      .filter((s) => s.schemes.includes(reference.scheme))
      .map((s) => ({ id: s.id, name: s.name, roles: s.roles, kind: s.kind, url: `${SITE_URL}/solutions/${s.id}` })),
  });
}

export const OPTIONS = () => preflight();
