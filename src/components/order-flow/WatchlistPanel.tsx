'use client'

/**
 * WatchlistPanel — premium watchlist surface with auto-rotation controls.
 *
 * Renders the tracked-markets list with per-row select + remove, an AUTO
 * toggle in the header (dim when off, cyan when on), an interval selector
 * (5s / 10s / 30s) that appears when auto-rotate is enabled, and a subtle
 * progress bar that visualises time-until-next-rotation.
 *
 * The panel is purely presentational — it does NOT own the rotation timer
 * itself. The parent is expected to call `onSelectSymbol` on the configured
 * interval (the progress bar here simply tracks elapsed wall-clock time
 * within each rotation cycle and resets whenever the selection changes).
 *
 * Styling note: all class names use the `of-wl-*` prefix (no CSS is added to
 * the stylesheet by this file; the parent project's order-flow.css owns the
 * visual treatment).
 */

import { useState, useEffect, useRef } from 'react'
import type { WatchlistState } from './useWatchlist'

interface Props {
  watchlist: WatchlistState
  onSelectSymbol: (base: string, quote: string) => void
  selectedBase: string
  selectedQuote: string
}

/** Available rotation-interval presets (label + ms value). */
const INTERVAL_OPTIONS: { label: string; ms: number }[] = [
  { label: '5s', ms: 5000 },
  { label: '10s', ms: 10000 },
  { label: '30s', ms: 30000 },
]

export default function WatchlistPanel({
  watchlist,
  onSelectSymbol,
  selectedBase,
  selectedQuote,
}: Props) {
  const {
    symbols,
    autoRotate,
    rotateIntervalMs,
    toggleAutoRotate,
    setRotateInterval,
    removeSymbol,
  } = watchlist

  // Normalised "currently selected" composite key for row highlighting.
  const selectedKey =
    selectedBase && selectedQuote
      ? selectedBase.toUpperCase() + '/' + selectedQuote.toUpperCase()
      : ''

  // ---- progress-bar cycle tracking -------------------------------------
  // The bar fills 0..1 across each rotation interval. The cycle origin is
  // reset whenever auto-rotate turns on, the interval changes, or the
  // selection changes (the visible signal that a rotation just fired).
  const [progress, setProgress] = useState(0) // 0..1
  const cycleStartRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    cycleStartRef.current = Date.now()
    setProgress(0)
  }, [autoRotate, rotateIntervalMs, selectedKey])

  useEffect(() => {
    if (!autoRotate) {
      setProgress(0)
      return
    }
    const tick = () => {
      const start = cycleStartRef.current
      const elapsed = Date.now() - start
      const p = rotateIntervalMs > 0 ? (elapsed % rotateIntervalMs) / rotateIntervalMs : 0
      setProgress(p)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [autoRotate, rotateIntervalMs])

  const pct = Math.min(100, Math.max(0, progress * 100))

  return (
    <section className="of-panel of-watchlist">
      <span className="of-corner tl" />
      <span className="of-corner tr" />

      <div className="of-panel-head">
        <div className="of-panel-title">
          <span className="of-tag">Watchlist</span>
          <span>· Tracked Markets</span>
          <span className="of-wl-count" title={`${symbols.length} symbol${symbols.length === 1 ? '' : 's'} tracked`}>
            {symbols.length}
          </span>
        </div>
        <div className="of-wl-head-actions">
          <button
            type="button"
            className={'of-wl-auto-btn ' + (autoRotate ? 'on' : 'off')}
            onClick={toggleAutoRotate}
            aria-pressed={autoRotate}
            title={autoRotate ? 'Auto-rotate ON — click to stop' : 'Auto-rotate OFF — click to start'}
          >
            <span className="of-wl-auto-dot" aria-hidden="true" />
            AUTO
          </button>
        </div>
      </div>

      <div className="of-panel-body of-wl-body">
        {autoRotate && (
          <div className="of-wl-rotate">
            <div className="of-wl-interval" role="group" aria-label="Rotation interval">
              {INTERVAL_OPTIONS.map((opt) => (
                <button
                  key={opt.ms}
                  type="button"
                  className={'of-wl-int-opt ' + (rotateIntervalMs === opt.ms ? 'active' : '')}
                  onClick={() => setRotateInterval(opt.ms)}
                  title={`Rotate every ${opt.label}`}
                  aria-pressed={rotateIntervalMs === opt.ms}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div
              className="of-wl-progress"
              aria-hidden="true"
              title={`Next rotation in ${Math.max(0, ((rotateIntervalMs - (Date.now() - cycleStartRef.current)) / 1000)).toFixed(1)}s`}
            >
              <div className="of-wl-progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        {symbols.length === 0 ? (
          <div className="of-wl-empty">No symbols in watchlist. Add from Market Universe.</div>
        ) : (
          <div className="of-wl-list of-scroll" role="list" style={{ maxHeight: 200, overflowY: 'auto' }}>
            {symbols.map((entry) => {
              const active = entry.key === selectedKey
              return (
                <div
                  key={entry.key}
                  role="listitem"
                  className={'of-wl-row ' + (active ? 'active' : '')}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    className="of-wl-row-main"
                    onClick={() => onSelectSymbol(entry.base, entry.quote)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelectSymbol(entry.base, entry.quote)
                      }
                    }}
                    title={`Select ${entry.key}`}
                  >
                    <span className="of-wl-base">{entry.base}</span>
                    <span className="of-wl-quote">/{entry.quote}</span>
                  </div>
                  <button
                    type="button"
                    className="of-wl-remove"
                    onClick={() => removeSymbol(entry.key)}
                    title={`Remove ${entry.key} from watchlist`}
                    aria-label={`Remove ${entry.key} from watchlist`}
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
