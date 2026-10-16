import { rankedSolutions, SITE_URL } from "@/data/solutions";
import { decode402, type DecodeInput } from "@/lib/decode/index";
import { CORS, jsonError, preflight } from "@/lib/http";

/**
 * POST /api/v1/decode — REST equivalent of the decode_402_challenge tool.
 * Body: { status?, headers?, body?, raw_response? }.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let input: DecodeInput;
  try {
    input = (await request.json()) as DecodeInput;
  } catch {
    return jsonError(400, "Body must be JSON: { status?, headers?, body?, raw_response? }.");
  }
  if (!input || (input.headers == null && input.body == null && input.raw_response == null)) {
    return jsonError(400, "Provide raw_response, or status with headers (and body for x402 v1).");
  }

  const result = decode402(input);
  const compatible_payers = rankedSolutions
    .filter((s) => s.roles.includes("pay") && s.schemes.some((scheme) => result.schemes.includes(scheme)))
    .map((s) => ({ id: s.id, name: s.name, install: s.mcp_command, url: `${SITE_URL}/solutions/${s.id}` }));

  return Response.json(
    { ...result, compatible_payers },
    { headers: { ...CORS, "Cache-Control": "no-store" } },
  );
}

export const OPTIONS = () => preflight("POST, OPTIONS");
