import type { MetadataRoute } from "next";

// Merged from the generated favicon set's site.webmanifest — served by Next
// at /manifest.webmanifest (linked automatically via the metadata API).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Order Flow Matrix",
    short_name: "OFM",
    description:
      "Real-time crypto order-flow terminal across Binance, Bybit, OKX, Bitget and KuCoin.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f1420",
    theme_color: "#0f1420",
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
