import type { ReactNode } from "react"

const TONES = {
  note: { label: "Note", className: "border-accent bg-accent-soft/40" },
  developer: { label: "If you write software", className: "border-good bg-surface" },
  caution: { label: "Careful", className: "border-warn bg-surface" },
} as const

export function Callout({
  tone = "note",
  title,
  children,
}: {
  tone?: keyof typeof TONES
  title?: string
  children: ReactNode
}) {
  const { label, className } = TONES[tone]
  return (
    <aside
      aria-label={title ?? label}
      className={`not-prose my-8 rounded-r-lg border-l-4 px-5 py-4 text-base ${className}`}
    >
      <p className="font-semibold">{title ?? label}</p>
      <div className="mt-2 flex flex-col gap-3 leading-relaxed [&_a]:text-accent [&_a]:underline [&_code]:rounded [&_code]:bg-surface [&_code]:px-1 [&_code]:font-mono [&_code]:text-sm">
        {children}
      </div>
    </aside>
  )
}
