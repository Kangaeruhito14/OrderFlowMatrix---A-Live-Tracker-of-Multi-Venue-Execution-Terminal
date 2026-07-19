import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";

/** Shared chrome for /learn articles: reading column + end-of-article CTA. */
export default function ArticleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <article>{children}</article>

      <div className="mt-14 border-t border-border pt-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/terminal"
            className="group rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/10"
          >
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              See it live
            </span>
            <p className="mt-1 text-sm text-muted-foreground">
              Open the terminal and watch real order flow while you read.
            </p>
            <span className="mt-2 inline-flex items-center gap-1 text-sm text-emerald-500">
              Launch terminal
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>
          <Link
            href="/learn"
            className="group rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10"
          >
            <span className="text-sm font-semibold text-foreground">Keep learning</span>
            <p className="mt-1 text-sm text-muted-foreground">
              More short, honest guides — plus the microstructure glossary.
            </p>
            <span className="mt-2 inline-flex items-center gap-1 text-sm text-emerald-500">
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden />
              All guides
            </span>
          </Link>
        </div>
        <p className="mt-6 text-center font-mono text-[11px] text-muted-foreground">
          Educational content — not financial advice.
        </p>
      </div>
    </div>
  );
}
