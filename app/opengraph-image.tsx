import { ImageResponse } from "next/og";

import { CRITERIA, SITE_NAME, rankedSolutions } from "@/data/solutions";

export const alt =
  "402MCP.org — The Open Registry for Agentic Commerce & HTTP 402";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social card, generated at build time so there is no binary asset to keep in
 * sync with the design. Monochrome and typographic, matching the site.
 *
 * Satori (which renders this) requires an explicit `display` on any element
 * with more than one child, and treats adjacent text/expressions as separate
 * children — hence `display: flex` everywhere and single template strings.
 */
export default async function OpengraphImage() {
  const stats = [
    { value: String(rankedSolutions.length), label: "solutions" },
    { value: String(CRITERIA.length), label: "criteria" },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          color: "#111111",
          padding: 72,
          border: "10px solid #111111",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: 6,
              color: "#595959",
            }}
          >
            {SITE_NAME.toUpperCase()}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.08,
              marginTop: 28,
              maxWidth: 940,
            }}
          >
            {"The Open Registry for Agentic Commerce & HTTP 402"}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            borderTop: "3px solid #111111",
            paddingTop: 28,
          }}
        >
          <div style={{ display: "flex", fontSize: 30, color: "#595959", maxWidth: 680 }}>
            {"Compare self-custodial payment rails built for autonomous AI agents."}
          </div>
          <div style={{ display: "flex" }}>
            {stats.map((stat) => (
              <div
                key={stat.label}
                style={{ display: "flex", flexDirection: "column", marginLeft: 56 }}
              >
                <div style={{ display: "flex", fontSize: 48, fontWeight: 700 }}>
                  {stat.value}
                </div>
                <div style={{ display: "flex", fontSize: 20, color: "#595959" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
