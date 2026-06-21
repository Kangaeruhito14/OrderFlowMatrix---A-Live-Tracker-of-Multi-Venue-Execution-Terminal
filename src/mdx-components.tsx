import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

/**
 * Global styling for MDX content (the /learn articles).
 * Rendered inside the dark marketing layout, so these match the site theme.
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
        className="mt-10 text-xl font-semibold tracking-tight text-foreground"
        {...props}
      />
    ),
    h3: (props: ComponentPropsWithoutRef<"h3">) => (
      <h3 className="mt-6 text-base font-semibold text-foreground" {...props} />
    ),
    p: (props: ComponentPropsWithoutRef<"p">) => (
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground" {...props} />
    ),
    ul: (props: ComponentPropsWithoutRef<"ul">) => (
      <ul
        className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground"
        {...props}
      />
    ),
    ol: (props: ComponentPropsWithoutRef<"ol">) => (
      <ol
        className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground"
        {...props}
      />
    ),
    li: (props: ComponentPropsWithoutRef<"li">) => <li className="pl-1" {...props} />,
    a: ({ href, ...props }: ComponentPropsWithoutRef<"a">) => (
      <Link
        href={href ?? "#"}
        className="text-emerald-400 underline-offset-4 hover:underline"
        {...props}
      />
    ),
    strong: (props: ComponentPropsWithoutRef<"strong">) => (
      <strong className="font-semibold text-foreground" {...props} />
    ),
    blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => (
      <blockquote
        className="mt-4 border-l-2 border-emerald-500/50 pl-4 text-sm italic text-muted-foreground"
        {...props}
      />
    ),
    code: (props: ComponentPropsWithoutRef<"code">) => (
      <code
        className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
        {...props}
      />
    ),
    hr: (props: ComponentPropsWithoutRef<"hr">) => (
      <hr className="my-10 border-border" {...props} />
    ),
    ...components,
  };
}
