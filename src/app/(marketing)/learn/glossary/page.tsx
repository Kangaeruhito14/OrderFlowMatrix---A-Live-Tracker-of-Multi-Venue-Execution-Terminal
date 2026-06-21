import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Market Microstructure Glossary",
  description:
    "Plain-English definitions of crypto market-microstructure and order-flow terms: tape, maker/taker, CVD, absorption, notional, VWAP, perpetuals and more.",
  alternates: { canonical: "/learn/glossary" },
};

interface Term {
  term: string;
  definition: string;
}

// Kept alphabetical; this also feeds DefinedTerm structured data in a later phase.
const TERMS: Term[] = [
  { term: "Absorption", definition: "Heavy aggressive trading on one side that fails to move price, implying a passive counterparty is soaking up the flow." },
  { term: "Aggressor", definition: "The taker side of a trade — the participant who sends a market order and crosses the spread to execute immediately." },
  { term: "Ask (Offer)", definition: "The lowest price at which sellers are currently willing to sell; the top of the sell side of the book." },
  { term: "Basis", definition: "The difference between a derivative's price (e.g. a perpetual) and the underlying spot price." },
  { term: "Bid", definition: "The highest price at which buyers are currently willing to buy; the top of the buy side of the book." },
  { term: "Block trade", definition: "A single execution whose size (notional) is unusually large relative to a market's typical trade size." },
  { term: "CVD (Cumulative Volume Delta)", definition: "A running total of delta (aggressive buy volume minus aggressive sell volume) over time." },
  { term: "Delta", definition: "For a window of trades, aggressive buy volume minus aggressive sell volume." },
  { term: "Depth", definition: "The quantity of resting orders available at each price level of the order book." },
  { term: "Funding rate", definition: "Periodic payments between long and short holders of a perpetual contract that tether its price to spot." },
  { term: "Imbalance", definition: "A skew between buy and sell activity (or resting size), indicating short-term pressure to one side." },
  { term: "Limit order", definition: "An order to buy or sell at a specified price or better; it rests on the book until filled or cancelled (a maker order)." },
  { term: "Liquidity", definition: "How easily an asset can be traded without moving its price; deep books and tight spreads mean high liquidity." },
  { term: "Maker", definition: "A participant who posts a resting limit order, providing liquidity for others to trade against." },
  { term: "Market order", definition: "An order to execute immediately at the best available price, consuming liquidity (a taker order)." },
  { term: "Notional", definition: "The value of a trade in quote currency: price multiplied by quantity." },
  { term: "Order book", definition: "The live list of all resting bids and asks at each price level for a market." },
  { term: "Order flow", definition: "The real-time stream of executed trades and resting orders that reveals who is initiating activity." },
  { term: "Perpetual (perp)", definition: "A derivative contract with no expiry that tracks an underlying asset, kept in line via funding." },
  { term: "Slippage", definition: "The difference between an order's expected price and the price at which it actually fills." },
  { term: "Spot", definition: "A market for immediate delivery of the underlying asset itself, as opposed to a derivative." },
  { term: "Spread", definition: "The gap between the best bid and best ask; tighter spreads indicate more liquid markets." },
  { term: "Taker", definition: "A participant who removes liquidity by sending a market order that executes against resting orders." },
  { term: "Tape", definition: "The continuous, time-ordered feed of executed trades — 'reading the tape' means interpreting that flow." },
  { term: "VWAP", definition: "Volume-Weighted Average Price: the average execution price weighted by traded volume over a period." },
  { term: "Volume profile", definition: "A view of how much volume traded at each price level, highlighting areas of acceptance." },
];

export default function GlossaryPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Market Microstructure Glossary
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        Quick, plain-English definitions for the terms used across the{" "}
        <Link href="/learn" className="text-emerald-400 underline-offset-4 hover:underline">
          guides
        </Link>{" "}
        and the{" "}
        <Link href="/terminal" className="text-emerald-400 underline-offset-4 hover:underline">
          terminal
        </Link>
        .
      </p>

      <dl className="mt-10 divide-y divide-border border-y border-border">
        {TERMS.map((t) => (
          <div key={t.term} className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr] sm:gap-6">
            <dt className="text-sm font-semibold text-foreground">{t.term}</dt>
            <dd className="text-sm leading-relaxed text-muted-foreground">{t.definition}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
