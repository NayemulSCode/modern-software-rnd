import { cacheLife } from "next/cache"

import { getAllPostSummaries, SITE } from "@/lib/posts"

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

async function buildFeed(): Promise<string> {
  "use cache"
  cacheLife("max")

  const posts = await getAllPostSummaries()
  const newest = posts.reduce((latest, post) => (post.published > latest ? post.published : latest), "")
  const items = [...posts]
    .reverse()
    .map((post) => {
      const url = `${SITE.url}/posts/${post.slug}`
      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${new Date(`${post.published}T00:00:00Z`).toUTCString()}</pubDate>`,
        `      <description>${escapeXml(post.description)}</description>`,
        "    </item>",
      ].join("\n")
    })
    .join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE.name)}</title>
    <link>${SITE.url}</link>
    <description>${escapeXml(SITE.description)}</description>
    <language>en</language>
    <lastBuildDate>${new Date(`${newest}T00:00:00Z`).toUTCString()}</lastBuildDate>
    <atom:link href="${SITE.url}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`
}

export async function GET() {
  return new Response(await buildFeed(), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  })
}
