'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { MultiStreamStats } from './useMultiExchangeStream'
import { fmtPrice, fmtInt, fmtPct, fmtAge } from './format'
import Sparkline from './Sparkline'
import { useSymbolConfig } from './SymbolContext'
import ExchangeSelector from './ExchangeSelector'
import { getAdapter, type ExchangeId } from './adapters'

interface Props {
  stats: MultiStreamStats
  now: number
  onSelectSymbol: (base: string, quote: string) => void
  globalFreeze: boolean
  onToggleFreeze: () => void
  exchange: ExchangeId
  onSelectExchange: (ex: ExchangeId) => void
  base: string
  quote: string
  focusMode: boolean
  onToggleFocus: () => void
  comparisonMode: boolean
  onToggleComparison: () => void
}

export default function MarketHeader({
  stats, now, onSelectSymbol, globalFreeze, onToggleFreeze,
  exchange, onSelectExchange, base, quote,
  focusMode, onToggleFocus, comparisonMode, onToggleComparison,
}: Props) {
  const cfg = useSymbolConfig()
  const { lastPrice, prevPrice, sessionOpen, sessionHigh, sessionLow, totalTrades, priceChangePct, priceHistory } = stats
  const adapter = getAdapter(exchange)

  const direction: 'up' | 'down' | 'flat' =
    lastPrice === null ? 'flat' : prevPrice === null ? 'flat'
      : lastPrice > prevPrice ? 'up' : lastPrice < prevPrice ? 'down' : 'flat'

  const sessionDir: 'up' | 'down' | 'flat' =
    priceChangePct === null ? 'flat' : priceChangePct > 0 ? 'up' : priceChangePct < 0 ? 'down' : 'flat'

  const connOk = stats.health.status === 'connected'
  const connState =
    stats.health.status === 'connected' ? 'live'
      : stats.health.status === 'fallback' ? 'warn'
        : stats.health.status === 'reconnecting' ? 'warn'
          : stats.health.status === 'connecting' ? 'warn' : 'err'

  return (
    <header className={'of-header' + (focusMode ? ' focus-mode' : '')}>
      <span className="of-corner tl" />
      <span className="of-corner tr" />
      <span className="of-corner bl" />
      <span className="of-corner br" />

      <div className="of-header-inner">
        {/* Brand */}
        <div className="of-brand">
          <div className="of-brand-mark">
            <span>OF</span>
          </div>
          <div className="of-brand-text">
            <div className="of-brand-name">Order Flow Matrix</div>
            <div className="of-brand-sub">Multi-Venue Execution Terminal</div>
          </div>
        </div>

        {/* Exchange selector + symbol + live price */}
        <div className="of-symbol-block">
          <ExchangeSelector
            selected={exchange}
            onSelect={onSelectExchange}
            connected={connOk}
            isFallback={stats.health.isFallback}
          />
          <div className="of-symbol">
            <span className="of-symbol-pair">{base} / {quote}</span>
            <span className="of-symbol-venue">{adapter.meta.name} · SPOT</span>
          </div>
          <div className="of-price-row">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={lastPrice ?? 'none'}
                initial={{ opacity: 0.35, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className={'of-price ' + direction}
              >
                {lastPrice !== null ? fmtPrice(lastPrice, cfg.priceDigits) : '——,———.—'}
              </motion.span>
            </AnimatePresence>
            <span className={'of-price-delta ' + sessionDir}>
              {sessionDir === 'up' ? '▲' : sessionDir === 'down' ? '▼' : '◆'} {fmtPct(priceChangePct)}
            </span>
            <span className="of-price-spark">
              <Sparkline
                data={priceHistory}
                width={120}
                height={30}
                color={sessionDir === 'up' ? '#25e09a' : sessionDir === 'down' ? '#ff5a60' : '#4dd2ff'}
                fillColor={sessionDir === 'up' ? '#16c784' : sessionDir === 'down' ? '#e5484d' : '#4dd2ff'}
                strokeWidth={1.3}
              />
            </span>
          </div>
        </div>

        {/* Stat cells */}
        <div className="of-header-stats">
          <div className="of-stat-cell">
            <span className="of-stat-label">Last Tick</span>
            <span className={'of-stat-value ' + direction}>
              {direction === 'up' ? '▲' : direction === 'down' ? '▼' : '◆'}
            </span>
            <span className="of-stat-sub">
              {prevPrice !== null ? 'prev ' + fmtPrice(prevPrice, cfg.priceDigits) : 'awaiting feed'}
            </span>
          </div>
          <div className="of-stat-cell">
            <span className="of-stat-label">Trade Count</span>
            <span className="of-stat-value">{fmtInt(totalTrades)}</span>
            <span className="of-stat-sub">{fmtInt(stats.windowTradeCount)} in 30s</span>
          </div>
          <div className="of-stat-cell">
            <span className="of-stat-label">Session Open</span>
            <span className="of-stat-value dim">{fmtPrice(sessionOpen, cfg.priceDigits)}</span>
            <span className="of-stat-sub">first observed print</span>
          </div>
          <div className="of-stat-cell">
            <span className="of-stat-label">Session High</span>
            <span className="of-stat-value" style={{ color: 'var(--of-bid-bright)' }}>
              {fmtPrice(sessionHigh, cfg.priceDigits)}
            </span>
            <span className="of-stat-sub">intraday peak</span>
          </div>
          <div className="of-stat-cell">
            <span className="of-stat-label">Session Low</span>
            <span className="of-stat-value" style={{ color: 'var(--of-ask-bright)' }}>
              {fmtPrice(sessionLow, cfg.priceDigits)}
            </span>
            <span className="of-stat-sub">intraday trough</span>
          </div>
          <div className="of-stat-cell">
            <span className="of-stat-label">Msg Rate</span>
            <span className="of-stat-value">{fmtInt(stats.messageRate)}<span style={{ fontSize: 10, color: 'var(--of-text-faint)', marginLeft: 4 }}>tps</span></span>
            <span className="of-stat-sub">{fmtInt(stats.messagesReceived)} total msgs</span>
          </div>
        </div>
      </div>

      {/* Session / status strip */}
      <div className="of-session-strip">
        <div className={'of-session-pill ' + connState}>
          <span className="of-dot" />
          <span>{connOk ? 'Stream Live' : stats.health.status === 'fallback' ? 'REST Fallback' : stats.health.status === 'reconnecting' ? 'Reconnecting' : 'Connecting'}</span>
        </div>
        <div className="of-session-pill">
          <span>Venue</span>
          <span className="of-val" style={{ color: adapter.meta.color }}>{adapter.meta.name}</span>
        </div>
        <div className="of-session-pill">
          <span>Transport</span>
          <span className="of-val">{adapter.meta.hasWebSocket ? 'WSS' : 'REST'}</span>
        </div>
        <div className="of-session-pill">
          <span>Uptime</span>
          <span className="of-val">{stats.health.connectedAt ? fmtAge(now - stats.health.connectedAt) : '—'}</span>
        </div>
        <div className="of-session-pill">
          <span>Last Print</span>
          <span className="of-val">{stats.lastTradeTime ? fmtAge(now - stats.lastTradeTime) + ' ago' : '—'}</span>
        </div>
        <div className="of-session-pill" style={{ borderRight: 'none', marginLeft: 'auto' }}>
          <span>Direction</span>
          <span className="of-val" style={{ color: sessionDir === 'up' ? 'var(--of-bid)' : sessionDir === 'down' ? 'var(--of-ask)' : 'var(--of-text-dim)' }}>
            {sessionDir === 'up' ? 'BID DOMINANT' : sessionDir === 'down' ? 'ASK DOMINANT' : 'NEUTRAL'}
          </span>
        </div>
        {/* Comparison mode toggle */}
        <button
          type="button"
          className={'of-comparison-btn ' + (comparisonMode ? 'active' : '')}
          onClick={onToggleComparison}
          aria-pressed={comparisonMode}
          title="Toggle cross-venue comparison mode"
        >
          <span className="of-comparison-icon">⇄</span>
          <span className="of-comparison-label">{comparisonMode ? 'COMPARE ON' : 'COMPARE'}</span>
        </button>
        {/* Focus mode toggle */}
        <button
          type="button"
          className={'of-focus-btn ' + (focusMode ? 'active' : '')}
          onClick={onToggleFocus}
          aria-pressed={focusMode}
          title="Toggle focus mode — lock onto this market"
        >
          <span className="of-focus-icon">🎯</span>
          <span className="of-focus-label">{focusMode ? 'FOCUSED' : 'FOCUS'}</span>
        </button>
        {/* Global freeze toggle */}
        <button
          type="button"
          className={'of-freeze-btn ' + (globalFreeze ? 'frozen' : '')}
          onClick={onToggleFreeze}
          aria-pressed={globalFreeze}
          title={globalFreeze ? 'Unfreeze all streams' : 'Freeze all streams'}
        >
          <span className="of-freeze-icon">{globalFreeze ? '❄' : '⏸'}</span>
          <span className="of-freeze-label">{globalFreeze ? 'FROZEN' : 'FREEZE'}</span>
        </button>
      </div>
    </header>
  )
}
