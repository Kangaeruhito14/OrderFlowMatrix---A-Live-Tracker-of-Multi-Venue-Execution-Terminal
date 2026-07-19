/**
 * Client-safe venue metadata shared by the coin dashboard, market pages,
 * and resource links. (No server-only imports here.)
 */

export const VENUE_IDS = ["binance", "bybit", "okx", "bitget", "kucoin"] as const;
export type VenueId = (typeof VENUE_IDS)[number];

export interface VenueMeta {
  id: VenueId;
  label: string;
  color: string;
  /** Official homepage */
  siteUrl: string;
  /** Official spot trade page for a given pair */
  tradeUrl: (base: string, quote: string) => string;
}

export const VENUES: Record<VenueId, VenueMeta> = {
  binance: {
    id: "binance",
    label: "Binance",
    color: "#f0b90b",
    siteUrl: "https://www.binance.com",
    tradeUrl: (b, q) => `https://www.binance.com/en/trade/${b}_${q}`,
  },
  bybit: {
    id: "bybit",
    label: "Bybit",
    color: "#f7a600",
    siteUrl: "https://www.bybit.com",
    tradeUrl: (b, q) => `https://www.bybit.com/en/trade/spot/${b}/${q}`,
  },
  okx: {
    id: "okx",
    label: "OKX",
    color: "#8c8c8c",
    siteUrl: "https://www.okx.com",
    tradeUrl: (b, q) => `https://www.okx.com/trade-spot/${b.toLowerCase()}-${q.toLowerCase()}`,
  },
  bitget: {
    id: "bitget",
    label: "Bitget",
    color: "#00f0ff",
    siteUrl: "https://www.bitget.com",
    tradeUrl: (b, q) => `https://www.bitget.com/spot/${b}${q}`,
  },
  kucoin: {
    id: "kucoin",
    label: "KuCoin",
    color: "#23af91",
    siteUrl: "https://www.kucoin.com",
    tradeUrl: (b, q) => `https://www.kucoin.com/trade/${b}-${q}`,
  },
};

export function isVenueId(x: string): x is VenueId {
  return (VENUE_IDS as readonly string[]).includes(x);
}
