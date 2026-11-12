import type { Metadata } from "next"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const metadata: Metadata = { title: "About this study" }

const REQUIREMENTS = [
  {
    requirement: "App frame",
    built: "Sidebar (collapses to a sheet on small screens), Button",
    extra: "Header bar and page width are Tailwind classes",
  },
  {
    requirement: "Table: sort, select, paginate",
    built: "Table, Checkbox, Button, Pagination",
    extra: "TanStack Table v9 for the behaviour; markup and ARIA by hand",
  },
  {
    requirement: "Search, filters, empty state",
    built: "InputGroup, Select, Empty",
    extra: "Filtering is plain array code",
  },
  {
    requirement: "Create and edit dialog",
    built: "Dialog, Field, Input, Select, Switch",
    extra: "No number field component: a native number input",
  },
  {
    requirement: "Delete with confirm and undo",
    built: "AlertDialog, Sonner toast with an action",
    extra: "None",
  },
  {
    requirement: "Loading state",
    built: "Skeleton",
    extra: "Row layout is Tailwind classes",
  },
  {
    requirement: "Light, dark and brand theme",
    built: "CSS variables, next-themes",
    extra: "A small hand-written store for the brand theme",
  },
  {
    requirement: "Small screens and keyboards",
    built: "Base UI primitives, Tailwind breakpoints",
    extra: "None",
  },
] as const

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          About this study
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          This is the shared inventory admin screen from the UI library
          comparison, built with shadcn/ui. shadcn/ui is not a package you
          import: its CLI copies component source files into the project, and
          you own them from then on.
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">shadcn CLI 4.23</Badge>
          <Badge variant="secondary">Base UI 1.9</Badge>
          <Badge variant="secondary">Tailwind CSS 4</Badge>
          <Badge variant="secondary">TanStack Table 9</Badge>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table aria-label="How each requirement was built">
          <TableHeader>
            <TableRow>
              <TableHead>Requirement</TableHead>
              <TableHead>Built with</TableHead>
              <TableHead>Not covered by shadcn/ui</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {REQUIREMENTS.map((row) => (
              <TableRow key={row.requirement}>
                <TableCell className="font-medium">{row.requirement}</TableCell>
                <TableCell>{row.built}</TableCell>
                <TableCell className="text-muted-foreground">
                  {row.extra}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
