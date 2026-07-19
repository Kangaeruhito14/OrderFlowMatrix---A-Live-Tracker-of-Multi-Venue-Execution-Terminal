import "server-only";

/**
 * Server-side market data for the programmatic /markets pages.
 *
 * Hybrid strategy: at build time we fetch each venue's top USDT pairs by 24h volume
 * to pre-render the high-value pages, and every fetch falls back to a curated static
 * list so the build NEVER depends on an exchange being reachable (e.g. Bybit is often
 * geo-blocked). Any other valid symbol still renders on-demand (see the page's
 * `dynamicParams`). All endpoints are free and unauthenticated.
 */

export const MARKET_EXCHANGES = [
  "binance",
  "bybit",
  "okx",
  "bitget",
  "kucoin",
] as const;

export type MarketExchange = (typeof MARKET_EXCHANGES)[number];

export const EXCHANGE_LABELS: Record<MarketExchange, string> = {
  binance: "Binance",
  bybit: "Bybit",
  okx: "OKX",
  bitget: "Bitget",
  kucoin: "KuCoin",
};

export interface MarketPair {
  base: string;
  quote: string; // always USDT in this layer
  symbol: string; // URL form: `${base}-USDT`
}

export interface MarketSummary {
  lastPrice: number;
  changePct: number;
  quoteVolume: number;
}

const TOP_N = 30;
const FETCH_TIMEOUT_MS = 6000;

// Curated fallback (top majors). Keeps builds working when a venue is unreachable.
const FALLBACK_BASES = [
  "BTC", "ETH", "SOL", "XRP", "BNB", "DOGE",
  "ADA", "AVAX", "LINK", "TRX", "DOT", "LTC",
];

export function isMarketExchange(x: string): x is MarketExchange {
  return (MARKET_EXCHANGES as readonly string[]).includes(x);
}

/** URL symbol must be BASE-USDT with safe characters only. */
export function parseSymbol(symbol: string): { base: string; quote: string } | null {
  const m = /^([A-Z0-9]{1,15})-([A-Z0-9]{2,8})$/.exec(symbol.toUpperCase());
  if (!m) return null;
  return { base: m[1], quote: m[2] };
}

function fallbackPairs(): MarketPair[] {
  return FALLBACK_BASES.map((base) => ({ base, quote: "USDT", symbol: `${base}-USDT` }));
}

async function safeJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "OFM-Terminal/1.0" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

function toPairs(bases: string[]): MarketPair[] {
  const seen = new Set<string>();
  const out: MarketPair[] = [];
  for (const base of bases) {
    if (!base || seen.has(base)) continue;
    seen.add(base);
    out.push({ base, quote: "USDT", symbol: `${base}-USDT` });
    if (out.length >= TOP_N) break;
  }
  return out;
}

const num = (v: unknown) => (typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : 0);

export interface TopPairsResult {
  pairs: MarketPair[];
  /** True when ranked live by 24h volume; false when the curated fallback was used. */
  live: boolean;
}

/** Convenience wrapper returning just the pairs. */
export async function getTopPairs(exchange: MarketExchange): Promise<MarketPair[]> {
  return (await getTopPairsDetailed(exchange)).pairs;
}

/** Fetch top USDT pairs for one venue by 24h quote volume, with static fallback. */
export async function getTopPairsDetailed(exchange: MarketExchange): Promise<TopPairsResult> {
  try {
    if (exchange === "binance") {
      const data = await safeJson("https://api.binance.com/api/v3/ticker/24hr");
      if (Array.isArray(data)) {
        const bases = data
          .filter((d) => typeof d?.symbol === "string" && d.symbol.endsWith("USDT"))
          .filter((d) => !/(UP|DOWN|BULL|BEAR)USDT$/.test(d.symbol))
          .sort((a, b) => num(b.quoteVolume) - num(a.quoteVolume))
          .map((d) => (d.symbol as string).slice(0, -4));
        if (bases.length) return { pairs: toPairs(bases), live: true };
      }
    } else if (exchange === "bybit") {
      const data = await safeJson("https://api.bybit.com/v5/market/tickers?category=spot");
      const list = (data as { result?: { list?: Record<string, unknown>[] } })?.result?.list;
      if (Array.isArray(list)) {
        const bases = list
          .filter((d) => typeof d?.symbol === "string" && (d.symbol as string).endsWith("USDT"))
          .sort((a, b) => num(b.turnover24h) - num(a.turnover24h))
          .map((d) => (d.symbol as string).slice(0, -4));
        if (bases.length) return { pairs: toPairs(bases), live: true };
      }
    } else if (exchange === "okx") {
      const data = await safeJson("https://www.okx.com/api/v5/market/tickers?instType=SPOT");
      const list = (data as { data?: Record<string, unknown>[] })?.data;
      if (Array.isArray(list)) {
        const bases = list
          .filter((d) => typeof d?.instId === "string" && (d.instId as string).endsWith("-USDT"))
          .sort((a, b) => num(b.volCcy24h) - num(a.volCcy24h))
          .map((d) => (d.instId as string).split("-")[0]);
        if (bases.length) return { pairs: toPairs(bases), live: true };
      }
    } else if (exchange === "bitget") {
      const data = await safeJson("https://api.bitget.com/api/v2/spot/market/tickers");
      const list = (data as { data?: Record<string, unknown>[] })?.data;
      if (Array.isArray(list)) {
        const bases = list
          .filter((d) => typeof d?.symbol === "string" && (d.symbol as string).endsWith("USDT"))
          .sort((a, b) => num(b.usdtVolume) - num(a.usdtVolume))
          .map((d) => (d.symbol as string).slice(0, -4));
        if (bases.length) return { pairs: toPairs(bases), live: true };
      }
    } else if (exchange === "kucoin") {
      const data = await safeJson("https://api.kucoin.com/api/v1/market/allTickers");
      const list = (data as { data?: { ticker?: Record<string, unknown>[] } })?.data?.ticker;
      if (Array.isArray(list)) {
        const bases = list
          .filter((d) => typeof d?.symbol === "string" && (d.symbol as string).endsWith("-USDT"))
          .sort((a, b) => num(b.volValue) - num(a.volValue))
          .map((d) => (d.symbol as string).split("-")[0]);
        if (bases.length) return { pairs: toPairs(bases), live: true };
      }
    }
  } catch {
    // fall through to fallback
  }
  return { pairs: fallbackPairs(), live: false };
}

/** Best-effort live summary for one symbol. Returns null on any failure. */
export async function getMarketSummary(
  exchange: MarketExchange,
  base: string
): Promise<MarketSummary | null> {
  try {
    if (exchange === "binance") {
      const d = await safeJson(`https://api.binance.com/api/v3/ticker/24hr?symbol=${base}USDT`);
      const o = d as Record<string, unknown> | null;
      if (o?.lastPrice) {
        return {
          lastPrice: num(o.lastPrice),
          changePct: num(o.priceChangePercent),
          quoteVolume: num(o.quoteVolume),
        };
      }
    } else if (exchange === "okx") {
      const d = await safeJson(`https://www.okx.com/api/v5/market/ticker?instId=${base}-USDT`);
      const t = (d as { data?: Record<string, unknown>[] })?.data?.[0];
      if (t?.last) {
        const last = num(t.last);
        const open = num(t.open24h);
        return {
          lastPrice: last,
          changePct: open ? ((last - open) / open) * 100 : 0,
          quoteVolume: num(t.volCcy24h),
        };
      }
    } else if (exchange === "bybit") {
      const d = await safeJson(
        `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${base}USDT`
      );
      const t = (d as { result?: { list?: Record<string, unknown>[] } })?.result?.list?.[0];
      if (t?.lastPrice) {
        return {
          lastPrice: num(t.lastPrice),
          changePct: num(t.price24hPcnt) * 100,
          quoteVolume: num(t.turnover24h),
        };
      }
    } else if (exchange === "bitget") {
      const d = await safeJson(
        `https://api.bitget.com/api/v2/spot/market/tickers?symbol=${base}USDT`
      );
      const t = (d as { data?: Record<string, unknown>[] })?.data?.[0];
      if (t?.lastPr) {
        return {
          lastPrice: num(t.lastPr),
          changePct: num(t.change24h) * 100,
          quoteVolume: num(t.usdtVolume),
        };
      }
    } else if (exchange === "kucoin") {
      const d = await safeJson(`https://api.kucoin.com/api/v1/market/stats?symbol=${base}-USDT`);
      const t = (d as { data?: Record<string, unknown> })?.data;
      if (t?.last) {
        return {
          lastPrice: num(t.last),
          changePct: num(t.changeRate) * 100,
          quoteVolume: num(t.volValue),
        };
      }
    }
  } catch {
    // ignore — summary is a bonus, not required
  }
  return null;
}
