/**
 * Registry changelog — what changed in the data, and why. Published as JSON
 * (/api/v1/changelog), Atom (/changelog.xml) and HTML (/changelog) so mirrors
 * and agents can follow corrections, not just additions.
 */

export type ChangeType = "added" | "corrected" | "changed" | "removed";

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  summary: string;
  changes: { type: ChangeType; text: string; solution_id?: string }[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "2026.10.15",
    date: "2026-10-15",
    title: "Nine new entries, sourced corrections, and agent tools",
    summary:
      "The registry grows from five entries to fourteen and adds the Machine Payments Protocol as a third scheme. Every entry now carries sources and a last-verified date, and four original entries were corrected against their primary sources.",
    changes: [
      { type: "added", text: "Machine Payments Protocol (MPP), the 'Payment' HTTP authentication scheme from Tempo and Stripe.", solution_id: "machine-payments-protocol" },
      { type: "added", text: "Stripe Machine Payments (MPP and x402).", solution_id: "stripe-machine-payments" },
      { type: "added", text: "Aperture, the reference L402 reverse proxy.", solution_id: "lightning-labs-aperture" },
      { type: "added", text: "lnget, an L402-aware command-line HTTP client.", solution_id: "lightning-labs-lnget" },
      { type: "added", text: "Alby MCP Server.", solution_id: "alby-mcp" },
      { type: "added", text: "Cloudflare Agents SDK (x402).", solution_id: "cloudflare-agents-x402" },
      { type: "added", text: "thirdweb x402.", solution_id: "thirdweb-x402" },
      { type: "added", text: "PayAI Network.", solution_id: "payai-x402-facilitator" },
      { type: "added", text: "Coinbase Payments MCP.", solution_id: "coinbase-payments-mcp" },
      {
        type: "corrected",
        text: "Lightning Labs Wavelength: TypeScript examples replaced with commands from the SDK's documentation; marked alpha; tagline matched to the launch post. Rails 9.3 → 8 (no stablecoin settlement today) and DX 9.5 → 8.5 (alpha API churn) move the score from 9.8 to 9.4.",
        solution_id: "lightning-labs-wavelength",
      },
      {
        type: "corrected",
        text: "Fewsats: described as a hosted, custodial platform with an MCP server rather than a self-run node stack; marked inactive (no release in over 12 months). Score 8.2 → 7.1.",
        solution_id: "fewsats-l402",
      },
      {
        type: "corrected",
        text: "x402-mcp (Vercel): package name corrected to x402-mcp; an example that did not match the package's API was removed; marked inactive. Score 7.5 → 7.8.",
        solution_id: "vercel-402-mcp-middleware",
      },
      {
        type: "corrected",
        text: "Crossmint Agent Wallets: custody described as an owner key plus a scoped agent signer; an API example was replaced with the documented install. Score 7.9 → 7.8.",
        solution_id: "crossmint-agent-wallets",
      },
      { type: "changed", text: "x402 Protocol: documented the v2 PAYMENT-REQUIRED / PAYMENT-SIGNATURE headers and the @x402/* packages. Score unchanged at 8.6.", solution_id: "x402-protocol" },
      { type: "changed", text: "Scores and ranks are now computed from the six criteria rather than authored; every entry lists its sources, last-verified date and a maturity label." },
      { type: "added", text: "MCP tools decode_402_challenge, recommend_payment_rail, get_solution, get_scheme_reference and probe_402_support, plus MCP resources and prompts." },
      { type: "added", text: "REST equivalents of every tool, a canonical registry feed with JSON Schema, and the 402mcp npm package for stdio MCP clients." },
    ],
  },
  {
    version: "2026.09.21",
    date: "2026-09-21",
    title: "Registry launched",
    summary: "402MCP.org launched with five entries scored on six criteria.",
    changes: [{ type: "added", text: "Initial entries: Lightning Labs Wavelength, x402 Protocol, Fewsats, Crossmint Agent Wallets, and Vercel's x402-mcp." }],
  },
];
