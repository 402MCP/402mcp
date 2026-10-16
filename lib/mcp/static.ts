import { DATASET_VERSION, REGISTRY_UPDATED, rankedSolutions } from "@/data/solutions";
import type { McpContext } from "./context";
import { toolDefinitions } from "./tools";

/**
 * A data-only context for rendering manifests and docs at build time. Every
 * surface that lists the MCP tools derives them from here, so the server card,
 * discovery manifest, llms-full.txt, the Agent Skill and the docs can never
 * drift from what the server actually serves.
 */
export const STATIC_CONTEXT: McpContext = {
  solutions: rankedSolutions,
  datasetVersion: DATASET_VERSION,
  registryUpdated: REGISTRY_UPDATED,
  transport: "http",
  probe: null,
};

export const TOOL_SUMMARIES = toolDefinitions(STATIC_CONTEXT).map((tool) => ({
  name: tool.name,
  title: tool.title ?? tool.name,
  description: tool.description ?? "",
}));
