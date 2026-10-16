import {
  CRITERIA,
  MATURITY_DEFINITIONS,
  SITE_URL,
  type Solution,
} from "@/data/solutions";
import type { SchemeReference } from "@/lib/schemes";

/** Markdown renderings shared by the page routes, MCP resources and the npm package. */

export function solutionToMarkdown(solution: Solution, total: number): string {
  const criteriaRows = CRITERIA.map(
    ({ key, label }) => `| ${label} | ${solution.criteria[key].toFixed(1)} |`,
  ).join("\n");

  const samples = solution.code_samples.length
    ? solution.code_samples
        .map((sample) => `### ${sample.label}\n\n\`\`\`${sample.language}\n${sample.code}\n\`\`\``)
        .join("\n\n")
    : `See the vendor documentation: ${solution.docs_url}`;

  return `# ${solution.name}

> ${solution.tagline}

- Registry: ${SITE_URL}/solutions/${solution.id}
- Rank: ${solution.rank} of ${total}
- Composite score: ${solution.score.toFixed(1)} / 10
- Schemes: ${solution.schemes.join(", ")}
- Roles: ${solution.roles.map((role) => (role === "pay" ? "pays 402 challenges" : "charges with 402 challenges")).join("; ")}
- Kind: ${solution.kind}
- Maturity: ${solution.maturity}${solution.maturity_note ? ` — ${solution.maturity_note}` : ""}
- Protocol / rail: ${solution.protocol}
- Assets: ${solution.assets.join(", ")}
- Networks: ${solution.chains.join(", ")}
- Custody model: ${solution.custody_type}
- Node management required: ${solution.node_management_required ? "yes" : "no"}
- MCP native: ${solution.mcp_native ? "yes" : "no"}
- Install: ${solution.mcp_command ?? "n/a"}
- License: ${solution.license ?? "not stated"}
- Documentation: ${solution.docs_url}
- Last verified: ${solution.last_verified}

## Overview

${solution.summary}

## Key advantages

${solution.key_advantages.map((item) => `- ${item}`).join("\n")}

## Trade-offs

${solution.disadvantages.map((item) => `- ${item}`).join("\n")}

## Evaluation matrix

Scores are 1-10. The composite is the unweighted mean, rounded to one decimal place.
Methodology: ${SITE_URL}/docs#methodology

| Criterion | Score |
| --- | --- |
${criteriaRows}

${solution.scoring_rationale}

## Best for

${solution.best_for}

## Integration

${samples}

## Sources

${solution.sources.map((source) => `- [${source.title}](${source.url})`).join("\n")}

---

402MCP.org is an independent registry and is not affiliated with this vendor.
Full dataset: ${SITE_URL}/api/v1/registry
`;
}

export function schemeToMarkdown(reference: SchemeReference): string {
  return `# ${reference.name}

${reference.summary}

- Status: ${reference.status}
- Settlement: ${reference.settlement}

## Wire format

| | Where | Format |
| --- | --- | --- |
| Challenge | ${reference.challenge.where} | \`${reference.challenge.format}\` |
| Credential | ${reference.credential.where} | \`${reference.credential.format}\` |
| Receipt | ${reference.receipt.where ?? "—"} | ${reference.receipt.format ? `\`${reference.receipt.format}\`` : "—"} |

## Flow

${reference.flow.map((step, index) => `${index + 1}. ${step}`).join("\n")}

## Notes

${reference.notes.map((note) => `- ${note}`).join("\n")}

## Example

\`\`\`http
${reference.example}
\`\`\`

## Specifications

${reference.specs.map((spec) => `- [${spec.title}](${spec.url})`).join("\n")}
`;
}

export function methodologyMarkdown(): string {
  return `# 402MCP.org scoring methodology

Every indexed solution is scored 1-10 on six equally weighted criteria. The
published score is the unweighted mean, rounded to one decimal place. Rank is
the order of those means, with exact ties broken alphabetically. No entry is
pinned to a position, and listing position cannot be purchased.

## Criteria

${CRITERIA.map(({ label, description }) => `- **${label}** — ${description}`).join("\n")}

## Maturity labels

Maturity is stated only as the vendor states it, or as release history shows it.

${Object.entries(MATURITY_DEFINITIONS).map(([key, value]) => `- **${key}** — ${value}`).join("\n")}

## Sources and corrections

Every entry lists its sources and the date its claims were last verified. If a
fact is wrong or stale, the correction changes the data and the ranking follows.
`;
}
