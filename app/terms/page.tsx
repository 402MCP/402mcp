import type { Metadata } from "next";
import Link from "next/link";

import { PolicyPage, PolicySection } from "@/components/PolicyPage";
import { OPERATOR, POLICIES_UPDATED, SUPPORT_EMAIL, formatPolicyDate } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms for using 402MCP.org, its hosted MCP server, REST API and npm package: an informational registry that never moves money, provided as is, with registry data under CC BY 4.0.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <PolicyPage
      eyebrow="Legal"
      title="Terms of Service"
      path="/terms"
      updated={formatPolicyDate(POLICIES_UPDATED)}
      intro={
        <p>
          These terms apply to the 402mcp.org website, the hosted MCP server and REST API, and the
          npm package (together, &ldquo;the service&rdquo;).
          {OPERATOR ? ` 402MCP.org is operated by ${OPERATOR}.` : null} By using the service you
          agree to them.
        </p>
      }
    >
      <PolicySection id="service" title="The service">
        <p>
          402MCP.org publishes a registry of HTTP 402 payment infrastructure and tools that decode
          payment challenges, recommend payment rails and probe URLs for 402 support. The service is
          free, needs no account, and may change or be suspended at any time.
        </p>
      </PolicySection>

      <PolicySection id="no-payments" title="No payments, no financial advice">
        <ul>
          <li>
            The service never sends, receives or holds money. Any payment you or your agent makes
            is between you and the party you pay. Confirm the amount, asset, network and recipient
            yourself before paying.
          </li>
          <li>
            Scores, rankings and recommendations are editorial assessments against published
            criteria, not financial, investment, legal or security advice. Verify information
            against its sources before relying on it.
          </li>
        </ul>
      </PolicySection>

      <PolicySection id="third-parties" title="Third-party products">
        <p>
          The registry describes products, protocols and services run by others. Listing is not an
          endorsement, and their use is governed by their own terms. Content inside a 402 response
          is controlled by the server that sent it; the decoder reports it but cannot vouch for it.
        </p>
      </PolicySection>

      <PolicySection id="acceptable-use" title="Acceptable use">
        <p>Do not use the service to:</p>
        <ul>
          <li>attack, scan or overload any system, including through the probe endpoint;</li>
          <li>get around rate limits or other protections;</li>
          <li>interfere with the service or other people&rsquo;s use of it; or</li>
          <li>do anything unlawful.</li>
        </ul>
        <p>Access may be limited or blocked to protect the service.</p>
      </PolicySection>

      <PolicySection id="licenses" title="Licences">
        <p>
          Registry data is licensed under{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/" className="link">
            CC BY 4.0
          </a>
          ; credit &ldquo;402MCP.org&rdquo; when you reuse it. The source code and the npm package
          are licensed under the{" "}
          <a href="https://github.com/402MCP/402mcp/blob/main/LICENSE" className="link">
            MIT License
          </a>
          .
        </p>
      </PolicySection>

      <PolicySection id="warranty" title="No warranty">
        <p>
          The service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without
          warranties of any kind, including accuracy, availability or fitness for a particular
          purpose.
        </p>
      </PolicySection>

      <PolicySection id="liability" title="Limitation of liability">
        <p>
          To the fullest extent permitted by law, 402MCP.org is not liable for any indirect,
          incidental or consequential damages, or for any loss arising from payments made or not
          made, or decisions taken, on the basis of the service&rsquo;s output.
        </p>
      </PolicySection>

      <PolicySection id="changes" title="Changes">
        <p>
          Changes to these terms are published on this page with a new date. Continuing to use the
          service after a change means you accept the updated terms. See also the{" "}
          <Link href="/privacy" className="link">
            Privacy Policy
          </Link>
          .
        </p>
      </PolicySection>

      <PolicySection id="contact" title="Contact">
        <p>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="link">
            {SUPPORT_EMAIL}
          </a>
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
