import type { Metadata } from "next";
import Link from "next/link";
import PageShell, { Section } from "@/components/marketing/PageShell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms governing use of Order Flow Matrix — informational use only, no warranty, and not financial advice.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <PageShell
      title="Terms of Service"
      lead="Please read these terms before using Order Flow Matrix."
      updated="June 21, 2026"
    >
      <Section heading="1. Acceptance">
        <p>
          By accessing or using Order Flow Matrix (the &quot;Service&quot;), you agree to
          these terms. If you do not agree, please do not use the Service.
        </p>
      </Section>

      <Section heading="2. Informational use only">
        <p>
          The Service displays publicly available cryptocurrency market data for
          informational and educational purposes. It is a visualization tool, not a
          brokerage, exchange, or trading venue, and it does not execute orders.
        </p>
      </Section>

      <Section heading="3. Not financial advice">
        <p>
          Nothing on the Service constitutes financial, investment, legal or tax advice,
          or a recommendation to buy or sell any asset. You are solely responsible for
          your own decisions. See the{" "}
          <Link href="/disclaimer" className="text-emerald-400 underline-offset-4 hover:underline">
            disclaimer
          </Link>
          .
        </p>
      </Section>

      <Section heading="4. Data accuracy & third-party sources">
        <p>
          Market data originates from third-party exchanges and is provided &quot;as
          is&quot;. We do not guarantee its accuracy, completeness, ordering, or timeliness,
          and feeds may be delayed, interrupted, or unavailable. Trade direction shown is
          inferred and may not reflect true intent.
        </p>
      </Section>

      <Section heading="5. Acceptable use">
        <p>
          You agree not to abuse the Service or its data proxy — including automated
          scraping, attempts to overload or circumvent rate limits, or any use that
          violates the terms of the underlying exchanges or applicable law.
        </p>
      </Section>

      <Section heading="6. Intellectual property">
        <p>
          The Service&apos;s design and code are owned by their author. Market data belongs
          to the respective exchanges. Exchange names are trademarks of their owners; their
          use here is descriptive and does not imply affiliation or endorsement.
        </p>
      </Section>

      <Section heading="7. No warranty & limitation of liability">
        <p>
          The Service is provided &quot;as is&quot; and &quot;as available&quot;, without
          warranties of any kind. To the maximum extent permitted by law, we are not liable
          for any loss or damage arising from your use of, or inability to use, the Service
          or any data shown.
        </p>
      </Section>

      <Section heading="8. Changes">
        <p>
          We may update these terms as the project evolves; continued use after changes
          constitutes acceptance. The &quot;last updated&quot; date above reflects the
          current version.
        </p>
      </Section>

      <Section heading="9. Contact">
        <p>
          Questions about these terms?{" "}
          <Link href="/contact" className="text-emerald-400 underline-offset-4 hover:underline">
            Get in touch
          </Link>
          .
        </p>
      </Section>
    </PageShell>
  );
}
