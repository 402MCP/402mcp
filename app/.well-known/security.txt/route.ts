import { SITE_URL } from "@/data/solutions";
import { SECURITY_TXT_EXPIRES, SUPPORT_EMAIL } from "@/lib/legal";

/**
 * GET /.well-known/security.txt — RFC 9116 contact for reporting security
 * issues privately. `Expires` is a fixed date and must be renewed before it
 * passes; verify:seo fails once it is within 30 days.
 */
export async function GET() {
  const body = [
    `Contact: mailto:${SUPPORT_EMAIL}`,
    `Expires: ${SECURITY_TXT_EXPIRES}`,
    "Preferred-Languages: en",
    `Canonical: ${SITE_URL}/.well-known/security.txt`,
    `Policy: ${SITE_URL}/support`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
