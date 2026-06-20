'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export interface UseKeyboardShortcutsParams {
  onTogglePause: () => void
  onToggleFreeze: () => void
  onToggleSound: () => void
  onDismissOverlays: () => void
}

export function useKeyboardShortcuts(opts: UseKeyboardShortcutsParams): {
  shortcutsVisible: boolean
  dismissShortcuts: () => void
} {
  const [shortcutsVisible, setShortcutsVisible] = useState(false)

  // Store callbacks in refs to avoid re-attaching the listener
  const onTogglePauseRef = useRef(opts.onTogglePause)
  const onToggleFreezeRef = useRef(opts.onToggleFreeze)
  const onToggleSoundRef = useRef(opts.onToggleSound)
  const onDismissOverlaysRef = useRef(opts.onDismissOverlays)

  // Sync refs in an effect to satisfy the react-hooks/refs lint rule
  // (cannot assign .current during render in React 19)
  useEffect(() => {
    onTogglePauseRef.current = opts.onTogglePause
    onToggleFreezeRef.current = opts.onToggleFreeze
    onToggleSoundRef.current = opts.onToggleSound
    onDismissOverlaysRef.current = opts.onDismissOverlays
  })

  const dismissShortcuts = useCallback(() => {
    setShortcutsVisible(false)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore shortcuts when the active element is an input, textarea, or select
      const tag = (document.activeElement?.tagName ?? '').toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return

      // ? key (Shift + /) — toggle shortcuts overlay
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault()
        setShortcutsVisible((v) => !v)
        return
      }

      // Escape — dismiss overlays + close shortcuts
      if (e.key === 'Escape') {
        setShortcutsVisible(false)
        onDismissOverlaysRef.current()
        return
      }

      // Space — toggle tape pause (prevent scroll)
      if (e.key === ' ') {
        e.preventDefault()
        onTogglePauseRef.current()
        return
      }

      // F — toggle global freeze
      if (e.key === 'f' || e.key === 'F') {
        onToggleFreezeRef.current()
        return
      }

      // S — toggle sound alerts
      if (e.key === 's' || e.key === 'S') {
        onToggleSoundRef.current()
        return
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return { shortcutsVisible, dismissShortcuts }
}
