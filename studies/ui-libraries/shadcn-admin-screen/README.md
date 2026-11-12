# shadcn-admin-screen

| | |
|---|---|
| **Question** | Can shadcn/ui build the shared inventory admin screen without custom components, and how does it compare with Astryx on size, accessibility and effort? |
| **Status** | `concluded` |
| **Category** | ui-libraries |
| **Stack** | Next.js 16.4.6 · React 19.3 · shadcn CLI 4.23.0 (`base-nova` style) · `@base-ui/react` 1.9 · Tailwind CSS 4.3 · `@tanstack/react-table` 9.3 · `sonner` 2.0 · `next-themes` 0.4 · `lucide-react` 1.72 |
| **Started** | 2026-11-12 |
| **Last verified** | 2026-11-12 |

**Short answer:** it builds the whole screen, but not "without custom code". shadcn/ui gives you styled, accessible building blocks and leaves the behaviour to you. The result ships a little over half the JavaScript of the Astryx version (261 kB against 463 kB, compressed) and needed about 60% more screen code (1,114 lines against 702).

The task every UI library study builds is specified in [`docs/comparisons/ui-library-task.md`](../../../docs/comparisons/ui-library-task.md). Results across libraries are in [`docs/comparisons/component-libraries.md`](../../../docs/comparisons/component-libraries.md).

## How to run

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:3000.

| Route | What it is |
|---|---|
| `/` | The test screen |
| `/theme` | The CSS variables the theme is made of, shown live |
| `/about` | Each requirement mapped to what covered it |

To check everything CI checks (lint, type-check, production build):

```bash
npm run ci
```

## What shadcn/ui is

It is not a package you import. `npx shadcn add button` copies `button.tsx` into `components/ui/`, and from then on the file is yours. The copied components wrap a headless library that handles keyboard and focus behaviour, and style it with Tailwind classes.

This study uses the CLI's current defaults: the `base-nova` style, built on **Base UI** (the CLI also offers Radix and React Aria as the base).

## What was built

The same inventory admin screen as the Astryx study: side navigation, a 42-row table with sorting, selection, bulk delete and pagination, search and two filters with an empty state, a create/edit dialog with validation, delete confirmation with an undo toast, a loading skeleton, light/dark mode and a custom brand theme.

```
app/
  layout.tsx            fonts, theme provider, tooltip provider, toasts, app frame
  globals.css           generated tokens + 22 lines for the brand theme
  page.tsx              the test screen
  theme/, about/        the two other destinations
components/
  app-frame.tsx         Sidebar, header, navigation
  appearance-controls.tsx   theme select + colour-mode toggle
  inventory-screen.tsx  state, filters, toasts, delete confirmation
  inventory-table.tsx   TanStack Table setup, columns, sort headers, pagination
  item-dialog.tsx       create/edit form
  theme-provider.tsx    generated (next-themes), hotkey removed
  ui/                   23 files copied in by the CLI, 2 of them edited
hooks/
  use-brand-theme.ts    remembers the brand theme
  use-mobile.ts         generated, rewritten to pass lint
lib/inventory.ts        data, types, validation (shared shape for all UI studies)
components.json         shadcn CLI configuration
```

## Results against the shared criteria

| Criterion | Result |
|---|---|
| **Coverage** | All 8 requirements met. 6 with shadcn/ui components alone. The table's behaviour comes from TanStack Table plus hand-written wiring, and the brand-theme switch is hand-written |
| **Custom code** | 1,114 lines of screen code (counted at 120 columns, like the Astryx study; 1,326 as formatted). 60 `className` props and 34 raw HTML elements for layout. 22 lines of CSS. Plus 23 copied component files (2,680 lines) that the project now owns |
| **Accessibility** | axe-core, WCAG 2.2 A/AA rules: 0 violations in 6 states (table in light, dark, brand theme and at 390px; dialog with errors; empty state), after one fix. Keyboard-only pass succeeded (21 checks). Several things had to be added by hand, listed below |
| **JavaScript shipped** | `/`: 261 kB compressed (825 kB raw), all in the initial HTML. `/about`: 235 kB. For scale, a page of the Tempo study on the same Next.js version ships 169 kB |
| **CSS shipped** | 15 kB compressed, plus two font files (52 kB) |
| **Setup** | One command scaffolds Next.js, Tailwind 4, the theme provider and the first component. One more command adds 20 components. No bundler plugin |
| **Theming** | Dark mode is scaffolded (a `.dark` class set by next-themes). The brand theme is 22 lines of CSS that override 6 variables. Remembering the choice took a 53-line hook and a one-line inline script |
| **Documentation** | Sufficient. `npx shadcn docs <component>` links the docs page and a full example file. The data table guide already uses TanStack Table 9. For exact props you read the copied source |
| **Upgrade path** | No version to bump for the components. `npx shadcn add <name> --diff` shows what changed upstream and `--overwrite` replaces your file, including your edits. Base UI, TanStack Table and Tailwind upgrade through npm as usual |
| **Maturity** | CLI 4.23.0, MIT, maintained by shadcn. Base UI 1.9 is a stable release, MIT |

Two scripted passes run on the production build with an empty browser console: a behaviour pass (30 checks covering all eight requirements) and a keyboard-only pass (21 checks). The behaviour pass also runs clean against the dev server, so there are no hydration warnings.

## Findings

**What works well**

- **It is light.** 261 kB of compressed JavaScript against 463 kB for the same screen in Astryx, and 15 kB of CSS against 50 kB. Tailwind only emits classes that are used, and TanStack Table 9 only bundles the features you register (three here).
- **Setup is one command and current.** `npx shadcn init` produced a working Next.js 16 project with Tailwind 4, Base UI, dark mode and fonts. It worked unchanged with Turbopack and Cache Components.
- **You can fix the library.** Two problems in generated files were fixed in place in a few lines each (see below). With an installed package that would be an issue report and a wait.
- **Focus handling is right without effort.** Dialogs trap focus and return it to whatever opened them, including a row's Edit button. The delete confirmation is a real `alertdialog` and opens with focus on Cancel. Selects, switches and checkboxes work from the keyboard. All of this was verified by script.
- **Theming is plain CSS.** Every component reads a handful of CSS variables. The brand theme overrides six of them under `[data-theme="roastery"]` on `<html>`, so dialogs and menus rendered in portals pick it up too.
- **The Sidebar does a lot.** It becomes a slide-in sheet below 768px, remembers its open state in a cookie and adds a Ctrl+B shortcut.
- **Toasts are solid.** Sonner gives an action button for Undo, a polite live region, and Alt+T to move focus to the toasts.

**What to know before adopting it**

- **"Table" is markup, not behaviour.** shadcn/ui's Table is styled `<table>` elements. Sorting, selection and paging come from TanStack Table, and you write the sort buttons, `aria-sort`, the select-all checkbox, the row counts for assistive tech and the pagination controls. That file is 345 lines here. Astryx needed about 25 lines for the same behaviour.
- **Some pieces do not exist.** There is no number field (a native `type="number"` input was used), no status dot, no colour set for categories, and no selection toolbar. The Pagination component renders links, which suits URL-based paging. For paging held in state, its list wrappers were used with Buttons inside.
- **Accessibility is partly your job.** Added by hand: `aria-invalid` and `aria-describedby` on invalid fields, moving focus to the first invalid field, live regions for the result count and the selection count, and `aria-rowcount`/`aria-rowindex`. Also found:
  - `EmptyTitle` renders a `div`, so the empty state had no heading until `role="heading"` was added.
  - `Checkbox` has no style for the indeterminate state. "Some rows selected" showed a bare tick. Fixed in `components/ui/checkbox.tsx`.
  - The checkbox is 16px. At 390px the squeezed select column put it under the next column's sort button, which axe reported as a touch-target failure. Fixed with a minimum column width.
  - The scaffold's theme provider binds a bare `d` key to toggle dark mode. A single-key shortcut that cannot be turned off fails WCAG 2.1.4, so it was removed.
- **Generated code can fail the generated lint setup.** `hooks/use-mobile.ts`, added with the Sidebar, calls `setState` in an effect, and the scaffold's own ESLint config reports that as an error. `npm run lint` fails until the hook is rewritten (done here with `useSyncExternalStore`).
- **The CLI assumes an empty folder of its own.** It ran `git init` and made a commit inside the study folder, which had to be removed because this repository already tracks it. It also pinned Next.js 16.4.4 when 16.4.6 was current.
- **The Base UI flavour differs from most tutorials.** Most examples online are for the Radix flavour. On Base UI: composition uses a `render` prop instead of `asChild`; `Select` needs an `items` prop or the trigger shows the raw value; a `ToggleGroup` value is an array and the active item can be switched off; `AlertDialogAction` does not close the dialog by itself.
- **New small dependencies.** `cn` is now an npm package from shadcn that replaces `clsx` + `tailwind-merge`, and the `shadcn` package itself is a runtime dependency because `globals.css` imports `shadcn/tailwind.css`.
- **Dialogs trap focus with guard elements, not `inert`.** Content outside is marked `aria-hidden`, and focus that reaches a guard is handed back on the next animation frame. It held in testing at human speed. A script tabbing faster than a frame could step outside.
- **The table does not reflow on small screens.** At 390px it scrolls sideways inside its own container, the same as Astryx. The page itself does not overflow.
- **The Next.js dev indicator covers the sidebar footer.** In development it sits bottom-left by default, on top of the colour-mode switch. `devIndicators.position` moves it.

**UX decisions made along the way** (not library findings, but worth keeping)

- The bulk-action bar sits **below** the table and sticks to the bottom of the viewport. Above the table it pushed every row down on the first tick, so the next click landed on the wrong row.
- The dialog keeps the edited item in state after closing, so its title does not flip from "Edit item" to "Add item" while it animates out.
- A saved brand theme is applied by a one-line script before first paint, the same way next-themes handles dark mode, so there is no flash of the default theme on reload.
- Number fields are kept as text while typing. An empty field stays empty instead of becoming 0, and validation reports it.

## Verdict

- **Use it when:** you are building product or public-facing UI where first-load size and a distinctive look matter, your team is comfortable with Tailwind, and you want to be able to change any component. It is the more common choice today, so examples, blocks and hiring are easier.
- **Avoid it when:** the work is mostly data tables and forms for internal tools and you want the behaviour and accessibility wiring done for you, or nobody on the team wants to own 2,700 lines of UI source and review upstream changes by diff.
- **Cost:** more code per screen, accessibility details you must know to add, and upgrades that are a manual diff instead of a version bump.

## Open questions

- How much smaller or larger is the Radix flavour of the same screen?
- What does `shadcn add --diff` look like after six months of upstream changes and local edits? (On the [roadmap](../../../docs/roadmap.md) as its own study.)
- Would a card layout for the table below 640px be worth its code, for either library?
- How much of the 261 kB is the frame? `/about` uses no TanStack Table, dialog or toast calls and still loads 235 kB.

## Sources

- [shadcn/ui documentation](https://ui.shadcn.com/docs), Base UI flavour, including the [data table guide](https://ui.shadcn.com/docs/components/base/data-table)
- [Base UI documentation](https://base-ui.com)
- The guides bundled with TanStack Table 9: `node_modules/@tanstack/react-table/skills/` and `node_modules/@tanstack/table-core/skills/`
- The Next.js docs bundled with the installed version: `node_modules/next/dist/docs/`
