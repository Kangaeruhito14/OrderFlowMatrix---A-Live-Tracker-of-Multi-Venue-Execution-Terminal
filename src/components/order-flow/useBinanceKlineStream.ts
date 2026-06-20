'use client'

import { useEffect, useRef, useState } from 'react'
import { klineWsUrl, klineRestUrl, type KlineInterval } from './symbols'

/**
 * Binance kline (candlestick) stream hook with REST backfill.
 *
 * On symbol/interval change:
 *   1. Fetch the last MAX_CANDLES historical candles via REST
 *      (https://api.binance.com/api/v3/klines) so the chart is instantly
 *      populated instead of filling over an hour.
 *   2. Connect to the live kline WebSocket stream and update the forming
 *      candle in place / append closed candles.
 *
 * WebSocket payload "k" object fields:
 *   t -> open time (ms), T -> close time (ms),
 *   o/c/h/l -> open/close/high/low (strings),
 *   v -> base volume (string), x -> is kline closed? (boolean)
 *
 * REST klines response: array of arrays
 *   [openTime, open, high, low, close, volume, closeTime, ...]
 */

export interface Candle {
  openTime: number
  closeTime: number
  open: number
  high: number
  low: number
  close: number
  volume: number // base asset volume
  closed: boolean
}

export interface KlineStats {
  status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected'
  backfillStatus: 'idle' | 'loading' | 'done' | 'error'
  candles: Candle[]
  lastClose: number | null
  prevClose: number | null
  sessionHigh: number | null // max high across buffer
  sessionLow: number | null // min low across buffer
  reconnectAttempts: number
  messagesReceived: number
  connectedAt: number | null
  lastMessageAt: number | null
  interval: KlineInterval
}

const MAX_CANDLES = 60
const FLUSH_MS = 500

const INITIAL: KlineStats = {
  status: 'connecting',
  backfillStatus: 'idle',
  candles: [],
  lastClose: null,
  prevClose: null,
  sessionHigh: null,
  sessionLow: null,
  reconnectAttempts: 0,
  messagesReceived: 0,
  connectedAt: null,
  lastMessageAt: null,
  interval: '1m',
}

function parseRestKlines(raw: unknown): Candle[] {
  if (!Array.isArray(raw)) return []
  const out: Candle[] = []
  for (const row of raw) {
    if (!Array.isArray(row) || row.length < 7) continue
    const openTime = typeof row[0] === 'number' ? row[0] : 0
    const open = parseFloat(row[1])
    const high = parseFloat(row[2])
    const low = parseFloat(row[3])
    const close = parseFloat(row[4])
    const volume = parseFloat(row[5])
    const closeTime = typeof row[6] === 'number' ? row[6] : 0
    if (![open, high, low, close, volume].every(Number.isFinite)) continue
    // the last REST candle is the currently-forming one; mark it not closed
    out.push({ openTime, closeTime, open, high, low, close, volume, closed: false })
  }
  // mark all but the last as closed
  for (let i = 0; i < out.length - 1; i++) out[i].closed = true
  return out
}

export function useBinanceKlineStream(
  symbol = 'btcusdt',
  interval: KlineInterval = '1m',
  enabled = true,
  paused = false,
): KlineStats {
  const [stats, setStats] = useState<KlineStats>(INITIAL)

  const wsRef = useRef<WebSocket | null>(null)
  const candlesRef = useRef<Candle[]>([])
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closedByUsRef = useRef(false)
  const messagesReceivedRef = useRef(0)
  const lastCloseRef = useRef<number | null>(null)
  const prevCloseRef = useRef<number | null>(null)
  const statusRef = useRef<'connecting' | 'connected' | 'reconnecting' | 'disconnected'>('connecting')
  const connectedAtRef = useRef<number | null>(null)
  const backfillStatusRef = useRef<'idle' | 'loading' | 'done' | 'error'>('idle')
  const pausedRef = useRef(paused)

  // keep the ref in sync without re-running the WS effect (avoids reconnects)
  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    // reset on symbol/interval change
    candlesRef.current = []
    messagesReceivedRef.current = 0
    lastCloseRef.current = null
    prevCloseRef.current = null
    statusRef.current = 'connecting'
    connectedAtRef.current = null
    backfillStatusRef.current = 'loading'

    const wsUrl = klineWsUrl(symbol, interval)

    let flushTimer: ReturnType<typeof setInterval> | null = null

    const flush = () => {
      if (cancelled) return
      if (pausedRef.current) return // global freeze: keep connection, freeze chart
      const candles = candlesRef.current
      let hi: number | null = null
      let lo: number | null = null
      for (const c of candles) {
        if (hi === null || c.high > hi) hi = c.high
        if (lo === null || c.low < lo) lo = c.low
      }
      setStats({
        status: statusRef.current,
        backfillStatus: backfillStatusRef.current,
        candles: candles.slice(),
        lastClose: lastCloseRef.current,
        prevClose: prevCloseRef.current,
        sessionHigh: hi,
        sessionLow: lo,
        reconnectAttempts: reconnectAttemptsRef.current,
        messagesReceived: messagesReceivedRef.current,
        connectedAt: connectedAtRef.current,
        lastMessageAt: Date.now(),
        interval,
      })
    }

    // --- REST backfill: fetch historical candles so the chart is instant ---
    // Retries once with a 1.5s backoff on failure (network error or non-2xx).
    const doFetch = async (): Promise<boolean> => {
      const res = await fetch(klineRestUrl(symbol, interval, MAX_CANDLES))
      if (!res.ok) throw new Error('klines REST ' + res.status)
      const json = await res.json()
      if (cancelled) return false
      const historical = parseRestKlines(json)
      if (historical.length > 0) {
        // only adopt if we haven't already received live data that supersedes it
        if (candlesRef.current.length === 0) {
          candlesRef.current = historical.slice(-MAX_CANDLES)
          const last = historical[historical.length - 1]
          if (last && last.closeTime < Date.now() + 60_000) {
            lastCloseRef.current = last.close
            const prev = historical[historical.length - 2]
            if (prev) prevCloseRef.current = prev.close
          }
        }
        backfillStatusRef.current = 'done'
        return true
      }
      throw new Error('klines REST empty')
    }

    const backfill = async () => {
      try {
        await doFetch()
      } catch {
        if (cancelled) return
        // single retry with backoff
        await new Promise((r) => setTimeout(r, 1500))
        if (cancelled) return
        try {
          await doFetch()
        } catch {
          if (!cancelled) backfillStatusRef.current = 'error'
        }
      }
    }
    void backfill()

    const handleMessage = (raw: MessageEvent) => {
      messagesReceivedRef.current += 1
      let data: Record<string, unknown>
      try {
        data = JSON.parse(raw.data as string)
      } catch {
        return
      }
      const k = data.k as Record<string, unknown> | undefined
      if (!k) return
      const openTime = typeof k.t === 'number' ? k.t : 0
      const closeTime = typeof k.T === 'number' ? k.T : 0
      const open = parseFloat(k.o as string)
      const high = parseFloat(k.h as string)
      const low = parseFloat(k.l as string)
      const close = parseFloat(k.c as string)
      const volume = parseFloat(k.v as string)
      const closed = k.x === true
      if (![open, high, low, close, volume].every(Number.isFinite)) return

      const candle: Candle = { openTime, closeTime, open, high, low, close, volume, closed }

      const arr = candlesRef.current
      const last = arr.length > 0 ? arr[arr.length - 1] : null
      if (last && last.openTime === openTime) {
        // update the forming candle in place
        arr[arr.length - 1] = candle
      } else if (last && openTime > last.openTime) {
        // a new candle arrived; mark the previous as closed and append
        arr[arr.length - 1] = { ...last, closed: true }
        arr.push(candle)
        if (arr.length > MAX_CANDLES) arr.shift()
        prevCloseRef.current = last.close
        lastCloseRef.current = close
      } else {
        // no prior candle (e.g. backfill not yet adopted) — just append
        arr.push(candle)
        if (arr.length > MAX_CANDLES) arr.shift()
      }

      // track live close for the forming candle
      if (lastCloseRef.current !== close) {
        if (!closed) {
          // only update prevClose when the value actually changes meaningfully
        }
        lastCloseRef.current = close
      }
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
        statusRef.current = 'connected'
        connectedAtRef.current = Date.now()
        setStats((s) => ({
          ...s,
          status: 'connected',
          connectedAt: Date.now(),
          reconnectAttempts: 0,
          interval,
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
      const st = attempt > 1 ? 'reconnecting' : 'connecting'
      statusRef.current = st
      setStats((s) => ({
        ...s,
        status: st,
        reconnectAttempts: attempt,
      }))
      const delay = Math.min(1000 * Math.pow(1.6, attempt - 1), 8000)
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = setTimeout(connect, delay)
    }

    connect()
    flushTimer = setInterval(flush, FLUSH_MS)

    return () => {
      cancelled = true
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
  }, [enabled, symbol, interval])

  return stats
}
