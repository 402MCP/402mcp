import { getCloudflareContext } from "@opennextjs/cloudflare";

import { DATASET_VERSION, REGISTRY_UPDATED, rankedSolutions } from "@/data/solutions";
import type { LivenessSnapshot, McpContext } from "@/lib/mcp/context";
import { checkProbeTarget, probe402, type ProbeResult } from "@/lib/probe";
import { MCPB_DOWNLOAD_PATH, NPM_PACKAGE, NPM_PUBLISHED } from "@/lib/version";

/**
 * Context for the hosted endpoints. Reads Cloudflare bindings when running on
 * Workers; under `next start` there are no bindings, so liveness is reported
 * as pending and probing runs unthrottled (local development only).
 */

function cloudflareEnv(): CloudflareEnv | null {
  try {
    return getCloudflareContext().env as CloudflareEnv;
  } catch {
    return null;
  }
}

export const LIVENESS_KEY = "liveness:latest";

export async function readLiveness(): Promise<LivenessSnapshot | null> {
  const env = cloudflareEnv();
  if (!env?.LIVENESS) return null;
  try {
    return ((await env.LIVENESS.get(LIVENESS_KEY, "json")) as LivenessSnapshot | null) ?? null;
  } catch {
    return null;
  }
}

function clientKey(request: Request): string {
  return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
}

/**
 * Rate-limited probe: returns null when the caller is over the limit. Targets
 * are validated first, so a refused URL — which never triggers a fetch — does
 * not spend the caller's budget.
 */
export async function hostedProbe(request: Request, url: string, method: "GET" | "HEAD"): Promise<ProbeResult | null> {
  if (checkProbeTarget(url).error) return probe402(url, { method });
  const env = cloudflareEnv();
  if (env?.PROBE_LIMITER) {
    const { success } = await env.PROBE_LIMITER.limit({ key: clientKey(request) });
    if (!success) return null;
  }
  return probe402(url, { method });
}

export const RATE_LIMITED_PROBE: ProbeResult = {
  url: "",
  reachable: false,
  status: null,
  elapsed_ms: 0,
  supports_402: false,
  schemes: [],
  location: null,
  headers: {},
  body_excerpt: null,
  decode: null,
  error: NPM_PUBLISHED
    ? `Rate limited: the hosted probe allows 10 requests per minute. Run \`npx -y ${NPM_PACKAGE}\` to probe from your own machine without limits.`
    : `Rate limited: the hosted probe allows 10 requests per minute. Try again shortly, or install the Claude Desktop extension (https://402mcp.org${MCPB_DOWNLOAD_PATH}) to probe from your own machine.`,
};

export function hostedMcpContext(request: Request): McpContext {
  return {
    solutions: rankedSolutions,
    datasetVersion: DATASET_VERSION,
    registryUpdated: REGISTRY_UPDATED,
    transport: "http",
    probe: async (url, method) =>
      (await hostedProbe(request, url, method)) ?? { ...RATE_LIMITED_PROBE, url },
    getLiveness: readLiveness,
  };
}
