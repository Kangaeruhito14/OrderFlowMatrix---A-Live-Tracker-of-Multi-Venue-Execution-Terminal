import { NextRequest, NextResponse } from 'next/server'

/**
 * REST proxy for exchanges that block browser CORS (KuCoin, Bybit).
 *
 *   GET /api/proxy/trades?exchange=kucoin&symbol=BTC-USDT
 *   GET /api/proxy/trades?exchange=bybit&symbol=BTCUSDT
 *
 * The proxy forwards the request server-side to a fixed, allow-listed upstream so
 * the browser never hits the venue directly. Hardened against abuse:
 *   - exchange is allow-listed (only the venues below)
 *   - symbol is validated against a strict pattern (no query/path injection)
 *   - per-IP fixed-window rate limit (per server instance)
 *   - same-origin enforced when an Origin header is present (no cross-site relay)
 *   - short shared cache instead of no-store (cuts upstream load and ban risk)
 */

export const runtime = 'nodejs'

// Only these venues, and only this exact upstream path per venue.
const EXCHANGE_URLS: Record<string, (symbol: string) => string> = {
  kucoin: (symbol) => `https://api.kucoin.com/api/v1/market/histories?symbol=${symbol}`,
  bybit: (symbol) => `https://api.bybit.com/v5/market/recent-trade?category=spot&symbol=${symbol}`,
}

// Accepts BTCUSDT, BTC-USDT, 1INCHUSDT, etc. Rejects anything with separators that
// could inject extra query params or path segments.
const SYMBOL_RE = /^[A-Z0-9]{2,15}(-[A-Z0-9]{2,15})?$/

// --- simple in-memory fixed-window rate limiter (per server instance) ---
const RATE_LIMIT = 30 // requests
const RATE_WINDOW_MS = 10_000 // per 10s
const hits = new Map<string, { count: number; resetAt: number }>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = hits.get(ip)
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  entry.count += 1
  return entry.count > RATE_LIMIT
}

// Opportunistically drop stale buckets so the map can't grow unbounded.
function sweep() {
  if (hits.size < 5000) return
  const now = Date.now()
  for (const [k, v] of hits) if (now > v.resetAt) hits.delete(k)
}

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

export async function GET(request: NextRequest) {
  // Block cross-site browser use: if an Origin is sent, it must match our host.
  const origin = request.headers.get('origin')
  if (origin) {
    try {
      if (new URL(origin).host !== request.nextUrl.host) {
        return NextResponse.json({ error: 'Cross-origin requests are not allowed' }, { status: 403 })
      }
    } catch {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
    }
  }

  sweep()
  const ip = clientIp(request)
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(RATE_WINDOW_MS / 1000)) } }
    )
  }

  const { searchParams } = request.nextUrl
  const exchange = searchParams.get('exchange')
  const symbol = searchParams.get('symbol')

  if (!exchange || !symbol) {
    return NextResponse.json({ error: 'Missing exchange or symbol param' }, { status: 400 })
  }

  const urlBuilder = EXCHANGE_URLS[exchange]
  if (!urlBuilder) {
    return NextResponse.json({ error: `Unsupported exchange: ${exchange}` }, { status: 400 })
  }

  if (!SYMBOL_RE.test(symbol)) {
    return NextResponse.json({ error: 'Invalid symbol format' }, { status: 400 })
  }

  try {
    const targetUrl = urlBuilder(symbol)
    const res = await fetch(targetUrl, {
      headers: { 'User-Agent': 'OFM-Terminal/1.0' },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream ${exchange} returned ${res.status}` },
        { status: res.status }
      )
    }

    const text = await res.text()
    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Short shared cache: collapses bursts of identical polls into one upstream hit.
        'Cache-Control': 'public, max-age=1, s-maxage=2',
      },
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Proxy fetch failed' },
      { status: 502 }
    )
  }
}
