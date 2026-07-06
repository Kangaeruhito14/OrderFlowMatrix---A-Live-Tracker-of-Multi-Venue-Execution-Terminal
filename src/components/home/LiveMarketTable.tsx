"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * CoinMarketCap-style live market table: real prices polling every 10s from
 * Binance's free public API, 48h sparklines from klines, price-change flash,
 * and a one-click jump into the terminal for any row.
 */

const COINS = [
  { base: "BTC", name: "Bitcoin", color: "#f7931a" },
  { base: "ETH", name: "Ethereum", color: "#627eea" },
  { base: "SOL", name: "Solana", color: "#9945ff" },
  { base: "BNB", name: "BNB", color: "#f0b90b" },
  { base: "XRP", name: "XRP", color: "#00a5df" },
  { base: "DOGE", name: "Dogecoin", color: "#c2a633" },
  { base: "ADA", name: "Cardano", color: "#0033ad" },
  { base: "AVAX", name: "Avalanche", color: "#e84142" },
  { base: "LINK", name: "Chainlink", color: "#2a5ada" },
  { base: "LTC", name: "Litecoin", color: "#345d9d" },
] as const;

const POLL_MS = 10_000;

interface Row {
  price: number;
  changePct: number;
  quoteVolume: number;
}

function fmtPrice(n: number): string {
  const d = n >= 1000 ? 2 : n >= 1 ? 2 : n >= 0.01 ? 4 : 6;
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function fmtCompact(n: number): string {
  const units: [string, number][] = [["B", 1e9], ["M", 1e6], ["K", 1e3]];
  for (const [s, v] of units) if (n >= v) return (n / v).toFixed(2) + s;
  return n.toFixed(0);
}

function Sparkline({ points, up }: { points: number[]; up: boolean }) {
  if (points.length < 2) return <span className="text-xs text-muted-foreground">—</span>;
  const w = 120;
  const h = 36;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = w / (points.length - 1);
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(h - ((p - min) / span) * (h - 4) - 2).toFixed(1)}`)
    .join(" ");
  const color = up ? "#10b981" : "#ef4444";
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d={`${d} L${w},${h} L0,${h} Z`} fill={color} opacity="0.09" stroke="none" />
    </svg>
  );
}

export default function LiveMarketTable() {
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [sparks, setSparks] = useState<Record<string, number[]>>({});

  // Live ticker poll (price / 24h change / volume)
  useEffect(() => {
    let cancelled = false;
    const symbols = JSON.stringify(COINS.map((c) => `${c.base}USDT`));
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbols)}`;

    const load = async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const data = (await res.json()) as Array<{
          symbol: string; lastPrice: string; priceChangePercent: string; quoteVolume: string;
        }>;
        if (cancelled || !Array.isArray(data)) return;
        const next: Record<string, Row> = {};
        for (const d of data) {
          next[d.symbol.replace(/USDT$/, "")] = {
            price: parseFloat(d.lastPrice),
            changePct: parseFloat(d.priceChangePercent),
            quoteVolume: parseFloat(d.quoteVolume),
          };
        }
        setRows(next);
      } catch {
        /* keep previous data on transient errors */
      }
    };

    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // 48h sparklines (one fetch per coin, on mount only)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = await Promise.allSettled(
        COINS.map(async (c) => {
          const res = await fetch(
            `https://api.binance.com/api/v3/klines?symbol=${c.base}USDT&interval=1h&limit=48`
          );
          if (!res.ok) throw new Error("klines failed");
          const data = (await res.json()) as Array<[number, string, string, string, string]>;
          return [c.base, data.map((k) => parseFloat(k[4]))] as const;
        })
      );
      if (cancelled) return;
      const next: Record<string, number[]> = {};
      for (const r of results) if (r.status === "fulfilled") next[r.value[0]] = [...r.value[1]];
      setSparks(next);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3 text-left font-medium">#</th>
            <th className="px-4 py-3 text-left font-medium">Market</th>
            <th className="px-4 py-3 text-right font-medium">Price</th>
            <th className="px-4 py-3 text-right font-medium">24h</th>
            <th className="hidden px-4 py-3 text-right font-medium md:table-cell">24h Volume</th>
            <th className="hidden px-4 py-3 text-right font-medium lg:table-cell">48h Trend</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {COINS.map((c, i) => {
            const r = rows[c.base];
            const spark = sparks[c.base] ?? [];
            const up = r ? r.changePct >= 0 : true;
            const sparkUp = spark.length > 1 ? spark[spark.length - 1] >= spark[0] : up;
            return (
              <tr
                key={c.base}
                className="border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/50"
              >
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{i + 1}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2.5">
                    <span
                      aria-hidden
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold text-white"
                      style={{ backgroundColor: c.color }}
                    >
                      {c.base.slice(0, 3)}
                    </span>
                    <span className="font-medium text-foreground">{c.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{c.base}</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {r ? (
                    <span key={r.price} className="ofm-price-pop font-mono tabular-nums text-foreground">
                      ${fmtPrice(r.price)}
                    </span>
                  ) : (
                    <span className="inline-block h-4 w-20 animate-pulse rounded bg-secondary" />
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {r ? (
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-xs tabular-nums ${
                        up
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {up ? "▲" : "▼"} {Math.abs(r.changePct).toFixed(2)}%
                    </span>
                  ) : (
                    <span className="inline-block h-4 w-14 animate-pulse rounded bg-secondary" />
                  )}
                </td>
                <td className="hidden px-4 py-3 text-right font-mono text-xs tabular-nums text-muted-foreground md:table-cell">
                  {r ? `$${fmtCompact(r.quoteVolume)}` : "—"}
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  <span className="flex justify-end">
                    <Sparkline points={spark} up={sparkUp} />
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/terminal?exchange=binance&base=${c.base}&quote=USDT`}
                    className="rounded-md border border-border px-2.5 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-emerald-500/60 hover:text-emerald-500"
                  >
                    Trade flow →
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-border px-4 py-2 font-mono text-[11px] text-muted-foreground">
        Live from Binance public market data · prices refresh every 10s · sparklines show 48h closes
      </p>
    </div>
  );
}
