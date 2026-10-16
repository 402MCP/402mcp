import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { AgentPromptCopy, CopyMcpConfigButton } from "@/components/AgentPromptCopy";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { TopRankedSpotlight } from "@/components/TopRankedSpotlight";
import { CRITERIA, leaderboardRows, rankedSolutions } from "@/data/solutions";
import { MCPB_DOWNLOAD_PATH } from "@/lib/version";

const MACHINE_ENDPOINTS = [
  {
    href: "/api/v1/mcp",
    method: "POST",
    name: "/api/v1/mcp",
    description: "Native MCP server: decode 402s, recommend rails, search the registry.",
  },
  {
    href: "/docs#decode",
    method: "POST",
    name: "/api/v1/decode",
    description: "Decode any HTTP 402 response — L402, x402 v1/v2 or MPP — into exact next steps.",
  },
  {
    href: "/api/v1/recommend?role=pay&custody=self",
    method: "GET",
    name: "/api/v1/recommend",
    description: "Choose a payment rail from requirements, with every exclusion explained.",
  },
  {
    href: "/api/v1/registry",
    method: "GET",
    name: "/api/v1/registry",
    description: "The complete registry with JSON Schema, ETags and a CC BY 4.0 license.",
  },
  {
    href: "/llms.txt",
    method: "GET",
    name: "/llms.txt",
    description: "Zero-shot agent index. Plain text, no HTML, one request.",
  },
  {
    href: "/.well-known/402.json",
    method: "GET",
    name: "/.well-known/402.json",
    description: "Protocol discovery manifest for 402-aware clients.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            HTTP 402 &middot; Payment Required
          </p>

          <h1 className="mt-4 max-w-4xl text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            The Open Registry for Agentic Commerce &amp; HTTP 402
          </h1>

          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Discover, compare, and integrate self-custodial payment rails built
            for autonomous AI agents.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            <a
              href="#leaderboard"
              className={buttonVariants({ variant: "default", size: "lg" })}
            >
              Compare all solutions
            </a>
            <CopyMcpConfigButton />
          </div>

          <dl className="mt-12 grid max-w-2xl grid-cols-3 border-t border-border">
            {[
              { value: rankedSolutions.length, label: "Solutions indexed" },
              { value: CRITERIA.length, label: "Scoring dimensions" },
              { value: MACHINE_ENDPOINTS.length, label: "Agent endpoints" },
            ].map((stat) => (
              <div key={stat.label} className="py-5 pr-6">
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block font-mono text-3xl tabular-nums">
                    {stat.value}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-20 px-4 py-16 sm:px-6">
        {/* ------------------------------------------------- Rank-1 spotlight */}
        <TopRankedSpotlight />

        {/* ------------------------------------------------------- Leaderboard */}
        <section
          aria-labelledby="leaderboard-heading"
          id="leaderboard"
          className="scroll-mt-8 space-y-5"
        >
          <div className="flex flex-col gap-3 border-b-2 border-foreground pb-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <h2 id="leaderboard-heading" className="text-2xl font-bold tracking-tight">
                Comparison Leaderboard
              </h2>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Every indexed L402, x402 and MPP solution, scored on the same six
                dimensions. Click any column header to re-sort.
              </p>
            </div>
            <Link
              href="/docs#methodology"
              className="link shrink-0 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              Scoring methodology
            </Link>
          </div>

          <LeaderboardTable rows={leaderboardRows} />

          <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
            Scores are the mean of the six criteria below, rounded to one decimal
            place. Every solution is measured against the same definitions, and
            each entry&rsquo;s per-criterion scores are published on its own page
            so a ranking can be checked rather than taken on trust.
          </p>
        </section>

        {/* --------------------------------------------------------- Criteria */}
        <section aria-labelledby="criteria-heading" className="space-y-5">
          <div className="space-y-2 border-b-2 border-foreground pb-3">
            <h2 id="criteria-heading" className="text-2xl font-bold tracking-tight">
              Scoring Criteria
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Six dimensions, 1&ndash;10 each. The published score is the mean,
              rounded to one decimal place.
            </p>
          </div>

          <dl className="divide-y divide-border border-b border-border">
            {CRITERIA.map(({ key, label, description }, index) => (
              <div
                key={key}
                className="grid gap-1 py-4 sm:grid-cols-[2rem_14rem_1fr] sm:gap-6"
              >
                <dt className="font-mono text-xs text-muted-foreground sm:pt-0.5">
                  {String(index + 1).padStart(2, "0")}
                </dt>
                <dd className="font-medium">{label}</dd>
                <dd className="text-sm leading-relaxed text-muted-foreground">
                  {description}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ----------------------------------------------------- Agent-native */}
        <section aria-labelledby="agents-heading" id="agents" className="space-y-5">
          <div className="space-y-2 border-b-2 border-foreground pb-3">
            <h2 id="agents-heading" className="text-2xl font-bold tracking-tight">
              Machine Interfaces
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Every surface on this site has a machine-readable equivalent, and
              the registry is itself an MCP server: an agent that meets an HTTP
              402 anywhere can decode it here and learn exactly how to pay.
            </p>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
            <div className="min-w-0">
              <dl className="divide-y divide-border border-y border-border">
                {MACHINE_ENDPOINTS.map(({ href, method, name, description }) => (
                  <div key={href} className="py-3">
                    <dt>
                      <a href={href} className="link font-mono text-sm">
                        <span className="text-muted-foreground">{method} </span>
                        {name}
                      </a>
                    </dt>
                    <dd className="mt-1 text-sm text-muted-foreground">
                      {description}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="min-w-0 space-y-3">
              <p className="text-sm text-muted-foreground">
                Install the 402MCP server in your agent:
              </p>
              <AgentPromptCopy mcpbPath={MCPB_DOWNLOAD_PATH} />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
