import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Order Flow Matrix — Live Multi-Venue Crypto Execution Terminal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * OpenGraph card composited over the brand background artwork
 * (public/images/og-bg.png) with the logo and title.
 */
export default async function Image() {
  const [bg, logo] = await Promise.all([
    readFile(join(process.cwd(), "public", "images", "og-bg.png")),
    readFile(join(process.cwd(), "public", "logo.png")),
  ]);
  const bgSrc = `data:image/png;base64,${bg.toString("base64")}`;
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          fontFamily: "monospace",
        }}
      >
        {/* background artwork */}
        { }
        <img
          src={bgSrc}
          alt=""
          width={1200}
          height={630}
          style={{ position: "absolute", inset: 0, objectFit: "cover" }}
        />
        {/* darkening scrim for text legibility */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(6,10,18,0.55) 0%, rgba(6,10,18,0.25) 45%, rgba(6,10,18,0.6) 100%)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "56px 72px 0",
          }}
        >
          { }
          <img src={logoSrc} alt="" width={86} height={59} />
          <div style={{ fontSize: 30, letterSpacing: 3, color: "#c9d4df", fontWeight: 700 }}>
            ORDER FLOW MATRIX
          </div>
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            padding: "0 72px 60px",
          }}
        >
          <div style={{ fontSize: 62, fontWeight: 700, color: "#ffffff", lineHeight: 1.12 }}>
            Live multi-venue crypto
          </div>
          <div style={{ fontSize: 62, fontWeight: 700, color: "#34d399", lineHeight: 1.12 }}>
            execution terminal
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
            {["Binance", "Bybit", "OKX", "Bitget", "KuCoin"].map((v) => (
              <div
                key={v}
                style={{
                  padding: "7px 16px",
                  border: "1px solid rgba(148,163,184,0.35)",
                  borderRadius: 8,
                  color: "#e2e8f0",
                  background: "rgba(10,16,28,0.55)",
                  fontSize: 22,
                }}
              >
                {v}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
