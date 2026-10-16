/**
 * Bindings this Worker declares in wrangler.jsonc, merged into OpenNext's
 * global CloudflareEnv. Optional because `next dev` / `next start` run without
 * them — every consumer must degrade gracefully when they are absent.
 */
interface CloudflareEnv {
  /** Latest liveness snapshot, written by the scheduled handler. */
  LIVENESS?: {
    get(key: string, type: "json"): Promise<unknown>;
    put(key: string, value: string): Promise<void>;
  };
  /** Workers Rate Limiting binding for the probe endpoint. */
  PROBE_LIMITER?: {
    limit(options: { key: string }): Promise<{ success: boolean }>;
  };
}
