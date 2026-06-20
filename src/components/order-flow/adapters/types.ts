'use client'

/**
 * Exchange Adapter Architecture — Cryptographic Order Flow Matrix
 *
 * Each exchange implements the `ExchangeAdapter` interface, which normalizes
 * venue-specific WebSocket / REST trade data into a single `NormalizedTrade`
 * model consumed by the UI.
 *
 * Supported venues:
 *  - Binance  (WebSocket: wss://stream.binance.com:9443/ws/<sym>@trade)
 *  - Bybit    (WebSocket: wss://stream.bybit.com/v5/public/spot)
 *  - OKX      (WebSocket: wss://ws.okx.com:8443/ws/v5/public)
 *  - Bitget   (WebSocket: wss://ws.bitget.com/v2/ws/public)
 *  - KuCoin   (REST polling fallback — WS requires a token handshake)
 */

/** Normalized trade side */
export type TradeSide = 'BUY' | 'SELL'

/** A single normalized trade, venue-agnostic */
export interface NormalizedTrade {
  /** Trade ID from the venue (string for OKX/KuCoin, number for Binance/Bybit) */
  id: string
  /** Trade price (quote currency, e.g. USDT) */
  price: number
  /** Trade quantity (base asset, e.g. BTC) */
  qty: number
  /** Trade timestamp (ms epoch, from venue) */
  time: number
  /** Aggressor side */
  side: TradeSide
  /** Notional value (price * qty) */
  notional: number
  /** The venue that produced this trade */
  exchange: ExchangeId
  /** The venue-native symbol string (e.g. "BTCUSDT", "BTC-USDT") */
  rawSymbol: string
  /** Normalized display symbol (e.g. "BTC/USDT") */
  displaySymbol: string
}

/** Connection status for a single adapter stream */
export type StreamStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'fallback' // REST polling mode (WS unavailable or failed)

/** Market category */
export type MarketCategory = 'spot' | 'perp' | 'futures'

/** Exchange identifiers */
export const EXCHANGES = ['binance', 'bybit', 'okx', 'bitget', 'kucoin'] as const
export type ExchangeId = (typeof EXCHANGES)[number]

/** Exchange metadata for display */
export interface ExchangeMeta {
  id: ExchangeId
  name: string
  shortName: string
  color: string
  /** Whether this venue supports native WebSocket trade streams */
  hasWebSocket: boolean
  /** Whether REST polling fallback is available */
  hasRestFallback: boolean
  /** Default polling interval for REST mode (ms) */
  restPollMs: number
  /** Supported market categories */
  categories: MarketCategory[]
}

/** Stream subscription configuration */
export interface StreamConfig {
  exchange: ExchangeId
  /** Normalized base symbol, e.g. "BTC" */
  base: string
  /** Normalized quote symbol, e.g. "USDT" */
  quote: string
  category: MarketCategory
}

/** Connection health snapshot */
export interface StreamHealth {
  status: StreamStatus
  exchange: ExchangeId
  messagesReceived: number
  reconnectAttempts: number
  connectedAt: number | null
  lastMessageAt: number | null
  lastError: string | null
  /** True when running in REST polling fallback mode */
  isFallback: boolean
}

/** Initial empty health state */
export function emptyHealth(exchange: ExchangeId): StreamHealth {
  return {
    status: 'connecting',
    exchange,
    messagesReceived: 0,
    reconnectAttempts: 0,
    connectedAt: null,
    lastMessageAt: null,
    lastError: null,
    isFallback: false,
  }
}

/**
 * The adapter interface. Each venue implements this to translate its native
 * trade format into NormalizedTrade[] and manage connection lifecycle.
 *
 * The hook (`useMultiExchangeStream`) calls these methods.
 */
export interface ExchangeAdapter {
  meta: ExchangeMeta

  /** Convert a normalized base/quote to the venue-native symbol string */
  toNativeSymbol(base: string, quote: string, category: MarketCategory): string

  /** Build the WebSocket URL (or null if WS not supported) */
  wsUrl(config: StreamConfig): string | null

  /** Build the WebSocket subscribe message to send after open (or null) */
  wsSubscribePayload(config: StreamConfig): string | null

  /** Parse an incoming WS message into NormalizedTrade[] (may return empty) */
  parseWsMessage(raw: string, config: StreamConfig): NormalizedTrade[]

  /** REST fallback URL for polling recent trades (or null if unsupported) */
  restUrl(config: StreamConfig): string | null

  /** Parse a REST response into NormalizedTrade[] */
  parseRestResponse(raw: string, config: StreamConfig): NormalizedTrade[]

  /** Suggested price/qty digits for a given base asset */
  digitsFor(base: string): { priceDigits: number; qtyDigits: number }
}

/** Common digit presets by base asset */
const DIGIT_PRESETS: Record<string, { priceDigits: number; qtyDigits: number }> = {
  BTC: { priceDigits: 2, qtyDigits: 5 },
  ETH: { priceDigits: 2, qtyDigits: 4 },
  SOL: { priceDigits: 2, qtyDigits: 2 },
  BNB: { priceDigits: 2, qtyDigits: 3 },
  XRP: { priceDigits: 4, qtyDigits: 1 },
  ADA: { priceDigits: 4, qtyDigits: 1 },
  DOGE: { priceDigits: 6, qtyDigits: 0 },
  AVAX: { priceDigits: 3, qtyDigits: 2 },
  LINK: { priceDigits: 3, qtyDigits: 2 },
  DOT: { priceDigits: 3, qtyDigits: 2 },
  MATIC: { priceDigits: 4, qtyDigits: 1 },
  TRX: { priceDigits: 5, qtyDigits: 0 },
  LTC: { priceDigits: 2, qtyDigits: 3 },
  BCH: { priceDigits: 2, qtyDigits: 3 },
  ATOM: { priceDigits: 3, qtyDigits: 2 },
  UNI: { priceDigits: 3, qtyDigits: 2 },
  NEAR: { priceDigits: 4, qtyDigits: 1 },
  APT: { priceDigits: 4, qtyDigits: 1 },
  ARB: { priceDigits: 4, qtyDigits: 1 },
  OP: { priceDigits: 4, qtyDigits: 1 },
}

/** Default digits for unknown assets */
const DEFAULT_DIGITS = { priceDigits: 4, qtyDigits: 2 }

/** Look up digit presets for a base asset */
export function getDigitsFor(base: string): { priceDigits: number; qtyDigits: number } {
  return DIGIT_PRESETS[base.toUpperCase()] ?? DEFAULT_DIGITS
}
