import type { Metadata } from "next";
import Link from "next/link";
import { GLOSSARY_TERMS } from "@/lib/glossary";
import JsonLd from "@/components/JsonLd";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "Market Microstructure Glossary",
  description:
    "Plain-English definitions of crypto market-microstructure and order-flow terms: tape, maker/taker, CVD, absorption, notional, VWAP, perpetuals and more.",
  alternates: { canonical: "/learn/glossary" },
};

const definedTermSet = {
  "@context": "https://schema.org",
  "@type": "DefinedTermSet",
  name: "Market Microstructure Glossary",
  url: `${siteUrl}/learn/glossary`,
  hasDefinedTerm: GLOSSARY_TERMS.map((t) => ({
    "@type": "DefinedTerm",
    name: t.term,
    description: t.definition,
  })),
};

export default function GlossaryPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <JsonLd data={definedTermSet} />
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Market Microstructure Glossary
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        Quick, plain-English definitions for the terms used across the{" "}
        <Link href="/learn" className="text-emerald-400 underline-offset-4 hover:underline">
          guides
        </Link>{" "}
        and the{" "}
        <Link href="/terminal" className="text-emerald-400 underline-offset-4 hover:underline">
          terminal
        </Link>
        .
      </p>

      <dl className="mt-10 divide-y divide-border border-y border-border">
        {GLOSSARY_TERMS.map((t) => (
          <div key={t.term} className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr] sm:gap-6">
            <dt className="text-sm font-semibold text-foreground">{t.term}</dt>
            <dd className="text-sm leading-relaxed text-muted-foreground">{t.definition}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
