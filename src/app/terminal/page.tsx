import type { Metadata } from "next";
import OrderFlowTerminal from "@/components/order-flow/OrderFlowTerminal";
import type { ExchangeId } from "@/components/order-flow/adapters";
import "../order-flow.css";

export const metadata: Metadata = {
  title: "Live Terminal",
  description:
    "The live multi-venue crypto order-flow terminal — trade matrix, order-book depth, candlesticks, CVD and block-trade alerts across Binance, Bybit, OKX, Bitget and KuCoin.",
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
    // The terminal is a purpose-built dark interface (like every trading
    // terminal); scope the dark token set here so it stays dark even when
    // the visitor picks the light site theme.
    <div className="dark">
      <OrderFlowTerminal
        initialExchange={exchange}
        initialBase={base}
        initialQuote={quote}
      />
    </div>
  );
}
