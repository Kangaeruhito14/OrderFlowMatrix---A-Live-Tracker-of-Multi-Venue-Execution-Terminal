'use client'

/**
 * useMarketUniverse — Cryptographic Order Flow Matrix
 *
 * Fetches the Binance 24hr ticker rollup for ALL spot pairs, then narrows the
 * result to USDT-quoted markets (excluding leveraged tokens). This gives the
 * terminal a rich, constantly-refreshing universe of markets to discover from.
 *
 * Endpoint: https://api.binance.com/api/v3/ticker/24hr
 * Refresh cadence: every 30 seconds (auto). Errors are swallowed gracefully —
 * previous data is retained and an `error` string is surfaced to the caller.
 */

import { useEffect, useState } from 'react'

/** A normalized 24hr ticker for a single USDT-quoted spot market. */
export interface MarketTicker {
  /** Venue-native symbol, e.g. "BTCUSDT" */
  symbol: string
  /** Base asset, e.g. "BTC" (symbol minus the trailing "USDT") */
  base: string
  /** Quote asset, always "USDT" given the universe filter */
  quote: string
  /** Last traded price (quote currency) */
  lastPrice: number
  /** 24h price change as a percentage (e.g. 2.5 means +2.5%) */
  priceChangePct: number
  /** 24h base-asset volume */
  volume: number
  /** 24h quote-asset volume (USDT notional turnover) */
  quoteVolume: number
  /** 24h trade count */
  count: number
  /** 24h high price */
  highPrice: number
  /** 24h low price */
  lowPrice: number
}

/** Return shape of the {@link useMarketUniverse} hook. */
export interface UseMarketUniverseResult {
  /** All eligible USDT spot markets, sorted by quoteVolume desc. */
  tickers: MarketTicker[]
  /** True until the first successful (or failed) fetch resolves. */
  loading: boolean
  /** A human-readable error string, or null when the last fetch succeeded. */
  error: string | null
  /** Epoch ms of the last successful refresh, or null if never refreshed. */
  lastUpdate: number | null
}

const TICKER_URL = 'https://api.binance.com/api/v3/ticker/24hr'
const REFRESH_MS = 30_000
const QUOTE = 'USDT'

/**
 * Leveraged-token suffixes that we exclude from the investable universe.
 * Binance mints 3x/4x long/short tokens for many majors (e.g. BTCUPUSDT,
 * BTCDOWNUSDT, ETHBULLUSDT, ETHBEARUSDT) — they decay intrinsically and are
 * not appropriate for an order-flow discovery surface.
 */
const LEVERAGED_TOKENS = ['UPUSDT', 'DOWNUSDT', 'BULLUSDT', 'BEARUSDT']

/** Raw Binance 24hr ticker shape (all numeric fields arrive as strings). */
interface RawTicker {
  symbol: string
  lastPrice: string
  priceChangePercent: string
  volume: string
  quoteVolume: string
  count: number | string
  highPrice: string
  lowPrice: string
}

function isLeveragedToken(symbol: string): boolean {
  return LEVERAGED_TOKENS.some((s) => symbol.includes(s))
}

function toFinite(value: string | number | undefined | null): number {
  if (value === undefined || value === null) return NaN
  const n = typeof value === 'number' ? value : parseFloat(value)
  return Number.isFinite(n) ? n : NaN
}

/** Convert a raw Binance ticker into a {@link MarketTicker}, or null if it
 *  should be excluded (non-USDT, leveraged, or unparseable). */
function parseTicker(raw: RawTicker): MarketTicker | null {
  const symbol = raw.symbol
  if (!symbol || typeof symbol !== 'string') return null
  if (!symbol.endsWith(QUOTE)) return null
  if (isLeveragedToken(symbol)) return null

  const base = symbol.slice(0, -QUOTE.length)
  if (!base) return null

  const lastPrice = toFinite(raw.lastPrice)
  const priceChangePct = toFinite(raw.priceChangePercent)
  const volume = toFinite(raw.volume)
  const quoteVolume = toFinite(raw.quoteVolume)
  const highPrice = toFinite(raw.highPrice)
  const lowPrice = toFinite(raw.lowPrice)
  const count = toFinite(raw.count)

  // Reject rows with missing core numeric fields — we'd rather drop them than
  // render broken "—" placeholders across the universe panel.
  if (
    !Number.isFinite(lastPrice) ||
    !Number.isFinite(priceChangePct) ||
    !Number.isFinite(volume) ||
    !Number.isFinite(quoteVolume) ||
    !Number.isFinite(highPrice) ||
    !Number.isFinite(lowPrice)
  ) {
    return null
  }

  return {
    symbol,
    base,
    quote: QUOTE,
    lastPrice,
    priceChangePct,
    volume,
    quoteVolume,
    count: Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0,
    highPrice,
    lowPrice,
  }
}

/**
 * Fetch and normalize the full Binance USDT spot universe.
 *
 * On mount, fires an initial request immediately and schedules a 30s refetch
 * interval. On unmount the interval is cleared and in-flight results are
 * ignored via a `cancelled` flag. Fetch failures set the `error` state but
 * preserve the previously-fetched `tickers` so the UI can keep rendering.
 */
export function useMarketUniverse(): UseMarketUniverseResult {
  const [tickers, setTickers] = useState<MarketTicker[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setInterval> | null = null

    const run = async () => {
      try {
        const res = await fetch(TICKER_URL, { cache: 'no-store' })
        if (!res.ok) {
          throw new Error(`Binance 24hr ticker responded ${res.status}`)
        }
        const data = (await res.json()) as unknown
        if (!Array.isArray(data)) {
          throw new Error('Unexpected 24hr ticker response shape')
        }

        const out: MarketTicker[] = []
        for (const r of data as RawTicker[]) {
          const t = parseTicker(r)
          if (t) out.push(t)
        }
        // Default ordering: most liquid (USDT notional turnover) first.
        out.sort((a, b) => b.quoteVolume - a.quoteVolume)

        if (cancelled) return
        setTickers(out)
        setLastUpdate(Date.now())
        setError(null)
      } catch (e) {
        if (cancelled) return
        const msg = e instanceof Error ? e.message : 'Failed to fetch market universe'
        setError(msg)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    timer = setInterval(run, REFRESH_MS)

    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
    }
  }, [])

  return { tickers, loading, error, lastUpdate }
}

export default useMarketUniverse
