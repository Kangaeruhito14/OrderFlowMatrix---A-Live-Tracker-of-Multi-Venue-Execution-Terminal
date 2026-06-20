'use client'

/**
 * Adapter Registry — Cryptographic Order Flow Matrix
 *
 * Central registry that imports every exchange adapter and exposes:
 *   - `ADAPTERS`       : Record<ExchangeId, ExchangeAdapter>
 *   - `getAdapter()`   : convenience lookup with fallback
 *   - `EXCHANGE_METAS` : ordered list of ExchangeMeta for UI rendering
 *   - Re-exports all types from `./types`
 *
 * To add a new venue:
 *   1. Create `./{venue}.ts` implementing `ExchangeAdapter`
 *   2. Add its id to `EXCHANGES` in `./types.ts`
 *   3. Import it here and register in `ADAPTERS`
 */

import { binanceAdapter } from './binance'
import { bybitAdapter } from './bybit'
import { okxAdapter } from './okx'
import { bitgetAdapter } from './bitget'
import { kucoinAdapter } from './kucoin'

import {
  type ExchangeAdapter,
  type ExchangeId,
  type ExchangeMeta,
  EXCHANGES,
} from './types'

/** Map of every supported exchange → its adapter instance */
export const ADAPTERS: Record<ExchangeId, ExchangeAdapter> = {
  binance: binanceAdapter,
  bybit: bybitAdapter,
  okx: okxAdapter,
  bitget: bitgetAdapter,
  kucoin: kucoinAdapter,
}

/**
 * Look up an adapter by exchange id. Throws a clear error if the id is
 * not registered — this should be treated as a programming bug since
 * `ExchangeId` is a closed union.
 */
export function getAdapter(exchange: ExchangeId): ExchangeAdapter {
  const adapter = ADAPTERS[exchange]
  if (!adapter) {
    throw new Error(
      `[adapters] No adapter registered for exchange "${exchange}". ` +
        `Registered: ${Object.keys(ADAPTERS).join(', ')}`,
    )
  }
  return adapter
}

/**
 * Ordered metadata array for UI rendering (e.g. exchange selector chips,
 * legend, status grid). The order mirrors the canonical EXCHANGES tuple
 * so the UI is deterministic across renders.
 */
export const EXCHANGE_METAS: ExchangeMeta[] = EXCHANGES.map((id) => ADAPTERS[id].meta)

// Re-export everything from types.ts so consumers can import from
// `./adapters` without reaching into `./adapters/types`.
export * from './types'

// Re-export individual adapters for direct access if needed
export { binanceAdapter } from './binance'
export { bybitAdapter } from './bybit'
export { okxAdapter } from './okx'
export { bitgetAdapter } from './bitget'
export { kucoinAdapter } from './kucoin'
