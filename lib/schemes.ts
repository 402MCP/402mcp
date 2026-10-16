import type { PaymentScheme, Source } from "@/data/solutions";

/**
 * Protocol-level reference for each HTTP 402 scheme — the wire format an agent
 * or developer needs, independent of any vendor. Every field is sourced.
 */
export interface SchemeReference {
  scheme: PaymentScheme;
  name: string;
  summary: string;
  status: string;
  settlement: string;
  challenge: { where: string; format: string };
  credential: { where: string; format: string };
  receipt: { where: string | null; format: string | null };
  notes: string[];
  flow: string[];
  example: string;
  specs: Source[];
}

export const SCHEME_REFERENCES: SchemeReference[] = [
  {
    scheme: "L402",
    name: "L402 (formerly LSAT)",
    summary:
      "Lightning-native HTTP 402: the server returns a macaroon and a BOLT 11 invoice; the client pays and presents the macaroon with the payment preimage as proof. Payment and authorization arrive in one header, and the token is reusable.",
    status: "Stable specification maintained by Lightning Labs since 2020.",
    settlement: "Bitcoin over the Lightning Network — sub-second, sized down to single satoshis.",
    challenge: {
      where: "WWW-Authenticate header",
      format: 'L402 macaroon="<base64 macaroon>", invoice="<BOLT 11 invoice>"',
    },
    credential: {
      where: "Authorization header",
      format: "L402 <macaroon>:<preimage as hex>",
    },
    receipt: { where: null, format: null },
    notes: [
      "The macaroon's caveats restrict what the token grants — services, capabilities, expiry.",
      "Some servers still use the legacy scheme name LSAT; reply with the name the server used.",
      "The paying wallet must return the payment preimage; not every wallet does.",
      "Tokens minted by Aperture commit to the invoice's payment hash in the macaroon identifier.",
    ],
    flow: [
      "Client requests the resource.",
      "Server replies 402 with WWW-Authenticate: L402 macaroon=…, invoice=….",
      "Client pays the BOLT 11 invoice and obtains the 32-byte preimage.",
      "Client retries with Authorization: L402 <macaroon>:<preimage>.",
      "Server verifies the macaroon and that sha256(preimage) equals the payment hash, then serves the resource.",
    ],
    example: `HTTP/1.1 402 Payment Required
WWW-Authenticate: L402 macaroon="AGIAJEemVQ...", invoice="lnbc100n1p..."

GET /resource HTTP/1.1
Authorization: L402 AGIAJEemVQ...:8c1f2b9a...`,
    specs: [
      { title: "L402 protocol specification (GitHub)", url: "https://github.com/lightninglabs/L402" },
      { title: "L402 (Lightning Labs docs)", url: "https://docs.lightning.engineering/the-lightning-network/l402" },
      { title: "l402.tech", url: "https://l402.tech/" },
      { title: "BOLT 11: invoice protocol", url: "https://github.com/lightning/bolts/blob/master/11-payment-encoding.md" },
    ],
  },
  {
    scheme: "x402",
    name: "x402",
    summary:
      "Stablecoin HTTP 402 created by Coinbase: the server lists acceptable payment options; the client signs a payment for one and retries; a facilitator verifies and settles on-chain.",
    status: "Open protocol (Apache-2.0); v2 is current and v1 remains in use.",
    settlement: "On-chain on EVM networks (e.g. Base) and Solana — block-bound, typically seconds.",
    challenge: {
      where: "v2: PAYMENT-REQUIRED header (base64 JSON). v1: JSON response body.",
      format:
        "{ x402Version, accepts: [{ scheme, network, amount (v2) | maxAmountRequired (v1), asset, payTo, maxTimeoutSeconds, extra }] }",
    },
    credential: {
      where: "v2: PAYMENT-SIGNATURE header. v1: X-PAYMENT header.",
      format: "Base64-encoded signed payment payload for the chosen requirement, echoed exactly as received.",
    },
    receipt: {
      where: "v2: PAYMENT-RESPONSE header. v1: X-PAYMENT-RESPONSE header.",
      format: "Base64-encoded settlement result.",
    },
    notes: [
      "Read x402Version before choosing header names — mixing v1 and v2 names fails.",
      "v2 networks are CAIP-2 identifiers, e.g. eip155:8453 for Base.",
      "Amounts are atomic units of the asset — 10000 is 0.01 USDC (6 decimals).",
      "Many facilitators charge no fee; gas is handled on-chain.",
    ],
    flow: [
      "Client requests the resource.",
      "Server replies 402 with PAYMENT-REQUIRED (v2) listing accepted options.",
      "Client picks an option and signs a payment payload with an x402 client.",
      "Client retries with PAYMENT-SIGNATURE carrying the payload.",
      "Server verifies and settles through a facilitator, serves the resource, and returns PAYMENT-RESPONSE.",
    ],
    example: `HTTP/1.1 402 Payment Required
PAYMENT-REQUIRED: eyJ4NDAyVmVyc2lvbiI6Miwi...

GET /resource HTTP/1.1
PAYMENT-SIGNATURE: eyJ4NDAyVmVyc2lvbiI6Miwi...`,
    specs: [
      { title: "x402 documentation", url: "https://docs.x402.org/" },
      { title: "x402: HTTP 402", url: "https://docs.x402.org/core-concepts/http-402" },
      { title: "x402 FAQ (networks, fees)", url: "https://docs.x402.org/faq" },
    ],
  },
  {
    scheme: "MPP",
    name: "Machine Payments Protocol (MPP)",
    summary:
      "A method-agnostic 'Payment' HTTP authentication scheme co-authored by Tempo and Stripe: one challenge format for cards, stablecoins, Lightning and more, with charge, session and subscription intents.",
    status:
      "Draft: draft-ryan-httpauth-payment-01 (March 2026) is an individual Internet-Draft with no formal IETF standing.",
    settlement: "Depends on the method — Tempo, Stripe, card, Lightning, EVM, Solana and others are drafted.",
    challenge: {
      where: "WWW-Authenticate header",
      format:
        'Payment id="…", realm="…", method="…", intent="…", request="<base64url JSON>" [, expires, digest, description, opaque]',
    },
    credential: {
      where: "Authorization header",
      format: "Payment <base64url, unpadded, JSON { challenge, source?, payload }>",
    },
    receipt: {
      where: "Payment-Receipt header",
      format: "base64url JSON { status: \"success\", method, timestamp, reference }",
    },
    notes: [
      "The credential's `challenge` must echo every challenge parameter unchanged, including `id`.",
      "`request` is JCS-canonicalized JSON encoded as base64url without padding.",
      "Clients must not submit credentials for a challenge past its `expires`.",
      "`description` is display-only; clients must not rely on it for verification.",
      "Servers may offer several Payment challenges, one per method.",
    ],
    flow: [
      "Client requests the resource.",
      "Server replies 402 with one or more WWW-Authenticate: Payment challenges.",
      "Client pays through the named method, following the decoded request.",
      "Client retries with Authorization: Payment <credential>.",
      "Server verifies, serves the resource, and may return Payment-Receipt.",
    ],
    example: `HTTP/1.1 402 Payment Required
Cache-Control: no-store
WWW-Authenticate: Payment id="x7Tg2pLqR9mKvNwY3hBcZa",
    realm="api.example.com",
    method="example",
    intent="charge",
    expires="2025-01-15T12:05:00Z",
    request="eyJhbW91bnQiOiIxMDAwIiwiY3VycmVuY3kiOiJVU0QiLCJyZWNpcGllbnQiOiJhY2N0XzEyMyJ9"`,
    specs: [
      { title: "draft-ryan-httpauth-payment (IETF)", url: "https://datatracker.ietf.org/doc/html/draft-ryan-httpauth-payment" },
      { title: "Payment auth specifications", url: "https://paymentauth.org/" },
      { title: "tempoxyz/mpp-specs (GitHub)", url: "https://github.com/tempoxyz/mpp-specs" },
    ],
  },
];

export function getSchemeReference(scheme: string): SchemeReference | undefined {
  const wanted = scheme.trim().toLowerCase();
  return SCHEME_REFERENCES.find(
    (reference) =>
      reference.scheme.toLowerCase() === wanted ||
      (wanted === "lsat" && reference.scheme === "L402"),
  );
}
