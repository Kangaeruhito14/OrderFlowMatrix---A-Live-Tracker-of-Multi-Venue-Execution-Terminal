'use client'

import type { MultiStreamStats } from './useMultiExchangeStream'
import { fmtNotional } from './format'

interface Props {
  stats: MultiStreamStats
}

/** Bucket definition: label, min (inclusive), max (exclusive, except last) */
const BUCKETS = [
  { label: '< $1k',        tag: 'micro',          min: 0,       max: 1_000 },
  { label: '$1k–$10k',     tag: 'retail',          min: 1_000,  max: 10_000 },
  { label: '$10k–$50k',    tag: 'whale',           min: 10_000, max: 50_000 },
  { label: '$50k–$100k',   tag: 'block',           min: 50_000, max: 100_000 },
  { label: '$100k–$500k',  tag: 'mega',            min: 100_000, max: 500_000 },
  { label: '≥ $500k',      tag: 'institutional',   min: 500_000, max: Infinity },
] as const

interface BucketCount {
  label: string
  tag: string
  buy: number
  sell: number
  total: number
}

function computeBuckets(trades: MultiStreamStats['trades']): BucketCount[] {
  const counts = BUCKETS.map((b) => ({
    label: b.label,
    tag: b.tag,
    buy: 0,
    sell: 0,
    total: 0,
  }))

  for (const t of trades) {
    for (let i = 0; i < BUCKETS.length; i++) {
      const b = BUCKETS[i]
      if (t.notional >= b.min && t.notional < b.max) {
        counts[i].total += 1
        if (t.side === 'BUY') {
          counts[i].buy += 1
        } else {
          counts[i].sell += 1
        }
        break
      }
    }
  }

  return counts
}

export default function TradeSizeDistribution({ stats }: Props) {
  const { trades, windowTradeCount, windowBuyNotional, windowSellNotional } = stats

  const buckets = computeBuckets(trades)

  // max total across buckets (for proportional bar widths)
  const maxTotal = Math.max(1, ...buckets.map((b) => b.total))

  // summary stats
  const totalTradesInWindow = windowTradeCount
  const totalNotional = windowBuyNotional + windowSellNotional
  const weightedAvgNotional = totalTradesInWindow > 0
    ? totalNotional / totalTradesInWindow
    : 0

  // whale+ volume: trades in buckets with notional >= $10k
  let whalePlusNotional = 0
  let totalNotionalFromTrades = 0
  for (const t of trades) {
    totalNotionalFromTrades += t.notional
    if (t.notional >= 10_000) {
      whalePlusNotional += t.notional
    }
  }
  const whalePlusPct = totalNotionalFromTrades > 0
    ? (whalePlusNotional / totalNotionalFromTrades) * 100
    : 0

  // SVG layout constants
  const ROW_HEIGHT = 22
  const LABEL_WIDTH = 90
  const BAR_START_X = LABEL_WIDTH + 8
  const COUNT_WIDTH = 40
  const BAR_MAX_WIDTH = 200
  const SVG_WIDTH = LABEL_WIDTH + 8 + BAR_MAX_WIDTH + 8 + COUNT_WIDTH
  const SVG_HEIGHT = buckets.length * ROW_HEIGHT
  const viewBox = `0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`

  return (
    <section className="of-panel of-size-dist">
      <span className="of-corner tl" />
      <span className="of-corner tr" />
      <div className="of-panel-head">
        <div className="of-panel-title">
          <span className="of-tag">Size Distribution</span>
          <span>· Trade Histogram</span>
        </div>
        <div className="of-panel-meta">30s window</div>
      </div>
      <div className="of-panel-body">
        <svg
          className="of-size-dist-chart"
          viewBox={viewBox}
          width="100%"
          preserveAspectRatio="xMidYMid meet"
        >
          {buckets.map((b, i) => {
            const y = i * ROW_HEIGHT
            const barWidth = maxTotal > 0 ? (b.total / maxTotal) * BAR_MAX_WIDTH : 0
            const buyWidth = b.total > 0 ? (b.buy / b.total) * barWidth : 0
            const sellWidth = barWidth - buyWidth
            const textY = y + ROW_HEIGHT / 2 + 4 // vertical centering for text

            return (
              <g key={b.tag}>
                {/* bucket label */}
                <text
                  x={LABEL_WIDTH}
                  y={textY}
                  textAnchor="end"
                  className="of-size-dist-label"
                >
                  {b.label}
                </text>

                {/* buy portion */}
                {buyWidth > 0 && (
                  <rect
                    x={BAR_START_X}
                    y={y + 3}
                    width={buyWidth}
                    height={ROW_HEIGHT - 6}
                    rx={2}
                    className="of-size-dist-bar-buy"
                  />
                )}

                {/* sell portion */}
                {sellWidth > 0 && (
                  <rect
                    x={BAR_START_X + buyWidth}
                    y={y + 3}
                    width={sellWidth}
                    height={ROW_HEIGHT - 6}
                    rx={2}
                    className="of-size-dist-bar-sell"
                  />
                )}

                {/* count label */}
                <text
                  x={BAR_START_X + BAR_MAX_WIDTH + 8}
                  y={textY}
                  textAnchor="start"
                  className="of-size-dist-count"
                >
                  {b.total > 0 ? b.total : '—'}
                </text>

                {/* buy/sell breakdown on hover (always visible as subtle text) */}
                {b.total > 0 && (
                  <text
                    x={BAR_START_X + BAR_MAX_WIDTH + 8}
                    y={textY + 10}
                    textAnchor="start"
                    className="of-size-dist-breakdown"
                  >
                    {b.buy}/{b.sell}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        {/* summary strip */}
        <div className="of-size-dist-summary">
          <div className="of-size-dist-stat">
            <span className="of-size-dist-stat-label">Trades</span>
            <span className="of-size-dist-stat-val">{totalTradesInWindow}</span>
          </div>
          <div className="of-size-dist-stat">
            <span className="of-size-dist-stat-label">Avg Size</span>
            <span className="of-size-dist-stat-val">{fmtNotional(weightedAvgNotional)}</span>
          </div>
          <div className="of-size-dist-stat">
            <span className="of-size-dist-stat-label">Whale+</span>
            <span className="of-size-dist-stat-val of-size-dist-whale-pct">
              {whalePlusPct.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
