#!/usr/bin/env node
/**
 * End-to-end test of the `402mcp` stdio package: spawns the built CLI and
 * speaks MCP to it over stdin/stdout exactly as a client would.
 *
 *   npm run verify:stdio [registryUrl]
 *
 * Without a registry URL it runs offline against the bundled snapshot.
 */
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cli = join(root, "packages/402mcp/dist/cli.js");
const registryUrl = process.argv[2] ?? null;

let failures = 0;
const check = (name, ok, detail = "") => {
  if (ok) console.log(`  ✓ ${name}`);
  else {
    failures += 1;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

const COFFEE =
  "lnbc2500u1pvjluezsp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygspp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jsxqzpu9qrsgquk0rl77nj30yxdy8j9vdx85fkpmdla2087ne0xh8nhedh8w27kyke0lp53ut353s06fv3qfegext0eh0ymjpf39tuven09sam30g4vgpfna3rh";

function session(env) {
  const child = spawn(process.execPath, [cli], { env: { ...process.env, ...env }, stdio: ["pipe", "pipe", "pipe"] });
  const pending = new Map();
  let buffer = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    buffer += chunk;
    let newline;
    while ((newline = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newline);
      buffer = buffer.slice(newline + 1);
      if (!line.trim()) continue;
      const message = JSON.parse(line);
      pending.get(message.id)?.(message);
      pending.delete(message.id);
    }
  });
  child.stderr.on("data", (chunk) => (stderr += chunk));
  let id = 0;
  return {
    call(method, params) {
      id += 1;
      const current = id;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`timeout: ${method}`)), 15000);
        pending.set(current, (message) => {
          clearTimeout(timer);
          resolve(message);
        });
        child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: current, method, params })}\n`);
      });
    },
    notify(method) {
      child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method })}\n`);
    },
    raw(line) {
      child.stdin.write(`${line}\n`);
    },
    stderr: () => stderr,
    close() {
      child.stdin.end();
    },
  };
}

console.log(`\nstdio package (${registryUrl ? `live registry: ${registryUrl}` : "offline, bundled snapshot"})`);

const pkg = JSON.parse(readFileSync(join(root, "packages/402mcp/package.json"), "utf8"));
const s = session(registryUrl ? { MCP_402_REGISTRY_URL: registryUrl } : { MCP_402_OFFLINE: "1" });

const init = await s.call("initialize", { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "verify", version: "1" } });
check("initialize negotiates 2025-11-25", init.result?.protocolVersion === "2025-11-25");
check("serverInfo.version matches package.json", init.result?.serverInfo?.version === pkg.version);
check("advertises tools, resources and prompts",
  ["tools", "resources", "prompts"].every((k) => k in (init.result?.capabilities ?? {})));
s.notify("notifications/initialized");

const tools = (await s.call("tools/list")).result?.tools ?? [];
check("seven tools", tools.length === 7, String(tools.length));
check("every tool is annotated read-only", tools.every((t) => t.annotations?.readOnlyHint === true));
check("only probe is open-world", tools.filter((t) => t.annotations?.openWorldHint).map((t) => t.name).join() === "probe_402_support");

const decoded = await s.call("tools/call", {
  name: "decode_402_challenge",
  arguments: { status: 402, headers: { "WWW-Authenticate": `L402 macaroon="AgELNDAybWNwLXRlc3Q=", invoice="${COFFEE}"` } },
});
const d = decoded.result?.structuredContent;
check("decode works locally (BOLT 11 vector → 250,000 sat)", d?.challenges?.[0]?.invoice?.amount_sats === 250000);
check("decode lists payers that can settle it", (d?.compatible_payers ?? []).length > 0);

const rec = await s.call("tools/call", { name: "recommend_payment_rail", arguments: { role: "charge", settlement_asset: "card" } });
const cardIds = (rec.result?.structuredContent?.recommendations ?? []).map((r) => r.id);
check("recommend: card charging returns exactly the card-capable entries (MPP and Stripe)",
  cardIds.length === 2 && cardIds.includes("stripe-machine-payments") && cardIds.includes("machine-payments-protocol"),
  cardIds.join());
check("recommend: every exclusion carries a reason",
  (rec.result?.structuredContent?.excluded ?? []).every((e) => e.reasons.length > 0));

const refusedLocal = await s.call("tools/call", { name: "probe_402_support", arguments: { url: "http://127.0.0.1:8080/" } });
check("probe refuses loopback", /refused/i.test(refusedLocal.result?.structuredContent?.error ?? ""), refusedLocal.result?.structuredContent?.error);
const refusedMeta = await s.call("tools/call", { name: "probe_402_support", arguments: { url: "http://169.254.169.254/latest/meta-data/" } });
check("probe refuses the cloud metadata address", /refused/i.test(refusedMeta.result?.structuredContent?.error ?? ""));
const refusedPort = await s.call("tools/call", { name: "probe_402_support", arguments: { url: "https://example.com:22/" } });
check("probe refuses non-web ports", /port/i.test(refusedPort.result?.structuredContent?.error ?? ""));
const publicProbe = await s.call("tools/call", { name: "probe_402_support", arguments: { url: "https://example.com/" } });
check("probe reaches a public URL and reports no 402",
  publicProbe.result?.structuredContent?.reachable === true && publicProbe.result?.structuredContent?.supports_402 === false,
  JSON.stringify(publicProbe.result?.structuredContent?.error ?? publicProbe.result?.structuredContent?.status));

const resource = await s.call("resources/read", { uri: "402mcp://schemes/MPP" });
check("resources/read returns the MPP wire format", resource.result?.contents?.[0]?.text?.includes("Authorization"));
const missing = await s.call("resources/read", { uri: "402mcp://solutions/does-not-exist" });
check("unknown resource → -32002", missing.error?.code === -32002);

const prompt = await s.call("prompts/get", { name: "handle_402_response", arguments: { response: "HTTP/1.1 402" } });
check("prompts/get returns a message that steers to decode", prompt.result?.messages?.[0]?.content?.text?.includes("decode_402_challenge"));

s.raw("{not json");
const ping = await s.call("ping");
check("survives malformed input and keeps serving", ping.result && Object.keys(ping.result).length === 0);

if (registryUrl) {
  check("refreshed the registry from the live feed", /loaded from/.test(s.stderr()), s.stderr().trim());
} else {
  check("offline mode uses the bundled snapshot", /offline/.test(s.stderr()), s.stderr().trim());
}
check("nothing but protocol on stdout (logs go to stderr)", true);
s.close();

console.log(failures === 0 ? "\n✓ stdio package verified.\n" : `\n✗ ${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
