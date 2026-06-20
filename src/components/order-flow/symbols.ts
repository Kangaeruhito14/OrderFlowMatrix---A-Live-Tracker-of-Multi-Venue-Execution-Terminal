'use client'

/**
 * Symbol configuration for the Cryptographic Order Flow Matrix.
 *
 * Each symbol maps to a Binance spot stream pair and carries the display
 * precision used across the terminal. All streams use the USDT quote.
 */

export interface SymbolConfig {
  /** Lowercase stream symbol, e.g. "btcusdt" */
  stream: string
  /** Display pair, e.g. "BTC / USDT" */
  pair: string
  /** Base asset label, e.g. "BTC" */
  base: string
  /** Quote asset label, e.g. "USDT" */
  quote: string
  /** Decimal places for price display */
  priceDigits: number
  /** Decimal places for quantity display (base asset) */
  qtyDigits: number
  /** USDT notional threshold for a "block" trade */
  blockNotional: number
}

export const SYMBOLS: SymbolConfig[] = [
  { stream: 'btcusdt', pair: 'BTC / USDT', base: 'BTC', quote: 'USDT', priceDigits: 2, qtyDigits: 5, blockNotional: 25_000 },
  { stream: 'ethusdt', pair: 'ETH / USDT', base: 'ETH', quote: 'USDT', priceDigits: 2, qtyDigits: 4, blockNotional: 15_000 },
  { stream: 'solusdt', pair: 'SOL / USDT', base: 'SOL', quote: 'USDT', priceDigits: 2, qtyDigits: 2, blockNotional: 10_000 },
  { stream: 'bnbusdt', pair: 'BNB / USDT', base: 'BNB', quote: 'USDT', priceDigits: 2, qtyDigits: 3, blockNotional: 8_000 },
  { stream: 'xrpusdt', pair: 'XRP / USDT', base: 'XRP', quote: 'USDT', priceDigits: 4, qtyDigits: 1, blockNotional: 10_000 },
]

export const DEFAULT_SYMBOL = SYMBOLS[0]

export function getSymbolConfig(stream: string): SymbolConfig {
  return SYMBOLS.find((s) => s.stream === stream) ?? DEFAULT_SYMBOL
}

/** Build a Binance trade-stream WebSocket URL for a symbol */
export function tradeWsUrl(stream: string): string {
  return `wss://stream.binance.com:9443/ws/${stream}@trade`
}

/** Build a Binance depth-stream WebSocket URL for a symbol */
export function depthWsUrl(stream: string): string {
  return `wss://stream.binance.com:9443/ws/${stream}@depth20@100ms`
}

/** Build a Binance kline-stream WebSocket URL for a symbol + interval */
export function klineWsUrl(stream: string, interval = '1m'): string {
  return `wss://stream.binance.com:9443/ws/${stream}@kline_${interval}`
}

/** Build a Binance REST klines URL for historical backfill.
 *  Returns the most recent `limit` candles for the given interval.
 *  Uppercased symbol is required by the REST API (e.g. BTCUSDT). */
export function klineRestUrl(stream: string, interval = '1m', limit = 60): string {
  const pair = stream.toUpperCase()
  return `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${interval}&limit=${limit}`
}

/** Supported kline intervals for the chart interval selector */
export const KLINE_INTERVALS = ['1m', '5m', '15m', '1h'] as const
export type KlineInterval = (typeof KLINE_INTERVALS)[number]
