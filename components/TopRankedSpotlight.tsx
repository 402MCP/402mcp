import Link from "next/link";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { CodeSnippet } from "@/components/CodeSnippet";
import {
  CRITERIA,
  getTopRankedSolution,
  rankedSolutions,
} from "@/data/solutions";

/**
 * The rank-1 entry, shown directly above the full comparison table.
 *
 * Renders whichever entry currently holds rank 1 from that entry's own data,
 * so re-scoring the registry changes this panel without a code change.
 */
export function TopRankedSpotlight({ className }: { className?: string }) {
  const solution = getTopRankedSolution();

  const highlights = solution.key_advantages.slice(0, 4);

  return (
    <section
      aria-labelledby="spotlight-heading"
      className={cn("border border-foreground", className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted px-5 py-2">
        <p className="font-mono text-[11px] uppercase tracking-wider">
          Rank 1 of {rankedSolutions.length} &middot; Highest composite score
        </p>
        <Link
          href="/docs#methodology"
          className="link font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          How this is scored
        </Link>
      </div>

      <div className="grid gap-10 p-5 sm:p-8 lg:grid-cols-[1.15fr_1fr]">
        <div className="min-w-0 space-y-6">
          <div className="space-y-2">
            <h2
              id="spotlight-heading"
              className="text-3xl font-bold tracking-tight"
            >
              {solution.name}
            </h2>
            <p className="max-w-xl text-muted-foreground">{solution.tagline}</p>
          </div>

          <ul className="divide-y divide-border border-y border-border">
            {highlights.map((item) => (
              <li key={item} className="py-3 text-sm">
                {item}
              </li>
            ))}
          </ul>

          <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-4 border-b border-border pb-1.5">
              <dt className="text-muted-foreground">Protocol / rail</dt>
              <dd className="text-right">{solution.protocol}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border pb-1.5">
              <dt className="text-muted-foreground">Custody</dt>
              <dd className="text-right">{solution.custody_type}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border pb-1.5">
              <dt className="text-muted-foreground">Node management</dt>
              <dd className="text-right">
                {solution.node_management_required ? "Required" : "Not required"}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border pb-1.5">
              <dt className="text-muted-foreground">Composite score</dt>
              <dd className="text-right font-mono tabular-nums">
                {solution.score.toFixed(1)} / 10
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/solutions/${solution.id}`}
              className={buttonVariants({ variant: "default" })}
            >
              Full entry and scores
            </Link>
            <a
              href={solution.docs_url}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline" })}
            >
              Vendor documentation
            </a>
          </div>
        </div>

        <div className="min-w-0 space-y-5">
          {solution.mcp_command && (
            <CodeSnippet
              code={solution.mcp_command}
              label="install"
              language="bash"
            />
          )}

          <div className="border border-border">
            <p className="border-b border-border bg-muted px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Evaluation matrix
            </p>
            <ul className="divide-y divide-border">
              {CRITERIA.map(({ key, label }) => {
                const value = solution.criteria[key];
                return (
                  <li
                    key={key}
                    className="flex items-center gap-3 px-3 py-2 text-sm"
                  >
                    <span className="flex-1 text-muted-foreground">{label}</span>
                    <span
                      className="hidden h-2 w-24 border border-border sm:block"
                      role="meter"
                      aria-valuenow={value}
                      aria-valuemin={0}
                      aria-valuemax={10}
                      aria-label={`${label}: ${value.toFixed(1)} out of 10`}
                    >
                      <span
                        className="block h-full bg-foreground"
                        style={{ width: `${(value / 10) * 100}%` }}
                      />
                    </span>
                    <span className="w-8 text-right font-mono tabular-nums">
                      {value.toFixed(1)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TopRankedSpotlight;
