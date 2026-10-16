import {
  PROTOCOL_VERSION,
  REGISTRY_UPDATED,
  SITE_NAME,
  SITE_URL,
  rankedSolutions,
  type Solution,
} from "@/data/solutions";

/**
 * Structured-data builders.
 *
 * Every graph here describes something a crawler can verify on the page it is
 * embedded in. The registry rates third-party products, so a rating is modelled
 * as a `Review` authored by this organization rather than as an
 * `aggregateRating`: there is one assessor, not an aggregate of users.
 */

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const DATASET_ID = `${SITE_URL}/#dataset`;

export const SITE_DESCRIPTION =
  "The open registry for agentic commerce and HTTP 402. Discover, compare, and integrate self-custodial payment rails built for autonomous AI agents.";

export function organizationSchema() {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Independent directory ranking HTTP 402, L402 and x402 payment infrastructure for autonomous AI agents.",
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/icon-512.png`,
      width: 512,
      height: 512,
    },
  };
}

export function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    publisher: { "@id": ORGANIZATION_ID },
    inLanguage: "en",
  };
}

/**
 * The registry itself is a dataset — declaring it as one makes it eligible for
 * Google Dataset Search.
 */
export function datasetSchema() {
  return {
    "@type": "Dataset",
    "@id": DATASET_ID,
    name: "402MCP.org HTTP 402 payment solutions registry",
    description:
      "Ranked, scored index of HTTP 402, L402 and x402 payment solutions for autonomous AI agents. Each entry carries a composite score and six per-criterion scores covering custody, operational friction, agent-native support, payment rails, settlement speed and developer experience.",
    url: SITE_URL,
    identifier: `${SITE_URL}/api/v1/solutions`,
    keywords: [
      "HTTP 402",
      "L402",
      "x402",
      "agent payments",
      "machine-to-machine commerce",
      "Model Context Protocol",
      "Lightning Network",
      "stablecoin payments",
    ],
    license: "https://creativecommons.org/licenses/by/4.0/",
    creator: { "@id": ORGANIZATION_ID },
    isAccessibleForFree: true,
    version: PROTOCOL_VERSION,
    dateModified: REGISTRY_UPDATED,
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: `${SITE_URL}/api/v1/solutions`,
        name: "REST API (JSON)",
      },
      {
        "@type": "DataDownload",
        encodingFormat: "text/plain",
        contentUrl: `${SITE_URL}/llms-full.txt`,
        name: "Full Markdown corpus",
      },
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: `${SITE_URL}/.well-known/402.json`,
        name: "Discovery manifest",
      },
    ],
  };
}

/** The leaderboard, as an ordered list of the solution pages. */
export function itemListSchema() {
  return {
    "@type": "ItemList",
    name: "HTTP 402 & agent payment solutions, ranked",
    description:
      "Solutions ranked by composite score: the unweighted mean of six published criteria.",
    url: SITE_URL,
    numberOfItems: rankedSolutions.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: rankedSolutions.map((solution) => ({
      "@type": "ListItem",
      position: solution.rank,
      url: `${SITE_URL}/solutions/${solution.id}`,
      name: solution.name,
    })),
  };
}

export function breadcrumbSchema(
  trail: { name: string; url: string }[],
) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

/** A solution entry: the product, plus this registry's assessment of it. */
export function solutionSchema(solution: Solution) {
  const url = `${SITE_URL}/solutions/${solution.id}`;

  return {
    "@type": "SoftwareApplication",
    "@id": `${url}#software`,
    name: solution.name,
    description: solution.summary,
    url: solution.docs_url,
    applicationCategory: "DeveloperApplication",
    applicationSubCategory: "Payment infrastructure",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description:
        "Open protocol or SDK. Transaction and network fees are set by the underlying payment rail.",
    },
    review: {
      "@type": "Review",
      "@id": `${url}#review`,
      url,
      name: `${solution.name} — 402MCP.org assessment`,
      reviewBody: solution.summary,
      datePublished: REGISTRY_UPDATED,
      author: { "@id": ORGANIZATION_ID },
      reviewRating: {
        "@type": "Rating",
        ratingValue: solution.score,
        bestRating: 10,
        worstRating: 1,
        ratingExplanation:
          "Unweighted mean of six published criteria, each scored 1-10. See /docs#methodology.",
      },
      positiveNotes: {
        "@type": "ItemList",
        itemListElement: solution.key_advantages.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item,
        })),
      },
      negativeNotes: {
        "@type": "ItemList",
        itemListElement: solution.disadvantages.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item,
        })),
      },
    },
  };
}

/** Serializes a @graph safely for embedding in a script tag. */
export function jsonLd(nodes: object[]) {
  return JSON.stringify({ "@context": "https://schema.org", "@graph": nodes })
    // `<` cannot appear raw inside a script element.
    .replace(/</g, "\\u003c");
}
