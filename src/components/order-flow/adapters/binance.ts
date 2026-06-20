'use client'

/**
 * Binance Spot Trade Adapter — Cryptographic Order Flow Matrix
 *
 * WebSocket protocol (single stream, URL-based subscription):
 *   URL: wss://stream.binance.com:9443/ws/<lowercase-symbol>@trade
 *   No subscribe message needed.
 *
 *   Message (single stream):
 *     {"e":"trade","E":eventTime,"s":"BTCUSDT","t":tradeId,
 *      "p":"63000.00","q":"0.001","T":tradeTime,"m":true}
 *
 *   Message (combined stream wrapper):
 *     {"stream":"btcusdt@trade","data":{...same shape as above...}}
 *
 *   Side semantics:
 *     m === true  → SELL  (buyer is market maker, so seller is the aggressor)
 *     m === false → BUY   (seller is market maker, so buyer is the aggressor)
 *
 * REST fallback:
 *   URL: https://api.binance.com/api/v3/trades?symbol=BTCUSDT&limit=50
 *   Response: [{"id":123,"price":"63000","qty":"0.001","time":1234567890,
 *               "isBuyerMaker":true}, ...]
 *
 *   Side semantics:
 *     isBuyerMaker === true  → SELL
 *     isBuyerMaker === false → BUY
 *
 * Native symbol format: BTCUSDT (uppercase, no separator).
 */

import {
  ExchangeAdapter,
  ExchangeId,
  getDigitsFor,
  NormalizedTrade,
  StreamConfig,
  TradeSide,
} from './types'

/** Binance raw WS trade shape (single stream) */
interface BinanceWsTrade {
  e?: string // event type
  E?: number // event time
  s?: string // symbol
  t?: number // trade id
  p?: string // price
  q?: string // quantity
  T?: number // trade time
  m?: boolean // is buyer market maker
}

/** Binance combined stream wrapper */
interface BinanceCombinedMessage {
  stream?: string
  data?: BinanceWsTrade
}

/** Binance REST trade shape */
interface BinanceRestTrade {
  id?: number
  price?: string
  qty?: string
  time?: number
  isBuyerMaker?: boolean
}

/** Binance exchange id (typed for safety) */
const EXCHANGE_ID: ExchangeId = 'binance'

/**
 * Convert a single parsed Binance WS trade object into a NormalizedTrade.
 * Returns null when the trade is malformed / missing required fields.
 */
function normalizeWsTrade(
  trade: BinanceWsTrade,
  config: StreamConfig,
  rawSymbol: string,
): NormalizedTrade | null {
  // Required numeric fields
  const priceStr = trade.p
  const qtyStr = trade.q
  if (priceStr == null || qtyStr == null) return null

  const price = parseFloat(priceStr)
  const qty = parseFloat(qtyStr)
  if (!Number.isFinite(price) || !Number.isFinite(qty)) return null
  if (price <= 0 || qty <= 0) return null

  // Timestamp: prefer trade time T, fall back to event time E
  const time = typeof trade.T === 'number' && Number.isFinite(trade.T)
    ? trade.T
    : typeof trade.E === 'number' && Number.isFinite(trade.E)
      ? trade.E
      : Date.now()
  if (!Number.isFinite(time)) return null

  // Side: m === true → SELL, m === false → BUY
  let side: TradeSide
  if (trade.m === true) {
    side = 'SELL'
  } else if (trade.m === false) {
    side = 'BUY'
  } else {
    return null
  }

  // Trade id (Binance uses numeric ids)
  const id = trade.t != null && Number.isFinite(trade.t)
    ? String(trade.t)
    : `${time}-${price}-${qty}`

  return {
    id,
    price,
    qty,
    time,
    side,
    notional: price * qty,
    exchange: EXCHANGE_ID,
    rawSymbol,
    displaySymbol: `${config.base.toUpperCase()}/${config.quote.toUpperCase()}`,
  }
}

/**
 * Convert a single parsed Binance REST trade object into a NormalizedTrade.
 * Returns null when malformed.
 */
function normalizeRestTrade(
  trade: BinanceRestTrade,
  config: StreamConfig,
  rawSymbol: string,
  index: number,
): NormalizedTrade | null {
  const priceStr = trade.price
  const qtyStr = trade.qty
  if (priceStr == null || qtyStr == null) return null

  const price = parseFloat(priceStr)
  const qty = parseFloat(qtyStr)
  if (!Number.isFinite(price) || !Number.isFinite(qty)) return null
  if (price <= 0 || qty <= 0) return null

  const time = typeof trade.time === 'number' && Number.isFinite(trade.time)
    ? trade.time
    : Date.now()
  if (!Number.isFinite(time)) return null

  let side: TradeSide
  if (trade.isBuyerMaker === true) {
    side = 'SELL'
  } else if (trade.isBuyerMaker === false) {
    side = 'BUY'
  } else {
    return null
  }

  const id = trade.id != null && Number.isFinite(trade.id)
    ? String(trade.id)
    : `${time}-${index}`

  return {
    id,
    price,
    qty,
    time,
    side,
    notional: price * qty,
    exchange: EXCHANGE_ID,
    rawSymbol,
    displaySymbol: `${config.base.toUpperCase()}/${config.quote.toUpperCase()}`,
  }
}

/** Binance Spot exchange adapter implementation */
export const binanceAdapter: ExchangeAdapter = {
  meta: {
    id: 'binance',
    name: 'Binance',
    shortName: 'BNB',
    color: '#f0b90b',
    hasWebSocket: true,
    hasRestFallback: true,
    restPollMs: 2000,
    categories: ['spot'],
  },

  toNativeSymbol(base: string, quote: string): string {
    return base.toUpperCase() + quote.toUpperCase()
  },

  wsUrl(config: StreamConfig): string | null {
    const nativeSymbol = this.toNativeSymbol(config.base, config.quote, config.category)
    return `wss://stream.binance.com:9443/ws/${nativeSymbol.toLowerCase()}@trade`
  },

  wsSubscribePayload(_config: StreamConfig): string | null {
    // Binance uses URL-based subscription; no subscribe message required.
    return null
  },

  parseWsMessage(raw: string, config: StreamConfig): NormalizedTrade[] {
    if (!raw || raw.trim().length === 0) return []

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return []
    }
    if (parsed == null || typeof parsed !== 'object') return []

    const rawSymbol = this.toNativeSymbol(config.base, config.quote, config.category)

    // Combined stream: { stream, data: {...} }
    const combined = parsed as BinanceCombinedMessage
    if (combined.data != null && typeof combined.data === 'object') {
      const trade = normalizeWsTrade(combined.data, config, rawSymbol)
      return trade ? [trade] : []
    }

    // Single stream: direct trade object
    const trade = normalizeWsTrade(parsed as BinanceWsTrade, config, rawSymbol)
    return trade ? [trade] : []
  },

  restUrl(config: StreamConfig): string | null {
    const nativeSymbol = this.toNativeSymbol(config.base, config.quote, config.category)
    return `https://api.binance.com/api/v3/trades?symbol=${nativeSymbol}&limit=50`
  },

  parseRestResponse(raw: string, config: StreamConfig): NormalizedTrade[] {
    if (!raw || raw.trim().length === 0) return []

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return []
    }
    if (!Array.isArray(parsed)) return []

    const rawSymbol = this.toNativeSymbol(config.base, config.quote, config.category)

    const out: NormalizedTrade[] = []
    for (let i = 0; i < parsed.length; i++) {
      const trade = normalizeRestTrade(parsed[i] as BinanceRestTrade, config, rawSymbol, i)
      if (trade) out.push(trade)
    }
    return out
  },

  digitsFor(base: string) {
    return getDigitsFor(base)
  },
}

export default binanceAdapter
