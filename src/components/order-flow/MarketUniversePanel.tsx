'use client'

/**
 * MarketUniversePanel — Cryptographic Order Flow Matrix
 *
 * A premium, searchable / filterable / sortable discovery browser for the
 * entire USDT spot universe. Lets the operator scan hundreds of markets at a
 * glance, drill into the most liquid / hottest / most active names, and either
 * stream a selected symbol into the matrix or pin it to the watchlist.
 *
 * Styling note: this panel reuses the project's `of-panel` shell (head, body,
 * corner ticks) and introduces `of-universe-*` class hooks for its inner
 * controls. Per the project convention, no CSS is added to order-flow.css —
 * all panel-specific styling is delivered through inline styles so the
 * component is self-contained and drop-in.
 */

import { useMemo, useState } from 'react'
import type { MarketTicker } from './useMarketUniverse'
import { fmtPrice, fmtPct } from './format'

interface Props {
  /** All eligible USDT spot markets (already sorted by quoteVolume desc). */
  tickers: MarketTicker[]
  /** True while the initial universe fetch is in flight. */
  loading: boolean
  /** Invoked when the operator clicks a row — load that symbol into the matrix. */
  onSelectSymbol: (base: string, quote: string) => void
  /** Currently-streamed base asset, used to highlight the active row. */
  selectedBase: string
  /** Invoked when the operator clicks the per-row "+" pin button. */
  onAddToWatchlist: (base: string, quote: string) => void
  /** Watchlist membership, as an array of "BASE/QUOTE" strings. */
  watchlist: string[]
}

type Category = 'all' | 'topVolume' | 'topGainers' | 'topLosers' | 'mostActive'
type SortKey = 'volume' | 'change' | 'price' | 'activity'

/** Maximum number of rows rendered in the scroll list. */
const MAX_ROWS = 50
/** Size of the pre-filtered pool for the curated category views. */
const CATEGORY_POOL = 60

const CATEGORY_CHIPS: { key: Category; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'topVolume', label: 'Top Volume' },
  { key: 'topGainers', label: 'Top Gainers' },
  { key: 'topLosers', label: 'Top Losers' },
  { key: 'mostActive', label: 'Most Active' },
]

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'volume', label: 'Volume' },
  { key: 'change', label: 'Change %' },
  { key: 'price', label: 'Price' },
  { key: 'activity', label: 'Activity' },
]

/** Compact USDT notional formatter: $1.50B / $4.20M / $250K / $480. */
function fmtQuoteVolume(v: number): string {
  if (!Number.isFinite(v)) return '—'
  if (v >= 1_000_000_000) return '$' + (v / 1_000_000_000).toFixed(2) + 'B'
  if (v >= 1_000_000) return '$' + (v / 1_000_000).toFixed(2) + 'M'
  if (v >= 1_000) return '$' + (v / 1_000).toFixed(1) + 'K'
  return '$' + v.toFixed(0)
}

/** Pick a sensible price-precision for an asset based on its price magnitude. */
function priceDigitsFor(p: number): number {
  if (!Number.isFinite(p)) return 2
  if (p >= 1000) return 2
  if (p >= 1) return 3
  if (p >= 0.01) return 5
  return 8
}

export default function MarketUniversePanel({
  tickers,
  loading,
  onSelectSymbol,
  selectedBase,
  onAddToWatchlist,
  watchlist,
}: Props) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category>('all')
  const [sortKey, setSortKey] = useState<SortKey>('volume')

  const watchset = useMemo(() => new Set(watchlist), [watchlist])

  const rows = useMemo(() => {
    // 1) free-text search — match base asset or full venue symbol
    const q = query.trim().toUpperCase()
    let pool = tickers
    if (q) {
      pool = pool.filter(
        (t) => t.base.includes(q) || t.symbol.includes(q),
      )
    }

    // 2) curated category subsets — pick the top-N by the category metric so
    //    the operator can browse a focused slice, then re-sort on top.
    if (category === 'topVolume') {
      pool = [...pool].sort((a, b) => b.quoteVolume - a.quoteVolume).slice(0, CATEGORY_POOL)
    } else if (category === 'topGainers') {
      pool = [...pool].sort((a, b) => b.priceChangePct - a.priceChangePct).slice(0, CATEGORY_POOL)
    } else if (category === 'topLosers') {
      pool = [...pool].sort((a, b) => a.priceChangePct - b.priceChangePct).slice(0, CATEGORY_POOL)
    } else if (category === 'mostActive') {
      pool = [...pool].sort((a, b) => b.count - a.count).slice(0, CATEGORY_POOL)
    }

    // 3) apply the user-selected sort
    const sorted = [...pool].sort((a, b) => {
      switch (sortKey) {
        case 'volume':
          return b.quoteVolume - a.quoteVolume
        case 'change':
          return b.priceChangePct - a.priceChangePct
        case 'price':
          return b.lastPrice - a.lastPrice
        case 'activity':
          return b.count - a.count
      }
    })

    // 4) cap to the visible row budget
    return sorted.slice(0, MAX_ROWS)
  }, [tickers, query, category, sortKey])

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--of-border)',
    borderRadius: 3,
    padding: '6px 10px',
    color: 'var(--of-text-bright)',
    fontFamily: 'var(--of-mono)',
    fontSize: 11,
    letterSpacing: '0.04em',
    outline: 'none',
  }

  const chipStyle = (active: boolean): React.CSSProperties => ({
    fontFamily: 'var(--of-mono)',
    fontSize: 9.5,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    padding: '3px 8px',
    borderRadius: 3,
    border: '1px solid ' + (active ? 'var(--of-border-strong)' : 'var(--of-border)'),
    background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
    color: active ? 'var(--of-text-bright)' : 'var(--of-text-dim)',
    cursor: 'pointer',
    transition: 'background 0.12s, color 0.12s',
  })

  const selectStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--of-border)',
    borderRadius: 3,
    padding: '3px 6px',
    color: 'var(--of-text-bright)',
    fontFamily: 'var(--of-mono)',
    fontSize: 10,
    letterSpacing: '0.04em',
    outline: 'none',
    cursor: 'pointer',
  }

  return (
    <section className="of-panel of-universe">
      <span className="of-corner tl" />
      <span className="of-corner tr" />
      <div className="of-panel-head">
        <div className="of-panel-title">
          <span className="of-tag">Market Universe</span>
          <span>· Discovery Browser</span>
        </div>
        <div className="of-panel-meta">{tickers.length} pairs</div>
      </div>
      <div className="of-panel-body">
        {/* ---- search input ---- */}
        <div className="of-universe-search">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symbol or asset…"
            aria-label="Search market universe"
            className="of-universe-input"
            style={inputStyle}
          />
        </div>

        {/* ---- category filter chips ---- */}
        <div
          className="of-universe-chips"
          style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}
        >
          {CATEGORY_CHIPS.map((c) => {
            const active = category === c.key
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategory(c.key)}
                className={'of-universe-chip ' + (active ? 'active' : '')}
                style={chipStyle(active)}
                aria-pressed={active}
              >
                {c.label}
              </button>
            )
          })}
        </div>

        {/* ---- sort dropdown ---- */}
        <div
          className="of-universe-sort"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 8,
            marginBottom: 6,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--of-mono)',
              fontSize: 9.5,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--of-text-faint)',
            }}
          >
            Sort
          </span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            aria-label="Sort universe by"
            className="of-universe-select"
            style={selectStyle}
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* ---- list / loading / empty ---- */}
        {loading ? (
          <div
            className="of-universe-loading"
            style={{
              padding: '24px 0',
              textAlign: 'center',
              color: 'var(--of-text-dim)',
              fontFamily: 'var(--of-mono)',
              fontSize: 11,
              letterSpacing: '0.06em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <span
              className="of-universe-spinner"
              style={{
                display: 'inline-block',
                width: 14,
                height: 14,
                border: '1.5px solid var(--of-border-strong)',
                borderTopColor: 'var(--of-bid, #16c784)',
                borderRadius: '50%',
                animation: 'of-spin 0.8s linear infinite',
              }}
            />
            Loading market universe…
          </div>
        ) : rows.length === 0 ? (
          <div
            className="of-universe-empty"
            style={{
              padding: '24px 0',
              textAlign: 'center',
              color: 'var(--of-text-faint)',
              fontFamily: 'var(--of-mono)',
              fontSize: 11,
              letterSpacing: '0.06em',
            }}
          >
            no pairs match this filter
          </div>
        ) : (
          <div
            className="of-universe-list of-scroll"
            style={{
              maxHeight: 280,
              overflowY: 'auto',
              border: '1px solid var(--of-border-soft)',
              borderRadius: 3,
            }}
          >
            {rows.map((t) => {
              const isSelected = t.base === selectedBase
              const wlKey = t.base + '/' + t.quote
              const inWatch = watchset.has(wlKey)
              const positive = t.priceChangePct >= 0
              const digits = priceDigitsFor(t.lastPrice)
              return (
                <div
                  key={t.symbol}
                  className={'of-universe-row ' + (isSelected ? 'selected' : '')}
                  onClick={() => onSelectSymbol(t.base, t.quote)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelectSymbol(t.base, t.quote)
                    }
                  }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '76px 1fr 70px 78px 24px',
                    gap: 6,
                    alignItems: 'center',
                    padding: '5px 8px',
                    cursor: 'pointer',
                    borderLeft: isSelected
                      ? '2px solid #16c784'
                      : '2px solid transparent',
                    background: isSelected
                      ? 'rgba(22,199,132,0.07)'
                      : 'transparent',
                    borderBottom: '1px solid var(--of-border-soft)',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      ;(e.currentTarget as HTMLElement).style.background =
                        'rgba(255,255,255,0.03)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      ;(e.currentTarget as HTMLElement).style.background =
                        'transparent'
                    }
                  }}
                >
                  <span
                    className="of-universe-base"
                    style={{
                      fontFamily: 'var(--of-mono)',
                      fontWeight: 700,
                      fontSize: 11,
                      letterSpacing: '0.04em',
                      color: 'var(--of-text-bright)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t.base}
                  </span>
                  <span
                    className="of-universe-price"
                    style={{
                      fontFamily: 'var(--of-mono)',
                      fontSize: 10.5,
                      color: 'var(--of-text-dim)',
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {fmtPrice(t.lastPrice, digits)}
                  </span>
                  <span
                    className={
                      'of-universe-change ' + (positive ? 'up' : 'down')
                    }
                    style={{
                      fontFamily: 'var(--of-mono)',
                      fontSize: 10.5,
                      textAlign: 'right',
                      color: positive ? '#16c784' : '#e5484d',
                      fontVariantNumeric: 'tabular-nums',
                      fontWeight: 600,
                    }}
                  >
                    {fmtPct(t.priceChangePct)}
                  </span>
                  <span
                    className="of-universe-volume"
                    style={{
                      fontFamily: 'var(--of-mono)',
                      fontSize: 10,
                      color: 'var(--of-text-dim)',
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {fmtQuoteVolume(t.quoteVolume)}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddToWatchlist(t.base, t.quote)
                    }}
                    aria-label={
                      inWatch ? 'Already in watchlist' : 'Add to watchlist'
                    }
                    title={
                      inWatch ? 'Already in watchlist' : 'Add to watchlist'
                    }
                    className={
                      'of-universe-add ' + (inWatch ? 'in' : '')
                    }
                    style={{
                      width: 18,
                      height: 18,
                      border:
                        '1px solid ' +
                        (inWatch ? '#16c784' : 'var(--of-border-strong)'),
                      borderRadius: 3,
                      background: inWatch
                        ? 'rgba(22,199,132,0.14)'
                        : 'transparent',
                      color: inWatch ? '#16c784' : 'var(--of-text-dim)',
                      fontSize: 11,
                      lineHeight: 1,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      transition: 'background 0.12s, color 0.12s',
                    }}
                  >
                    {inWatch ? '✓' : '+'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
