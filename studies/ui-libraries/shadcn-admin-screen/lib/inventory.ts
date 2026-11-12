// The data shape is fixed by docs/comparisons/ui-library-task.md so every UI
// library study renders the same records.

export const CATEGORIES = [
  "Coffee",
  "Tea",
  "Equipment",
  "Accessories",
  "Merch",
] as const
export const STATUSES = ["active", "draft", "archived"] as const

export type Category = (typeof CATEGORIES)[number]
export type Status = (typeof STATUSES)[number]

export type InventoryRecord = {
  id: string
  name: string
  sku: string
  category: Category
  stock: number
  price: number
  status: Status
  isFeatured: boolean
}

// Kept as a separate name so the code reads the same as the other UI library
// studies, where the table component needed a wider row type.
export type InventoryItem = InventoryRecord

export const LOW_STOCK_THRESHOLD = 10

const CATALOG: Record<Category, string[]> = {
  Coffee: [
    "Morning Blend",
    "Dark Harbour Roast",
    "Single Origin Huila",
    "Decaf House Blend",
    "Espresso No. 4",
    "Kenyan Peaberry",
    "Cold Brew Coarse Grind",
    "Honey Process Lot 12",
    "Sumatra Wet Hulled",
    "Seasonal Filter Roast",
  ],
  Tea: [
    "Assam Breakfast",
    "Jasmine Pearls",
    "Smoked Lapsang",
    "Chamomile Whole Flower",
    "Sencha First Flush",
    "Masala Chai Loose Leaf",
    "Earl Grey Bergamot",
    "Peppermint Leaf",
  ],
  Equipment: [
    "Pour-over Dripper",
    "Gooseneck Kettle 1L",
    "Burr Hand Grinder",
    "Glass Server 600ml",
    "Precision Scale",
    "French Press 8 Cup",
    "Milk Frothing Jug",
    "Cold Brew Tower",
    "Stovetop Moka Pot",
  ],
  Accessories: [
    "Paper Filters (100)",
    "Reusable Cloth Filter",
    "Tamper 58mm",
    "Knock Box",
    "Cleaning Tablets",
    "Dosing Funnel",
    "Storage Canister",
    "Thermometer Clip",
  ],
  Merch: [
    "Enamel Mug",
    "Canvas Tote",
    "Roastery Cap",
    "Barista Apron",
    "Sticker Pack",
    "Gift Card",
    "Travel Tumbler",
  ],
}

// Small deterministic hash so the "random" stock and prices are identical on
// the server, in the browser, and in every other study.
function hash(value: string): number {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const PRICE_BASE: Record<Category, number> = {
  Coffee: 12,
  Tea: 8,
  Equipment: 28,
  Accessories: 6,
  Merch: 10,
}

export const SEED_ITEMS: InventoryItem[] = CATEGORIES.flatMap((category) =>
  CATALOG[category].map((name, index) => {
    const seed = hash(name)
    const status: Status =
      seed % 9 === 0 ? "archived" : seed % 5 === 0 ? "draft" : "active"
    return {
      id: `${category.slice(0, 3).toLowerCase()}-${String(index + 1).padStart(2, "0")}`,
      name,
      sku: `${category.slice(0, 2).toUpperCase()}-${String(1000 + (seed % 9000))}`,
      category,
      stock: seed % 7 === 0 ? seed % 9 : 12 + (seed % 140),
      price: PRICE_BASE[category] + (seed % 2400) / 100,
      status,
      isFeatured: seed % 6 === 0,
    }
  })
)

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value)
}

export type ItemDraft = Omit<InventoryRecord, "id">

export type DraftErrors = Partial<
  Record<"name" | "sku" | "stock" | "price", string>
>

/** Validation lives outside the UI so it is identical in every library study. */
export function validateDraft(
  draft: ItemDraft,
  existing: InventoryItem[],
  editingId?: string
): DraftErrors {
  const errors: DraftErrors = {}

  if (draft.name.trim().length < 2)
    errors.name = "Enter a name of at least 2 characters."

  if (!/^[A-Z]{2}-\d{4}$/.test(draft.sku.trim())) {
    errors.sku =
      "Use two capital letters, a dash and four digits, like CO-1234."
  } else if (
    existing.some(
      (item) => item.sku === draft.sku.trim() && item.id !== editingId
    )
  ) {
    errors.sku = "Another item already uses this SKU."
  }

  if (!Number.isInteger(draft.stock) || draft.stock < 0)
    errors.stock = "Stock must be a whole number, 0 or more."
  if (!(draft.price > 0)) errors.price = "Enter a price above 0."

  return errors
}
