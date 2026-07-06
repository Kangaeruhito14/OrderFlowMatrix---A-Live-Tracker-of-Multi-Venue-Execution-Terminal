"use client";

import { useEffect, useState } from "react";

/**
 * Live scrolling ticker tape (CMC/Binance-style) fed by Binance's free public
 * 24h ticker endpoint. Polls every 15s; CSS marquee loops seamlessly and
 * pauses on hover.
 */

const TAPE_SYMBOLS = [
  "BTC", "ETH", "SOL", "BNB", "XRP", "DOGE",
  "ADA", "AVAX", "LINK", "DOT", "TRX", "LTC",
] as const;

interface TapeItem {
  base: string;
  price: number;
  changePct: number;
}

const POLL_MS = 15_000;

function fmtPrice(n: number): string {
  const d = n >= 1000 ? 2 : n >= 1 ? 2 : n >= 0.01 ? 4 : 6;
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

export default function TickerTape() {
  const [items, setItems] = useState<TapeItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const symbols = JSON.stringify(TAPE_SYMBOLS.map((s) => `${s}USDT`));
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbols)}`;

    const load = async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const data = (await res.json()) as Array<{
          symbol: string;
          lastPrice: string;
          priceChangePercent: string;
        }>;
        if (cancelled || !Array.isArray(data)) return;
        const byBase = new Map(data.map((d) => [d.symbol.replace(/USDT$/, ""), d]));
        setItems(
          TAPE_SYMBOLS.flatMap((base) => {
            const d = byBase.get(base);
            if (!d) return [];
            return [{
              base,
              price: parseFloat(d.lastPrice),
              changePct: parseFloat(d.priceChangePercent),
            }];
          })
        );
      } catch {
        /* keep the previous tape on transient errors */
      }
    };

    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const list = items ?? TAPE_SYMBOLS.map((base) => ({ base, price: NaN, changePct: NaN }));

  const cell = (item: TapeItem, key: string) => {
    const up = item.changePct >= 0;
    return (
      <span key={key} className="flex shrink-0 items-center gap-2 px-5 py-2">
        <span className="font-mono text-xs font-semibold text-foreground">{item.base}</span>
        <span className="font-mono text-xs text-muted-foreground">
          {Number.isFinite(item.price) ? `$${fmtPrice(item.price)}` : "—"}
        </span>
        {Number.isFinite(item.changePct) ? (
          <span className={`font-mono text-[11px] ${up ? "text-emerald-500" : "text-red-500"}`}>
            {up ? "▲" : "▼"} {Math.abs(item.changePct).toFixed(2)}%
          </span>
        ) : null}
      </span>
    );
  };

  return (
    <div className="ofm-marquee overflow-hidden border-b border-border bg-card/60" aria-hidden>
      <div className="ofm-marquee-track">
        {list.map((i) => cell(i, `a-${i.base}`))}
        {list.map((i) => cell(i, `b-${i.base}`))}
      </div>
    </div>
  );
}
