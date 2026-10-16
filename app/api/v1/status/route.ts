import { DATASET_VERSION, rankedSolutions } from "@/data/solutions";
import { readLiveness } from "@/lib/hosted";
import { CORS, preflight } from "@/lib/http";

/**
 * GET /api/v1/status — liveness of every entry's documentation and website,
 * checked daily by the Worker's scheduled handler. A 4xx from a vendor often
 * means bot protection rather than an outage, so raw status codes are reported.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await readLiveness();
  return Response.json(
    {
      dataset_version: DATASET_VERSION,
      checked_at: snapshot?.checked_at ?? null,
      state: snapshot ? "checked" : "pending",
      note: snapshot
        ? "ok means the URL answered 2xx or 3xx. Vendor sites sometimes answer 403 to automated checks; that is reported, not treated as an outage."
        : "No liveness snapshot yet. Checks run daily on a schedule.",
      entries: rankedSolutions.map((s) => ({
        id: s.id,
        name: s.name,
        last_verified: s.last_verified,
        docs: snapshot?.entries[s.id]?.docs ?? null,
        website: snapshot?.entries[s.id]?.website ?? null,
      })),
    },
    { headers: { ...CORS, "Cache-Control": "public, max-age=0, s-maxage=300" } },
  );
}

export const OPTIONS = () => preflight();
