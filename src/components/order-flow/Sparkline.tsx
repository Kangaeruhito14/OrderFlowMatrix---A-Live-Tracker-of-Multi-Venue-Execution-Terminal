'use client'

import { useId, useMemo } from 'react'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  fillColor?: string
  strokeWidth?: number
  baseline?: number | null // if set, draws a zero/reference dashed line
  className?: string
}

/**
 * Minimal native-SVG sparkline. No charting library.
 * Renders a polyline with a vertical-gradient area fill and an end dot.
 * When `baseline` is provided (CVD mode), a dashed reference line is drawn.
 */
export default function Sparkline({
  data,
  width = 120,
  height = 34,
  color = '#4dd2ff',
  fillColor,
  strokeWidth = 1.4,
  baseline = null,
  className,
}: SparklineProps) {
  const rawId = useId()
  const gradId = 'of-spark-' + rawId.replace(/[^a-zA-Z0-9]/g, '')

  const { linePath, areaPath, baseY, lastX, lastY, hasData } = useMemo(() => {
    if (!data || data.length < 2) {
      return { linePath: '', areaPath: '', baseY: height, lastX: 0, lastY: 0, hasData: false }
    }
    let mn = Infinity
    let mx = -Infinity
    for (const v of data) {
      if (v < mn) mn = v
      if (v > mx) mx = v
    }
    if (baseline !== null) {
      if (baseline < mn) mn = baseline
      if (baseline > mx) mx = baseline
    }
    const range = mx - mn || 1
    const pad = strokeWidth
    const usableH = height - pad * 2
    const stepX = width / (data.length - 1)

    const pts: Array<readonly [number, number]> = []
    for (let i = 0; i < data.length; i++) {
      const v = data[i]
      const x = i * stepX
      const y = pad + usableH * (1 - (v - mn) / range)
      pts.push([x, y] as const)
    }

    const linePath = pts
      .map((p, i) => (i === 0 ? `M ${p[0].toFixed(2)} ${p[1].toFixed(2)}` : `L ${p[0].toFixed(2)} ${p[1].toFixed(2)}`))
      .join(' ')

    const first = pts[0]
    const last = pts[pts.length - 1]
    const areaPath =
      `M ${first[0].toFixed(2)} ${height.toFixed(2)} ` +
      pts.map((p) => `L ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ') +
      ` L ${last[0].toFixed(2)} ${height.toFixed(2)} Z`

    const baseY = baseline !== null ? pad + usableH * (1 - (baseline - mn) / range) : height

    return { linePath, areaPath, baseY, lastX: last[0], lastY: last[1], hasData: true }
  }, [data, width, height, baseline, strokeWidth])

  const fill = fillColor || color

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity={0.35} />
          <stop offset="100%" stopColor={fill} stopOpacity={0} />
        </linearGradient>
      </defs>
      {baseline !== null && (
        <line
          x1={0}
          y1={baseY}
          x2={width}
          y2={baseY}
          stroke="#39414f"
          strokeWidth={0.8}
          strokeDasharray="2 3"
        />
      )}
      {hasData ? (
        <>
          <path d={areaPath} fill={`url(#${gradId})`} stroke="none" />
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <circle cx={lastX} cy={lastY} r={1.8} fill={color} />
        </>
      ) : (
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="#1b2330"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      )}
    </svg>
  )
}
