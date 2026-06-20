'use client'

import { memo, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { MultiStreamStats } from './useMultiExchangeStream'
import type { NormalizedTrade } from './adapters'
import { fmtPrice, fmtQty, fmtNotional, fmtTime } from './format'
import { getAdapter, type ExchangeId } from './adapters'

interface Props {
  stats: MultiStreamStats
  paused: boolean
  globalFreeze?: boolean
  onTogglePause: () => void
  exchange: ExchangeId
  focusMode?: boolean
}

function TradeRowBase({ trade, maxNotional, exchange }: { trade: NormalizedTrade; maxNotional: number; exchange: ExchangeId }) {
  const adapter = getAdapter(exchange)
  const { priceDigits, qtyDigits } = adapter.digitsFor(trade.displaySymbol.split('/')[0])
  const isBuy = trade.side === 'BUY'
  const t = fmtTime(trade.time)
  const intensity = maxNotional > 0 ? Math.min(1, trade.notional / maxNotional) : 0
  const largeImpact = trade.notional >= maxNotional * 0.6 && maxNotional > 0

  return (
    <motion.div
      layout={false}
      initial={{ backgroundColor: isBuy ? 'rgba(22,199,132,0.22)' : 'rgba(229,72,77,0.22)' }}
      animate={{ backgroundColor: 'rgba(0,0,0,0)' }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={'of-trade-row ' + (isBuy ? 'buy' : 'sell') + (largeImpact ? ' large-impact' : '')}
      style={{ ['--of-intensity' as string]: intensity }}
    >
      <span className="of-t-time">
        {t.main}
        <span className="of-ms">{t.ms}</span>
      </span>
      <span className="of-t-exchange" style={{ color: getAdapter(trade.exchange).meta.color }}>
        {getAdapter(trade.exchange).meta.shortName}
      </span>
      <span className="of-t-price">{fmtPrice(trade.price, priceDigits)}</span>
      <span className="of-t-qty">{fmtQty(trade.qty, qtyDigits)}</span>
      <span className="of-t-side">{isBuy ? 'BUY' : 'SELL'}</span>
      <span className="of-t-notional">{fmtNotional(trade.notional)}</span>
      <span className="of-t-arrow">{isBuy ? '▲' : '▼'}</span>
    </motion.div>
  )
}

const TradeRow = memo(TradeRowBase)

export default function MultiExchangeTradeMatrix({ stats, paused, globalFreeze = false, onTogglePause, exchange, focusMode = false }: Props) {
  const trades = stats.trades
  const maxNotional = useMemo(() => {
    let m = 0
    for (const t of trades) if (t.notional > m) m = t.notional
    return m
  }, [trades])

  const adapter = getAdapter(exchange)
  const health = stats.health

  return (
    <section className={'of-panel of-matrix' + (focusMode ? ' focus-mode' : '')}>
      <span className="of-corner tl" />
      <span className="of-corner tr" />
      <div className="of-panel-head">
        <div className="of-panel-title">
          <span className="of-tag">Live Trade Matrix</span>
          <span>· {adapter.meta.name} Execution Blotter</span>
        </div>
        <div className="of-matrix-head-actions">
          {globalFreeze && <span className="of-frozen-badge">❄ GLOBAL FREEZE</span>}
          {paused && !globalFreeze && <span className="of-paused-badge">SNAPSHOT</span>}
          {focusMode && <span className="of-focus-badge">🎯 FOCUS</span>}
          {health.isFallback && <span className="of-fallback-badge">REST</span>}
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
        <div className="of-matrix-headrow of-matrix-headrow-multi">
          <span>Time</span>
          <span>Venue</span>
          <span className="ta-right">Price</span>
          <span className="ta-right">Size</span>
          <span className="ta-center">Side</span>
          <span className="ta-right">Notional</span>
          <span className="ta-center">·</span>
        </div>
        <div className="of-matrix-list of-scroll">
          {trades.length === 0 ? (
            <div className="of-matrix-empty">
              {health.status === 'disconnected' ? (
                <>
                  <span style={{ color: 'var(--of-ask)', fontSize: 24 }}>⚠</span>
                  <span>{adapter.meta.name} unavailable in this region</span>
                  <span style={{ fontSize: 10, color: 'var(--of-text-faint)', marginTop: 4 }}>
                    Try selecting another exchange
                  </span>
                </>
              ) : (
                <>
                  <div className="of-spinner" />
                  <span>Establishing {adapter.meta.name} execution feed…</span>
                </>
              )}
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {trades.map((tr) => (
                <TradeRow key={tr.exchange + '-' + tr.id + '-' + tr.time} trade={tr} maxNotional={maxNotional} exchange={exchange} />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </section>
  )
}
