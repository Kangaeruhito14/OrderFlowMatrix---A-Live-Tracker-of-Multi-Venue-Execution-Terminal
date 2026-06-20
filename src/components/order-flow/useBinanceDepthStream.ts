'use client'

import { useEffect, useRef, useState } from 'react'
import { depthWsUrl } from './symbols'

/**
 * Binance partial book depth stream hook.
 *
 * Connects to: wss://stream.binance.com:9443/ws/btcusdt@depth20@100ms
 *
 * Payload (top-20 levels, pushed every 100ms):
 *   {
 *     "lastUpdateId": 160,
 *     "bids": [["0.0024","10"], ...],   // [price, qty]  descending by price
 *     "asks": [["0.0026","100"], ...]   // [price, qty]  ascending by price
 *   }
 *
 * This is a *partial book* stream — each message is a full snapshot of the top
 * N levels, so no diff management is required; we simply replace the book.
 *
 * High-frequency handling: the latest snapshot is kept in a ref and committed
 * to React state on a ~200ms cadence (smooth enough for a ladder, ~5 renders/s).
 */

export interface DepthLevel {
  price: number
  qty: number
}

export interface DepthBook {
  bids: DepthLevel[] // sorted desc by price (best bid first)
  asks: DepthLevel[] // sorted asc by price (best ask first)
  lastUpdateId: number
  receivedAt: number
}

export interface DepthStats {
  status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected'
  book: DepthBook | null
  bestBid: number | null
  bestAsk: number | null
  midPrice: number | null
  spread: number | null // absolute
  spreadBps: number | null
  // cumulative depth at best-N levels (in BTC)
  bidDepthTop5: number
  askDepthTop5: number
  bidDepthTop10: number
  askDepthTop10: number
  bidDepthTop20: number
  askDepthTop20: number
  // notional depth (USDT)
  bidNotionalTop5: number
  askNotionalTop5: number
  bidNotionalTop20: number
  askNotionalTop20: number
  imbalance: number // -1 (all asks) .. +1 (all bids), top-20 basis
  reconnectAttempts: number
  messagesReceived: number
  lastMessageAt: number | null
  connectedAt: number | null
}

const FLUSH_MS = 200

const INITIAL: DepthStats = {
  status: 'connecting',
  book: null,
  bestBid: null,
  bestAsk: null,
  midPrice: null,
  spread: null,
  spreadBps: null,
  bidDepthTop5: 0,
  askDepthTop5: 0,
  bidDepthTop10: 0,
  askDepthTop10: 0,
  bidDepthTop20: 0,
  askDepthTop20: 0,
  bidNotionalTop5: 0,
  askNotionalTop5: 0,
  bidNotionalTop20: 0,
  askNotionalTop20: 0,
  imbalance: 0,
  reconnectAttempts: 0,
  messagesReceived: 0,
  lastMessageAt: null,
  connectedAt: null,
}

function parseLevels(raw: unknown, limit: number): DepthLevel[] {
  if (!Array.isArray(raw)) return []
  const out: DepthLevel[] = []
  for (let i = 0; i < Math.min(limit, raw.length); i++) {
    const e = raw[i]
    if (!Array.isArray(e) || e.length < 2) continue
    const price = parseFloat(e[0])
    const qty = parseFloat(e[1])
    if (!Number.isFinite(price) || !Number.isFinite(qty)) continue
    out.push({ price, qty })
  }
  return out
}

export function useBinanceDepthStream(symbol = 'btcusdt', enabled = true, paused = false): DepthStats {
  const [stats, setStats] = useState<DepthStats>(INITIAL)

  const wsRef = useRef<WebSocket | null>(null)
  const latestRef = useRef<DepthBook | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closedByUsRef = useRef(false)
  const messagesReceivedRef = useRef(0)
  const pausedRef = useRef(paused)

  // keep the ref in sync without re-running the WS effect (avoids reconnects)
  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    if (!enabled) return

    // reset on symbol change
    latestRef.current = null
    messagesReceivedRef.current = 0
    // state will be reset by the next flush cycle from the cleared refs

    const wsUrl = depthWsUrl(symbol)

    let flushTimer: ReturnType<typeof setInterval> | null = null

    const compute = (book: DepthBook | null): Partial<DepthStats> => {
      if (!book) return {}
      const bids = book.bids
      const asks = book.asks
      const bestBid = bids.length ? bids[0].price : null
      const bestAsk = asks.length ? asks[0].price : null
      const midPrice = bestBid !== null && bestAsk !== null ? (bestBid + bestAsk) / 2 : null
      const spread = bestBid !== null && bestAsk !== null ? bestAsk - bestBid : null
      const spreadBps =
        spread !== null && midPrice !== null && midPrice > 0 ? (spread / midPrice) * 10_000 : null

      let b5 = 0, a5 = 0, b10 = 0, a10 = 0, b20 = 0, a20 = 0
      let bn5 = 0, an5 = 0, bn20 = 0, an20 = 0
      for (let i = 0; i < bids.length; i++) {
        const lv = bids[i]
        b20 += lv.qty
        bn20 += lv.qty * lv.price
        if (i < 5) { b5 += lv.qty; bn5 += lv.qty * lv.price }
        if (i < 10) b10 += lv.qty
      }
      for (let i = 0; i < asks.length; i++) {
        const lv = asks[i]
        a20 += lv.qty
        an20 += lv.qty * lv.price
        if (i < 5) { a5 += lv.qty; an5 += lv.qty * lv.price }
        if (i < 10) a10 += lv.qty
      }
      const total = b20 + a20
      const imbalance = total > 0 ? (b20 - a20) / total : 0

      return {
        book,
        bestBid,
        bestAsk,
        midPrice,
        spread,
        spreadBps,
        bidDepthTop5: b5,
        askDepthTop5: a5,
        bidDepthTop10: b10,
        askDepthTop10: a10,
        bidDepthTop20: b20,
        askDepthTop20: a20,
        bidNotionalTop5: bn5,
        askNotionalTop5: an5,
        bidNotionalTop20: bn20,
        askNotionalTop20: an20,
        imbalance,
      }
    }

    const flush = () => {
      if (pausedRef.current) return // global freeze: keep connection, freeze display
      setStats((s) => ({
        ...s,
        ...compute(latestRef.current),
        messagesReceived: messagesReceivedRef.current,
        lastMessageAt: latestRef.current ? Date.now() : s.lastMessageAt,
      }))
    }

    const handleMessage = (raw: MessageEvent) => {
      messagesReceivedRef.current += 1
      let data: Record<string, unknown>
      try {
        data = JSON.parse(raw.data as string)
      } catch {
        return
      }
      if (!Array.isArray(data.bids) || !Array.isArray(data.asks)) return
      const book: DepthBook = {
        bids: parseLevels(data.bids, 20),
        asks: parseLevels(data.asks, 20),
        lastUpdateId: typeof data.lastUpdateId === 'number' ? data.lastUpdateId : 0,
        receivedAt: Date.now(),
      }
      if (book.bids.length === 0 && book.asks.length === 0) return
      latestRef.current = book
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
      ws.onerror = () => { /* let onclose handle */ }
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
      reconnectTimerRef.current = setTimeout(connect, delay)
    }

    connect()
    flushTimer = setInterval(flush, FLUSH_MS)

    return () => {
      closedByUsRef.current = true
      if (flushTimer) clearInterval(flushTimer)
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.onerror = null
        wsRef.current.onmessage = null
        wsRef.current.onopen = null
        try { wsRef.current.close() } catch { /* noop */ }
      }
      wsRef.current = null
    }
  }, [enabled, symbol])

  return stats
}
