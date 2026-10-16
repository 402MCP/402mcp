import { CHANGELOG } from "@/data/changelog";
import { DATASET_VERSION, REGISTRY_UPDATED } from "@/data/solutions";
import { cachedJson, preflight } from "@/lib/http";

/** GET /api/v1/changelog — what changed in the registry, including corrections. */
export async function GET(request: Request) {
  return cachedJson(
    request,
    { dataset_version: DATASET_VERSION, updated: REGISTRY_UPDATED, entries: CHANGELOG },
    { lastModified: REGISTRY_UPDATED, version: DATASET_VERSION },
  );
}

export const OPTIONS = () => preflight();
