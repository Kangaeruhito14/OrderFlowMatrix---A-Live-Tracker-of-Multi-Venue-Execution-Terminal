'use client'

export function fmtPrice(p: number | null | undefined, digits = 2): string {
  if (p === null || p === undefined || !Number.isFinite(p)) return '—'
  return p.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function fmtQty(q: number | null | undefined, digits = 5): string {
  if (q === null || q === undefined || !Number.isFinite(q)) return '—'
  if (q >= 1000) {
    return q.toLocaleString('en-US', { maximumFractionDigits: 2 })
  }
  return q.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function fmtNotional(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(2) + 'K'
  return n.toFixed(2)
}

export function fmtInt(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—'
  return Math.floor(n).toLocaleString('en-US')
}

export function fmtPct(p: number | null | undefined, digits = 2): string {
  if (p === null || p === undefined || !Number.isFinite(p)) return '—'
  const sign = p > 0 ? '+' : ''
  return sign + p.toFixed(digits) + '%'
}

export function fmtBps(b: number | null | undefined, digits = 2): string {
  if (b === null || b === undefined || !Number.isFinite(b)) return '—'
  return b.toFixed(digits) + ' bps'
}

export function fmtTime(ms: number | null | undefined): { main: string; ms: string } {
  if (ms === null || ms === undefined) return { main: '--:--:--', ms: '.000' }
  const d = new Date(ms)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  const mss = String(d.getMilliseconds()).padStart(3, '0')
  return { main: `${hh}:${mm}:${ss}`, ms: '.' + mss }
}

export function fmtAge(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return '—'
  const s = Math.max(0, Math.floor(ms / 1000))
  if (s < 60) return s + 's'
  const m = Math.floor(s / 60)
  const rs = s % 60
  if (m < 60) return m + 'm ' + rs + 's'
  const h = Math.floor(m / 60)
  const rm = m % 60
  return h + 'h ' + rm + 'm'
}
