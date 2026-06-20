'use client'

import { motion } from 'framer-motion'
import type { MultiStreamStats } from './useMultiExchangeStream'
import { fmtQty, fmtNotional, fmtInt, fmtPrice } from './format'
import Sparkline from './Sparkline'
import { useSymbolConfig } from './SymbolContext'

interface Props {
  stats: MultiStreamStats
  onThresholdChange: (threshold: number) => void
}

const THRESHOLD_PRESETS = [10_000, 25_000, 50_000, 100_000]

export default function CvdPanel({ stats, onThresholdChange }: Props) {
  const cfg = useSymbolConfig()
  const {
    sessionCvd,
    sessionCvdNotional,
    windowCvd,
    windowCvdNotional,
    cvdHistory,
    blockTradeCount,
    blockTradeNotional,
    lastBlockTrade,
    blockThreshold,
  } = stats

  const cvdPositive = sessionCvd > 0
  const cvdDir = sessionCvd > 0 ? 'up' : sessionCvd < 0 ? 'down' : 'flat'
  const winDir = windowCvd > 0 ? 'up' : windowCvd < 0 ? 'down' : 'flat'

  return (
    <section className="of-panel">
      <span className="of-corner tl" />
      <span className="of-corner tr" />
      <div className="of-panel-head">
        <div className="of-panel-title">
          <span className="of-tag">Cumulative Delta</span>
          <span>· CVD + Block Flow</span>
        </div>
        <div className="of-panel-meta">session</div>
      </div>
      <div className="of-panel-body">
        {/* CVD readout + sparkline */}
        <div className="of-cvd-main">
          <div className="of-cvd-readout">
            <span className="of-ii-label">Session CVD</span>
            <motion.span
              key={Math.round(sessionCvd * 100)}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className={'of-cvd-value ' + cvdDir}
            >
              {cvdPositive ? '+' : ''}{fmtQty(sessionCvd, 3)}
            </motion.span>
            <span className="of-cvd-notional">
              {sessionCvdNotional >= 0 ? '+' : ''}{fmtNotional(sessionCvdNotional)} USDT
            </span>
          </div>
          <div className="of-cvd-spark">
            <Sparkline
              data={cvdHistory}
              width={160}
              height={40}
              color={cvdPositive ? '#25e09a' : '#ff5a60'}
              fillColor={cvdPositive ? '#16c784' : '#e5484d'}
              strokeWidth={1.5}
              baseline={0}
            />
          </div>
        </div>

        {/* window CVD + block trades grid */}
        <div className="of-cvd-grid">
          <div className="of-cvd-cell">
            <span className="of-ii-label">30s Delta</span>
            <span className={'of-cvd-cell-val ' + winDir}>
              {windowCvd > 0 ? '+' : ''}{fmtQty(windowCvd, 4)}
            </span>
            <span className="of-ii-sub">
              {windowCvdNotional >= 0 ? '+' : ''}{fmtNotional(windowCvdNotional)} USDT
            </span>
          </div>
          <div className="of-cvd-cell">
            <span className="of-ii-label">Block Trades</span>
            <span className="of-cvd-cell-val" style={{ color: 'var(--of-gold)' }}>
              {fmtInt(blockTradeCount)}
            </span>
            <span className="of-ii-sub">{fmtNotional(blockTradeNotional)} USDT</span>
          </div>
        </div>

        {/* last block trade + threshold control */}
        <div className="of-cvd-block">
          <div className="of-cvd-block-head">
            <span className="of-ii-label">Last Block Print</span>
            <span className="of-cvd-thresh">≥ ${blockThreshold.toLocaleString()}</span>
          </div>
          {lastBlockTrade ? (
            <div className={'of-cvd-block-row ' + (lastBlockTrade.side === 'BUY' ? 'buy' : 'sell')}>
              <span className="of-cvd-block-side">
                {lastBlockTrade.side === 'BUY' ? '▲ BUY' : '▼ SELL'}
              </span>
              <span className="of-cvd-block-price">{fmtPrice(lastBlockTrade.price, cfg.priceDigits)}</span>
              <span className="of-cvd-block-qty">{fmtQty(lastBlockTrade.qty, cfg.qtyDigits)} {cfg.base}</span>
              <span className="of-cvd-block-notional">{fmtNotional(lastBlockTrade.notional)} USDT</span>
            </div>
          ) : (
            <div className="of-cvd-block-row empty">no block prints yet</div>
          )}
          {/* threshold control */}
          <div className="of-cvd-thresh-control">
            <span className="of-cvd-thresh-lab">Alert Threshold</span>
            <div className="of-cvd-thresh-presets">
              {THRESHOLD_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={'of-cvd-thresh-btn ' + (blockThreshold === p ? 'active' : '')}
                  onClick={() => onThresholdChange(p)}
                >
                  ${(p / 1000).toFixed(0)}k
                </button>
              ))}
              <label className="of-cvd-thresh-input-wrap">
                <span className="of-cvd-thresh-input-prefix">$</span>
                <input
                  className="of-cvd-thresh-input"
                  type="number"
                  min={1000}
                  step={1000}
                  value={blockThreshold}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10)
                    if (Number.isFinite(v) && v >= 1000) onThresholdChange(v)
                  }}
                  aria-label="Block trade threshold in USDT"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
