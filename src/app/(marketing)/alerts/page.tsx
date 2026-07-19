import type { Metadata } from "next";
import Link from "next/link";
import {
  Droplets,
  Flame,
  Landmark,
  ListPlus,
  Unlock,
  Waves,
  Wallet,
  CalendarClock,
  Info,
} from "lucide-react";
import MarketPulse from "@/components/home/MarketPulse";
import Reveal from "@/components/home/Reveal";

export const metadata: Metadata = {
  title: "Live Market Pulse",
  description:
    "An automated live snapshot of notable 24h crypto moves — top gainers, losers and volume leaders — plus an honest primer on what commonly moves crypto markets.",
  alternates: { canonical: "/alerts" },
};

/** Honest, general education: common mechanics behind big crypto moves. */
const MARKET_MOVERS = [
  {
    icon: Droplets,
    title: "Liquidity & order-flow imbalance",
    body: "When aggressive buying or selling overwhelms the resting orders on the book, price has to travel to find the next liquidity. Thin books move further on the same size.",
  },
  {
    icon: Flame,
    title: "Liquidation cascades",
    body: "Leveraged positions have forced-exit prices. One sharp move can trigger liquidations that become market orders themselves, snowballing the move in the same direction.",
  },
  {
    icon: Landmark,
    title: "Macro events & rates",
    body: "Inflation prints, central-bank decisions and risk sentiment move all risk assets — crypto included. Volatility often clusters around scheduled data releases.",
  },
  {
    icon: ListPlus,
    title: "Listings & delistings",
    body: "A major-exchange listing adds buyers and liquidity; a delisting removes them. Both routinely reprice an asset quickly.",
  },
  {
    icon: Unlock,
    title: "Token unlocks & supply changes",
    body: "Scheduled unlocks release new supply to early holders. Markets often move before and after unlock dates as that supply is anticipated or absorbed.",
  },
  {
    icon: Wallet,
    title: "Whale transfers & block trades",
    body: "Unusually large trades — or big transfers onto exchanges — signal that a major holder is repositioning. That's exactly what block-trade detection watches for.",
  },
  {
    icon: Waves,
    title: "Stablecoin & ETF flows",
    body: "Fresh stablecoin issuance and fund inflows are buying power entering the market; redemptions are power leaving it. Flows lead price more often than headlines do.",
  },
  {
    icon: CalendarClock,
    title: "Weekend & off-hours liquidity",
    body: "Crypto trades 24/7, but market-maker depth thins at weekends and odd hours — the same order moves price further when fewer orders rest on the book.",
  },
];

export default function PulsePage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <Reveal>
        <MarketPulse />
      </Reveal>

      {/* Education: what moves markets */}
      <section className="mt-20">
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            What commonly moves crypto markets
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Big moves make more sense when you know the mechanics behind them. These are
            the usual suspects — general market knowledge, not predictions.
          </p>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MARKET_MOVERS.map((m, i) => {
            const Icon = m.icon;
            return (
              <Reveal key={m.title} delay={(i % 4) * 0.06}>
                <div className="h-full rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 text-emerald-500">
                    <Icon className="h-4.5 w-4.5" aria-hidden />
                  </span>
                  <h3 className="mt-3 text-sm font-semibold text-foreground">{m.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{m.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal>
          <div className="mt-8 flex items-start gap-3 rounded-xl border border-border bg-card p-5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
            <p className="text-sm text-muted-foreground">
              Everything on this page is automated public data and general market
              education — not financial advice, and not a recommendation to buy or sell
              anything. Markets can move for reasons nobody predicted. Read the{" "}
              <Link href="/disclaimer" className="text-emerald-500 underline-offset-4 hover:underline">
                disclaimer
              </Link>
              , learn the fundamentals in{" "}
              <Link href="/learn" className="text-emerald-500 underline-offset-4 hover:underline">
                the guides
              </Link>
              , and watch any market live in{" "}
              <Link href="/terminal" className="text-emerald-500 underline-offset-4 hover:underline">
                the terminal
              </Link>
              .
            </p>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
