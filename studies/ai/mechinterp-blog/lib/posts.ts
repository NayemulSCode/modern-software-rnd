import { readFile } from "node:fs/promises"
import path from "node:path"
import { cacheLife } from "next/cache"
import type { ComponentType } from "react"

import { isPostSlug, POST_SLUGS, type PostSlug } from "./post-slugs"

export { isPostSlug, POST_SLUGS, type PostSlug }

/** Every MDX post exports this as `metadata`. */
export type PostMeta = {
  title: string
  description: string
  /** ISO date, YYYY-MM-DD. */
  published: string
  /** Short label for cards and the series navigation. */
  shortTitle: string
}

export type Heading = { id: string; text: string }

export type PostSummary = PostMeta & {
  slug: PostSlug
  part: number
  readingMinutes: number
  headings: Heading[]
}

const WORDS_PER_MINUTE = 220

// Same rule as rehype-slug (github-slugger) for plain-text headings.
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s/g, "-")
}

/**
 * Reading time and the table of contents come from the MDX source. File reads
 * are request-time work under Cache Components, so this is cached for good;
 * the result only changes when the post does, which means a new build.
 */
async function readSourceStats(
  slug: PostSlug
): Promise<{ readingMinutes: number; headings: Heading[] }> {
  "use cache"
  cacheLife("max")

  const file = path.join(process.cwd(), "content", "posts", `${slug}.mdx`)
  const source = await readFile(file, "utf8")
  const prose = source
    .replace(/^export const metadata[\s\S]*?\n}\n/m, "")
    .replace(/^import .*$/gm, "")
    .replace(/<[^>]+>/g, " ")
  const words = prose.split(/\s+/).filter(Boolean).length
  const headings = [...source.matchAll(/^## (.+)$/gm)].map((match) => {
    const text = match[1].replace(/[`*_]/g, "").trim()
    return { id: slugify(text), text }
  })
  return { readingMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)), headings }
}

type PostModule = { default: ComponentType; metadata: PostMeta }

async function loadModule(slug: PostSlug): Promise<PostModule> {
  const loaded = (await import(`@/content/posts/${slug}.mdx`)) as Partial<PostModule>
  if (!loaded.default || !loaded.metadata) {
    throw new Error(`content/posts/${slug}.mdx must export default content and \`metadata\`.`)
  }
  return loaded as PostModule
}

export async function getPostSummary(slug: PostSlug): Promise<PostSummary> {
  const [{ metadata }, stats] = await Promise.all([loadModule(slug), readSourceStats(slug)])
  return { ...metadata, ...stats, slug, part: POST_SLUGS.indexOf(slug) + 1 }
}

export async function getPost(slug: PostSlug) {
  const [{ default: Content }, summary] = await Promise.all([
    loadModule(slug),
    getPostSummary(slug),
  ])
  return { Content, summary }
}

export function getAllPostSummaries(): Promise<PostSummary[]> {
  return Promise.all(POST_SLUGS.map(getPostSummary))
}

export const SITE = {
  name: "Inside the Model",
  description:
    "Mechanistic interpretability for developers: how researchers read what a neural network computes, with small models you can run in the browser.",
  // Set SITE_URL when deploying; absolute URLs are needed for RSS, the
  // sitemap and share images.
  url: (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  locale: "en",
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`))
}
