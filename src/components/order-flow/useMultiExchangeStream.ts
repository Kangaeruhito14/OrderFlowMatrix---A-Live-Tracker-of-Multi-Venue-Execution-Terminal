'use client'

import { useEffect, useRef, useState } from 'react'
import { getAdapter, type ExchangeId, type NormalizedTrade, type StreamConfig, type StreamHealth, type MarketCategory, emptyHealth } from './adapters'

/**
 * Multi-exchange trade stream hook.
 *
 * Connects to any exchange via the adapter system. Uses WebSocket when
 * available, falls back to REST polling when WS fails or is unsupported.
 *
 * Strategy:
 *  1. Fire a REST bootstrap fetch immediately for instant data (no waiting
 *     for WS to connect + subscribe + first trade).
 *  2. Connect WebSocket in parallel.
 *  3. If WS receives trades within 8s, stop REST polling and go WS-only.
 *  4. If WS fails or receives 0 trades within 8s, keep REST polling.
 *  5. If WS disconnects later, resume REST polling automatically.
 */

export interface MultiStreamStats {
  health: StreamHealth
  trades: NormalizedTrade[]
  lastPrice: number | null
  prevPrice: number | null
  sessionOpen: number | null
  sessionHigh: number | null
  sessionLow: number | null
  totalTrades: number
  windowBuyVolume: number
  windowSellVolume: number
  windowBuyCount: number
  windowSellCount: number
  windowTradeCount: number
  windowBuyNotional: number
  windowSellNotional: number
  avgTradeSize: number
  lastTradeTime: number | null
  messageRate: number
  messagesReceived: number
  vwap: number | null
  largestTrade: NormalizedTrade | null
  priceChangePct: number | null
  minPriceInWindow: number | null
  maxPriceInWindow: number | null
  sessionCvd: number
  sessionCvdNotional: number
  windowCvd: number
  windowCvdNotional: number
  blockTradeCount: number
  blockTradeNotional: number
  lastBlockTrade: NormalizedTrade | null
  blockThreshold: number
  priceHistory: number[]
  cvdHistory: number[]
}

const MAX_DISPLAY_TRADES = 60
const WINDOW_MS = 30_000
const FLUSH_MS = 120
const MAX_WINDOW_TRADES = 1200
const DEFAULT_BLOCK_NOTIONAL = 25_000
const HISTORY_SAMPLE_MS = 1500
const HISTORY_MAX = 80
const WS_DATA_TIMEOUT_MS = 8000 // if no WS trades in 8s, rely on REST
const REST_BOOTSTRAP_POLL_MS = 3000 // REST poll interval during bootstrap/fallback
const NO_DATA_ERROR_MS = 15000 // if no trades at all in 15s, show error state

const INITIAL_STATS: MultiStreamStats = {
  health: emptyHealth('binance'),
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
  messageRate: 0,
  messagesReceived: 0,
  vwap: null,
  largestTrade: null,
  priceChangePct: null,
  minPriceInWindow: null,
  maxPriceInWindow: null,
  sessionCvd: 0,
  sessionCvdNotional: 0,
  windowCvd: 0,
  windowCvdNotional: 0,
  blockTradeCount: 0,
  blockTradeNotional: 0,
  lastBlockTrade: null,
  blockThreshold: DEFAULT_BLOCK_NOTIONAL,
  priceHistory: [],
  cvdHistory: [],
}

export function useMultiExchangeStream(
  exchange: ExchangeId,
  base: string,
  quote: string,
  category: MarketCategory = 'spot',
  enabled = true,
  paused = false,
  blockThreshold?: number,
): MultiStreamStats {
  const adapter = getAdapter(exchange)
  const threshold = blockThreshold ?? DEFAULT_BLOCK_NOTIONAL

  const [stats, setStats] = useState<MultiStreamStats>(() => ({
    ...INITIAL_STATS,
    health: emptyHealth(exchange),
    blockThreshold: threshold,
  }))

  const pausedRef = useRef(paused)
  const thresholdRef = useRef(threshold)

  useEffect(() => { pausedRef.current = paused }, [paused])
  useEffect(() => { thresholdRef.current = threshold }, [threshold])

  useEffect(() => {
    if (!enabled) return

    const config: StreamConfig = { exchange, base, quote, category }

    let ws: WebSocket | null = null
    let flushTimer: ReturnType<typeof setInterval> | null = null
    let rateTimer: ReturnType<typeof setInterval> | null = null
    let historyTimer: ReturnType<typeof setInterval> | null = null
    let restTimer: ReturnType<typeof setInterval> | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let wsDataTimeout: ReturnType<typeof setTimeout> | null = null
    let noDataTimeout: ReturnType<typeof setTimeout> | null = null
    let closedByUs = false
    let reconnectAttempts = 0
    let messagesReceived = 0
    let msgCount = 0
    let lastRate = 0
    let wsTradeCount = 0
    let restActive = false
    let lastRestTradeId: string | null = null

    const buffer: NormalizedTrade[] = []
    const window_: NormalizedTrade[] = []
    let lastPrice: number | null = null
    let prevPrice: number | null = null
    let sessionOpen: number | null = null
    let sessionHigh: number | null = null
    let sessionLow: number | null = null
    let totalTrades = 0
    let largestTrade: NormalizedTrade | null = null
    let sessionCvd = 0
    let sessionCvdNotional = 0
    let blockCount = 0
    let blockNotional = 0
    let lastBlock: NormalizedTrade | null = null
    const priceHistory: number[] = []
    const cvdHistory: number[] = []
    let health: StreamHealth = emptyHealth(exchange)

    const updateHealth = (patch: Partial<StreamHealth>) => {
      health = { ...health, ...patch }
    }

    // --- REST polling (used for bootstrap + fallback) ---
    const restUrl = adapter.restUrl(config)
    const startRestPolling = () => {
      if (restActive || !restUrl) return
      restActive = true

      const poll = async () => {
        try {
          const res = await fetch(restUrl)
          if (!res.ok) throw new Error('REST ' + res.status)
          const text = await res.text()
          const trades = adapter.parseRestResponse(text, config)
          messagesReceived += 1

          // Only add trades we haven't seen (dedup by id)
          let newCount = 0
          for (const t of trades) {
            if (lastRestTradeId === null || t.id !== lastRestTradeId) {
              if (!pausedRef.current) {
                buffer.push(t)
                window_.push(t)
              }
              newCount++
            }
          }
          if (trades.length > 0) lastRestTradeId = trades[0].id

          if (newCount > 0) {
            updateHealth({
              lastMessageAt: Date.now(),
              lastError: null,
              status: wsTradeCount > 0 ? 'connected' : 'fallback',
              isFallback: wsTradeCount === 0,
            })
          }
        } catch (e) {
          updateHealth({ lastError: e instanceof Error ? e.message : 'REST fetch failed' })
        }
      }

      void poll()
      restTimer = setInterval(poll, REST_BOOTSTRAP_POLL_MS)
    }

    const stopRestPolling = () => {
      restActive = false
      if (restTimer) { clearInterval(restTimer); restTimer = null }
    }

    // --- WebSocket connection ---
    const scheduleReconnect = () => {
      if (closedByUs) return
      reconnectAttempts += 1
      const attempt = reconnectAttempts
      const delay = Math.min(1000 * Math.pow(1.6, attempt - 1), 8000)
      updateHealth({ status: restActive ? 'fallback' : (attempt > 1 ? 'reconnecting' : 'connecting'), reconnectAttempts: attempt })
      if (reconnectTimer) clearTimeout(reconnectTimer)
      reconnectTimer = setTimeout(() => {
        if (!closedByUs) connectWs()
      }, delay)
    }

    const connectWs = () => {
      if (closedByUs) return
      const wsUrl = adapter.wsUrl(config)
      if (!wsUrl) {
        // No WS support — REST only
        updateHealth({ status: 'fallback', isFallback: true, connectedAt: Date.now() })
        startRestPolling()
        return
      }

      try {
        ws = new WebSocket(wsUrl)
      } catch {
        scheduleReconnect()
        return
      }

      ws.onopen = () => {
        reconnectAttempts = 0
        updateHealth({
          status: 'connected',
          connectedAt: Date.now(),
          reconnectAttempts: 0,
          isFallback: false,
          lastError: null,
        })
        const payload = adapter.wsSubscribePayload(config)
        if (payload) {
          try { ws!.send(payload) } catch { /* noop */ }
        }
        // Set a data timeout: if no WS trades arrive within WS_DATA_TIMEOUT_MS,
        // ensure REST is running as a fallback source
        if (wsDataTimeout) clearTimeout(wsDataTimeout)
        wsDataTimeout = setTimeout(() => {
          if (wsTradeCount === 0 && !closedByUs) {
            // WS connected but no trades — start REST as a secondary source
            startRestPolling()
          }
        }, WS_DATA_TIMEOUT_MS)
      }

      ws.onmessage = (raw: MessageEvent) => {
        messagesReceived += 1
        msgCount += 1
        const trades = adapter.parseWsMessage(raw.data as string, config)
        if (trades.length === 0) return

        // WS is delivering trades — stop REST polling if it was running
        if (wsTradeCount === 0) {
          // First WS trades received — stop REST bootstrap
          stopRestPolling()
          updateHealth({ status: 'connected', isFallback: false })
        }
        wsTradeCount += trades.length

        if (pausedRef.current) return
        for (const t of trades) {
          buffer.push(t)
          window_.push(t)
        }
      }

      ws.onerror = () => {
        updateHealth({ lastError: 'WebSocket error' })
      }

      ws.onclose = () => {
        if (closedByUs) return
        // WS dropped — start REST polling as fallback while we try to reconnect
        if (wsDataTimeout) { clearTimeout(wsDataTimeout); wsDataTimeout = null }
        startRestPolling()
        updateHealth({ status: 'fallback', isFallback: true })
        scheduleReconnect()
      }
    }

    // Start: REST bootstrap for instant data + WS in parallel
    startRestPolling()
    connectWs()

    // No-data timeout: if no trades arrive from any source within NO_DATA_ERROR_MS,
    // set health to 'disconnected' with an error message
    noDataTimeout = setTimeout(() => {
      if (totalTrades === 0 && !closedByUs) {
        updateHealth({
          status: 'disconnected',
          lastError: 'No data received — exchange may be unavailable in this region',
        })
      }
    }, NO_DATA_ERROR_MS)

    // flush timer
    flushTimer = setInterval(() => {
      const now = Date.now()
      const isPaused = pausedRef.current

      if (!isPaused) {
        const cutoff = now - WINDOW_MS
        while (window_.length > 0 && window_[0].time < cutoff) window_.shift()
        if (window_.length > MAX_WINDOW_TRADES) {
          window_.splice(0, window_.length - MAX_WINDOW_TRADES)
        }
      }

      const incoming = isPaused ? [] : buffer.splice(0, buffer.length)
      if (incoming.length > 0 && noDataTimeout) {
        clearTimeout(noDataTimeout)
        noDataTimeout = null
      }
      for (const t of incoming) {
        totalTrades += 1
        if (sessionHigh === null || t.price > sessionHigh) sessionHigh = t.price
        if (sessionLow === null || t.price < sessionLow) sessionLow = t.price
        if (sessionOpen === null) sessionOpen = t.price
        if (largestTrade === null || t.notional > largestTrade.notional) largestTrade = t
        if (lastPrice !== null) prevPrice = lastPrice
        lastPrice = t.price
        if (t.side === 'BUY') { sessionCvd += t.qty; sessionCvdNotional += t.notional }
        else { sessionCvd -= t.qty; sessionCvdNotional -= t.notional }
        if (t.notional >= thresholdRef.current) {
          blockCount += 1
          blockNotional += t.notional
          lastBlock = t
        }
      }

      let buyVol = 0, sellVol = 0, buyCount = 0, sellCount = 0
      let buyNotional = 0, sellNotional = 0, notionalSum = 0, qtySum = 0
      let minP = Infinity, maxP = -Infinity
      for (const t of window_) {
        if (t.side === 'BUY') { buyVol += t.qty; buyCount += 1; buyNotional += t.notional }
        else { sellVol += t.qty; sellCount += 1; sellNotional += t.notional }
        notionalSum += t.notional
        qtySum += t.qty
        if (t.price < minP) minP = t.price
        if (t.price > maxP) maxP = t.price
      }
      const avgTradeSize = window_.length ? qtySum / window_.length : 0
      const vwap = qtySum > 0 ? notionalSum / qtySum : null
      const priceChangePct = lastPrice !== null && sessionOpen !== null && sessionOpen > 0
        ? ((lastPrice - sessionOpen) / sessionOpen) * 100 : null

      const displayTrades = window_.slice(-MAX_DISPLAY_TRADES).reverse()

      setStats({
        health: { ...health },
        trades: displayTrades,
        lastPrice,
        prevPrice,
        sessionOpen,
        sessionHigh,
        sessionLow,
        totalTrades,
        windowBuyVolume: buyVol,
        windowSellVolume: sellVol,
        windowBuyCount: buyCount,
        windowSellCount: sellCount,
        windowTradeCount: window_.length,
        windowBuyNotional: buyNotional,
        windowSellNotional: sellNotional,
        avgTradeSize,
        lastTradeTime: window_.length > 0 ? window_[window_.length - 1].time : null,
        messageRate: lastRate,
        messagesReceived,
        vwap,
        largestTrade,
        priceChangePct,
        minPriceInWindow: window_.length > 0 ? minP : null,
        maxPriceInWindow: window_.length > 0 ? maxP : null,
        sessionCvd,
        sessionCvdNotional,
        windowCvd: buyVol - sellVol,
        windowCvdNotional: buyNotional - sellNotional,
        blockTradeCount: blockCount,
        blockTradeNotional: blockNotional,
        lastBlockTrade: lastBlock,
        blockThreshold: thresholdRef.current,
        priceHistory: priceHistory.slice(),
        cvdHistory: cvdHistory.slice(),
      })
    }, FLUSH_MS)

    rateTimer = setInterval(() => {
      lastRate = msgCount
      msgCount = 0
    }, 1000)

    historyTimer = setInterval(() => {
      if (pausedRef.current) return
      if (lastPrice !== null) {
        priceHistory.push(lastPrice)
        if (priceHistory.length > HISTORY_MAX) priceHistory.shift()
      }
      cvdHistory.push(sessionCvd)
      if (cvdHistory.length > HISTORY_MAX) cvdHistory.shift()
    }, HISTORY_SAMPLE_MS)

    return () => {
      closedByUs = true
      if (flushTimer) clearInterval(flushTimer)
      if (rateTimer) clearInterval(rateTimer)
      if (historyTimer) clearInterval(historyTimer)
      if (restTimer) clearInterval(restTimer)
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (wsDataTimeout) clearTimeout(wsDataTimeout)
      if (noDataTimeout) clearTimeout(noDataTimeout)
      if (ws) {
        ws.onclose = null
        ws.onerror = null
        ws.onmessage = null
        ws.onopen = null
        try { ws.close() } catch { /* noop */ }
      }
      ws = null
    }
  }, [enabled, exchange, base, quote, category, adapter])

  return stats
}
