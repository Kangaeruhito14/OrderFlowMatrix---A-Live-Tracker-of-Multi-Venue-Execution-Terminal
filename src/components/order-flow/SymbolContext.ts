'use client'

import { createContext, useContext } from 'react'
import { DEFAULT_SYMBOL, type SymbolConfig } from './symbols'

/**
 * Shared symbol configuration context.
 * Provides price/qty precision and block-trade threshold to every panel
 * without prop-drilling. The OrderFlowTerminal sets the provider; panels
 * consume via `useSymbolConfig()`.
 */
const SymbolContext = createContext<SymbolConfig>(DEFAULT_SYMBOL)

export const SymbolProvider = SymbolContext.Provider

export function useSymbolConfig(): SymbolConfig {
  return useContext(SymbolContext)
}
