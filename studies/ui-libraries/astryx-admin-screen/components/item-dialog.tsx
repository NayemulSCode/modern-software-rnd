"use client";

import { Button } from "@astryxdesign/core/Button";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { HStack, Layout, LayoutContent, LayoutFooter, VStack } from "@astryxdesign/core/Layout";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { Selector } from "@astryxdesign/core/Selector";
import { Switch } from "@astryxdesign/core/Switch";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useState } from "react";
import {
  CATEGORIES,
  type Category,
  type DraftErrors,
  type InventoryItem,
  type ItemDraft,
  STATUSES,
  type Status,
  validateDraft,
} from "@/lib/inventory";

const EMPTY_DRAFT: ItemDraft = {
  name: "",
  sku: "",
  category: "Coffee",
  stock: 0,
  price: 0,
  status: "draft",
  isFeatured: false,
};

const STATUS_LABELS: Record<Status, string> = { active: "Active", draft: "Draft", archived: "Archived" };

type ItemDialogProps = {
  isOpen: boolean;
  /** The item being edited, or null when creating a new one. */
  item: InventoryItem | null;
  existing: InventoryItem[];
  onSave: (draft: ItemDraft) => void;
  onClose: () => void;
};

function toError(message: string | undefined) {
  return message ? ({ type: "error", message } as const) : undefined;
}

function ItemForm({ item, existing, onSave, onClose }: Omit<ItemDialogProps, "isOpen">) {
  const [draft, setDraft] = useState<ItemDraft>(() => {
    if (!item) return EMPTY_DRAFT;
    return {
      name: item.name,
      sku: item.sku,
      category: item.category,
      stock: item.stock,
      price: item.price,
      status: item.status,
      isFeatured: item.isFeatured,
    };
  });
  const [errors, setErrors] = useState<DraftErrors>({});

  // Astryx inputs are controlled and call onChange with the value itself, not
  // an event, so one small helper covers every field.
  function set<K extends keyof ItemDraft>(key: K, value: ItemDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    if (key in errors) setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function submit() {
    const nextErrors = validateDraft(draft, existing, item?.id);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSave({ ...draft, name: draft.name.trim(), sku: draft.sku.trim() });
  }

  return (
    <Layout
      header={
        <DialogHeader
          title={item ? "Edit item" : "Add item"}
          subtitle={item ? item.sku : "New items start as drafts unless you change the status."}
          onOpenChange={onClose}
        />
      }
      content={
        <LayoutContent>
          <VStack gap={4}>
            <TextInput
              label="Name"
              isRequired
              value={draft.name}
              onChange={(value) => set("name", value)}
              onEnter={submit}
              status={toError(errors.name)}
            />
            <TextInput
              label="SKU"
              isRequired
              description="Two capital letters, a dash and four digits."
              placeholder="CO-1234"
              value={draft.sku}
              onChange={(value) => set("sku", value.toUpperCase())}
              onEnter={submit}
              status={toError(errors.sku)}
            />
            <HStack gap={3} wrap="wrap">
              <Selector
                label="Category"
                width={200}
                value={draft.category}
                onChange={(value) => set("category", value as Category)}
                options={[...CATEGORIES]}
              />
              <Selector
                label="Status"
                width={200}
                value={draft.status}
                onChange={(value) => set("status", value as Status)}
                options={STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] }))}
              />
            </HStack>
            <HStack gap={3} wrap="wrap">
              <NumberInput
                label="Stock"
                isRequired
                width={200}
                isIntegerOnly
                min={0}
                hasNumberSteppers
                units="units"
                value={draft.stock}
                onChange={(value) => set("stock", value)}
                status={toError(errors.stock)}
              />
              <NumberInput
                label="Price"
                isRequired
                width={200}
                min={0}
                step={0.5}
                units="USD"
                value={draft.price}
                onChange={(value) => set("price", value)}
                status={toError(errors.price)}
              />
            </HStack>
            <Switch
              label="Featured"
              description="Featured items are highlighted in the storefront."
              value={draft.isFeatured}
              onChange={(value) => set("isFeatured", value)}
            />
          </VStack>
        </LayoutContent>
      }
      footer={
        <LayoutFooter>
          <HStack gap={2} hAlign="end">
            <Button label="Cancel" variant="secondary" onClick={onClose} />
            <Button label={item ? "Save changes" : "Add item"} variant="primary" onClick={submit} />
          </HStack>
        </LayoutFooter>
      }
    />
  );
}

export function ItemDialog({ isOpen, item, existing, onSave, onClose }: ItemDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      // "form": Escape still closes, but a click on the backdrop does not
      // once the user has typed something.
      purpose="form"
      width={480}
    >
      {/* The key resets the form state whenever a different item is opened. */}
      {isOpen ? (
        <ItemForm key={item?.id ?? "new"} item={item} existing={existing} onSave={onSave} onClose={onClose} />
      ) : null}
    </Dialog>
  );
}
