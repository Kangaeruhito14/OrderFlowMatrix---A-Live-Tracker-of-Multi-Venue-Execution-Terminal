import type { Metadata } from "next";
import Link from "next/link";
import PageShell, { Section } from "@/components/marketing/PageShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Order Flow Matrix handles data: no accounts, no advertising cookies, and browser-local settings.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <PageShell
      title="Privacy Policy"
      lead="Order Flow Matrix is built to need as little of your data as possible."
      updated="June 21, 2026"
    >
      <Section heading="The short version">
        <p>
          You do not need an account to use Order Flow Matrix. We do not sell your data,
          we do not run advertising trackers, and your terminal preferences stay in your
          own browser.
        </p>
      </Section>

      <Section heading="Information we collect">
        <p>
          <strong>No account data:</strong> the terminal works without sign-up, so we do
          not collect names, emails or passwords to use it.
        </p>
        <p>
          <strong>Browser-local data:</strong> settings such as your watchlist and display
          preferences are stored in your browser&apos;s local storage. They never leave
          your device unless you tell us (for example, by emailing us a screenshot).
        </p>
        <p>
          <strong>Technical logs:</strong> like most websites, our hosting infrastructure
          may process standard request metadata (such as IP address and user agent) to
          serve pages, prevent abuse and rate-limit the data proxy. These are not used to
          build advertising profiles.
        </p>
        <p>
          <strong>Contact messages:</strong> if you email us via the contact page, we
          receive whatever you choose to send (your name, email and message).
        </p>
      </Section>

      <Section heading="Analytics & cookies">
        <p>
          We do not use advertising cookies or cross-site trackers. We may use
          privacy-friendly, <strong>cookieless</strong> analytics (such as Plausible) that
          set no cookies and collect no personal data — and only after you accept the
          consent notice shown on your first visit. You can decline, and you can change your
          mind by clearing this site&apos;s browser storage.
        </p>
      </Section>

      <Section heading="Market data & third parties">
        <p>
          Live prices and trades come directly from third-party exchanges (Binance, Bybit,
          OKX, Bitget, KuCoin). Your use of their data is also subject to their own terms
          and privacy policies. We are not affiliated with these exchanges.
        </p>
        <p>
          Our contact and waitlist forms may use Cloudflare Turnstile for bot protection,
          which processes limited technical signals to confirm you are human. Submitted
          messages may be delivered to an operational channel (for example, a webhook) so we
          can read and respond to them.
        </p>
      </Section>

      <Section heading="Your choices">
        <p>
          You can clear browser-local settings at any time by clearing your browser
          storage for this site. To request deletion of any contact message you sent us,
          just reach out.
        </p>
      </Section>

      <Section heading="Changes & contact">
        <p>
          We may update this policy as the project evolves; material changes will be
          reflected by the &quot;last updated&quot; date above. Questions?{" "}
          <Link href="/contact" className="text-emerald-400 underline-offset-4 hover:underline">
            Contact us
          </Link>
          .
        </p>
      </Section>
    </PageShell>
  );
}
