"use client"

import type { RowSelectionState } from "@tanstack/react-table"
import {
  PackageSearchIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import {
  InventoryTable,
  PAGE_SIZE,
  STATUS_PRESENTATION,
} from "@/components/inventory-table"
import { ItemDialog } from "@/components/item-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  CATEGORIES,
  SEED_ITEMS,
  STATUSES,
  type Category,
  type InventoryItem,
  type ItemDraft,
  type Status,
} from "@/lib/inventory"

const FAKE_LOAD_MS = 700

const CATEGORY_FILTER_ITEMS = [
  { value: "all", label: "All categories" },
  ...CATEGORIES.map((value) => ({ value, label: value })),
]

const STATUS_FILTER_ITEMS = [
  { value: "all", label: "All statuses" },
  ...STATUSES.map((value) => ({
    value,
    label: STATUS_PRESENTATION[value].label,
  })),
]

// `item` is kept after closing so the title does not flip from "Edit item"
// to "Add item" while the dialog animates out.
type DialogState = { isOpen: boolean; item: InventoryItem | null }

function TableSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading items"
      className="flex flex-col gap-4 rounded-lg border p-4"
    >
      {Array.from({ length: PAGE_SIZE }, (_, row) => (
        <div key={row} className="flex items-center gap-4">
          <Skeleton className="size-4" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="hidden h-4 w-20 sm:block" />
          <Skeleton className="hidden h-4 w-24 sm:block" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

export function InventoryScreen() {
  const [items, setItems] = useState<InventoryItem[]>(SEED_ITEMS)
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<Category | "all">("all")
  const [status, setStatus] = useState<Status | "all">("all")
  const [pageIndex, setPageIndex] = useState(0)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    item: null,
  })
  const [pendingDelete, setPendingDelete] = useState<InventoryItem[] | null>(
    null
  )

  // Requirement 6: pretend the first load takes a moment.
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), FAKE_LOAD_MS)
    return () => clearTimeout(timer)
  }, [])

  // Narrow once, into one array. Sorting, paging and the counts all read it.
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase()
    return items.filter(
      (item) =>
        (category === "all" || item.category === category) &&
        (status === "all" || item.status === status) &&
        (term === "" ||
          item.name.toLowerCase().includes(term) ||
          item.sku.toLowerCase().includes(term))
    )
  }, [items, query, category, status])

  const selectedItems = useMemo(
    () => items.filter((item) => rowSelection[item.id]),
    [items, rowSelection]
  )

  const hasFilters =
    query.trim() !== "" || category !== "all" || status !== "all"

  // Stable identities: the table rebuilds its column definitions when these
  // change.
  const openEdit = useCallback(
    (item: InventoryItem) => setDialog({ isOpen: true, item }),
    []
  )
  const askDelete = useCallback(
    (item: InventoryItem) => setPendingDelete([item]),
    []
  )

  function changeFilter(apply: () => void) {
    apply()
    setPageIndex(0)
  }

  function clearFilters() {
    setQuery("")
    setCategory("all")
    setStatus("all")
    setPageIndex(0)
  }

  function saveItem(draft: ItemDraft) {
    const editing = dialog.item
    if (editing) {
      setItems((current) =>
        current.map((item) =>
          item.id === editing.id ? { ...draft, id: editing.id } : item
        )
      )
      toast(`Saved “${draft.name}”`, { id: "inventory-save" })
    } else {
      const id = `new-${Date.now()}`
      setItems((current) => [{ ...draft, id }, ...current])
      toast(`Added “${draft.name}”`, { id: "inventory-save" })
    }
    setDialog((current) => ({ ...current, isOpen: false }))
  }

  function confirmDelete() {
    if (!pendingDelete) return
    const removed = pendingDelete
    const removedIds = new Set(removed.map((item) => item.id))
    const before = items

    setItems((current) => current.filter((item) => !removedIds.has(item.id)))
    // TanStack Table keeps selection by id and does not prune it when rows go.
    setRowSelection((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([id]) => !removedIds.has(id))
      )
    )
    setPendingDelete(null)

    toast(
      removed.length === 1
        ? `Deleted “${removed[0].name}”`
        : `Deleted ${removed.length} items`,
      {
        id: "inventory-delete",
        action: { label: "Undo", onClick: () => setItems(before) },
      }
    )
  }

  // Shown while the dialog animates out, after pendingDelete is cleared.
  const deleteTitle =
    pendingDelete && pendingDelete.length > 1
      ? `Delete ${pendingDelete.length} items?`
      : `Delete “${pendingDelete?.[0]?.name ?? "item"}”?`

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Inventory
          </h1>
          {/* Announces the new count when a filter changes the list. */}
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {isLoading
              ? "Loading items…"
              : hasFilters
                ? `${visible.length} of ${items.length} items`
                : `${items.length} items`}
          </p>
        </div>
        <Button onClick={() => setDialog({ isOpen: true, item: null })}>
          <PlusIcon data-icon="inline-start" aria-hidden="true" />
          Add item
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <InputGroup className="w-full sm:w-72">
          <InputGroupInput
            type="text"
            inputMode="search"
            aria-label="Search items"
            placeholder="Search by name or SKU…"
            value={query}
            onChange={(event) =>
              changeFilter(() => setQuery(event.target.value))
            }
          />
          <InputGroupAddon>
            <SearchIcon aria-hidden="true" />
          </InputGroupAddon>
          {query !== "" ? (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                aria-label="Clear search"
                onClick={() => changeFilter(() => setQuery(""))}
              >
                <XIcon aria-hidden="true" />
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
        </InputGroup>

        <Select
          items={CATEGORY_FILTER_ITEMS}
          value={category}
          onValueChange={(value) =>
            changeFilter(() => setCategory(value as Category | "all"))
          }
        >
          <SelectTrigger aria-label="Category" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {CATEGORY_FILTER_ITEMS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select
          items={STATUS_FILTER_ITEMS}
          value={status}
          onValueChange={(value) =>
            changeFilter(() => setStatus(value as Status | "all"))
          }
        >
          <SelectTrigger aria-label="Status" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {STATUS_FILTER_ITEMS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {hasFilters ? (
          <Button variant="ghost" onClick={clearFilters}>
            Clear filters
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : visible.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageSearchIcon aria-hidden="true" />
            </EmptyMedia>
            {/* EmptyTitle renders a div. Give it heading semantics so it shows
                up in the page outline for screen reader users. */}
            <EmptyTitle role="heading" aria-level={2}>
              {items.length === 0 ? "No items yet" : "No matching items"}
            </EmptyTitle>
            <EmptyDescription>
              {items.length === 0
                ? "Add your first item to start tracking stock."
                : "Nothing matches the current search and filters."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {items.length === 0 ? (
              <Button onClick={() => setDialog({ isOpen: true, item: null })}>
                Add item
              </Button>
            ) : (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </EmptyContent>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          <InventoryTable
            items={visible}
            pageIndex={pageIndex}
            onPageIndexChange={setPageIndex}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            onEdit={openEdit}
            onDelete={askDelete}
          />
          {/* A live region has to exist before its text changes, so this one
              is always rendered and the toolbar below is not. */}
          <p className="sr-only" aria-live="polite">
            {selectedItems.length > 0
              ? `${selectedItems.length} rows selected`
              : ""}
          </p>
          {/* Below the table and sticky: a bar above the table would push the
              rows down under the pointer on the first tick. */}
          {selectedItems.length > 0 ? (
            <div
              role="toolbar"
              aria-label="Bulk actions"
              className="sticky bottom-4 z-10 flex flex-wrap items-center gap-2 rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-md"
            >
              <p className="mr-auto text-sm font-medium">
                {selectedItems.length} selected
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRowSelection({})}
              >
                Clear selection
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setPendingDelete(selectedItems)}
              >
                <Trash2Icon data-icon="inline-start" aria-hidden="true" />
                Delete selected
              </Button>
            </div>
          ) : null}
        </div>
      )}

      <ItemDialog
        isOpen={dialog.isOpen}
        item={dialog.item}
        existing={items}
        onSave={saveItem}
        onClose={() => setDialog((current) => ({ ...current, isOpen: false }))}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              The items are removed from the inventory list. You can undo this
              from the confirmation message.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
