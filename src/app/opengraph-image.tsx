import { ImageResponse } from "next/og";

export const alt = "Order Flow Matrix — Live Multi-Venue Crypto Execution Terminal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Dynamically generated OpenGraph card. No external fonts/assets so it builds anywhere.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #06080c 0%, #0d1320 60%, #0a0e14 100%)",
          padding: "64px 72px",
          color: "#e6edf3",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 999,
              background: "#10b981",
              boxShadow: "0 0 24px #10b981",
            }}
          />
          <div style={{ fontSize: 28, letterSpacing: 2, color: "#8b98a5" }}>
            ORDER FLOW MATRIX
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>
            Live Multi-Venue Crypto
          </div>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>
            Execution Terminal
          </div>
          <div style={{ fontSize: 30, color: "#8b98a5", marginTop: 8 }}>
            Real-time order flow · trade matrix · depth · CVD · block alerts
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, fontSize: 26 }}>
          {["Binance", "Bybit", "OKX", "Bitget", "KuCoin"].map((v) => (
            <div
              key={v}
              style={{
                padding: "8px 18px",
                border: "1px solid #1e2a3a",
                borderRadius: 8,
                color: "#c9d4df",
                background: "#0f1622",
              }}
            >
              {v}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
