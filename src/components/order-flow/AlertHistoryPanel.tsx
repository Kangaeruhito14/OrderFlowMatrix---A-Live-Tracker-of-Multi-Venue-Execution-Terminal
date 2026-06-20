'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { BlockAlertState } from './useBlockTradeAlerts'
import { useSymbolConfig } from './SymbolContext'
import { fmtPrice, fmtNotional, fmtAge } from './format'
import { useMemo, useState, useRef, useEffect } from 'react'

interface Props {
  alertState: BlockAlertState
  now: number
}

/**
 * Collapsible alert history log with symbol filter + CSV export.
 * Shows the last N block-trade alerts (newest first) with a running age,
 * side, symbol, price, and notional. Persists across toast auto-dismissal.
 */
export default function AlertHistoryPanel({ alertState, now }: Props) {
  const cfg = useSymbolConfig()
  const { history, clearHistory, hydrated } = alertState
  const [collapsed, setCollapsed] = useState(false)
  const [filterSym, setFilterSym] = useState<string>('ALL')
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  // unique symbols present in history (for the filter dropdown)
  const symbols = useMemo(() => {
    const set = new Set<string>()
    for (const a of history) {
      const s = (a.symbol || '').replace('usdt', '').toUpperCase()
      if (s) set.add(s)
    }
    return ['ALL', ...Array.from(set).sort()]
  }, [history])

  const filtered = useMemo(() => {
    if (filterSym === 'ALL') return history
    return history.filter((a) => (a.symbol || '').replace('usdt', '').toUpperCase() === filterSym)
  }, [history, filterSym])

  const buyCount = filtered.filter((a) => a.trade.side === 'BUY').length
  const sellCount = filtered.length - buyCount
  const totalNotional = filtered.reduce((s, a) => s + a.trade.notional, 0)

  // close filter dropdown on outside click
  useEffect(() => {
    if (!filterOpen) return
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [filterOpen])

  const handleExportCsv = () => {
    const rows = [
      ['time', 'symbol', 'side', 'price', 'qty', 'notional_usdt', 'trade_id'],
      ...filtered.map((a) => [
        new Date(a.trade.time).toISOString(),
        a.symbol || '',
        a.trade.side,
        String(a.trade.price),
        String(a.trade.qty),
        String(a.trade.notional),
        String(a.trade.id),
      ]),
    ]
    const csv = rows
      .map((r) => r.map((c) => {
        const s = String(c)
        return s.includes(',') || s.includes('"') ? '"' + s.replace(/"/g, '""') + '"' : s
      }).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ofm-alerts-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <section className="of-panel of-alert-history">
      <span className="of-corner tl" />
      <span className="of-corner tr" />
      <div className="of-panel-head">
        <button
          type="button"
          className="of-panel-title of-ah-toggle"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expand alert history' : 'Collapse alert history'}
        >
          <span className="of-ah-chevron">{collapsed ? '▸' : '▾'}</span>
          <span className="of-tag">Alert History</span>
          <span>· Block Prints</span>
        </button>
        <div className="of-ah-head-meta">
          <span className="of-panel-meta">
            <span className="of-ah-buy-count">{buyCount}▲</span>
            <span className="of-ah-sell-count">{sellCount}▼</span>
          </span>
          {/* symbol filter dropdown */}
          <div className="of-ah-filter" ref={filterRef}>
            <button
              type="button"
              className={'of-ah-filter-btn ' + (filterOpen ? 'open' : '')}
              onClick={() => setFilterOpen((o) => !o)}
              title="Filter by symbol"
              aria-expanded={filterOpen}
            >
              <span className="of-ah-filter-icon">⧉</span>
              <span className="of-ah-filter-val">{filterSym}</span>
              <span className="of-ah-filter-caret">▾</span>
            </button>
            <AnimatePresence>
              {filterOpen && (
                <motion.ul
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className="of-ah-filter-menu"
                >
                  {symbols.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        className={'of-ah-filter-opt ' + (filterSym === s ? 'active' : '')}
                        onClick={() => {
                          setFilterSym(s)
                          setFilterOpen(false)
                        }}
                      >
                        {s === 'ALL' ? 'All Symbols' : s}
                        {filterSym === s && <span className="of-ah-filter-check">✓</span>}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              className="of-ah-csv"
              onClick={handleExportCsv}
              title="Export filtered alerts to CSV"
            >
              CSV
            </button>
          )}
          {history.length > 0 && (
            <button
              type="button"
              className="of-ah-clear"
              onClick={clearHistory}
              title="Clear history"
            >
              clear
            </button>
          )}
        </div>
      </div>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="of-ah-body-wrap"
          >
            <div className="of-panel-body of-ah-body">
              {!hydrated ? (
                <div className="of-ah-empty of-ah-loading">loading history…</div>
              ) : filtered.length === 0 ? (
                <div className="of-ah-empty">
                  {history.length === 0
                    ? 'no block prints logged yet'
                    : `no alerts for ${filterSym}`}
                </div>
              ) : (
                <>
                  <div className="of-ah-summary">
                    <span><b>{filtered.length}</b> alerts</span>
                    <span className="of-ah-sep">·</span>
                    <span><b>{fmtNotional(totalNotional)}</b> USDT flow</span>
                    {filterSym !== 'ALL' && (
                      <>
                        <span className="of-ah-sep">·</span>
                        <span className="of-ah-filtered-tag">filtered: {filterSym}</span>
                      </>
                    )}
                  </div>
                  <div className="of-ah-list of-scroll">
                    {filtered.map((a) => {
                      const isBuy = a.trade.side === 'BUY'
                      const symLabel = (a.symbol || '').replace('usdt', '').toUpperCase()
                      return (
                        <div
                          key={a.key}
                          className={'of-ah-row ' + (isBuy ? 'buy' : 'sell')}
                        >
                          <span className="of-ah-side">{isBuy ? '▲' : '▼'}</span>
                          <span className="of-ah-sym" title={a.symbol}>{symLabel}</span>
                          <span className="of-ah-age" title={new Date(a.trade.time).toLocaleString()}>
                            {fmtAge(now - a.at)}
                          </span>
                          <span className="of-ah-price">{fmtPrice(a.trade.price, cfg.priceDigits)}</span>
                          <span className="of-ah-notional">{fmtNotional(a.trade.notional)}</span>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
