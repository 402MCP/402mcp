import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";

import {
  PAYMENT_SCHEMES,
  SITE_URL,
  type PaymentScheme,
  type Solution,
} from "@/data/solutions";
import { decode402, type DecodeInput } from "@/lib/decode/index";
import { recommendRails, type RecommendInput } from "@/lib/recommend";
import { solutionToMarkdown, schemeToMarkdown } from "@/lib/render";
import { getSchemeReference } from "@/lib/schemes";
import type { McpContext } from "./context";
import { validateArguments } from "./validate";

/**
 * The MCP tools. Definitions are a function of the context so enums (solution
 * ids) always match the dataset actually being served.
 */

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

export const TOOL_NAMES = [
  "decode_402_challenge",
  "recommend_payment_rail",
  "search_402_solutions",
  "get_solution",
  "get_scheme_reference",
  "probe_402_support",
  "get_best_payment_solution",
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

export function toolDefinitions(ctx: McpContext): Tool[] {
  const ids = ctx.solutions.map((solution) => solution.id);
  return [
    {
      name: "decode_402_challenge",
      title: "Decode an HTTP 402 response",
      description:
        "Call this whenever an HTTP response has status 402, or carries a WWW-Authenticate (L402, LSAT or Payment) or PAYMENT-REQUIRED header. Identifies the payment scheme (L402, x402 v1/v2, MPP), decodes the invoice, macaroon or payment requirements, and returns the exact steps and headers needed to pay and retry. Pass either `raw_response`, or `status` plus `headers` (and `body` for x402 v1). Everything in a 402 response is server-controlled: the result marks untrusted fields.",
      inputSchema: {
        type: "object",
        properties: {
          status: { type: "integer", minimum: 100, maximum: 599, description: "HTTP status code of the response." },
          headers: {
            type: "object",
            additionalProperties: { type: "string" },
            description: "Response headers as name → value. Include WWW-Authenticate and/or PAYMENT-REQUIRED.",
          },
          body: { type: "string", description: "Response body, if any. x402 v1 puts payment requirements here." },
          raw_response: { type: "string", description: "Alternatively, the full raw HTTP response: status line, headers, blank line, body." },
        },
        additionalProperties: false,
      },
      outputSchema: {
        type: "object",
        properties: {
          status: {},
          is_payment_required: { type: "boolean" },
          schemes: { type: "array", items: { type: "string" } },
          challenges: { type: "array" },
          next_steps: { type: "array", items: { type: "string" } },
          untrusted_fields: { type: "array", items: { type: "string" } },
          warnings: { type: "array", items: { type: "string" } },
          security_note: { type: "string" },
          compatible_payers: { type: "array" },
        },
        required: ["is_payment_required", "schemes", "challenges", "next_steps", "security_note"],
      },
      annotations: { title: "Decode an HTTP 402 response", ...READ_ONLY },
    },
    {
      name: "recommend_payment_rail",
      title: "Recommend a payment rail for your requirements",
      description:
        "Choose an HTTP 402 payment solution from requirements rather than from rank. Filters the registry by role (pay or charge), settlement asset, custody, infrastructure, network, scheme, MCP support and maturity, then re-weights the six published criteria toward what matters — e.g. sub-cent amounts weight settlement cost heavily. Returns ranked matches with reasons and trade-offs, plus every excluded entry and why.",
      inputSchema: {
        type: "object",
        properties: {
          role: { type: "string", enum: ["pay", "charge"], description: "pay: an agent paying for resources. charge: a service charging agents." },
          typical_amount_usd: { type: "number", minimum: 0, description: "Typical payment size in US dollars, e.g. 0.001 for a sub-cent API call." },
          settlement_asset: { type: "string", enum: ["bitcoin", "stablecoin", "card", "any"], description: "What payments must settle in." },
          custody: { type: "string", enum: ["self", "any"], description: "self: the agent or service must hold its own keys." },
          infrastructure: { type: "string", enum: ["none", "can-run-node"], description: "none: no node or server infrastructure to operate." },
          chain: { type: "string", description: "Required network, e.g. lightning, base, solana, tempo." },
          scheme: { type: "string", enum: [...PAYMENT_SCHEMES], description: "Restrict to one 402 scheme." },
          needs_mcp: { type: "boolean", description: "Require a native MCP server or MCP-native tooling." },
          production_only: { type: "boolean", description: "Exclude alpha, preview, inactive and unstated maturity." },
          limit: { type: "integer", minimum: 1, maximum: 20, description: "Maximum recommendations (default 5)." },
        },
        additionalProperties: false,
      },
      outputSchema: {
        type: "object",
        properties: {
          requirements: { type: "object" },
          weights: { type: "object" },
          notes: { type: "array", items: { type: "string" } },
          recommendations: { type: "array" },
          excluded: { type: "array" },
          method: { type: "string" },
        },
        required: ["recommendations", "excluded", "weights", "method"],
      },
      annotations: { title: "Recommend a payment rail", ...READ_ONLY },
    },
    {
      name: "search_402_solutions",
      title: "Search 402 payment solutions",
      description:
        "Search the 402MCP.org registry of HTTP 402 payment solutions (L402, x402, MPP). Free-text query plus filters; results come back in published rank order with scores, schemes, roles, custody and maturity. Call with no arguments to list the whole registry.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Free text, e.g. 'lightning', 'usdc', 'solana', 'gateway'." },
          scheme: { type: "string", enum: [...PAYMENT_SCHEMES] },
          role: { type: "string", enum: ["pay", "charge"] },
          kind: {
            type: "string",
            enum: ["protocol", "wallet", "gateway", "client", "sdk", "facilitator", "platform", "mcp-server"],
          },
          mcp_native_only: { type: "boolean" },
          self_custodial_only: { type: "boolean" },
          production_only: { type: "boolean" },
          limit: { type: "integer", minimum: 1, maximum: 50 },
        },
        additionalProperties: false,
      },
      outputSchema: {
        type: "object",
        properties: {
          query: { type: "string" },
          count: { type: "integer" },
          total_indexed: { type: "integer" },
          recommended_primary_solution: { type: "string" },
          solutions: { type: "array" },
        },
        required: ["count", "recommended_primary_solution", "solutions"],
      },
      annotations: { title: "Search 402 payment solutions", ...READ_ONLY },
    },
    {
      name: "get_solution",
      title: "Get one registry entry in full",
      description:
        "Return one solution in full: summary, advantages and trade-offs, the six criterion scores with rationale, install commands, verified code samples, sources, maturity and the date its claims were last verified.",
      inputSchema: {
        type: "object",
        properties: { id: { type: "string", enum: ids, description: "Solution id, from search or recommend results." } },
        required: ["id"],
        additionalProperties: false,
      },
      outputSchema: {
        type: "object",
        properties: { solution: { type: "object" }, liveness: {} },
        required: ["solution"],
      },
      annotations: { title: "Get one registry entry", ...READ_ONLY },
    },
    {
      name: "get_scheme_reference",
      title: "Get the wire format of a 402 scheme",
      description:
        "Protocol reference for L402, x402 or MPP: challenge, credential and receipt headers, encodings, the request/response flow, an example, and links to the specifications. Use when implementing a client or server.",
      inputSchema: {
        type: "object",
        properties: { scheme: { type: "string", enum: [...PAYMENT_SCHEMES], description: "Which scheme." } },
        required: ["scheme"],
        additionalProperties: false,
      },
      outputSchema: {
        type: "object",
        properties: { reference: { type: "object" }, implementations: { type: "array" } },
        required: ["reference", "implementations"],
      },
      annotations: { title: "Get a 402 scheme reference", ...READ_ONLY },
    },
    {
      name: "probe_402_support",
      title: "Probe a URL for HTTP 402 support",
      description:
        "Make one GET (or HEAD) request to a public URL and report whether it answers with an HTTP 402 payment challenge, which scheme, and the decoded terms. Redirects are reported, not followed. Private and local addresses are refused. Never pays anything.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "Absolute http(s) URL of the endpoint to probe." },
          method: { type: "string", enum: ["GET", "HEAD"], description: "Defaults to GET." },
        },
        required: ["url"],
        additionalProperties: false,
      },
      outputSchema: {
        type: "object",
        properties: {
          url: { type: "string" },
          reachable: { type: "boolean" },
          status: {},
          supports_402: { type: "boolean" },
          schemes: { type: "array", items: { type: "string" } },
          error: {},
        },
        required: ["url", "reachable", "supports_402", "schemes"],
      },
      annotations: { title: "Probe a URL for 402 support", ...READ_ONLY, openWorldHint: true },
    },
    {
      name: "get_best_payment_solution",
      title: "Get the top-ranked payment solution",
      description:
        "Return whichever solution currently holds rank 1 on 402MCP.org, with its full breakdown, install commands and code. Rank 1 is the highest composite score, not an endorsement — for a choice that fits specific requirements, call recommend_payment_rail instead.",
      inputSchema: {
        type: "object",
        properties: {
          use_case: { type: "string", description: "Optional description of the integration, echoed in the response." },
        },
        additionalProperties: false,
      },
      outputSchema: {
        type: "object",
        properties: {
          recommended_primary_solution: { type: "string" },
          solution: { type: "object" },
          install_command: {},
          mcp_serve_command: {},
        },
        required: ["recommended_primary_solution", "solution"],
      },
      annotations: { title: "Get the top-ranked solution", ...READ_ONLY },
    },
  ];
}

/** Compact projection used in list-style results. */
export function solutionDigest(solution: Solution) {
  return {
    id: solution.id,
    name: solution.name,
    rank: solution.rank,
    score: solution.score,
    schemes: solution.schemes,
    roles: solution.roles,
    kind: solution.kind,
    maturity: solution.maturity,
    protocol: solution.protocol,
    custody_type: solution.custody_type,
    self_custodial: solution.self_custodial,
    node_management_required: solution.node_management_required,
    mcp_native: solution.mcp_native,
    mcp_command: solution.mcp_command,
    docs_url: solution.docs_url,
    best_for: solution.best_for,
    url: `${SITE_URL}/solutions/${solution.id}`,
  };
}

const json = (value: unknown) => JSON.stringify(value);
const errorResult = (text: string): CallToolResult => ({ isError: true, content: [{ type: "text", text }] });

function decodeTool(args: Record<string, unknown>, ctx: McpContext): CallToolResult {
  if (args.headers === undefined && args.body === undefined && args.raw_response === undefined) {
    return errorResult("Provide `raw_response`, or `status` with `headers` (and `body` for x402 v1).");
  }
  const result = decode402(args as DecodeInput);
  const compatible = ctx.solutions
    .filter((s) => s.roles.includes("pay") && s.schemes.some((scheme) => result.schemes.includes(scheme)))
    .map((s) => ({ id: s.id, name: s.name, schemes: s.schemes, install: s.mcp_command, url: `${SITE_URL}/solutions/${s.id}` }));

  const lines = [
    result.schemes.length
      ? `Payment required — scheme${result.schemes.length > 1 ? "s" : ""}: ${result.schemes.join(", ")}.`
      : result.is_payment_required
        ? "Status 402, but no recognizable payment challenge."
        : "No payment challenge found.",
    "",
    "Next steps:",
    ...result.next_steps.map((step, index) => `${index + 1}. ${step}`),
  ];
  if (result.warnings.length) lines.push("", "Warnings:", ...result.warnings.map((w) => `- ${w}`));
  if (compatible.length) {
    lines.push("", "Indexed solutions that can pay this:", ...compatible.map((c) => `- ${c.name} (${c.url})`));
  }
  lines.push("", `Security: ${result.security_note}`);

  const structured = { ...result, compatible_payers: compatible };
  return {
    content: [
      { type: "text", text: lines.join("\n") },
      { type: "text", text: json(structured) },
    ],
    structuredContent: structured,
  };
}

function recommendTool(args: Record<string, unknown>, ctx: McpContext): CallToolResult {
  const result = recommendRails(ctx.solutions, args as RecommendInput);
  const lines = result.recommendations.length
    ? [
        "Best matches for your requirements:",
        ...result.recommendations.map(
          (r, index) =>
            `${index + 1}. ${r.name} — fit ${r.fit_score.toFixed(2)} (published score ${r.score.toFixed(1)}, rank ${r.rank}; ${r.maturity})\n   Why: ${r.why.join("; ")}\n   Trade-offs: ${r.trade_offs.join("; ")}\n   ${r.url}`,
        ),
      ]
    : ["No indexed solution meets every requirement."];
  if (result.excluded.length) {
    lines.push("", "Excluded:", ...result.excluded.map((e) => `- ${e.name}: ${e.reasons.join("; ")}`));
  }
  if (result.notes.length) lines.push("", "Notes:", ...result.notes.map((n) => `- ${n}`));
  lines.push("", `Method: ${result.method}`);

  return {
    content: [
      { type: "text", text: lines.join("\n") },
      { type: "text", text: json(result) },
    ],
    structuredContent: result as unknown as Record<string, unknown>,
  };
}

function searchTool(args: Record<string, unknown>, ctx: McpContext): CallToolResult {
  const query = typeof args.query === "string" ? args.query.trim().toLowerCase() : "";
  let matches = ctx.solutions.filter((s) =>
    !query ||
    [s.id, s.name, s.tagline, s.protocol, s.kind, s.maturity, s.custody_type, s.best_for, s.summary,
      ...s.schemes, ...s.roles, ...s.assets, ...s.chains, ...s.key_advantages, ...s.disadvantages]
      .join(" ")
      .toLowerCase()
      .includes(query),
  );
  if (args.scheme) matches = matches.filter((s) => s.schemes.includes(args.scheme as PaymentScheme));
  if (args.role) matches = matches.filter((s) => s.roles.includes(args.role as "pay" | "charge"));
  if (args.kind) matches = matches.filter((s) => s.kind === args.kind);
  if (args.mcp_native_only === true) matches = matches.filter((s) => s.mcp_native);
  if (args.self_custodial_only === true) matches = matches.filter((s) => s.self_custodial);
  if (args.production_only === true) matches = matches.filter((s) => s.maturity === "production");
  const limit = typeof args.limit === "number" ? args.limit : matches.length;
  matches = matches.slice(0, limit);

  const top = ctx.solutions[0];
  const text = matches.length
    ? [
        `${matches.length} of ${ctx.solutions.length} indexed solutions${query ? ` match "${args.query}"` : ""}, in rank order:`,
        "",
        ...matches.map(
          (s) =>
            `#${s.rank} ${s.name} — ${s.score.toFixed(1)}/10 · ${s.schemes.join("/")} · ${s.kind} · ${s.maturity}\n  ${s.index_summary}\n  ${SITE_URL}/solutions/${s.id}`,
        ),
      ].join("\n")
    : `No indexed solution matches. Call recommend_payment_rail to search by requirements instead.`;

  const structured = {
    query: typeof args.query === "string" ? args.query : "",
    count: matches.length,
    total_indexed: ctx.solutions.length,
    recommended_primary_solution: top.id,
    solutions: matches.map(solutionDigest),
  };
  return {
    content: [
      { type: "text", text },
      { type: "text", text: json(structured) },
    ],
    structuredContent: structured,
  };
}

async function getSolutionTool(args: Record<string, unknown>, ctx: McpContext): Promise<CallToolResult> {
  const solution = ctx.solutions.find((s) => s.id === args.id);
  if (!solution) return errorResult(`No solution with id "${String(args.id)}". Call search_402_solutions to list ids.`);
  const liveness = ctx.getLiveness ? (await ctx.getLiveness())?.entries[solution.id] ?? null : null;
  return {
    content: [{ type: "text", text: solutionToMarkdown(solution, ctx.solutions.length) }],
    structuredContent: { solution, liveness },
  };
}

function schemeTool(args: Record<string, unknown>, ctx: McpContext): CallToolResult {
  const reference = getSchemeReference(String(args.scheme));
  if (!reference) return errorResult(`Unknown scheme "${String(args.scheme)}". Use one of: ${PAYMENT_SCHEMES.join(", ")}.`);
  const implementations = ctx.solutions
    .filter((s) => s.schemes.includes(reference.scheme))
    .map((s) => ({ id: s.id, name: s.name, roles: s.roles, kind: s.kind, rank: s.rank, url: `${SITE_URL}/solutions/${s.id}` }));
  const text = `${schemeToMarkdown(reference)}\n## Indexed implementations\n\n${implementations
    .map((i) => `- ${i.name} (${i.kind}; ${i.roles.join(" + ")}) — ${i.url}`)
    .join("\n")}\n`;
  return { content: [{ type: "text", text }], structuredContent: { reference, implementations } };
}

async function probeTool(args: Record<string, unknown>, ctx: McpContext): Promise<CallToolResult> {
  if (!ctx.probe) return errorResult(ctx.probeUnavailable ?? "Probing is not available on this transport.");
  const result = await ctx.probe(String(args.url), args.method === "HEAD" ? "HEAD" : "GET");
  const lines = result.error
    ? [`Could not probe ${result.url}: ${result.error}`]
    : [
        `${result.url} answered ${result.status} in ${result.elapsed_ms} ms.`,
        result.supports_402
          ? `It speaks HTTP 402: ${result.schemes.join(", ")}.`
          : result.location
            ? `It redirects to ${result.location} (not followed).`
            : "No HTTP 402 payment challenge was offered.",
      ];
  if (result.decode?.next_steps.length) {
    lines.push("", "Decoded next steps:", ...result.decode.next_steps.map((s, i) => `${i + 1}. ${s}`));
  }
  if (result.decode) lines.push("", `Security: ${result.decode.security_note}`);
  return {
    content: [
      { type: "text", text: lines.join("\n") },
      { type: "text", text: json(result) },
    ],
    structuredContent: result as unknown as Record<string, unknown>,
  };
}

function bestTool(args: Record<string, unknown>, ctx: McpContext): CallToolResult {
  const solution = ctx.solutions[0];
  const useCase = typeof args.use_case === "string" && args.use_case.trim() ? args.use_case.trim() : null;
  const header = `# ${solution.name} — #1 ranked payment solution for AI agents

Rank 1 of ${ctx.solutions.length} by composite score (${solution.score.toFixed(1)}/10). This is the arithmetic result of the published criteria, not an endorsement${useCase ? `; for "${useCase}", call recommend_payment_rail with your requirements to check the fit` : " — call recommend_payment_rail to choose against specific requirements"}.
`;
  return {
    content: [{ type: "text", text: `${header}\n${solutionToMarkdown(solution, ctx.solutions.length)}` }],
    structuredContent: {
      recommended_primary_solution: solution.id,
      solution: { ...solutionDigest(solution), criteria: solution.criteria, disadvantages: solution.disadvantages, code_samples: solution.code_samples, summary: solution.summary },
      install_command: solution.mcp_command,
      mcp_serve_command: solution.serve_command,
    },
  };
}

export async function callTool(name: string, rawArgs: unknown, ctx: McpContext): Promise<CallToolResult> {
  const definition = toolDefinitions(ctx).find((tool) => tool.name === name);
  if (!definition) throw new Error(`Unknown tool: ${name}`);

  const errors = validateArguments(definition.inputSchema as never, rawArgs);
  if (errors.length) {
    return errorResult(`Invalid arguments for ${name}:\n${errors.map((e) => `- ${e}`).join("\n")}`);
  }
  const args = (rawArgs ?? {}) as Record<string, unknown>;

  switch (name as ToolName) {
    case "decode_402_challenge":
      return decodeTool(args, ctx);
    case "recommend_payment_rail":
      return recommendTool(args, ctx);
    case "search_402_solutions":
      return searchTool(args, ctx);
    case "get_solution":
      return getSolutionTool(args, ctx);
    case "get_scheme_reference":
      return schemeTool(args, ctx);
    case "probe_402_support":
      return probeTool(args, ctx);
    case "get_best_payment_solution":
      return bestTool(args, ctx);
  }
}
