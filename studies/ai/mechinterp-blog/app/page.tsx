import Link from "next/link"

import { formatDate, getAllPostSummaries } from "@/lib/posts"

export default async function HomePage() {
  const posts = await getAllPostSummaries()

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <p className="text-sm font-medium tracking-wide text-accent uppercase">
        A four-part series
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        Mechanistic interpretability, for developers
      </h1>
      <p className="mt-4 max-w-prose text-lg text-pretty text-muted">
        How researchers read what a neural network computes, explained with
        small models you can run in your browser. No machine-learning
        background needed: if you have read a stack trace, you have the right
        instincts.
      </p>

      <ol className="mt-10 flex flex-col gap-4">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/posts/${post.slug}`}
              className="group block rounded-xl border border-border p-5 transition-colors hover:border-accent hover:bg-surface"
            >
              <p className="text-sm text-muted">
                Part {post.part} · {post.readingMinutes} min read
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight group-hover:text-accent">
                {post.title}
              </h2>
              <p className="mt-2 text-pretty text-muted">{post.description}</p>
              <p className="mt-3 text-sm text-muted">
                <time dateTime={post.published}>{formatDate(post.published)}</time>
              </p>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}
