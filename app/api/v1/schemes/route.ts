import { rankedSolutions, SITE_URL } from "@/data/solutions";
import { cachedJson, preflight } from "@/lib/http";
import { SCHEME_REFERENCES } from "@/lib/schemes";

/** GET /api/v1/schemes — wire-format reference for L402, x402 and MPP. */
export async function GET(request: Request) {
  return cachedJson(request, {
    schemes: SCHEME_REFERENCES.map((reference) => ({
      ...reference,
      implementations: rankedSolutions
        .filter((s) => s.schemes.includes(reference.scheme))
        .map((s) => ({ id: s.id, name: s.name, roles: s.roles, kind: s.kind, url: `${SITE_URL}/solutions/${s.id}` })),
    })),
  });
}

export const OPTIONS = () => preflight();
