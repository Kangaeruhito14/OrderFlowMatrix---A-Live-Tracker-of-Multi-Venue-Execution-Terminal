'use client'

import { AnimatePresence, motion } from 'framer-motion'

interface Props {
  visible: boolean
  onDismiss: () => void
}

const SHORTCUTS = [
  { key: 'Space', description: 'Pause / Resume Tape' },
  { key: 'F', description: 'Toggle Global Freeze' },
  { key: 'S', description: 'Toggle Sound Alerts' },
  { key: 'Esc', description: 'Dismiss Overlays' },
  { key: '?', description: 'Show / Hide Shortcuts' },
] as const

export default function KeyboardShortcutsOverlay({ visible, onDismiss }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="of-kbs-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={onDismiss}
          aria-label="Keyboard shortcuts overlay"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            className="of-kbs-modal"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="of-kbs-head">
              <span className="of-kbs-title">Keyboard Shortcuts</span>
              <button
                type="button"
                className="of-kbs-close"
                onClick={onDismiss}
                aria-label="Close shortcuts"
              >
                ✕
              </button>
            </div>
            <div className="of-kbs-list">
              {SHORTCUTS.map((s) => (
                <div className="of-kbs-row" key={s.key}>
                  <kbd className="of-kbs-key">{s.key}</kbd>
                  <span className="of-kbs-desc">{s.description}</span>
                </div>
              ))}
            </div>
            <div className="of-kbs-foot">
              Press <kbd className="of-kbs-key of-kbs-key-sm">Esc</kbd> or click outside to close
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
