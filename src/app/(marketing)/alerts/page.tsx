import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Layers, SlidersHorizontal, Mail } from "lucide-react";
import WaitlistForm from "@/components/marketing/WaitlistForm";

export const metadata: Metadata = {
  title: "Block-Trade Alerts",
  description:
    "Cross-venue block-trade and whale alerts for crypto order flow — get notified when unusually large prints cross your threshold. Join the waitlist.",
  alternates: { canonical: "/alerts" },
};

const FEATURES = [
  {
    icon: Layers,
    title: "Cross-venue",
    body: "Watch large prints across Binance, Bybit, OKX, Bitget and KuCoin from one place.",
  },
  {
    icon: SlidersHorizontal,
    title: "Per-symbol thresholds",
    body: "Notional thresholds calibrated per market, so 'large' means large for that pair.",
  },
  {
    icon: Bell,
    title: "Delivered to you",
    body: "Get alerts where you already are — planned for email and webhooks first.",
  },
];

export default function AlertsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 font-mono text-xs text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Coming soon
      </span>

      <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground">
        Cross-venue block-trade alerts
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        The terminal already flags{" "}
        <Link href="/learn/block-trades-and-whale-detection" className="text-emerald-400 underline-offset-4 hover:underline">
          block trades
        </Link>{" "}
        live. The next step: get notified when whale-sized prints cross your threshold —
        without staring at the tape all day. We&apos;re building it; tell us you want it.
      </p>

      <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="bg-card p-5">
              <Icon className="h-5 w-5 text-emerald-400" aria-hidden />
              <h2 className="mt-3 text-sm font-semibold text-foreground">{f.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-10 rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 text-foreground">
          <Mail className="h-4 w-4 text-emerald-400" aria-hidden />
          <h2 className="text-base font-semibold">Join the waitlist</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          No spam, no payment now — just a heads-up when alerts go live, and a chance to shape them.
        </p>
        <div className="mt-4">
          <WaitlistForm />
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Alerts are informational only and <strong className="text-foreground">not financial advice</strong>.
        See the <Link href="/disclaimer" className="text-emerald-400 underline-offset-4 hover:underline">disclaimer</Link>.
      </p>
    </div>
  );
}
