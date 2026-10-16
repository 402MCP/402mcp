import { NextResponse, type NextRequest } from "next/server";

/**
 * Markdown content negotiation.
 *
 * An agent that asks for `Accept: text/markdown` gets the document rather than
 * a page of HTML it would have to strip tags out of. Browsers are unaffected:
 * they never send `text/markdown` in Accept.
 *
 * Fails open — anything unexpected falls through to the normal HTML response.
 * The matcher keeps this off every other route so it does not add a function
 * invocation to assets or API calls.
 */
export const config = {
  matcher: ["/", "/docs", "/solutions/:slug"],
};

function prefersMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  const lower = accept.toLowerCase();
  if (!lower.includes("text/markdown")) return false;
  // If HTML is also acceptable and listed first, the caller is a browser.
  const markdownAt = lower.indexOf("text/markdown");
  const htmlAt = lower.indexOf("text/html");
  return htmlAt === -1 || markdownAt < htmlAt;
}

export function middleware(request: NextRequest) {
  if (!prefersMarkdown(request.headers.get("accept"))) {
    const response = NextResponse.next();
    response.headers.set("Vary", "Accept");
    return response;
  }

  const { pathname } = request.nextUrl;
  const url = request.nextUrl.clone();

  if (pathname === "/") {
    url.pathname = "/llms.txt";
  } else if (pathname === "/docs") {
    url.pathname = "/llms-full.txt";
  } else if (pathname.startsWith("/solutions/")) {
    url.pathname = `${pathname.replace(/\/$/, "")}/index.md`;
  } else {
    return NextResponse.next();
  }

  const response = NextResponse.rewrite(url);
  response.headers.set("Vary", "Accept");
  return response;
}
