"use client";

import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { Button } from "@astryxdesign/core/Button";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Icon } from "@astryxdesign/core/Icon";
import { IconButton } from "@astryxdesign/core/IconButton";
import { HStack, Layout, LayoutContent, StackItem, VStack } from "@astryxdesign/core/Layout";
import { Selector } from "@astryxdesign/core/Selector";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import {
  paginateData,
  pixel,
  proportional,
  Table,
  type TableColumn,
  TableSelectionToolbar,
  useTablePagination,
  useTableSelection,
  useTableSelectionState,
  useTableSortable,
  useTableSortableState,
} from "@astryxdesign/core/Table";
import { Heading, Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useToast } from "@astryxdesign/core/Toast";
import { Token } from "@astryxdesign/core/Token";
import { MagnifyingGlassIcon, PencilSquareIcon, PlusIcon, StarIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";
import {
  CATEGORIES,
  type Category,
  formatPrice,
  type InventoryItem,
  type ItemDraft,
  LOW_STOCK_THRESHOLD,
  SEED_ITEMS,
  STATUSES,
  type Status,
} from "@/lib/inventory";
import { ItemDialog } from "./item-dialog";

const PAGE_SIZE = 10;
const FAKE_LOAD_MS = 700;

const CATEGORY_COLORS = {
  Coffee: "orange",
  Tea: "green",
  Equipment: "blue",
  Accessories: "purple",
  Merch: "pink",
} as const satisfies Record<Category, string>;

const STATUS_PRESENTATION = {
  active: { label: "Active", variant: "success" },
  draft: { label: "Draft", variant: "neutral" },
  archived: { label: "Archived", variant: "warning" },
} as const satisfies Record<Status, { label: string; variant: string }>;

type DialogState = { kind: "closed" } | { kind: "create" } | { kind: "edit"; item: InventoryItem };

function TableSkeleton() {
  return (
    <VStack gap={4} paddingBlock={2}>
      {Array.from({ length: PAGE_SIZE }, (_, row) => (
        <HStack key={row} gap={4} vAlign="center">
          <Skeleton width={20} height={20} index={row * 5} />
          <StackItem size="fill">
            <Skeleton width="70%" height={16} index={row * 5 + 1} />
          </StackItem>
          <Skeleton width={90} height={16} index={row * 5 + 2} />
          <Skeleton width={80} height={16} index={row * 5 + 3} />
          <Skeleton width={70} height={16} index={row * 5 + 4} />
        </HStack>
      ))}
    </VStack>
  );
}

export function InventoryScreen() {
  const toast = useToast();

  const [items, setItems] = useState<InventoryItem[]>(SEED_ITEMS);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [status, setStatus] = useState<Status | "all">("all");
  const [page, setPage] = useState(1);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<DialogState>({ kind: "closed" });
  const [pendingDelete, setPendingDelete] = useState<InventoryItem[] | null>(null);

  // Requirement 6: pretend the first load takes a moment.
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), FAKE_LOAD_MS);
    return () => clearTimeout(timer);
  }, []);

  // Narrow once, into one array. Sorting, paging and the counts all read it.
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter(
      (item) =>
        (category === "all" || item.category === category) &&
        (status === "all" || item.status === status) &&
        (term === "" || item.name.toLowerCase().includes(term) || item.sku.toLowerCase().includes(term)),
    );
  }, [items, query, category, status]);

  const { sortedData, sortConfig } = useTableSortableState<InventoryItem>({
    data: visible,
    defaultSort: [{ sortKey: "name", direction: "ascending" }],
  });
  const sortPlugin = useTableSortable<InventoryItem>(sortConfig);

  const pageCount = Math.max(1, Math.ceil(sortedData.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = paginateData(sortedData, currentPage, PAGE_SIZE);

  const paginationPlugin = useTablePagination<InventoryItem>({
    page: currentPage,
    onPageChange: setPage,
    totalItems: sortedData.length,
    pageSize: PAGE_SIZE,
  });

  const { selectionConfig, selectionState } = useTableSelectionState<InventoryItem>({
    data: pageRows,
    idKey: "id",
    selectedKeys,
    setSelectedKeys,
  });
  const selectionPlugin = useTableSelection<InventoryItem>(selectionConfig);

  const hasFilters = query.trim() !== "" || category !== "all" || status !== "all";

  function changeFilter(apply: () => void) {
    apply();
    setPage(1);
  }

  function clearFilters() {
    setQuery("");
    setCategory("all");
    setStatus("all");
    setPage(1);
  }

  function saveItem(draft: ItemDraft) {
    if (dialog.kind === "edit") {
      const id = dialog.item.id;
      setItems((current) => current.map((item) => (item.id === id ? { ...draft, id } : item)));
      toast({ body: `Saved “${draft.name}”`, uniqueID: "inventory-save" });
    } else {
      const id = `new-${Date.now()}`;
      setItems((current) => [{ ...draft, id }, ...current]);
      toast({ body: `Added “${draft.name}”`, uniqueID: "inventory-save" });
    }
    setDialog({ kind: "closed" });
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const removed = pendingDelete;
    const removedIds = new Set(removed.map((item) => item.id));
    const before = items;

    setItems((current) => current.filter((item) => !removedIds.has(item.id)));
    setSelectedKeys((current) => new Set([...current].filter((key) => !removedIds.has(key))));
    setPendingDelete(null);

    const dismiss = toast({
      body: removed.length === 1 ? `Deleted “${removed[0].name}”` : `Deleted ${removed.length} items`,
      uniqueID: "inventory-delete",
      endContent: (
        <Button
          label="Undo"
          variant="ghost"
          size="sm"
          onClick={() => {
            setItems(before);
            dismiss();
          }}
        />
      ),
    });
  }

  const columns: TableColumn<InventoryItem>[] = [
    {
      key: "name",
      header: "Item",
      width: proportional(2, { minWidth: 180 }),
      sortable: true,
      renderCell: (item) => (
        <HStack gap={2} vAlign="center">
          <Text weight="semibold">{item.name}</Text>
          {item.isFeatured ? <Icon icon={StarIcon} size="sm" color="accent" label="Featured" /> : null}
        </HStack>
      ),
    },
    { key: "sku", header: "SKU", width: pixel(110), sortable: true },
    {
      key: "category",
      header: "Category",
      width: pixel(140),
      sortable: true,
      renderCell: (item) => <Token label={item.category} size="sm" color={CATEGORY_COLORS[item.category]} />,
    },
    {
      key: "stock",
      header: "Stock",
      width: pixel(120),
      align: "end",
      sortable: true,
      renderCell: (item) => (
        <HStack gap={2} vAlign="center" hAlign="end">
          {item.stock === 0 ? (
            <StatusDot variant="error" label="Out of stock" tooltip="Out of stock" />
          ) : item.stock < LOW_STOCK_THRESHOLD ? (
            <StatusDot variant="warning" label="Low stock" tooltip="Low stock" />
          ) : null}
          <Text>{item.stock}</Text>
        </HStack>
      ),
    },
    {
      key: "price",
      header: "Price",
      width: pixel(110),
      align: "end",
      sortable: true,
      renderCell: (item) => <Text>{formatPrice(item.price)}</Text>,
    },
    {
      key: "status",
      header: "Status",
      width: pixel(130),
      sortable: true,
      renderCell: (item) => {
        const presentation = STATUS_PRESENTATION[item.status];
        return (
          <HStack gap={2} vAlign="center">
            <StatusDot variant={presentation.variant} label={presentation.label} />
            <Text>{presentation.label}</Text>
          </HStack>
        );
      },
    },
    {
      key: "actions",
      header: "",
      width: pixel(96),
      resizable: false,
      renderCell: (item) => (
        <HStack gap={1} hAlign="end">
          <IconButton
            label={`Edit ${item.name}`}
            tooltip="Edit"
            variant="ghost"
            size="sm"
            icon={<Icon icon={PencilSquareIcon} />}
            onClick={() => setDialog({ kind: "edit", item })}
          />
          <IconButton
            label={`Delete ${item.name}`}
            tooltip="Delete"
            variant="ghost"
            size="sm"
            icon={<Icon icon={TrashIcon} />}
            onClick={() => setPendingDelete([item])}
          />
        </HStack>
      ),
    },
  ];

  return (
    <>
      <Layout
        height="fill"
        contentWidth={1200}
        content={
          // padding={0} on LayoutContent and the padding on the VStack instead
          // is what the Astryx table templates do: it lets the Table line up
          // with the heading above it.
          <LayoutContent padding={0} label="Inventory">
            <VStack padding={4} gap={6}>
              <HStack gap={3} vAlign="center" wrap="wrap">
                <StackItem size="fill">
                  <VStack gap={1}>
                    <Heading level={1}>Inventory</Heading>
                    <Text color="secondary">
                      {isLoading
                        ? "Loading items…"
                        : hasFilters
                          ? `${visible.length} of ${items.length} items`
                          : `${items.length} items`}
                    </Text>
                  </VStack>
                </StackItem>
                <Button
                  label="Add item"
                  variant="primary"
                  icon={<Icon icon={PlusIcon} size="sm" />}
                  onClick={() => setDialog({ kind: "create" })}
                />
              </HStack>

              <HStack gap={3} vAlign="center" wrap="wrap">
                <VStack width={280}>
                  <TextInput
                    label="Search items"
                    isLabelHidden
                    placeholder="Search by name or SKU…"
                    value={query}
                    onChange={(value) => changeFilter(() => setQuery(value))}
                    startIcon={<Icon icon={MagnifyingGlassIcon} size="sm" />}
                    hasClear
                  />
                </VStack>
                <Selector
                  label="Category"
                  isLabelHidden
                  variant="secondary"
                  value={category}
                  onChange={(value) => changeFilter(() => setCategory(value as Category | "all"))}
                  options={[{ value: "all", label: "All categories" }, ...CATEGORIES]}
                />
                <Selector
                  label="Status"
                  isLabelHidden
                  variant="secondary"
                  value={status}
                  onChange={(value) => changeFilter(() => setStatus(value as Status | "all"))}
                  options={[
                    { value: "all", label: "All statuses" },
                    ...STATUSES.map((value) => ({ value, label: STATUS_PRESENTATION[value].label })),
                  ]}
                />
                {hasFilters ? <Button label="Clear filters" variant="ghost" onClick={clearFilters} /> : null}
              </HStack>

              {isLoading ? (
                <TableSkeleton />
              ) : visible.length === 0 ? (
                <EmptyState
                  title={items.length === 0 ? "No items yet" : "No matching items"}
                  description={
                    items.length === 0
                      ? "Add your first item to start tracking stock."
                      : "Nothing matches the current search and filters."
                  }
                  actions={
                    items.length === 0 ? (
                      <Button label="Add item" variant="primary" onClick={() => setDialog({ kind: "create" })} />
                    ) : (
                      <Button label="Clear filters" variant="secondary" onClick={clearFilters} />
                    )
                  }
                />
              ) : (
                <VStack gap={2}>
                  <TableSelectionToolbar
                    selection={selectionState}
                    startContent={
                      <Button
                        label="Delete selected"
                        variant="ghost"
                        icon={<Icon icon={TrashIcon} size="sm" />}
                        onClick={() => setPendingDelete(items.filter((item) => selectedKeys.has(item.id)))}
                      />
                    }
                  />
                  <Table<InventoryItem>
                    data={pageRows}
                    columns={columns}
                    idKey="id"
                    hasHover
                    textOverflow="truncate"
                    // Tell assistive tech where this page sits in the full list.
                    rowIndexStart={(currentPage - 1) * PAGE_SIZE + 1}
                    rowCount={sortedData.length}
                    plugins={{
                      selection: selectionPlugin,
                      sort: sortPlugin,
                      pagination: paginationPlugin,
                    }}
                  />
                </VStack>
              )}
            </VStack>
          </LayoutContent>
        }
      />

      <ItemDialog
        isOpen={dialog.kind !== "closed"}
        item={dialog.kind === "edit" ? dialog.item : null}
        existing={items}
        onSave={saveItem}
        onClose={() => setDialog({ kind: "closed" })}
      />

      <AlertDialog
        isOpen={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={
          pendingDelete && pendingDelete.length > 1
            ? `Delete ${pendingDelete.length} items?`
            : `Delete “${pendingDelete?.[0]?.name ?? "item"}”?`
        }
        description="The items are removed from the inventory list. You can undo this from the confirmation message."
        actionLabel="Delete"
        onAction={confirmDelete}
      />
    </>
  );
}
