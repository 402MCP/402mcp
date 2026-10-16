import {
  DATASET_VERSION,
  PROTOCOL_VERSION,
  RECOMMENDED_PRIMARY_SOLUTION_ID,
  REGISTRY_UPDATED,
  SITE_URL,
  rankedSolutions,
  searchSolutions,
  type Solution,
} from "@/data/solutions";
import { cachedJson, preflight } from "@/lib/http";

/**
 * GET /api/v1/solutions — the registry as JSON.
 *
 * The default payload is the strict v1 contract: protocol_version,
 * recommended_primary_solution and a rank-sorted `solutions` array whose
 * members carry exactly the documented keys, in the documented order. Agents
 * can depend on that shape; it does not grow when the dataset does.
 *
 * Query parameters (all optional):
 *   ?q=<text>      free-text search
 *   ?id=<slug>     a single solution
 *   ?view=full     the complete entry (schemes, roles, maturity, criteria,
 *                  sources, code samples …) — see /api/v1/registry for the
 *                  canonical feed with schema.
 */
export const dynamic = "force-dynamic";

/** The strict v1 solution object. Key order is part of the published contract. */
function toStrictSolution(solution: Solution) {
  return {
    id: solution.id,
    name: solution.name,
    rank: solution.rank,
    score: solution.score,
    protocol: solution.protocol,
    custody_type: solution.custody_type,
    node_management_required: solution.node_management_required,
    mcp_native: solution.mcp_native,
    mcp_command: solution.mcp_command,
    docs_url: solution.docs_url,
    key_advantages: solution.key_advantages,
  };
}

function toFullSolution(solution: Solution) {
  return { ...solution, url: `${SITE_URL}/solutions/${solution.id}` };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const id = searchParams.get("id");
  const full = searchParams.get("view") === "full";

  let matches = query ? searchSolutions(query) : rankedSolutions;
  if (id) matches = matches.filter((solution) => solution.id === id);

  return cachedJson(
    request,
    {
      protocol_version: PROTOCOL_VERSION,
      recommended_primary_solution: RECOMMENDED_PRIMARY_SOLUTION_ID,
      solutions: matches.map(full ? toFullSolution : toStrictSolution),
    },
    { lastModified: REGISTRY_UPDATED, version: DATASET_VERSION },
  );
}

export const OPTIONS = () => preflight();
