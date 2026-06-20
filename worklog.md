# Worklog — Cryptographic Order Flow Matrix

## Project Status Description / Assessment

**Project:** Cryptographic Order Flow Matrix — an institutional-grade, real-time
**multi-exchange** crypto order-flow trading terminal. Supports **5 exchanges**
(Binance, Bybit, OKX, Bitget, KuCoin) via a modular adapter architecture with
WebSocket streaming and REST polling fallback. Features include: live trade
matrix with venue column, order book depth ladder, candlestick chart with volume
profile, CVD + block-trade alerts, trade size distribution, market universe
discovery browser, watchlist with auto-rotation, cross-venue exchange comparison
mode, focus/lock mode, keyboard shortcuts, global freeze, and CSV export.

**Status: STABLE & VERIFIED (Round 12).** This round fixed critical bugs that
prevented non-Binance exchanges from loading data. The root causes were:
1. **Bitget WS channel name was wrong** ("trades" → "trade" singular)
2. **KuCoin time field was in nanoseconds** (not seconds as assumed)
3. **No REST bootstrap** — exchanges waited for WS before showing any data
4. **No data timeout** — if WS connected but never received trades, the UI hung
5. **CORS/403 blocks** — KuCoin blocks browser CORS, Bybit blocks all requests
6. **No error state UI** — blocked exchanges showed an infinite spinner

All 5 exchanges now work (4 with live data, 1 with graceful degradation):
- **Binance**: WS connected, 60 trades ✓
- **OKX**: WS connected, 60 trades ✓ (was REST-only before fix)
- **Bitget**: WS connected, 94 trades ✓ (was broken before channel name fix)
- **KuCoin**: REST fallback via server proxy, 94 trades ✓ (was broken before
  CORS proxy + nanosecond time fix)
- **Bybit**: Graceful "unavailable" error state ✓ (both WS and REST are blocked
  by CloudFront 403 in this environment — the app now shows a clear error
  message instead of hanging)

---

## Current Goals / Completed Modifications / Verification Results

### Bug fixes this round

1. **Bitget WS channel name fix** (`adapters/bitget.ts`)
   - **Root cause:** The subscribe payload used `"channel":"trades"` (plural),
     but Bitget's V2 API expects `"channel":"trade"` (singular). The plural
     form returns error code 30016 ("Param error").
   - **Fix:** Changed `channel: 'trades'` → `channel: 'trade'` in
     `wsSubscribePayload()`.
   - **Verified:** Bitget WS now connects and receives 94 trades, "Connected"
     status, "BG" exchange column.

2. **KuCoin nanosecond time fix** (`adapters/kucoin.ts`)
   - **Root cause:** KuCoin's REST API returns `time` in **nanoseconds** (19
     digits, e.g. `1781767013457000000`), not seconds. The adapter was
     multiplying by 1000 (assuming seconds → ms), producing timestamps far in
     the future, which caused all trades to fail window pruning and display
     incorrectly.
   - **Fix:** Changed `Math.floor(timeSec * 1000)` →
     `Math.floor(timeNs / 1_000_000)` (nanoseconds → milliseconds).
   - **Verified:** KuCoin trades now display with correct timestamps.

3. **CORS proxy for KuCoin** (`api/proxy/trades/route.ts` + `adapters/kucoin.ts`)
   - **Root cause:** KuCoin's REST API doesn't return CORS headers, so browser
     `fetch()` fails with "Failed to fetch".
   - **Fix:** Created a Next.js API route at `/api/proxy/trades` that forwards
     requests server-side. Updated the KuCoin adapter's `restUrl()` to use
     `/api/proxy/trades?exchange=kucoin&symbol=...` instead of the direct URL.

4. **Bybit proxy** (`adapters/bybit.ts`)
   - **Root cause:** Bybit's CloudFront returns 403 for ALL requests from this
     environment (both browser and server-side). Both WS and REST are blocked.
   - **Fix:** Updated Bybit adapter's `restUrl()` to use the server proxy
     (`/api/proxy/trades?exchange=bybit&symbol=...`). The proxy still receives
     403 from Bybit, but now the hook can detect this and show a proper error
     state instead of hanging.

### Architecture improvements

5. **REST bootstrap strategy** (`useMultiExchangeStream.ts`)
   - Previously, the hook waited for the WebSocket to connect before showing any
     data. Now it fires a REST fetch **immediately** on mount for instant data,
     while connecting the WS in parallel. If the WS starts delivering trades
     within 8 seconds, REST polling stops automatically.
   - This means all exchanges show data within ~1 second of selection, instead
     of waiting 5-10 seconds for WS handshake + subscribe + first trade.

6. **WS data timeout** (`useMultiExchangeStream.ts`)
   - If the WS connects (onopen fires) but receives 0 trades within 8 seconds,
     the hook automatically starts REST polling as a secondary source. This
     handles cases where the WS connects but the subscribe fails silently.

7. **No-data error state** (`useMultiExchangeStream.ts`)
   - If no trades arrive from any source (WS or REST) within 15 seconds, the
     health status is set to `'disconnected'` with an error message: "No data
     received — exchange may be unavailable in this region".
   - The trade matrix shows a clear error UI: "⚠ {Exchange} unavailable in
     this region. Try selecting another exchange."

8. **REST dedup by trade ID** (`useMultiExchangeStream.ts`)
   - The REST polling tracks the last seen trade ID and only adds new trades.
   - This prevents duplicate trades from flooding the matrix when REST polls
     return the same recent trades repeatedly.

### New files
- **`src/app/api/proxy/trades/route.ts`** — Next.js API route that proxies REST
  requests to exchanges that block browser CORS (KuCoin) or CloudFront 403
  (Bybit). Accepts `?exchange=kucoin&symbol=BTC-USDT` or
  `?exchange=bybit&symbol=BTCUSDT`. Returns the upstream JSON or a 502 error.

### Verification results
- **Binance:** WS connected, 60 trades, "BNB" column ✓
- **OKX:** WS connected, 60 trades, "OKX" column ✓ (was REST-only before)
- **Bitget:** WS connected, 94 trades, "BG" column ✓ (was broken before)
- **KuCoin:** REST fallback via proxy, 94 trades, "KC" column ✓ (was broken)
- **Bybit:** Graceful "Disconnected" error state after 15s ✓ (blocked by
  CloudFront 403 in this environment — error UI shows "Bybit unavailable in
  this region")
- **Zero runtime errors** (fresh browser session).
- **ESLint:** clean (zero warnings).
- **Layout:** desktop fits viewport exactly (docH=1000=winH).

---

## Unresolved Issues or Risks / Priority Recommendations for Next Phase

### Known limitations / low-risk
1. **Bybit is blocked in this environment** — Bybit's CloudFront returns 403
   for all requests (browser + server proxy). This is a geo/network restriction
   of the sandbox environment, not a code bug. In a production environment with
   unrestricted network access, Bybit WS and REST should work. The app handles
   this gracefully with a clear error message.
2. **REST polling is not real-time** — REST fallback polls every 3 seconds, so
   there's a slight delay vs WebSocket. This is acceptable for a fallback mode.
3. **Comparison mode opens 5 concurrent connections** — Each exchange comparison
   opens 5 separate WS/REST connections. This is fine for modern browsers but
   could be optimized with connection pooling in the future.
4. **Depth + kline are Binance-only** — The order book and candlestick chart
   still use Binance-specific stream formats. A future enhancement could add
   depth/kline adapters per exchange.

### Priority recommendations for next phase
- **P2:** Per-exchange depth/kline adapters — extend the adapter system to
  support depth and kline streams, not just trades.
- **P2:** Price alerts — user sets a price level, gets a notification.
- **P2:** Connection quality indicator per exchange in the comparison panel —
  show which exchanges are WS vs REST vs unavailable.
- **P3:** Chart drawing tools (trend lines, horizontal S/R lines).
- **P3:** Multi-venue arbitrage detection — highlight when the spread between
  exchanges exceeds a threshold.

### Maintenance notes
- Dev server runs on port 3000 in the background (`bun run dev`). Confirmed
  running and healthy.
- The 15-minute `webDevReview` cron job continues to drive iterative improvement.
- The exchange adapter layer is fully modular — new exchanges can be added by
  implementing the `ExchangeAdapter` interface.
- The `useMultiExchangeStream` hook now uses a 3-strategy approach:
  (1) REST bootstrap for instant data, (2) WS in parallel, (3) automatic
  fallback if WS fails or receives no data within 8s.
- The server-side proxy at `/api/proxy/trades` handles CORS-blocked exchanges
  (KuCoin) and provides a clean error path for blocked exchanges (Bybit).
