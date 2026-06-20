import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Order Flow Matrix",
    short_name: "OFM",
    description:
      "Real-time crypto order-flow terminal across Binance, Bybit, OKX, Bitget and KuCoin.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0e14",
    theme_color: "#0a0e14",
    icons: [{ src: "/logo.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
