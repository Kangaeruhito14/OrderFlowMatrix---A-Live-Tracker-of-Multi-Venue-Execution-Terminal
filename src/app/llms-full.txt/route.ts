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
    "Order Flow Matrix connects to public exchange market-data feeds and renders live trades in a single dark terminal: a trade matrix, an order-book depth ladder, candlesticks with a volume profile, cumulative volume delta (CVD), block-trade alerts, a market-universe browser, a watchlist, and a cross-venue comparison mode. It is free, requires no account or API key, and is built on public data. It is an informational and educational tool, not financial advice, and not co-located institutional infrastructure. Trade direction is inferred from each exchange's maker/taker flag and is therefore an approximation.",
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
