import { cachedJson, preflight } from "@/lib/http";
import { REGISTRY_SCHEMA } from "@/lib/json-schema";

/** GET /schema/v1/registry.json — JSON Schema for the registry feed. */
export async function GET(request: Request) {
  return cachedJson(request, REGISTRY_SCHEMA, { contentType: "application/schema+json" });
}

export const OPTIONS = () => preflight();
