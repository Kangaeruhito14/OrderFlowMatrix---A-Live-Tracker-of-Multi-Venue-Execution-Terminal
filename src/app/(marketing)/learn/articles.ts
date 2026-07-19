/**
 * Registry of /learn articles. Source of truth for the Learn index and (later)
 * the sitemap. When you add a new MDX article at
 * `src/app/(marketing)/learn/<slug>/page.mdx`, add a matching entry here.
 */
export interface LearnArticle {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO yyyy-mm-dd
  readingMinutes: number;
  /** Cover artwork under public/, 3:2-ish, dark-themed */
  cover: string;
  /** Light-theme cover variant */
  coverLight: string;
  coverAlt: string;
}

export const learnArticles: LearnArticle[] = [
  {
    slug: "what-is-order-flow",
    title: "What Is Order Flow?",
    description:
      "The tape, the order book, and what 'order flow' actually means — plus how to read who is initiating trades.",
    date: "2026-06-21",
    readingMinutes: 6,
    cover: "/images/learn/what-is-order-flow.png",
    coverLight: "/images/learn/what-is-order-flow-light.png",
    coverAlt: "Magnifying lens over a tape of green and red trade ticks",
  },
  {
    slug: "cumulative-volume-delta",
    title: "Cumulative Volume Delta (CVD), Explained",
    description:
      "How delta and CVD are built, how to read divergences and absorption, and the caveats most people miss.",
    date: "2026-06-21",
    readingMinutes: 6,
    cover: "/images/learn/cvd.png",
    coverLight: "/images/learn/cvd-light.png",
    coverAlt: "Emerald CVD line over volume bars with a highlighted divergence",
  },
  {
    slug: "reading-the-trade-matrix",
    title: "Reading the Trade Matrix",
    description:
      "What every column and color in a live trade blotter means, and the patterns worth watching across venues.",
    date: "2026-06-21",
    readingMinutes: 5,
    cover: "/images/learn/trade-matrix.png",
    coverLight: "/images/learn/trade-matrix-light.png",
    coverAlt: "Angled dark table of live market rows with green and red highlights",
  },
  {
    slug: "block-trades-and-whale-detection",
    title: "Block Trades & Whale Detection",
    description:
      "What counts as a block trade, why notional thresholds must be per-symbol, and what large prints can and can't tell you.",
    date: "2026-06-21",
    readingMinutes: 6,
    cover: "/images/learn/block-trades.png",
    coverLight: "/images/learn/block-trades-light.png",
    coverAlt: "Whale silhouette formed from tiny candlesticks swimming through a data stream",
  },
];
