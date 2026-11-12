# The UI library test screen

Every UI library studied in this repository builds **the same screen**, so the results can be compared fairly. This file is the specification. Do not change it for one library; if the task needs to change, change it here and re-run the earlier studies.

## The screen: inventory admin

A single page for managing a list of about 40 stock items.

### Required

1. **App frame.** Side navigation with at least three destinations, a page title, and one primary action ("Add item").
2. **Table.** At least 40 rows and six columns, with:
   - sortable columns (text and numeric);
   - row selection with a bulk action (delete selected);
   - pagination, 10 rows per page.
3. **Narrowing.** A text search, a category filter and a status filter. One control clears all three. An empty state when nothing matches.
4. **Create and edit in a dialog.** A form with a text field, a select, a number field and a switch. Required-field and range validation with a message next to the field. Focus returns to the trigger when the dialog closes.
5. **Delete with confirmation**, then feedback (a toast) with an undo.
6. **Loading state.** A skeleton while the first data "loads" (simulate about 700ms).
7. **Theming.** A light/dark switch, and one custom brand theme that changes the accent colour and corner radius.
8. **Small screens and keyboards.** No horizontal page scroll at 390px wide. Every action reachable with the keyboard alone.

### Data

Use the same shape everywhere. Keep it in memory; no backend.

```ts
type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  category: "Coffee" | "Tea" | "Equipment" | "Accessories" | "Merch";
  stock: number;        // units on hand
  price: number;        // in the store's currency, two decimals
  status: "active" | "draft" | "archived";
  isFeatured: boolean;
};
```

## What to record

Decide these before building, and report them in the study's README and in [`component-libraries.md`](./component-libraries.md):

| Criterion | How to measure it |
|---|---|
| Coverage | Which of the eight requirements were met with library components alone |
| Custom code | Lines of layout or component code the library did not cover |
| Accessibility | Keyboard-only pass of the whole screen, and an automated axe scan |
| JavaScript shipped | First-load JS for the screen's route from the production build |
| Setup | Steps from an empty framework project to a first styled component |
| Theming | What it took to apply the custom brand theme and dark mode |
| Documentation | Could the screen be built from the official docs alone? |
| Upgrade path | What an update requires |
| Maturity | Version, release cadence, licence, who maintains it |

Record the library version and the date. A comparison without them misleads.
