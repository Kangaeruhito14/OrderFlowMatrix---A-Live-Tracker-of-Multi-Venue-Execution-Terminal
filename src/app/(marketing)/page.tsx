import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  LineChart,
  Bell,
  Search,
  Star,
  GitCompare,
  Crosshair,
} from "lucide-react";

export const metadata: Metadata = {
  title: { absolute: "Order Flow Matrix — Live Multi-Venue Crypto Execution Terminal" },
  description:
    "Watch live crypto order flow across Binance, Bybit, OKX, Bitget and KuCoin in one dense terminal — trade matrix, order-book depth, candlesticks, CVD and block-trade alerts.",
  alternates: { canonical: "/" },
};

const VENUES = ["Binance", "Bybit", "OKX", "Bitget", "KuCoin"];

const FEATURES = [
  {
    icon: Activity,
    title: "Live Trade Matrix",
    body: "A dense, color-coded blotter of every incoming trade with venue tag, price, size, notional and inferred aggressor side.",
  },
  {
    icon: BarChart3,
    title: "Order-Book Depth Ladder",
    body: "Real-time bid/ask depth with cumulative size, so you can see where liquidity is stacked.",
  },
  {
    icon: LineChart,
    title: "Candles + Volume Profile",
    body: "Custom-rendered candlesticks with a volume profile — no third-party charting library.",
  },
  {
    icon: Bell,
    title: "CVD & Block-Trade Alerts",
    body: "Cumulative volume delta plus alerts when unusually large prints cross your notional threshold.",
  },
  {
    icon: Search,
    title: "Market Universe Browser",
    body: "Search and sort the coin universe by volume, change and activity — far beyond a dropdown.",
  },
  {
    icon: Star,
    title: "Watchlist & Auto-Rotation",
    body: "Pin the pairs you care about and optionally rotate through them hands-free.",
  },
  {
    icon: GitCompare,
    title: "Exchange Comparison",
    body: "Put the same symbol side-by-side across venues to compare price, activity and pressure.",
  },
  {
    icon: Crosshair,
    title: "Focus / Lock Mode",
    body: "Lock the interface onto one instrument when you want to watch a single setup closely.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 0%, rgba(16,185,129,0.10) 0%, rgba(16,185,129,0) 70%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-5 py-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 font-mono text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Live · 5 exchanges · WebSocket + REST fallback
          </span>

          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Live multi-venue crypto execution flow, in one terminal.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
            Order Flow Matrix streams and visualizes live trades across Binance, Bybit,
            OKX, Bitget and KuCoin — a trade matrix, depth ladder, candlesticks, CVD and
            block-trade alerts, all from public exchange data.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/terminal"
              className="rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-emerald-400"
            >
              Launch the terminal
            </Link>
            <Link
              href="/about"
              className="rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              How it works
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {VENUES.map((v) => (
              <span
                key={v}
                className="rounded-md border border-border bg-card px-3 py-1 font-mono text-xs text-muted-foreground"
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Everything in one dense surface
          </h2>
          <p className="mt-3 text-muted-foreground">
            Built for reading the tape fast — disciplined, dark, and data-first.
          </p>
        </div>
        <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="bg-card p-5">
                <Icon className="h-5 w-5 text-emerald-400" aria-hidden />
                <h3 className="mt-3 text-sm font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Architecture */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                One model, many venues
              </h2>
              <p className="mt-4 text-muted-foreground">
                Each exchange speaks its own dialect — different WebSocket formats, symbol
                conventions and REST shapes. Order Flow Matrix normalizes them all through
                a single adapter interface into one unified trade model, so the interface
                renders every venue identically.
              </p>
              <p className="mt-4 text-muted-foreground">
                When a venue blocks browser connections, the terminal degrades gracefully
                to a server-side REST fallback instead of hanging — and tells you which
                mode each feed is in.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-5 font-mono text-xs leading-relaxed text-muted-foreground">
              <div className="text-emerald-400">// one common shape for every exchange</div>
              <div className="mt-2">interface NormalizedTrade {"{"}</div>
              <div className="pl-4">price: number</div>
              <div className="pl-4">quantity: number</div>
              <div className="pl-4">side: &apos;buy&apos; | &apos;sell&apos;</div>
              <div className="pl-4">timestamp: number</div>
              <div className="pl-4">venue: ExchangeId</div>
              <div>{"}"}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Honest framing */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-sm font-semibold text-emerald-400">What it is</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>• A fast, transparent way to read live trade flow across venues.</li>
              <li>• Built entirely on public exchange WebSocket / REST data.</li>
              <li>• A learning tool for market microstructure and order flow.</li>
            </ul>
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-sm font-semibold text-muted-foreground">What it isn&apos;t</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>• Not financial advice and not a signal service.</li>
              <li>• Not co-located, exchange-grade infrastructure.</li>
              <li>• Not a guarantee of data accuracy, completeness or latency.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Open the tape.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            No sign-up. The terminal connects to live public feeds the moment it loads.
          </p>
          <Link
            href="/terminal"
            className="mt-6 inline-block rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-emerald-400"
          >
            Launch the terminal
          </Link>
        </div>
      </section>
    </>
  );
}
