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
}

export const learnArticles: LearnArticle[] = [
  {
    slug: "what-is-order-flow",
    title: "What Is Order Flow?",
    description:
      "The tape, the order book, and what 'order flow' actually means — plus how to read who is initiating trades.",
    date: "2026-06-21",
    readingMinutes: 6,
  },
  {
    slug: "cumulative-volume-delta",
    title: "Cumulative Volume Delta (CVD), Explained",
    description:
      "How delta and CVD are built, how to read divergences and absorption, and the caveats most people miss.",
    date: "2026-06-21",
    readingMinutes: 6,
  },
  {
    slug: "reading-the-trade-matrix",
    title: "Reading the Trade Matrix",
    description:
      "What every column and color in a live trade blotter means, and the patterns worth watching across venues.",
    date: "2026-06-21",
    readingMinutes: 5,
  },
  {
    slug: "block-trades-and-whale-detection",
    title: "Block Trades & Whale Detection",
    description:
      "What counts as a block trade, why notional thresholds must be per-symbol, and what large prints can and can't tell you.",
    date: "2026-06-21",
    readingMinutes: 6,
  },
];
