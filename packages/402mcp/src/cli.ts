/**
 * 402mcp — the 402MCP.org MCP server over stdio.
 *
 * Same tools, resources and prompts as the hosted endpoint (one shared core),
 * but decoding and probing run on your own machine. The registry ships as a
 * bundled snapshot and is refreshed from https://402mcp.org/api/v1/registry
 * at startup when online.
 *
 * stdout is the protocol channel: everything else goes to stderr.
 *
 * Environment:
 *   MCP_402_OFFLINE=1               never fetch; use the bundled snapshot
 *   MCP_402_REGISTRY_URL=<url>      alternative registry feed (a mirror)
 *   MCP_402_ALLOW_PRIVATE_PROBES=1  allow probing localhost and private networks
 */
import { lookup } from "node:dns/promises";
import { createInterface } from "node:readline";

import { DATASET_VERSION, REGISTRY_UPDATED, rankedSolutions, type Solution } from "@/data/solutions";
import type { McpContext } from "@/lib/mcp/context";
import { handleMcpPayload, parseFailure } from "@/lib/mcp/server";
import { probe402 } from "@/lib/probe";
import { SERVER_VERSION } from "@/lib/version";

const REGISTRY_URL = process.env.MCP_402_REGISTRY_URL ?? "https://402mcp.org/api/v1/registry";
const OFFLINE = process.env.MCP_402_OFFLINE === "1";
const ALLOW_PRIVATE = process.env.MCP_402_ALLOW_PRIVATE_PROBES === "1";

const log = (message: string) => process.stderr.write(`[402mcp] ${message}\n`);

if (process.argv.includes("--version") || process.argv.includes("-v")) {
  process.stdout.write(`${SERVER_VERSION}\n`);
  process.exit(0);
}
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  process.stdout.write(`402mcp ${SERVER_VERSION} — MCP server for HTTP 402 agent payments (L402, x402, MPP)

Speaks MCP over stdio. Add it to an MCP client:
  { "mcpServers": { "402mcp": { "command": "npx", "args": ["-y", "@402mcp/mcp"] } } }

Environment:
  MCP_402_OFFLINE=1               use the bundled registry snapshot only
  MCP_402_REGISTRY_URL=<url>      registry feed to refresh from
  MCP_402_ALLOW_PRIVATE_PROBES=1  allow probing localhost / private networks

https://402mcp.org
`);
  process.exit(0);
}

/** Minimal structural check before trusting a downloaded feed. */
function looksLikeSolutions(value: unknown): value is Solution[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (s) =>
        s && typeof s === "object" &&
        typeof s.id === "string" && typeof s.name === "string" &&
        typeof s.rank === "number" && typeof s.score === "number" &&
        Array.isArray(s.schemes) && Array.isArray(s.roles) &&
        s.criteria && typeof s.criteria === "object",
    )
  );
}

const ctx: McpContext = {
  solutions: rankedSolutions,
  datasetVersion: DATASET_VERSION,
  registryUpdated: REGISTRY_UPDATED,
  transport: "stdio",
  probe: (url, method) =>
    probe402(url, {
      method,
      allowPrivate: ALLOW_PRIVATE,
      userAgent: `402mcp/${SERVER_VERSION} (+https://402mcp.org)`,
      resolve: async (hostname) => (await lookup(hostname, { all: true })).map((entry) => entry.address),
    }),
};

async function refreshRegistry(): Promise<void> {
  if (OFFLINE) {
    log(`offline: using bundled registry ${DATASET_VERSION}`);
    return;
  }
  try {
    const response = await fetch(REGISTRY_URL, {
      signal: AbortSignal.timeout(4000),
      headers: { "User-Agent": `402mcp/${SERVER_VERSION}`, Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const feed = (await response.json()) as { solutions?: unknown; dataset_version?: string; updated?: string };
    if (!looksLikeSolutions(feed.solutions)) throw new Error("unexpected feed shape");
    ctx.solutions = feed.solutions;
    ctx.datasetVersion = feed.dataset_version ?? ctx.datasetVersion;
    ctx.registryUpdated = feed.updated ?? ctx.registryUpdated;
    log(`registry ${ctx.datasetVersion} loaded from ${REGISTRY_URL} (${ctx.solutions.length} entries)`);
  } catch (error) {
    log(`could not refresh registry (${(error as Error).message}); using bundled ${DATASET_VERSION}`);
  }
}

const ready = refreshRegistry();

const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });
let queue = Promise.resolve();

lines.on("line", (line) => {
  if (!line.trim()) return;
  // Serialize handling so responses keep request order.
  queue = queue.then(async () => {
    await ready;
    let payload: unknown;
    try {
      payload = JSON.parse(line);
    } catch {
      process.stdout.write(`${JSON.stringify(parseFailure().body)}\n`);
      return;
    }
    const { body } = await handleMcpPayload(payload, ctx);
    if (body !== null) process.stdout.write(`${JSON.stringify(body)}\n`);
  });
});

lines.on("close", () => {
  void queue.then(() => process.exit(0));
});
