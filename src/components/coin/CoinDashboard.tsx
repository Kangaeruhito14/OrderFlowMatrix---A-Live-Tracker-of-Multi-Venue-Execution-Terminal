"use client";

import { useEffect, useState } from "react";
import { useMultiExchangeStream } from "@/components/order-flow/useMultiExchangeStream";
import { useBinanceDepthStream } from "@/components/order-flow/useBinanceDepthStream";
import { useBinanceKlineStream } from "@/components/order-flow/useBinanceKlineStream";
import type { ExchangeId } from "@/components/order-flow/adapters";
import type { KlineInterval } from "@/components/order-flow/symbols";
import CoinHeader from "./CoinHeader";
import CoinPicker from "./CoinPicker";
import PriceCandles from "./PriceCandles";
import OrderBookCard from "./OrderBookCard";
import LiveTradesCard from "./LiveTradesCard";
import FlowStatsCard from "./FlowStatsCard";
import VenueUnavailable from "./VenueUnavailable";

interface Props {
  initialExchange?: ExchangeId;
  initialBase?: string;
  initialQuote?: string;
}

/**
 * The live coin dashboard: one instrument, one venue, everything live —
 * modern per-coin layout in the site's design language (light + dark).
 */
export default function CoinDashboard({
  initialExchange = "binance",
  initialBase = "BTC",
  initialQuote = "USDT",
}: Props) {
  const [exchange, setExchange] = useState<ExchangeId>(initialExchange);
  const [base, setBase] = useState(initialBase.toUpperCase());
  const [quote] = useState(initialQuote.toUpperCase());
  const [interval, setInterval_] = useState<KlineInterval>("1m");

  // Keep the URL shareable without re-rendering the route.
  useEffect(() => {
    const url = `/terminal?exchange=${exchange}&base=${base}&quote=${quote}`;
    window.history.replaceState(null, "", url);
  }, [exchange, base, quote]);

  // Live trade stream for the selected venue (WS + REST fallback).
  const stats = useMultiExchangeStream(exchange, base, quote, "spot", true, false);

  // Binance reference feeds for chart + book (labeled as such in the UI).
  const binanceStream = (base + quote).toLowerCase();
  const kline = useBinanceKlineStream(binanceStream, interval, true, false);
  const depth = useBinanceDepthStream(binanceStream, true, false);

  const feedDown =
    stats.health.status === "disconnected" && stats.totalTrades === 0;

  return (
    <div className="mx-auto max-w-7xl px-5 py-8">
      <CoinPicker base={base} onSelect={setBase} />

      <div className="mt-5">
        <CoinHeader
          exchange={exchange}
          base={base}
          quote={quote}
          stats={stats}
          onSelectExchange={setExchange}
        />
      </div>

      {feedDown ? (
        <div className="mt-5">
          <VenueUnavailable exchange={exchange} base={base} quote={quote} />
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-5">
          <PriceCandles
            kline={kline}
            interval={interval}
            onIntervalChange={setInterval_}
            exchange={exchange}
            base={base}
            quote={quote}
          />
          <LiveTradesCard stats={stats} base={base} />
        </div>
        <div className="min-w-0 space-y-5">
          <FlowStatsCard stats={stats} />
          <OrderBookCard depth={depth} exchange={exchange} base={base} />
        </div>
      </div>

      <p className="mt-8 text-center font-mono text-[11px] text-muted-foreground">
        Public exchange data · trade side is inferred · informational only — not
        financial advice
      </p>
    </div>
  );
}
