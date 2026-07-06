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
  ArrowRight,
} from "lucide-react";
import TickerTape from "@/components/home/TickerTape";
import HeroLiveTrades from "@/components/home/HeroLiveTrades";
import LiveMarketTable from "@/components/home/LiveMarketTable";
import StatsBand from "@/components/home/StatsBand";
import PipelineInfographic from "@/components/home/PipelineInfographic";
import AuroraBackground from "@/components/home/AuroraBackground";
import Reveal from "@/components/home/Reveal";
import { learnArticles } from "./learn/articles";

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
      {/* Live ticker tape */}
      <TickerTape />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <AuroraBackground />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-[1.15fr_1fr] lg:py-28">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 px-3 py-1 font-mono text-xs text-emerald-600 dark:text-emerald-400">
                <span className="ofm-pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live · 5 exchanges · WebSocket + REST fallback
              </span>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="mt-6 max-w-xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem] lg:leading-[1.08]">
                See the market{" "}
                <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  move, live.
                </span>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-5 max-w-lg text-pretty text-lg text-muted-foreground">
                Order Flow Matrix streams every trade from Binance, Bybit, OKX, Bitget and
                KuCoin into one terminal — trade matrix, depth ladder, CVD and whale alerts,
                all from free public data.
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/terminal"
                  className="group inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-medium text-black shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:shadow-emerald-500/40"
                >
                  Launch the terminal
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
                <Link
                  href="/learn"
                  className="rounded-lg border border-border bg-card/60 px-5 py-2.5 text-sm font-medium text-foreground backdrop-blur transition-colors hover:bg-secondary"
                >
                  Learn order flow
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.32}>
              <div className="mt-9 flex flex-wrap items-center gap-2">
                {VENUES.map((v) => (
                  <span
                    key={v}
                    className="rounded-md border border-border bg-card/60 px-3 py-1 font-mono text-xs text-muted-foreground backdrop-blur"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.2} y={32}>
            <HeroLiveTrades />
          </Reveal>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <Reveal>
          <StatsBand />
        </Reveal>
      </section>

      {/* Live markets */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                The market, right now
              </h2>
              <p className="mt-2 max-w-xl text-muted-foreground">
                Live prices from Binance public data. Open any market to watch its raw
                order flow in the terminal.
              </p>
            </div>
            <Link
              href="/markets"
              className="inline-flex items-center gap-1.5 text-sm text-emerald-500 underline-offset-4 hover:underline"
            >
              All markets <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-8">
            <LiveMarketTable />
          </div>
        </Reveal>
      </section>

      {/* Features */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <Reveal>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Everything in one dense surface
            </h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Built for reading the tape fast — disciplined, data-first, alive.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={f.title} delay={(i % 4) * 0.07}>
                  <div className="group h-full rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 text-emerald-500">
                      <Icon className="h-4.5 w-4.5" aria-hidden />
                    </span>
                    <h3 className="mt-3 text-sm font-semibold text-foreground">{f.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Architecture infographic */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            One model, many venues
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Every exchange speaks its own dialect. A thin adapter per venue translates each
            feed into one normalized trade model — so the interface renders every market
            identically, and a blocked venue degrades gracefully instead of breaking.
          </p>
        </Reveal>
        <Reveal delay={0.12}>
          <div className="mt-10">
            <PipelineInfographic />
          </div>
        </Reveal>
      </section>

      {/* Learn preview */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Learn to read the tape
                </h2>
                <p className="mt-2 max-w-xl text-muted-foreground">
                  Short, honest guides — no hype, no signals, just how order flow actually works.
                </p>
              </div>
              <Link
                href="/learn"
                className="inline-flex items-center gap-1.5 text-sm text-emerald-500 underline-offset-4 hover:underline"
              >
                All guides <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {learnArticles.slice(0, 3).map((a, i) => (
              <Reveal key={a.slug} delay={i * 0.08}>
                <Link
                  href={`/learn/${a.slug}`}
                  className="group flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10"
                >
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {a.readingMinutes} min read
                  </span>
                  <h3 className="mt-2 text-base font-semibold text-foreground">{a.title}</h3>
                  <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{a.description}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm text-emerald-500">
                    Read
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Honest framing */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="grid gap-4 md:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6">
              <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">What it is</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>• A fast, transparent way to read live trade flow across venues.</li>
                <li>• Built entirely on public exchange WebSocket / REST data.</li>
                <li>• A learning tool for market microstructure and order flow.</li>
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="h-full rounded-xl border border-border bg-card p-6">
              <h3 className="text-sm font-semibold text-muted-foreground">What it isn&apos;t</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>• Not financial advice and not a signal service.</li>
                <li>• Not co-located, exchange-grade infrastructure.</li>
                <li>• Not a guarantee of data accuracy, completeness or latency.</li>
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA band */}
      <section className="relative overflow-hidden border-t border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 100% at 50% 100%, rgba(16,185,129,0.14) 0%, rgba(16,185,129,0) 70%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-5 py-20 text-center">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Open the tape.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              No sign-up. No API keys. The terminal connects to live public feeds the moment
              it loads.
            </p>
            <Link
              href="/terminal"
              className="group mt-7 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-medium text-black shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:shadow-emerald-500/40"
            >
              Launch the terminal
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
