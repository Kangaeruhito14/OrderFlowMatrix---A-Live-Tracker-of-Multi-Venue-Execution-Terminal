import { useMemo } from "react";
import type { ExchangeId } from "@/components/order-flow/adapters";
import type { KlineStats } from "@/components/order-flow/useBinanceKlineStream";
import { KLINE_INTERVALS, type KlineInterval } from "@/components/order-flow/symbols";
import { getDigitsFor } from "@/components/order-flow/adapters";
import { fmtPrice } from "@/components/order-flow/format";

interface Props {
  kline: KlineStats;
  interval: KlineInterval;
  onIntervalChange: (i: KlineInterval) => void;
  exchange: ExchangeId;
  base: string;
  quote: string;
}

const W = 860;
const H = 320;
const VOL_H = 56;
const PAD_R = 64;
const PAD_T = 12;

/** Clean SVG candlestick chart with volume, sized to the kline buffer. */
export default function PriceCandles({
  kline,
  interval,
  onIntervalChange,
  exchange,
  base,
  quote,
}: Props) {
  const digits = getDigitsFor(base).priceDigits;
  const candles = kline.candles;

  const geom = useMemo(() => {
    if (candles.length < 2) return null;
    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;
    for (const c of candles) {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.volume > maxVol) maxVol = c.volume;
    }
    if (!(max > min)) return null;
    const chartH = H - VOL_H - PAD_T - 8;
    const y = (p: number) => PAD_T + ((max - p) / (max - min)) * chartH;
    const vy = (v: number) => (maxVol > 0 ? (v / maxVol) * (VOL_H - 6) : 0);
    const step = (W - PAD_R) / candles.length;
    const bw = Math.max(2, Math.min(14, step * 0.62));
    // horizontal gridlines at 4 price levels
    const grid = [0.25, 0.5, 0.75].map((f) => min + (max - min) * f);
    return { min, max, y, vy, step, bw, grid, chartH };
  }, [candles]);

  const last = kline.lastClose;
  const lastUp =
    kline.lastClose !== null && kline.prevClose !== null
      ? kline.lastClose >= kline.prevClose
      : true;

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Price</h2>
          <p className="font-mono text-[11px] text-muted-foreground">
            {base}/{quote} · {interval} candles
            {exchange !== "binance" ? " · Binance reference feed" : ""}
          </p>
        </div>
        <div className="flex gap-1" role="tablist" aria-label="Candle interval">
          {KLINE_INTERVALS.map((i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === interval}
              onClick={() => onIntervalChange(i)}
              className={`rounded-md px-2.5 py-1 font-mono text-xs transition-colors ${
                i === interval
                  ? "bg-emerald-500/15 text-emerald-500"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {geom === null ? (
          <div className="flex h-64 items-center justify-center font-mono text-xs text-muted-foreground">
            {kline.backfillStatus === "error" ? "Chart data unavailable." : "loading candles…"}
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full"
            role="img"
            aria-label={`${base}/${quote} candlestick chart`}
          >
            {/* gridlines + price labels */}
            {geom.grid.map((p) => (
              <g key={p}>
                <line
                  x1={0}
                  x2={W - PAD_R}
                  y1={geom.y(p)}
                  y2={geom.y(p)}
                  stroke="currentColor"
                  className="text-border"
                  strokeDasharray="3 5"
                  strokeWidth="1"
                />
                <text
                  x={W - PAD_R + 6}
                  y={geom.y(p) + 3.5}
                  className="fill-current text-muted-foreground"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {fmtPrice(p, digits)}
                </text>
              </g>
            ))}

            {/* last-price line */}
            {last !== null ? (
              <g>
                <line
                  x1={0}
                  x2={W - PAD_R}
                  y1={geom.y(last)}
                  y2={geom.y(last)}
                  stroke={lastUp ? "#10b981" : "#ef4444"}
                  strokeWidth="1"
                  strokeDasharray="2 3"
                  opacity="0.7"
                />
                <text
                  x={W - PAD_R + 6}
                  y={geom.y(last) + 3.5}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  fill={lastUp ? "#10b981" : "#ef4444"}
                >
                  {fmtPrice(last, digits)}
                </text>
              </g>
            ) : null}

            {/* candles + volume */}
            {candles.map((c, i) => {
              const x = i * geom.step + geom.step / 2;
              const up = c.close >= c.open;
              const color = up ? "#10b981" : "#ef4444";
              const bodyTop = geom.y(Math.max(c.open, c.close));
              const bodyH = Math.max(1, Math.abs(geom.y(c.open) - geom.y(c.close)));
              return (
                <g key={c.openTime}>
                  <line x1={x} x2={x} y1={geom.y(c.high)} y2={geom.y(c.low)} stroke={color} strokeWidth="1" />
                  <rect
                    x={x - geom.bw / 2}
                    y={bodyTop}
                    width={geom.bw}
                    height={bodyH}
                    fill={color}
                    opacity={c.closed ? 1 : 0.75}
                    rx="1"
                  />
                  <rect
                    x={x - geom.bw / 2}
                    y={H - geom.vy(c.volume) - 2}
                    width={geom.bw}
                    height={geom.vy(c.volume)}
                    fill={color}
                    opacity="0.28"
                    rx="1"
                  />
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </section>
  );
}
