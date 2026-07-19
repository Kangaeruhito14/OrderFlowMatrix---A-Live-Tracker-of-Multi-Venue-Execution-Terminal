import { learnArticles } from "@/app/(marketing)/learn/articles";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const dynamic = "force-static";
export const revalidate = 3600;

// llms.txt — a concise, link-rich map for LLMs (https://llmstxt.org/).
export function GET() {
  const lines = [
    "# Order Flow Matrix",
    "",
    "> A live tracker of multi-venue crypto execution flow: a real-time order-flow terminal that streams trades across Binance, Bybit, OKX, Bitget and KuCoin — live per-coin dashboard with price, candlestick chart, order book, trade tape, CVD and block-trade detection. All data is public exchange data. Not financial advice.",
    "",
    "## Start here",
    `- [Live Terminal](${siteUrl}/terminal): real-time multi-exchange order-flow terminal`,
    `- [Markets](${siteUrl}/markets): browse the most active pairs per venue`,
    `- [Market Pulse](${siteUrl}/alerts): automated live snapshot of 24h gainers, losers and volume leaders`,
    "",
    "## Learn",
    ...learnArticles.map((a) => `- [${a.title}](${siteUrl}/learn/${a.slug}): ${a.description}`),
    `- [Glossary](${siteUrl}/learn/glossary): market-microstructure terms`,
    "",
    "## Company",
    `- [About](${siteUrl}/about)`,
    `- [FAQ](${siteUrl}/faq)`,
    `- [Contact](${siteUrl}/contact)`,
    "",
    "## Legal",
    `- [Privacy](${siteUrl}/privacy)`,
    `- [Terms](${siteUrl}/terms)`,
    `- [Disclaimer](${siteUrl}/disclaimer)`,
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
