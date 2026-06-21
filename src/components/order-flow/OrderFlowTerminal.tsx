'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useBinanceDepthStream } from './useBinanceDepthStream'
import { useBinanceKlineStream } from './useBinanceKlineStream'
import { useBlockTradeAlerts } from './useBlockTradeAlerts'
import { useMultiExchangeStream } from './useMultiExchangeStream'
import { useMarketUniverse } from './useMarketUniverse'
import { useWatchlist } from './useWatchlist'
import { useExchangeComparison } from './useExchangeComparison'
import { getAdapter, EXCHANGES, type ExchangeId, type MarketCategory } from './adapters'
import { getSymbolConfig, type KlineInterval } from './symbols'
import { SymbolProvider } from './SymbolContext'
import MarketHeader from './MarketHeader'
import MultiExchangeTradeMatrix from './MultiExchangeTradeMatrix'
import StreamIntensity from './StreamIntensity'
import PressureIndicator from './PressureIndicator'
import StreamHealth from './StreamHealth'
import OrderBookLadder from './OrderBookLadder'
import CvdPanel from './CvdPanel'
import KlineChartPanel from './KlineChartPanel'
import BlockAlertOverlay from './BlockAlertOverlay'
import AlertHistoryPanel from './AlertHistoryPanel'
import TradeSizeDistribution from './TradeSizeDistribution'
import MarketUniversePanel from './MarketUniversePanel'
import WatchlistPanel from './WatchlistPanel'
import ExchangeComparisonPanel from './ExchangeComparisonPanel'
import ExchangeSelector from './ExchangeSelector'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'
import KeyboardShortcutsOverlay from './KeyboardShortcutsOverlay'

interface OrderFlowTerminalProps {
  initialExchange?: ExchangeId
  initialBase?: string
  initialQuote?: string
  initialCategory?: MarketCategory
}

export default function OrderFlowTerminal({
  initialExchange = 'binance',
  initialBase = 'BTC',
  initialQuote = 'USDT',
  initialCategory = 'spot',
}: OrderFlowTerminalProps = {}) {
  // Multi-exchange state (initial values can be deep-linked from /markets pages)
  const [exchange, setExchange] = useState<ExchangeId>(initialExchange)
  const [base, setBase] = useState(initialBase)
  const [quote, setQuote] = useState(initialQuote)
  const [category, setCategory] = useState<MarketCategory>(initialCategory)
  const [interval, setInterval_] = useState<KlineInterval>('1m')
  const [paused, setPaused] = useState(false)
  const [globalFreeze, setGlobalFreeze] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [comparisonMode, setComparisonMode] = useState(false)
  const [blockThresholdOverride, setBlockThresholdOverride] = useState<number | undefined>(undefined)

  // Binance cfg for the depth/kline panels (always Binance — those are Binance-specific streams)
  const binanceStream = (base + quote).toLowerCase()
  const cfg = useMemo(() => getSymbolConfig(binanceStream), [binanceStream])
  const blockThreshold = blockThresholdOverride ?? cfg.blockNotional

  // Multi-exchange trade stream (the primary trade matrix data source)
  const effectivePaused = paused || globalFreeze
  const stats = useMultiExchangeStream(exchange, base, quote, category, true, effectivePaused, blockThreshold)

  // Binance depth + kline (always Binance — reference data)
  const depth = useBinanceDepthStream(binanceStream, true, globalFreeze)
  const kline = useBinanceKlineStream(binanceStream, interval, true, globalFreeze)

  // Block trade alerts
  const blockAlerts = useBlockTradeAlerts(stats.lastBlockTrade, stats.health.status === 'connected', exchange + ':' + base + quote)

  // Market universe
  const universe = useMarketUniverse()

  // Watchlist
  const watchlist = useWatchlist()

  // Exchange comparison (when comparison mode is on, compare across all exchanges)
  const comparison = useExchangeComparison(base, quote, EXCHANGES, comparisonMode)

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // Watchlist auto-rotation
  useEffect(() => {
    if (!watchlist.autoRotate || watchlist.symbols.length === 0) return
    const id = setInterval(() => {
      const symbols = watchlist.symbols
      const currentKey = base + '/' + quote
      const currentIdx = symbols.findIndex((s) => s.key === currentKey)
      const nextIdx = (currentIdx + 1) % symbols.length
      const next = symbols[nextIdx]
      setBase(next.base)
      setQuote(next.quote)
    }, watchlist.rotateIntervalMs)
    return () => clearInterval(id)
  }, [watchlist.autoRotate, watchlist.rotateIntervalMs, watchlist.symbols, base, quote])

  const handleSelectSymbol = useCallback((b: string, q: string) => {
    setBase(b.toUpperCase())
    setQuote(q.toUpperCase())
    setPaused(false)
    setGlobalFreeze(false)
  }, [])

  const handleSelectExchange = useCallback((ex: ExchangeId) => {
    setExchange(ex)
    setPaused(false)
    setGlobalFreeze(false)
  }, [])

  const handleIntervalChange = useCallback((i: KlineInterval) => {
    if (i !== interval) setInterval_(i)
  }, [interval])

  const toggleGlobalFreeze = useCallback(() => setGlobalFreeze((g) => !g), [])
  const toggleFocusMode = useCallback(() => setFocusMode((f) => !f), [])
  const toggleComparisonMode = useCallback(() => setComparisonMode((c) => !c), [])

  const onDismissOverlays = useCallback(() => { /* noop */ }, [])

  const { shortcutsVisible, dismissShortcuts } = useKeyboardShortcuts({
    onTogglePause: () => setPaused((p) => !p),
    onToggleFreeze: toggleGlobalFreeze,
    onToggleSound: blockAlerts.toggleSound,
    onDismissOverlays,
  })

  return (
    <SymbolProvider value={cfg}>
      <div className="of-root">
        <BlockAlertOverlay alertState={blockAlerts} />
        <div className="of-stage">
          <div className="container-fluid p-0">
            {/* Row 1 — market header */}
            <div className="row">
              <div className="col-12">
                <MarketHeader
                  stats={stats}
                  now={now}
                  onSelectSymbol={handleSelectSymbol}
                  globalFreeze={globalFreeze}
                  onToggleFreeze={toggleGlobalFreeze}
                  exchange={exchange}
                  onSelectExchange={handleSelectExchange}
                  base={base}
                  quote={quote}
                  focusMode={focusMode}
                  onToggleFocus={toggleFocusMode}
                  comparisonMode={comparisonMode}
                  onToggleComparison={toggleComparisonMode}
                />
              </div>
            </div>

            {/* Row 2 — main grid */}
            <div className="row of-main-row" style={{ marginTop: 12, alignItems: 'stretch' }}>
              {/* Left pane — Order Book depth ladder (Binance reference) */}
              <div className="col-12 col-lg-4 col-xl-3 of-main-left of-pane-orderbook">
                <div className="of-main-fill">
                  <OrderBookLadder depth={depth} frozen={globalFreeze} />
                </div>
              </div>

              {/* Center pane — chart + trade matrix */}
              <div className="col-12 col-lg-8 col-xl-6 of-main-center">
                <div className="of-main-fill of-center-stack">
                  <KlineChartPanel kline={kline} interval={interval} onIntervalChange={handleIntervalChange} frozen={globalFreeze} />
                  <div className="of-center-matrix-wrap">
                    <MultiExchangeTradeMatrix
                      stats={stats}
                      paused={paused}
                      globalFreeze={globalFreeze}
                      onTogglePause={() => setPaused((p) => !p)}
                      exchange={exchange}
                      focusMode={focusMode}
                    />
                  </div>
                  {/* Exchange Comparison Panel (when comparison mode is on) */}
                  {comparisonMode && (
                    <div className="of-center-comparison-wrap">
                      <ExchangeComparisonPanel
                        comparison={comparison}
                        base={base}
                        quote={quote}
                        onSelectExchange={handleSelectExchange}
                        selectedExchange={exchange}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Right pane — analytics + discovery stack */}
              <div className="col-12 col-xl-3 of-main-right">
                <div className="d-flex flex-column gap-3 of-right-stack">
                  <CvdPanel stats={stats} onThresholdChange={setBlockThresholdOverride} />
                  <AlertHistoryPanel alertState={blockAlerts} now={now} />
                  <TradeSizeDistribution stats={stats} />
                  <WatchlistPanel
                    watchlist={watchlist}
                    onSelectSymbol={handleSelectSymbol}
                    selectedBase={base}
                    selectedQuote={quote}
                  />
                  <MarketUniversePanel
                    tickers={universe.tickers}
                    loading={universe.loading}
                    onSelectSymbol={handleSelectSymbol}
                    selectedBase={base}
                    onAddToWatchlist={watchlist.addSymbol}
                    watchlist={watchlist.symbols.map((s) => s.key)}
                  />
                  <StreamIntensity stats={stats} />
                  <PressureIndicator stats={stats} />
                  <StreamHealth stats={stats} now={now} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <KeyboardShortcutsOverlay visible={shortcutsVisible} onDismiss={dismissShortcuts} />
        <footer className="of-footer">
          <div className="of-f-left">
            <span><b>OFM</b> · Cryptographic Order Flow Matrix</span>
            <span className="of-f-sep">|</span>
            <span className="of-kbs-hint" title="Keyboard shortcuts">⌨ ?</span>
            <span className="of-f-sep">|</span>
            <span>Venue <b style={{ color: getAdapter(exchange).meta.color }}>{getAdapter(exchange).meta.name.toUpperCase()}</b></span>
            <span className="of-f-sep">|</span>
            <span>Symbol <b>{base}/{quote}</b></span>
            <span className="of-f-sep">|</span>
            <span>Streams <b style={{ color: 'var(--of-bid)' }}>@trade</b> · <b style={{ color: 'var(--of-cyan)' }}>@depth20</b> · <b style={{ color: 'var(--of-violet)' }}>@kline_{interval}</b></span>
          </div>
          <div className="of-f-right">
            <span>Trade <b style={{ color: stats.health.status === 'connected' ? 'var(--of-bid)' : 'var(--of-gold)' }}>{stats.health.status.toUpperCase()}</b></span>
            <span className="of-f-sep">|</span>
            <span>Depth <b style={{ color: depth.status === 'connected' ? 'var(--of-bid)' : 'var(--of-gold)' }}>{depth.status.toUpperCase()}</b></span>
            <span className="of-f-sep">|</span>
            <span>Kline <b style={{ color: kline.status === 'connected' ? 'var(--of-bid)' : 'var(--of-gold)' }}>{kline.status.toUpperCase()}</b></span>
          </div>
        </footer>
      </div>
    </SymbolProvider>
  )
}
