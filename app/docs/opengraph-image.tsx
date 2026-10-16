import { ImageResponse } from "next/og";

import { SITE_NAME } from "@/data/solutions";

export const alt = "402MCP.org — integration documentation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
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
            {`${SITE_NAME} · Developer guides`}
          </div>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.08, marginTop: 26 }}>
            Integration Documentation
          </div>
        </div>
        <div
          style={{
            fontSize: 30,
            color: "#595959",
            borderTop: "3px solid #111111",
            paddingTop: 28,
            maxWidth: 940,
            display: "flex",
          }}
        >
          How HTTP 402 payments work, how L402 and x402 differ, and how to
          integrate any indexed solution.
        </div>
      </div>
    ),
    size,
  );
}
