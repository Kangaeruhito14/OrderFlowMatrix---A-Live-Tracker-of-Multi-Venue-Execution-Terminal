'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { MultiStreamStats } from './useMultiExchangeStream'
import { fmtInt, fmtAge } from './format'
import { getAdapter } from './adapters'

interface Props {
  stats: MultiStreamStats
  now: number
}

const RATE_BARS = 24
const LATENCY_BARS = 30 // ~30s of latency history

export default function StreamHealth({ stats, now }: Props) {
  const [rateBars, setRateBars] = useState<number[]>(() => new Array(RATE_BARS).fill(0))
  const [latencyBars, setLatencyBars] = useState<number[]>(() => new Array(LATENCY_BARS).fill(0))
  const lastRateRef = useRef(0)
  const lastMsgCountRef = useRef(0)
  const lastSampleRef = useRef(Date.now())

  // message-rate bar meter (msg/s normalized)
  useEffect(() => {
    const id = setInterval(() => {
      setRateBars((prev) => {
        const next = prev.slice(1)
        next.push(Math.min(1, lastRateRef.current / 40))
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    lastRateRef.current = stats.messageRate
  }, [stats.messageRate])

  // latency histogram: sample inter-message gap each second.
  // Gap = time since last message; lower = healthier. Capped at 3s for scaling.
  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now()
      const lastMsgAt = stats.lastMessageAt
      let gap = 1.0 // default healthy (green) when no data yet
      if (lastMsgAt !== null) {
        gap = (t - lastMsgAt) / 1000
      }
      // normalize: 0s → 0 (best), ≥2s → 1 (worst)
      const normalized = Math.max(0, Math.min(1, gap / 2))
      setLatencyBars((prev) => {
        const next = prev.slice(1)
        next.push(normalized)
        return next
      })
      lastSampleRef.current = t
    }, 1000)
    return () => clearInterval(id)
  }, [stats.health.lastMessageAt])

  const status = stats.health.status
  const ledClass = status === 'connected' ? 'ok' : status === 'fallback' ? 'warn' : status === 'reconnecting' || status === 'connecting' ? 'warn' : 'err'
  const stateClass = ledClass
  const stateLabel =
    status === 'connected'
      ? 'Connected'
      : status === 'fallback'
        ? 'REST Fallback'
        : status === 'reconnecting'
          ? 'Reconnecting'
          : status === 'connecting'
            ? 'Handshaking'
            : 'Disconnected'

  // freshness: time since last message (clamp to >= 0)
  const rawStale = stats.health.lastMessageAt ? now - stats.health.lastMessageAt : null
  const staleMs = rawStale !== null ? Math.max(0, rawStale) : null
  const freshPct =
    staleMs === null ? 0 : Math.max(0, Math.min(100, 100 - (staleMs / 3000) * 100))
  const freshClass = staleMs === null ? 'err' : staleMs > 2000 ? 'err' : staleMs > 800 ? 'warn' : 'ok'
  const freshLabel =
    staleMs === null ? 'no data' : staleMs > 2000 ? 'stale' : staleMs > 800 ? 'lagging' : 'fresh'

  // current latency readout (clamp to >= 0; the 1s `now` clock can lag the stream)
  const curLatencyMs = staleMs !== null ? Math.max(0, Math.round(staleMs)) : null
  // average latency over the histogram window
  const avgLatency = latencyBars.reduce((a, b) => a + b, 0) / latencyBars.length
  const avgLatencyMs = Math.max(0, Math.round(avgLatency * 2000))

  return (
    <section className="of-panel">
      <span className="of-corner tl" />
      <span className="of-corner tr" />
      <div className="of-panel-head">
        <div className="of-panel-title">
          <span className="of-tag">Stream Health</span>
          <span>· Connection Telemetry</span>
        </div>
        <div className="of-panel-meta">live diagnostics</div>
      </div>
      <div className="of-panel-body">
        <div className="of-health-conn">
          <div className={'of-conn-led ' + ledClass} />
          <div className="of-conn-text">
            <span className={'of-conn-state ' + stateClass}>{stateLabel}</span>
            <span className="of-conn-endpoint">{getAdapter(stats.health.exchange).meta.name} · {stats.health.isFallback ? 'REST Polling' : 'WebSocket'}</span>
          </div>
        </div>

        <div className="of-health-grid">
          <div className="of-health-cell">
            <span className="lab">Messages</span>
            <span className="val">{fmtInt(stats.health.messagesReceived)}</span>
          </div>
          <div className="of-health-cell">
            <span className="lab">Reconnects</span>
            <span className={'val ' + (stats.health.reconnectAttempts > 0 ? 'warn' : 'ok')}>
              {fmtInt(stats.health.reconnectAttempts)}
            </span>
          </div>
          <div className="of-health-cell">
            <span className="lab">Uptime</span>
            <span className="val">{stats.health.connectedAt ? fmtAge(now - stats.health.connectedAt) : '—'}</span>
          </div>
          <div className="of-health-cell">
            <span className="lab">Last Msg</span>
            <span className="val">{stats.health.lastMessageAt ? fmtAge(now - stats.health.lastMessageAt) : '—'}</span>
          </div>
        </div>

        {/* message rate meter */}
        <div className="of-rate-meter">
          <div className="of-rate-bars">
            {rateBars.map((r, i) => {
              const h = Math.max(2, r * 20)
              const color = r > 0.75 ? 'var(--of-gold)' : r > 0.4 ? 'var(--of-bid)' : 'var(--of-border-strong)'
              return (
                <motion.div
                  key={i}
                  className="of-rate-bar"
                  animate={{ height: h, backgroundColor: color }}
                  transition={{ duration: 0.2 }}
                />
              )
            })}
          </div>
          <div className="of-rate-readout">
            <b>{fmtInt(stats.messageRate)}</b> msg/s
          </div>
        </div>

        {/* latency graph */}
        <div className="of-latency">
          <div className="of-latency-head">
            <span className="of-latency-label">Latency</span>
            <span className="of-latency-readout">
              <span className="of-latency-cur" style={{ color: freshClass === 'ok' ? 'var(--of-bid)' : freshClass === 'warn' ? 'var(--of-gold)' : 'var(--of-ask)' }}>
                {curLatencyMs !== null ? curLatencyMs + 'ms' : '—'}
              </span>
              <span className="of-latency-avg">avg {avgLatencyMs}ms</span>
            </span>
          </div>
          <div className="of-latency-graph">
            {latencyBars.map((l, i) => {
              const h = Math.max(2, l * 28)
              const color = l < 0.15 ? 'var(--of-bid)' : l < 0.5 ? 'var(--of-gold)' : 'var(--of-ask)'
              return (
                <motion.div
                  key={i}
                  className="of-latency-bar"
                  animate={{ height: h, backgroundColor: color }}
                  transition={{ duration: 0.2 }}
                />
              )
            })}
          </div>
          <div className="of-latency-scale">
            <span>30s ago</span>
            <span>now</span>
          </div>
        </div>

        {/* freshness */}
        <div className="of-freshness">
          <div className="of-freshness-labels">
            <span>Data Freshness</span>
            <span style={{ color: freshClass === 'ok' ? 'var(--of-bid)' : freshClass === 'warn' ? 'var(--of-gold)' : 'var(--of-ask)' }}>
              {freshLabel}{staleMs !== null ? ' · ' + staleMs + 'ms' : ''}
            </span>
          </div>
          <div className="of-freshness-track">
            <motion.div
              className={'of-freshness-fill ' + freshClass}
              animate={{ width: freshPct + '%' }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
