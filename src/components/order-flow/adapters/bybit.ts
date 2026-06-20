'use client'

/**
 * Bybit V5 Public Spot Trade Adapter — Cryptographic Order Flow Matrix
 *
 * WebSocket protocol (V5 public spot):
 *   URL: wss://stream.bybit.com/v5/public/spot
 *   Subscribe message: {"op":"subscribe","args":["trade.BTCUSDT"]}
 *
 *   Message format:
 *     {"topic":"trade.BTCUSDT","type":"snapshot",
 *      "data":[{"T":1234567890,"S":"Buy","p":"63000","v":"0.001",
 *               "i":"trade-id-string"}]}
 *
 *   Side semantics:
 *     S === "Buy"  → BUY
 *     S === "Sell" → SELL
 *
 * REST fallback:
 *   URL: https://api.bybit.com/v5/market/recent-trade?category=spot&symbol=BTCUSDT
 *   Response: {"retCode":0,"result":{"list":[
 *               {"time":1234567890,"price":"63000","size":"0.001","side":"Buy"}
 *             ]}}
 *
 *   Side semantics:
 *     side === "Buy"  → BUY
 *     side === "Sell" → SELL
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

/** Bybit V5 WS trade object */
interface BybitWsTrade {
  T?: number // trade time (ms epoch)
  S?: string // side ("Buy" | "Sell")
  p?: string // price
  v?: string // volume / qty
  i?: string // trade id (string)
}

/** Bybit V5 WS message wrapper */
interface BybitWsMessage {
  topic?: string
  type?: string
  data?: BybitWsTrade[] | BybitWsTrade
}

/** Bybit V5 REST trade object */
interface BybitRestTrade {
  time?: number
  price?: string
  size?: string
  side?: string // "Buy" | "Sell"
}

/** Bybit V5 REST response shape */
interface BybitRestResponse {
  retCode?: number
  retMsg?: string
  result?: {
    list?: BybitRestTrade[]
  }
}

/** Bybit exchange id (typed for safety) */
const EXCHANGE_ID: ExchangeId = 'bybit'

/**
 * Normalize a single Bybit WS trade object into a NormalizedTrade.
 * Returns null when the trade is malformed / missing required fields.
 */
function normalizeWsTrade(
  trade: BybitWsTrade,
  config: StreamConfig,
  rawSymbol: string,
): NormalizedTrade | null {
  const priceStr = trade.p
  const qtyStr = trade.v
  if (priceStr == null || qtyStr == null) return null

  const price = parseFloat(priceStr)
  const qty = parseFloat(qtyStr)
  if (!Number.isFinite(price) || !Number.isFinite(qty)) return null
  if (price <= 0 || qty <= 0) return null

  const time = typeof trade.T === 'number' && Number.isFinite(trade.T)
    ? trade.T
    : Date.now()
  if (!Number.isFinite(time)) return null

  let side: TradeSide
  if (trade.S === 'Buy') {
    side = 'BUY'
  } else if (trade.S === 'Sell') {
    side = 'SELL'
  } else {
    return null
  }

  // Trade id (string at Bybit)
  const id = typeof trade.i === 'string' && trade.i.length > 0
    ? trade.i
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
 * Normalize a single Bybit REST trade object into a NormalizedTrade.
 * Returns null when malformed.
 */
function normalizeRestTrade(
  trade: BybitRestTrade,
  config: StreamConfig,
  rawSymbol: string,
  index: number,
): NormalizedTrade | null {
  const priceStr = trade.price
  const qtyStr = trade.size
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
  if (trade.side === 'Buy') {
    side = 'BUY'
  } else if (trade.side === 'Sell') {
    side = 'SELL'
  } else {
    return null
  }

  // REST endpoint does not return a trade id; synthesize a stable one.
  const id = `${time}-${index}`

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

/** Bybit V5 Spot exchange adapter implementation */
export const bybitAdapter: ExchangeAdapter = {
  meta: {
    id: 'bybit',
    name: 'Bybit',
    shortName: 'BYB',
    color: '#f7a600',
    hasWebSocket: true,
    hasRestFallback: true,
    restPollMs: 2000,
    categories: ['spot', 'perp'],
  },

  toNativeSymbol(base: string, quote: string): string {
    return base.toUpperCase() + quote.toUpperCase()
  },

  wsUrl(_config: StreamConfig): string | null {
    return 'wss://stream.bybit.com/v5/public/spot'
  },

  wsSubscribePayload(config: StreamConfig): string | null {
    const nativeSymbol = this.toNativeSymbol(config.base, config.quote, config.category)
    return JSON.stringify({ op: 'subscribe', args: [`trade.${nativeSymbol}`] })
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

    const msg = parsed as BybitWsMessage
    const rawSymbol = this.toNativeSymbol(config.base, config.quote, config.category)

    // Data may be an array (typical) or a single object.
    let trades: BybitWsTrade[] = []
    if (Array.isArray(msg.data)) {
      trades = msg.data
    } else if (msg.data != null && typeof msg.data === 'object') {
      trades = [msg.data]
    } else if (Array.isArray((parsed as { data?: unknown }).data)) {
      // Defensive: handle alternate shapes where data is an array under the
      // root, e.g. `{"data": [...]}` without topic.
      trades = (parsed as { data: BybitWsTrade[] }).data
    } else {
      return []
    }

    const out: NormalizedTrade[] = []
    for (const trade of trades) {
      const normalized = normalizeWsTrade(trade, config, rawSymbol)
      if (normalized) out.push(normalized)
    }
    return out
  },

  restUrl(config: StreamConfig): string | null {
    const nativeSymbol = this.toNativeSymbol(config.base, config.quote, config.category)
    // Bybit's CloudFront blocks direct browser requests (403), so we use a
    // server-side proxy. Note: in some environments, Bybit may block ALL
    // requests (browser + server) — in that case the proxy returns 403/502
    // and the hook will show a "disconnected" state.
    return `/api/proxy/trades?exchange=bybit&symbol=${nativeSymbol}`
  },

  parseRestResponse(raw: string, config: StreamConfig): NormalizedTrade[] {
    if (!raw || raw.trim().length === 0) return []

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return []
    }
    if (parsed == null || typeof parsed !== 'object') return []

    const resp = parsed as BybitRestResponse
    const list = resp?.result?.list
    if (!Array.isArray(list)) return []

    const rawSymbol = this.toNativeSymbol(config.base, config.quote, config.category)

    const out: NormalizedTrade[] = []
    for (let i = 0; i < list.length; i++) {
      const trade = normalizeRestTrade(list[i], config, rawSymbol, i)
      if (trade) out.push(trade)
    }
    return out
  },

  digitsFor(base: string) {
    return getDigitsFor(base)
  },
}

export default bybitAdapter
