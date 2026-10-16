import { PAYMENT_SCHEMES, PROTOCOL_VERSION, SITE_URL } from "@/data/solutions";
import { methodologyMarkdown, schemeToMarkdown, solutionToMarkdown } from "@/lib/render";
import { getSchemeReference } from "@/lib/schemes";
import type { McpContext } from "./context";

/** MCP resources: the registry as JSON, every entry and scheme as Markdown. */

export function listResources(ctx: McpContext) {
  return [
    {
      uri: "402mcp://registry",
      name: "registry",
      title: "402MCP.org registry (JSON)",
      description: "Every indexed HTTP 402 solution with scores, schemes, roles, maturity, sources and code.",
      mimeType: "application/json",
    },
    {
      uri: "402mcp://methodology",
      name: "methodology",
      title: "Scoring methodology",
      description: "How solutions are scored and ranked, and what each maturity label means.",
      mimeType: "text/markdown",
    },
    ...PAYMENT_SCHEMES.map((scheme) => ({
      uri: `402mcp://schemes/${scheme}`,
      name: `scheme-${scheme.toLowerCase()}`,
      title: `${scheme} wire format`,
      description: `Challenge, credential and receipt format for ${scheme}.`,
      mimeType: "text/markdown",
    })),
    ...ctx.solutions.map((solution) => ({
      uri: `402mcp://solutions/${solution.id}`,
      name: solution.id,
      title: solution.name,
      description: solution.index_summary,
      mimeType: "text/markdown",
    })),
  ];
}

export const RESOURCE_TEMPLATES = [
  {
    uriTemplate: "402mcp://solutions/{id}",
    name: "solution",
    title: "A registry entry",
    description: "One solution in full, as Markdown.",
    mimeType: "text/markdown",
  },
  {
    uriTemplate: "402mcp://schemes/{scheme}",
    name: "scheme",
    title: "A 402 scheme reference",
    description: "Wire format for L402, x402 or MPP, as Markdown.",
    mimeType: "text/markdown",
  },
];

export function readResource(uri: string, ctx: McpContext): { uri: string; mimeType: string; text: string } | null {
  if (uri === "402mcp://registry") {
    return {
      uri,
      mimeType: "application/json",
      text: JSON.stringify({
        protocol_version: PROTOCOL_VERSION,
        dataset_version: ctx.datasetVersion,
        updated: ctx.registryUpdated,
        source: `${SITE_URL}/api/v1/registry`,
        solutions: ctx.solutions,
      }),
    };
  }
  if (uri === "402mcp://methodology") {
    return { uri, mimeType: "text/markdown", text: methodologyMarkdown() };
  }
  const solutionMatch = uri.match(/^402mcp:\/\/solutions\/([a-z0-9-]+)$/);
  if (solutionMatch) {
    const solution = ctx.solutions.find((s) => s.id === solutionMatch[1]);
    return solution ? { uri, mimeType: "text/markdown", text: solutionToMarkdown(solution, ctx.solutions.length) } : null;
  }
  const schemeMatch = uri.match(/^402mcp:\/\/schemes\/([A-Za-z0-9]+)$/);
  if (schemeMatch) {
    const reference = getSchemeReference(schemeMatch[1]);
    return reference ? { uri, mimeType: "text/markdown", text: schemeToMarkdown(reference) } : null;
  }
  return null;
}
