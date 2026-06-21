import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import { learnArticles } from "./articles";

export const metadata: Metadata = {
  title: "Learn",
  description:
    "Plain-English guides to crypto order flow: the trade matrix, cumulative volume delta (CVD), block trades, and a market-microstructure glossary.",
  alternates: { canonical: "/learn" },
};

const dateFmt = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export default function LearnIndexPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Learn order flow
      </h1>
      <p className="mt-3 max-w-2xl text-base text-muted-foreground">
        Short, honest guides to reading live crypto order flow — and how to use Order Flow
        Matrix to see it. No jargon for jargon&apos;s sake.
      </p>

      <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
        {learnArticles.map((a) => (
          <Link
            key={a.slug}
            href={`/learn/${a.slug}`}
            className="group flex flex-col bg-card p-5 transition-colors hover:bg-secondary"
          >
            <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
              <span>{dateFmt.format(new Date(a.date))}</span>
              <span aria-hidden>·</span>
              <span>{a.readingMinutes} min read</span>
            </div>
            <h2 className="mt-2 text-base font-semibold text-foreground">{a.title}</h2>
            <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{a.description}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm text-emerald-400">
              Read
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-px overflow-hidden rounded-lg border border-border">
        <Link
          href="/learn/glossary"
          className="flex items-center justify-between bg-card p-5 transition-colors hover:bg-secondary"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-emerald-400" aria-hidden />
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Market Microstructure Glossary
              </h2>
              <p className="text-sm text-muted-foreground">
                Quick definitions for the terms used across these guides and the terminal.
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
        </Link>
      </div>

      <div className="mt-12 rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Prefer to learn by watching the tape?
        </p>
        <Link
          href="/terminal"
          className="mt-3 inline-block rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-emerald-400"
        >
          Open the live terminal
        </Link>
      </div>
    </div>
  );
}
