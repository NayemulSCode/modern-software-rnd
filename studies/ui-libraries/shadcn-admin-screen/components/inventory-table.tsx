"use client"

import {
  createColumnHelper,
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type Updater,
} from "@tanstack/react-table"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  PencilIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react"
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  formatPrice,
  LOW_STOCK_THRESHOLD,
  type InventoryItem,
  type Status,
} from "@/lib/inventory"
import { cn } from "@/lib/utils"

export const PAGE_SIZE = 10

export const STATUS_PRESENTATION = {
  active: { label: "Active", dot: "bg-emerald-500" },
  draft: { label: "Draft", dot: "bg-muted-foreground/60" },
  archived: { label: "Archived", dot: "bg-amber-500" },
} as const satisfies Record<Status, { label: string; dot: string }>

// TanStack Table v9 only bundles the features that are registered here.
// It must stay at module scope: a new object on every render would rebuild
// the row models each time.
const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
})

const helper = createColumnHelper<typeof features, InventoryItem>()

const RIGHT_ALIGNED = new Set(["stock", "price", "actions"])

type RowActions = {
  onEdit: (item: InventoryItem) => void
  onDelete: (item: InventoryItem) => void
}

function buildColumns({ onEdit, onDelete }: RowActions) {
  return helper.columns([
    helper.display({
      id: "select",
      enableSorting: false,
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all rows on this page"
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={
            table.getIsSomePageRowsSelected() &&
            !table.getIsAllPageRowsSelected()
          }
          onCheckedChange={(checked) =>
            table.toggleAllPageRowsSelected(checked)
          }
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Select ${row.original.name}`}
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(checked)}
        />
      ),
    }),
    helper.accessor("name", {
      header: "Item",
      cell: ({ row }) => (
        <span className="flex items-center gap-2">
          <span className="font-medium">{row.original.name}</span>
          {row.original.isFeatured ? (
            <StarIcon
              role="img"
              aria-label="Featured"
              className="size-3.5 fill-current text-primary"
            />
          ) : null}
        </span>
      ),
    }),
    helper.accessor("sku", {
      header: "SKU",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.sku}</span>
      ),
    }),
    helper.accessor("category", {
      header: "Category",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.category}</Badge>
      ),
    }),
    helper.accessor("stock", {
      header: "Stock",
      cell: ({ row }) => {
        const { stock } = row.original
        return (
          <span className="inline-flex items-center justify-end gap-2 tabular-nums">
            {stock === 0 ? (
              <Badge variant="destructive">Out of stock</Badge>
            ) : stock < LOW_STOCK_THRESHOLD ? (
              <Badge variant="outline">Low stock</Badge>
            ) : null}
            {stock}
          </span>
        )
      },
    }),
    helper.accessor("price", {
      header: "Price",
      cell: ({ row }) => (
        <span className="tabular-nums">{formatPrice(row.original.price)}</span>
      ),
    }),
    helper.accessor("status", {
      header: "Status",
      cell: ({ row }) => {
        const presentation = STATUS_PRESENTATION[row.original.status]
        return (
          <Badge variant="outline">
            <span
              aria-hidden="true"
              className={cn("size-1.5 rounded-full", presentation.dot)}
            />
            {presentation.label}
          </Badge>
        )
      },
    }),
    helper.display({
      id: "actions",
      enableSorting: false,
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <span className="flex justify-end gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit ${row.original.name}`}
                  onClick={() => onEdit(row.original)}
                />
              }
            >
              <PencilIcon aria-hidden="true" />
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${row.original.name}`}
                  onClick={() => onDelete(row.original)}
                />
              }
            >
              <Trash2Icon aria-hidden="true" />
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </span>
      ),
    }),
  ])
}

type InventoryTableProps = RowActions & {
  /** Already narrowed by the search and filters. */
  items: InventoryItem[]
  pageIndex: number
  onPageIndexChange: (pageIndex: number) => void
  rowSelection: RowSelectionState
  onRowSelectionChange: (updater: Updater<RowSelectionState>) => void
}

export function InventoryTable({
  items,
  pageIndex,
  onPageIndexChange,
  rowSelection,
  onRowSelectionChange,
  onEdit,
  onDelete,
}: InventoryTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: false },
  ])
  const columns = useMemo(
    () => buildColumns({ onEdit, onDelete }),
    [onEdit, onDelete]
  )

  // Deleting or filtering can leave the saved page past the end.
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const safePageIndex = Math.min(pageIndex, pageCount - 1)
  const pagination = useMemo<PaginationState>(
    () => ({ pageIndex: safePageIndex, pageSize: PAGE_SIZE }),
    [safePageIndex]
  )

  const table = useTable({
    features,
    columns,
    data: items,
    getRowId: (item) => item.id,
    state: { sorting, pagination, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange,
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(pagination) : updater
      onPageIndexChange(next.pageIndex)
    },
    // The screen resets the page itself when a filter changes. Leaving this
    // on would also jump back to page 1 after every edit.
    autoResetPageIndex: false,
    enableSortingRemoval: false,
    sortDescFirst: false,
  })

  const firstRow = safePageIndex * PAGE_SIZE + 1
  const lastRow = Math.min(items.length, firstRow + PAGE_SIZE - 1)

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border">
        {/* aria-rowcount and aria-rowindex tell assistive tech where this
            page sits in the full list. The header row is row 1. */}
        <Table aria-label="Inventory items" aria-rowcount={items.length + 1}>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} aria-rowindex={1}>
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={
                        sorted === "asc"
                          ? "ascending"
                          : sorted === "desc"
                            ? "descending"
                            : undefined
                      }
                      className={cn(
                        // min-w keeps the checkbox clear of the sort button
                        // when a narrow screen squeezes the columns.
                        header.column.id === "select" && "w-10 min-w-10",
                        RIGHT_ALIGNED.has(header.column.id) && "text-right"
                      )}
                    >
                      {header.column.getCanSort() ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="-mx-2.5"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <table.FlexRender header={header} />
                          {sorted === "asc" ? (
                            <ArrowUpIcon aria-hidden="true" />
                          ) : sorted === "desc" ? (
                            <ArrowDownIcon aria-hidden="true" />
                          ) : (
                            <ChevronsUpDownIcon
                              aria-hidden="true"
                              className="text-muted-foreground"
                            />
                          )}
                        </Button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row, index) => (
              <TableRow
                key={row.id}
                aria-rowindex={firstRow + index + 1}
                data-state={row.getIsSelected() ? "selected" : undefined}
              >
                {row.getAllCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      RIGHT_ALIGNED.has(cell.column.id) && "text-right"
                    )}
                  >
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Showing {firstRow}–{lastRow} of {items.length}
        </p>
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="ghost"
                size="sm"
                disabled={safePageIndex === 0}
                onClick={() => onPageIndexChange(safePageIndex - 1)}
              >
                <ChevronLeftIcon data-icon="inline-start" aria-hidden="true" />
                Previous
              </Button>
            </PaginationItem>
            {Array.from({ length: pageCount }, (_, page) => (
              <PaginationItem key={page}>
                <Button
                  variant={page === safePageIndex ? "outline" : "ghost"}
                  size="icon-sm"
                  aria-label={`Page ${page + 1}`}
                  aria-current={page === safePageIndex ? "page" : undefined}
                  onClick={() => onPageIndexChange(page)}
                >
                  {page + 1}
                </Button>
              </PaginationItem>
            ))}
            <PaginationItem>
              <Button
                variant="ghost"
                size="sm"
                disabled={safePageIndex >= pageCount - 1}
                onClick={() => onPageIndexChange(safePageIndex + 1)}
              >
                Next
                <ChevronRightIcon data-icon="inline-end" aria-hidden="true" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
