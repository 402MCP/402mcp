import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext Cloudflare adapter config.
 *
 * Defaults are right for this site: every page is prerendered at build time and
 * the dynamic routes are pure functions of the in-bundle dataset, so there is
 * nothing to cache incrementally, no R2/KV cache to wire up and no revalidation
 * queue. Deploys as a single Worker with static assets.
 */
export default defineCloudflareConfig();
