/**
 * 402MCP.org — master dataset.
 *
 * The single source of truth for every surface: the leaderboard, detail pages,
 * REST API, llms.txt, the MCP server, the stdio package and the discovery
 * manifests all read from here.
 *
 * Every factual claim is backed by `sources` and dated by `last_verified`.
 * Scores and ranks are COMPUTED, never authored: the score is the unweighted
 * mean of the six criteria, and rank is the order of those means. Nothing in
 * this file — or anywhere else — pins a solution to a position.
 *
 * Kept free of imports so scripts can load it directly with Node.
 */

export const SITE_URL = "https://402mcp.org";

/** Version of the public API contract (`/api/v1/*`). Bump only on breaking change. */
export const PROTOCOL_VERSION = "1.0";

/** Human-readable name used in metadata, structured data and machine manifests. */
export const SITE_NAME = "402MCP.org";

/**
 * Date the registry dataset last changed, as YYYY-MM-DD. Drives every sitemap
 * `lastmod` and `dateModified`. Bump it when the data changes, not on deploy.
 */
export const REGISTRY_UPDATED = "2026-10-15";

/** Calendar version of the dataset, for consumers that mirror the registry. */
export const DATASET_VERSION = "2026.10.15";

/**
 * IndexNow key. Public by design — the protocol verifies ownership by serving
 * the same value at https://402mcp.org/<key>.txt.
 */
export const INDEXNOW_KEY = "4412bf547f40b469a73914c7930ca2c2";

/** The six dimensions every solution is scored on (1–10, equally weighted). */
export const CRITERIA = [
  {
    key: "custody_sovereignty",
    label: "Custody & Sovereignty",
    description:
      "Self-custodial with exit guarantees vs. centralized/custodial risk. A 10 means the holder keeps their own keys and can unilaterally exit to the base chain; a custodial platform scores around 4.",
  },
  {
    key: "operational_friction",
    label: "Operational Friction",
    description:
      "Infrastructure burden. Zero nodes, channels or liquidity to manage scores a 10; running and maintaining your own Lightning node scores around 4–5.",
  },
  {
    key: "agent_native_support",
    label: "Agent Native Support",
    description:
      "Out-of-the-box MCP server integration, typed tool calls and LLM-friendly setup. A first-party MCP server scores 9–10; a library or CLI an agent can drive scores 6–8.",
  },
  {
    key: "payment_rails_assets",
    label: "Payment Rails & Assets",
    description:
      "Breadth of settlement rails and assets: Lightning for true micropayments, stablecoins for a stable unit of account, cards for mainstream reach. A single asset on a single network scores around 7.",
  },
  {
    key: "settlement_speed_fees",
    label: "Settlement Speed & Fees",
    description:
      "Instant sub-second settlement with near-zero overhead scores a 10. Block-bound settlement scores around 8; card-network settlement and fees score lower.",
  },
  {
    key: "developer_dx",
    label: "Developer DX",
    description:
      "SDK quality, documentation, maintenance and copy-paste integration speed. Alpha-stage API churn, stale releases or inconsistent docs lower the score.",
  },
] as const satisfies readonly { key: string; label: string; description: string }[];

export type CriterionKey = (typeof CRITERIA)[number]["key"];
export type CriteriaScores = Record<CriterionKey, number>;

/** The HTTP 402 challenge schemes this registry indexes. */
export type PaymentScheme = "L402" | "x402" | "MPP";
export const PAYMENT_SCHEMES: readonly PaymentScheme[] = ["L402", "x402", "MPP"];

/** Which side of a 402 exchange a solution serves. */
export type Role = "pay" | "charge";

/** What kind of thing a solution is. */
export type Kind =
  | "protocol"
  | "wallet"
  | "gateway"
  | "client"
  | "sdk"
  | "facilitator"
  | "platform"
  | "mcp-server";

/**
 * Maturity is stated only as the vendor states it, or as release history
 * shows it — never as an editorial impression.
 */
export type Maturity = "production" | "preview" | "alpha" | "inactive" | "unstated";

export const MATURITY_DEFINITIONS: Record<Maturity, string> = {
  production: "The vendor describes it as used or supported in production.",
  preview: "The vendor labels it preview, Frontier, or draft.",
  alpha: "The vendor labels it alpha, or warns that its APIs may change between minor versions.",
  inactive: "No published release in the last 12 months.",
  unstated: "The vendor does not state a maturity level.",
};

export interface CodeSample {
  label: string;
  language: "bash" | "typescript" | "json" | "http" | "python" | "text";
  code: string;
}

export interface Source {
  title: string;
  url: string;
}

export interface PackageRef {
  registry: "npm" | "pypi" | "go";
  name: string;
}

/** Everything an entry's author writes. Rank and score are derived below. */
export interface SolutionEntry {
  /** Stable slug. Also the `id` in every machine payload and the page route. */
  id: string;
  name: string;
  tagline: string;
  /** Protocol / rail label shown in the leaderboard. */
  protocol: string;
  schemes: PaymentScheme[];
  roles: Role[];
  kind: Kind;
  maturity: Maturity;
  maturity_note: string | null;
  custody_type: string;
  /** True when the party paying or being paid holds their own keys. */
  self_custodial: boolean;
  node_management_required: boolean;
  mcp_native: boolean;
  /** One-line install command for agent tooling, or null when not applicable. */
  mcp_command: string | null;
  /** Command that starts this solution's own MCP server, if it ships one. */
  serve_command: string | null;
  /** One sentence used wherever the registry lists this entry on a single line. */
  index_summary: string;
  docs_url: string;
  website_url: string;
  license: string | null;
  assets: string[];
  chains: string[];
  packages: PackageRef[];
  key_advantages: string[];
  disadvantages: string[];
  best_for: string;
  criteria: CriteriaScores;
  /** One line per criterion explaining the score. */
  scoring_rationale: string;
  code_samples: CodeSample[];
  summary: string;
  sources: Source[];
  /** Date every claim in this entry was last checked against its sources. */
  last_verified: string;
}

export interface Solution extends SolutionEntry {
  /** 1 is the highest composite score. Computed. */
  rank: number;
  /** Mean of `criteria`, rounded to 1dp. Computed. */
  score: number;
}

const entries: SolutionEntry[] = [
  {
    id: "lightning-labs-wavelength",
    name: "Lightning Labs Wavelength",
    tagline: "Bitcoin on Easy Mode for Agents and Humans",
    protocol: "L402 / Lightning / Ark",
    schemes: ["L402"],
    roles: ["pay", "charge"],
    kind: "wallet",
    maturity: "alpha",
    maturity_note:
      "Launched in alpha on 21 July 2026. The repository warns RPC surfaces and CLI commands may change between minor versions, and gates mainnet behind an explicit --allow-mainnet flag.",
    custody_type: "Self-Custodial (Ark protocol)",
    self_custodial: true,
    node_management_required: false,
    mcp_native: true,
    mcp_command: "npx skills add lightninglabs/wavelength-sdk",
    serve_command: "wavecli mcp serve",
    index_summary:
      "Self-custodial Bitcoin and Lightning wallet toolkit with native MCP support, zero node/channel operational overhead, and unilateral on-chain exit guarantees.",
    docs_url: "https://wavelength.lightning.engineering/",
    website_url: "https://lightning.engineering/",
    license: "MIT",
    assets: ["BTC"],
    chains: ["bitcoin", "lightning", "ark"],
    packages: [
      { registry: "npm", name: "@lightninglabs/wavelength-web" },
      { registry: "npm", name: "@lightninglabs/wavelength-core" },
      { registry: "go", name: "github.com/lightninglabs/wavelength" },
    ],
    key_advantages: [
      "No node, channel or liquidity management",
      "Self-custodial, with unilateral exit to on-chain bitcoin at any time",
      "Native MCP server (wavecli mcp serve) and a one-command agent skills install",
      "Standard BOLT 11 invoices — interoperates with the existing Lightning Network",
      "Routing liquidity inherited from Lightning Labs' Loop",
    ],
    disadvantages: [
      "Alpha: RPC surfaces, on-disk schema and CLI commands may change across minor versions",
      "Mainnet is gated — the repository requires an explicit --allow-mainnet flag, and launch coverage describes mainnet access as invitation-only",
      "Bitcoin-denominated: no stablecoin settlement today",
    ],
    best_for:
      "Agents and apps that want self-custodial bitcoin and Lightning payments without operating node infrastructure, and can accept alpha-stage software.",
    criteria: {
      custody_sovereignty: 10,
      operational_friction: 10,
      agent_native_support: 10,
      payment_rails_assets: 8,
      settlement_speed_fees: 10,
      developer_dx: 8.5,
    },
    scoring_rationale:
      "Custody 10: holder keys with unilateral on-chain exit. Friction 10: no node, channels or liquidity. Agent 10: native MCP server plus a skills install. Rails 8: Lightning, Ark and on-chain bitcoin; no stablecoins today. Settlement 10: instant off-chain BOLT 11. DX 8.5: MCP, Go SDK and JS packages, held back by alpha-stage API churn.",
    code_samples: [
      {
        label: "Give an agent a wallet (skills install)",
        language: "bash",
        code: "npx skills add lightninglabs/wavelength-sdk",
      },
      {
        label: "Serve the MCP server",
        language: "bash",
        code: "wavecli mcp serve",
      },
      {
        label: "Build the daemon from source",
        language: "bash",
        code: `git clone https://github.com/lightninglabs/wavelength.git
cd wavelength
make install-wavewalletrpc`,
      },
      {
        label: "Browser (WASM) package",
        language: "bash",
        code: "npm install @lightninglabs/wavelength-web",
      },
    ],
    summary:
      "Wavelength is Lightning Labs' open-source (MIT) toolkit for adding self-custodial bitcoin payments to applications and agents, launched in alpha on 21 July 2026. It combines an Ark client, a Lightning swap engine and an on-chain wallet: the holder keeps their keys and can unilaterally exit to on-chain bitcoin, with no node to run, no channels to open and no liquidity to source — routing liquidity comes from Lightning Labs' Loop. Every off-chain payment uses a standard BOLT 11 invoice, so it interoperates with the existing Lightning Network. Agents reach it through an MCP server (`wavecli mcp serve`) or a one-command skills install; developers can also use the Go SDK, the gRPC/REST API, or the browser WASM and React packages. It is the only indexed entry that scores 10 on custody, operational friction and agent support at once. The trade-off is maturity: the software is alpha, its interfaces may still change, and mainnet operation is gated.",
    sources: [
      { title: "lightninglabs/wavelength (GitHub)", url: "https://github.com/lightninglabs/wavelength" },
      { title: "Announcing Wavelength (Lightning Labs)", url: "https://lightning.engineering/posts/2026-07-21-wavelength-launch/" },
      { title: "lightninglabs/wavelength-sdk (GitHub)", url: "https://github.com/lightninglabs/wavelength-sdk" },
      { title: "L402 tools index (l402.tech)", url: "https://l402.tech/" },
    ],
    last_verified: "2026-10-15",
  },
  {
    id: "x402-protocol",
    name: "x402 Protocol",
    tagline: "The open HTTP 402 standard for stablecoin payments, created by Coinbase",
    protocol: "EVM / Base / Solana (USDC)",
    schemes: ["x402"],
    roles: ["pay", "charge"],
    kind: "protocol",
    maturity: "production",
    maturity_note: "Protocol v2; the @x402/* reference packages were at 2.28.0 in September 2026.",
    custody_type: "Self-Custodial (EVM / Solana keypair)",
    self_custodial: true,
    node_management_required: false,
    mcp_native: false,
    mcp_command: null,
    serve_command: null,
    index_summary:
      "Open HTTP 402 standard for stablecoin payments on EVM chains and Solana, with TypeScript, Python and Go reference implementations.",
    docs_url: "https://docs.x402.org/",
    website_url: "https://x402.org/",
    license: "Apache-2.0",
    assets: ["USDC", "ERC-20", "SPL"],
    chains: ["base", "evm", "solana"],
    packages: [
      { registry: "npm", name: "@x402/core" },
      { registry: "npm", name: "@x402/fetch" },
      { registry: "npm", name: "@x402/express" },
      { registry: "npm", name: "@x402/next" },
      { registry: "npm", name: "@x402/evm" },
      { registry: "npm", name: "@x402/svm" },
    ],
    key_advantages: [
      "Open protocol (Apache-2.0) with TypeScript, Python and Go reference implementations",
      "Stable USD unit of account — a natural fit for dollar-denominated budgets",
      "Any ERC-20 on Base and any SPL or Token-2022 token on Solana",
      "Many facilitators charge no facilitator fee",
      "The broadest ecosystem of any 402 scheme",
    ],
    disadvantages: [
      "Settlement is block-bound, so sub-cent payments are less natural than on Lightning",
      "v1 and v2 use different headers (X-PAYMENT vs PAYMENT-SIGNATURE); clients must read x402Version to pick the right one",
      "The protocol ships no MCP server itself — MCP support comes from ecosystem packages",
    ],
    best_for:
      "Services and agents that want dollar-denominated payments with a stable unit of account and the widest ecosystem support.",
    criteria: {
      custody_sovereignty: 9,
      operational_friction: 8.5,
      agent_native_support: 8,
      payment_rails_assets: 9,
      settlement_speed_fees: 8,
      developer_dx: 9,
    },
    scoring_rationale:
      "Custody 9: the payer signs with their own keys. Friction 8.5: no node, but a facilitator and funded wallet are needed. Agent 8: no MCP server in the protocol itself; strong ecosystem MCP support. Rails 9: any ERC-20 on Base and SPL tokens on Solana. Settlement 8: block-bound but fast on Base and Solana. DX 9: mature multi-language SDKs.",
    code_samples: [
      { label: "Client: pay x402 endpoints", language: "bash", code: "npm install @x402/fetch" },
      { label: "Server: charge from Express", language: "bash", code: "npm install @x402/express" },
      {
        label: "v2 challenge — decoded PAYMENT-REQUIRED header (illustrative)",
        language: "json",
        code: `{
  "x402Version": 2,
  "accepts": [
    {
      "scheme": "exact",
      "network": "eip155:8453",
      "amount": "10000",
      "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      "payTo": "0xYourReceivingAddress",
      "maxTimeoutSeconds": 60
    }
  ]
}`,
      },
    ],
    summary:
      "x402 turns HTTP 402 into a payment challenge for on-chain stablecoins. In v2 the server answers with a base64-encoded PAYMENT-REQUIRED header listing accepted options — scheme, CAIP-2 network, amount in atomic units, asset and pay-to address; the client signs a payload and retries with PAYMENT-SIGNATURE, and the server reports settlement in PAYMENT-RESPONSE. v1 carried the requirements in the response body and used X-PAYMENT. Coinbase Developer Platform created the standard and publishes it as an open Apache-2.0 protocol under the x402-foundation organisation, with reference implementations in TypeScript, Python and Go; Base and Solana are supported on mainnet and testnet. It has the broadest ecosystem of any 402 scheme. The structural trade-off is settlement: payments clear at block speed with on-chain costs, so genuine sub-cent micropayments are less natural than on Lightning.",
    sources: [
      { title: "x402 FAQ", url: "https://docs.x402.org/faq" },
      { title: "x402: HTTP 402", url: "https://docs.x402.org/core-concepts/http-402" },
      { title: "@x402/core (npm)", url: "https://www.npmjs.com/package/@x402/core" },
    ],
    last_verified: "2026-10-15",
  },
  {
    id: "fewsats-l402",
    name: "Fewsats",
    tagline: "Hosted L402 payment platform with an MCP server for agents",
    protocol: "Bitcoin / Lightning (L402)",
    schemes: ["L402"],
    roles: ["pay"],
    kind: "platform",
    maturity: "inactive",
    maturity_note: "Last releases: fewsats-mcp 0.1.7 on PyPI (June 2025), @fewsats/fewsats-mcp 0.6.13 on npm (March 2025).",
    custody_type: "Custodial (hosted platform, API key)",
    self_custodial: false,
    node_management_required: false,
    mcp_native: true,
    mcp_command: "uvx fewsats-mcp",
    serve_command: "uvx fewsats-mcp",
    index_summary:
      "Hosted L402 payment platform with an MCP server that lets agents check balances and pay L402 offers through an API key.",
    docs_url: "https://docs.fewsats.com/",
    website_url: "https://fewsats.com/",
    license: "MIT",
    assets: ["BTC"],
    chains: ["lightning"],
    packages: [
      { registry: "pypi", name: "fewsats-mcp" },
      { registry: "npm", name: "@fewsats/fewsats-mcp" },
    ],
    key_advantages: [
      "MCP server with balance, payment-method, pay-offer and payment-info tools",
      "No node to run — a hosted platform reached with an API key",
      "Purpose-built around L402 offers",
    ],
    disadvantages: [
      "Custodial: funds sit with the platform, reached through FEWSATS_API_KEY",
      "No release in over 12 months on either PyPI or npm",
      "An independent analysis (AgentSeal) rated the MCP server 19/100, citing critical and high-severity findings — connect only a small balance",
    ],
    best_for: "Quick experiments paying L402 offers from an MCP client, with small balances.",
    criteria: {
      custody_sovereignty: 4,
      operational_friction: 9,
      agent_native_support: 7,
      payment_rails_assets: 7,
      settlement_speed_fees: 9,
      developer_dx: 6.5,
    },
    scoring_rationale:
      "Custody 4: custodial platform behind an API key. Friction 9: hosted, nothing to run. Agent 7: an MCP server exists but is inactive and has published security findings. Rails 7: Lightning bitcoin. Settlement 9: Lightning. DX 6.5: no recent releases.",
    code_samples: [
      { label: "Run the MCP server", language: "bash", code: "uvx fewsats-mcp" },
      {
        label: "Claude Desktop configuration",
        language: "json",
        code: `{
  "mcpServers": {
    "Fewsats": {
      "command": "uvx",
      "args": ["fewsats-mcp"],
      "env": { "FEWSATS_API_KEY": "YOUR_FEWSATS_API_KEY" }
    }
  }
}`,
      },
    ],
    summary:
      "Fewsats is a hosted payment platform built around L402. Its MCP server, run with `uvx fewsats-mcp` and an API key, gives agents tools to check a balance, list payment methods, pay L402 offers and look up payment details, with no node or channel management. That convenience is custodial: the platform holds the funds behind the API key. Release activity has stopped — the last PyPI release was June 2025 and the last npm release March 2025 — and an independent analysis by AgentSeal rated the MCP server 19/100 with critical and high-severity findings, so any wallet connected to it should carry only a small balance.",
    sources: [
      { title: "fewsats-mcp (PyPI)", url: "https://pypi.org/project/fewsats-mcp/" },
      { title: "@fewsats/fewsats-mcp (npm)", url: "https://www.npmjs.com/package/@fewsats/fewsats-mcp" },
      { title: "Fewsats on GitHub", url: "https://github.com/fewsats" },
      { title: "AgentSeal analysis of fewsats-mcp", url: "https://agentseal.org/mcp/https-githubcom-fewsats-fewsats-mcp" },
    ],
    last_verified: "2026-10-15",
  },
  {
    id: "crossmint-agent-wallets",
    name: "Crossmint Agent Wallets",
    tagline: "Smart-contract agent wallets with spending controls, paying x402 endpoints",
    protocol: "EVM (USDC on Base)",
    schemes: ["x402"],
    roles: ["pay"],
    kind: "wallet",
    maturity: "production",
    maturity_note: "Crossmint describes x402 as supported in production; MPP, ACP and AP2 are listed as planned.",
    custody_type: "Smart-contract wallet: owner key plus a scoped agent signer",
    self_custodial: false,
    node_management_required: false,
    mcp_native: false,
    mcp_command: null,
    serve_command: null,
    index_summary:
      "Smart-contract wallets for agents with an owner key and a scoped agent signer, paying x402 endpoints in USDC on Base.",
    docs_url: "https://docs.crossmint.com/agents/payment-flows/x402",
    website_url: "https://www.crossmint.com/",
    license: "Apache-2.0",
    assets: ["USDC"],
    chains: ["base", "evm"],
    packages: [{ registry: "npm", name: "@crossmint/wallets-sdk" }],
    key_advantages: [
      "Scoped agent wallets: the agent transacts within limits the owner sets",
      "Owner key plus a separate agent signer",
      "Pays x402 endpoints with the standard @x402/core client",
      "Onramp for funding, and a staging helper that mints test tokens",
    ],
    disadvantages: [
      "x402 with USDC on Base is the documented path today; MPP, ACP and AP2 are listed as planned",
      "The agent holds a delegated signer, not sole custody — the platform is in the trust path",
      "Anyone holding a server-signer secret can sign for every wallet it was authorized on",
    ],
    best_for:
      "Teams that want managed agent wallets with spending controls and onboarding, paying dollar-denominated x402 APIs.",
    criteria: {
      custody_sovereignty: 7,
      operational_friction: 9,
      agent_native_support: 7,
      payment_rails_assets: 7.5,
      settlement_speed_fees: 8,
      developer_dx: 8,
    },
    scoring_rationale:
      "Custody 7: owner key plus delegated agent signer. Friction 9: managed wallets, no node. Agent 7: SDK and agent docs, no MCP server. Rails 7.5: USDC on Base via x402, plus onramps. Settlement 8: Base. DX 8: documented SDK path.",
    code_samples: [
      {
        label: "Install (wallet SDK + x402 client)",
        language: "bash",
        code: "npm install @crossmint/wallets-sdk @x402/core @x402/evm viem",
      },
    ],
    summary:
      "Crossmint provides smart-contract wallets for AI agents: an owner authorizes a scoped agent signer, and the agent transacts within the limits set. Its documented x402 flow pays protected endpoints from an EVM wallet on Base holding USDC, using the standard @x402/core and @x402/evm libraries alongside @crossmint/wallets-sdk. Crossmint describes x402 as supported in production, with MPP, ACP and AP2 planned. On custody it is a middle ground — the owner keeps a key, but the agent's signer and the platform sit in the trust path — which suits teams that want managed onboarding and guardrails more than sole custody.",
    sources: [
      { title: "Crossmint: x402 payment flow", url: "https://docs.crossmint.com/agents/payment-flows/x402" },
      { title: "Crossmint: agentic payment protocols compared", url: "https://www.crossmint.com/learn/agentic-payments-protocols-compared" },
      { title: "@crossmint/wallets-sdk (npm)", url: "https://www.npmjs.com/package/@crossmint/wallets-sdk" },
    ],
    last_verified: "2026-10-15",
  },
  {
    id: "vercel-402-mcp-middleware",
    name: "x402-mcp (Vercel)",
    tagline: "Charge per MCP tool call with x402 — a thin wrapper over mcp-handler",
    protocol: "x402 (USDC on Base) for MCP servers",
    schemes: ["x402"],
    roles: ["pay", "charge"],
    kind: "sdk",
    maturity: "inactive",
    maturity_note: "Version 0.1.1, last published September 2025.",
    custody_type: "Self-custodial (your recipient address; clients sign with their own key)",
    self_custodial: true,
    node_management_required: false,
    mcp_native: true,
    mcp_command: "npm i x402-mcp",
    serve_command: null,
    index_summary:
      "Library for charging per MCP tool call with x402, wrapping mcp-handler, plus a client helper that pays 402 challenges automatically.",
    docs_url: "https://github.com/ethanniser/x402-mcp",
    website_url: "https://vercel.com/blog/introducing-x402-mcp-open-protocol-payments-for-mcp-tools",
    license: "MIT",
    assets: ["USDC"],
    chains: ["base"],
    packages: [{ registry: "npm", name: "x402-mcp" }],
    key_advantages: [
      "paidTool attaches a price to individual MCP tools; free and paid tools coexist",
      "createPaidMcpHandler exports Next.js route handlers",
      "withPayment wraps an AI SDK MCP client to pay 402 challenges automatically",
    ],
    disadvantages: [
      "Version 0.1.1, with no release since September 2025",
      "Documented paidTool signatures differ between sources — check the installed version",
      "The code lives in a personal GitHub account rather than a Vercel organization",
    ],
    best_for: "Next.js developers who want to charge per call for individual MCP tools.",
    criteria: {
      custody_sovereignty: 8,
      operational_friction: 8.5,
      agent_native_support: 9,
      payment_rails_assets: 7,
      settlement_speed_fees: 8,
      developer_dx: 6.5,
    },
    scoring_rationale:
      "Custody 8: payments go to your own address; clients sign with their own key. Friction 8.5: deploys as a Next.js route, needs a facilitator. Agent 9: MCP-native paid tools and a paying client. Rails 7: USDC on Base. Settlement 8: Base. DX 6.5: early, inactive package with inconsistent docs.",
    code_samples: [{ label: "Install", language: "bash", code: "npm i x402-mcp" }],
    summary:
      "x402-mcp, announced by Vercel, is a light wrapper around the mcp-handler package that lets an MCP server charge per tool call over x402. paidTool attaches a price to a tool, createPaidMcpHandler configures the receiving wallet and exports Next.js route handlers, and withPayment wraps an AI SDK MCP client so 402 challenges are paid automatically. It is small and ergonomic, but early and quiet: the package is at 0.1.1, was last published in September 2025, and the documented paidTool signature differs between sources, so check the installed version before copying examples.",
    sources: [
      { title: "Introducing x402-mcp (Vercel)", url: "https://vercel.com/blog/introducing-x402-mcp-open-protocol-payments-for-mcp-tools" },
      { title: "x402-mcp (npm)", url: "https://www.npmjs.com/package/x402-mcp" },
      { title: "ethanniser/x402-mcp (GitHub)", url: "https://github.com/ethanniser/x402-mcp" },
    ],
    last_verified: "2026-10-15",
  },
  {
    id: "stripe-machine-payments",
    name: "Stripe Machine Payments",
    tagline: "Accept agent payments over MPP and x402 — cards and stablecoins",
    protocol: "MPP (cards, stablecoins) and x402 (USDC)",
    schemes: ["MPP", "x402"],
    roles: ["charge"],
    kind: "platform",
    maturity: "preview",
    maturity_note:
      "A Stripe Frontier feature. Stablecoin acceptance is available to businesses in all US states except New York; businesses outside the US must contact Stripe.",
    custody_type: "Custodial (funds settle to your Stripe account)",
    self_custodial: false,
    node_management_required: false,
    mcp_native: false,
    mcp_command: null,
    serve_command: null,
    index_summary:
      "Stripe's machine payments let businesses accept agent payments over MPP (cards and stablecoins) and x402 (USDC), settling to a Stripe account.",
    docs_url: "https://docs.stripe.com/payments/machine",
    website_url: "https://stripe.com/blog/machine-payments-protocol",
    license: null,
    assets: ["USD (card)", "USDC", "USDC.e"],
    chains: ["card", "tempo", "solana", "base"],
    packages: [],
    key_advantages: [
      "Accepts cards and buy-now-pay-later through Shared Payment Tokens, as well as stablecoins",
      "Both MPP (Tempo USDC.e, Solana USDC) and x402 (Base USDC) from one platform",
      "MPP sessions charge in sub-cent increments, settling from 0.01 USDC",
      "No crypto infrastructure to operate — payments settle into a Stripe account",
    ],
    disadvantages: [
      "A Frontier (preview) feature",
      "Stablecoin acceptance is unavailable to businesses in New York; non-US businesses must apply",
      "Card payments carry a 0.50 USD minimum and card-network settlement",
      "Custodial: funds settle to a Stripe account, under Stripe's terms",
    ],
    best_for:
      "Businesses that want to accept agent payments, including cards, without operating any crypto infrastructure.",
    criteria: {
      custody_sovereignty: 4,
      operational_friction: 9,
      agent_native_support: 8,
      payment_rails_assets: 9.5,
      settlement_speed_fees: 7,
      developer_dx: 8.5,
    },
    scoring_rationale:
      "Custody 4: custodial merchant account. Friction 9: fully hosted. Agent 8: designed for agents, with receipts; no 402-specific MCP server. Rails 9.5: cards, BNPL and stablecoins across MPP and x402. Settlement 7: fast for stablecoins, slow and costly for cards. DX 8.5: Stripe-grade docs on a preview feature.",
    code_samples: [],
    summary:
      "Stripe's machine payments let a business charge agents per call without a checkout UI. It works best with the Machine Payments Protocol, which Stripe co-authored with Tempo and which accepts both cards — through Shared Payment Tokens — and stablecoins; x402 is supported as a stablecoin-only option. Stripe's docs list MPP on Tempo (USDC.e) and Solana (USDC), and x402 on Base (USDC). Payments settle into a Stripe account, so there is no wallet or node to run, and agents receive a receipt with the paid resource. Card payments have a 0.50 USD minimum, stablecoin payments a 0.01 USDC minimum, and MPP sessions can meter in sub-cent increments. It is a Frontier feature, and stablecoin acceptance is unavailable to businesses in New York.",
    sources: [
      { title: "Stripe: Machine payments", url: "https://docs.stripe.com/payments/machine" },
      { title: "Stripe: MPP", url: "https://docs.stripe.com/payments/machine/mpp" },
      { title: "Introducing the Machine Payments Protocol (Stripe)", url: "https://stripe.com/blog/machine-payments-protocol" },
    ],
    last_verified: "2026-10-15",
  },
  {
    id: "machine-payments-protocol",
    name: "Machine Payments Protocol (MPP)",
    tagline: "The 'Payment' HTTP authentication scheme — one 402 challenge, many payment methods",
    protocol: "Multi-method: Tempo, Stripe, Lightning, EVM, Solana and more",
    schemes: ["MPP"],
    roles: ["pay", "charge"],
    kind: "protocol",
    maturity: "preview",
    maturity_note:
      "The core is draft-ryan-httpauth-payment-01 (March 2026), an individual Internet-Draft with no formal IETF standing; method and intent specs are also drafts.",
    custody_type: "Depends on the payment method (self-custodial methods exist)",
    self_custodial: true,
    node_management_required: false,
    mcp_native: false,
    mcp_command: null,
    serve_command: null,
    index_summary:
      "Open, method-agnostic HTTP 402 scheme co-authored by Tempo and Stripe, using WWW-Authenticate: Payment challenges and Payment-Receipt receipts.",
    docs_url: "https://paymentauth.org/",
    website_url: "https://github.com/tempoxyz/mpp-specs",
    license: null,
    assets: ["USD (card)", "USDC", "BTC (Lightning)", "other stablecoins"],
    chains: ["tempo", "solana", "evm", "lightning", "stellar", "xrpl", "hedera", "card"],
    packages: [{ registry: "npm", name: "mppx" }],
    key_advantages: [
      "Method-agnostic: one challenge format across cards, stablecoins and Lightning",
      "Standard HTTP authentication framing — WWW-Authenticate and Authorization: Payment, with a Payment-Receipt",
      "Charge, session and subscription intents",
      "Drafts for discovery and for an MCP / JSON-RPC transport",
      "Implemented server-side by Stripe and by Lightning Labs' Aperture",
    ],
    disadvantages: [
      "An individual Internet-Draft with no formal IETF standing; method specs are still drafts",
      "Custody, fees and settlement speed depend entirely on the method chosen",
      "A younger ecosystem than x402",
    ],
    best_for:
      "Services that want one 402 integration accepting several payment methods — cards, stablecoins and Lightning.",
    criteria: {
      custody_sovereignty: 8,
      operational_friction: 8,
      agent_native_support: 8.5,
      payment_rails_assets: 9.5,
      settlement_speed_fees: 8,
      developer_dx: 7.5,
    },
    scoring_rationale:
      "Custody 8: self-custodial methods exist, but it depends on the method. Friction 8: the protocol needs no node; method infrastructure varies. Agent 8.5: an MCP transport is drafted in the spec. Rails 9.5: the broadest method coverage of any scheme. Settlement 8: method-dependent. DX 7.5: draft specs and a 0.x SDK.",
    code_samples: [
      { label: "TypeScript SDK", language: "bash", code: "npm install mppx" },
      {
        label: "Challenge — example from the IETF draft",
        language: "http",
        code: `HTTP/1.1 402 Payment Required
Cache-Control: no-store
WWW-Authenticate: Payment id="x7Tg2pLqR9mKvNwY3hBcZa",
    realm="api.example.com",
    method="example",
    intent="charge",
    expires="2025-01-15T12:05:00Z",
    request="eyJhbW91bnQiOiIxMDAwIiwiY3VycmVuY3kiOiJVU0QiLCJyZWNpcGllbnQiOiJhY2N0XzEyMyJ9"`,
      },
    ],
    summary:
      "The Machine Payments Protocol, co-authored by Tempo and Stripe and launched in March 2026, defines a 'Payment' HTTP authentication scheme. A server answers with 402 and WWW-Authenticate: Payment carrying an id, realm, method, intent and a base64url-encoded JSON request; the client pays through the named method and retries with Authorization: Payment and a base64url credential; successful responses may carry a Payment-Receipt. The core is method-agnostic, with drafts for charge, session and subscription intents and for methods including Tempo, Stripe, card, Lightning, EVM, Solana, Stellar and others, plus drafts for discovery and an MCP transport. Stripe and Lightning Labs' Aperture implement it server-side. It is still a draft: the core is an individual Internet-Draft with no formal IETF standing, and custody, fees and speed depend on the method.",
    sources: [
      { title: "draft-ryan-httpauth-payment (IETF)", url: "https://datatracker.ietf.org/doc/html/draft-ryan-httpauth-payment" },
      { title: "tempoxyz/mpp-specs (GitHub)", url: "https://github.com/tempoxyz/mpp-specs" },
      { title: "Payment auth specifications index", url: "https://paymentauth.org/" },
      { title: "wevm/mppx (GitHub)", url: "https://github.com/wevm/mppx" },
    ],
    last_verified: "2026-10-15",
  },
  {
    id: "lightning-labs-aperture",
    name: "Aperture",
    tagline: "The reference L402 reverse proxy — now also speaking MPP",
    protocol: "Bitcoin / Lightning (L402, MPP)",
    schemes: ["L402", "MPP"],
    roles: ["charge"],
    kind: "gateway",
    maturity: "production",
    maturity_note: "Used in production by Lightning Loop. Its MPP support is a draft and off by default.",
    custody_type: "Self-custodial (your own lnd node)",
    self_custodial: true,
    node_management_required: true,
    mcp_native: false,
    mcp_command: null,
    serve_command: null,
    index_summary:
      "Lightning Labs' open-source HTTP 402 reverse proxy that puts L402 — and optionally MPP — payment checks in front of HTTP and gRPC backends.",
    docs_url: "https://docs.lightning.engineering/lightning-network-tools/aperture/get-aperture",
    website_url: "https://github.com/lightninglabs/aperture",
    license: "MIT",
    assets: ["BTC"],
    chains: ["lightning"],
    packages: [{ registry: "go", name: "github.com/lightninglabs/aperture" }],
    key_advantages: [
      "The reference L402 implementation, used in production by Lightning Loop",
      "Gates any HTTP or gRPC backend without changing it",
      "Optional MPP support (charge and session intents) via --authenticator.enablempp",
      "Prepaid usage bundles through a separate price server",
    ],
    disadvantages: [
      "Requires an lnd node you operate, plus TLS and a database",
      "Built from source with Go 1.25+, configured in YAML",
      "Upgrade notes list breaking changes that need care",
    ],
    best_for: "Operators who already run lnd and want to sell API access over L402 with full self-custody.",
    criteria: {
      custody_sovereignty: 9,
      operational_friction: 4,
      agent_native_support: 6,
      payment_rails_assets: 7.5,
      settlement_speed_fees: 9.5,
      developer_dx: 6.5,
    },
    scoring_rationale:
      "Custody 9: your own lnd node. Friction 4: lnd, TLS, a database and a Go build. Agent 6: no MCP server. Rails 7.5: Lightning, plus MPP. Settlement 9.5: Lightning. DX 6.5: source build, YAML config, breaking upgrades.",
    code_samples: [
      {
        label: "Build and install",
        language: "bash",
        code: `git clone https://github.com/lightninglabs/aperture.git
cd aperture
make install`,
      },
    ],
    summary:
      "Aperture is Lightning Labs' HTTP 402 reverse proxy and the reference implementation of L402: it sits in front of HTTP and gRPC backends, issues macaroons with Lightning invoices, and forwards requests once a valid token and preimage are presented. It also implements the MPP 'Payment' scheme for charge and session intents, off by default behind a flag. It is used in production by Lightning Loop. The cost is operational: you run your own lnd node, provide TLS and a database, and build from source with Go — full self-custody in exchange for the most infrastructure of any entry.",
    sources: [
      { title: "lightninglabs/aperture (GitHub)", url: "https://github.com/lightninglabs/aperture" },
      { title: "Get Aperture (Lightning Labs docs)", url: "https://docs.lightning.engineering/lightning-network-tools/aperture/get-aperture" },
      { title: "L402 tools index (l402.tech)", url: "https://l402.tech/" },
    ],
    last_verified: "2026-10-15",
  },
  {
    id: "lightning-labs-lnget",
    name: "lnget",
    tagline: "curl for L402 — an HTTP client that pays 402 invoices automatically",
    protocol: "Bitcoin / Lightning (L402)",
    schemes: ["L402"],
    roles: ["pay"],
    kind: "client",
    maturity: "unstated",
    maturity_note: null,
    custody_type: "Self-custodial (your lnd node, LNC, or embedded wallet)",
    self_custodial: true,
    node_management_required: true,
    mcp_native: false,
    mcp_command: null,
    serve_command: null,
    index_summary:
      "Command-line HTTP client that pays L402 invoices automatically and caches the token, backed by lnd, Lightning Node Connect or an embedded wallet.",
    docs_url: "https://github.com/lightninglabs/lnget",
    website_url: "https://l402.tech/",
    license: "MIT",
    assets: ["BTC"],
    chains: ["lightning"],
    packages: [{ registry: "go", name: "github.com/lightninglabs/lnget" }],
    key_advantages: [
      "Pays 402 invoices and retries transparently, caching the L402 token",
      "--max-cost caps what a single request may spend",
      "Usable from any shell or agent that can run a command",
    ],
    disadvantages: [
      "Needs a Lightning backend: lnd, Lightning Node Connect, or an experimental embedded wallet",
      "Lightning and L402 only",
    ],
    best_for: "Agents and scripts that call L402-protected APIs from the command line with a hard spending cap.",
    criteria: {
      custody_sovereignty: 9,
      operational_friction: 5,
      agent_native_support: 7,
      payment_rails_assets: 7,
      settlement_speed_fees: 9.5,
      developer_dx: 7.5,
    },
    scoring_rationale:
      "Custody 9: your own node or wallet. Friction 5: needs lnd or LNC. Agent 7: a CLI any agent can call; no MCP server. Rails 7: Lightning only. Settlement 9.5: Lightning. DX 7.5: one go install and simple flags.",
    code_samples: [
      { label: "Install", language: "bash", code: "go install github.com/lightninglabs/lnget/cmd/lnget@latest" },
      {
        label: "Usage",
        language: "bash",
        code: `lnget https://api.example.com/premium-data.json
lnget -o data.json https://api.example.com/data.json
lnget -q https://api.example.com/data.json | jq .
lnget --max-cost 5000 https://api.example.com/expensive-endpoint`,
      },
    ],
    summary:
      "lnget is a command-line HTTP client, like wget or curl, that handles L402 payments transparently: when a server returns 402, it pays the invoice, caches the token and retries. A --max-cost flag caps spend per request, which makes it a safe primitive for agents that can run shell commands. It needs a Lightning backend — an lnd node, a remote node through Lightning Node Connect, or an experimental embedded Neutrino wallet.",
    sources: [
      { title: "lightninglabs/lnget (GitHub)", url: "https://github.com/lightninglabs/lnget" },
      { title: "L402 tools index (l402.tech)", url: "https://l402.tech/" },
    ],
    last_verified: "2026-10-15",
  },
  {
    id: "alby-mcp",
    name: "Alby MCP Server",
    tagline: "Connect a Lightning wallet to any MCP client over Nostr Wallet Connect",
    protocol: "Bitcoin / Lightning (NWC, L402)",
    schemes: ["L402"],
    roles: ["pay", "charge"],
    kind: "mcp-server",
    maturity: "unstated",
    maturity_note: null,
    custody_type: "Self-custodial with Alby Hub (custody follows the connected NWC wallet)",
    self_custodial: true,
    node_management_required: false,
    mcp_native: true,
    mcp_command: "npx -y @getalby/mcp",
    serve_command: "npx -y @getalby/mcp",
    index_summary:
      "Alby's official MCP server connects a Lightning wallet to agents over Nostr Wallet Connect, with invoice, payment and L402 tools.",
    docs_url: "https://github.com/getAlby/mcp",
    website_url: "https://getalby.com/",
    license: "MIT",
    assets: ["BTC"],
    chains: ["lightning"],
    packages: [{ registry: "npm", name: "@getalby/mcp" }],
    key_advantages: [
      "Official MCP server, over stdio or as a hosted remote endpoint",
      "Creates and pays invoices, parses BOLT 11, and accesses L402-protected resources",
      "Scoped Nostr Wallet Connect permissions limit what the agent can do",
      "Works with Claude, Goose, Cline, n8n and other MCP clients",
    ],
    disadvantages: [
      "L402 needs a wallet that returns the payment preimage — not every NWC wallet does",
      "Custody follows the connected wallet; a custodial NWC wallet is custodial",
      "Lightning bitcoin only",
    ],
    best_for: "Giving an existing MCP client a Lightning wallet, with permissions scoped by the wallet connection.",
    criteria: {
      custody_sovereignty: 8,
      operational_friction: 7.5,
      agent_native_support: 9.5,
      payment_rails_assets: 7,
      settlement_speed_fees: 9.5,
      developer_dx: 8.5,
    },
    scoring_rationale:
      "Custody 8: self-custodial with Alby Hub, but it depends on the wallet. Friction 7.5: needs a funded NWC wallet with Lightning liquidity. Agent 9.5: official MCP server, local and remote. Rails 7: Lightning. Settlement 9.5: Lightning. DX 8.5: one npx command.",
    code_samples: [
      {
        label: "Claude Desktop configuration",
        language: "json",
        code: `{
  "mcpServers": {
    "alby": {
      "command": "npx",
      "args": ["-y", "@getalby/mcp"],
      "env": {
        "NWC_CONNECTION_STRING": "YOUR NWC CONNECTION STRING HERE"
      }
    }
  }
}`,
      },
      {
        label: "Hosted remote endpoint",
        language: "text",
        code: "https://mcp.getalby.com/mcp?nwc=ENCODED_NWC_URL",
      },
    ],
    summary:
      "Alby's official MCP server connects a bitcoin Lightning wallet to an LLM over Nostr Wallet Connect. It runs over stdio with `npx -y @getalby/mcp` and an NWC connection string, or as a hosted remote endpoint, and gives agents tools to create and pay invoices, check balances, parse BOLT 11 invoices and access L402-protected resources. Custody follows the wallet you connect — self-custodial with Alby Hub — and NWC permissions scope what the agent may do. For L402, the wallet must return the payment preimage.",
    sources: [
      { title: "getAlby/mcp (GitHub)", url: "https://github.com/getAlby/mcp" },
      { title: "@getalby/mcp (npm)", url: "https://www.npmjs.com/package/@getalby/mcp" },
    ],
    last_verified: "2026-10-15",
  },
  {
    id: "cloudflare-agents-x402",
    name: "Cloudflare Agents SDK (x402)",
    tagline: "Charge per MCP tool call on Workers with paidTool",
    protocol: "x402 (USDC on Base)",
    schemes: ["x402"],
    roles: ["pay", "charge"],
    kind: "sdk",
    maturity: "unstated",
    maturity_note: null,
    custody_type: "Self-custodial (payments go to your own address)",
    self_custodial: true,
    node_management_required: false,
    mcp_native: true,
    mcp_command: "npm install agents",
    serve_command: null,
    index_summary:
      "Cloudflare's Agents SDK adds x402 pricing to MCP tools with paidTool, so free and paid tools coexist on one server.",
    docs_url: "https://developers.cloudflare.com/agents/tools/payments/x402/charge-for-mcp-tools/",
    website_url: "https://developers.cloudflare.com/agents/",
    license: "MIT",
    assets: ["USDC"],
    chains: ["base"],
    packages: [{ registry: "npm", name: "agents" }],
    key_advantages: [
      "paidTool is a drop-in replacement for tool — free and paid tools coexist on one MCP server",
      "Runs on Cloudflare Workers through McpAgent",
      "withX402 gates ordinary HTTP endpoints the same way",
    ],
    disadvantages: [
      "Documented networks are Base and Base Sepolia",
      "Tied to Cloudflare Workers and the Agents SDK",
    ],
    best_for: "Developers on Cloudflare Workers who want to charge per call for MCP tools.",
    criteria: {
      custody_sovereignty: 8,
      operational_friction: 8.5,
      agent_native_support: 9.5,
      payment_rails_assets: 7,
      settlement_speed_fees: 8,
      developer_dx: 9,
    },
    scoring_rationale:
      "Custody 8: payments to your own address. Friction 8.5: deploy on Workers, uses a facilitator. Agent 9.5: MCP-native paid tools. Rails 7: USDC on Base. Settlement 8: Base. DX 9: a drop-in API.",
    code_samples: [
      { label: "Install", language: "bash", code: "npm install agents" },
      {
        label: "A paid MCP tool (from Cloudflare's docs)",
        language: "typescript",
        code: `this.server.paidTool(
	"square",
	"Squares a number",
	0.01, // USD
	{ number: z.number() },
	{},
	async ({ number }) => { /* ... */ },
);`,
      },
    ],
    summary:
      "Cloudflare's Agents SDK supports x402 natively. On an McpAgent, paidTool is a drop-in replacement for tool that attaches a USD price, so free and paid tools coexist on one server; withX402 gates ordinary HTTP content the same way. The documented configuration pays a recipient address you supply, through the x402.org facilitator, on Base or Base Sepolia. It is the most direct path to charging for MCP tools if you already deploy on Workers.",
    sources: [
      { title: "Cloudflare: Charge for MCP tools", url: "https://developers.cloudflare.com/agents/tools/payments/x402/charge-for-mcp-tools/" },
      { title: "agents (npm)", url: "https://www.npmjs.com/package/agents" },
    ],
    last_verified: "2026-10-15",
  },
  {
    id: "thirdweb-x402",
    name: "thirdweb x402",
    tagline: "Hosted x402 facilitator and agent payment endpoint across EVM chains",
    protocol: "x402 on 170+ EVM chains",
    schemes: ["x402"],
    roles: ["pay", "charge"],
    kind: "facilitator",
    maturity: "unstated",
    maturity_note: null,
    custody_type: "Settles through thirdweb-managed server wallets",
    self_custodial: false,
    node_management_required: false,
    mcp_native: false,
    mcp_command: null,
    serve_command: null,
    index_summary:
      "thirdweb's hosted x402 facilitator settles payments on 170+ EVM chains, with a client fetch wrapper and a hosted endpoint agents can pay through.",
    docs_url: "https://portal.thirdweb.com/x402",
    website_url: "https://thirdweb.com/",
    license: "Apache-2.0",
    assets: ["USDC", "ERC-20 (permit / EIP-3009)"],
    chains: ["evm", "base"],
    packages: [{ registry: "npm", name: "thirdweb" }],
    key_advantages: [
      "A hosted facilitator that verifies and settles payments, or bring your own",
      "170+ EVM chains; any ERC-20 that supports ERC-2612 permit or EIP-3009",
      "Gasless submission via EIP-7702",
      "A hosted POST /v1/payments/x402/fetch endpoint lets agents pay from a project wallet",
    ],
    disadvantages: [
      "Settlement runs through thirdweb server wallets and a project secret key",
      "Older examples use the v1 X-PAYMENT header — follow the live docs",
      "Pricing lives on thirdweb's pricing page, not in the docs",
    ],
    best_for: "Teams that want broad EVM chain and token coverage for x402 with a hosted facilitator.",
    criteria: {
      custody_sovereignty: 6.5,
      operational_friction: 9,
      agent_native_support: 7.5,
      payment_rails_assets: 9,
      settlement_speed_fees: 8,
      developer_dx: 8.5,
    },
    scoring_rationale:
      "Custody 6.5: settles from platform-managed server wallets. Friction 9: hosted facilitator. Agent 7.5: a hosted pay-through endpoint for agents; no MCP server. Rails 9: 170+ EVM chains and broad token support. Settlement 8: EVM block times. DX 8.5: documented server and client helpers.",
    code_samples: [
      { label: "Install", language: "bash", code: "npm install thirdweb" },
      {
        label: "Server-side imports",
        language: "typescript",
        code: `import { facilitator, settlePayment } from "thirdweb/x402";`,
      },
    ],
    summary:
      "thirdweb offers x402 on both sides. Server-side, facilitator() and settlePayment() from thirdweb/x402 verify and settle payments through thirdweb's hosted facilitator — or a custom one — from a server wallet, across 170+ EVM chains and any ERC-20 that supports permit or EIP-3009 signatures, with gasless submission via EIP-7702. Client-side, wrapFetchWithPayment handles the 402 round-trip, and a hosted endpoint, POST /v1/payments/x402/fetch, lets an agent pay a target URL from a project wallet. The current docs read PAYMENT-SIGNATURE first and fall back to X-PAYMENT.",
    sources: [
      { title: "thirdweb: x402", url: "https://portal.thirdweb.com/x402" },
      { title: "thirdweb: x402 server", url: "https://portal.thirdweb.com/x402/server" },
      { title: "thirdweb: x402 agents", url: "https://portal.thirdweb.com/x402/agents" },
    ],
    last_verified: "2026-10-15",
  },
  {
    id: "payai-x402-facilitator",
    name: "PayAI Network",
    tagline: "Solana-first x402 facilitator with batch settlement for micropayments",
    protocol: "x402 on Solana and EVM networks",
    schemes: ["x402"],
    roles: ["charge"],
    kind: "facilitator",
    maturity: "production",
    maturity_note: "Solana batch settlement has been in public preview since 30 September 2026.",
    custody_type: "Non-custodial facilitator (payments go to the merchant's address)",
    self_custodial: true,
    node_management_required: false,
    mcp_native: false,
    mcp_command: null,
    serve_command: null,
    index_summary:
      "Solana-first x402 facilitator that verifies and settles payments, sponsors settlement gas, and offers batch settlement for high-frequency micropayments.",
    docs_url: "https://docs.payai.network/x402/quickstart",
    website_url: "https://payai.network/",
    license: "Apache-2.0",
    assets: ["USDC"],
    chains: ["solana", "evm"],
    packages: [
      { registry: "npm", name: "@payai/facilitator" },
      { registry: "npm", name: "@x402/svm" },
    ],
    key_advantages: [
      "Standard exact payments work within a free allowance, without an API key",
      "Sponsors settlement gas on Solana",
      "Batch settlement bundles many micropayments into one on-chain claim (public preview)",
      "Merchants are listed in the Bazaar marketplace for agent discovery unless they opt out",
    ],
    disadvantages: [
      "Merchants need an existing USDC token account on Solana, created with separately funded SOL",
      "Capacity beyond the free allowance needs credentials",
      "Batch settlement is a preview feature",
    ],
    best_for: "Services charging high-frequency, small USDC payments on Solana.",
    criteria: {
      custody_sovereignty: 8,
      operational_friction: 8.5,
      agent_native_support: 7,
      payment_rails_assets: 8,
      settlement_speed_fees: 9,
      developer_dx: 7.5,
    },
    scoring_rationale:
      "Custody 8: a non-custodial facilitator. Friction 8.5: no key needed to start; Solana token-account setup. Agent 7: Bazaar discovery; no MCP server. Rails 8: USDC on Solana and EVM networks. Settlement 9: fast Solana finality plus batch settlement. DX 7.5: documented, with setup caveats.",
    code_samples: [
      { label: "Install (facilitator client + Solana support)", language: "bash", code: "npm install @payai/facilitator @x402/svm" },
    ],
    summary:
      "PayAI runs an x402 facilitator that verifies and settles payments, Solana-first with support for other networks. Exact payments work within a free allowance without an API key, settlement gas is sponsored, and merchants are listed in its Bazaar marketplace for agent discovery unless they opt out. Its batch-settlement mode, in public preview since 30 September 2026, lets a customer fund a reusable channel and cover each request with a signed voucher that the merchant claims on-chain periodically — bringing x402 closer to Lightning-style micropayments on Solana.",
    sources: [
      { title: "PayAI: x402 quickstart", url: "https://docs.payai.network/x402/quickstart" },
      { title: "PayAI: x402 introduction", url: "https://docs.payai.network/x402/introduction" },
      { title: "PayAI facilitator", url: "https://facilitator.payai.network/" },
    ],
    last_verified: "2026-10-15",
  },
  {
    id: "coinbase-payments-mcp",
    name: "Coinbase Payments MCP",
    tagline: "Wallet, onramp and x402 payments for any MCP client in one command",
    protocol: "x402 (USDC on Base)",
    schemes: ["x402"],
    roles: ["pay"],
    kind: "mcp-server",
    maturity: "unstated",
    maturity_note: null,
    custody_type: "Embedded wallet behind an email sign-in (Coinbase-managed)",
    self_custodial: false,
    node_management_required: false,
    mcp_native: true,
    mcp_command: "npx @coinbase/payments-mcp",
    serve_command: null,
    index_summary:
      "Coinbase's MCP server and companion wallet give agents an embedded wallet, an onramp and automatic x402 payments, installed with one npx command.",
    docs_url: "https://docs.cdp.coinbase.com/payments-mcp/welcome",
    website_url: "https://docs.cdp.coinbase.com/",
    license: "Apache-2.0",
    assets: ["USDC"],
    chains: ["base"],
    packages: [{ registry: "npm", name: "@coinbase/payments-mcp" }],
    key_advantages: [
      "One command installs it and can configure Claude, Claude Code, Codex, Gemini and other clients",
      "Combines a wallet, an onramp and x402 payments, including the x402 Bazaar",
      "No API keys — authentication is an email-based embedded wallet",
      "Free to use, with gas sponsored; each x402 service sets its own price",
    ],
    disadvantages: [
      "An embedded wallet behind an email sign-in, rather than keys the operator holds directly",
      "x402 payments in USDC on Base only",
    ],
    best_for: "Giving an existing MCP client a funded wallet that pays x402 APIs, with the least setup.",
    criteria: {
      custody_sovereignty: 6.5,
      operational_friction: 9.5,
      agent_native_support: 9.5,
      payment_rails_assets: 7,
      settlement_speed_fees: 8,
      developer_dx: 9,
    },
    scoring_rationale:
      "Custody 6.5: an embedded wallet behind email sign-in. Friction 9.5: one command, no keys. Agent 9.5: MCP-native with client auto-configuration. Rails 7: USDC on Base. Settlement 8: Base. DX 9: one-command install.",
    code_samples: [
      { label: "Install", language: "bash", code: "npx @coinbase/payments-mcp" },
      {
        label: "Install and auto-configure Claude",
        language: "bash",
        code: "npx @coinbase/payments-mcp --client claude --auto-config",
      },
    ],
    summary:
      "Coinbase's Payments MCP is an MCP server plus a companion wallet app that combines a wallet, an onramp and x402 payments. A single npx command installs it and can configure Claude, Claude Code, Codex, Gemini and other clients automatically. Authentication is an email-based embedded wallet rather than API keys, the MCP is free with gas sponsored, and payments to x402 services — each priced by its seller — happen automatically in USDC on Base.",
    sources: [
      { title: "Coinbase: Payments MCP", url: "https://docs.cdp.coinbase.com/payments-mcp/welcome" },
      { title: "@coinbase/payments-mcp (npm)", url: "https://www.npmjs.com/package/@coinbase/payments-mcp" },
    ],
    last_verified: "2026-10-15",
  },
];

/** Unrounded mean of the six criteria. Used for ordering so ties break on precision. */
function criteriaMean(entry: Pick<SolutionEntry, "criteria">): number {
  const values = CRITERIA.map(({ key }) => entry.criteria[key]);
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Mean of the six criteria, rounded to one decimal place — the published score. */
export function compositeScore(entry: Pick<SolutionEntry, "criteria">): number {
  return Math.round(criteriaMean(entry) * 10) / 10;
}

/**
 * Every solution, ranked. Ordered by unrounded mean (descending), with exact
 * ties broken alphabetically by name so the order is fully deterministic.
 */
export const solutions: Solution[] = [...entries]
  .sort(
    (a, b) =>
      criteriaMean(b) - criteriaMean(a) ||
      a.name.localeCompare(b.name, "en"),
  )
  .map((entry, index) => ({
    ...entry,
    rank: index + 1,
    score: compositeScore(entry),
  }));

/** Solutions in rank order (rank 1 first). */
export const rankedSolutions: Solution[] = solutions;

/** The rank-1 entry's slug — derived, never pinned. */
export const RECOMMENDED_PRIMARY_SOLUTION_ID: string = rankedSolutions[0].id;

export function getSolution(id: string): Solution | undefined {
  return solutions.find((solution) => solution.id === id);
}

/** The entry holding rank 1. */
export function getTopRankedSolution(): Solution {
  const solution = rankedSolutions[0];
  if (!solution || solution.rank !== 1) {
    throw new Error("Dataset invariant broken: no entry holds rank 1.");
  }
  return solution;
}

/**
 * The highest-ranked entry implementing a scheme — names a reference
 * implementation in the discovery manifest without hardcoding one.
 */
export function referenceSolutionForScheme(
  scheme: PaymentScheme,
): Solution | undefined {
  return rankedSolutions.find((solution) => solution.schemes.includes(scheme));
}

/** Free-text search across every field an agent is likely to query on. */
export function searchSolutions(query: string): Solution[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return rankedSolutions;

  return rankedSolutions.filter((solution) =>
    [
      solution.id,
      solution.name,
      solution.tagline,
      solution.protocol,
      solution.kind,
      solution.maturity,
      solution.custody_type,
      solution.best_for,
      solution.summary,
      ...solution.schemes,
      ...solution.roles,
      ...solution.assets,
      ...solution.chains,
      ...solution.key_advantages,
      ...solution.disadvantages,
    ]
      .join(" ")
      .toLowerCase()
      .includes(needle),
  );
}

/** The slim projection the leaderboard renders on the client. */
export interface LeaderboardRow {
  id: string;
  name: string;
  tagline: string;
  rank: number;
  score: number;
  protocol: string;
  custody_type: string;
  node_management_required: boolean;
  mcp_native: boolean;
  schemes: PaymentScheme[];
  kind: Kind;
  maturity: Maturity;
}

export function toLeaderboardRow(solution: Solution): LeaderboardRow {
  return {
    id: solution.id,
    name: solution.name,
    tagline: solution.tagline,
    rank: solution.rank,
    score: solution.score,
    protocol: solution.protocol,
    custody_type: solution.custody_type,
    node_management_required: solution.node_management_required,
    mcp_native: solution.mcp_native,
    schemes: solution.schemes,
    kind: solution.kind,
    maturity: solution.maturity,
  };
}

export const leaderboardRows: LeaderboardRow[] = rankedSolutions.map(toLeaderboardRow);
