'use client'

import { memo, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { StreamStats, Trade } from './useBinanceTradeStream'
import { fmtPrice, fmtQty, fmtNotional, fmtTime } from './format'
import { useSymbolConfig } from './SymbolContext'

interface Props {
  stats: StreamStats
  paused: boolean
  globalFreeze?: boolean
  onTogglePause: () => void
}

function TradeRowBase({ trade, maxNotional }: { trade: Trade; maxNotional: number }) {
  const cfg = useSymbolConfig()
  const isBuy = trade.side === 'BUY'
  const t = fmtTime(trade.time)
  // size intensity: scale bar fill relative to max notional
  const intensity = maxNotional > 0 ? Math.min(1, trade.notional / maxNotional) : 0
  const largeImpact = trade.notional >= maxNotional * 0.6 && maxNotional > 0

  return (
    <motion.div
      layout={false}
      initial={{ backgroundColor: isBuy ? 'rgba(22,199,132,0.22)' : 'rgba(229,72,77,0.22)' }}
      animate={{ backgroundColor: 'rgba(0,0,0,0)' }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={'of-trade-row ' + (isBuy ? 'buy' : 'sell') + (largeImpact ? ' large-impact' : '')}
      style={{
        // drive the size bar via inline CSS var consumed by ::before gradient
        ['--of-intensity' as string]: intensity,
      }}
    >
      <span className="of-t-time">
        {t.main}
        <span className="of-ms">{t.ms}</span>
      </span>
      <span className="of-t-price">{fmtPrice(trade.price, cfg.priceDigits)}</span>
      <span className="of-t-qty">{fmtQty(trade.qty, cfg.qtyDigits)}</span>
      <span className="of-t-side">{isBuy ? 'BUY' : 'SELL'}</span>
      <span className="of-t-notional">{fmtNotional(trade.notional)}</span>
      <span className="of-t-arrow">{isBuy ? '▲' : '▼'}</span>
    </motion.div>
  )
}

const TradeRow = memo(TradeRowBase)

export default function TradeMatrix({ stats, paused, globalFreeze = false, onTogglePause }: Props) {
  const trades = stats.trades
  const maxNotional = useMemo(() => {
    let m = 0
    for (const t of trades) if (t.notional > m) m = t.notional
    return m
  }, [trades])

  return (
    <section className="of-panel of-matrix">
      <span className="of-corner tl" />
      <span className="of-corner tr" />
      <div className="of-panel-head">
        <div className="of-panel-title">
          <span className="of-tag">Live Trade Matrix</span>
          <span>· Execution Blotter</span>
        </div>
        <div className="of-matrix-head-actions">
          {globalFreeze && <span className="of-frozen-badge">❄ GLOBAL FREEZE</span>}
          {paused && !globalFreeze && <span className="of-paused-badge">SNAPSHOT</span>}
          <button
            type="button"
            className={'of-pause-btn ' + (paused || globalFreeze ? 'paused' : '')}
            onClick={onTogglePause}
            aria-label={paused ? 'Resume tape' : 'Pause tape'}
            title={paused ? 'Resume tape' : 'Pause tape'}
            disabled={globalFreeze}
          >
            {paused ? '▶' : '❚❚'}
          </button>
          <span className="of-panel-meta">
            {trades.length > 0 ? `${trades.length} prints · newest first` : 'awaiting stream'}
          </span>
        </div>
      </div>
      <div className="of-panel-body">
        <div className="of-matrix-headrow">
          <span>Time</span>
          <span className="ta-right">Price</span>
          <span className="ta-right">Size (BTC)</span>
          <span className="ta-center">Side</span>
          <span className="ta-right">Notional</span>
          <span className="ta-center">·</span>
        </div>
        <div className="of-matrix-list of-scroll">
          {trades.length === 0 ? (
            <div className="of-matrix-empty">
              <div className="of-spinner" />
              <span>Establishing execution feed…</span>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {trades.map((tr) => (
                <TradeRow key={tr.id + '-' + tr.time} trade={tr} maxNotional={maxNotional} />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </section>
  )
}
