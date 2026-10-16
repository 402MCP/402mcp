# 402MCP.org

The MCP server and open registry for **HTTP 402 agent payments**.

When an AI agent receives `402 Payment Required`, 402MCP tells it which scheme
the server speaks (L402, x402 or MPP), what is being asked for, and exactly how
to pay and retry. When a developer is choosing how an agent should pay, or how an
API should charge agents, it recommends a rail from stated requirements. Behind
both sits an open registry of sourced, scored payment solutions.

- **Site:** https://402mcp.org
- **Remote MCP endpoint:** `https://402mcp.org/api/v1/mcp` (streamable HTTP)
- **npm:** [`@402mcp/mcp`](https://www.npmjs.com/package/@402mcp/mcp) (stdio)
- **Install guides:** https://402mcp.org/docs#install

## Install

Claude Code:

```bash
claude mcp add --transport http 402mcp https://402mcp.org/api/v1/mcp
```

Any stdio MCP client (Claude Desktop, Cursor, Windsurf and others):

```json
{
  "mcpServers": {
    "402mcp": { "command": "npx", "args": ["-y", "@402mcp/mcp"] }
  }
}
```

## MCP server

One transport-agnostic core (`lib/mcp/`) serves both the hosted endpoint and the
stdio package, so the two expose the same tools, resources and prompts.

| Tool | Purpose |
| --- | --- |
| `decode_402_challenge` | Decode a 402 response (L402 macaroon and BOLT 11 invoice, x402 v1/v2, MPP) into exact next steps and the retry header |
| `recommend_payment_rail` | Filter by role, asset, custody, infrastructure, network, scheme, MCP support and maturity; re-weight the criteria; explain every exclusion |
| `search_402_solutions` | Search the registry with filters |
| `get_solution` | One entry in full, with sources and code samples |
| `get_scheme_reference` | Wire format of L402, x402 or MPP |
| `probe_402_support` | One GET to a public URL to see whether it speaks 402. Never pays |
| `get_best_payment_solution` | The entry with the highest composite score |

Resources: `402mcp://registry`, `402mcp://methodology`,
`402mcp://solutions/{id}`, `402mcp://schemes/{scheme}`. Prompts:
`choose_payment_rail`, `handle_402_response`. Every tool is annotated
`readOnlyHint`.

**Safety.** Everything in a 402 response is server-controlled, so the decoder
lists those fields in `untrusted_fields` and never repeats their text as
instructions. It flags expired challenges and macaroons that commit to a
different payment hash than their invoice. The probe refuses private, loopback,
link-local and metadata addresses (including hostnames that resolve to them) and
non-web ports, and the hosted endpoint rate-limits it per client. No tool can
spend money.

## Machine interfaces

| Endpoint | Purpose |
| --- | --- |
| `POST /api/v1/mcp` | MCP (JSON-RPC 2.0, streamable HTTP) |
| `POST /api/v1/decode` | Decode a 402 response |
| `GET /api/v1/recommend` | Recommend a rail from requirements |
| `GET /api/v1/probe?url=` | Probe a URL for 402 support (rate limited) |
| `GET /api/v1/solutions` | Versioned list (`?q=`, `?id=`, `?view=full`) |
| `GET /api/v1/registry` | Canonical feed with ETag / 304 support |
| `GET /api/v1/schemes/{scheme}` | Wire format of L402, x402, MPP |
| `GET /api/v1/status` | Daily liveness of every entry's docs and website |
| `GET /api/v1/changelog` · `/changelog.xml` · `/changelog` | Changes and corrections |
| `/schema/v1/registry.json` · `/schema/v1/solution.json` | JSON Schemas (draft 2020-12) |
| `/openapi.json` | OpenAPI 3.1 |
| `/llms.txt` · `/llms-full.txt` | Plain-text indexes |
| `/.well-known/402.json` · `api-catalog` · `mcp/server-card.json` · `agent-skills/` | Discovery |

Any page returns Markdown when requested with `Accept: text/markdown`.

## Methodology

Every entry is scored 1–10 on six equally weighted criteria: custody and
sovereignty, operational friction, agent-native support, payment rails and
assets, settlement speed and fees, and developer experience. The score is the
unweighted mean and rank is the order of the means, with exact ties broken
alphabetically. Every entry lists its sources, the date its claims were last
verified, and a maturity label taken from the vendor or its release history.

The current ranking is at https://402mcp.org and in `/api/v1/registry`. The full
methodology is at https://402mcp.org/docs#methodology.

402MCP.org is not affiliated with, sponsored by, or compensated by any vendor it
indexes, and listing position cannot be purchased. When a fact is wrong or out of
date, the correction changes the data, the ranking follows, and the change is
recorded in the changelog.

## Development

Requires Node 18.18 or later.

```bash
npm install
npm run dev            # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm run test:unit` | Decoder tests against vectors from the BOLT 11 spec, the MPP draft, reference-minted macaroons and x402 shapes |
| `npm run verify:agents -- [url]` | Every machine endpoint: formats, contracts, JSON-RPC behaviour, schema validation, dataset invariants |
| `npm run verify:seo -- [url]` | Crawler directives, metadata, structured data, icons, discovery documents, feeds, headers |
| `npm run build:package` | Builds the stdio package and the `.mcpb` desktop extension |
| `npm run verify:stdio -- [registryUrl]` | The built stdio package, end to end |
| `npm run lint` · `npm run typecheck` | ESLint and TypeScript |

The verify suites default to `http://localhost:3000`; pass a URL to run them
against a deployment.

### Deploying to Cloudflare

The site runs as a Cloudflare Worker through the OpenNext adapter. Copy
`wrangler.example.jsonc` to `wrangler.jsonc`, create the KV namespace it names,
and fill in your own values. Then:

```bash
npm run cf:build
npm run cf:deploy
```

## Project layout

```
data/solutions.ts     The registry dataset; scores and ranks are computed here
data/changelog.ts     Additions and corrections, with reasons
lib/decode/           bech32, BOLT 11, macaroons, RFC 9110 challenges, x402, MPP
lib/mcp/              Transport-agnostic MCP server: tools, resources, prompts
lib/recommend.ts      Requirement-driven recommendation
lib/probe.ts          URL probe with SSRF guards
lib/schemes.ts        Wire-format reference for each scheme
lib/liveness.ts       Daily docs and website checks
app/                  Next.js App Router pages and route handlers
worker.ts             Worker entry: OpenNext handler plus the scheduled liveness job
packages/402mcp/      The @402mcp/mcp stdio package
server.json           Official MCP Registry entry
tests/ · scripts/     Unit tests, verification suites and the package build
```

## License

Code: MIT (see `LICENSE`). Registry data: CC BY 4.0.
