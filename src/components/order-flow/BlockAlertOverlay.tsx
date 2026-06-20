'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { BlockAlertState } from './useBlockTradeAlerts'
import { useSymbolConfig } from './SymbolContext'
import { fmtPrice, fmtQty, fmtNotional } from './format'
import { useEffect, useState } from 'react'

const SOUND_HINT_KEY = 'ofm-sound-hint-seen'

interface Props {
  alertState: BlockAlertState
}

export default function BlockAlertOverlay({ alertState }: Props) {
  const cfg = useSymbolConfig()
  const { alerts, soundOn, hydrated, toggleSound, dismiss } = alertState
  const [showHint, setShowHint] = useState(false)

  // show a first-visit hint pointing at the sound toggle if the user hasn't
  // interacted with it yet (and hasn't dismissed the hint before)
  useEffect(() => {
    if (!hydrated) return
    try {
      const seen = window.localStorage.getItem(SOUND_HINT_KEY) === '1'
      const soundPrefSeen = window.localStorage.getItem('ofm-alert-sound') !== null
      if (!seen && !soundPrefSeen && !soundOn) {
        const t = setTimeout(() => setShowHint(true), 1800)
        return () => clearTimeout(t)
      }
    } catch { /* noop */ }
  }, [hydrated, soundOn])

  const dismissHint = () => {
    setShowHint(false)
    try { window.localStorage.setItem(SOUND_HINT_KEY, '1') } catch { /* noop */ }
  }

  return (
    <>
      {/* sound toggle — fixed top-right */}
      <div className="of-alert-sound-wrap">
        <button
          type="button"
          className={'of-alert-sound-toggle ' + (soundOn ? 'on' : 'off')}
          onClick={() => {
            toggleSound()
            dismissHint()
          }}
          aria-pressed={soundOn}
          title={soundOn ? 'Mute block-trade alerts' : 'Enable block-trade sound alerts'}
        >
          <span className="of-alert-sound-icon">{soundOn ? '♪' : '♪̸'}</span>
          <span className="of-alert-sound-label">{soundOn ? 'SOUND ON' : 'MUTED'}</span>
        </button>

        <AnimatePresence>
          {showHint && !soundOn && (
            <motion.div
              initial={{ opacity: 0, x: 12, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 12, scale: 0.92 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="of-sound-hint"
              role="status"
            >
              <span className="of-sound-hint-arrow">◀</span>
              <div className="of-sound-hint-body">
                <b>Enable sound alerts</b>
                <span>Get an audible beep when block trades hit the tape.</span>
              </div>
              <button
                type="button"
                className="of-sound-hint-close"
                onClick={dismissHint}
                aria-label="Dismiss hint"
              >
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* toast stack — fixed top-center */}
      <div className="of-alert-stack" aria-live="assertive" aria-atomic="false">
        <AnimatePresence initial={false}>
          {alerts.map((a) => {
            const isBuy = a.trade.side === 'BUY'
            return (
              <motion.div
                key={a.key}
                layout
                initial={{ opacity: 0, y: -24, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: 0.9 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={'of-alert-toast ' + (isBuy ? 'buy' : 'sell')}
                onClick={() => dismiss(a.key)}
                role="alert"
              >
                <div className="of-alert-glow" />
                <div className="of-alert-head">
                  <span className="of-alert-badge">BLOCK</span>
                  <span className={'of-alert-side ' + (isBuy ? 'buy' : 'sell')}>
                    {isBuy ? '▲ BUY' : '▼ SELL'}
                  </span>
                  <span className="of-alert-close" title="dismiss">×</span>
                </div>
                <div className="of-alert-body">
                  <span className="of-alert-pair">{cfg.pair}</span>
                  <span className="of-alert-price">{fmtPrice(a.trade.price, cfg.priceDigits)}</span>
                  <span className="of-alert-qty">{fmtQty(a.trade.qty, cfg.qtyDigits)} {cfg.base}</span>
                  <span className="of-alert-notional">{fmtNotional(a.trade.notional)} USDT</span>
                </div>
                <div className="of-alert-foot">
                  <span className="of-alert-thresh">≥ ${cfg.blockNotional.toLocaleString()} threshold</span>
                  <span className="of-alert-time">{new Date(a.trade.time).toLocaleTimeString('en-US', { hour12: false })}</span>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </>
  )
}

