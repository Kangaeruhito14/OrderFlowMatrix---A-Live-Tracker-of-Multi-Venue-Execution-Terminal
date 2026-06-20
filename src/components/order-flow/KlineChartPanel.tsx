'use client'

import { motion } from 'framer-motion'
import type { KlineStats } from './useBinanceKlineStream'
import { useSymbolConfig } from './SymbolContext'
import { KLINE_INTERVALS, type KlineInterval } from './symbols'
import { fmtPrice, fmtQty, fmtPct } from './format'
import CandlestickChart from './CandlestickChart'

interface Props {
  kline: KlineStats
  interval: KlineInterval
  onIntervalChange: (i: KlineInterval) => void
  frozen?: boolean
}

export default function KlineChartPanel({ kline, interval, onIntervalChange, frozen = false }: Props) {
  const cfg = useSymbolConfig()
  const { candles, lastClose, prevClose, sessionHigh, sessionLow, status, backfillStatus } = kline

  const changePct =
    lastClose !== null && prevClose !== null && prevClose > 0
      ? ((lastClose - prevClose) / prevClose) * 100
      : null

  const dir = changePct === null ? 'flat' : changePct > 0 ? 'up' : changePct < 0 ? 'down' : 'flat'

  // last formed candle for O/H/L/C readout
  const last = candles.length > 0 ? candles[candles.length - 1] : null

  const backfillLabel =
    backfillStatus === 'loading'
      ? 'backfilling…'
      : backfillStatus === 'done'
        ? `${candles.length} candles`
        : backfillStatus === 'error'
          ? 'backfill failed'
          : status

  return (
    <section className={'of-panel of-kline-panel' + (frozen ? ' is-frozen' : '')}>
      <span className="of-corner tl" />
      <span className="of-corner tr" />
      <div className="of-panel-head">
        <div className="of-panel-title">
          <span className="of-tag">Price Action</span>
          <span>· {interval} Kline</span>
        </div>
        <div className="of-kline-head-actions">
          {/* interval selector */}
          <div className="of-interval-switcher" role="tablist" aria-label="Select kline interval">
            {KLINE_INTERVALS.map((iv) => (
              <button
                key={iv}
                type="button"
                role="tab"
                aria-selected={iv === interval}
                className={'of-int-btn ' + (iv === interval ? 'active' : '')}
                onClick={() => onIntervalChange(iv)}
                title={`${iv} candles`}
              >
                {iv}
              </button>
            ))}
          </div>
          <span className="of-panel-meta">
            {candles.length > 0 ? backfillLabel : status}
          </span>
        </div>
      </div>
      <div className="of-panel-body of-kline-body">
        {/* OHLC readout strip */}
        <div className="of-kline-ohlc">
          <div className="of-kline-ohlc-cell">
            <span className="of-ii-label">O</span>
            <span className="of-kline-ohlc-val">{last ? fmtPrice(last.open, cfg.priceDigits) : '—'}</span>
          </div>
          <div className="of-kline-ohlc-cell">
            <span className="of-ii-label">H</span>
            <span className="of-kline-ohlc-val" style={{ color: 'var(--of-bid-bright)' }}>{last ? fmtPrice(last.high, cfg.priceDigits) : '—'}</span>
          </div>
          <div className="of-kline-ohlc-cell">
            <span className="of-ii-label">L</span>
            <span className="of-kline-ohlc-val" style={{ color: 'var(--of-ask-bright)' }}>{last ? fmtPrice(last.low, cfg.priceDigits) : '—'}</span>
          </div>
          <div className="of-kline-ohlc-cell">
            <span className="of-ii-label">C</span>
            <motion.span
              key={lastClose ?? 'none'}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className={'of-kline-ohlc-val ' + dir}
            >
              {lastClose !== null ? fmtPrice(lastClose, cfg.priceDigits) : '—'}
            </motion.span>
          </div>
          <div className="of-kline-ohlc-cell">
            <span className="of-ii-label">Vol</span>
            <span className="of-kline-ohlc-val dim">{last ? fmtQty(last.volume, cfg.qtyDigits) : '—'}</span>
          </div>
          <div className="of-kline-ohlc-cell">
            <span className="of-ii-label">Chg</span>
            <span className={'of-kline-ohlc-val ' + dir}>{fmtPct(changePct)}</span>
          </div>
        </div>

        {/* candlestick chart */}
        <div className="of-kline-chart-wrap">
          <CandlestickChart candles={candles} priceDigits={cfg.priceDigits} qtyDigits={cfg.qtyDigits} height={172} />
        </div>

        {/* range summary */}
        <div className="of-kline-range">
          <span className="of-kline-range-lab">Range</span>
          <span className="of-kline-range-lo" style={{ color: 'var(--of-ask)' }}>{sessionLow !== null ? fmtPrice(sessionLow, cfg.priceDigits) : '—'}</span>
          <span className="of-kline-range-sep">—</span>
          <span className="of-kline-range-hi" style={{ color: 'var(--of-bid)' }}>{sessionHigh !== null ? fmtPrice(sessionHigh, cfg.priceDigits) : '—'}</span>
          <span className="of-kline-range-spacer" />
          <span className="of-kline-range-lab">{interval.toUpperCase()}</span>
        </div>
      </div>
    </section>
  )
}
