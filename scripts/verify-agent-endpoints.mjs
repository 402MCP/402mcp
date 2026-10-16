#!/usr/bin/env node
/**
 * Verifies every agent-facing endpoint is reachable, strictly formatted and
 * consistent with the dataset.
 *
 *   node scripts/verify-agent-endpoints.mjs [baseUrl]
 *
 * Expectations are derived from the dataset rather than written against any
 * named entry.
 */
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const require = createRequire(import.meta.url);
const Ajv2020 = require("ajv/dist/2020").default;
const addFormats = require("ajv-formats");

const {
  CRITERIA,
  DATASET_VERSION,
  RECOMMENDED_PRIMARY_SOLUTION_ID,
  compositeScore,
  rankedSolutions,
} = await import("../data/solutions.ts");

const top = rankedSolutions[0];
const EXPECTED_TOOLS = [
  "decode_402_challenge",
  "get_best_payment_solution",
  "get_scheme_reference",
  "get_solution",
  "probe_402_support",
  "recommend_payment_rail",
  "search_402_solutions",
];
const COFFEE =
  "lnbc2500u1pvjluezsp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygspp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jsxqzpu9qrsgquk0rl77nj30yxdy8j9vdx85fkpmdla2087ne0xh8nhedh8w27kyke0lp53ut353s06fv3qfegext0eh0ymjpf39tuven09sam30g4vgpfna3rh";

let failures = 0;
function check(name, condition, detail = "") {
  if (condition) console.log(`  ✓ ${name}`);
  else {
    failures += 1;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}
const section = (title) => console.log(`\n${title}`);
const ct = (res) => (res.headers.get("content-type") ?? "").toLowerCase();
/** Real HTML markup — not wire-format placeholders like <macaroon>:<preimage>. */
const HTML_TAG = /<\/?(html|head|body|div|span|p|a|script|style|meta|link|ul|ol|li|table|tr|td|th|h[1-6]|img|br|nav|main|section|header|footer)\b[^>]*>/i;

/* ------------------------------------------------------------------ llms.txt */
section(`GET ${base}/llms.txt`);
{
  const res = await fetch(`${base}/llms.txt`);
  const body = await res.text();
  check("200 OK", res.status === 200, `got ${res.status}`);
  check("text/plain; charset=utf-8", ct(res).startsWith("text/plain"));
  check("contains no HTML markup", !HTML_TAG.test(body), body.match(HTML_TAG)?.[0]);
  check("starts with the H1 title", body.startsWith("# 402MCP.org - The Official Index of HTTP 402 & Agent Payment Solutions"));
  check("has the blockquote summary", /^> 402MCP\.org is the open directory/m.test(body));
  check("has the three required sections",
    ["## Recommended #1 Solution for Agent Payments", "## Directory Categories", "## Machine APIs"].every((h) => body.includes(h)));
  check("recommended line names the rank-1 entry with its own summary",
    body.includes(`- [${top.name}](https://402mcp.org/solutions/${top.id}): ${top.index_summary}`));
  check("advertises both machine APIs",
    body.includes("REST API: GET https://402mcp.org/api/v1/solutions") &&
    body.includes("MCP Server Endpoint: POST https://402mcp.org/api/v1/mcp"));
}

/* ------------------------------------------------------------- llms-full.txt */
section(`GET ${base}/llms-full.txt`);
{
  const res = await fetch(`${base}/llms-full.txt`);
  const body = await res.text();
  check("200 OK", res.status === 200);
  check("text/plain", ct(res).startsWith("text/plain"));
  check("contains no HTML markup", !HTML_TAG.test(body), body.match(HTML_TAG)?.[0]);
  const positions = rankedSolutions.map((s) => body.indexOf(`### ${s.name}\n`));
  check("includes every indexed solution", positions.every((p) => p !== -1),
    rankedSolutions.filter((_, i) => positions[i] === -1).map((s) => s.name).join(", "));
  check("lists entries in rank order", positions.every((p, i) => i === 0 || p > positions[i - 1]));
  check("covers all three schemes' wire formats",
    ["### L402 (formerly LSAT)", "### x402", "### Machine Payments Protocol (MPP)"].every((h) => body.includes(h)));
  check("lists every MCP tool", EXPECTED_TOOLS.every((t) => body.includes(`\`${t}\``)));
  check("publishes the independence statement", body.includes("## Independence") && body.includes("cannot be purchased"));
  check("includes the changelog", body.includes("## Changelog") && body.includes(DATASET_VERSION));
}

/* -------------------------------------------------------- /api/v1/solutions */
section(`GET ${base}/api/v1/solutions`);
{
  const res = await fetch(`${base}/api/v1/solutions`);
  const json = await res.json();
  check("200 OK, application/json", res.status === 200 && ct(res).includes("application/json"));
  check('protocol_version "1.0"', json.protocol_version === "1.0");
  check("recommended_primary_solution is the rank-1 entry",
    json.recommended_primary_solution === RECOMMENDED_PRIMARY_SOLUTION_ID && json.recommended_primary_solution === top.id);
  check("one entry per indexed solution", json.solutions.length === rankedSolutions.length);

  const first = json.solutions[0];
  check("rank-1 entry is first and carries the highest score",
    first.id === top.id && first.rank === 1 && rankedSolutions.every((s) => s.score <= first.score));
  const KEYS = ["id", "name", "rank", "score", "protocol", "custody_type", "node_management_required", "mcp_native", "mcp_command", "docs_url", "key_advantages"];
  check("every solution carries exactly the strict v1 key set, in order",
    json.solutions.every((s) => Object.keys(s).join() === KEYS.join()));
  check("served fields round-trip the dataset",
    json.solutions.every((s) => {
      const d = rankedSolutions.find((x) => x.id === s.id);
      return d && d.name === s.name && d.score === s.score && d.mcp_command === s.mcp_command && d.docs_url === s.docs_url;
    }));
  check("sorted by rank", json.solutions.every((s, i, a) => i === 0 || a[i - 1].rank < s.rank));

  const q = await (await fetch(`${base}/api/v1/solutions?q=lightning`)).json();
  check("?q= filters", q.solutions.length > 0 && q.solutions.length < json.solutions.length);
  const one = await (await fetch(`${base}/api/v1/solutions?id=${top.id}&view=full`)).json();
  check("?id= &view=full returns the complete entry",
    one.solutions.length === 1 && "criteria" in one.solutions[0] && "sources" in one.solutions[0] && "maturity" in one.solutions[0]);
  check("ETag and X-Registry-Version headers", !!res.headers.get("etag") && res.headers.get("x-registry-version") === DATASET_VERSION);
}

/* ---------------------------------------------- /api/v1/registry + schema */
section(`GET ${base}/api/v1/registry (+ JSON Schema)`);
{
  const res = await fetch(`${base}/api/v1/registry`);
  const feed = await res.json();
  check("200 OK", res.status === 200);
  check("dataset_version and license", feed.dataset_version === DATASET_VERSION && feed.license === "CC-BY-4.0");
  check("every solution in full", feed.solutions.length === rankedSolutions.length && feed.solutions.every((s) => s.sources?.length > 0));

  const etag = res.headers.get("etag");
  const again = await fetch(`${base}/api/v1/registry`, { headers: { "If-None-Match": etag } });
  check("If-None-Match with the current ETag returns 304", again.status === 304, `got ${again.status}`);

  const registrySchema = await (await fetch(`${base}/schema/v1/registry.json`)).json();
  const solutionSchema = await (await fetch(`${base}/schema/v1/solution.json`)).json();
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  ajv.addSchema(solutionSchema);
  const validate = ajv.compile(registrySchema);
  const valid = validate(feed);
  check("the registry feed validates against its published JSON Schema", valid,
    (validate.errors ?? []).slice(0, 3).map((e) => `${e.instancePath} ${e.message}`).join("; "));
}

/* ---------------------------------------------------------- REST mirrors */
section("REST equivalents of the MCP tools");
{
  const decode = await fetch(`${base}/api/v1/decode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: 402, headers: { "WWW-Authenticate": `L402 macaroon="AgELNDAybWNwLXRlc3Q=", invoice="${COFFEE}"` } }),
  });
  const d = await decode.json();
  check("POST /api/v1/decode decodes an L402 challenge", decode.status === 200 && d.schemes.join() === "L402" && d.challenges[0].invoice.amount_sats === 250000);
  check("decode lists payers that can settle it", d.compatible_payers.length > 0 && d.compatible_payers.every((p) => rankedSolutions.find((s) => s.id === p.id)?.roles.includes("pay")));
  const empty = await fetch(`${base}/api/v1/decode`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  check("decode with no response data is a 400", empty.status === 400);

  const rec = await (await fetch(`${base}/api/v1/recommend?role=charge&settlement_asset=stablecoin&limit=20`)).json();
  check("GET /api/v1/recommend returns matches that all satisfy the filters",
    rec.recommendations.length > 0 &&
    rec.recommendations.every((r) => {
      const s = rankedSolutions.find((x) => x.id === r.id);
      return s.roles.includes("charge") && s.assets.some((a) => /USDC|ERC-20|SPL|stablecoin/i.test(a));
    }));
  check("…and explains every exclusion", rec.excluded.every((e) => e.reasons.length > 0) &&
    rec.recommendations.length + rec.excluded.length === rankedSolutions.length);
  const bad = await fetch(`${base}/api/v1/recommend?role=steal`);
  check("invalid enum is a 400", bad.status === 400);

  const schemes = await (await fetch(`${base}/api/v1/schemes`)).json();
  check("GET /api/v1/schemes covers L402, x402 and MPP", schemes.schemes.map((s) => s.scheme).join() === "L402,x402,MPP");
  const mpp = await (await fetch(`${base}/api/v1/schemes/MPP`)).json();
  check("GET /api/v1/schemes/MPP names its implementations", mpp.implementations.length >= 2);

  const probe = await (await fetch(`${base}/api/v1/probe?url=${encodeURIComponent("http://127.0.0.1/")}`)).json();
  check("GET /api/v1/probe refuses private addresses", /refused/i.test(probe.error ?? ""), probe.error);

  const status = await (await fetch(`${base}/api/v1/status`)).json();
  check("GET /api/v1/status reports every entry", status.entries.length === rankedSolutions.length && ["checked", "pending"].includes(status.state));

  const changelog = await (await fetch(`${base}/api/v1/changelog`)).json();
  check("GET /api/v1/changelog leads with the current dataset version", changelog.entries[0].version === DATASET_VERSION);
  check("corrections are recorded, not just additions", changelog.entries[0].changes.some((c) => c.type === "corrected"));
}

/* -------------------------------------------------- /.well-known/402.json */
section(`GET ${base}/.well-known/402.json`);
{
  const res = await fetch(`${base}/.well-known/402.json`);
  const json = await res.json();
  check("200 OK, application/json", res.status === 200 && ct(res).includes("application/json"));
  check("recommends the rank-1 entry", json.recommended_primary_solution === top.id);
  check("ranking policy: independent, no paid placement",
    json.ranking_policy?.independent === true && json.ranking_policy?.paid_placement === false);
  check("declares L402, x402 and MPP", json.payment_schemes.map((s) => s.scheme).join() === "L402,x402,MPP");
  check("every scheme names a reference implementation that speaks it",
    json.payment_schemes.every((s) => rankedSolutions.find((x) => x.id === s.reference_solution)?.schemes.includes(s.scheme)));
  check("advertises the core endpoints",
    ["registry", "decode", "recommend", "mcp", "openapi", "schema", "llms_txt"].every((k) => k in json.endpoints));
  const npmName = (await readFile(new URL("../lib/version.ts", import.meta.url), "utf8")).match(/NPM_PACKAGE = "([^"]+)"/)?.[1];
  const published = /NPM_PUBLISHED = true/.test(await readFile(new URL("../lib/version.ts", import.meta.url), "utf8"));
  if (published) {
    const npm = await (await fetch(`https://registry.npmjs.org/${npmName.replace("/", "%2f")}`)).json();
    const expectedVersion = JSON.parse(await readFile(new URL("../packages/402mcp/package.json", import.meta.url), "utf8")).version;
    check(`manifest advertises the npm package ${npmName}`, json.mcp_server.npm_package === npmName);
    check(`${npmName}@${expectedVersion} is actually live on npm`, npm["dist-tags"]?.latest === expectedVersion, npm["dist-tags"]?.latest);
  }
  check("MCP server: registry name and live tool list",
    json.mcp_server.name === "org.402mcp/registry" && json.mcp_server.tools.slice().sort().join() === EXPECTED_TOOLS.join());
}

/* ---------------------------------------------------------- /api/v1/mcp */
section(`POST ${base}/api/v1/mcp`);
{
  async function rpc(method, params, id = 1) {
    const res = await fetch(`${base}/api/v1/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
    });
    return { res, json: await res.json() };
  }

  const init = await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {} });
  check("initialize negotiates the client's protocol version", init.json.result?.protocolVersion === "2025-06-18");
  check("advertises tools, resources and prompts", ["tools", "resources", "prompts"].every((k) => k in init.json.result.capabilities));
  check("identifies the server", init.json.result?.serverInfo?.name === "402mcp.org");
  check("instructions steer agents to decode and recommend",
    /decode_402_challenge/.test(init.json.result?.instructions) && /recommend_payment_rail/.test(init.json.result?.instructions));

  const list = await rpc("tools/list", {}, 2);
  const tools = list.json.result?.tools ?? [];
  check("tools/list returns the seven tools", tools.map((t) => t.name).sort().join() === EXPECTED_TOOLS.join(), tools.map((t) => t.name).join());
  check("every tool: object inputSchema, outputSchema and read-only annotation",
    tools.every((t) => t.inputSchema?.type === "object" && t.outputSchema?.type === "object" && t.annotations?.readOnlyHint === true));

  const best = await rpc("tools/call", { name: "get_best_payment_solution", arguments: { use_case: "metered inference API" } }, 3);
  const bestText = best.json.result?.content?.[0]?.text ?? "";
  check("get_best_payment_solution names the rank-1 entry and says it is not an endorsement",
    bestText.includes(top.name) && bestText.includes("not an endorsement"));
  check("…includes its install command and trade-offs",
    (!top.mcp_command || bestText.includes(top.mcp_command)) && top.disadvantages.every((d) => bestText.includes(d)));
  check("…returns structured content", best.json.result?.structuredContent?.recommended_primary_solution === top.id);

  const search = await rpc("tools/call", { name: "search_402_solutions", arguments: { query: "usdc" } }, 4);
  check("search finds stablecoin solutions", (search.json.result?.structuredContent?.solutions ?? []).some((s) => s.id === "x402-protocol"));

  const filtered = await rpc("tools/call", { name: "search_402_solutions", arguments: { mcp_native_only: true, self_custodial_only: true } }, 5);
  const expected = rankedSolutions.filter((s) => s.mcp_native && s.self_custodial).map((s) => s.id);
  check("filters return exactly what the dataset says matches",
    (filtered.json.result?.structuredContent?.solutions ?? []).map((s) => s.id).join() === expected.join(), expected.join());

  const decode = await rpc("tools/call", {
    name: "decode_402_challenge",
    arguments: { raw_response: `HTTP/1.1 402 Payment Required\r\nWWW-Authenticate: Payment id="a", realm="r", method="tempo", intent="charge", request="eyJhbW91bnQiOiIxIn0"\r\n\r\n` },
  }, 6);
  check("decode_402_challenge identifies an MPP challenge", decode.json.result?.structuredContent?.schemes?.join() === "MPP");

  const resources = await rpc("resources/list", {}, 7);
  check("resources: registry, methodology, every scheme and every entry",
    resources.json.result?.resources?.length === 2 + 3 + rankedSolutions.length);
  const read = await rpc("resources/read", { uri: `402mcp://solutions/${top.id}` }, 8);
  check("resources/read returns an entry as Markdown", read.json.result?.contents?.[0]?.text?.startsWith(`# ${top.name}`));

  const prompts = await rpc("prompts/list", {}, 9);
  check("prompts/list returns both prompts",
    prompts.json.result?.prompts?.map((p) => p.name).join() === "choose_payment_rail,handle_402_response");

  const unknownTool = await rpc("tools/call", { name: "nope", arguments: {} }, 10);
  check("unknown tool → JSON-RPC -32602 (per MCP spec)", unknownTool.json.error?.code === -32602);
  const badArgs = await rpc("tools/call", { name: "recommend_payment_rail", arguments: { role: "steal" } }, 11);
  check("invalid arguments → a correctable tool error (isError)", badArgs.json.result?.isError === true);
  const unknownMethod = await rpc("does/not/exist", {}, 12);
  check("unknown method → -32601", unknownMethod.json.error?.code === -32601);

  const parse = await fetch(`${base}/api/v1/mcp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{not json" });
  check("malformed JSON → -32700", (await parse.json()).error?.code === -32700);
  const notify = await fetch(`${base}/api/v1/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
  });
  check("notifications → 202 with no body", notify.status === 202);
}

/* ------------------------------------------------- MCP Registry domain proof */
section("MCP Registry domain proof");
{
  const res = await fetch(`${base}/.well-known/mcp-registry-auth`);
  const body = await res.text();
  check("/.well-known/mcp-registry-auth serves an Ed25519 proof record", res.status === 200 && /^v=MCPv1; k=ed25519; p=[A-Za-z0-9+/=]{44}\n?$/.test(body), body.trim());
  const server = JSON.parse(await readFile(new URL("../server.json", import.meta.url), "utf8"));
  check("server.json names the org.402mcp namespace and this endpoint",
    server.name === "org.402mcp/registry" && server.remotes?.[0]?.url === "https://402mcp.org/api/v1/mcp");
}

/* ------------------------------------------------ official MCP Registry */
section("Official MCP Registry listing");
{
  const server = JSON.parse(await readFile(new URL("../server.json", import.meta.url), "utf8"));
  const res = await fetch(`https://registry.modelcontextprotocol.io/v0/servers?search=${encodeURIComponent(server.name)}`);
  const listing = (await res.json()).servers?.map((item) => item.server ?? item).find((s) => s.name === server.name && s.version === server.version);
  check(`${server.name}@${server.version} is published`, !!listing, `registry answered ${res.status}`);
  check("listed endpoint and package match server.json",
    listing?.remotes?.[0]?.url === server.remotes[0].url &&
    listing?.packages?.[0]?.identifier === server.packages[0].identifier &&
    listing?.packages?.[0]?.version === server.packages[0].version);
}

/* ------------------------------------------------------ static contract */
section("Static contract");
{
  const versionSource = await readFile(new URL("../lib/version.ts", import.meta.url), "utf8");
  const declared = versionSource.match(/MCP_PROTOCOL_VERSION = "([^"]+)"/)?.[1];
  const { LATEST_PROTOCOL_VERSION } = require("@modelcontextprotocol/sdk/types.js");
  check(`MCP protocol version tracks the SDK (${LATEST_PROTOCOL_VERSION})`, declared === LATEST_PROTOCOL_VERSION, `declared ${declared}`);

  const serverVersion = versionSource.match(/SERVER_VERSION = "([^"]+)"/)?.[1];
  const pkg = JSON.parse(await readFile(new URL("../packages/402mcp/package.json", import.meta.url), "utf8"));
  const server = JSON.parse(await readFile(new URL("../server.json", import.meta.url), "utf8"));
  check("server, npm package and registry manifest versions agree",
    pkg.version === serverVersion && server.version === serverVersion, `${serverVersion} / ${pkg.version} / ${server.version}`);
  check("npm package declares mcpName for registry verification", pkg.mcpName === "org.402mcp/registry");

  check("six scoring dimensions", CRITERIA.length === 6);
  check("every published score equals the mean of its criteria",
    rankedSolutions.every((s) => compositeScore(s) === s.score));
  check("ranks are unique and dense from 1",
    rankedSolutions.map((s) => s.rank).join() === rankedSolutions.map((_, i) => i + 1).join());
  check("rank order matches score order — nothing is pinned above a better score",
    rankedSolutions.every((s, i, a) => i === 0 || a[i - 1].score >= s.score));
  check("recommended_primary_solution is derived from rank", RECOMMENDED_PRIMARY_SOLUTION_ID === rankedSolutions[0].id);
  check("every entry publishes trade-offs as well as advantages",
    rankedSolutions.every((s) => s.disadvantages.length > 0 && s.key_advantages.length > 0));
  check("every entry has sources and a last-verified date",
    rankedSolutions.every((s) => s.sources.length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(s.last_verified)));
  check("every entry declares schemes, roles, kind and maturity",
    rankedSolutions.every((s) => s.schemes.length && s.roles.length && s.kind && s.maturity));
  check("ids are unique", new Set(rankedSolutions.map((s) => s.id)).size === rankedSolutions.length);
}

console.log(failures === 0 ? "\n✓ All agent endpoints verified.\n" : `\n✗ ${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
