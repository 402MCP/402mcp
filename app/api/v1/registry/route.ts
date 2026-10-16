import {
  CRITERIA,
  DATASET_VERSION,
  MATURITY_DEFINITIONS,
  PROTOCOL_VERSION,
  REGISTRY_UPDATED,
  SITE_URL,
  rankedSolutions,
} from "@/data/solutions";
import { cachedJson, preflight } from "@/lib/http";

/**
 * GET /api/v1/registry — the canonical, complete registry feed.
 *
 * Everything needed to mirror or federate the registry in one document,
 * validated by /schema/v1/registry.json. Supports ETag / If-None-Match, so
 * polling an unchanged registry costs a 304.
 */
export async function GET(request: Request) {
  return cachedJson(
    request,
    {
      $schema: `${SITE_URL}/schema/v1/registry.json`,
      protocol_version: PROTOCOL_VERSION,
      dataset_version: DATASET_VERSION,
      updated: REGISTRY_UPDATED,
      license: "CC-BY-4.0",
      attribution: "402MCP.org — https://402mcp.org",
      methodology_url: `${SITE_URL}/docs#methodology`,
      ranking_policy: {
        independent: true,
        paid_placement: false,
        method: "Unweighted mean of six criteria scored 1-10, rounded to 1dp; rank is the order of the means, exact ties broken by name.",
      },
      criteria: CRITERIA,
      maturity_definitions: MATURITY_DEFINITIONS,
      solutions: rankedSolutions,
    },
    { lastModified: REGISTRY_UPDATED, version: DATASET_VERSION },
  );
}

export const OPTIONS = () => preflight();
