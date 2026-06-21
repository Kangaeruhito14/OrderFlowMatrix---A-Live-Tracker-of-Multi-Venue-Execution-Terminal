import type { Metadata } from "next";
import Link from "next/link";
import { FAQ_ITEMS } from "@/lib/faq";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about Order Flow Matrix — what it is, whether it's free, supported exchanges, data sources, and inferred trade direction.",
  alternates: { canonical: "/faq" },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
};

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <JsonLd data={faqSchema} />
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Frequently asked questions
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        The short answers. Still curious? <Link href="/contact" className="text-emerald-400 underline-offset-4 hover:underline">Get in touch</Link>.
      </p>

      <dl className="mt-10 space-y-8">
        {FAQ_ITEMS.map((f) => (
          <div key={f.question}>
            <dt className="text-base font-semibold text-foreground">{f.question}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.answer}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-12 rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">Ready to see it in action?</p>
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
