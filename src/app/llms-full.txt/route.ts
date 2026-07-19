import { learnArticles } from "@/app/(marketing)/learn/articles";
import { GLOSSARY_TERMS } from "@/lib/glossary";
import { FAQ_ITEMS } from "@/lib/faq";
import { MARKET_EXCHANGES, EXCHANGE_LABELS } from "@/lib/markets";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const dynamic = "force-static";
export const revalidate = 3600;

// llms-full.txt — a fuller, self-contained corpus for LLMs: descriptions, FAQ, glossary.
export function GET() {
  const lines: string[] = [
    "# Order Flow Matrix — full reference",
    "",
    "> A live tracker of multi-venue crypto execution flow. A real-time order-flow terminal that streams and visualizes live trades across multiple exchanges in one dense interface.",
    "",
    "## About",
    "Order Flow Matrix connects to public exchange market-data feeds and renders each market in a live per-coin dashboard: streaming price, candlestick chart with volume, order-book depth, a live trade tape with inferred aggressor side, rolling order-flow analytics (cumulative volume delta, buy/sell pressure, average trade size) and live block-trade detection. A Market Pulse page shows an automated snapshot of 24h top gainers, losers and volume leaders among liquid pairs. It is free, requires no account or API key, and is built on public data. It is an informational and educational tool, not financial advice, and not co-located institutional infrastructure. Trade direction is inferred from each exchange's maker/taker flag and is therefore an approximation.",
    "",
    "## Supported exchanges",
    ...MARKET_EXCHANGES.map((e) => `- ${EXCHANGE_LABELS[e]}`),
    "",
    "## Key pages",
    `- Live Terminal: ${siteUrl}/terminal`,
    `- Markets: ${siteUrl}/markets`,
    `- Learn: ${siteUrl}/learn`,
    `- FAQ: ${siteUrl}/faq`,
    "",
    "## Guides",
    ...learnArticles.flatMap((a) => [
      `### ${a.title}`,
      `${siteUrl}/learn/${a.slug}`,
      a.description,
      "",
    ]),
    "## Frequently asked questions",
    ...FAQ_ITEMS.flatMap((f) => [`Q: ${f.question}`, `A: ${f.answer}`, ""]),
    "## Glossary",
    ...GLOSSARY_TERMS.map((t) => `- ${t.term}: ${t.definition}`),
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
