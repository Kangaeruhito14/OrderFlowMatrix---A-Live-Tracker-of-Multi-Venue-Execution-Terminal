import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, MessageSquare, ShieldAlert, Bug, Lightbulb } from "lucide-react";
import ContactForm from "@/components/marketing/ContactForm";
import { VENUES, VENUE_IDS } from "@/lib/venues";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Order Flow Matrix — feedback, bug reports and feature requests. Please note: we do not provide financial or trading advice.",
  alternates: { canonical: "/contact" },
};

const GOOD_TOPICS = [
  { icon: Bug, text: "Bug reports — include the coin, venue and what you saw." },
  { icon: Lightbulb, text: "Feature requests and feedback on the terminal or guides." },
  { icon: MessageSquare, text: "Questions about how the site and its data work." },
];

const KNOWLEDGE_RESOURCES = [
  {
    name: "CoinMarketCap",
    url: "https://coinmarketcap.com",
    note: "Prices, rankings and project profiles",
  },
  {
    name: "CoinGecko",
    url: "https://www.coingecko.com",
    note: "Market data, categories and research",
  },
  {
    name: "TradingView",
    url: "https://www.tradingview.com",
    note: "Charting and market analysis tools",
  },
  {
    name: "Investopedia",
    url: "https://www.investopedia.com",
    note: "Plain-English finance education",
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Contact
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        Feedback, bug reports, feature requests — we&apos;d like to hear them.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        {/* form */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground">Send a message</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Replies are best-effort — this is an independent project.
          </p>
          <div className="mt-5">
            <ContactForm />
          </div>
        </div>

        {/* guidance */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold text-foreground">We can help with</h2>
            <ul className="mt-3 space-y-3">
              {GOOD_TOPICS.map((t) => {
                const Icon = t.icon;
                return (
                  <li key={t.text} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                    {t.text}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-500" aria-hidden />
              <h2 className="text-sm font-semibold text-foreground">
                A note on financial advice
              </h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              We build market-data software — we are <strong className="text-foreground">not
              financial advisors</strong>, and we don&apos;t answer questions like &quot;should
              I buy this coin?&quot; or &quot;where is the price going?&quot;. Nobody can
              answer those reliably, and anyone who claims to deserves your skepticism. For
              decisions about your money, consult a licensed professional. See our{" "}
              <Link href="/disclaimer" className="text-emerald-500 underline-offset-4 hover:underline">
                disclaimer
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      {/* official resources */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Build your own knowledge
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          The best defense in crypto is understanding it yourself. These official venue
          sites and well-known industry resources are good places to learn and verify.
        </p>

        <h3 className="mt-8 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Exchanges we stream
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {VENUE_IDS.map((id) => {
            const v = VENUES[id];
            return (
              <a
                key={id}
                href={v.siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-emerald-500/40"
              >
                <span className="flex items-center gap-2.5">
                  <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: v.color }} />
                  <span className="text-sm font-medium text-foreground">{v.label}</span>
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-emerald-500" aria-hidden />
              </a>
            );
          })}
        </div>

        <h3 className="mt-8 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Market data &amp; education
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {KNOWLEDGE_RESOURCES.map((r) => (
            <a
              key={r.name}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-emerald-500/40"
            >
              <span className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{r.name}</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-emerald-500" aria-hidden />
              </span>
              <p className="mt-1 text-xs text-muted-foreground">{r.note}</p>
            </a>
          ))}
        </div>

        <p className="mt-6 font-mono text-[11px] text-muted-foreground">
          External links are provided for convenience — we&apos;re not affiliated with and
          don&apos;t endorse these sites; always verify URLs yourself.
        </p>
      </section>
    </div>
  );
}
