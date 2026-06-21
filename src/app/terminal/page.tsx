import type { Metadata } from "next";
import OrderFlowTerminal from "@/components/order-flow/OrderFlowTerminal";
import "../order-flow.css";

export const metadata: Metadata = {
  title: "Live Terminal",
  description:
    "The live multi-venue crypto order-flow terminal — trade matrix, order-book depth, candlesticks, CVD and block-trade alerts across Binance, Bybit, OKX, Bitget and KuCoin.",
  alternates: { canonical: "/terminal" },
};

export default function TerminalPage() {
  return <OrderFlowTerminal />;
}
