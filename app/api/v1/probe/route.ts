import { hostedProbe, RATE_LIMITED_PROBE } from "@/lib/hosted";
import { CORS, jsonError, preflight } from "@/lib/http";

/**
 * GET /api/v1/probe?url=<https://…>&method=GET|HEAD — REST equivalent of the
 * probe_402_support tool. Rate limited per client; private addresses refused.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const url = params.get("url");
  if (!url) return jsonError(400, "Pass the endpoint to probe as ?url=https://…");
  const method = params.get("method") === "HEAD" ? "HEAD" : "GET";

  const result = await hostedProbe(request, url, method);
  if (!result) {
    return Response.json({ ...RATE_LIMITED_PROBE, url }, { status: 429, headers: { ...CORS, "Retry-After": "60" } });
  }
  return Response.json(result, { headers: { ...CORS, "Cache-Control": "no-store" } });
}

export const OPTIONS = () => preflight();
