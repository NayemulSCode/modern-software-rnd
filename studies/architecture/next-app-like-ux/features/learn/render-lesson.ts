import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import rehypeShiki from "@shikijs/rehype";
import { cacheLife } from "next/cache";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { getLesson } from "@/lib/lessons";

type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

/**
 * The Markdown files link to each other as `./02-caching.md` so they work on
 * GitHub and in an editor. Inside the app the same link must point at
 * `/learn/02-caching`.
 */
function rehypeLessonLinks() {
  const rewrite = (node: HastNode) => {
    const href = node.properties?.href;
    if (node.tagName === "a" && typeof href === "string") {
      const match = /^\.\/([\w-]+)\.md(#.*)?$/.exec(href);
      if (match) node.properties = { ...node.properties, href: `/learn/${match[1]}${match[2] ?? ""}` };
      else if (/^https?:\/\//.test(href)) {
        node.properties = { ...node.properties, target: "_blank", rel: "noreferrer" };
      }
    }
    node.children?.forEach(rewrite);
  };
  return (tree: HastNode) => rewrite(tree);
}

/**
 * Reads docs/<slug>.md and turns it into highlighted HTML.
 *
 * Parsing Markdown and running a syntax highlighter is slow, and the result
 * only changes when the files do — a textbook case for `'use cache'`. In
 * production each lesson is rendered once at build time.
 */
export async function renderLesson(slug: string): Promise<string | null> {
  "use cache";
  cacheLife("max");

  // Only slugs from the lesson index are ever read from disk, so a request
  // for /learn/../../.env can never reach the filesystem.
  const lesson = getLesson(slug);
  if (!lesson) return null;

  try {
    const markdown = await readFile(path.join(process.cwd(), "docs", `${lesson.slug}.md`), "utf8");
    const html = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeSlug)
      .use(rehypeLessonLinks)
      .use(rehypeShiki, { theme: "vitesse-dark" })
      .use(rehypeStringify)
      .process(markdown);
    return String(html);
  } catch (error) {
    console.error(`Could not render lesson "${slug}"`, error);
    return null;
  }
}
