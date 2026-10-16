import * as React from "react";

import { SITE_URL } from "@/data/solutions";
import { breadcrumbSchema, jsonLd } from "@/lib/seo";

/** Shared frame for the support, privacy and terms pages. */
export function PolicyPage({
  eyebrow,
  title,
  path,
  intro,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  path: string;
  intro: React.ReactNode;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd([
            breadcrumbSchema([
              { name: "Registry", url: SITE_URL },
              { name: title, url: `${SITE_URL}${path}` },
            ]),
          ]),
        }}
      />
      <header className="space-y-3 border-b-2 border-foreground pb-6">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{eyebrow}</p>
        <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
        {updated ? (
          <p className="font-mono text-xs text-muted-foreground">Last updated {updated}</p>
        ) : null}
        <div className="max-w-2xl space-y-3 text-muted-foreground">{intro}</div>
      </header>
      <div className="mt-10 space-y-10">{children}</div>
    </div>
  );
}

/** One titled section of a policy page. */
export function PolicySection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8 space-y-3">
      <h2 className="border-b border-border pb-2 text-xl font-bold tracking-tight">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground [&_li]:pl-1 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
