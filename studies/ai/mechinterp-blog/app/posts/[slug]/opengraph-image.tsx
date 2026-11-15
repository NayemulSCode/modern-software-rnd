import { ImageResponse } from "next/og"

import { getPostSummary, isPostSlug, POST_SLUGS, SITE } from "@/lib/posts"

export const alt = "Post title card"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export function generateStaticParams() {
  return POST_SLUGS.map((slug) => ({ slug }))
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!isPostSlug(slug)) return new Response("Not found", { status: 404 })
  const post = await getPostSummary(slug)

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#14161f",
          color: "#eef0f6",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, color: "#9aa7ff" }}>
          {`${SITE.name} · Part ${post.part} of ${POST_SLUGS.length}`}
        </div>
        <div style={{ display: "flex", fontSize: 68, fontWeight: 700, lineHeight: 1.1 }}>
          {post.title}
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#b9bfd0" }}>
          {post.description.length > 120 ? `${post.description.slice(0, 117)}…` : post.description}
        </div>
      </div>
    ),
    size
  )
}
