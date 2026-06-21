import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MARKET_EXCHANGES,
  EXCHANGE_LABELS,
  getTopPairs,
  getMarketSummary,
  isMarketExchange,
  parseSymbol,
  type MarketExchange,
} from "@/lib/markets";
import JsonLd from "@/components/JsonLd";

export const revalidate = 3600;
export const dynamicParams = true; // long-tail symbols render on-demand

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type Params = { exchange: string; symbol: string };

export async function generateStaticParams() {
  const groups = await Promise.all(
    MARKET_EXCHANGES.map(async (ex) => {
      const pairs = await getTopPairs(ex);
      return pairs.map((p) => ({ exchange: ex, symbol: p.symbol }));
    })
  );
  return groups.flat();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { exchange, symbol } = await params;
  const parsed = parseSymbol(symbol);
  if (!isMarketExchange(exchange) || !parsed) return { title: "Market not found" };
  const label = EXCHANGE_LABELS[exchange];
  const pair = `${parsed.base}-${parsed.quote}`;
  return {
    title: `${pair} order flow on ${label}`,
    description: `Live ${pair} order flow on ${label}: trade matrix, order-book depth, CVD and block-trade alerts. Open the real-time terminal for ${parsed.base} on ${label}.`,
    alternates: { canonical: `/markets/${exchange}/${pair}` },
  };
}

function fmtPrice(n: number): string {
  if (!isFinite(n) || n <= 0) return "—";
  const d = n >= 1000 ? 2 : n >= 1 ? 2 : n >= 0.01 ? 4 : 6;
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function fmtCompact(n: number): string {
  if (!isFinite(n) || n <= 0) return "—";
  const units: [string, number][] = [["T", 1e12], ["B", 1e9], ["M", 1e6], ["K", 1e3]];
  for (const [s, v] of units) if (n >= v) return (n / v).toFixed(2) + s;
  return n.toFixed(0);
}

export default async function MarketPage({ params }: { params: Promise<Params> }) {
  const { exchange, symbol } = await params;
  const parsed = parseSymbol(symbol);
  if (!isMarketExchange(exchange) || !parsed) notFound();

  const ex = exchange as MarketExchange;
  const { base, quote } = parsed;
  const pair = `${base}-${quote}`;
  const label = EXCHANGE_LABELS[ex];
  const summary = await getMarketSummary(ex, base);
  const others = MARKET_EXCHANGES.filter((e) => e !== ex);

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Markets", item: `${siteUrl}/markets` },
      { "@type": "ListItem", position: 2, name: label, item: `${siteUrl}/markets` },
      { "@type": "ListItem", position: 3, name: pair, item: `${siteUrl}/markets/${ex}/${pair}` },
    ],
  };

  const changePositive = summary ? summary.changePct >= 0 : true;

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <JsonLd data={breadcrumb} />

      <nav className="font-mono text-xs text-muted-foreground">
        <Link href="/markets" className="hover:text-foreground">
          Markets
        </Link>
        <span className="px-1.5">/</span>
        <span>{label}</span>
        <span className="px-1.5">/</span>
        <span className="text-foreground">{pair}</span>
      </nav>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
        {pair} order flow on {label}
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        Watch live {base}/{quote} trades on {label} — a real-time trade matrix, order-book
        depth, CVD and block-trade alerts.
      </p>

      {summary ? (
        <div className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border">
          <div className="bg-card p-4">
            <div className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              Last price
            </div>
            <div className="mt-1 font-mono text-lg text-foreground">
              {fmtPrice(summary.lastPrice)}
            </div>
          </div>
          <div className="bg-card p-4">
            <div className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              24h change
            </div>
            <div
              className={`mt-1 font-mono text-lg ${
                changePositive ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {changePositive ? "+" : ""}
              {summary.changePct.toFixed(2)}%
            </div>
          </div>
          <div className="bg-card p-4">
            <div className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              24h volume
            </div>
            <div className="mt-1 font-mono text-lg text-foreground">
              {fmtCompact(summary.quoteVolume)}
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-8 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          Live snapshot unavailable right now — open the terminal for the real-time feed.
        </p>
      )}

      {summary ? (
        <p className="mt-2 font-mono text-[11px] text-muted-foreground">
          Snapshot refreshes periodically. The terminal streams live.
        </p>
      ) : null}

      <div className="mt-8">
        <Link
          href={`/terminal?exchange=${ex}&base=${base}&quote=${quote}`}
          className="inline-block rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-emerald-400"
        >
          Open {pair} in the terminal
        </Link>
      </div>

      <section className="mt-12 space-y-3">
        <h2 className="text-lg font-semibold text-foreground">What you can watch here</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          In the terminal, {base}/{quote} on {label} shows each aggressive print in the
          live <Link href="/learn/reading-the-trade-matrix" className="text-emerald-400 underline-offset-4 hover:underline">trade matrix</Link>,
          a running <Link href="/learn/cumulative-volume-delta" className="text-emerald-400 underline-offset-4 hover:underline">CVD</Link> of
          net initiative, and <Link href="/learn/block-trades-and-whale-detection" className="text-emerald-400 underline-offset-4 hover:underline">block-trade alerts</Link> when
          unusually large orders cross your threshold.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-foreground">{base}-USDT on other venues</h2>
        <div className="flex flex-wrap gap-2">
          {others.map((e) => (
            <Link
              key={e}
              href={`/markets/${e}/${base}-USDT`}
              className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-emerald-500/50 hover:text-foreground"
            >
              {EXCHANGE_LABELS[e]}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-foreground">New to order flow?</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Start with{" "}
          <Link href="/learn/what-is-order-flow" className="text-emerald-400 underline-offset-4 hover:underline">
            what order flow is
          </Link>{" "}
          or browse the{" "}
          <Link href="/learn/glossary" className="text-emerald-400 underline-offset-4 hover:underline">
            glossary
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
