import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { LineChart, Search, Star, Crosshair, ArrowRight } from "lucide-react";
import ThemeImage from "@/components/ThemeImage";
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
    "Watch live crypto order flow across Binance, Bybit, OKX, Bitget and KuCoin in one dense terminal — trade matrix, order-book depth, candlesticks, CVD and live block-trade detection.",
  alternates: { canonical: "/" },
};

const VENUES = ["Binance", "Bybit", "OKX", "Bitget", "KuCoin"];

/** Illustrated feature spotlights (alternating image/text rows). */
const SPOTLIGHTS = [
  {
    image: "/images/features/live-flow.png",
    imageLight: "/images/features/live-flow-light.png",
    alt: "Stream of green and red trade blocks flowing into a structured matrix",
    title: "Live Trade Matrix",
    body: "A dense, color-coded blotter of every incoming trade — venue tag, price, size, notional and inferred aggressor side. Raw flow, made readable at a glance.",
    link: { href: "/learn/reading-the-trade-matrix", label: "How to read it" },
  },
  {
    image: "/images/features/depth.png",
    imageLight: "/images/features/depth-light.png",
    alt: "Order-book depth ladder with stacked green bids and red asks",
    title: "Order-Book Depth Ladder",
    body: "Real-time bid/ask depth with cumulative size, so you can see exactly where liquidity is stacked — and where it disappears.",
    link: { href: "/terminal", label: "See it live" },
  },
  {
    image: "/images/features/alerts.png",
    imageLight: "/images/features/alerts-light.png",
    alt: "One glowing block standing out from muted blocks on a data conveyor",
    title: "CVD & Block-Trade Detection",
    body: "Cumulative volume delta tracks who's really in control, and whale-sized prints are flagged live the moment they cross the per-market block threshold.",
    link: { href: "/learn/block-trades-and-whale-detection", label: "Whale detection guide" },
  },
  {
    image: "/images/features/multi-venue.png",
    imageLight: "/images/features/multi-venue-light.png",
    alt: "Five colored venue nodes linked to one central emerald node",
    title: "Five Venues, One View",
    body: "Binance, Bybit, OKX, Bitget and KuCoin — compare the same market side-by-side across exchanges, or lock onto a single venue.",
    link: { href: "/markets", label: "Browse markets" },
  },
];

/** Remaining capabilities as compact cards. */
const FEATURES = [
  {
    icon: LineChart,
    title: "Candles + Volume Profile",
    body: "Custom-rendered candlesticks with a volume profile — no third-party charting library.",
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
                KuCoin into one terminal — trade matrix, depth ladder, CVD and whale-trade flags,
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

      {/* Product showcase */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
          style={{
            background:
              "radial-gradient(60% 80% at 50% 100%, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0) 70%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-5 py-14 text-center">
          <Reveal>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              A terminal, not a widget
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
              Trade matrix, depth, candles, CVD and block flags — one dense surface engineered
              for reading markets under pressure.
            </p>
          </Reveal>
          <Reveal delay={0.12} y={40}>
            <div className="relative mx-auto mt-10 max-w-4xl">
              <ThemeImage
                dark="/images/hero-terminal.png"
                light="/images/hero-terminal-light.png"
                alt="Angled product view of the Order Flow Matrix terminal with candlestick chart, order-book ladder and trade list"
                width={1536}
                height={1024}
                className="h-auto w-full drop-shadow-[0_24px_60px_rgba(16,185,129,0.18)]"
                sizes="(max-width: 1024px) 100vw, 896px"
              />
            </div>
          </Reveal>
        </div>
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

      {/* Feature spotlights (illustrated) */}
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

          <div className="mt-12 space-y-16">
            {SPOTLIGHTS.map((s, i) => (
              <Reveal key={s.title}>
                <div
                  className={`grid items-center gap-8 lg:grid-cols-2 ${
                    i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
                  }`}
                >
                  {/* dark: transparent art floats directly on the page */}
                  <div>
                    <Image
                      src={s.image}
                      alt={s.alt}
                      width={1536}
                      height={1024}
                      className="hidden h-auto w-full drop-shadow-[0_18px_45px_rgba(16,185,129,0.16)] dark:block"
                      sizes="(max-width: 1024px) 100vw, 560px"
                    />
                    {/* light: framed picture card (light art has a painted backdrop) */}
                    <div className="overflow-hidden rounded-2xl border border-border shadow-lg shadow-slate-950/5 dark:hidden">
                      <Image
                        src={s.imageLight}
                        alt={s.alt}
                        width={1536}
                        height={1024}
                        className="h-auto w-full scale-[1.03]"
                        sizes="(max-width: 1024px) 100vw, 560px"
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight text-foreground">
                      {s.title}
                    </h3>
                    <p className="mt-3 text-muted-foreground">{s.body}</p>
                    <Link
                      href={s.link.href}
                      className="mt-4 inline-flex items-center gap-1.5 text-sm text-emerald-500 underline-offset-4 hover:underline"
                    >
                      {s.link.label} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* compact capability cards */}
          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
