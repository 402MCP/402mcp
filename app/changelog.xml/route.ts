import { CHANGELOG } from "@/data/changelog";
import { SITE_NAME, SITE_URL } from "@/data/solutions";

/** GET /changelog.xml — Atom feed of registry changes, for readers and mirrors. */

const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  const entries = CHANGELOG.map((entry) => {
    const list = entry.changes
      .map((change) => `<li><strong>${change.type}</strong>: ${escape(change.text)}</li>`)
      .join("");
    return `  <entry>
    <id>${SITE_URL}/changelog#${entry.version}</id>
    <title>${escape(`${entry.version}: ${entry.title}`)}</title>
    <updated>${entry.date}T00:00:00Z</updated>
    <link href="${SITE_URL}/changelog#${entry.version}"/>
    <summary>${escape(entry.summary)}</summary>
    <content type="html">${escape(`<p>${escape(entry.summary)}</p><ul>${list}</ul>`)}</content>
  </entry>`;
  }).join("\n");

  const body = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${SITE_URL}/changelog</id>
  <title>${SITE_NAME} registry changelog</title>
  <subtitle>Additions and corrections to the HTTP 402 payment solutions registry.</subtitle>
  <link href="${SITE_URL}/changelog.xml" rel="self"/>
  <link href="${SITE_URL}/changelog"/>
  <updated>${CHANGELOG[0].date}T00:00:00Z</updated>
  <author><name>${SITE_NAME}</name><uri>${SITE_URL}</uri></author>
${entries}
</feed>
`;
  return new Response(body, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
