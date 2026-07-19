import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  Layers,
  ShieldCheck,
  Zap,
  BookOpen,
  Eye,
  ArrowRight,
} from "lucide-react";
import ThemeImage from "@/components/ThemeImage";
import PipelineInfographic from "@/components/home/PipelineInfographic";
import Reveal from "@/components/home/Reveal";

export const metadata: Metadata = {
  title: "About",
  description:
    "What Order Flow Matrix is, how its multi-exchange adapter architecture works, and the honest principles behind it.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  {
    icon: Eye,
    title: "Radical transparency",
    body: "Every number on screen comes from public exchange feeds — and we say so, everywhere. Inferred data is labeled inferred.",
  },
  {
    icon: ShieldCheck,
    title: "No advice, ever",
    body: "We visualize markets; we don't tell you what to do in them. No signals, no calls, no pretending to know the future.",
  },
  {
    icon: Zap,
    title: "Free and open to use",
    body: "No accounts, no API keys, no paywall on live data. Open the terminal and the feeds connect instantly.",
  },
  {
    icon: BookOpen,
    title: "Education first",
    body: "The guides and glossary exist so the terminal makes sense — microstructure explained in plain English.",
  },
];

const CAPABILITIES = [
  {
    icon: Activity,
    title: "Live order flow",
    body: "Real-time trades, CVD and block-trade detection for every tracked market, plus reference order-book depth and candles.",
  },
  {
    icon: Layers,
    title: "Five venues, one model",
    body: "A thin adapter per exchange normalizes five different feed dialects into one unified trade model.",
  },
  {
    icon: ShieldCheck,
    title: "Graceful degradation",
    body: "When a venue blocks a region, the terminal falls back to REST or says so clearly — it never pretends.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Banner */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0" aria-hidden>
          <ThemeImage
            dark="/images/about-desk.png"
            light="/images/about-desk-light.png"
            alt=""
            width={1536}
            height={1024}
            priority
            sizes="100vw"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        </div>
        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-40 sm:pt-52">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-600 backdrop-blur dark:text-emerald-400">
              About Order Flow Matrix
            </span>
            <h1 className="mt-5 max-w-2xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              We put the market&apos;s heartbeat on one screen.
            </h1>
            <p className="mt-4 max-w-xl text-pretty text-lg text-muted-foreground">
              Order Flow Matrix is a live tracker of multi-venue crypto execution flow —
              live trades from five exchanges, with reference depth, candles and
              order-flow analytics, in one honest interface.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Numbers */}
      <section className="border-b border-border bg-card/40">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-5 py-10 text-center sm:grid-cols-4">
          {[
            ["5", "exchanges streamed"],
            ["100+", "markets with live pages"],
            ["24/7", "live data"],
            ["$0", "to use"],
          ].map(([v, l]) => (
            <div key={l} className="px-4 py-2">
              <div className="font-mono text-3xl font-bold text-foreground">{v}</div>
              <div className="mt-1 text-sm text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* What we build */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            What we build
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            A real-time market instrument, engineered like infrastructure and explained
            like a good textbook.
          </p>
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {CAPABILITIES.map((c, i) => {
            const Icon = c.icon;
            return (
              <Reveal key={c.title} delay={i * 0.08}>
                <div className="h-full rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 text-emerald-500">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-foreground">{c.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Architecture */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <Reveal>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              How it works
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Each venue speaks its own protocol. Adapters translate them into one
              normalized model, so the interface treats every market identically — and a
              blocked feed degrades gracefully instead of breaking.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-10">
              <PipelineInfographic />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Principles */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            What we stand for
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {VALUES.map((v, i) => {
            const Icon = v.icon;
            return (
              <Reveal key={v.title} delay={(i % 2) * 0.08}>
                <div className="flex h-full gap-4 rounded-xl border border-border bg-card p-6">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 text-emerald-500">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{v.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{v.body}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center">
          <Reveal>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              See the flow for yourself.
            </h2>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/terminal"
                className="group inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-medium text-black shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400"
              >
                Launch the terminal
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <Link
                href="/contact"
                className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Get in touch
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
