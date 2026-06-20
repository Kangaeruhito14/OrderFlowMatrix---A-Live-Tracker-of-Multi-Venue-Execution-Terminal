'use client'

/**
 * useWatchlist — localStorage-persistent watchlist with optional auto-rotation.
 *
 * Maintains a list of tracked market pairs (base/quote) plus an auto-rotate
 * flag and rotation interval. All three pieces of state are persisted to
 * localStorage under the `ofm-watchlist` key and re-hydrated after mount.
 *
 * SSR / hydration safety:
 *   The server and the client's first paint both render with the same empty
 *   / default state. Real values are loaded from localStorage inside a mount
 *   effect (deferred via queueMicrotask, matching the project's existing
 *   useBlockTradeAlerts pattern) and a `hydrated` flag gates persistence so
 *   the initial empty state never overwrites stored data.
 */

import { useEffect, useState, useCallback } from 'react'

/** A single entry in the watchlist. */
export interface WatchlistEntry {
  /** Composite key, e.g. "BTC/USDT" */
  key: string
  /** Base asset, e.g. "BTC" */
  base: string
  /** Quote asset, e.g. "USDT" */
  quote: string
  /** Epoch ms when the entry was added */
  addedAt: number
}

/** The full watchlist API surfaced to consumers. */
export interface WatchlistState {
  symbols: WatchlistEntry[]
  autoRotate: boolean
  rotateIntervalMs: number
  addSymbol: (base: string, quote: string) => void
  removeSymbol: (key: string) => void
  toggleAutoRotate: () => void
  setRotateInterval: (ms: number) => void
  contains: (base: string, quote: string) => boolean
}

/** localStorage key for the persisted watchlist payload. */
const STORAGE_KEY = 'ofm-watchlist'

/** Hard cap on the number of tracked symbols. */
const MAX_ENTRIES = 20

/** Default rotation interval (ms) when none is stored. */
const DEFAULT_INTERVAL_MS = 10000

/** Shape persisted to localStorage. */
interface PersistedShape {
  symbols: WatchlistEntry[]
  autoRotate: boolean
  rotateIntervalMs: number
}

/** The empty / default state used on both server and client first paint. */
function emptyShape(): PersistedShape {
  return { symbols: [], autoRotate: false, rotateIntervalMs: DEFAULT_INTERVAL_MS }
}

/**
 * Read + sanitize the persisted payload from localStorage. Returns the empty
 * default shape on the server, on any parse error, or when nothing is stored.
 */
function loadPersisted(): PersistedShape {
  if (typeof window === 'undefined') return emptyShape()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyShape()
    const parsed = JSON.parse(raw) as Partial<PersistedShape>

    const symbolsRaw = Array.isArray(parsed?.symbols) ? parsed.symbols : []
    const symbols: WatchlistEntry[] = []
    for (const s of symbolsRaw) {
      if (!s || typeof s !== 'object') continue
      const base = String((s as WatchlistEntry).base ?? '').trim().toUpperCase()
      const quote = String((s as WatchlistEntry).quote ?? '').trim().toUpperCase()
      if (!base || !quote) continue
      const key = base + '/' + quote
      const addedAt =
        typeof (s as WatchlistEntry).addedAt === 'number' &&
        isFinite((s as WatchlistEntry).addedAt)
          ? (s as WatchlistEntry).addedAt
          : Date.now()
      symbols.push({ key, base, quote, addedAt })
    }

    const autoRotate = parsed?.autoRotate === true
    const rotateIntervalMs =
      typeof parsed?.rotateIntervalMs === 'number' &&
      isFinite(parsed.rotateIntervalMs) &&
      parsed.rotateIntervalMs > 0
        ? parsed.rotateIntervalMs
        : DEFAULT_INTERVAL_MS

    return {
      symbols: symbols.slice(0, MAX_ENTRIES),
      autoRotate,
      rotateIntervalMs,
    }
  } catch {
    return emptyShape()
  }
}

/**
 * Watchlist hook. Call once near the top of the terminal; pass the returned
 * `WatchlistState` down to the `WatchlistPanel` and any "add to watchlist"
 * UI in the market universe.
 */
export function useWatchlist(): WatchlistState {
  // Initialize to empty / defaults on BOTH server and client to avoid a
  // hydration mismatch. Hydrate from localStorage in a mount effect.
  const [symbols, setSymbols] = useState<WatchlistEntry[]>([])
  const [autoRotate, setAutoRotate] = useState<boolean>(false)
  const [rotateIntervalMs, setRotateIntervalMsState] = useState<number>(DEFAULT_INTERVAL_MS)
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage AFTER mount (deferred via microtask to match
  // the project's existing useBlockTradeAlerts pattern).
  useEffect(() => {
    queueMicrotask(() => {
      const persisted = loadPersisted()
      setSymbols(persisted.symbols)
      setAutoRotate(persisted.autoRotate)
      setRotateIntervalMsState(persisted.rotateIntervalMs)
      setHydrated(true)
    })
  }, [])

  // Persist to localStorage whenever the watched values change. Guarded by
  // `hydrated` so the initial empty state never overwrites stored data.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!hydrated) return
    try {
      const payload: PersistedShape = { symbols, autoRotate, rotateIntervalMs }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      /* storage unavailable or quota exceeded — noop */
    }
  }, [symbols, autoRotate, rotateIntervalMs, hydrated])

  /** Add a new base/quote pair. Dedupes by key, enforces the max-entries cap. */
  const addSymbol = useCallback((base: string, quote: string) => {
    const b = String(base ?? '').trim().toUpperCase()
    const q = String(quote ?? '').trim().toUpperCase()
    if (!b || !q) return
    const key = b + '/' + q
    setSymbols((prev) => {
      if (prev.some((s) => s.key === key)) return prev // duplicate — no-op
      const entry: WatchlistEntry = { key, base: b, quote: q, addedAt: Date.now() }
      const next = [entry, ...prev]
      if (next.length > MAX_ENTRIES) next.length = MAX_ENTRIES
      return next
    })
  }, [])

  /** Remove an entry by its composite key (e.g. "BTC/USDT"). */
  const removeSymbol = useCallback((key: string) => {
    setSymbols((prev) => prev.filter((s) => s.key !== key))
  }, [])

  /** Toggle the auto-rotate flag. */
  const toggleAutoRotate = useCallback(() => {
    setAutoRotate((v) => !v)
  }, [])

  /** Set the rotation interval (ms). Non-finite / non-positive values are ignored. */
  const setRotateInterval = useCallback((ms: number) => {
    if (typeof ms !== 'number' || !isFinite(ms) || ms <= 0) return
    setRotateIntervalMsState(Math.round(ms))
  }, [])

  /** Returns true if `base/quote` is currently in the watchlist. */
  const contains = useCallback(
    (base: string, quote: string) => {
      const b = String(base ?? '').trim().toUpperCase()
      const q = String(quote ?? '').trim().toUpperCase()
      if (!b || !q) return false
      const key = b + '/' + q
      return symbols.some((s) => s.key === key)
    },
    [symbols],
  )

  return {
    symbols,
    autoRotate,
    rotateIntervalMs,
    addSymbol,
    removeSymbol,
    toggleAutoRotate,
    setRotateInterval,
    contains,
  }
}
