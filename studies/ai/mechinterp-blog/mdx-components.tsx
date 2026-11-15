import type { MDXComponents } from "mdx/types"
import Link from "next/link"
import type { ComponentProps } from "react"

import { Callout } from "@/components/post/callout"
import { ResidualStreamDiagram } from "@/components/post/residual-stream-diagram"

/** Internal links use next/link (prefetching); external ones open as normal links. */
function Anchor({ href = "", ...props }: ComponentProps<"a">) {
  if (href.startsWith("/")) return <Link href={href} {...props} />
  if (href.startsWith("#")) return <a href={href} {...props} />
  return <a href={href} rel="noreferrer" {...props} />
}

/**
 * Wide tables scroll inside their own box on small screens. A scrolling box
 * must be focusable so keyboard users can scroll it (WCAG 2.1.1), and a
 * focusable region needs a name.
 */
function Table(props: ComponentProps<"table">) {
  return (
    <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Table, scrolls sideways">
      <table {...props} />
    </div>
  )
}

const components: MDXComponents = {
  a: Anchor,
  table: Table,
  Callout,
  ResidualStreamDiagram,
}

export function useMDXComponents(): MDXComponents {
  return components
}
