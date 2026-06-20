'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { NormalizedTrade } from './adapters'

/**
 * Block-trade alert system.
 *
 * Watches the trade stream's `lastBlockTrade` and fires a toast + optional
 * audio beep whenever a NEW block trade is detected (by id). Toasts auto-dismiss
 * after 5s. Audio uses the Web Audio API (no asset files needed) — a short
 * dual-tone beep, higher pitch for buy blocks, lower for sell blocks.
 */

export interface BlockAlert {
  id: string
  key: string
  trade: NormalizedTrade
  at: number
  symbol: string
}

export interface BlockAlertState {
  alerts: BlockAlert[]
  history: BlockAlert[]
  soundOn: boolean
  hydrated: boolean
  toggleSound: () => void
  dismiss: (key: string) => void
  clearHistory: () => void
}

const MAX_ALERTS = 4
const ALERT_TTL = 5000
const MAX_HISTORY = 40
const HISTORY_STORAGE_KEY = 'ofm-alert-history'
const SOUND_STORAGE_KEY = 'ofm-alert-sound'

function loadHistory(): BlockAlert[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.slice(0, MAX_HISTORY)
  } catch {
    return []
  }
}

function loadSoundPref(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(SOUND_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function useBlockTradeAlerts(lastBlockTrade: NormalizedTrade | null, enabled = true, symbol = 'btcusdt'): BlockAlertState {
  const [alerts, setAlerts] = useState<BlockAlert[]>([])
  // Initialize to empty on BOTH server and client to avoid hydration mismatch;
  // hydrate from localStorage in an effect after mount.
  const [history, setHistory] = useState<BlockAlert[]>([])
  const [soundOn, setSoundOn] = useState<boolean>(false)
  const [hydrated, setHydrated] = useState(false)
  const lastIdRef = useRef<string | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // create the audio context lazily (must be after a user gesture in some browsers)
  const ensureAudioCtx = useCallback(() => {
    if (typeof window === 'undefined') return null
    if (!audioCtxRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (AC) {
        try {
          audioCtxRef.current = new AC()
        } catch {
          return null
        }
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      void audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }, [])

  const playBeep = useCallback((isBuy: boolean) => {
    const ctx = ensureAudioCtx()
    if (!ctx) return
    const now = ctx.currentTime
    // two quick tones for a distinctive "blip"
    const freqs = isBuy ? [880, 1320] : [660, 440]
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = f
      const start = now + i * 0.09
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.12, start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.2)
    })
  }, [ensureAudioCtx])

  const dismiss = useCallback((key: string) => {
    setAlerts((prev) => prev.filter((a) => a.key !== key))
    const t = timersRef.current.get(key)
    if (t) {
      clearTimeout(t)
      timersRef.current.delete(key)
    }
  }, [])

  const toggleSound = useCallback(() => {
    setSoundOn((prev) => {
      const next = !prev
      if (next) ensureAudioCtx() // unlock audio on user gesture
      try { window.localStorage.setItem(SOUND_STORAGE_KEY, next ? '1' : '0') } catch { /* noop */ }
      return next
    })
  }, [ensureAudioCtx])

  const clearHistory = useCallback(() => {
    setHistory([])
    try { window.localStorage.removeItem(HISTORY_STORAGE_KEY) } catch { /* noop */ }
  }, [])

  // Hydrate from localStorage AFTER mount to avoid SSR/client mismatch.
  // The server renders with empty history + sound off; the client's first
  // paint matches (empty), then this effect populates the real values.
  // Deferred via microtask to avoid cascading-render lint warnings.
  useEffect(() => {
    queueMicrotask(() => {
      setHistory(loadHistory())
      setSoundOn(loadSoundPref())
      setHydrated(true)
    })
  }, [])

  // persist history to localStorage (debounced via microtask)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!hydrated) return // don't overwrite stored data before we've loaded it
    try {
      if (history.length === 0) {
        window.localStorage.removeItem(HISTORY_STORAGE_KEY)
      } else {
        window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
      }
    } catch { /* noop */ }
  }, [history, hydrated])

  // watch for new block trades
  useEffect(() => {
    if (!enabled || !lastBlockTrade) return
    if (lastIdRef.current === null) {
      // first block seen — don't alert on the very first one (could be stale)
      lastIdRef.current = lastBlockTrade.id
      return
    }
    if (lastBlockTrade.id === lastIdRef.current) return
    lastIdRef.current = lastBlockTrade.id

    const key = lastBlockTrade.id + '-' + lastBlockTrade.time
    const alert: BlockAlert = {
      id: lastBlockTrade.id,
      key,
      trade: lastBlockTrade,
      at: Date.now(),
      symbol,
    }

    // defer state update out of the synchronous effect body to avoid
    // cascading-render lint warnings; audio + timer setup are side-effects
    queueMicrotask(() => {
      setAlerts((prev) => {
        const next = [alert, ...prev]
        return next.slice(0, MAX_ALERTS)
      })
      setHistory((prev) => {
        const next = [alert, ...prev]
        return next.slice(0, MAX_HISTORY)
      })
    })

    if (soundOn) {
      playBeep(lastBlockTrade.side === 'BUY')
    }

    // auto-dismiss
    const t = setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.key !== key))
      timersRef.current.delete(key)
    }, ALERT_TTL)
    timersRef.current.set(key, t)
  }, [lastBlockTrade, enabled, soundOn, playBeep, symbol])

  // cleanup timers on unmount
  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((t) => clearTimeout(t))
      timers.clear()
    }
  }, [])

  return { alerts, history, soundOn, hydrated, toggleSound, dismiss, clearHistory }
}
