import type { Metadata } from "next";
import Link from "next/link";
import {
  MARKET_EXCHANGES,
  EXCHANGE_LABELS,
  getTopPairs,
} from "@/lib/markets";

export const metadata: Metadata = {
  title: "Markets",
  description:
    "Browse live crypto markets across Binance, Bybit, OKX, Bitget and KuCoin. Jump straight into the order-flow terminal for any pair.",
  alternates: { canonical: "/markets" },
};

// Refresh the top-pairs lists periodically (free; server-side ISR).
export const revalidate = 3600;

export default async function MarketsHubPage() {
  const sections = await Promise.all(
    MARKET_EXCHANGES.map(async (ex) => ({
      exchange: ex,
      label: EXCHANGE_LABELS[ex],
      pairs: (await getTopPairs(ex)).slice(0, 18),
    }))
  );

  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Markets</h1>
      <p className="mt-3 max-w-2xl text-base text-muted-foreground">
        The most active USDT pairs on each venue. Open any market to see its live order
        flow, or jump straight into the terminal.
      </p>

      <div className="mt-10 space-y-10">
        {sections.map((s) => (
          <section key={s.exchange}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">{s.label}</h2>
              <span className="font-mono text-xs text-muted-foreground">
                top {s.pairs.length} by 24h volume
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {s.pairs.map((p) => (
                <Link
                  key={p.symbol}
                  href={`/markets/${s.exchange}/${p.symbol}`}
                  className="rounded-md border border-border bg-card px-2.5 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-emerald-500/50 hover:text-foreground"
                >
                  {p.base}
                  <span className="text-muted-foreground/60">-USDT</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
