'use client'

import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { EXCHANGE_METAS, type ExchangeId } from './adapters'

interface Props {
  selected: ExchangeId
  onSelect: (exchange: ExchangeId) => void
  connected: boolean
  isFallback: boolean
}

/**
 * Premium exchange selector dropdown.
 * Shows the current exchange with a colored status dot, and a dropdown
 * listing all supported venues with their WebSocket/REST capability.
 */
export default function ExchangeSelector({ selected, onSelect, connected, isFallback }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selectedMeta = EXCHANGE_METAS.find((m) => m.id === selected)!

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const dotColor = !connected ? 'var(--of-ask)' : isFallback ? 'var(--of-gold)' : 'var(--of-bid)'

  return (
    <div className="of-ex-sel" ref={ref}>
      <button
        type="button"
        className={'of-ex-sel-btn ' + (open ? 'open' : '')}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Select exchange"
      >
        <span className="of-ex-sel-dot" style={{ backgroundColor: dotColor, boxShadow: `0 0 6px ${dotColor}` }} />
        <span className="of-ex-sel-name">{selectedMeta.name}</span>
        {isFallback && <span className="of-ex-sel-fallback" title="REST fallback mode">REST</span>}
        <span className="of-ex-sel-caret">▾</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="of-ex-sel-menu"
          >
            {EXCHANGE_METAS.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  className={'of-ex-sel-opt ' + (m.id === selected ? 'active' : '')}
                  onClick={() => {
                    onSelect(m.id)
                    setOpen(false)
                  }}
                >
                  <span className="of-ex-sel-opt-dot" style={{ backgroundColor: m.color }} />
                  <span className="of-ex-sel-opt-name">{m.name}</span>
                  <span className="of-ex-sel-opt-mode">
                    {m.hasWebSocket ? 'WS' : 'REST'}
                  </span>
                  {m.id === selected && <span className="of-ex-sel-opt-check">✓</span>}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
