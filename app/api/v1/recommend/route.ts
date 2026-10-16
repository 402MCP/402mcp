import { PAYMENT_SCHEMES, rankedSolutions, type PaymentScheme } from "@/data/solutions";
import { CORS, jsonError, preflight } from "@/lib/http";
import { recommendRails, type RecommendInput } from "@/lib/recommend";

/**
 * GET /api/v1/recommend — REST equivalent of the recommend_payment_rail tool.
 * Query: role, typical_amount_usd, settlement_asset, custody, infrastructure,
 * chain, scheme, needs_mcp, production_only, limit.
 */
export const dynamic = "force-dynamic";

const ENUMS = {
  role: ["pay", "charge"],
  settlement_asset: ["bitcoin", "stablecoin", "card", "any"],
  custody: ["self", "any"],
  infrastructure: ["none", "can-run-node"],
  scheme: [...PAYMENT_SCHEMES],
} as const;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const input: RecommendInput = {};

  for (const [name, allowed] of Object.entries(ENUMS)) {
    const value = params.get(name);
    if (value === null) continue;
    if (!(allowed as readonly string[]).includes(value)) {
      return jsonError(400, `${name} must be one of: ${allowed.join(", ")}.`);
    }
    (input as Record<string, unknown>)[name] = value as PaymentScheme;
  }

  const amount = params.get("typical_amount_usd");
  if (amount !== null) {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed < 0) return jsonError(400, "typical_amount_usd must be a non-negative number.");
    input.typical_amount_usd = parsed;
  }
  const limit = params.get("limit");
  if (limit !== null) input.limit = Number(limit);
  const chain = params.get("chain");
  if (chain) input.chain = chain;
  for (const flag of ["needs_mcp", "production_only"] as const) {
    const value = params.get(flag);
    if (value !== null) input[flag] = value === "true" || value === "1";
  }

  return Response.json(recommendRails(rankedSolutions, input), {
    headers: { ...CORS, "Cache-Control": "public, max-age=0, s-maxage=600" },
  });
}

export const OPTIONS = () => preflight();
