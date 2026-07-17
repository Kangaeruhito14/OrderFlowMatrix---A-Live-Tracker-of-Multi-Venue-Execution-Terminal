import { learnArticles } from "@/app/(marketing)/learn/articles";
import JsonLd from "@/components/JsonLd";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Renders Article structured data for a /learn post, looked up by slug from the
 * registry. Drop `<ArticleSchema slug="..." />` at the top of an MDX article.
 */
export default function ArticleSchema({ slug }: { slug: string }) {
  const a = learnArticles.find((x) => x.slug === slug);
  if (!a) return null;

  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.description,
    image: `${siteUrl}${a.cover}`,
    datePublished: a.date,
    dateModified: a.date,
    author: { "@type": "Organization", name: "Order Flow Matrix" },
    publisher: {
      "@type": "Organization",
      name: "Order Flow Matrix",
      logo: { "@type": "ImageObject", url: `${siteUrl}/logo.png` },
    },
    mainEntityOfPage: `${siteUrl}/learn/${a.slug}`,
  };

  return <JsonLd data={data} />;
}
