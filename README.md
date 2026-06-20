# Order Flow Matrix

**A live tracker of multi-venue execution flow.** Order Flow Matrix is a real-time
crypto **order-flow terminal** that streams and visualizes live trades across multiple
exchanges from a single, dense, dark interface — a trade matrix, order-book depth,
candlesticks, CVD, block-trade alerts, and cross-venue comparison.

> ⚠️ **Not financial advice.** This tool visualizes *public* exchange market data for
> informational and educational purposes only. It is not investment advice and makes no
> guarantee of accuracy, completeness, or timeliness. Trade at your own risk.

---

## What it does

- **Multi-exchange trade stream** — live aggregated trades from **Binance, Bybit, OKX,
  Bitget, and KuCoin** via a modular adapter layer (WebSocket first, REST fallback).
- **Live trade matrix** — dense, color-coded (buy/sell) blotter with venue tags,
  notional, and aggressor side.
- **Order-book depth ladder** + **candlestick chart** with volume profile.
- **CVD (cumulative volume delta)** and **block-trade / whale alerts** with history.
- **Trade-size distribution**, **market-intensity** and **buy/sell pressure** gauges.
- **Market universe browser** — search/sort coins by volume, change, and activity.
- **Watchlist** with auto-rotation, **focus/lock mode**, **exchange comparison mode**,
  global freeze, keyboard shortcuts, and CSV export.

## Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Styling | Tailwind CSS v4 + a small set of shadcn/ui primitives |
| Motion | Framer Motion (used sparingly for row flashes / transitions) |
| Charts | **Custom** native canvas/SVG — no charting library |
| Data | Native WebSocket + Fetch against public exchange APIs |

## Architecture

The heart of the app is a **normalizing exchange-adapter layer**
(`src/components/order-flow/adapters/`). Each venue implements a common
`ExchangeAdapter` interface that maps its own WebSocket/REST shapes into one unified
`NormalizedTrade` model, so the UI renders every venue identically.

```
src/
├─ app/                         # Next.js App Router (shell, styles, API routes)
│  └─ api/proxy/trades/         # server-side CORS proxy for venues that block browsers
├─ components/
│  ├─ order-flow/               # the terminal
│  │  ├─ adapters/              # binance | bybit | okx | bitget | kucoin + types + registry
│  │  ├─ *Panel.tsx / *.tsx     # UI panels (matrix, depth, charts, CVD, alerts, ...)
│  │  └─ use*.ts                # streaming hooks (trades, depth, kline, universe, ...)
│  └─ ui/                       # shadcn/ui primitives
├─ hooks/  └─ lib/              # shared helpers
```

Adding a new exchange = implement the `ExchangeAdapter` interface and register it; the
UI requires no changes.

## Getting started

```bash
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_SITE_URL
npm run dev                   # http://localhost:3000
```

Build & run production:

```bash
npm run build
npm run start
```

## Status & roadmap

Active development happens on the **`building-and-testing`** branch. The full,
phase-by-phase plan lives in [TASKS.md](./TASKS.md). High level:

1. Decommission scaffold & security hardening
2. Branding & metadata
3. Content & trust pages (Home / About / Privacy / Terms / Contact)
4. Evergreen "Learn" content
5. Programmatic market pages + technical SEO
6. LLM-SEO
7. Performance & tests
8. Commercialization scaffolding

## License

To be decided. Until a license is added, all rights reserved by the author.
