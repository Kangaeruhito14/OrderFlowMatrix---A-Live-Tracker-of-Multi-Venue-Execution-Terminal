import type { Metadata } from "next";
import CoinDashboard from "@/components/coin/CoinDashboard";
import type { ExchangeId } from "@/components/order-flow/adapters";

export const metadata: Metadata = {
  title: "Live Terminal",
  description:
    "Live per-coin crypto dashboard — real-time price, candlestick chart, order book, trade tape and order-flow analytics across Binance, Bybit, OKX, Bitget and KuCoin.",
  alternates: { canonical: "/terminal" },
};

const VALID_EXCHANGES = ["binance", "bybit", "okx", "bitget", "kucoin"];

type SearchParams = Record<string, string | string[] | undefined>;

const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

export default async function TerminalPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const exParam = str(sp.exchange);
  const exchange =
    exParam && VALID_EXCHANGES.includes(exParam) ? (exParam as ExchangeId) : undefined;

  const baseParam = str(sp.base)?.toUpperCase();
  const base = baseParam && /^[A-Z0-9]{1,15}$/.test(baseParam) ? baseParam : undefined;

  const quoteParam = str(sp.quote)?.toUpperCase();
  const quote = quoteParam && /^[A-Z0-9]{2,8}$/.test(quoteParam) ? quoteParam : undefined;

  return (
    <CoinDashboard
      initialExchange={exchange}
      initialBase={base}
      initialQuote={quote}
    />
  );
}
