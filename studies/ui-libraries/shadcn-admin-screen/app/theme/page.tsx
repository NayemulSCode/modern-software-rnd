import type { Metadata } from "next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export const metadata: Metadata = { title: "Theme tokens" }

// Each entry is a CSS variable from app/globals.css. Switching the theme or
// the colour mode in the sidebar only changes these values.
const COLOR_TOKENS = [
  { name: "background", swatch: "bg-background" },
  { name: "foreground", swatch: "bg-foreground" },
  { name: "primary", swatch: "bg-primary" },
  { name: "secondary", swatch: "bg-secondary" },
  { name: "muted", swatch: "bg-muted" },
  { name: "accent", swatch: "bg-accent" },
  { name: "destructive", swatch: "bg-destructive" },
  { name: "border", swatch: "bg-border" },
  { name: "ring", swatch: "bg-ring" },
] as const

const RADIUS_TOKENS = [
  { name: "radius-sm", shape: "rounded-sm" },
  { name: "radius-md", shape: "rounded-md" },
  { name: "radius-lg", shape: "rounded-lg" },
  { name: "radius-xl", shape: "rounded-xl" },
] as const

export default function ThemePage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Theme tokens
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          Every component reads its colours and corner radius from CSS
          variables. The brand theme overrides six of them. Change the theme or
          the colour mode in the sidebar and watch this page.
        </p>
      </div>

      <section aria-labelledby="colors-heading" className="flex flex-col gap-3">
        <h2 id="colors-heading" className="text-sm font-medium">
          Colours
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {COLOR_TOKENS.map((token) => (
            <li
              key={token.name}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <span
                aria-hidden="true"
                className={`size-8 shrink-0 rounded-md border ${token.swatch}`}
              />
              <code className="truncate font-mono text-xs">--{token.name}</code>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="radius-heading" className="flex flex-col gap-3">
        <h2 id="radius-heading" className="text-sm font-medium">
          Corner radius
        </h2>
        <ul className="flex flex-wrap gap-3">
          {RADIUS_TOKENS.map((token) => (
            <li
              key={token.name}
              className={`flex size-24 items-end border bg-muted p-2 ${token.shape}`}
            >
              <code className="font-mono text-xs">{token.name}</code>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="components-heading"
        className="flex flex-col gap-3"
      >
        <h2 id="components-heading" className="text-sm font-medium">
          On components
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
          <Badge>Badge</Badge>
          <Badge variant="outline">Outline</Badge>
          <Input
            aria-label="Sample input"
            placeholder="Focus me to see the ring"
            className="w-56"
          />
        </div>
      </section>
    </div>
  )
}
