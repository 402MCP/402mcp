import {
  CRITERIA,
  SITE_URL,
  type CriterionKey,
  type PaymentScheme,
  type Role,
  type Solution,
} from "@/data/solutions";

/**
 * Requirement-driven recommendation.
 *
 * Deliberately not "return rank 1": hard requirements filter the field, then
 * the six published criteria are re-weighted toward what the caller said
 * matters. Weights, filters and exclusions are all returned, so the result can
 * be audited rather than trusted.
 */

export interface RecommendInput {
  role?: Role;
  typical_amount_usd?: number;
  settlement_asset?: "bitcoin" | "stablecoin" | "card" | "any";
  custody?: "self" | "any";
  infrastructure?: "none" | "can-run-node";
  chain?: string;
  scheme?: PaymentScheme;
  needs_mcp?: boolean;
  production_only?: boolean;
  limit?: number;
}

export interface Recommendation {
  id: string;
  name: string;
  rank: number;
  score: number;
  fit_score: number;
  schemes: PaymentScheme[];
  roles: Role[];
  kind: string;
  maturity: string;
  maturity_note: string | null;
  why: string[];
  trade_offs: string[];
  install: string | null;
  docs_url: string;
  url: string;
}

export interface RecommendResult {
  requirements: RecommendInput;
  weights: Record<CriterionKey, number>;
  notes: string[];
  recommendations: Recommendation[];
  excluded: { id: string; name: string; reasons: string[] }[];
  method: string;
}

const ASSET_MATCHERS: Record<"bitcoin" | "stablecoin" | "card", (asset: string) => boolean> = {
  bitcoin: (asset) => /\bBTC\b/.test(asset),
  stablecoin: (asset) => /USDC|ERC-20|SPL|stablecoin/i.test(asset),
  card: (asset) => /card/i.test(asset),
};

const round2 = (value: number) => Math.round(value * 100) / 100;

function reasonsToInclude(solution: Solution, input: RecommendInput): string[] {
  const why: string[] = [];
  if (input.role) why.push(input.role === "pay" ? "Lets an agent pay 402 challenges" : "Lets a service charge with 402 challenges");
  if (solution.self_custodial) why.push("Self-custodial");
  if (!solution.node_management_required) why.push("No node to run");
  if (solution.mcp_native) why.push("Ships an MCP server or MCP-native tooling");
  if (solution.chains.includes("lightning")) why.push("Settles over Lightning — sub-second and economical below one cent");
  if (solution.assets.some(ASSET_MATCHERS.stablecoin)) why.push("Stablecoin settlement gives a stable USD unit of account");
  if (solution.assets.some(ASSET_MATCHERS.card)) why.push("Accepts cards");
  why.push(`Speaks ${solution.schemes.join(" and ")}`);
  return why;
}

export function recommendRails(solutions: Solution[], raw: RecommendInput): RecommendResult {
  const input: RecommendInput = { ...raw };
  const limit = Math.min(Math.max(Math.trunc(input.limit ?? 5), 1), 20);
  const amount = typeof input.typical_amount_usd === "number" ? input.typical_amount_usd : null;
  const notes: string[] = [];

  const weights = Object.fromEntries(CRITERIA.map(({ key }) => [key, 1])) as Record<CriterionKey, number>;
  if (amount !== null && amount < 0.01) {
    weights.settlement_speed_fees *= 2.5;
    notes.push(
      "Sub-cent payments: Lightning settles them natively. Stablecoin rails generally settle no smaller than 0.01 USDC per payment unless they batch (PayAI batch settlement, MPP sessions).",
    );
  } else if (amount !== null && amount < 0.1) {
    weights.settlement_speed_fees *= 1.5;
  }
  if (amount !== null && amount < 0.5) {
    notes.push("Card payments through Stripe carry a 0.50 USD minimum.");
  }
  if (input.custody === "self") weights.custody_sovereignty *= 1.5;
  if (input.needs_mcp) weights.agent_native_support *= 1.5;
  if (input.infrastructure === "none") weights.operational_friction *= 1.5;
  if (input.production_only) weights.developer_dx *= 1.25;

  const excluded: RecommendResult["excluded"] = [];
  const candidates: Solution[] = [];

  for (const solution of solutions) {
    const reasons: string[] = [];
    if (input.role && !solution.roles.includes(input.role)) {
      reasons.push(input.role === "pay" ? "Does not pay 402 challenges" : "Does not charge with 402 challenges");
    }
    if (input.scheme && !solution.schemes.includes(input.scheme)) reasons.push(`Does not speak ${input.scheme}`);
    if (input.custody === "self" && !solution.self_custodial) reasons.push("Not self-custodial");
    if (input.infrastructure === "none" && solution.node_management_required) reasons.push("Requires running a node");
    if (input.needs_mcp && !solution.mcp_native) reasons.push("No MCP server or MCP-native tooling");
    if (input.production_only && solution.maturity !== "production") {
      reasons.push(`Maturity is ${solution.maturity}, not production`);
    }
    if (input.chain) {
      const chain = input.chain.toLowerCase();
      if (!solution.chains.some((c) => c.toLowerCase() === chain)) reasons.push(`Not available on ${input.chain}`);
    }
    if (input.settlement_asset && input.settlement_asset !== "any") {
      const matches = ASSET_MATCHERS[input.settlement_asset];
      if (!solution.assets.some(matches)) reasons.push(`Does not settle in ${input.settlement_asset}`);
    }
    if (reasons.length) excluded.push({ id: solution.id, name: solution.name, reasons });
    else candidates.push(solution);
  }

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const recommendations = candidates
    .map((solution) => {
      const weighted = CRITERIA.reduce((sum, { key }) => sum + solution.criteria[key] * weights[key], 0);
      return {
        id: solution.id,
        name: solution.name,
        rank: solution.rank,
        score: solution.score,
        fit_score: round2(weighted / totalWeight),
        schemes: solution.schemes,
        roles: solution.roles,
        kind: solution.kind,
        maturity: solution.maturity,
        maturity_note: solution.maturity_note,
        why: reasonsToInclude(solution, input),
        trade_offs: solution.disadvantages,
        install: solution.mcp_command,
        docs_url: solution.docs_url,
        url: `${SITE_URL}/solutions/${solution.id}`,
      };
    })
    .sort((a, b) => b.fit_score - a.fit_score || a.rank - b.rank)
    .slice(0, limit);

  if (!recommendations.length) {
    notes.push("No indexed solution meets every requirement. Relax one — `excluded` lists exactly why each was ruled out.");
  }

  return {
    requirements: input,
    weights,
    notes,
    recommendations,
    excluded,
    method:
      "Hard requirements filter the registry; the remainder are ordered by a weighted mean of the six published criteria, with weights raised for what you said matters. Published rank is shown for reference but does not order these results.",
  };
}
