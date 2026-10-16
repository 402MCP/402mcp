/** Shared response helpers for the machine endpoints. */

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, If-None-Match",
  "Access-Control-Expose-Headers": "ETag, Last-Modified, X-Registry-Version",
} as const;

export const CACHE_PUBLIC = "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400";

/** FNV-1a 32-bit — a fast, dependency-free content hash for ETags. */
export function contentHash(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/**
 * JSON response with a content ETag and conditional-request support, so
 * agents and mirrors can poll cheaply: an unchanged registry costs a 304.
 */
export function cachedJson(
  request: Request,
  body: unknown,
  options: { lastModified?: string; version?: string; contentType?: string; cache?: string } = {},
): Response {
  const text = JSON.stringify(body);
  const etag = `W/"${contentHash(text)}"`;
  const headers: Record<string, string> = {
    ...CORS,
    "Content-Type": options.contentType ?? "application/json",
    "Cache-Control": options.cache ?? CACHE_PUBLIC,
    ETag: etag,
  };
  if (options.lastModified) headers["Last-Modified"] = new Date(`${options.lastModified}T00:00:00Z`).toUTCString();
  if (options.version) headers["X-Registry-Version"] = options.version;

  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch && ifNoneMatch.split(",").map((v) => v.trim()).includes(etag)) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(text, { status: 200, headers });
}

export function jsonError(status: number, message: string, extra: Record<string, unknown> = {}): Response {
  return Response.json(
    { error: message, ...extra },
    { status, headers: { ...CORS, "Cache-Control": "no-store" } },
  );
}

export function preflight(methods = "GET, OPTIONS"): Response {
  return new Response(null, { status: 204, headers: { ...CORS, Allow: methods, "Access-Control-Allow-Methods": methods } });
}
