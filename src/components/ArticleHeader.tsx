import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { learnArticles } from "@/app/(marketing)/learn/articles";
import ArticleSchema from "@/components/ArticleSchema";
import ThemeImage from "@/components/ThemeImage";

/**
 * Designed header for a /learn article: breadcrumb, title block, meta row,
 * lead paragraph and theme-aware cover — plus the Article JSON-LD.
 * Drop `<ArticleHeader slug="..." />` at the top of the MDX (no `# h1` needed).
 */
export default function ArticleHeader({ slug }: { slug: string }) {
  const a = learnArticles.find((x) => x.slug === slug);
  if (!a) return null;

  return (
    <header className="not-prose">
      <ArticleSchema slug={slug} />

      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 font-mono text-xs text-muted-foreground"
      >
        <Link href="/learn" className="transition-colors hover:text-foreground">
          Learn
        </Link>
        <ChevronRight className="h-3 w-3" aria-hidden />
        <span className="text-foreground">{a.title}</span>
      </nav>

      <h1 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {a.title}
      </h1>
      <p className="mt-3 max-w-2xl text-pretty text-lg text-muted-foreground">
        {a.description}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
        <span className="rounded-full border border-border px-2.5 py-0.5">
          {a.readingMinutes} min read
        </span>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/5 px-2.5 py-0.5 text-emerald-600 dark:text-emerald-400">
          Order flow basics
        </span>
        <span className="rounded-full border border-border px-2.5 py-0.5">
          Evergreen guide
        </span>
      </div>

      <div className="mt-7 overflow-hidden rounded-2xl border border-border">
        <ThemeImage
          dark={a.cover}
          light={a.coverLight}
          alt={a.coverAlt}
          width={1536}
          height={1024}
          priority
          sizes="(max-width: 768px) 100vw, 768px"
          className="aspect-[21/9] w-full object-cover"
        />
      </div>
    </header>
  );
}
