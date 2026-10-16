import type { MetadataRoute } from "next";

import { REGISTRY_UPDATED, SITE_URL, rankedSolutions } from "@/data/solutions";

/**
 * `lastmod` is the registry's own change date, not build time. A timestamp that
 * moves on every deploy trains crawlers to distrust the field.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = REGISTRY_UPDATED;

  return [
    { url: SITE_URL, lastModified, changeFrequency: "weekly", priority: 1 },
    {
      url: `${SITE_URL}/docs`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...rankedSolutions.map((solution) => ({
      url: `${SITE_URL}/solutions/${solution.id}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${SITE_URL}/changelog`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    },
    // Plain-text indexes are first-class content here, not build artifacts.
    {
      url: `${SITE_URL}/llms.txt`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/llms-full.txt`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];
}
