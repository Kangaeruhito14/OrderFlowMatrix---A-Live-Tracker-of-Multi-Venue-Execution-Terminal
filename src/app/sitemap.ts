import type { MetadataRoute } from "next";
import { learnArticles } from "@/app/(marketing)/learn/articles";
import { MARKET_EXCHANGES, getTopPairs } from "@/lib/markets";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/terminal`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/markets`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/learn`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/learn/glossary`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/disclaimer`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const articleRoutes: MetadataRoute.Sitemap = learnArticles.map((a) => ({
    url: `${siteUrl}/learn/${a.slug}`,
    lastModified: new Date(a.date),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const marketGroups = await Promise.all(
    MARKET_EXCHANGES.map(async (ex) =>
      (await getTopPairs(ex)).map((p) => ({
        url: `${siteUrl}/markets/${ex}/${p.symbol}`,
        lastModified: now,
        changeFrequency: "hourly" as const,
        priority: 0.5,
      }))
    )
  );

  return [...staticRoutes, ...articleRoutes, ...marketGroups.flat()];
}
