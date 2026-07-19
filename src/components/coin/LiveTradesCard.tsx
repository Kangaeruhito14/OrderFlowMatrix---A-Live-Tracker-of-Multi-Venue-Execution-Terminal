import type { MultiStreamStats } from "@/components/order-flow/useMultiExchangeStream";
import { getDigitsFor } from "@/components/order-flow/adapters";
import { fmtPrice, fmtQty, fmtNotional } from "@/components/order-flow/format";

const MAX_ROWS = 30;

function fmtClock(t: number): string {
  return new Date(t).toLocaleTimeString("en-US", { hour12: false });
}

/** Live trade tape for the selected market — newest first, flash on arrival. */
export default function LiveTradesCard({
  stats,
  base,
}: {
  stats: MultiStreamStats;
  base: string;
}) {
  const digits = getDigitsFor(base).priceDigits;
  const trades = stats.trades.slice(0, MAX_ROWS);
  const blockThreshold = stats.blockThreshold;

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Live trades</h2>
          <p className="font-mono text-[11px] text-muted-foreground">
            aggressor side inferred · rows above ${fmtNotional(blockThreshold)} notional are
            flagged as blocks
          </p>
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">
          {stats.messageRate.toFixed(1)} msg/s
        </span>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse">
          <thead>
            <tr className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-2 py-2 text-left font-medium">Time</th>
              <th className="px-2 py-2 text-left font-medium">Side</th>
              <th className="px-2 py-2 text-right font-medium">Price</th>
              <th className="px-2 py-2 text-right font-medium">Size ({base})</th>
              <th className="px-2 py-2 text-right font-medium">Notional</th>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-2 py-10 text-center font-mono text-xs text-muted-foreground">
                  waiting for trades…
                </td>
              </tr>
            ) : (
              trades.map((t) => {
                const buy = t.side === "BUY";
                const isBlock = t.notional >= blockThreshold;
                return (
                  <tr
                    key={`${t.exchange}-${t.id}-${t.time}`}
                    className="ofm-row-in border-b border-border/50 font-mono text-xs tabular-nums last:border-0"
                  >
                    <td className="px-2 py-[5px] text-muted-foreground">{fmtClock(t.time)}</td>
                    <td className="px-2 py-[5px]">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          buy ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {buy ? "BUY" : "SELL"}
                      </span>
                      {isBlock ? (
                        <span
                          className="ml-1.5 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-500"
                          title="Notional above the block threshold for this market"
                        >
                          BLOCK
                        </span>
                      ) : null}
                    </td>
                    <td className={`px-2 py-[5px] text-right ${buy ? "text-emerald-500" : "text-red-500"}`}>
                      {fmtPrice(t.price, digits)}
                    </td>
                    <td className="px-2 py-[5px] text-right text-muted-foreground">
                      {fmtQty(t.qty, 4)}
                    </td>
                    <td className="px-2 py-[5px] text-right text-foreground">
                      ${fmtNotional(t.notional)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
