"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

/**
 * Live Market Pulse: a fully automated snapshot of notable 24h moves computed
 * from Binance public market data — top gainers, top losers and volume leaders
 * among liquid USDT pairs. Refreshes every 5 minutes. No human picks, no
 * predictions: just measured data with a timestamp.
 */

interface PulseRow {
  base: string;
  price: number;
  changePct: number;
  quoteVolume: number;
}

const REFRESH_MS = 5 * 60_000;
// Ignore illiquid pairs so one thin market's pump doesn't top the list.
const MIN_QUOTE_VOLUME = 5_000_000;

function fmtPrice(n: number): string {
  const d = n >= 1000 ? 2 : n >= 1 ? 2 : n >= 0.01 ? 4 : 6;
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function fmtCompact(n: number): string {
  const units: [string, number][] = [["B", 1e9], ["M", 1e6], ["K", 1e3]];
  for (const [s, v] of units) if (n >= v) return (n / v).toFixed(2) + s;
  return n.toFixed(0);
}

const utcFmt = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
  hour12: false,
});

export default function MarketPulse() {
  const [rows, setRows] = useState<PulseRow[] | null>(null);
  const [asOf, setAsOf] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as Array<{
          symbol: string;
          lastPrice: string;
          priceChangePercent: string;
          quoteVolume: string;
        }>;
        if (cancelled || !Array.isArray(data)) return;
        const liquid: PulseRow[] = data
          .filter(
            (d) =>
              d.symbol.endsWith("USDT") &&
              !/(UP|DOWN|BULL|BEAR)USDT$/.test(d.symbol) &&
              parseFloat(d.quoteVolume) >= MIN_QUOTE_VOLUME
          )
          .map((d) => ({
            base: d.symbol.slice(0, -4),
            price: parseFloat(d.lastPrice),
            changePct: parseFloat(d.priceChangePercent),
            quoteVolume: parseFloat(d.quoteVolume),
          }))
          .filter((r) => Number.isFinite(r.price) && Number.isFinite(r.changePct));
        setRows(liquid);
        setAsOf(utcFmt.format(new Date()));
        setFailed(false);
      } catch {
        if (!cancelled) setFailed(true);
      }
    };

    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const gainers = rows
    ? [...rows].sort((a, b) => b.changePct - a.changePct).slice(0, 5)
    : [];
  const losers = rows
    ? [...rows].sort((a, b) => a.changePct - b.changePct).slice(0, 5)
    : [];
  const volume = rows
    ? [...rows].sort((a, b) => b.quoteVolume - a.quoteVolume).slice(0, 5)
    : [];

  const list = (
    title: string,
    Icon: typeof TrendingUp,
    items: PulseRow[],
    accent: string
  ) => (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${accent}`} aria-hidden />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <ul className="mt-3 divide-y divide-border/60">
        {items.length === 0
          ? Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="py-2.5">
                <span className="block h-4 w-full animate-pulse rounded bg-secondary" />
              </li>
            ))
          : items.map((r) => (
              <li key={r.base}>
                <Link
                  href={`/terminal?exchange=binance&base=${r.base}&quote=USDT`}
                  className="flex items-center justify-between gap-2 py-2.5 transition-colors hover:bg-secondary/40"
                >
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {r.base}
                  </span>
                  <span className="flex items-center gap-3 font-mono text-xs tabular-nums">
                    <span className="text-muted-foreground">${fmtPrice(r.price)}</span>
                    <span className="hidden text-muted-foreground sm:inline">
                      ${fmtCompact(r.quoteVolume)}
                    </span>
                    <span
                      className={`w-16 rounded px-1.5 py-0.5 text-right ${
                        r.changePct >= 0
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {r.changePct >= 0 ? "+" : ""}
                      {r.changePct.toFixed(2)}%
                    </span>
                  </span>
                </Link>
              </li>
            ))}
      </ul>
    </div>
  );

  return (
    <section aria-label="Live market pulse">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Live market pulse
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 font-mono text-[11px] text-muted-foreground">
          <span className="ofm-pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {asOf ? `as of ${asOf} UTC` : "loading…"} · auto-refreshes every 5 min
        </span>
      </div>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        A fully automated snapshot of notable 24-hour moves among liquid USDT pairs
        (≥ $5M daily volume) on Binance. Measured data only — no picks, no predictions.
      </p>

      {failed && rows === null ? (
        <p className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-muted-foreground">
          The market data feed can&apos;t be reached from your network right now. Please
          try again shortly, or check prices on an exchange&apos;s official site.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {list("Top gainers (24h)", TrendingUp, gainers, "text-emerald-500")}
          {list("Top losers (24h)", TrendingDown, losers, "text-red-500")}
          {list("Volume leaders (24h)", BarChart3, volume, "text-cyan-500")}
        </div>
      )}

      <p className="mt-3 font-mono text-[11px] text-muted-foreground">
        Source: Binance public market data · 24h rolling window · a big move is not a
        recommendation — see the education below.
      </p>
    </section>
  );
}
