'use client'

/**
 * OKX V5 Public Trade Adapter — Cryptographic Order Flow Matrix
 *
 * WebSocket:
 *   URL:        wss://ws.okx.com:8443/ws/v5/public
 *   Subscribe:  {"op":"subscribe","args":[{"channel":"trades","instId":"BTC-USDT"}]}
 *   Trade msg:  {"arg":{"channel":"trades","instId":"BTC-USDT"},
 *                "data":[{"instId":"BTC-USDT","tradeId":"123456",
 *                         "px":"63000","sz":"0.001","side":"buy",
 *                         "ts":"1234567890000"}]}
 *   Event msg:  {"event":"subscribe","channel":"trades","instId":"BTC-USDT"}
 *               (skipped — no `data` array)
 *
 * REST fallback:
 *   GET https://www.okx.com/api/v5/market/trades?instId=BTC-USDT
 *   {"code":"0","data":[{"instId":"BTC-USDT","tradeId":"123",
 *                        "px":"63000","sz":"0.001","side":"buy",
 *                        "ts":"1234567890000"}]}
 *
 * Native symbol: "BTC-USDT" (uppercase, hyphen separator)
 * Timestamps: milliseconds (string)
 */

import {
  type ExchangeAdapter,
  type NormalizedTrade,
  type StreamConfig,
  type TradeSide,
  getDigitsFor,
} from './types'

/** OKX WS/REST trade payload (single entry from `data[]`) */
interface OkxTrade {
  instId?: string
  tradeId?: string | number
  px?: string | number
  sz?: string | number
  side?: string
  ts?: string | number
}

/** Raw shape of an OKX WS message */
interface OkxWsMessage {
  event?: string
  arg?: { channel?: string; instId?: string }
  data?: OkxTrade[]
}

/** Raw shape of an OKX REST response */
interface OkxRestResponse {
  code?: string
  msg?: string
  data?: OkxTrade[]
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

/** Map an OKX side string to a normalized TradeSide, or null if unknown */
function mapSide(side: string | undefined): TradeSide | null {
  if (side === 'buy') return 'BUY'
  if (side === 'sell') return 'SELL'
  return null
}

/**
 * Convert a single OKX trade entry into a NormalizedTrade.
 * Returns null if any required field is missing or malformed.
 */
function normalizeOkxTrade(
  trade: OkxTrade,
  exchange: 'okx',
  fallbackSymbol: string,
  displaySymbol: string,
): NormalizedTrade | null {
  const price = toFinite(trade.px)
  const qty = toFinite(trade.sz)
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
    typeof trade.instId === 'string' && trade.instId.length > 0
      ? trade.instId
      : fallbackSymbol

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

export const okxAdapter: ExchangeAdapter = {
  meta: {
    id: 'okx',
    name: 'OKX',
    shortName: 'OKX',
    color: '#3dcc6f',
    hasWebSocket: true,
    hasRestFallback: true,
    restPollMs: 2000,
    categories: ['spot', 'perp', 'futures'],
  },

  toNativeSymbol(base: string, quote: string): string {
    return base.toUpperCase() + '-' + quote.toUpperCase()
  },

  wsUrl(): string | null {
    return 'wss://ws.okx.com:8443/ws/v5/public'
  },

  wsSubscribePayload(config: StreamConfig): string | null {
    const nativeSymbol = this.toNativeSymbol(config.base, config.quote, config.category)
    return JSON.stringify({
      op: 'subscribe',
      args: [{ channel: 'trades', instId: nativeSymbol }],
    })
  },

  parseWsMessage(raw: string, config: StreamConfig): NormalizedTrade[] {
    let msg: OkxWsMessage
    try {
      msg = JSON.parse(raw) as OkxWsMessage
    } catch {
      return []
    }

    // OKX emits `event` ack messages (e.g. subscribe confirmations) that have
    // no `data` field — skip them.
    if (!msg || !Array.isArray(msg.data) || msg.data.length === 0) {
      return []
    }

    const nativeSymbol = this.toNativeSymbol(config.base, config.quote, config.category)
    const displaySymbol =
      config.base.toUpperCase() + '/' + config.quote.toUpperCase()

    const out: NormalizedTrade[] = []
    for (const trade of msg.data) {
      const normalized = normalizeOkxTrade(
        trade,
        'okx',
        nativeSymbol,
        displaySymbol,
      )
      if (normalized) out.push(normalized)
    }
    return out
  },

  restUrl(config: StreamConfig): string | null {
    const nativeSymbol = this.toNativeSymbol(config.base, config.quote, config.category)
    return `https://www.okx.com/api/v5/market/trades?instId=${nativeSymbol}`
  },

  parseRestResponse(raw: string, config: StreamConfig): NormalizedTrade[] {
    let res: OkxRestResponse
    try {
      res = JSON.parse(raw) as OkxRestResponse
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
      const normalized = normalizeOkxTrade(
        trade,
        'okx',
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
