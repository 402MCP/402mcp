import { CRITERIA, PAYMENT_SCHEMES, SITE_URL } from "@/data/solutions";

/**
 * JSON Schemas (draft 2020-12) for the registry feed. Published so mirrors can
 * validate what they ingest, and other directories can adopt the same shape.
 */

const string = { type: "string" } as const;
const stringOrNull = { type: ["string", "null"] } as const;
const strings = { type: "array", items: { type: "string" } } as const;
const score = { type: "number", minimum: 1, maximum: 10 } as const;

export const SOLUTION_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: `${SITE_URL}/schema/v1/solution.json`,
  title: "402MCP.org solution",
  description: "One HTTP 402 payment solution, as published by the 402MCP.org registry.",
  type: "object",
  required: [
    "id", "name", "rank", "score", "tagline", "protocol", "schemes", "roles", "kind", "maturity",
    "custody_type", "self_custodial", "node_management_required", "mcp_native", "index_summary",
    "docs_url", "website_url", "assets", "chains", "packages", "key_advantages", "disadvantages",
    "best_for", "criteria", "scoring_rationale", "code_samples", "summary", "sources", "last_verified",
  ],
  properties: {
    id: { type: "string", pattern: "^[a-z0-9-]+$" },
    name: string,
    rank: { type: "integer", minimum: 1 },
    score,
    tagline: string,
    protocol: string,
    schemes: { type: "array", minItems: 1, items: { enum: [...PAYMENT_SCHEMES] } },
    roles: { type: "array", minItems: 1, items: { enum: ["pay", "charge"] } },
    kind: { enum: ["protocol", "wallet", "gateway", "client", "sdk", "facilitator", "platform", "mcp-server"] },
    maturity: { enum: ["production", "preview", "alpha", "inactive", "unstated"] },
    maturity_note: stringOrNull,
    custody_type: string,
    self_custodial: { type: "boolean" },
    node_management_required: { type: "boolean" },
    mcp_native: { type: "boolean" },
    mcp_command: stringOrNull,
    serve_command: stringOrNull,
    index_summary: string,
    docs_url: { type: "string", format: "uri" },
    website_url: { type: "string", format: "uri" },
    license: stringOrNull,
    assets: strings,
    chains: strings,
    packages: {
      type: "array",
      items: {
        type: "object",
        required: ["registry", "name"],
        properties: { registry: { enum: ["npm", "pypi", "go"] }, name: string },
      },
    },
    key_advantages: { ...strings, minItems: 1 },
    disadvantages: { ...strings, minItems: 1 },
    best_for: string,
    criteria: {
      type: "object",
      required: CRITERIA.map(({ key }) => key),
      properties: Object.fromEntries(CRITERIA.map(({ key }) => [key, score])),
      additionalProperties: false,
    },
    scoring_rationale: string,
    code_samples: {
      type: "array",
      items: {
        type: "object",
        required: ["label", "language", "code"],
        properties: {
          label: string,
          language: { enum: ["bash", "typescript", "json", "http", "python", "text"] },
          code: string,
        },
      },
    },
    summary: string,
    sources: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["title", "url"],
        properties: { title: string, url: { type: "string", format: "uri" } },
      },
    },
    last_verified: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
  },
} as const;

export const REGISTRY_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: `${SITE_URL}/schema/v1/registry.json`,
  title: "402MCP.org registry feed",
  description: "The complete 402MCP.org registry: every solution, the scoring criteria and the ranking policy.",
  type: "object",
  required: ["protocol_version", "dataset_version", "updated", "license", "criteria", "solutions"],
  properties: {
    $schema: string,
    protocol_version: string,
    dataset_version: string,
    updated: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
    license: string,
    attribution: string,
    methodology_url: { type: "string", format: "uri" },
    ranking_policy: { type: "object" },
    criteria: {
      type: "array",
      items: { type: "object", required: ["key", "label", "description"] },
    },
    maturity_definitions: { type: "object" },
    solutions: { type: "array", items: { $ref: `${SITE_URL}/schema/v1/solution.json` } },
  },
} as const;
