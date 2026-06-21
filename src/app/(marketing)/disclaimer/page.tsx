import type { Metadata } from "next";
import Disclaimer from "@/components/Disclaimer";
import PageShell, { Section } from "@/components/marketing/PageShell";

export const metadata: Metadata = {
  title: "Disclaimer",
  description:
    "Important disclaimer for Order Flow Matrix: not financial advice, public data only, inferred trade direction, and no affiliation with exchanges.",
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
  return (
    <PageShell title="Disclaimer" updated="June 21, 2026">
      <div className="rounded-lg border border-border bg-card p-5">
        <Disclaimer className="text-sm leading-relaxed text-muted-foreground" />
      </div>

      <Section heading="Data accuracy & latency">
        <p>
          Order Flow Matrix streams public data from third-party exchanges. Feeds can be
          delayed, throttled, reordered, incomplete, or temporarily unavailable. Numbers
          shown may differ from an exchange&apos;s own interface. Do not rely on this tool
          for time-sensitive execution decisions.
        </p>
      </Section>

      <Section heading="Inferred trade direction">
        <p>
          &quot;Buy&quot; and &quot;sell&quot; sides are <em>inferred</em> from each
          exchange&apos;s trade data (for example, the maker/taker flag), not stated intent.
          Derived metrics such as CVD and pressure are interpretations of that inferred
          flow and should be treated as approximations.
        </p>
      </Section>

      <Section heading="Not institutional infrastructure">
        <p>
          This is an independent web application reading public endpoints from a browser.
          It is not co-located, exchange-grade, or low-latency trading infrastructure, and
          it should not be presented or used as such.
        </p>
      </Section>

      <Section heading="No affiliation">
        <p>
          Order Flow Matrix is not affiliated with, endorsed by, or sponsored by Binance,
          Bybit, OKX, Bitget, KuCoin, or any other exchange. All trademarks belong to their
          respective owners.
        </p>
      </Section>

      <Section heading="Use at your own risk">
        <p>
          Trading cryptocurrencies involves substantial risk, including the loss of your
          entire capital. You are solely responsible for your own decisions and for
          complying with the laws and regulations that apply to you.
        </p>
      </Section>
    </PageShell>
  );
}
