import type { Metadata } from "next";
import Link from "next/link";
import { Clock } from "lucide-react";
import {
  MARKET_EXCHANGES,
  EXCHANGE_LABELS,
  getTopPairsDetailed,
} from "@/lib/markets";

export const metadata: Metadata = {
  title: "Markets",
  description:
    "Browse live crypto markets across Binance, Bybit, OKX, Bitget and KuCoin. Jump straight into the order-flow terminal for any pair.",
  alternates: { canonical: "/markets" },
};

// Rankings re-fetch automatically every hour (server-side ISR).
export const revalidate = 3600;

const utcFmt = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
  hour12: false,
});

export default async function MarketsHubPage() {
  const sections = await Promise.all(
    MARKET_EXCHANGES.map(async (ex) => {
      const { pairs, live } = await getTopPairsDetailed(ex);
      return { exchange: ex, label: EXCHANGE_LABELS[ex], pairs: pairs.slice(0, 18), live };
    })
  );
  const updatedAt = utcFmt.format(new Date());

  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Markets</h1>
      <p className="mt-3 max-w-2xl text-base text-muted-foreground">
        The most active USDT pairs on each venue. Open any market to see its live order
        flow, or jump straight into the terminal.
      </p>
      <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 font-mono text-[11px] text-muted-foreground">
        <Clock className="h-3 w-3" aria-hidden />
        Rankings by rolling 24h quote volume · refreshed {updatedAt} UTC · auto-updates hourly
      </p>

      <div className="mt-10 space-y-10">
        {sections.map((s) => (
          <section key={s.exchange}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-foreground">{s.label}</h2>
              {s.live ? (
                <span className="font-mono text-xs text-muted-foreground">
                  top {s.pairs.length} by 24h volume
                </span>
              ) : (
                <span
                  className="font-mono text-xs text-amber-500"
                  title={`${s.label}'s live ranking is unreachable from our network right now, so a curated list of major pairs is shown instead.`}
                >
                  curated majors · live ranking currently unavailable
                </span>
              )}
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
