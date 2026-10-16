/** Contact and policy details shared by the support, privacy and terms pages. */

/** Public support address. Also the contact for privacy requests and security reports. */
export const SUPPORT_EMAIL = "support@402mcp.org";

/** Date the privacy policy and terms last changed, as YYYY-MM-DD. */
export const POLICIES_UPDATED = "2026-10-16";

/**
 * Legal entity that operates the site, or null to name the site alone. When
 * set, the policies say "402MCP.org is operated by <OPERATOR>".
 */
export const OPERATOR: string | null = "Blokhaus Inc";

/** Formats a YYYY-MM-DD date as "16 October 2026". */
export function formatPolicyDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
