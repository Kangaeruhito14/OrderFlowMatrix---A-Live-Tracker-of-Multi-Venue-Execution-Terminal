import type { Metadata } from "next";
import Link from "next/link";
import {
  ExternalLink,
  Mail,
  ShieldAlert,
  Bug,
  Lightbulb,
  MessageSquare,
  Clock,
} from "lucide-react";
import CopyEmailButton from "@/components/marketing/CopyEmailButton";
import { VENUES, VENUE_IDS } from "@/lib/venues";

const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "fantasyfalcoon91@gmail.com";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Order Flow Matrix by email — feedback, bug reports and feature requests. Please note: we do not provide financial or trading advice.",
  alternates: { canonical: "/contact" },
};

const TOPICS = [
  {
    icon: Bug,
    title: "Bug reports",
    body: "Tell us the coin, the venue, and what you saw — screenshots help a lot.",
  },
  {
    icon: Lightbulb,
    title: "Feature requests",
    body: "Ideas for the terminal, the market pages or the guides are always welcome.",
  },
  {
    icon: MessageSquare,
    title: "General feedback",
    body: "Questions about how the site works, the data sources, or anything unclear.",
  },
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
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("[Order Flow Matrix] ")}`;

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Contact
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        The fastest way to reach us is email — for feedback, bug reports and feature
        requests.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        {/* email card */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-emerald-500/10 to-transparent"
          />
          <div className="relative">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/25 to-cyan-500/10 text-emerald-500">
              <Mail className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-foreground">Email us directly</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              One address, read by a human. We reply to every genuine message we can.
            </p>

            <div className="mt-5 rounded-xl border border-border bg-background p-4">
              <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Write to
              </div>
              <a
                href={mailto}
                className="mt-1 block break-all font-mono text-lg font-semibold text-emerald-600 underline-offset-4 hover:underline dark:text-emerald-400"
              >
                {CONTACT_EMAIL}
              </a>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={mailto}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-sm font-medium text-black transition-colors hover:bg-emerald-400"
                >
                  <Mail className="h-3.5 w-3.5" aria-hidden />
                  Open in your mail app
                </a>
                <CopyEmailButton email={CONTACT_EMAIL} />
              </div>
            </div>

            <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              This is an independent project, so replies are best-effort — usually within
              a few days. Including your browser and the market you were viewing makes
              bugs much faster to fix.
            </p>
          </div>
        </div>

        {/* guidance */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold text-foreground">Good things to write about</h2>
            <ul className="mt-4 space-y-4">
              {TOPICS.map((t) => {
                const Icon = t.icon;
                return (
                  <li key={t.title} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 text-emerald-500">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-foreground">{t.title}</span>
                      <span className="block text-sm text-muted-foreground">{t.body}</span>
                    </span>
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
