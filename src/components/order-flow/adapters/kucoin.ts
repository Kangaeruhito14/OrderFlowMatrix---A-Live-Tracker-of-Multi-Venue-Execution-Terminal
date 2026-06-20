'use client'

/**
 * KuCoin Adapter — REST Polling Only
 *
 * KuCoin's WebSocket API requires a multi-step token handshake:
 *   1. POST to /api/v1/bullet/public to obtain a WS endpoint + token
 *   2. Connect to the returned endpoint with the token as a query param
 *   3. Subscribe to /market/match topic
 *
 * This handshake is too complex for a direct browser connection (CORS,
 * token expiry, endpoint rotation), so this adapter uses REST polling
 * only. The REST endpoint returns the most recent trades for a symbol.
 *
 * REST: https://api.kucoin.com/api/v1/market/histories?symbol=BTC-USDT
 *
 * Response shape:
 *   {
 *     "code": "200000",
 *     "data": [
 *       { "sequence": "123", "price": "63000", "size": "0.001",
 *         "side": "buy", "time": 1781767013457000000 }
 *     ]
 *   }
 *
 * IMPORTANT: KuCoin's `time` field is in NANOSECONDS (19 digits).
 * We divide by 1,000,000 to normalize to ms epoch.
 */

import {
  type ExchangeAdapter,
  type ExchangeMeta,
  type MarketCategory,
  type NormalizedTrade,
  type StreamConfig,
  type TradeSide,
  getDigitsFor,
} from './types'

/** KuCoin-side trade record (raw shape from REST) */
interface KuCoinRawTrade {
  sequence?: string | number
  price?: string | number
  size?: string | number
  side?: string // 'buy' | 'sell'
  time?: number // NANOSECONDS epoch
}

/** Top-level REST envelope */
interface KuCoinRestEnvelope {
  code?: string
  data?: KuCoinRawTrade[]
}

/** KuCoin metadata — no native WS, REST-only fallback */
const META: ExchangeMeta = {
  id: 'kucoin',
  name: 'KuCoin',
  shortName: 'KC',
  color: '#23af91',
  hasWebSocket: false,
  hasRestFallback: true,
  restPollMs: 2500,
  categories: ['spot'],
}

/**
 * Map KuCoin's lowercase side string to our normalized TradeSide.
 * Anything that isn't clearly a sell is treated as a buy (KuCoin only
 * emits 'buy' | 'sell' but we defend against malformed data).
 */
function normalizeSide(raw: string | undefined): TradeSide | null {
  if (typeof raw !== 'string') return null
  const s = raw.toLowerCase()
  if (s === 'buy') return 'BUY'
  if (s === 'sell') return 'SELL'
  return null
}

/**
 * Build a NormalizedTrade from a single KuCoin raw trade object.
 * Returns null if any required field is missing or non-finite.
 */
function toNormalized(
  raw: KuCoinRawTrade,
  config: StreamConfig,
  rawSymbol: string,
): NormalizedTrade | null {
  // ID — KuCoin uses `sequence` (string). Fall back to time if absent.
  const id =
    raw.sequence !== undefined && raw.sequence !== null
      ? String(raw.sequence)
      : raw.time !== undefined
        ? String(raw.time)
        : null
  if (id === null) return null

  // Price
  const price = typeof raw.price === 'number' ? raw.price : parseFloat(String(raw.price ?? ''))
  if (!Number.isFinite(price)) return null

  // Quantity (KuCoin calls it `size`)
  const qty = typeof raw.size === 'number' ? raw.size : parseFloat(String(raw.size ?? ''))
  if (!Number.isFinite(qty)) return null

  // Time — KuCoin reports NANOSECONDS, convert to ms (divide by 1,000,000)
  const timeNs = typeof raw.time === 'number' ? raw.time : parseFloat(String(raw.time ?? ''))
  if (!Number.isFinite(timeNs)) return null
  const time = Math.floor(timeNs / 1_000_000)

  // Side
  const side = normalizeSide(raw.side)
  if (side === null) return null

  const displaySymbol = `${config.base.toUpperCase()}/${config.quote.toUpperCase()}`

  return {
    id,
    price,
    qty,
    time,
    side,
    notional: price * qty,
    exchange: 'kucoin',
    rawSymbol,
    displaySymbol,
  }
}

/** KuCoin adapter — REST polling only */
export const kucoinAdapter: ExchangeAdapter = {
  meta: META,

  toNativeSymbol(base: string, quote: string, _category: MarketCategory): string {
    return `${base.toUpperCase()}-${quote.toUpperCase()}`
  },

  // No native browser-friendly WS support (token handshake required)
  wsUrl(_config: StreamConfig): string | null {
    return null
  },

  wsSubscribePayload(_config: StreamConfig): string | null {
    return null
  },

  parseWsMessage(_raw: string, _config: StreamConfig): NormalizedTrade[] {
    // Never called — WS is unsupported
    return []
  },

  restUrl(config: StreamConfig): string | null {
    const nativeSymbol = this.toNativeSymbol(config.base, config.quote, config.category)
    // KuCoin doesn't support CORS for browser fetch, so we use a server-side
    // proxy. The proxy forwards the request and adds CORS headers.
    return `/api/proxy/trades?exchange=kucoin&symbol=${nativeSymbol}`
  },

  parseRestResponse(raw: string, config: StreamConfig): NormalizedTrade[] {
    let envelope: KuCoinRestEnvelope
    try {
      envelope = JSON.parse(raw) as KuCoinRestEnvelope
    } catch {
      // Malformed JSON (could be a proxy error response) — bail out gracefully
      return []
    }

    // Handle proxy error responses
    if (envelope && typeof (envelope as { error?: string }).error === 'string') return []

    // KuCoin returns code "200000" on success; tolerate missing code for
    // forward-compat but require a data array.
    if (!envelope || !Array.isArray(envelope.data)) return []

    const rawSymbol = this.toNativeSymbol(config.base, config.quote, config.category)
    const out: NormalizedTrade[] = []

    for (const t of envelope.data) {
      if (!t || typeof t !== 'object') continue
      const n = toNormalized(t, config, rawSymbol)
      if (n !== null) out.push(n)
    }

    return out
  },

  digitsFor(base: string): { priceDigits: number; qtyDigits: number } {
    return getDigitsFor(base)
  },
}

export default kucoinAdapter
