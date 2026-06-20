import type { NextConfig } from "next";

// Baseline security headers applied to every route. A full Content-Security-Policy
// is intentionally deferred: it must enumerate every exchange WebSocket/REST origin
// (Binance, Bybit, OKX, Bitget, KuCoin) in connect-src and be tested against the live
// terminal before shipping — see TASKS.md.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
