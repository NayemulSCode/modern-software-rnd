import type { MetadataRoute } from "next"

import { getAllPostSummaries, SITE } from "@/lib/posts"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPostSummaries()
  const newest = posts.reduce((latest, post) => (post.published > latest ? post.published : latest), "")
  return [
    { url: SITE.url, lastModified: newest, changeFrequency: "monthly", priority: 1 },
    ...posts.map((post) => ({
      url: `${SITE.url}/posts/${post.slug}`,
      lastModified: post.published,
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
  ]
}
