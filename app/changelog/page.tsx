import type { Metadata } from "next";
import Link from "next/link";

import { CHANGELOG } from "@/data/changelog";
import { SITE_URL, getSolution } from "@/data/solutions";
import { breadcrumbSchema, jsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Changelog — registry additions and corrections",
  description:
    "Every change to the 402MCP.org registry of HTTP 402 payment solutions — additions, corrections and score changes — with the reason for each.",
  alternates: {
    canonical: "/changelog",
    types: { "application/atom+xml": [{ url: "/changelog.xml", title: "402MCP.org changelog" }] },
  },
};

export default function ChangelogPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd([
            breadcrumbSchema([
              { name: "Registry", url: SITE_URL },
              { name: "Changelog", url: `${SITE_URL}/changelog` },
            ]),
          ]),
        }}
      />
      <header className="space-y-3 border-b-2 border-foreground pb-6">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Registry</p>
        <h1 className="text-4xl font-bold tracking-tight">Changelog</h1>
        <p className="max-w-2xl text-muted-foreground">
          Additions and corrections to the registry, and the reason for each. Corrections are recorded
          as prominently as additions. Also available as{" "}
          <a href="/changelog.xml" className="link">Atom</a> and{" "}
          <a href="/api/v1/changelog" className="link">JSON</a>.
        </p>
      </header>

      <div className="mt-10 space-y-14">
        {CHANGELOG.map((entry) => (
          <section key={entry.version} id={entry.version} className="scroll-mt-8 space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2">
              <h2 className="text-xl font-bold tracking-tight">{entry.title}</h2>
              <p className="font-mono text-xs text-muted-foreground">
                {entry.version} &middot; {entry.date}
              </p>
            </div>
            <p className="text-muted-foreground">{entry.summary}</p>
            <ul className="divide-y divide-border border-y border-border">
              {entry.changes.map((change) => {
                const solution = change.solution_id ? getSolution(change.solution_id) : undefined;
                return (
                  <li key={change.text} className="grid gap-1 py-3 text-sm sm:grid-cols-[6.5rem_1fr] sm:gap-4">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {change.type}
                    </span>
                    <span>
                      {change.text}
                      {solution && (
                        <>
                          {" "}
                          <Link href={`/solutions/${solution.id}`} className="link text-muted-foreground">
                            View entry
                          </Link>
                        </>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
