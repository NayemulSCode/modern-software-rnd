import "katex/dist/katex.min.css"

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { TableOfContents } from "@/components/post/table-of-contents"
import {
  formatDate,
  getPost,
  getPostSummary,
  isPostSlug,
  POST_SLUGS,
  SITE,
} from "@/lib/posts"

// Every post must stay fully static; the build fails if one stops being.
export const ensureStatic = "navigation"

// Development validates that navigating here is instant, and flags the
// `params` read below. Its suggested fix, reading params inside <Suspense>,
// made the prerendered HTML hide the article until JavaScript runs: readers
// and tools without JavaScript saw only the fallback. Every post is
// prerendered and proxy.ts answers unknown slugs with a 404, so navigation
// here never waits on the server. Opting this segment out is the honest fix.
export const instant = false

export function generateStaticParams() {
  return POST_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: PageProps<"/posts/[slug]">): Promise<Metadata> {
  const { slug } = await params
  if (!isPostSlug(slug)) return {}
  const post = await getPostSummary(slug)
  return {
    title: post.title,
    description: post.description,
    // Metadata objects replace, not merge: repeat the feed link from the layout.
    alternates: { canonical: `/posts/${slug}`, types: { "application/rss+xml": "/feed.xml" } },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.published,
      url: `/posts/${slug}`,
    },
    twitter: { card: "summary_large_image" },
  }
}

export default async function PostPage({ params }: PageProps<"/posts/[slug]">) {
  const { slug } = await params
  // A safety net: proxy.ts already answers unknown slugs with a 404.
  if (!isPostSlug(slug)) notFound()

  const { Content, summary } = await getPost(slug)
  const index = POST_SLUGS.indexOf(slug)
  const [previous, next] = await Promise.all([
    index > 0 ? getPostSummary(POST_SLUGS[index - 1]) : null,
    index < POST_SLUGS.length - 1 ? getPostSummary(POST_SLUGS[index + 1]) : null,
  ])

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: summary.title,
    description: summary.description,
    datePublished: summary.published,
    url: `${SITE.url}/posts/${slug}`,
    image: `${SITE.url}/posts/${slug}/opengraph-image`,
    isPartOf: { "@type": "CreativeWorkSeries", name: SITE.name, url: SITE.url },
    position: summary.part,
    inLanguage: SITE.locale,
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_14rem]">
      <article className="min-w-0">
        <header className="mb-8">
          <p className="text-sm text-muted">
            <Link href="/" className="hover:text-foreground">
              Series
            </Link>{" "}
            · Part {summary.part} of {POST_SLUGS.length}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {summary.title}
          </h1>
          <p className="mt-3 text-lg text-pretty text-muted">{summary.description}</p>
          <p className="mt-4 text-sm text-muted">
            <time dateTime={summary.published}>{formatDate(summary.published)}</time> ·{" "}
            {summary.readingMinutes} min read
          </p>
        </header>

        <div className="prose prose-lg max-w-none prose-headings:tracking-tight prose-a:underline-offset-2 prose-code:before:content-none prose-code:after:content-none">
          <Content />
        </div>

        <nav
          aria-label="Series"
          className="mt-14 grid gap-4 border-t border-border pt-8 sm:grid-cols-2"
        >
          {previous ? (
            <Link
              href={`/posts/${previous.slug}`}
              className="rounded-lg border border-border p-4 hover:border-accent"
            >
              <span className="text-sm text-muted">Previous: part {previous.part}</span>
              <span className="mt-1 block font-medium">{previous.shortTitle}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/posts/${next.slug}`}
              className="rounded-lg border border-border p-4 text-right hover:border-accent"
            >
              <span className="text-sm text-muted">Next: part {next.part}</span>
              <span className="mt-1 block font-medium">{next.shortTitle}</span>
            </Link>
          ) : null}
        </nav>
      </article>

      <aside className="hidden lg:block">
        <TableOfContents headings={summary.headings} />
      </aside>

      <script
        type="application/ld+json"
        // JSON.stringify output cannot close the script tag once "<" is escaped.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </div>
  )
}
