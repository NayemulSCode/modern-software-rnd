import type { ReactNode } from "react"

/** Shared box for every interactive demo, server-rendered as the placeholder too. */
export function DemoFrame({
  title,
  description,
  children,
  minHeight,
}: {
  title: string
  description: string
  children?: ReactNode
  /** Reserved height, so the page does not jump when the demo loads. */
  minHeight: number
}) {
  const id = `demo-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
  return (
    <section
      aria-labelledby={id}
      className="not-prose my-10 scroll-mt-20 rounded-xl border border-border bg-surface p-4 sm:p-6"
      style={{ minHeight }}
    >
      <p className="text-xs font-medium tracking-wide text-accent uppercase">Try it</p>
      <h3 id={id} className="mt-1 text-lg font-semibold tracking-tight">
        {title}
      </h3>
      <p className="mt-1 text-sm text-pretty text-muted">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  )
}

export function DataTable({
  caption,
  headers,
  rows,
}: {
  caption: string
  headers: string[]
  rows: (string | number)[][]
}) {
  return (
    <details className="mt-4 text-sm">
      <summary className="cursor-pointer text-muted hover:text-foreground">Show the numbers</summary>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse text-left tabular-nums">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header} scope="col" className="border-b border-border px-2 py-1.5 font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="border-b border-border px-2 py-1.5">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}

export const FEATURE_COLORS = ["var(--f1)", "var(--f2)", "var(--f3)", "var(--f4)", "var(--f5)"]
