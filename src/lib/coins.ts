/**
 * Curated coin list shared by the homepage market table and the terminal's
 * coin picker. Colors are brand-adjacent for letter avatars.
 */
export interface CoinMeta {
  base: string;
  name: string;
  color: string;
}

export const COINS: CoinMeta[] = [
  { base: "BTC", name: "Bitcoin", color: "#f7931a" },
  { base: "ETH", name: "Ethereum", color: "#627eea" },
  { base: "SOL", name: "Solana", color: "#9945ff" },
  { base: "BNB", name: "BNB", color: "#f0b90b" },
  { base: "XRP", name: "XRP", color: "#00a5df" },
  { base: "DOGE", name: "Dogecoin", color: "#c2a633" },
  { base: "ADA", name: "Cardano", color: "#0033ad" },
  { base: "AVAX", name: "Avalanche", color: "#e84142" },
  { base: "LINK", name: "Chainlink", color: "#2a5ada" },
  { base: "LTC", name: "Litecoin", color: "#345d9d" },
  { base: "DOT", name: "Polkadot", color: "#e6007a" },
  { base: "TRX", name: "TRON", color: "#ff0013" },
];

export function coinMeta(base: string): CoinMeta {
  const up = base.toUpperCase();
  return (
    COINS.find((c) => c.base === up) ?? { base: up, name: up, color: "#64748b" }
  );
}
