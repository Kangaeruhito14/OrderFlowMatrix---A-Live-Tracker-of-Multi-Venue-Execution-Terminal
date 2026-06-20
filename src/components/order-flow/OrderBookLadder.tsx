'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { DepthStats, DepthLevel } from './useBinanceDepthStream'
import { fmtPrice, fmtQty, fmtBps, fmtNotional } from './format'
import { useSymbolConfig } from './SymbolContext'

interface Props {
  depth: DepthStats
  frozen?: boolean
}

const DENSITY_OPTIONS = [8, 12, 20] as const
type Density = (typeof DENSITY_OPTIONS)[number]

/**
 * A "wall" is a single level whose size is >= WALL_RATIO of the largest level
 * in the visible book. These get a gold accent to draw the trader's eye.
 */
const WALL_RATIO = 0.7

export default function OrderBookLadder({ depth, frozen = false }: Props) {
  const cfg = useSymbolConfig()
  const [density, setDensity] = useState<Density>(12)
  const { book, bestBid, bestAsk, midPrice, spread, spreadBps, imbalance } = depth

  const { bids, asks, maxQty, cumBids, cumAsks, maxCum, wallThreshold } = useMemo(() => {
    const b: DepthLevel[] = book ? book.bids.slice(0, density) : []
    const a: DepthLevel[] = book ? book.asks.slice(0, density) : []
    let mq = 0
    for (const lv of b) if (lv.qty > mq) mq = lv.qty
    for (const lv of a) if (lv.qty > mq) mq = lv.qty

    const cb: number[] = []
    let accB = 0
    for (const lv of b) {
      accB += lv.qty
      cb.push(accB)
    }
    const ca: number[] = []
    let accA = 0
    for (const lv of a) {
      accA += lv.qty
      ca.push(accA)
    }
    const mc = Math.max(accB, accA, 1)
    const wt = mq * WALL_RATIO
    return { bids: b, asks: a, maxQty: mq, cumBids: cb, cumAsks: ca, maxCum: mc, wallThreshold: wt }
  }, [book, density])

  const imbPct = Math.round(imbalance * 100)
  const bidPct = Math.round(((imbalance + 1) / 2) * 100)
  const askPct = 100 - bidPct

  const midDir = 'flat'
  const isWall = (qty: number) => maxQty > 0 && qty >= wallThreshold

  return (
    <section className={'of-panel of-orderbook' + (frozen ? ' is-frozen' : '')}>
      <span className="of-corner tl" />
      <span className="of-corner tr" />
      <div className="of-panel-head">
        <div className="of-panel-title">
          <span className="of-tag">Order Book</span>
          <span>· Depth Ladder</span>
        </div>
        <div className="of-ob-head-actions">
          {frozen && <span className="of-frozen-mini">❄</span>}
          {/* density toggle */}
          <div className="of-density-switcher" role="tablist" aria-label="Depth density">
            {DENSITY_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                role="tab"
                aria-selected={d === density}
                className={'of-density-btn ' + (d === density ? 'active' : '')}
                onClick={() => setDensity(d)}
                title={`Show top ${d} levels per side`}
              >
                {d}
              </button>
            ))}
          </div>
          <span className="of-panel-meta">
            {depth.status === 'connected' ? `top ${density} · 100ms` : depth.status}
          </span>
        </div>
      </div>

      {/* mid price + spread */}
      <div className="of-ob-midstrip">
        <div className="of-ob-mid-left">
          <span className="of-ob-mid-label">MID</span>
          <motion.span
            key={midPrice ?? 'none'}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className={'of-ob-mid-price ' + midDir}
          >
            {midPrice !== null ? fmtPrice(midPrice, cfg.priceDigits) : '——,———.—'}
          </motion.span>
        </div>
        <div className="of-ob-mid-right">
          <span className="of-ob-mid-label">SPREAD</span>
          <span className="of-ob-spread">
            {spread !== null ? '$' + spread.toFixed(2) : '—'}
          </span>
          <span className="of-ob-spread-bps">{fmtBps(spreadBps)}</span>
        </div>
      </div>

      <div className="of-panel-body of-ob-body">
        {/* column headers */}
        <div className="of-ob-headrow">
          <span>Price</span>
          <span className="ta-right">Size ({cfg.base})</span>
          <span className="ta-right">Total</span>
        </div>

        {/* asks — displayed top-to-bottom as descending (best ask at bottom, near mid) */}
        <div className="of-ob-side of-ob-asks">
          {asks.length === 0 ? (
            <div className="of-ob-empty">awaiting depth feed…</div>
          ) : (
            asks.slice().reverse().map((lv, i) => {
              const realIdx = asks.length - 1 - i
              const cum = cumAsks[realIdx]
              const depthPct = (cum / maxCum) * 100
              const sizePct = maxQty > 0 ? (lv.qty / maxQty) * 100 : 0
              const wall = isWall(lv.qty)
              return (
                <div
                  className={'of-ob-row of-ob-ask-row' + (wall ? ' wall' : '')}
                  key={'a' + realIdx + lv.price}
                >
                  <div className="of-ob-depthbar ask" style={{ width: depthPct + '%' }} />
                  <div className="of-ob-sizebar ask" style={{ width: sizePct + '%' }} />
                  <span className="of-ob-price ask">{fmtPrice(lv.price, cfg.priceDigits)}</span>
                  <span className="of-ob-qty ta-right">{fmtQty(lv.qty, cfg.qtyDigits)}</span>
                  <span className="of-ob-cum ta-right">{fmtQty(cum, Math.min(3, cfg.qtyDigits))}</span>
                </div>
              )
            })
          )}
        </div>

        {/* separator with best bid/ask */}
        <div className="of-ob-separator">
          <span className="of-ob-bba ask">
            A {bestAsk !== null ? fmtPrice(bestAsk, cfg.priceDigits) : '—'}
          </span>
          <span className="of-ob-sep-dash" />
          <span className="of-ob-bba bid">
            B {bestBid !== null ? fmtPrice(bestBid, cfg.priceDigits) : '—'}
          </span>
        </div>

        {/* bids — descending (best bid at top, near mid) */}
        <div className="of-ob-side of-ob-bids">
          {bids.length === 0 ? (
            <div className="of-ob-empty">awaiting depth feed…</div>
          ) : (
            bids.map((lv, i) => {
              const cum = cumBids[i]
              const depthPct = (cum / maxCum) * 100
              const sizePct = maxQty > 0 ? (lv.qty / maxQty) * 100 : 0
              const wall = isWall(lv.qty)
              return (
                <div
                  className={'of-ob-row of-ob-bid-row' + (wall ? ' wall' : '')}
                  key={'b' + i + lv.price}
                >
                  <div className="of-ob-depthbar bid" style={{ width: depthPct + '%' }} />
                  <div className="of-ob-sizebar bid" style={{ width: sizePct + '%' }} />
                  <span className="of-ob-price bid">{fmtPrice(lv.price, cfg.priceDigits)}</span>
                  <span className="of-ob-qty ta-right">{fmtQty(lv.qty, cfg.qtyDigits)}</span>
                  <span className="of-ob-cum ta-right">{fmtQty(cum, Math.min(3, cfg.qtyDigits))}</span>
                </div>
              )
            })
          )}
        </div>

        {/* depth imbalance footer */}
        <div className="of-ob-imbalance">
          <div className="of-ob-imb-labels">
            <span className="bid">BID DEPTH {bidPct}%</span>
            <span className="ask">ASK DEPTH {askPct}%</span>
          </div>
          <div className="of-ob-imb-bar">
            <motion.div
              className="of-ob-imb-buy"
              animate={{ width: bidPct + '%' }}
              transition={{ duration: 0.25 }}
            />
            <motion.div
              className="of-ob-imb-sell"
              animate={{ width: askPct + '%' }}
              transition={{ duration: 0.25 }}
            />
          </div>
          <div className="of-ob-imb-meta">
            <span>top-20 imbalance</span>
            <span style={{ color: imbPct > 0 ? 'var(--of-bid)' : imbPct < 0 ? 'var(--of-ask)' : 'var(--of-text-dim)' }}>
              {imbPct > 0 ? '+' : ''}{imbPct}%
            </span>
          </div>
          <div className="of-ob-depth-summary">
            <div>
              <span className="lab">BID 20</span>
              <span className="val bid">{fmtQty(depth.bidDepthTop20, 2)} {cfg.base}</span>
              <span className="sub">{fmtNotional(depth.bidNotionalTop20)} USDT</span>
            </div>
            <div>
              <span className="lab">ASK 20</span>
              <span className="val ask">{fmtQty(depth.askDepthTop20, 2)} {cfg.base}</span>
              <span className="sub">{fmtNotional(depth.askNotionalTop20)} USDT</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
