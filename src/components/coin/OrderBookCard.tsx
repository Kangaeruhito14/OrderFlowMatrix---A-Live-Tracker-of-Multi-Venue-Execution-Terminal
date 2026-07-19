import type { ExchangeId } from "@/components/order-flow/adapters";
import type { DepthStats } from "@/components/order-flow/useBinanceDepthStream";
import { getDigitsFor } from "@/components/order-flow/adapters";
import { fmtPrice, fmtQty, fmtBps } from "@/components/order-flow/format";

const LEVELS = 10;

/** Live order book: top asks over spread over top bids, with depth bars. */
export default function OrderBookCard({
  depth,
  exchange,
  base,
}: {
  depth: DepthStats;
  exchange: ExchangeId;
  base: string;
}) {
  const digits = getDigitsFor(base).priceDigits;
  const book = depth.book;
  const asks = (book?.asks ?? []).slice(0, LEVELS);
  const bids = (book?.bids ?? []).slice(0, LEVELS);
  const maxQty = Math.max(1e-9, ...asks.map((l) => l.qty), ...bids.map((l) => l.qty));

  const row = (price: number, qty: number, side: "bid" | "ask") => (
    <div key={`${side}-${price}`} className="relative grid grid-cols-2 gap-2 px-3 py-[3px]">
      <span
        aria-hidden
        className={`absolute inset-y-0 right-0 ${side === "bid" ? "bg-emerald-500/10" : "bg-red-500/10"}`}
        style={{ width: `${Math.min(100, (qty / maxQty) * 100)}%` }}
      />
      <span
        className={`relative font-mono text-xs tabular-nums ${
          side === "bid" ? "text-emerald-500" : "text-red-500"
        }`}
      >
        {fmtPrice(price, digits)}
      </span>
      <span className="relative text-right font-mono text-xs tabular-nums text-muted-foreground">
        {fmtQty(qty, 4)}
      </span>
    </div>
  );

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground">Order book</h2>
      <p className="font-mono text-[11px] text-muted-foreground">
        top {LEVELS} levels{exchange !== "binance" ? " · Binance reference feed" : ""}
      </p>

      {book === null ? (
        <div className="flex h-48 items-center justify-center font-mono text-xs text-muted-foreground">
          {depth.status === "disconnected" ? "Book unavailable." : "loading book…"}
        </div>
      ) : (
        <div className="mt-3 overflow-hidden rounded-lg border border-border">
          <div className="grid grid-cols-2 gap-2 border-b border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>Price</span>
            <span className="text-right">Size ({base})</span>
          </div>
          <div className="flex flex-col-reverse">{asks.map((l) => row(l.price, l.qty, "ask"))}</div>
          <div className="flex items-center justify-between border-y border-border bg-secondary/50 px-3 py-1.5 font-mono text-[11px]">
            <span className="text-muted-foreground">spread</span>
            <span className="tabular-nums text-foreground">
              {depth.spread !== null ? fmtPrice(depth.spread, digits) : "—"}{" "}
              <span className="text-muted-foreground">({fmtBps(depth.spreadBps)})</span>
            </span>
          </div>
          <div>{bids.map((l) => row(l.price, l.qty, "bid"))}</div>
        </div>
      )}
    </section>
  );
}
