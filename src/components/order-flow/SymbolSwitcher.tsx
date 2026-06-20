'use client'

import { SYMBOLS, type SymbolConfig } from './symbols'

interface Props {
  current: string
  onSelect: (stream: string) => void
  /** connection status of the active symbol's trade stream */
  connected: boolean
}

/**
 * Compact institutional symbol switcher.
 * Renders a segmented control of available trading pairs.
 * The active button shows a connection LED (green = live, amber = connecting).
 */
export default function SymbolSwitcher({ current, onSelect, connected }: Props) {
  return (
    <div className="of-symbol-switcher" role="tablist" aria-label="Select trading symbol">
      {SYMBOLS.map((s: SymbolConfig) => {
        const active = s.stream === current
        return (
          <button
            key={s.stream}
            type="button"
            role="tab"
            aria-selected={active}
            className={'of-sym-btn ' + (active ? 'active' : '')}
            onClick={() => onSelect(s.stream)}
            title={`${s.pair} · Binance Spot`}
          >
            {active && (
              <span
                className={'of-sym-led ' + (connected ? 'on' : 'warn')}
                aria-label={connected ? 'connected' : 'connecting'}
              />
            )}
            <span className="of-sym-base">{s.base}</span>
            <span className="of-sym-quote">/{s.quote}</span>
          </button>
        )
      })}
    </div>
  )
}
