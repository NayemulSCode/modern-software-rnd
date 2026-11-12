"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  CATEGORIES,
  STATUSES,
  validateDraft,
  type Category,
  type DraftErrors,
  type InventoryItem,
  type ItemDraft,
  type Status,
} from "@/lib/inventory"

import { STATUS_PRESENTATION } from "./inventory-table"

const CATEGORY_ITEMS = CATEGORIES.map((value) => ({ value, label: value }))
const STATUS_ITEMS = STATUSES.map((value) => ({
  value,
  label: STATUS_PRESENTATION[value].label,
}))

// Number inputs are kept as text while typing, so an empty field stays empty
// instead of turning into 0.
type FormValues = Omit<ItemDraft, "stock" | "price"> & {
  stock: string
  price: string
}

const EMPTY_VALUES: FormValues = {
  name: "",
  sku: "",
  category: "Coffee",
  status: "active",
  stock: "",
  price: "",
  isFeatured: false,
}

const ERROR_ORDER = ["name", "sku", "stock", "price"] as const

function toFormValues(item: InventoryItem | null): FormValues {
  if (!item) return EMPTY_VALUES
  return {
    name: item.name,
    sku: item.sku,
    category: item.category,
    status: item.status,
    stock: String(item.stock),
    price: item.price.toFixed(2),
    isFeatured: item.isFeatured,
  }
}

function toNumber(value: string): number {
  return value.trim() === "" ? Number.NaN : Number(value)
}

type ItemDialogProps = {
  isOpen: boolean
  /** The item being edited, or null when adding a new one. */
  item: InventoryItem | null
  existing: InventoryItem[]
  onSave: (draft: ItemDraft) => void
  onClose: () => void
}

export function ItemDialog({
  isOpen,
  item,
  existing,
  onSave,
  onClose,
}: ItemDialogProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? "Edit item" : "Add item"}</DialogTitle>
          <DialogDescription>
            {item
              ? "Change the details and save."
              : "Fill in the details for the new stock item."}
          </DialogDescription>
        </DialogHeader>
        {/* The popup unmounts when closed, so the form starts clean each time. */}
        <ItemForm item={item} existing={existing} onSave={onSave} />
      </DialogContent>
    </Dialog>
  )
}

function ItemForm({
  item,
  existing,
  onSave,
}: Pick<ItemDialogProps, "item" | "existing" | "onSave">) {
  const [values, setValues] = useState<FormValues>(() => toFormValues(item))
  const [errors, setErrors] = useState<DraftErrors>({})

  function update<Key extends keyof FormValues>(
    key: Key,
    value: FormValues[Key]
  ) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const draft: ItemDraft = {
      ...values,
      name: values.name.trim(),
      sku: values.sku.trim(),
      stock: toNumber(values.stock),
      price: toNumber(values.price),
    }
    const nextErrors = validateDraft(draft, existing, item?.id)
    setErrors(nextErrors)

    const firstInvalid = ERROR_ORDER.find((key) => nextErrors[key])
    if (firstInvalid) {
      // Move focus to the first problem so keyboard and screen reader users
      // land on the field and hear its message.
      const field = event.currentTarget.elements.namedItem(firstInvalid)
      if (field instanceof HTMLElement) field.focus()
      return
    }

    onSave(draft)
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FieldGroup className="gap-4">
        <Field data-invalid={errors.name ? true : undefined}>
          <FieldLabel htmlFor="item-name">Name</FieldLabel>
          <Input
            id="item-name"
            name="name"
            autoComplete="off"
            required
            value={values.name}
            onChange={(event) => update("name", event.target.value)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "item-name-error" : undefined}
          />
          {errors.name ? (
            <FieldError id="item-name-error">{errors.name}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={errors.sku ? true : undefined}>
          <FieldLabel htmlFor="item-sku">SKU</FieldLabel>
          <Input
            id="item-sku"
            name="sku"
            autoComplete="off"
            autoCapitalize="characters"
            placeholder="CO-1234"
            required
            value={values.sku}
            onChange={(event) =>
              update("sku", event.target.value.toUpperCase())
            }
            aria-invalid={errors.sku ? true : undefined}
            aria-describedby={errors.sku ? "item-sku-error" : undefined}
          />
          {errors.sku ? (
            <FieldError id="item-sku-error">{errors.sku}</FieldError>
          ) : null}
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="item-category">Category</FieldLabel>
            <Select
              items={CATEGORY_ITEMS}
              value={values.category}
              onValueChange={(value) => update("category", value as Category)}
            >
              <SelectTrigger id="item-category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {CATEGORY_ITEMS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="item-status">Status</FieldLabel>
            <Select
              items={STATUS_ITEMS}
              value={values.status}
              onValueChange={(value) => update("status", value as Status)}
            >
              <SelectTrigger id="item-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {STATUS_ITEMS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 items-start gap-4">
          <Field data-invalid={errors.stock ? true : undefined}>
            <FieldLabel htmlFor="item-stock">Stock</FieldLabel>
            <Input
              id="item-stock"
              name="stock"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              required
              value={values.stock}
              onChange={(event) => update("stock", event.target.value)}
              aria-invalid={errors.stock ? true : undefined}
              aria-describedby={errors.stock ? "item-stock-error" : undefined}
            />
            {errors.stock ? (
              <FieldError id="item-stock-error">{errors.stock}</FieldError>
            ) : null}
          </Field>

          <Field data-invalid={errors.price ? true : undefined}>
            <FieldLabel htmlFor="item-price">Price (USD)</FieldLabel>
            <Input
              id="item-price"
              name="price"
              type="number"
              inputMode="decimal"
              min={0}
              step={0.01}
              required
              value={values.price}
              onChange={(event) => update("price", event.target.value)}
              aria-invalid={errors.price ? true : undefined}
              aria-describedby={errors.price ? "item-price-error" : undefined}
            />
            {errors.price ? (
              <FieldError id="item-price-error">{errors.price}</FieldError>
            ) : null}
          </Field>
        </div>

        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="item-featured">Featured</FieldLabel>
            <FieldDescription>
              Featured items are marked with a star in the list.
            </FieldDescription>
          </FieldContent>
          <Switch
            id="item-featured"
            checked={values.isFeatured}
            onCheckedChange={(checked) => update("isFeatured", checked)}
          />
        </Field>
      </FieldGroup>

      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit">{item ? "Save changes" : "Add item"}</Button>
      </DialogFooter>
    </form>
  )
}
