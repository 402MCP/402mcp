import { SITE_URL, getSolution, rankedSolutions } from "@/data/solutions";
import { solutionToMarkdown } from "@/lib/render";

/**
 * GET /solutions/<slug>/index.md — one entry as Markdown.
 *
 * Also the target of content negotiation: middleware.ts rewrites
 * /solutions/<slug> here when a request carries Accept: text/markdown.
 */

/** Prerender one Markdown document per entry at build time. */
export function generateStaticParams() {
  return rankedSolutions.map((solution) => ({ slug: solution.id }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const solution = getSolution(slug);

  if (!solution) {
    return new Response(
      `# Not found\n\nNo solution with id "${slug}" is indexed. The full list is at ${SITE_URL}/api/v1/solutions\n`,
      { status: 404, headers: { "Content-Type": "text/markdown; charset=utf-8" } },
    );
  }

  return new Response(solutionToMarkdown(solution, rankedSolutions.length), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
      Vary: "Accept",
    },
  });
}
