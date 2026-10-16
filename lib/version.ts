/** Version of the 402MCP MCP server and the `402mcp` npm package. Kept in lockstep. */
export const SERVER_VERSION = "1.1.1";

/** Latest MCP protocol revision this server speaks. Tracks the SDK's LATEST_PROTOCOL_VERSION. */
export const MCP_PROTOCOL_VERSION = "2025-11-25";

/** Protocol revisions accepted during `initialize` negotiation. */
export const SUPPORTED_PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];

/**
 * Whether surfaces advertise the npx install of NPM_PACKAGE. An install
 * instruction that fails is worse than none.
 */
export const NPM_PUBLISHED = true;

/** npm package name. */
export const NPM_PACKAGE = "@402mcp/mcp";
export const MCPB_DOWNLOAD_PATH = "/downloads/402mcp.mcpb";
