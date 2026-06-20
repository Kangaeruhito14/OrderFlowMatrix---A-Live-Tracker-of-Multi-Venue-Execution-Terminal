import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Order Flow Matrix — Live Multi-Venue Crypto Execution Terminal",
    template: "%s · Order Flow Matrix",
  },
  description:
    "A real-time crypto order-flow terminal that streams and visualizes live trades across Binance, Bybit, OKX, Bitget and KuCoin — trade matrix, order-book depth, CVD and block-trade alerts.",
  applicationName: "Order Flow Matrix",
  keywords: [
    "order flow",
    "crypto order flow",
    "trade flow",
    "market microstructure",
    "CVD",
    "cumulative volume delta",
    "order book",
    "block trades",
    "Binance",
    "Bybit",
    "OKX",
    "Bitget",
    "KuCoin",
    "crypto trading terminal",
    "real-time market data",
  ],
  authors: [{ name: "Order Flow Matrix" }],
  creator: "Order Flow Matrix",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Order Flow Matrix",
    title: "Order Flow Matrix — Live Multi-Venue Crypto Execution Terminal",
    description:
      "Real-time crypto order-flow across Binance, Bybit, OKX, Bitget and KuCoin in one dense terminal.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Order Flow Matrix",
    description:
      "Real-time crypto order-flow across Binance, Bybit, OKX, Bitget and KuCoin.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
