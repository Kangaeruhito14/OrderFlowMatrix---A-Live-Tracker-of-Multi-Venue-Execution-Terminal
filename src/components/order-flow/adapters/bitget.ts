'use client'

/**
 * Bitget V2 Public Spot Trade Adapter — Cryptographic Order Flow Matrix
 *
 * WebSocket:
 *   URL:        wss://ws.bitget.com/v2/ws/public
 *   Subscribe:  {"op":"subscribe","args":[{"instType":"SPOT",
 *                                         "channel":"trade",
 *                                         "instId":"BTCUSDT"}]}
 *   Trade msg:  {"action":"snapshot",
 *                "arg":{"instType":"SPOT","channel":"trade","instId":"BTCUSDT"},
 *                "data":[{"ts":"1234567890000","price":"63000","size":"0.001",
 *                         "side":"buy","tradeId":"123"}]}
 *
 * NOTE: The channel name is "trade" (singular), NOT "trades".
 *       Using "trades" returns error code 30016 (Param error).
 *
 * REST fallback:
 *   GET https://api.bitget.com/api/v2/spot/market/fills?symbol=BTCUSDT&limit=50
 *   {"code":"00000","data":[{"symbol":"BTCUSDT","tradeId":"123",
 *                            "price":"63000","size":"0.001","side":"buy",
 *                            "ts":"1234567890000"}]}
 *
 * Native symbol: "BTCUSDT" (uppercase, no separator)
 * Timestamps: milliseconds (string)
 */

import {
  type ExchangeAdapter,
  type NormalizedTrade,
  type StreamConfig,
  type TradeSide,
  getDigitsFor,
} from './types'

/** Bitget WS/REST trade payload (single entry from `data[]`) */
interface BitgetTrade {
  symbol?: string
  instId?: string
  tradeId?: string | number
  price?: string | number
  size?: string | number
  side?: string
  ts?: string | number
}

/** Raw shape of a Bitget WS message */
interface BitgetWsMessage {
  event?: string
  action?: string
  arg?: { instType?: string; channel?: string; instId?: string }
  data?: BitgetTrade[]
}

/** Raw shape of a Bitget REST response */
interface BitgetRestResponse {
  code?: string
  msg?: string
  data?: BitgetTrade[]
}

/** Coerce a string/number field to a finite number, or null if invalid */
function toFinite(value: string | number | undefined): number | null {
  if (value === undefined || value === null) return null
  const n = typeof value === 'number' ? value : parseFloat(value)
  return Number.isFinite(n) ? n : null
}

/** Coerce a string/number timestamp (ms) to a finite integer, or null */
function toFiniteTime(value: string | number | undefined): number | null {
  if (value === undefined || value === null) return null
  const n = typeof value === 'number' ? value : parseInt(value, 10)
  return Number.isFinite(n) ? n : null
}

/** Map a Bitget side string to a normalized TradeSide, or null if unknown */
function mapSide(side: string | undefined): TradeSide | null {
  if (side === 'buy') return 'BUY'
  if (side === 'sell') return 'SELL'
  return null
}

/**
 * Convert a single Bitget trade entry into a NormalizedTrade.
 * Returns null if any required field is missing or malformed.
 *
 * Bitget returns the symbol under different keys depending on transport:
 *  - WS:    `instId` (on `arg`, not per-trade) — fallback used
 *  - REST:  `symbol` on each trade entry
 */
function normalizeBitgetTrade(
  trade: BitgetTrade,
  exchange: 'bitget',
  fallbackSymbol: string,
  displaySymbol: string,
): NormalizedTrade | null {
  const price = toFinite(trade.price)
  const qty = toFinite(trade.size)
  const time = toFiniteTime(trade.ts)
  const side = mapSide(trade.side)

  if (price === null || qty === null || time === null || side === null) {
    return null
  }

  const id =
    trade.tradeId !== undefined && trade.tradeId !== null
      ? String(trade.tradeId)
      : `${exchange}-${time}-${price}-${qty}`

  const rawSymbol =
    (typeof trade.symbol === 'string' && trade.symbol.length > 0 && trade.symbol) ||
    (typeof trade.instId === 'string' && trade.instId.length > 0 && trade.instId) ||
    fallbackSymbol

  return {
    id,
    price,
    qty,
    time,
    side,
    notional: price * qty,
    exchange,
    rawSymbol,
    displaySymbol,
  }
}

export const bitgetAdapter: ExchangeAdapter = {
  meta: {
    id: 'bitget',
    name: 'Bitget',
    shortName: 'BG',
    color: '#00f0ff',
    hasWebSocket: true,
    hasRestFallback: true,
    restPollMs: 2000,
    categories: ['spot', 'perp', 'futures'],
  },

  toNativeSymbol(base: string, quote: string): string {
    return base.toUpperCase() + quote.toUpperCase()
  },

  wsUrl(): string | null {
    return 'wss://ws.bitget.com/v2/ws/public'
  },

  wsSubscribePayload(config: StreamConfig): string | null {
    const nativeSymbol = this.toNativeSymbol(config.base, config.quote, config.category)
    return JSON.stringify({
      op: 'subscribe',
      args: [{ instType: 'SPOT', channel: 'trade', instId: nativeSymbol }],
    })
  },

  parseWsMessage(raw: string, config: StreamConfig): NormalizedTrade[] {
    let msg: BitgetWsMessage
    try {
      msg = JSON.parse(raw) as BitgetWsMessage
    } catch {
      return []
    }

    // Bitget emits ack/event messages without a `data` array — skip those.
    if (!msg || !Array.isArray(msg.data) || msg.data.length === 0) {
      return []
    }

    const nativeSymbol = this.toNativeSymbol(config.base, config.quote, config.category)
    const displaySymbol =
      config.base.toUpperCase() + '/' + config.quote.toUpperCase()

    const out: NormalizedTrade[] = []
    for (const trade of msg.data) {
      const normalized = normalizeBitgetTrade(
        trade,
        'bitget',
        nativeSymbol,
        displaySymbol,
      )
      if (normalized) out.push(normalized)
    }
    return out
  },

  restUrl(config: StreamConfig): string | null {
    const nativeSymbol = this.toNativeSymbol(config.base, config.quote, config.category)
    return `https://api.bitget.com/api/v2/spot/market/fills?symbol=${nativeSymbol}&limit=50`
  },

  parseRestResponse(raw: string, config: StreamConfig): NormalizedTrade[] {
    let res: BitgetRestResponse
    try {
      res = JSON.parse(raw) as BitgetRestResponse
    } catch {
      return []
    }

    if (!res || !Array.isArray(res.data) || res.data.length === 0) {
      return []
    }

    const nativeSymbol = this.toNativeSymbol(config.base, config.quote, config.category)
    const displaySymbol =
      config.base.toUpperCase() + '/' + config.quote.toUpperCase()

    const out: NormalizedTrade[] = []
    for (const trade of res.data) {
      const normalized = normalizeBitgetTrade(
        trade,
        'bitget',
        nativeSymbol,
        displaySymbol,
      )
      if (normalized) out.push(normalized)
    }
    return out
  },

  digitsFor(base: string): { priceDigits: number; qtyDigits: number } {
    return getDigitsFor(base)
  },
}
