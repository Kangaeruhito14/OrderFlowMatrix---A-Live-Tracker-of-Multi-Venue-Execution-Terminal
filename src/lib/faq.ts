/**
 * Single source of truth for the FAQ.
 * Used by the /faq page, its FAQPage structured data, and llms-full.txt.
 */
export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What is Order Flow Matrix?",
    answer:
      "Order Flow Matrix is a real-time crypto order-flow terminal. Each market gets a live per-coin dashboard — streaming price, candlestick chart, order-book depth, a live trade tape, order-flow analytics (CVD, buy/sell pressure) and block-trade detection.",
  },
  {
    question: "Is it free to use?",
    answer:
      "Yes. The terminal connects to public exchange market-data feeds, which are free and require no account or API key. There is nothing to pay and no sign-up to use it.",
  },
  {
    question: "Which exchanges does it support?",
    answer:
      "Five venues today: Binance, Bybit, OKX, Bitget and KuCoin. The architecture uses interchangeable adapters, so more exchanges can be added without changing the interface.",
  },
  {
    question: "Do I need an account or API key?",
    answer:
      "No. There are no accounts and no API keys. Open the terminal and it connects to live public feeds immediately.",
  },
  {
    question: "Where does the data come from?",
    answer:
      "Directly from each exchange's public WebSocket and REST endpoints, normalized into one common format. When a venue blocks browser connections, a server-side REST fallback is used.",
  },
  {
    question: "Is the buy/sell side accurate?",
    answer:
      "Trade direction is inferred from each exchange's maker/taker flag — the standard approach — so it is an approximation, not a statement of intent. Derived metrics such as CVD inherit that uncertainty.",
  },
  {
    question: "Can I track coins other than BTC?",
    answer:
      "Yes. The terminal has a one-click picker for major coins, the Markets pages list the most active USDT pairs on each venue, and any supported symbol can be opened directly via the terminal URL.",
  },
  {
    question: "Is this financial advice?",
    answer:
      "No. Order Flow Matrix is an informational and educational tool that visualizes public market data. Nothing on the site is financial, investment or trading advice.",
  },
];
