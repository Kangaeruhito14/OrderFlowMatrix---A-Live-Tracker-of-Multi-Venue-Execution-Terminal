import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

/**
 * Global styling for MDX content (the /learn articles): a proper reading
 * experience — comfortable measure, clear hierarchy, styled lists/quotes/code.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props: ComponentPropsWithoutRef<"h1">) => (
      <h1
        className="mt-2 text-3xl font-semibold tracking-tight text-foreground"
        {...props}
      />
    ),
    h2: (props: ComponentPropsWithoutRef<"h2">) => (
      <h2
        className="mt-12 border-b border-border pb-2 text-2xl font-semibold tracking-tight text-foreground"
        {...props}
      />
    ),
    h3: (props: ComponentPropsWithoutRef<"h3">) => (
      <h3 className="mt-8 text-lg font-semibold text-foreground" {...props} />
    ),
    p: (props: ComponentPropsWithoutRef<"p">) => (
      <p className="mt-5 text-base leading-relaxed text-muted-foreground" {...props} />
    ),
    ul: (props: ComponentPropsWithoutRef<"ul">) => (
      <ul
        className="mt-5 space-y-2.5 pl-1 text-base leading-relaxed text-muted-foreground [&>li]:relative [&>li]:pl-6 [&>li]:before:absolute [&>li]:before:left-1 [&>li]:before:top-[0.65em] [&>li]:before:h-1.5 [&>li]:before:w-1.5 [&>li]:before:rounded-full [&>li]:before:bg-emerald-500/70 [&>li]:before:content-['']"
        {...props}
      />
    ),
    ol: (props: ComponentPropsWithoutRef<"ol">) => (
      <ol
        className="mt-5 list-decimal space-y-2.5 pl-6 text-base leading-relaxed text-muted-foreground marker:font-mono marker:text-sm marker:text-emerald-500"
        {...props}
      />
    ),
    li: (props: ComponentPropsWithoutRef<"li">) => <li className="pl-1" {...props} />,
    a: ({ href, ...props }: ComponentPropsWithoutRef<"a">) => (
      <Link
        href={href ?? "#"}
        className="font-medium text-emerald-600 underline decoration-emerald-500/40 underline-offset-4 transition-colors hover:decoration-emerald-500 dark:text-emerald-400"
        {...props}
      />
    ),
    strong: (props: ComponentPropsWithoutRef<"strong">) => (
      <strong className="font-semibold text-foreground" {...props} />
    ),
    em: (props: ComponentPropsWithoutRef<"em">) => (
      <em className="italic text-foreground/90" {...props} />
    ),
    blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => (
      <blockquote
        className="mt-6 rounded-r-xl border-l-2 border-emerald-500 bg-emerald-500/5 py-3 pl-5 pr-4 text-base italic text-muted-foreground [&>p]:mt-0"
        {...props}
      />
    ),
    code: (props: ComponentPropsWithoutRef<"code">) => (
      <code
        className="rounded-md border border-border bg-secondary px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
        {...props}
      />
    ),
    hr: (props: ComponentPropsWithoutRef<"hr">) => (
      <hr className="my-12 border-border" {...props} />
    ),
    ...components,
  };
}
