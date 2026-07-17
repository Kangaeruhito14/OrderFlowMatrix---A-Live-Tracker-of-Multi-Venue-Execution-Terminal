import Image from "next/image";
import { learnArticles } from "@/app/(marketing)/learn/articles";

/** Cover artwork for a /learn article, looked up from the registry by slug. */
export default function ArticleCover({ slug }: { slug: string }) {
  const a = learnArticles.find((x) => x.slug === slug);
  if (!a) return null;
  return (
    <Image
      src={a.cover}
      alt={a.coverAlt}
      width={1536}
      height={1024}
      priority
      sizes="(max-width: 768px) 100vw, 768px"
      className="mb-2 mt-6 h-auto w-full rounded-xl border border-border"
    />
  );
}
