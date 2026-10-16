#!/usr/bin/env node
/**
 * Builds the `402mcp` npm package and the Claude Desktop extension.
 *
 *   npm run build:package
 *
 *   packages/402mcp/dist/cli.js   bundled stdio MCP server (no runtime deps)
 *   public/downloads/402mcp.mcpb  Claude Desktop extension, served by the site
 *
 * The extension's tool list is read by running the built server, so the
 * manifest can never disagree with what the server actually exposes.
 */
import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkgDir = join(root, "packages/402mcp");
const pkg = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
const serverVersion = readFileSync(join(root, "lib/version.ts"), "utf8").match(/SERVER_VERSION = "([^"]+)"/)[1];

if (pkg.version !== serverVersion) {
  console.error(`✗ packages/402mcp/package.json is ${pkg.version} but lib/version.ts SERVER_VERSION is ${serverVersion}.`);
  process.exit(1);
}

// 1. Bundle the CLI.
const outfile = join(pkgDir, "dist/cli.js");
rmSync(join(pkgDir, "dist"), { recursive: true, force: true });
await build({
  entryPoints: [join(pkgDir, "src/cli.ts")],
  outfile,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node18",
  tsconfig: join(root, "tsconfig.json"),
  banner: { js: "#!/usr/bin/env node" },
  legalComments: "none",
  logLevel: "warning",
});
chmodSync(outfile, 0o755);
const size = readFileSync(outfile).length;
console.log(`✓ dist/cli.js (${(size / 1024).toFixed(0)} KB)`);

// 2. Ask the built server for its tools.
const requests = [
  { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "build", version: "0" } } },
  { jsonrpc: "2.0", id: 2, method: "tools/list" },
].map((r) => JSON.stringify(r)).join("\n") + "\n";
const run = spawnSync(process.execPath, [outfile], {
  input: requests,
  env: { ...process.env, MCP_402_OFFLINE: "1" },
  encoding: "utf8",
});
const responses = run.stdout.trim().split("\n").map((line) => JSON.parse(line));
const tools = responses.find((r) => r.id === 2)?.result?.tools;
if (!tools?.length) {
  console.error("✗ The built server did not answer tools/list.", run.stderr);
  process.exit(1);
}
console.log(`✓ built server answers: ${tools.length} tools`);

// 3. Claude Desktop extension (.mcpb).
const stage = join(root, ".mcpb-build");
rmSync(stage, { recursive: true, force: true });
mkdirSync(join(stage, "server"), { recursive: true });
copyFileSync(outfile, join(stage, "server/index.js"));
copyFileSync(join(pkgDir, "LICENSE"), join(stage, "LICENSE"));
copyFileSync(join(root, "public/icon-512.png"), join(stage, "icon.png"));
writeFileSync(
  join(stage, "manifest.json"),
  JSON.stringify(
    {
      manifest_version: "0.4",
      name: "402mcp",
      display_name: "402MCP — HTTP 402 agent payments",
      version: pkg.version,
      description: pkg.description,
      long_description:
        "Decode HTTP 402 Payment Required responses (L402, x402 v1/v2, MPP) into exact next steps, choose a payment rail from your requirements, and search 402MCP.org's independent registry of agent payment infrastructure. Decoding and probing run on your machine; no tool can spend money.",
      author: { name: "402MCP.org", url: "https://402mcp.org" },
      homepage: "https://402mcp.org",
      documentation: "https://402mcp.org/docs#install",
      icon: "icon.png",
      server: {
        type: "node",
        entry_point: "server/index.js",
        mcp_config: { command: "node", args: ["${__dirname}/server/index.js"], env: {} },
      },
      tools: tools.map((tool) => ({ name: tool.name, description: tool.title ?? tool.description })),
      keywords: pkg.keywords,
      license: "MIT",
      compatibility: { platforms: ["darwin", "win32", "linux"], runtimes: { node: ">=18.17.0" } },
    },
    null,
    2,
  ),
);

const mcpb = (args) => spawnSync("npx", ["--yes", "@anthropic-ai/mcpb@2.1.2", ...args], { cwd: root, encoding: "utf8" });
const validated = mcpb(["validate", join(stage, "manifest.json")]);
if (validated.status !== 0) {
  console.error("✗ mcpb manifest invalid:\n", validated.stdout, validated.stderr);
  process.exit(1);
}
console.log("✓ mcpb manifest valid");

mkdirSync(join(root, "public/downloads"), { recursive: true });
const target = join(root, "public/downloads/402mcp.mcpb");
const packed = mcpb(["pack", stage, target]);
if (packed.status !== 0) {
  console.error("✗ mcpb pack failed:\n", packed.stdout, packed.stderr);
  process.exit(1);
}
rmSync(stage, { recursive: true, force: true });
console.log(`✓ public/downloads/402mcp.mcpb (${(readFileSync(target).length / 1024).toFixed(0)} KB)`);
