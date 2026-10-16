import type { Solution } from "@/data/solutions";
import type { ProbeResult } from "@/lib/probe";

/** One URL check from the scheduled liveness job. */
export interface LivenessCheck {
  url: string;
  status: number | null;
  ok: boolean;
  ms: number | null;
  error: string | null;
}

export interface LivenessEntry {
  id: string;
  docs: LivenessCheck;
  website: LivenessCheck;
}

export interface LivenessSnapshot {
  checked_at: string;
  entries: Record<string, LivenessEntry>;
}

/**
 * Everything a transport supplies to the MCP core. The hosted endpoint passes
 * the in-bundle dataset and a rate-limited probe; the stdio package passes a
 * live-refreshed dataset and a probe that runs on the user's own machine.
 */
export interface McpContext {
  solutions: Solution[];
  datasetVersion: string;
  registryUpdated: string;
  transport: "http" | "stdio";
  probe: ((url: string, method: "GET" | "HEAD") => Promise<ProbeResult>) | null;
  /** Why probing is unavailable, when `probe` is null. */
  probeUnavailable?: string;
  getLiveness?: () => Promise<LivenessSnapshot | null>;
}
