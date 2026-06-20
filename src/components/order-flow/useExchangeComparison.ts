'use client'

/**
 * useExchangeComparison — Cross-Venue Surveillance Hook
 *
 * Connects to the SAME symbol (base/quote) across MULTIPLE exchanges
 * simultaneously (up to all 5 supported venues) using the existing
 * `useMultiExchangeStream` adapter system. Produces a side-by-side
 * comparison surface so the operator can see price, volume, and activity
 * divergence across venues in real time.
 *
 * React rules-of-hooks compliance
 * --------------------------------
 * Hooks cannot be called dynamically inside a loop. Since we always have
 * exactly 5 supported exchanges (`EXCHANGES`), we call
 * `useMultiExchangeStream` exactly 5 times — once per venue — on every
 * render. Each call receives `enabled = enabled && exchanges.includes(id)`
 * so venues outside the comparison set are inert (they short-circuit
 * inside the hook and never open a WebSocket).
 *
 * Aggregation
 * -----------
 * From the 5 per-venue `MultiStreamStats` objects we derive:
 *  - `rows[]`              : one row per exchange in the comparison set
 *  - `avgPrice`            : mean of all venues with a valid lastPrice
 *  - `spread / spreadBps`  : per-row delta from avgPrice (in price + bps)
 *  - `bestBidExchange`     : venue with the highest lastPrice (needs ≥2 venues)
 *  - `bestAskExchange`     : venue with the lowest  lastPrice (needs ≥2 venues)
 *  - `maxSpreadBps`        : largest |spreadBps| across rows (dispersion)
 *  - `loading`             : true until at least one venue reports a price
 */

import { useMemo } from 'react'
import { useMultiExchangeStream, type MultiStreamStats } from './useMultiExchangeStream'
import {
  EXCHANGES,
  ADAPTERS,
  type ExchangeId,
  type StreamStatus,
} from './adapters'

/** One row in the comparison table — represents a single venue's live state. */
export interface ExchangeComparisonRow {
  exchange: ExchangeId
  exchangeName: string
  exchangeColor: string
  lastPrice: number | null
  prevPrice: number | null
  /** Difference from the cross-venue average price (quote currency). */
  spread: number | null
  /** Same difference expressed in basis points (spread / avgPrice × 10_000). */
  spreadBps: number | null
  /** Trade count within the 30s rolling window. */
  tradeCount: number
  buyVolume: number
  sellVolume: number
  totalVolume: number
  /** buyVol / (buyVol + sellVol), clamped to [0,1]. 0.5 when no volume. */
  buySellRatio: number
  status: StreamStatus
  isFallback: boolean
  messagesReceived: number
}

/** Aggregated cross-venue state consumed by the comparison panel. */
export interface ExchangeComparisonState {
  rows: ExchangeComparisonRow[]
  avgPrice: number | null
  /** Venue with the highest lastPrice (null if <2 venues have a price). */
  bestBidExchange: ExchangeId | null
  /** Venue with the lowest  lastPrice (null if <2 venues have a price). */
  bestAskExchange: ExchangeId | null
  /** Largest absolute spreadBps across all rows (null if no spreads). */
  maxSpreadBps: number | null
  loading: boolean
}

export function useExchangeComparison(
  base: string,
  quote: string,
  exchanges: ExchangeId[],
  enabled: boolean,
): ExchangeComparisonState {
  // ---- Always-on 5 hook calls (rules of hooks) ---------------------------
  // Each call passes `enabled = enabled && exchanges.includes(id)` so venues
  // outside the comparison set never spin up a WebSocket. The hooks still run
  // in identical order on every render, satisfying React's rules.
  const binanceStats = useMultiExchangeStream(
    'binance', base, quote, 'spot', enabled && exchanges.includes('binance'),
  )
  const bybitStats = useMultiExchangeStream(
    'bybit', base, quote, 'spot', enabled && exchanges.includes('bybit'),
  )
  const okxStats = useMultiExchangeStream(
    'okx', base, quote, 'spot', enabled && exchanges.includes('okx'),
  )
  const bitgetStats = useMultiExchangeStream(
    'bitget', base, quote, 'spot', enabled && exchanges.includes('bitget'),
  )
  const kucoinStats = useMultiExchangeStream(
    'kucoin', base, quote, 'spot', enabled && exchanges.includes('kucoin'),
  )

  const statsById: Record<ExchangeId, MultiStreamStats> = {
    binance: binanceStats,
    bybit: bybitStats,
    okx: okxStats,
    bitget: bitgetStats,
    kucoin: kucoinStats,
  }

  return useMemo(() => {
    // Snapshot the caller's requested order + set at the start of the memo
    // so re-renders with a new array identity (but same contents) still
    // produce equivalent state. The deps array below lists `exchanges`
    // directly to satisfy the React Compiler's dependency inference.
    const included: ExchangeId[] = exchanges
    const includedSet = new Set(included)

    // ---- Build one row per exchange in the comparison set ----------------
    const rows: ExchangeComparisonRow[] = []
    for (const id of EXCHANGES) {
      if (!includedSet.has(id) || !enabled) continue
      const stats = statsById[id]
      const meta = ADAPTERS[id].meta
      const buyVol = stats.windowBuyVolume
      const sellVol = stats.windowSellVolume
      const totalVol = buyVol + sellVol
      rows.push({
        exchange: id,
        exchangeName: meta.name,
        exchangeColor: meta.color,
        lastPrice: stats.lastPrice,
        prevPrice: stats.prevPrice,
        spread: null,
        spreadBps: null,
        tradeCount: stats.windowTradeCount,
        buyVolume: buyVol,
        sellVolume: sellVol,
        totalVolume: totalVol,
        // 0.5 (neutral) when there's no volume yet — keeps the UI balanced
        // instead of flashing all-red on an empty window.
        buySellRatio: totalVol > 0 ? buyVol / totalVol : 0.5,
        status: stats.health.status,
        isFallback: stats.health.isFallback,
        messagesReceived: stats.messagesReceived,
      })
    }

    // ---- Average price across venues with a valid lastPrice --------------
    const priced = rows.filter(
      (r) => r.lastPrice !== null && Number.isFinite(r.lastPrice),
    )
    const avgPrice = priced.length > 0
      ? priced.reduce((sum, r) => sum + (r.lastPrice as number), 0) /
        priced.length
      : null

    // ---- Per-row spread vs average ---------------------------------------
    for (const r of rows) {
      if (r.lastPrice !== null && avgPrice !== null && avgPrice > 0) {
        r.spread = r.lastPrice - avgPrice
        r.spreadBps = (r.spread / avgPrice) * 10_000
      }
    }

    // ---- Best bid / best ask (cross-venue) -------------------------------
    // Only meaningful when at least 2 venues are quoting — otherwise the
    // single venue is trivially both the highest and lowest.
    let bestBidExchange: ExchangeId | null = null
    let bestAskExchange: ExchangeId | null = null
    if (priced.length >= 2) {
      let hi = -Infinity
      let lo = Infinity
      for (const r of priced) {
        const p = r.lastPrice as number
        if (p > hi) {
          hi = p
          bestBidExchange = r.exchange
        }
        if (p < lo) {
          lo = p
          bestAskExchange = r.exchange
        }
      }
    }

    // ---- Max dispersion (largest absolute spreadBps) ---------------------
    let maxSpreadBps: number | null = null
    for (const r of rows) {
      if (r.spreadBps !== null && Number.isFinite(r.spreadBps)) {
        const abs = Math.abs(r.spreadBps)
        if (maxSpreadBps === null || abs > maxSpreadBps) maxSpreadBps = abs
      }
    }

    // ---- Preserve caller-requested row order -----------------------------
    // `EXCHANGES` iteration above yields canonical order; re-sort to match
    // the order the caller passed in `exchanges` (e.g. user reordering).
    rows.sort(
      (a, b) => included.indexOf(a.exchange) - included.indexOf(b.exchange),
    )

    // ---- Loading flag ----------------------------------------------------
    // True until at least one venue reports a price — covers both the
    // "no rows" case and the "all rows still connecting" case.
    const loading =
      rows.length === 0 || !rows.some((r) => r.lastPrice !== null)

    return {
      rows,
      avgPrice,
      bestBidExchange,
      bestAskExchange,
      maxSpreadBps,
      loading,
    }
    // statsById is derived from the 5 stat objects below — including them
    // individually keeps the dep list primitive and stable.
  }, [
    binanceStats,
    bybitStats,
    okxStats,
    bitgetStats,
    kucoinStats,
    exchanges,
    enabled,
  ])
}
