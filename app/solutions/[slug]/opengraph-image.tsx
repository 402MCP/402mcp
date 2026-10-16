import { ImageResponse } from "next/og";

import { SITE_NAME, getSolution, rankedSolutions } from "@/data/solutions";

export const alt = "402MCP.org solution entry";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Prerender a card for every entry at build time. */
export function generateStaticParams() {
  return rankedSolutions.map((solution) => ({ slug: solution.id }));
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const solution = getSolution(slug);

  if (!solution) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffffff",
            color: "#111111",
            fontSize: 64,
            fontWeight: 700,
            fontFamily: "sans-serif",
          }}
        >
          {SITE_NAME}
        </div>
      ),
      size,
    );
  }

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
              fontSize: 24,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#595959",
            }}
          >
            {`${SITE_NAME} · Rank ${solution.rank} of ${rankedSolutions.length}`}
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.08,
              marginTop: 26,
              maxWidth: 1000,
            }}
          >
            {solution.name}
          </div>
          <div style={{ fontSize: 30, color: "#595959", marginTop: 20, maxWidth: 900 }}>
            {solution.tagline}
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
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 780 }}>
            <div style={{ fontSize: 20, letterSpacing: 3, color: "#595959", textTransform: "uppercase" }}>
              Protocol / rail
            </div>
            <div style={{ fontSize: 30, marginTop: 8 }}>{solution.protocol}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ fontSize: 20, letterSpacing: 3, color: "#595959", textTransform: "uppercase" }}>
              Score
            </div>
            <div style={{ fontSize: 64, fontWeight: 700, marginTop: 4 }}>
              {solution.score.toFixed(1)}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
