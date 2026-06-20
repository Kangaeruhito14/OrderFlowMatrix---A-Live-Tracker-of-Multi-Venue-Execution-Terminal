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

export const metadata: Metadata = {
  title: "Cryptographic Order Flow Matrix — BTCUSDT Live Terminal",
  description: "Institutional-grade real-time crypto order flow terminal powered by the Binance live WebSocket trade stream for BTCUSDT.",
  keywords: ["order flow", "BTCUSDT", "Binance", "trading terminal", "market microstructure", "order book", "real-time"],
  authors: [{ name: "Order Flow Matrix" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Cryptographic Order Flow Matrix",
    description: "Institutional dark-pool analytics terminal for BTCUSDT live execution flow.",
    url: "https://chat.z.ai",
    siteName: "Order Flow Matrix",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cryptographic Order Flow Matrix",
    description: "Institutional dark-pool analytics terminal for BTCUSDT live execution flow.",
  },
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
