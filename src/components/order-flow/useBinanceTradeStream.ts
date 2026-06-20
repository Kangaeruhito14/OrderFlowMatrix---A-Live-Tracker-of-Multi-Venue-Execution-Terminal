'use client'

import { useEffect, useRef, useState } from 'react'
import { getSymbolConfig, tradeWsUrl } from './symbols'

/**
 * Cryptographic Order Flow Matrix — Binance live trade stream hook.
 *
 * Connects directly to: wss://stream.binance.com:9443/ws/btcusdt@trade
 *
 * Binance trade payload fields used:
 *   t  -> trade id
 *   p  -> price (string)
 *   q  -> quantity (string)
 *   T  -> trade time (ms)
 *   m  -> is buyer the market maker?
 *         m === true  => seller is aggressor => SELL trade (asks lifted)
 *         m === false => buyer is aggressor  => BUY trade  (bids lifted)
 *
 * High-frequency handling:
 *  - incoming trades are buffered in a ref
 *  - a flush interval (FLUSH_MS) commits the buffer to React state in batches
 *  - a rolling window of recent trades (by time) drives pressure / intensity stats
 *  - message rate is sampled on a 1s tick
 */

export type TradeSide = 'BUY' | 'SELL'

export interface Trade {
  id: number
  price: number
  qty: number
  time: number
  side: TradeSide
  notional: number // price * qty (quote currency, USDT)
}

export type StreamStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'

export interface StreamStats {
  status: StreamStatus
  trades: Trade[]
  lastPrice: number | null
  prevPrice: number | null
  sessionOpen: number | null
  sessionHigh: number | null
  sessionLow: number | null
  totalTrades: number
  // rolling-window stats (WINDOW_MS)
  windowBuyVolume: number
  windowSellVolume: number
  windowBuyCount: number
  windowSellCount: number
  windowTradeCount: number
  windowBuyNotional: number
  windowSellNotional: number
  avgTradeSize: number
  lastTradeTime: number | null
  reconnectAttempts: number
  messageRate: number // msgs / sec (sampled)
  messagesReceived: number
  vwap: number | null
  largestTrade: Trade | null
  connectedAt: number | null
  lastMessageAt: number | null
  priceChangePct: number | null // session open -> last
  minPriceInWindow: number | null
  maxPriceInWindow: number | null
  spreadBps: number | null // synthetic, derived from trade micro-moves
  // --- new: price history + cumulative volume delta (CVD) ---
  priceHistory: number[] // sampled ~1.5s, last 80 points (~2min)
  cvdHistory: number[] // session CVD sampled ~1.5s, last 80 points
  sessionCvd: number // running (buyVol - sellVol) in BTC, whole session
  sessionCvdNotional: number // running (buyNotional - sellNotional) in USDT
  windowCvd: number // (buyVol - sellVol) within the 30s window, in BTC
  windowCvdNotional: number
  blockTradeCount: number // trades with notional >= BLOCK_NOTIONAL
  blockTradeNotional: number
  lastBlockTrade: Trade | null
  blockThreshold: number // USDT notional threshold (for display)
  symbol: string // current stream symbol (e.g. "btcusdt")
}

const MAX_DISPLAY_TRADES = 55
const WINDOW_MS = 30_000 // 30s rolling window for pressure / intensity
const FLUSH_MS = 110 // commit buffer to state cadence
const MAX_WINDOW_TRADES = 1200
const HISTORY_SAMPLE_MS = 1500 // price + CVD sample cadence
const HISTORY_MAX = 80 // ~2min of history at 1.5s cadence
export const DEFAULT_BLOCK_NOTIONAL = 25_000 // USDT threshold for a "block" trade (fallback)

const INITIAL_STATS: StreamStats = {
  status: 'connecting',
  trades: [],
  lastPrice: null,
  prevPrice: null,
  sessionOpen: null,
  sessionHigh: null,
  sessionLow: null,
  totalTrades: 0,
  windowBuyVolume: 0,
  windowSellVolume: 0,
  windowBuyCount: 0,
  windowSellCount: 0,
  windowTradeCount: 0,
  windowBuyNotional: 0,
  windowSellNotional: 0,
  avgTradeSize: 0,
  lastTradeTime: null,
  reconnectAttempts: 0,
  messageRate: 0,
  messagesReceived: 0,
  vwap: null,
  largestTrade: null,
  connectedAt: null,
  lastMessageAt: null,
  priceChangePct: null,
  minPriceInWindow: null,
  maxPriceInWindow: null,
  spreadBps: null,
  priceHistory: [],
  cvdHistory: [],
  sessionCvd: 0,
  sessionCvdNotional: 0,
  windowCvd: 0,
  windowCvdNotional: 0,
  blockTradeCount: 0,
  blockTradeNotional: 0,
  lastBlockTrade: null,
  blockThreshold: DEFAULT_BLOCK_NOTIONAL,
  symbol: 'btcusdt',
}

export function useBinanceTradeStream(symbol = 'btcusdt', enabled = true, paused = false, blockThreshold?: number): StreamStats {
  const cfg = getSymbolConfig(symbol)
  const effectiveThreshold = blockThreshold ?? cfg.blockNotional
  const [stats, setStats] = useState<StreamStats>(() => ({ ...INITIAL_STATS, symbol, blockThreshold: effectiveThreshold }))

  const wsRef = useRef<WebSocket | null>(null)
  const bufferRef = useRef<Trade[]>([]) // unflushed incoming trades
  const windowRef = useRef<Trade[]>([]) // rolling window for stats
  const msgCountRef = useRef(0)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closedByUsRef = useRef(false)
  const pausedRef = useRef(paused)
  const blockThresholdRef = useRef(effectiveThreshold)

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])
  const sessionOpenRef = useRef<number | null>(null)
  const sessionHighRef = useRef<number | null>(null)
  const sessionLowRef = useRef<number | null>(null)
  const largestTradeRef = useRef<Trade | null>(null)
  const lastPriceRef = useRef<number | null>(null)
  const prevPriceRef = useRef<number | null>(null)
  const totalTradesRef = useRef(0)
  const messagesReceivedRef = useRef(0)
  const sessionCvdRef = useRef(0)
  const sessionCvdNotionalRef = useRef(0)
  const blockCountRef = useRef(0)
  const blockNotionalRef = useRef(0)
  const lastBlockRef = useRef<Trade | null>(null)

  // keep block threshold ref in sync + reset block stats when it changes
  useEffect(() => {
    blockThresholdRef.current = effectiveThreshold
    blockCountRef.current = 0
    blockNotionalRef.current = 0
    lastBlockRef.current = null
  }, [effectiveThreshold])
  const priceHistoryRef = useRef<number[]>([])
  const cvdHistoryRef = useRef<number[]>([])

  useEffect(() => {
    if (!enabled) return

    // --- reset all session state on symbol change ---
    bufferRef.current = []
    windowRef.current = []
    msgCountRef.current = 0
    sessionOpenRef.current = null
    sessionHighRef.current = null
    sessionLowRef.current = null
    largestTradeRef.current = null
    lastPriceRef.current = null
    prevPriceRef.current = null
    totalTradesRef.current = 0
    messagesReceivedRef.current = 0
    sessionCvdRef.current = 0
    sessionCvdNotionalRef.current = 0
    blockCountRef.current = 0
    blockNotionalRef.current = 0
    lastBlockRef.current = null
    priceHistoryRef.current = []
    cvdHistoryRef.current = []
    // state will be reset by the next flush cycle from the cleared refs

    const wsUrl = tradeWsUrl(symbol)

    let flushTimer: ReturnType<typeof setInterval> | null = null
    let rateTimer: ReturnType<typeof setInterval> | null = null
    let historyTimer: ReturnType<typeof setInterval> | null = null

    const computeWindowStats = (now: number) => {
      const isPaused = pausedRef.current
      if (!isPaused) {
        // only prune by time when NOT paused (snapshot mode freezes the window)
        const cutoff = now - WINDOW_MS
        let w = windowRef.current
        while (w.length > 0 && w[0].time < cutoff) {
          w.shift()
        }
        // prune by count
        if (w.length > MAX_WINDOW_TRADES) {
          w = w.slice(w.length - MAX_WINDOW_TRADES)
          windowRef.current = w
        }
      }
      const w = windowRef.current

      let buyVol = 0
      let sellVol = 0
      let buyCount = 0
      let sellCount = 0
      let buyNotional = 0
      let sellNotional = 0
      let notionalSum = 0
      let qtySum = 0
      let minP = Infinity
      let maxP = -Infinity

      for (const t of w) {
        if (t.side === 'BUY') {
          buyVol += t.qty
          buyCount += 1
          buyNotional += t.notional
        } else {
          sellVol += t.qty
          sellCount += 1
          sellNotional += t.notional
        }
        notionalSum += t.notional
        qtySum += t.qty
        if (t.price < minP) minP = t.price
        if (t.price > maxP) maxP = t.price
      }

      const avgTradeSize = w.length ? qtySum / w.length : 0
      const vwap = qtySum > 0 ? notionalSum / qtySum : null

      // synthetic spread proxy: average absolute tick move, expressed in bps
      let spreadBps: number | null = null
      if (w.length >= 4) {
        const mid = lastPriceRef.current
        if (mid && mid > 0) {
          const tail = w.slice(-16)
          let sumAbs = 0
          for (let i = 1; i < tail.length; i++) {
            sumAbs += Math.abs(tail[i].price - tail[i - 1].price)
          }
          const avgTick = sumAbs / Math.max(1, tail.length - 1)
          spreadBps = (avgTick / mid) * 10_000
        }
      }

      return {
        windowBuyVolume: buyVol,
        windowSellVolume: sellVol,
        windowBuyCount: buyCount,
        windowSellCount: sellCount,
        windowTradeCount: w.length,
        windowBuyNotional: buyNotional,
        windowSellNotional: sellNotional,
        avgTradeSize,
        vwap,
        minPriceInWindow: w.length ? minP : null,
        maxPriceInWindow: w.length ? maxP : null,
        spreadBps,
        windowCvd: buyVol - sellVol,
        windowCvdNotional: buyNotional - sellNotional,
      }
    }

    const flush = () => {
      const now = Date.now()
      if (bufferRef.current.length === 0) {
        // still refresh freshness-sensitive / window-pruned fields
        setStats((s) => ({
          ...s,
          ...computeWindowStats(now),
          blockThreshold: blockThresholdRef.current,
          blockTradeCount: blockCountRef.current,
          blockTradeNotional: blockNotionalRef.current,
          lastBlockTrade: lastBlockRef.current,
        }))
        return
      }
      const incoming = bufferRef.current
      bufferRef.current = []

      // update session high/low & largest trade + CVD + block trades from incoming
      for (const t of incoming) {
        if (sessionHighRef.current === null || t.price > sessionHighRef.current) {
          sessionHighRef.current = t.price
        }
        if (sessionLowRef.current === null || t.price < sessionLowRef.current) {
          sessionLowRef.current = t.price
        }
        if (sessionOpenRef.current === null) {
          sessionOpenRef.current = t.price
        }
        if (largestTradeRef.current === null || t.notional > largestTradeRef.current.notional) {
          largestTradeRef.current = t
        }
        if (lastPriceRef.current !== null) {
          prevPriceRef.current = lastPriceRef.current
        }
        lastPriceRef.current = t.price
        // cumulative volume delta (session)
        if (t.side === 'BUY') {
          sessionCvdRef.current += t.qty
          sessionCvdNotionalRef.current += t.notional
        } else {
          sessionCvdRef.current -= t.qty
          sessionCvdNotionalRef.current -= t.notional
        }
        // block-trade detection (absolute USDT threshold — ref for live updates)
        if (t.notional >= blockThresholdRef.current) {
          blockCountRef.current += 1
          blockNotionalRef.current += t.notional
          lastBlockRef.current = t
        }
      }

      const windowStats = computeWindowStats(now)
      const displayTrades = windowRef.current.slice(-MAX_DISPLAY_TRADES).reverse()

      const lastPrice = lastPriceRef.current
      const sessionOpen = sessionOpenRef.current
      const priceChangePct =
        lastPrice !== null && sessionOpen !== null && sessionOpen > 0
          ? ((lastPrice - sessionOpen) / sessionOpen) * 100
          : null

      setStats((s) => ({
        ...s,
        ...windowStats,
        trades: displayTrades,
        lastPrice,
        prevPrice: prevPriceRef.current,
        sessionOpen,
        sessionHigh: sessionHighRef.current,
        sessionLow: sessionLowRef.current,
        totalTrades: totalTradesRef.current,
        largestTrade: largestTradeRef.current,
        lastTradeTime: incoming[incoming.length - 1].time,
        lastMessageAt: Date.now(),
        messagesReceived: messagesReceivedRef.current,
        priceChangePct,
        sessionCvd: sessionCvdRef.current,
        sessionCvdNotional: sessionCvdNotionalRef.current,
        blockTradeCount: blockCountRef.current,
        blockTradeNotional: blockNotionalRef.current,
        lastBlockTrade: lastBlockRef.current,
        blockThreshold: blockThresholdRef.current,
        priceHistory: priceHistoryRef.current,
        cvdHistory: cvdHistoryRef.current,
      }))
    }

    const handleMessage = (raw: MessageEvent) => {
      messagesReceivedRef.current += 1
      msgCountRef.current += 1
      let data: Record<string, unknown>
      try {
        data = JSON.parse(raw.data as string)
      } catch {
        return
      }
      if (data.p === undefined || data.q === undefined) return
      const price = parseFloat(data.p as string)
      const qty = parseFloat(data.q as string)
      if (!Number.isFinite(price) || !Number.isFinite(qty)) return
      const time = typeof data.T === 'number' ? data.T : Date.now()
      const id = typeof data.t === 'number' ? data.t : time
      const isBuyerMaker = data.m === true
      const side: TradeSide = isBuyerMaker ? 'SELL' : 'BUY'
      const trade: Trade = {
        id,
        price,
        qty,
        time,
        side,
        notional: price * qty,
      }
      totalTradesRef.current += 1
      // tape pause: keep counting messages (msg rate stays live) but freeze
      // the display buffer + rolling window so the tape holds still
      if (pausedRef.current) return
      bufferRef.current.push(trade)
      windowRef.current.push(trade)
    }

    const connect = () => {
      let ws: WebSocket
      try {
        ws = new WebSocket(wsUrl)
      } catch {
        scheduleReconnect()
        return
      }
      wsRef.current = ws

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0
        setStats((s) => ({
          ...s,
          status: 'connected',
          connectedAt: Date.now(),
          reconnectAttempts: 0,
        }))
      }

      ws.onmessage = handleMessage

      ws.onerror = () => {
        // let onclose handle reconnect
      }

      ws.onclose = () => {
        if (closedByUsRef.current) return
        scheduleReconnect()
      }
    }

    const scheduleReconnect = () => {
      reconnectAttemptsRef.current += 1
      const attempt = reconnectAttemptsRef.current
      setStats((s) => ({
        ...s,
        status: attempt > 1 ? 'reconnecting' : 'connecting',
        reconnectAttempts: attempt,
      }))
      const delay = Math.min(1000 * Math.pow(1.6, attempt - 1), 8000)
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = setTimeout(() => {
        connect()
      }, delay)
    }

    connect()

    flushTimer = setInterval(flush, FLUSH_MS)
    rateTimer = setInterval(() => {
      const rate = msgCountRef.current
      msgCountRef.current = 0
      setStats((s) => ({ ...s, messageRate: rate }))
    }, 1000)

    // price + CVD history sampler (for sparklines) — freezes when paused
    historyTimer = setInterval(() => {
      if (pausedRef.current) return // snapshot mode: don't sample history
      const p = lastPriceRef.current
      if (p !== null) {
        const ph = priceHistoryRef.current
        ph.push(p)
        if (ph.length > HISTORY_MAX) ph.shift()
      }
      const cvd = sessionCvdRef.current
      const ch = cvdHistoryRef.current
      ch.push(cvd)
      if (ch.length > HISTORY_MAX) ch.shift()
      // commit to state so sparklines re-render
      setStats((s) => ({
        ...s,
        priceHistory: priceHistoryRef.current.slice(),
        cvdHistory: cvdHistoryRef.current.slice(),
      }))
    }, HISTORY_SAMPLE_MS)

    return () => {
      closedByUsRef.current = true
      if (flushTimer) clearInterval(flushTimer)
      if (rateTimer) clearInterval(rateTimer)
      if (historyTimer) clearInterval(historyTimer)
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.onerror = null
        wsRef.current.onmessage = null
        wsRef.current.onopen = null
        try {
          wsRef.current.close()
        } catch {
          /* noop */
        }
      }
      wsRef.current = null
    }
  }, [enabled, symbol, cfg.blockNotional])

  return stats
}
