'use client'

/**
 * ExchangeComparisonPanel — Cross-Venue Surveillance Surface
 *
 * Renders a side-by-side comparison of the SAME symbol across multiple
 * exchanges. Each row represents one venue and shows: last price (with
 * flash on change), spread vs cross-venue average (bps), trade count
 * (30s window), buy/sell ratio (mini bar), and connection status.
 *
 * The highest-priced venue gets a "BEST BID" badge; the lowest gets
 * "BEST ASK". The selected venue's row is highlighted with a left
 * accent border. Clicking a row calls `onSelectExchange`.
 *
 * Styling strategy
 * ----------------
 * Reuses the existing `of-panel` / `of-corner` / `of-panel-head` /
 * `of-panel-body` classes (already styled in `order-flow.css`). All
 * NEW `of-comp-*` classes are paired with inline styles using the
 * terminal's CSS variables (`var(--of-bid)`, `var(--of-ask)`, …) so
 * the panel is fully styled without adding to the CSS file.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { type ExchangeId, type StreamStatus } from './adapters'
import { fmtPrice, fmtInt } from './format'
import type {
  ExchangeComparisonState,
  ExchangeComparisonRow,
} from './useExchangeComparison'

interface Props {
  comparison: ExchangeComparisonState
  base: string
  quote: string
  onSelectExchange: (exchange: ExchangeId) => void
  selectedExchange: ExchangeId
}

/** Grid template shared by header + every row so columns align perfectly. */
const GRID_COLS =
  'minmax(140px, 1.7fr) minmax(96px, 1fr) minmax(78px, 0.85fr) minmax(58px, 0.55fr) minmax(120px, 1.25fr) minmax(92px, 0.9fr)'

/** Map a StreamStatus (+ fallback flag) to a color + label + pulse flag. */
function statusVisual(
  status: StreamStatus,
  isFallback: boolean,
): { color: string; label: string; pulse: boolean } {
  if (isFallback || status === 'fallback') {
    return { color: 'var(--of-gold)', label: 'fallback', pulse: true }
  }
  if (status === 'connected') {
    return { color: 'var(--of-bid)', label: 'live', pulse: true }
  }
  if (status === 'disconnected') {
    return { color: 'var(--of-ask)', label: 'down', pulse: false }
  }
  // connecting / reconnecting
  return { color: 'var(--of-text-dim)', label: status, pulse: true }
}

/** Status dot — colored circle with an optional pulsing halo. */
function StatusDot({
  status,
  isFallback,
}: {
  status: StreamStatus
  isFallback: boolean
}) {
  const { color, pulse } = statusVisual(status, isFallback)
  return (
    <span
      className="of-comp-status-dot"
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 14,
        height: 14,
      }}
      aria-hidden
    >
      {pulse && (
        <motion.span
          className="of-comp-status-halo"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            backgroundColor: color,
            opacity: 0.35,
          }}
          animate={{ scale: [1, 1.55, 1], opacity: [0.35, 0, 0.35] }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      )}
      <span
        className="of-comp-status-core"
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: `0 0 6px ${color}`,
        }}
      />
    </span>
  )
}

/** Last-price cell — monospace, tabular-nums, flashes green/red on change. */
function PriceCell({ row }: { row: ExchangeComparisonRow }) {
  if (row.lastPrice === null) {
    return (
      <span
        className="of-comp-price of-comp-price-null"
        style={{
          fontFamily: 'var(--of-mono)',
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--of-text-faint)',
        }}
      >
        —
      </span>
    )
  }

  const up =
    row.prevPrice !== null && row.lastPrice > row.prevPrice
  const down =
    row.prevPrice !== null && row.lastPrice < row.prevPrice

  // Color the price text — bright white by default, green/red tint on move.
  const textColor = up
    ? 'var(--of-bid-bright)'
    : down
      ? 'var(--of-ask-bright)'
      : 'var(--of-text-bright)'

  // The key changes with every price tick → Framer Motion remounts the
  // span and replays the background flash (green for up, red for down).
  const flash = up
    ? 'rgba(22, 199, 132, 0.22)'
    : down
      ? 'rgba(229, 72, 77, 0.22)'
      : 'rgba(255, 255, 255, 0)'

  return (
    <motion.span
      key={`${row.exchange}-${row.lastPrice}`}
      className="of-comp-price"
      initial={{ backgroundColor: flash }}
      animate={{ backgroundColor: 'rgba(255, 255, 255, 0)' }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      style={{
        display: 'inline-block',
        padding: '2px 6px',
        borderRadius: 3,
        fontFamily: 'var(--of-mono)',
        fontVariantNumeric: 'tabular-nums',
        fontSize: 12.5,
        fontWeight: 600,
        color: textColor,
        letterSpacing: '0.01em',
      }}
    >
      {fmtPrice(row.lastPrice, 2)}
    </motion.span>
  )
}

/** Spread cell — green if positive (above avg), red if negative (below). */
function SpreadCell({ row }: { row: ExchangeComparisonRow }) {
  if (
    row.spreadBps === null ||
    !Number.isFinite(row.spreadBps)
  ) {
    return (
      <span
        className="of-comp-spread of-comp-spread-neutral"
        style={{
          fontFamily: 'var(--of-mono)',
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--of-text-faint)',
          fontSize: 11.5,
        }}
      >
        —
      </span>
    )
  }
  const positive = row.spreadBps > 0
  const negative = row.spreadBps < 0
  const color = positive
    ? 'var(--of-bid)'
    : negative
      ? 'var(--of-ask)'
      : 'var(--of-text-dim)'
  const sign = positive ? '+' : ''
  return (
    <span
      className={`of-comp-spread ${positive ? 'of-comp-spread-pos' : negative ? 'of-comp-spread-neg' : 'of-comp-spread-neutral'}`}
      style={{
        fontFamily: 'var(--of-mono)',
        fontVariantNumeric: 'tabular-nums',
        color,
        fontSize: 11.5,
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 3,
      }}
    >
      <span>{sign}{row.spreadBps.toFixed(2)}</span>
      <span
        className="of-comp-spread-unit"
        style={{ fontSize: 9, fontWeight: 500, opacity: 0.7 }}
      >
        bps
      </span>
    </span>
  )
}

/** Buy/sell ratio mini-bar — green portion = buy %, red = sell %. */
function BuySellBar({ row }: { row: ExchangeComparisonRow }) {
  const buyPct = row.buySellRatio * 100
  const sellPct = 100 - buyPct
  // When there's no volume the ratio is 0.5 — render a faint neutral bar.
  const hasVolume = row.totalVolume > 0
  return (
    <div
      className="of-comp-bs"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        minWidth: 0,
      }}
    >
      <div
        className="of-comp-bs-bar"
        role="img"
        aria-label={`Buy ${buyPct.toFixed(1)}% / Sell ${sellPct.toFixed(1)}%`}
        style={{
          position: 'relative',
          display: 'flex',
          height: 6,
          width: '100%',
          borderRadius: 3,
          overflow: 'hidden',
          backgroundColor: 'var(--of-border-soft)',
          opacity: hasVolume ? 1 : 0.4,
        }}
      >
        <motion.div
          className="of-comp-bs-buy"
          animate={{ width: `${buyPct}%` }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{
            backgroundColor: 'var(--of-bid)',
            height: '100%',
          }}
        />
        <motion.div
          className="of-comp-bs-sell"
          animate={{ width: `${sellPct}%` }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{
            backgroundColor: 'var(--of-ask)',
            height: '100%',
          }}
        />
      </div>
      <div
        className="of-comp-bs-labels"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'var(--of-mono)',
          fontSize: 9,
          letterSpacing: '0.04em',
          color: 'var(--of-text-faint)',
        }}
      >
        <span style={{ color: hasVolume ? 'var(--of-bid)' : 'var(--of-text-faint)' }}>
          {buyPct.toFixed(0)}%
        </span>
        <span style={{ color: hasVolume ? 'var(--of-ask)' : 'var(--of-text-faint)' }}>
          {sellPct.toFixed(0)}%
        </span>
      </div>
    </div>
  )
}

/** "BEST BID" / "BEST ASK" badge. */
function VenueBadge({ kind }: { kind: 'bid' | 'ask' }) {
  const isBid = kind === 'bid'
  const label = isBid ? 'BEST BID' : 'BEST ASK'
  const color = isBid ? 'var(--of-bid)' : 'var(--of-ask)'
  const bg = isBid ? 'var(--of-bid-soft)' : 'var(--of-ask-soft)'
  return (
    <span
      className={`of-comp-badge ${isBid ? 'of-comp-badge-bid' : 'of-comp-badge-ask'}`}
      style={{
        display: 'inline-block',
        padding: '1px 5px',
        borderRadius: 2,
        border: `1px solid ${color}`,
        backgroundColor: bg,
        color,
        fontFamily: 'var(--of-mono)',
        fontSize: 8.5,
        fontWeight: 700,
        letterSpacing: '0.12em',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

export default function ExchangeComparisonPanel({
  comparison,
  base,
  quote,
  onSelectExchange,
  selectedExchange,
}: Props) {
  const {
    rows,
    avgPrice,
    bestBidExchange,
    bestAskExchange,
    maxSpreadBps,
    loading,
  } = comparison

  const maxSpreadDisplay =
    maxSpreadBps !== null && Number.isFinite(maxSpreadBps)
      ? maxSpreadBps.toFixed(2)
      : '—'

  return (
    <section className="of-panel of-comparison">
      <span className="of-corner tl" />
      <span className="of-corner tr" />
      <div className="of-panel-head">
        <div className="of-panel-title">
          <span className="of-tag">Exchange Comparison</span>
          <span>· Cross-Venue Surveillance</span>
        </div>
        <div className="of-panel-meta">
          {base}/{quote} · max spread {maxSpreadDisplay}bps
        </div>
      </div>

      <div className="of-panel-body of-comp-body">
        {/* ---- Column header ---- */}
        <div
          className="of-comp-header-row"
          style={{
            display: 'grid',
            gridTemplateColumns: GRID_COLS,
            gap: 8,
            alignItems: 'center',
            padding: '4px 10px 6px',
            borderBottom: '1px solid var(--of-border-soft)',
            fontFamily: 'var(--of-mono)',
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--of-text-faint)',
          }}
        >
          <span>Venue</span>
          <span>Last Price</span>
          <span>Spread</span>
          <span style={{ textAlign: 'right' }}>Trades</span>
          <span>Buy / Sell</span>
          <span>Status</span>
        </div>

        {/* ---- Rows ---- */}
        <div
          className="of-comp-rows"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            marginTop: 4,
            maxHeight: 320,
            overflowY: 'auto',
          }}
        >
          <AnimatePresence initial={false}>
            {rows.map((row) => {
              const isSelected = row.exchange === selectedExchange
              const isBestBid = row.exchange === bestBidExchange
              const isBestAsk = row.exchange === bestAskExchange
              const vis = statusVisual(row.status, row.isFallback)

              return (
                <motion.button
                  key={row.exchange}
                  type="button"
                  className={`of-comp-row${isSelected ? ' of-comp-row-selected' : ''}${isBestBid ? ' of-comp-row-best-bid' : ''}${isBestAsk ? ' of-comp-row-best-ask' : ''}`}
                  onClick={() => onSelectExchange(row.exchange)}
                  aria-pressed={isSelected}
                  aria-label={`${row.exchangeName} — last ${row.lastPrice ?? 'n/a'}, spread ${row.spreadBps?.toFixed(2) ?? 'n/a'} bps, ${row.tradeCount} trades, ${vis.label}`}
                  initial={{ opacity: 0, y: -2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -2 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.025)' }}
                  style={{
                    position: 'relative',
                    display: 'grid',
                    gridTemplateColumns: GRID_COLS,
                    gap: 8,
                    alignItems: 'center',
                    padding: '7px 10px',
                    border: '1px solid transparent',
                    borderRadius: 3,
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    background: 'transparent',
                    color: 'inherit',
                    font: 'inherit',
                    // Left accent border for the selected row.
                    borderLeft: isSelected
                      ? `2px solid ${row.exchangeColor}`
                      : '2px solid transparent',
                    backgroundColor: isSelected
                      ? 'rgba(255, 255, 255, 0.035)'
                      : 'transparent',
                    transition:
                      'background-color 120ms ease, border-color 120ms ease',
                  }}
                >
                  {/* Venue — colored dot + name + optional badge */}
                  <span
                    className="of-comp-col of-comp-col-exchange"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      minWidth: 0,
                    }}
                  >
                    <span
                      className="of-comp-dot"
                      aria-hidden
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: row.exchangeColor,
                        boxShadow: `0 0 6px ${row.exchangeColor}`,
                        flex: '0 0 auto',
                      }}
                    />
                    <span
                      className="of-comp-exchange-name"
                      style={{
                        fontFamily: 'var(--of-sans)',
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--of-text-bright)',
                        letterSpacing: '0.01em',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {row.exchangeName}
                    </span>
                    {(isBestBid || isBestAsk) && (
                      <VenueBadge kind={isBestBid ? 'bid' : 'ask'} />
                    )}
                  </span>

                  {/* Last price */}
                  <span
                    className="of-comp-col of-comp-col-price"
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <PriceCell row={row} />
                  </span>

                  {/* Spread (bps) */}
                  <span
                    className="of-comp-col of-comp-col-spread"
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <SpreadCell row={row} />
                  </span>

                  {/* Trade count (30s window) */}
                  <span
                    className="of-comp-col of-comp-col-trades"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <span
                      className="of-comp-trades"
                      style={{
                        fontFamily: 'var(--of-mono)',
                        fontVariantNumeric: 'tabular-nums',
                        fontSize: 12,
                        fontWeight: 600,
                        color:
                          row.tradeCount > 0
                            ? 'var(--of-text)'
                            : 'var(--of-text-faint)',
                      }}
                    >
                      {row.tradeCount > 0 ? fmtInt(row.tradeCount) : '—'}
                    </span>
                  </span>

                  {/* Buy/sell ratio mini bar */}
                  <span
                    className="of-comp-col of-comp-col-bs"
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <BuySellBar row={row} />
                  </span>

                  {/* Status indicator */}
                  <span
                    className="of-comp-col of-comp-col-status"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                    }}
                  >
                    <StatusDot
                      status={row.status}
                      isFallback={row.isFallback}
                    />
                    <span
                      className="of-comp-status-text"
                      style={{
                        fontFamily: 'var(--of-mono)',
                        fontSize: 10,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: vis.color,
                        fontWeight: 600,
                      }}
                    >
                      {vis.label}
                    </span>
                  </span>
                </motion.button>
              )
            })}
          </AnimatePresence>

          {rows.length === 0 && (
            <div
              className="of-comp-empty"
              style={{
                padding: '24px 12px',
                textAlign: 'center',
                fontFamily: 'var(--of-mono)',
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--of-text-faint)',
              }}
            >
              {loading
                ? 'Awaiting cross-venue handshake…'
                : 'No exchanges selected.'}
            </div>
          )}
        </div>

        {/* ---- Footer summary strip ---- */}
        <div
          className="of-comp-footer"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 6,
            marginTop: 8,
            paddingTop: 8,
            borderTop: '1px solid var(--of-border-soft)',
          }}
        >
          <FooterStat
            label="Avg Price"
            value={avgPrice !== null ? fmtPrice(avgPrice, 2) : '—'}
            valueColor="var(--of-text-bright)"
          />
          <FooterStat
            label="Venues"
            value={String(rows.length)}
            valueColor="var(--of-text-bright)"
          />
          <FooterStat
            label="Best Bid"
            value={bestBidExchange ? bestBidExchange.toUpperCase() : '—'}
            valueColor="var(--of-bid)"
          />
          <FooterStat
            label="Best Ask"
            value={bestAskExchange ? bestAskExchange.toUpperCase() : '—'}
            valueColor="var(--of-ask)"
          />
          <FooterStat
            label="Max Spread"
            value={`${maxSpreadDisplay} bps`}
            valueColor={
              maxSpreadBps !== null && maxSpreadBps > 20
                ? 'var(--of-gold)'
                : 'var(--of-text-bright)'
            }
          />
        </div>
      </div>
    </section>
  )
}

/** Compact footer stat cell. */
function FooterStat({
  label,
  value,
  valueColor,
}: {
  label: string
  value: string
  valueColor: string
}) {
  return (
    <div
      className="of-comp-footer-cell"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        minWidth: 0,
      }}
    >
      <span
        className="of-comp-footer-label"
        style={{
          fontFamily: 'var(--of-mono)',
          fontSize: 8.5,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--of-text-faint)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {label}
      </span>
      <span
        className="of-comp-footer-val"
        style={{
          fontFamily: 'var(--of-mono)',
          fontVariantNumeric: 'tabular-nums',
          fontSize: 12,
          fontWeight: 700,
          color: valueColor,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </span>
    </div>
  )
}
