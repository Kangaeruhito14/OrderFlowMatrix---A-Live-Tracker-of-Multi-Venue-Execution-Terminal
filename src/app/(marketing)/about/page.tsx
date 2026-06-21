import type { Metadata } from "next";
import Link from "next/link";
import PageShell, { Section } from "@/components/marketing/PageShell";

export const metadata: Metadata = {
  title: "About",
  description:
    "What Order Flow Matrix is, how its multi-exchange adapter architecture works, and the honest principles behind it.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <PageShell
      title="About Order Flow Matrix"
      lead="A live tracker of multi-venue crypto execution flow — built to read the tape fast, honestly, and across exchanges."
    >
      <Section heading="What it is">
        <p>
          Order Flow Matrix is a real-time crypto order-flow terminal. It connects to the
          public market-data feeds of five exchanges — Binance, Bybit, OKX, Bitget and
          KuCoin — and renders their live trades in a single, dense, dark interface: a
          trade matrix, an order-book depth ladder, candlesticks with a volume profile,
          cumulative volume delta (CVD), block-trade alerts, a market-universe browser, a
          watchlist, and a cross-venue comparison mode.
        </p>
      </Section>

      <Section heading="How the multi-exchange layer works">
        <p>
          Every exchange exposes its data differently — different WebSocket message
          formats, symbol conventions, REST shapes, update frequencies and rate limits.
          Order Flow Matrix puts a thin <em>adapter</em> in front of each venue that maps
          its raw feed into one shared internal model. The UI only ever sees that unified
          model, so it can render every venue identically and a new exchange can be added
          without touching the interface.
        </p>
        <p>
          Streaming favours WebSockets where available and falls back to server-side REST
          polling where a venue blocks browser connections — degrading gracefully instead
          of hanging, and surfacing which mode each feed is currently using.
        </p>
      </Section>

      <Section heading="How it's built">
        <p>
          The app is a Next.js (App Router) + React + TypeScript project styled with
          Tailwind CSS. Charts and meters are rendered natively — there is no third-party
          charting library. Motion is used sparingly, only to make new trades and state
          changes legible under continuous updates.
        </p>
      </Section>

      <Section heading="Who it's for">
        <p>
          Traders, students and the merely curious who want a transparent, fast way to
          watch live order flow across venues — and to learn how market microstructure
          actually behaves.
        </p>
      </Section>

      <Section heading="Our honest stance">
        <p>
          All data shown is public exchange data. This is not co-located,
          institutional-grade infrastructure, and inferred trade direction is exactly that
          — inferred. Nothing here is financial advice. See the{" "}
          <Link href="/disclaimer" className="text-emerald-400 underline-offset-4 hover:underline">
            disclaimer
          </Link>{" "}
          for the full picture.
        </p>
        <p>
          Questions or feedback?{" "}
          <Link href="/contact" className="text-emerald-400 underline-offset-4 hover:underline">
            Get in touch
          </Link>{" "}
          or{" "}
          <Link href="/terminal" className="text-emerald-400 underline-offset-4 hover:underline">
            open the terminal
          </Link>
          .
        </p>
      </Section>
    </PageShell>
  );
}
