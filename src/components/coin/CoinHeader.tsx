import type { ExchangeId } from "@/components/order-flow/adapters";
import type { MultiStreamStats } from "@/components/order-flow/useMultiExchangeStream";
import { getDigitsFor } from "@/components/order-flow/adapters";
import { fmtPrice, fmtInt, fmtNotional } from "@/components/order-flow/format";
import { VENUES, VENUE_IDS } from "@/lib/venues";
import { coinMeta } from "@/lib/coins";

interface Props {
  exchange: ExchangeId;
  base: string;
  quote: string;
  stats: MultiStreamStats;
  onSelectExchange: (e: ExchangeId) => void;
}

/** CMC-style coin header: identity, live price, session stats, venue picker. */
export default function CoinHeader({ exchange, base, quote, stats, onSelectExchange }: Props) {
  const coin = coinMeta(base);
  const digits = getDigitsFor(base).priceDigits;

  const price = stats.lastPrice;
  const dir =
    stats.lastPrice !== null && stats.prevPrice !== null
      ? stats.lastPrice >= stats.prevPrice
      : true;
  const sessionPct =
    stats.lastPrice !== null && stats.sessionOpen !== null && stats.sessionOpen > 0
      ? ((stats.lastPrice - stats.sessionOpen) / stats.sessionOpen) * 100
      : null;

  const status = stats.health.status;
  const statusMeta =
    status === "connected"
      ? { label: "Live · WebSocket", cls: "bg-emerald-500/10 text-emerald-500", dot: "bg-emerald-500" }
      : status === "fallback"
        ? { label: "Live · REST fallback", cls: "bg-amber-500/10 text-amber-500", dot: "bg-amber-400" }
        : status === "disconnected"
          ? { label: "No data", cls: "bg-red-500/10 text-red-500", dot: "bg-red-500" }
          : { label: "Connecting…", cls: "bg-secondary text-muted-foreground", dot: "bg-muted-foreground" };

  const pills: Array<{ label: string; value: string; cls?: string }> = [
    { label: "Session high", value: fmtPrice(stats.sessionHigh, digits) },
    { label: "Session low", value: fmtPrice(stats.sessionLow, digits) },
    { label: "VWAP (30s)", value: fmtPrice(stats.vwap, digits) },
    { label: "Trades (session)", value: fmtInt(stats.totalTrades) },
    {
      label: "CVD (session)",
      value: fmtNotional(stats.sessionCvdNotional),
      cls: stats.sessionCvdNotional >= 0 ? "text-emerald-500" : "text-red-500",
    },
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-5">
        {/* identity + price */}
        <div className="flex items-start gap-4">
          <span
            aria-hidden
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold text-white"
            style={{ backgroundColor: coin.color }}
          >
            {base.slice(0, 3)}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">{coin.name}</h1>
              <span className="font-mono text-sm text-muted-foreground">
                {base}/{quote}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[11px] ${statusMeta.cls}`}
              >
                <span className={`ofm-pulse-dot h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
                {statusMeta.label}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
              <span
                key={price ?? "none"}
                className={`ofm-price-pop font-mono text-4xl font-bold tabular-nums ${
                  dir ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {price !== null ? `$${fmtPrice(price, digits)}` : "· · · ·"}
              </span>
              {sessionPct !== null ? (
                <span
                  className={`rounded-md px-1.5 py-0.5 font-mono text-sm tabular-nums ${
                    sessionPct >= 0
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-red-500/10 text-red-500"
                  }`}
                  title="Change since this session's first trade"
                >
                  {sessionPct >= 0 ? "▲" : "▼"} {Math.abs(sessionPct).toFixed(2)}% session
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* venue picker */}
        <div>
          <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Venue
          </div>
          <div className="flex flex-wrap gap-1.5">
            {VENUE_IDS.map((id) => {
              const v = VENUES[id];
              const active = id === exchange;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelectExchange(id)}
                  aria-pressed={active}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors ${
                    active
                      ? "border-emerald-500/60 bg-emerald-500/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-emerald-500/30 hover:text-foreground"
                  }`}
                >
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: v.color }}
                  />
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* session stat pills */}
      <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3 lg:grid-cols-5">
        {pills.map((p) => (
          <div key={p.label} className="bg-card px-4 py-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {p.label}
            </div>
            <div className={`mt-0.5 font-mono text-sm tabular-nums ${p.cls ?? "text-foreground"}`}>
              {p.value}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
