'use client'

import { useId, useMemo, useRef, useState, useCallback } from 'react'
import type { Candle } from './useBinanceKlineStream'
import { fmtPrice, fmtQty } from './format'

interface Props {
  candles: Candle[]
  priceDigits?: number
  qtyDigits?: number
  height?: number
  className?: string
}

interface ChartGeom {
  W: number
  H: number
  padTop: number
  padBottom: number
  volH: number
  priceH: number
  priceTop: number
  priceBottom: number
  volTop: number
  volBottom: number
  slotW: number
  hi: number
  lo: number
  range: number
}

/**
 * Native-SVG candlestick chart (no charting library).
 *
 * Features:
 *  - wicks + bodies color-coded green/red + volume histogram
 *  - live close-price line + end dot
 *  - dashed price gridlines with Y-axis price labels
 *  - interactive crosshair (vertical + horizontal) following the mouse
 *  - HTML tooltip overlay showing the hovered candle's OHLC/volume/time
 */
export default function CandlestickChart({
  candles,
  priceDigits = 2,
  qtyDigits = 4,
  height = 180,
  className,
}: Props) {
  const rawId = useId()
  const gradId = 'of-kline-grad-' + rawId.replace(/[^a-zA-Z0-9]/g, '')
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const [mouseX, setMouseX] = useState<number | null>(null) // 0..1 fraction
  const [mouseY, setMouseY] = useState<number | null>(null) // 0..1 fraction

  const W = 1000
  const H = height

  const geom: ChartGeom = useMemo(() => {
    const padTop = 8
    const padBottom = 8
    const volH = Math.round(H * 0.18)
    const priceH = H - padTop - padBottom - volH - 4
    const priceTop = padTop
    const priceBottom = padTop + priceH
    const volTop = priceBottom + 4
    const volBottom = volTop + volH
    const slotW = candles.length > 0 ? W / candles.length : W
    return { W, H, padTop, padBottom, volH, priceH, priceTop, priceBottom, volTop, volBottom, slotW, hi: 0, lo: 0, range: 1 }
  }, [H, candles.length])

  // Volume profile: aggregate volume by price level for the right-side histogram
  const PROFILE_ROWS = 12

  const { paths, lastClose, hi, lo, upCount, downCount, maxVol, priceTicks, volumeProfile } = useMemo(() => {
    if (!candles || candles.length === 0) {
      return { paths: [], lastClose: null, hi: 0, lo: 0, upCount: 0, downCount: 0, maxVol: 0, priceTicks: [], volumeProfile: [] }
    }
    let hi = -Infinity
    let lo = Infinity
    let up = 0
    let down = 0
    let maxVol = 0
    for (const c of candles) {
      if (c.high > hi) hi = c.high
      if (c.low < lo) lo = c.low
      if (c.volume > maxVol) maxVol = c.volume
    }
    if (up === 0 && down === 0) {
      for (const c of candles) {
        if (c.close >= c.open) up += 1
        else down += 1
      }
    }
    const range = hi - lo || 1
    const lastClose = candles[candles.length - 1].close
    const slotW = W / candles.length
    const bodyW = Math.max(1.5, slotW * 0.62)
    const yPrice = (p: number) => geom.priceTop + geom.priceH * (1 - (p - lo) / range)

    // Y-axis price ticks (5)
    const priceTicks: Array<{ y: number; price: number }> = []
    for (let i = 0; i <= 4; i++) {
      const f = i / 4
      priceTicks.push({ y: geom.priceTop + geom.priceH * f, price: hi - range * f })
    }

    // Volume profile: bucket each candle's volume into price rows
    const profileRowH = geom.priceH / PROFILE_ROWS
    const volumeProfile: Array<{ y: number; buyVol: number; sellVol: number; totalVol: number }> = []
    for (let r = 0; r < PROFILE_ROWS; r++) {
      const rowTop = hi - (r / PROFILE_ROWS) * range
      const rowBot = hi - ((r + 1) / PROFILE_ROWS) * range
      let buyVol = 0
      let sellVol = 0
      for (const c of candles) {
        // how much of this candle overlaps with this price row?
        const cTop = c.high
        const cBot = c.low
        const overlapTop = Math.min(cTop, rowTop)
        const overlapBot = Math.max(cBot, rowBot)
        if (overlapTop > overlapBot) {
          const overlap = (overlapTop - overlapBot) / (cTop - cBot || 1)
          const allocVol = c.volume * overlap
          if (c.close >= c.open) buyVol += allocVol
          else sellVol += allocVol
        }
      }
      volumeProfile.push({
        y: geom.priceTop + r * profileRowH,
        buyVol,
        sellVol,
        totalVol: buyVol + sellVol,
      })
    }

    const items = candles.map((c, i) => {
      const cx = i * slotW + slotW / 2
      const yOpen = yPrice(c.open)
      const yClose = yPrice(c.close)
      const yHigh = yPrice(c.high)
      const yLow = yPrice(c.low)
      const isUp = c.close >= c.open
      if (isUp) up += 1
      else down += 1
      const color = isUp ? '#16c784' : '#e5484d'
      const wick = `M ${cx.toFixed(2)} ${yHigh.toFixed(2)} L ${cx.toFixed(2)} ${yLow.toFixed(2)}`
      const bodyTop = Math.min(yOpen, yClose)
      const bodyH = Math.max(1, Math.abs(yClose - yOpen))
      const body = `M ${(cx - bodyW / 2).toFixed(2)} ${bodyTop.toFixed(2)} L ${(cx + bodyW / 2).toFixed(2)} ${bodyTop.toFixed(2)} L ${(cx + bodyW / 2).toFixed(2)} ${(bodyTop + bodyH).toFixed(2)} L ${(cx - bodyW / 2).toFixed(2)} ${(bodyTop + bodyH).toFixed(2)} Z`
      const volBarH = maxVol > 0 ? (c.volume / maxVol) * geom.volH : 0
      const volY = geom.volBottom - volBarH
      const volPath = `M ${(cx - bodyW / 2).toFixed(2)} ${geom.volBottom.toFixed(2)} L ${(cx + bodyW / 2).toFixed(2)} ${geom.volBottom.toFixed(2)} L ${(cx + bodyW / 2).toFixed(2)} ${volY.toFixed(2)} L ${(cx - bodyW / 2).toFixed(2)} ${volY.toFixed(2)} Z`
      return { wick, body, volPath, color, cx, yClose, yHigh, yLow, yOpen, isUp, closed: c.closed, candle: c }
    })
    const maxProfileVol = Math.max(1, ...volumeProfile.map((r) => r.totalVol))
    return { paths: items, lastClose, hi, lo, upCount: up, downCount: down, maxVol, priceTicks, volumeProfile: volumeProfile.map((r) => ({ ...r, maxVol: maxProfileVol })) }
  }, [candles, geom, PROFILE_ROWS])

  // price → Y for crosshair horizontal line
  const priceAtY = useCallback(
    (yFrac: number) => {
      if (paths.length === 0) return null
      const range = hi - lo || 1
      // yFrac is relative to the full chart height; map to price area
      const priceTopFrac = geom.priceTop / H
      const priceBotFrac = geom.priceBottom / H
      const clamped = Math.max(priceTopFrac, Math.min(priceBotFrac, yFrac))
      const localFrac = (clamped - priceTopFrac) / (priceBotFrac - priceTopFrac)
      return lo + range * (1 - localFrac)
    },
    [paths, hi, lo, geom, H],
  )

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = wrapRef.current
      if (!el || paths.length === 0) return
      const rect = el.getBoundingClientRect()
      const xFrac = (e.clientX - rect.left) / rect.width
      const yFrac = (e.clientY - rect.top) / rect.height
      if (xFrac < 0 || xFrac > 1) {
        setHoverIdx(null)
        setMouseX(null)
        setMouseY(null)
        return
      }
      const idx = Math.min(paths.length - 1, Math.max(0, Math.floor(xFrac * paths.length)))
      setHoverIdx(idx)
      setMouseX(xFrac)
      setMouseY(yFrac)
    },
    [paths],
  )

  const handleLeave = useCallback(() => {
    setHoverIdx(null)
    setMouseX(null)
    setMouseY(null)
  }, [])

  // touch-to-inspect: tap/drag on the chart pins the tooltip to the touched candle
  const handleTouch = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const el = wrapRef.current
      if (!el || paths.length === 0) return
      const touch = e.touches[0]
      if (!touch) return
      const rect = el.getBoundingClientRect()
      const xFrac = (touch.clientX - rect.left) / rect.width
      const yFrac = (touch.clientY - rect.top) / rect.height
      if (xFrac < 0 || xFrac > 1) return
      const idx = Math.min(paths.length - 1, Math.max(0, Math.floor(xFrac * paths.length)))
      setHoverIdx(idx)
      setMouseX(xFrac)
      setMouseY(yFrac)
      // prevent scrolling while inspecting the chart
      if (e.cancelable) e.preventDefault()
    },
    [paths],
  )

  if (!candles || candles.length === 0) {
    return (
      <div className={className ? className + ' of-kline-empty' : 'of-kline-empty'} style={{ height }}>
        <span className="of-kline-empty-text">Awaiting kline feed…</span>
      </div>
    )
  }

  const lastItem = paths[paths.length - 1]
  const lastColor = lastItem.isUp ? '#25e09a' : '#ff5a60'

  // hovered candle data
  const hovered = hoverIdx !== null ? paths[hoverIdx] : null
  const hoverPrice = mouseY !== null ? priceAtY(mouseY) : null

  // tooltip position (HTML overlay)
  const tooltipLeft = mouseX !== null ? mouseX * 100 : 50
  const tooltipSide = tooltipLeft > 55 ? 'left' : 'right'

  return (
    <div
      ref={wrapRef}
      className={'of-kline-wrap ' + (className ?? '')}
      style={{ height, position: 'relative', touchAction: 'none' }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onTouchStart={handleTouch}
      onTouchMove={handleTouch}
    >
      <svg
        ref={svgRef}
        className="of-kline-svg"
        width="100%"
        height={height}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        aria-label="candlestick chart"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16c784" stopOpacity={0.04} />
            <stop offset="100%" stopColor="#e5484d" stopOpacity={0.04} />
          </linearGradient>
        </defs>

        {/* background tint */}
        <rect x="0" y="0" width={W} height={H} fill={`url(#${gradId})`} />

        {/* price gridlines */}
        {priceTicks.map((t, i) => (
          <line
            key={'g' + i}
            x1={0}
            y1={t.y}
            x2={W}
            y2={t.y}
            stroke="#141a24"
            strokeWidth={0.5}
            strokeDasharray="2 4"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* candles */}
        {paths.map((p, i) => (
          <g key={i} opacity={hoverIdx !== null && hoverIdx !== i ? 0.5 : 1} style={{ transition: 'opacity 0.12s ease' }}>
            <path d={p.wick} fill="none" stroke={p.color} strokeWidth={1} vectorEffect="non-scaling-stroke" opacity={0.85} />
            <path d={p.body} fill={p.color} opacity={p.closed ? 0.92 : 0.7} />
            <path d={p.volPath} fill={p.color} opacity={0.16} />
          </g>
        ))}

        {/* live close line */}
        <line
          x1={0}
          y1={lastItem.yClose}
          x2={W}
          y2={lastItem.yClose}
          stroke={lastColor}
          strokeWidth={0.8}
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
          opacity={0.55}
        />
        <circle cx={lastItem.cx} cy={lastItem.yClose} r={2} fill={lastColor} />

        {/* crosshair */}
        {hovered && mouseX !== null && (
          <>
            {/* vertical crosshair line at the hovered candle */}
            <line
              x1={hovered.cx}
              y1={0}
              x2={hovered.cx}
              y2={H}
              stroke="#4dd2ff"
              strokeWidth={0.7}
              strokeDasharray="2 3"
              vectorEffect="non-scaling-stroke"
              opacity={0.5}
            />
            {/* horizontal crosshair line at mouse Y */}
            {mouseY !== null && (
              <line
                x1={0}
                y1={mouseY * H}
                x2={W}
                y2={mouseY * H}
                stroke="#4dd2ff"
                strokeWidth={0.7}
                strokeDasharray="2 3"
                vectorEffect="non-scaling-stroke"
                opacity={0.4}
              />
            )}
            {/* highlight dot on hovered close */}
            <circle cx={hovered.cx} cy={hovered.yClose} r={2.5} fill="#4dd2ff" opacity={0.9} />
          </>
        )}

        {/* Volume Profile — horizontal bars on right side */}
        {volumeProfile.length > 0 && (() => {
          const profileW = 60 // pixels wide in SVG coords
          const profileX = W - profileW - 56 // leave room for price labels
          const profileRowH = geom.priceH / PROFILE_ROWS
          return (
            <g>
              {/* Volume Profile label */}
              <text
                x={profileX + profileW / 2}
                y={geom.priceTop - 1}
                textAnchor="middle"
                fontFamily="var(--of-mono), monospace"
                fontSize={7}
                fill="#5d6675"
                opacity={0.6}
                letterSpacing="0.12em"
              >
                VOL PROFILE
              </text>
              {volumeProfile.map((row, i) => {
                if (row.totalVol < 0.001) return null
                const buyW = (row.buyVol / row.maxVol) * profileW
                const sellW = (row.sellVol / row.maxVol) * profileW
                return (
                  <g key={'vp' + i}>
                    {buyW > 0.3 && (
                      <rect
                        x={profileX}
                        y={row.y + 1}
                        width={buyW}
                        height={profileRowH - 2}
                        fill="#16c784"
                        opacity={0.18}
                        rx={1}
                      />
                    )}
                    {sellW > 0.3 && (
                      <rect
                        x={profileX + buyW}
                        y={row.y + 1}
                        width={sellW}
                        height={profileRowH - 2}
                        fill="#e5484d"
                        opacity={0.18}
                        rx={1}
                      />
                    )}
                  </g>
                )
              })}
            </g>
          )
        })()}

        {/* Y-axis price labels (right edge) */}
        {priceTicks.map((t, i) => (
          <text
            key={'pl' + i}
            x={W - 3}
            y={t.y + 3}
            textAnchor="end"
            fontFamily="var(--of-mono), monospace"
            fontSize={9}
            fill="#5d6675"
            vectorEffect="non-scaling-stroke"
          >
            {fmtPrice(t.price, priceDigits)}
          </text>
        ))}

        {/* hover price label on right edge (at crosshair Y) */}
        {hoverPrice !== null && mouseY !== null && (
          <g>
            <rect
              x={W - 56}
              y={mouseY * H - 7}
              width={54}
              height={14}
              fill="#4dd2ff"
              opacity={0.9}
              rx={1}
            />
            <text
              x={W - 4}
              y={mouseY * H + 3}
              textAnchor="end"
              fontFamily="var(--of-mono), monospace"
              fontSize={9}
              fontWeight={700}
              fill="#06080c"
            >
              {fmtPrice(hoverPrice, priceDigits)}
            </text>
          </g>
        )}

        <title>{`High ${fmtPrice(hi, priceDigits)} · Low ${fmtPrice(lo, priceDigits)} · ${upCount}↑ ${downCount}↓`}</title>
      </svg>

      {/* HTML tooltip overlay */}
      {hovered && hovered.candle && (
        <div
          className={'of-kline-tooltip ' + (hovered.isUp ? 'up' : 'down') + ' ' + tooltipSide}
          style={{
            left: tooltipSide === 'right' ? `${tooltipLeft * 100 + 1.5}%` : undefined,
            right: tooltipSide === 'left' ? `${(1 - tooltipLeft) * 100 + 1.5}%` : undefined,
            top: 6,
          }}
        >
          <div className="of-kline-tooltip-time">
            {new Date(hovered.candle.openTime).toLocaleTimeString('en-US', { hour12: false })}
            {!hovered.candle.closed && <span className="of-kline-tooltip-live"> · LIVE</span>}
          </div>
          <div className="of-kline-tooltip-row">
            <span className="of-kline-tooltip-k">O</span>
            <span className="of-kline-tooltip-v">{fmtPrice(hovered.candle.open, priceDigits)}</span>
          </div>
          <div className="of-kline-tooltip-row">
            <span className="of-kline-tooltip-k">H</span>
            <span className="of-kline-tooltip-v bid">{fmtPrice(hovered.candle.high, priceDigits)}</span>
          </div>
          <div className="of-kline-tooltip-row">
            <span className="of-kline-tooltip-k">L</span>
            <span className="of-kline-tooltip-v ask">{fmtPrice(hovered.candle.low, priceDigits)}</span>
          </div>
          <div className="of-kline-tooltip-row">
            <span className="of-kline-tooltip-k">C</span>
            <span className={'of-kline-tooltip-v ' + (hovered.isUp ? 'bid' : 'ask')}>{fmtPrice(hovered.candle.close, priceDigits)}</span>
          </div>
          <div className="of-kline-tooltip-row">
            <span className="of-kline-tooltip-k">VOL</span>
            <span className="of-kline-tooltip-v dim">{fmtQty(hovered.candle.volume, qtyDigits)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
