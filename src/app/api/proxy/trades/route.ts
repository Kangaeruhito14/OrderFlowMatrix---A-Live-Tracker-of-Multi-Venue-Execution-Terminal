import { NextRequest, NextResponse } from 'next/server'

/**
 * REST proxy for exchanges that block browser CORS (KuCoin, Bybit).
 *
 * GET /api/proxy/trades?exchange=kucoin&symbol=BTC-USDT
 * GET /api/proxy/trades?exchange=bybit&symbol=BTCUSDT
 *
 * The proxy adds the appropriate CORS headers and forwards the request
 * server-side, avoiding browser CORS restrictions.
 */

const EXCHANGE_URLS: Record<string, (symbol: string) => string> = {
  kucoin: (symbol) => `https://api.kucoin.com/api/v1/market/histories?symbol=${symbol}`,
  bybit: (symbol) => `https://api.bybit.com/v5/market/recent-trade?category=spot&symbol=${symbol}`,
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const exchange = searchParams.get('exchange')
  const symbol = searchParams.get('symbol')

  if (!exchange || !symbol) {
    return NextResponse.json({ error: 'Missing exchange or symbol param' }, { status: 400 })
  }

  const urlBuilder = EXCHANGE_URLS[exchange]
  if (!urlBuilder) {
    return NextResponse.json({ error: `Unsupported exchange: ${exchange}` }, { status: 400 })
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
    // Return the raw JSON with proper content type
    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Proxy fetch failed' },
      { status: 502 }
    )
  }
}
