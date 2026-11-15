import type { Heading } from "@/lib/posts"

export function TableOfContents({ headings }: { headings: Heading[] }) {
  if (headings.length === 0) return null
  return (
    <nav aria-labelledby="toc-title" className="sticky top-20 text-sm">
      <h2 id="toc-title" className="font-medium">
        On this page
      </h2>
      <ol className="mt-3 flex flex-col gap-2 border-l border-border">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className="-ml-px block border-l border-transparent pl-3 text-muted hover:border-accent hover:text-foreground"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
