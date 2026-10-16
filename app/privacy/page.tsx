import type { Metadata } from "next";
import Link from "next/link";

import { PolicyPage, PolicySection } from "@/components/PolicyPage";
import { NPM_PACKAGE } from "@/lib/version";
import { OPERATOR, POLICIES_UPDATED, SUPPORT_EMAIL, formatPolicyDate } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What 402MCP.org collects when you use the website, the hosted MCP server and API, or the npm package: no accounts, no cookies, no advertising, and inputs used only to answer the request.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <PolicyPage
      eyebrow="Legal"
      title="Privacy Policy"
      path="/privacy"
      updated={formatPolicyDate(POLICIES_UPDATED)}
      intro={
        <>
          <p>
            This policy covers the 402mcp.org website, the hosted MCP server and REST API at
            402mcp.org, and the <code className="font-mono">{NPM_PACKAGE}</code> npm package.
            {OPERATOR ? ` 402MCP.org is operated by ${OPERATOR}.` : null}
          </p>
          <p>
            In short: there are no accounts, no cookies and no advertising. What you send to the
            server is used to answer that request and is not stored in any database. Personal data
            is never sold.
          </p>
        </>
      }
    >
      <PolicySection id="collect" title="What is collected">
        <ul>
          <li>
            <strong>Website analytics.</strong> Page views are counted with Farwatch, a cookieless
            analytics service. For each page view it receives the page path, the referring page,
            your screen and window size, your browser language and how long the page stayed open,
            along with the IP address and user agent that every web request carries. It sets no
            cookies and does not run on the API or MCP server.
          </li>
          <li>
            <strong>Requests to the MCP server and API.</strong> To answer a request, the server
            processes what you send: for example, a 402 response to decode, requirements to match,
            or a URL to probe. That input is used only to produce the response and is not saved.
          </li>
          <li>
            <strong>Request logs.</strong> The hosting provider, Cloudflare, logs request details
            such as IP address, time, requested URL (including query parameters, so a URL passed to
            the probe endpoint appears there) and user agent. These logs are used for operation,
            debugging and abuse prevention.
          </li>
          <li>
            <strong>Rate limiting.</strong> The probe endpoint uses your IP address to apply a
            per-client request limit.
          </li>
          <li>
            <strong>Email.</strong> If you email {SUPPORT_EMAIL}, your address and message are
            received and used only to reply.
          </li>
        </ul>
      </PolicySection>

      <PolicySection id="probe" title="URL probes">
        <p>
          When you ask the hosted server to probe a URL, it makes one request to that URL from
          Cloudflare&rsquo;s network. The site you name sees that request, not your IP address. The
          server never follows redirects, never pays, and refuses private and internal addresses.
        </p>
      </PolicySection>

      <PolicySection id="npm" title="The npm package">
        <p>
          The <code className="font-mono">{NPM_PACKAGE}</code> package runs on your own computer.
          Decoding happens locally and is not sent anywhere. At startup it downloads the public
          registry from 402mcp.org, an ordinary request that is logged like any other; set{" "}
          <code className="font-mono">MCP_402_OFFLINE=1</code> to skip it. Probes made through the
          package come from your machine.
        </p>
      </PolicySection>

      <PolicySection id="use" title="How data is used">
        <p>
          Only to run, secure and improve the service: answering requests, counting page views,
          and investigating errors and abuse. Your inputs are not used to build profiles, to
          advertise, or to train AI models.
        </p>
      </PolicySection>

      <PolicySection id="sharing" title="Sharing">
        <p>
          Data is shared only with the service providers that run the site: Cloudflare, for
          hosting and request logs, and Farwatch, for page-view analytics. Each processes data
          under its own privacy policy. Information may also be disclosed when required by law.
          It is not sold or shared for advertising.
        </p>
      </PolicySection>

      <PolicySection id="retention" title="Retention">
        <p>
          There is no database of personal data. Request logs are kept by Cloudflare for a short
          period, at most seven days for the Worker&rsquo;s own logs. Emails are kept only as long
          as needed to handle the request.
        </p>
      </PolicySection>

      <PolicySection id="choices" title="Your choices">
        <ul>
          <li>The website works fully with analytics blocked.</li>
          <li>The npm package can run entirely offline.</li>
          <li>
            To ask about, correct or delete information relating to you, email{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="link">
              {SUPPORT_EMAIL}
            </a>
            .
          </li>
        </ul>
      </PolicySection>

      <PolicySection id="children" title="Children">
        <p>The service is a developer reference and is not directed to children under 13.</p>
      </PolicySection>

      <PolicySection id="changes" title="Changes">
        <p>
          Changes to this policy are published on this page with a new date. See also the{" "}
          <Link href="/terms" className="link">
            Terms of Service
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
