import type { MultiStreamStats } from "@/components/order-flow/useMultiExchangeStream";
import { fmtNotional, fmtQty, fmtInt } from "@/components/order-flow/format";

/** Order-flow analytics for the last 30s window: pressure, CVD, sizes. */
export default function FlowStatsCard({ stats }: { stats: MultiStreamStats }) {
  const totalVol = stats.windowBuyVolume + stats.windowSellVolume;
  const buyShare = totalVol > 0 ? (stats.windowBuyVolume / totalVol) * 100 : 50;

  const rows: Array<{ label: string; value: string; cls?: string }> = [
    {
      label: "CVD (30s)",
      value: fmtNotional(stats.windowCvdNotional),
      cls: stats.windowCvdNotional >= 0 ? "text-emerald-500" : "text-red-500",
    },
    { label: "Trades (30s)", value: fmtInt(stats.windowTradeCount) },
    { label: "Avg trade size", value: fmtQty(stats.avgTradeSize, 5) },
    {
      label: "Largest trade (30s)",
      value: stats.largestTrade ? `$${fmtNotional(stats.largestTrade.notional)}` : "—",
    },
    { label: "Blocks (session)", value: fmtInt(stats.blockTradeCount) },
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground">Order flow (30s)</h2>
      <p className="font-mono text-[11px] text-muted-foreground">
        aggressive buys vs sells in the rolling window
      </p>

      {/* pressure bar */}
      <div className="mt-4">
        <div className="flex justify-between font-mono text-[11px]">
          <span className="text-emerald-500">buy {buyShare.toFixed(0)}%</span>
          <span className="text-red-500">{(100 - buyShare).toFixed(0)}% sell</span>
        </div>
        <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-secondary">
          <span
            className="bg-emerald-500 transition-all duration-500"
            style={{ width: `${buyShare}%` }}
          />
          <span
            className="bg-red-500 transition-all duration-500"
            style={{ width: `${100 - buyShare}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[10px] text-muted-foreground">
          <span>{fmtQty(stats.windowBuyVolume, 4)}</span>
          <span>{fmtQty(stats.windowSellVolume, 4)}</span>
        </div>
      </div>

      <dl className="mt-4 divide-y divide-border border-t border-border">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between py-2">
            <dt className="text-xs text-muted-foreground">{r.label}</dt>
            <dd className={`font-mono text-xs tabular-nums ${r.cls ?? "text-foreground"}`}>
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
