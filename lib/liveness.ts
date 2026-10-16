import type { Solution } from "../data/solutions";
import type { LivenessCheck, LivenessSnapshot } from "./mcp/context";

/**
 * Daily liveness checks of every entry's documentation and website.
 *
 * Imports are relative (no path aliases) because this module is also bundled
 * directly by wrangler into the Worker's scheduled handler. Bodies are
 * cancelled unread, keeping CPU time near zero.
 */

const USER_AGENT = "402mcp-liveness/1.1 (+https://402mcp.org)";

export async function checkUrl(url: string, timeoutMs = 8000): Promise<LivenessCheck> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,*/*" },
    });
    await response.body?.cancel().catch(() => undefined);
    return {
      url,
      status: response.status,
      ok: response.status >= 200 && response.status < 400,
      ms: Date.now() - started,
      error: null,
    };
  } catch (error) {
    return {
      url,
      status: null,
      ok: false,
      ms: Date.now() - started,
      error: (error as Error).name === "AbortError" ? "Timed out." : (error as Error).message,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function runLivenessChecks(solutions: Solution[]): Promise<LivenessSnapshot> {
  const results = await Promise.all(
    solutions.map(async (solution) => {
      const [docs, website] = await Promise.all([checkUrl(solution.docs_url), checkUrl(solution.website_url)]);
      return [solution.id, { id: solution.id, docs, website }] as const;
    }),
  );
  return { checked_at: new Date().toISOString(), entries: Object.fromEntries(results) };
}
