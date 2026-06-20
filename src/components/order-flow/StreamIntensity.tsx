'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { MultiStreamStats } from './useMultiExchangeStream'
import { fmtQty, fmtNotional, fmtBps, fmtPrice } from './format'
import { useSymbolConfig } from './SymbolContext'

interface Props {
  stats: MultiStreamStats
}

const TICK_COUNT = 28

export default function StreamIntensity({ stats }: Props) {
  const cfg = useSymbolConfig()
  // rolling tick strip — sample trade count per ~250ms bucket
  const [ticks, setTicks] = useState<number[]>(() => new Array(TICK_COUNT).fill(0))
  const lastCountRef = useRef(0)
  const lastSampleRef = useRef(Date.now())

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now()
      const delta = now - lastSampleRef.current
      // trade count delta over this interval, normalized to per-250ms
      const cur = stats.totalTrades
      const diff = Math.max(0, cur - lastCountRef.current)
      lastCountRef.current = cur
      lastSampleRef.current = now
      const normalized = diff * (250 / Math.max(120, delta))
      setTicks((prev) => {
        const next = prev.slice(1)
        next.push(Math.min(1, normalized / 12)) // scale heuristic
        return next
      })
    }, 250)
    return () => clearInterval(id)
  }, [stats.totalTrades])

  const {
    windowBuyVolume,
    windowSellVolume,
    windowBuyCount,
    windowSellCount,
    windowTradeCount,
    avgTradeSize,
    vwap,
    spreadBps,
    minPriceInWindow,
    maxPriceInWindow,
    lastPrice,
  } = stats

  const totalVol = windowBuyVolume + windowSellVolume
  const buyShare = totalVol > 0 ? (windowBuyVolume / totalVol) * 100 : 50
  const sellShare = 100 - buyShare

  // micro move marker (session open -> last, clamped to +-0.5%)
  const movePct =
    lastPrice !== null && minPriceInWindow !== null && maxPriceInWindow !== null && maxPriceInWindow > minPriceInWindow
      ? (lastPrice - (minPriceInWindow + maxPriceInWindow) / 2) / ((maxPriceInWindow - minPriceInWindow) / 2 || 1)
      : 0
  const markerLeft = 50 + Math.max(-48, Math.min(48, movePct * 48))
  const markerColor = movePct > 0.02 ? 'var(--of-bid)' : movePct < -0.02 ? 'var(--of-ask)' : 'var(--of-text-dim)'

  return (
    <section className="of-panel">
      <span className="of-corner tl" />
      <span className="of-corner tr" />
      <div className="of-panel-head">
        <div className="of-panel-title">
          <span className="of-tag">Stream Intensity</span>
          <span>· Order Flow Surface</span>
        </div>
        <div className="of-panel-meta">30s window</div>
      </div>
      <div className="of-panel-body">
        <div className="of-intensity-grid">
          <div className="of-intensity-cell">
            <span className="of-ii-label">Trades / 30s</span>
            <span className="of-ii-value">{windowTradeCount}</span>
            <span className="of-ii-sub">{windowBuyCount} buy · {windowSellCount} sell</span>
          </div>
          <div className="of-intensity-cell">
            <span className="of-ii-label">Avg Size</span>
            <span className="of-ii-value">{fmtQty(avgTradeSize, 4)}</span>
            <span className="of-ii-sub">BTC per print</span>
          </div>
          <div className="of-intensity-cell">
            <span className="of-ii-label">Bid Vol</span>
            <span className="of-ii-value bid">{fmtQty(windowBuyVolume, 3)}</span>
            <span className="of-ii-sub">{fmtNotional(stats.windowBuyNotional)} USDT</span>
          </div>
          <div className="of-intensity-cell">
            <span className="of-ii-label">Ask Vol</span>
            <span className="of-ii-value ask">{fmtQty(windowSellVolume, 3)}</span>
            <span className="of-ii-sub">{fmtNotional(stats.windowSellNotional)} USDT</span>
          </div>
        </div>

        {/* tick strip — flow rhythm */}
        <div className="of-tickstrip" aria-label="Trade intensity rhythm">
          {ticks.map((t, i) => {
            const h = Math.max(2, t * 30)
            const color = t > 0.66 ? 'var(--of-gold)' : t > 0.33 ? 'var(--of-text)' : 'var(--of-border-strong)'
            return (
              <motion.div
                key={i}
                className="of-tick"
                animate={{ height: h, backgroundColor: color }}
                transition={{ duration: 0.2 }}
              />
            )
          })}
        </div>

        {/* imbalance meter */}
        <div className="of-imbalance">
          <div className="of-imbalance-bar">
            <motion.div
              className="of-imb-buy"
              animate={{ width: buyShare + '%' }}
              transition={{ duration: 0.25 }}
            />
            <motion.div
              className="of-imb-sell"
              animate={{ width: sellShare + '%' }}
              transition={{ duration: 0.25 }}
            />
          </div>
          <div className="of-imbalance-labels">
            <span className="buy">BID {buyShare.toFixed(1)}%</span>
            <span className="sell">ASK {sellShare.toFixed(1)}%</span>
          </div>
        </div>

        {/* micro-move ladder */}
        <div className="of-move-ladder">
          <span style={{ color: 'var(--of-ask)' }}>L</span>
          <div className="of-move-track">
            <span className="of-move-mid" />
            <motion.span
              className="of-move-marker"
              animate={{ left: markerLeft + '%', backgroundColor: markerColor }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span style={{ color: 'var(--of-bid)' }}>H</span>
        </div>

        {/* secondary readouts — compact strip */}
        <div className="of-ii-strip">
          <div className="of-ii-strip-cell">
            <span className="of-ii-label">VWAP</span>
            <span className="of-ii-strip-val">{fmtPrice(vwap, cfg.priceDigits)}</span>
          </div>
          <div className="of-ii-strip-cell">
            <span className="of-ii-label">Spread</span>
            <span className="of-ii-strip-val">{fmtBps(spreadBps)}</span>
          </div>
          <div className="of-ii-strip-cell">
            <span className="of-ii-label">Range</span>
            <span className="of-ii-strip-val">{fmtPrice(minPriceInWindow, cfg.priceDigits)}–{fmtPrice(maxPriceInWindow, cfg.priceDigits)}</span>
          </div>
          <div className="of-ii-strip-cell">
            <span className="of-ii-label">Largest</span>
            <span className="of-ii-strip-val" style={{ color: 'var(--of-gold)' }}>
              {stats.largestTrade ? fmtNotional(stats.largestTrade.notional) : '—'}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
