import type { Metadata } from "next";
import Link from "next/link";

import { PolicyPage, PolicySection } from "@/components/PolicyPage";
import { NPM_PACKAGE } from "@/lib/version";
import { OPERATOR, SUPPORT_EMAIL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Help with the 402MCP MCP server, REST API and npm package, how to report a registry correction with a source, and how to report a security issue privately.",
  alternates: { canonical: "/support" },
};

export default function SupportPage() {
  return (
    <PolicyPage
      eyebrow="Help"
      title="Support"
      path="/support"
      intro={
        <p>
          Most answers are in the{" "}
          <Link href="/docs" className="link">
            documentation
          </Link>
          . For anything else, email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="link">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      }
    >
      <PolicySection id="start" title="Start here">
        <ul>
          <li>
            <Link href="/docs#install" className="link">
              Install the MCP server
            </Link>{" "}
            in Claude, Cursor, VS Code or any MCP client, or run{" "}
            <code className="font-mono">npx -y {NPM_PACKAGE}</code>.
          </li>
          <li>
            <Link href="/docs#methodology" className="link">
              Scoring methodology
            </Link>{" "}
            explains how every entry is scored and ranked.
          </li>
          <li>
            <a href="/api/v1/status" className="link">
              Service status
            </a>{" "}
            shows the latest daily check of every entry&rsquo;s documentation and website.
          </li>
        </ul>
      </PolicySection>

      <PolicySection id="contact" title="Contact">
        <p>
          Email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="link">
            {SUPPORT_EMAIL}
          </a>{" "}
          about:
        </p>
        <ul>
          <li>
            <strong>Problems with the MCP server, API or npm package.</strong> Include the client
            you use, the tool or endpoint, and the request that failed.
          </li>
          <li>
            <strong>Registry corrections.</strong> Include a link to a primary source. Corrections
            change the data, the ranking follows, and the change is recorded in the{" "}
            <Link href="/changelog" className="link">
              changelog
            </Link>
            .
          </li>
          <li>
            <strong>Security issues.</strong> Report them privately by email rather than in public.
          </li>
          <li>
            <strong>Privacy requests.</strong> See the{" "}
            <Link href="/privacy" className="link">
              Privacy Policy
            </Link>
            .
          </li>
        </ul>
      </PolicySection>

      <PolicySection id="independence" title="Independence">
        <p>
          402MCP.org is not affiliated with, sponsored by, or compensated by any vendor it indexes,
          and listing position cannot be purchased.
          {OPERATOR ? ` 402MCP.org is operated by ${OPERATOR}.` : null}
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
