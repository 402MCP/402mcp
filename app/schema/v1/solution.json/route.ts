import { cachedJson, preflight } from "@/lib/http";
import { SOLUTION_SCHEMA } from "@/lib/json-schema";

/** GET /schema/v1/solution.json — JSON Schema for one registry entry. */
export async function GET(request: Request) {
  return cachedJson(request, SOLUTION_SCHEMA, { contentType: "application/schema+json" });
}

export const OPTIONS = () => preflight();
