"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * Hero showpiece: a real, live BTC/USDT trade feed streaming over Binance's
 * public WebSocket — the product demonstrating itself on the landing page.
 * Incoming trades are buffered and flushed every 350ms so high-frequency
 * bursts never cause render storms.
 */

interface MiniTrade {
  id: string;
  price: number;
  qty: number;
  time: number;
  side: "buy" | "sell";
}

const MAX_ROWS = 7;
const FLUSH_MS = 350;

function fmtPrice(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtTime(t: number): string {
  const d = new Date(t);
  return d.toLocaleTimeString("en-US", { hour12: false });
}

export default function HeroLiveTrades() {
  const [trades, setTrades] = useState<MiniTrade[]>([]);
  const [status, setStatus] = useState<"connecting" | "live" | "offline">("connecting");
  const bufferRef = useRef<MiniTrade[]>([]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let flushTimer: ReturnType<typeof setInterval> | null = null;
    let failTimer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    try {
      ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@trade");
      ws.onopen = () => {
        if (!closed) setStatus("live");
      };
      ws.onerror = () => {
        if (!closed) setStatus("offline");
      };
      ws.onclose = () => {
        if (!closed) setStatus("offline");
      };
      ws.onmessage = (ev) => {
        try {
          const d = JSON.parse(ev.data as string) as {
            t?: number; p?: string; q?: string; T?: number; m?: boolean;
          };
          if (d.p == null || d.q == null || d.m == null) return;
          bufferRef.current.push({
            id: String(d.t ?? `${d.T}-${d.p}`),
            price: parseFloat(d.p),
            qty: parseFloat(d.q),
            time: d.T ?? Date.now(),
            side: d.m ? "sell" : "buy",
          });
        } catch {
          /* ignore malformed frames */
        }
      };

      flushTimer = setInterval(() => {
        if (bufferRef.current.length === 0) return;
        const incoming = bufferRef.current;
        bufferRef.current = [];
        setTrades((prev) => [...incoming.reverse(), ...prev].slice(0, MAX_ROWS));
      }, FLUSH_MS);
    } catch {
      // WebSocket constructor threw synchronously (blocked/unsupported):
      // defer the state update out of the effect body.
      failTimer = setTimeout(() => {
        if (!closed) setStatus("offline");
      }, 0);
    }

    return () => {
      closed = true;
      if (flushTimer) clearInterval(flushTimer);
      if (failTimer) clearTimeout(failTimer);
      try {
        ws?.close();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const last = trades[0];
  const prev = trades[1];
  const dir = last && prev ? (last.price >= prev.price ? "up" : "down") : "up";

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card/80 shadow-xl shadow-emerald-500/5 backdrop-blur">
      {/* header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`ofm-pulse-dot h-2 w-2 rounded-full ${
              status === "live" ? "bg-emerald-500" : status === "connecting" ? "bg-amber-400" : "bg-red-500"
            }`}
          />
          <span className="font-mono text-xs font-semibold text-foreground">BTC/USDT</span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Binance · {status === "live" ? "streaming" : status}
          </span>
        </div>
        <Link
          href="/terminal"
          className="font-mono text-[11px] text-emerald-500 underline-offset-4 hover:underline"
        >
          full terminal →
        </Link>
      </div>

      {/* live price */}
      <div className="px-4 pt-3">
        <span
          key={last?.id ?? "none"}
          className={`ofm-price-pop font-mono text-3xl font-bold tabular-nums ${
            dir === "up" ? "text-emerald-500" : "text-red-500"
          }`}
        >
          {last ? `$${fmtPrice(last.price)}` : "· · ·"}
        </span>
      </div>

      {/* trades */}
      <div className="px-2 pb-3 pt-2">
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-2 pb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>Time</span>
          <span className="text-right">Price</span>
          <span className="text-right">Size</span>
        </div>
        {trades.length === 0 ? (
          <div className="px-2 py-6 text-center font-mono text-xs text-muted-foreground">
            {status === "offline"
              ? "Stream unavailable — open the terminal for the REST fallback."
              : "connecting to live feed…"}
          </div>
        ) : (
          <ul>
            {trades.map((t) => (
              <li
                key={t.id}
                className="ofm-row-in grid grid-cols-[1fr_auto_auto] gap-x-4 rounded px-2 py-[3px] font-mono text-xs tabular-nums"
              >
                <span className="text-muted-foreground">{fmtTime(t.time)}</span>
                <span className={`text-right ${t.side === "buy" ? "text-emerald-500" : "text-red-500"}`}>
                  {fmtPrice(t.price)}
                </span>
                <span className="text-right text-muted-foreground">{t.qty.toFixed(4)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
