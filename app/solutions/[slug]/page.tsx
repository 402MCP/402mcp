import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CodeSnippet } from "@/components/CodeSnippet";
import {
  CRITERIA,
  MATURITY_DEFINITIONS,
  REGISTRY_UPDATED,
  SITE_NAME,
  SITE_URL,
  getSolution,
  rankedSolutions,
} from "@/data/solutions";
import { breadcrumbSchema, jsonLd, solutionSchema } from "@/lib/seo";

/** Prerender every solution page at build time. */
export function generateStaticParams() {
  return rankedSolutions.map((solution) => ({ slug: solution.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const solution = getSolution(slug);

  if (!solution) {
    return { title: "Solution not found" };
  }

  return {
    title: `${solution.name} — ranked #${solution.rank} of ${rankedSolutions.length}`,
    description: `${solution.tagline}. Scored ${solution.score.toFixed(1)}/10 on 402MCP.org (${solution.schemes.join(", ")}; ${solution.maturity}). Custody: ${solution.custody_type}.`,
    alternates: { canonical: `/solutions/${solution.id}` },
    keywords: [
      solution.name,
      "HTTP 402",
      solution.protocol,
      "agent payments",
      "machine-to-machine commerce",
      ...(solution.mcp_native ? ["MCP", "Model Context Protocol"] : []),
    ],
    openGraph: {
      type: "article",
      url: `${SITE_URL}/solutions/${solution.id}`,
      title: `${solution.name} — #${solution.rank} on ${SITE_NAME}`,
      description: solution.tagline,
      modifiedTime: REGISTRY_UPDATED,
    },
    other: {
      // Advertise the Markdown representation to agents that read link rels.
      "og:see_also": `${SITE_URL}/solutions/${solution.id}/index.md`,
    },
  };
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="border-b-2 border-foreground pb-2 text-xl font-bold tracking-tight">
      {children}
    </h2>
  );
}

export default async function SolutionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const solution = getSolution(slug);

  if (!solution) {
    notFound();
  }

  const facts = [
    { label: "Rank", value: `${solution.rank} of ${rankedSolutions.length}` },
    { label: "Composite score", value: `${solution.score.toFixed(1)} / 10` },
    { label: "Schemes", value: solution.schemes.join(", ") },
    {
      label: "Role",
      value: solution.roles
        .map((role) => (role === "pay" ? "Pays 402 challenges" : "Charges with 402"))
        .join("; "),
    },
    { label: "Kind", value: solution.kind },
    { label: "Maturity", value: solution.maturity },
    { label: "Protocol / rail", value: solution.protocol },
    { label: "Assets", value: solution.assets.join(", ") },
    { label: "Networks", value: solution.chains.join(", ") },
    { label: "Custody model", value: solution.custody_type },
    {
      label: "Node management",
      value: solution.node_management_required ? "Required" : "Not required",
    },
    { label: "MCP native", value: solution.mcp_native ? "Yes" : "No" },
    { label: "License", value: solution.license ?? "Not stated" },
    { label: "Last verified", value: solution.last_verified },
  ];

  const others = rankedSolutions.filter((entry) => entry.id !== solution.id);

  return (
    <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd([
            solutionSchema(solution),
            breadcrumbSchema([
              { name: "Registry", url: SITE_URL },
              { name: "Solutions", url: `${SITE_URL}/#leaderboard` },
              {
                name: solution.name,
                url: `${SITE_URL}/solutions/${solution.id}`,
              },
            ]),
          ]),
        }}
      />

      <nav aria-label="Breadcrumb" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="link hover:text-foreground">
              Registry
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/#leaderboard" className="link hover:text-foreground">
              Solutions
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-foreground">{solution.name}</li>
        </ol>
      </nav>

      {/* ------------------------------------------------------------- Header */}
      <header className="mt-6 border-b-2 border-foreground pb-6">
        <div className="flex flex-wrap gap-2">
          <Badge variant="muted">Rank {solution.rank}</Badge>
          <Badge variant={solution.maturity === "production" ? "default" : "solid"}>
            {solution.maturity}
          </Badge>
          {solution.schemes.map((scheme) => (
            <Badge key={scheme}>{scheme}</Badge>
          ))}
        </div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">{solution.name}</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          {solution.tagline}
        </p>
        {solution.maturity_note && (
          <p className="mt-4 max-w-2xl border-l-2 border-foreground pl-3 text-sm">
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {solution.maturity}:{" "}
            </span>
            {solution.maturity_note}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <a
            href={solution.docs_url}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "default" })}
          >
            Vendor documentation
          </a>
          <a
            href={solution.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline" })}
          >
            Website
          </a>
        </div>
      </header>

      {/* -------------------------------------------------------------- Facts */}
      <dl className="grid border-b border-border sm:grid-cols-2">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="flex justify-between gap-4 border-b border-border py-2.5 text-sm sm:border-b-0 sm:border-t sm:first:border-t-0 sm:[&:nth-child(2)]:border-t-0 sm:odd:pr-6 sm:even:pl-6"
          >
            <dt className="text-muted-foreground">{fact.label}</dt>
            <dd className="text-right font-medium">{fact.value}</dd>
          </div>
        ))}
      </dl>

      {/* ------------------------------------------------------------ Summary */}
      <section className="mt-12 space-y-4">
        <SectionHeading>Overview</SectionHeading>
        <p className="text-pretty leading-relaxed text-muted-foreground">
          {solution.summary}
        </p>
      </section>

      {/* ------------------------------------------------- Pros and trade-offs */}
      <section className="mt-12 grid gap-10 md:grid-cols-2">
        <div className="space-y-4">
          <SectionHeading>Key advantages</SectionHeading>
          <ul className="divide-y divide-border border-b border-border">
            {solution.key_advantages.map((item) => (
              <li key={item} className="py-2.5 text-sm text-muted-foreground">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <SectionHeading>Trade-offs</SectionHeading>
          <ul className="divide-y divide-border border-b border-border">
            {solution.disadvantages.map((item) => (
              <li key={item} className="py-2.5 text-sm text-muted-foreground">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------ Scoring */}
      <section className="mt-12 space-y-4">
        <SectionHeading>Evaluation matrix</SectionHeading>
        <ul className="divide-y divide-border border-b border-border">
          {CRITERIA.map(({ key, label, description }) => {
            const value = solution.criteria[key];
            return (
              <li key={key} className="py-4">
                <div className="flex items-center gap-4">
                  <span className="flex-1 text-sm font-medium">{label}</span>
                  <span
                    className="hidden h-2 w-40 border border-border sm:block"
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
                  <span className="w-10 text-right font-mono text-sm tabular-nums">
                    {value.toFixed(1)}
                  </span>
                </div>
                <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">Why these scores. </span>
        {solution.scoring_rationale}
      </p>

      {/* --------------------------------------------------------------- Code */}
      {solution.code_samples.length === 0 && (
        <section className="mt-12 space-y-4">
          <SectionHeading>Integration</SectionHeading>
          <p className="text-sm text-muted-foreground">
            No verified copy-paste snippet is published for this entry. Follow the{" "}
            <a href={solution.docs_url} target="_blank" rel="noopener noreferrer" className="link">
              vendor documentation
            </a>
            .
          </p>
        </section>
      )}

      {solution.code_samples.length > 0 && (
        <section className="mt-12 space-y-4">
          <SectionHeading>Integration</SectionHeading>
          <div className="space-y-4">
            {solution.code_samples.map((sample) => (
              <CodeSnippet
                key={sample.label}
                code={sample.code}
                label={sample.label}
                language={sample.language}
              />
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ Best for */}
      <section className="mt-12 space-y-4">
        <SectionHeading>Best for</SectionHeading>
        <p className="text-sm text-muted-foreground">{solution.best_for}</p>
      </section>

      {/* ------------------------------------------------------------- Sources */}
      <section className="mt-12 space-y-4">
        <SectionHeading>Sources</SectionHeading>
        <p className="text-sm text-muted-foreground">
          Every claim on this page was checked against these sources on{" "}
          {solution.last_verified}. Maturity &ldquo;{solution.maturity}&rdquo;
          means: {MATURITY_DEFINITIONS[solution.maturity].toLowerCase()}
        </p>
        <ul className="divide-y divide-border border-y border-border">
          {solution.sources.map((source) => (
            <li key={source.url} className="py-2.5 text-sm">
              <a href={source.url} target="_blank" rel="noopener noreferrer" className="link">
                {source.title}
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------------------------------------------------------- Machine ref */}
      <section className="mt-12 space-y-4">
        <SectionHeading>Machine-readable</SectionHeading>
        <CodeSnippet
          label="fetch this entry as JSON"
          language="bash"
          code={`curl "${SITE_URL}/api/v1/solutions?id=${solution.id}&view=full"`}
        />
        <CodeSnippet
          label="or as Markdown"
          language="bash"
          code={`curl -H 'Accept: text/markdown' ${SITE_URL}/solutions/${solution.id}`}
        />
      </section>

      {/* ------------------------------------------------- Other indexed entries */}
      <section className="mt-12 space-y-4">
        <SectionHeading>Other indexed solutions</SectionHeading>
        <ul className="divide-y divide-border border-b border-border">
          {others.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
              <Link href={`/solutions/${entry.id}`} className="link text-sm font-medium">
                {entry.name}
              </Link>
              <span className="text-xs text-muted-foreground">
                {entry.protocol} &middot; rank {entry.rank} &middot;{" "}
                <span className="font-mono tabular-nums">
                  {entry.score.toFixed(1)}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Compare all {rankedSolutions.length} on the{" "}
          <Link href="/#leaderboard" className="link">
            leaderboard
          </Link>
          , or read the{" "}
          <Link href="/docs#methodology" className="link">
            scoring methodology
          </Link>
          .
        </p>
      </section>
    </article>
  );
}
