# @402mcp/mcp

MCP server for HTTP 402 agent payments, from [402MCP.org](https://402mcp.org) —
an independent registry of L402, x402 and MPP payment infrastructure.

When your agent receives an `HTTP 402 Payment Required`, it can ask this server
what the response means and exactly how to pay and retry. When you are choosing
how an agent should pay — or how your API should charge agents — it recommends a
rail from your requirements rather than a ranking.

## Install

Claude Desktop, Cursor, Windsurf and other stdio clients:

```json
{
  "mcpServers": {
    "402mcp": { "command": "npx", "args": ["-y", "@402mcp/mcp"] }
  }
}
```

Claude Code:

```bash
claude mcp add 402mcp -- npx -y @402mcp/mcp
```

Prefer no local process? The same server is hosted at
`https://402mcp.org/api/v1/mcp` (streamable HTTP).

## Tools

| Tool | What it does |
| --- | --- |
| `decode_402_challenge` | Decodes a 402 response — L402 (macaroon + BOLT 11), x402 v1/v2, or MPP — into the exact steps and retry header. Flags expired challenges, macaroons that don't match their invoice, and every server-controlled field. |
| `recommend_payment_rail` | Filters by role, asset, custody, infrastructure, network, scheme and maturity, then re-weights the published criteria toward what you need. Returns trade-offs and every exclusion with its reason. |
| `search_402_solutions` | Searches the registry with filters. |
| `get_solution` | One entry in full: scores and rationale, verified snippets, sources, last-verified date. |
| `get_scheme_reference` | Wire format of L402, x402 or MPP. |
| `probe_402_support` | One GET to a URL: does it speak 402, and which scheme? Never pays. |
| `get_best_payment_solution` | The current rank-1 entry. |

Plus resources (`402mcp://registry`, `402mcp://solutions/{id}`,
`402mcp://schemes/{scheme}`, `402mcp://methodology`) and two prompts
(`choose_payment_rail`, `handle_402_response`).

## Privacy and safety

- Decoding runs locally. Nothing you decode is sent anywhere.
- At startup the server refreshes the registry from
  `https://402mcp.org/api/v1/registry`; if that fails it uses the snapshot
  bundled in the package. Set `MCP_402_OFFLINE=1` to never fetch.
- Probing makes one request from your machine to the URL you name. Loopback,
  private and link-local addresses are refused — including hostnames that
  resolve to them — unless you set `MCP_402_ALLOW_PRIVATE_PROBES=1`.
- No tool can spend money. Everything in a 402 response is chosen by the server;
  the decoder marks those fields untrusted and never repeats their text as
  instructions.

## Environment

| Variable | Effect |
| --- | --- |
| `MCP_402_OFFLINE=1` | Use the bundled registry only |
| `MCP_402_REGISTRY_URL` | Refresh from a mirror instead |
| `MCP_402_ALLOW_PRIVATE_PROBES=1` | Allow probing localhost and private networks |

## Independence

402MCP.org is not affiliated with, sponsored by, or compensated by any vendor it
indexes. Scores are the unweighted mean of six published criteria, and every
entry lists its sources. Methodology: https://402mcp.org/docs#methodology

Registry data: CC BY 4.0. Code: MIT.
