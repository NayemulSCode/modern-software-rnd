# Component libraries

Every library builds the same screen, specified in [`ui-library-task.md`](./ui-library-task.md), and is measured the same way. Add a column when a study concludes.

Last updated: 2026-11-12.

## Results

| Criterion | [Astryx](../../studies/ui-libraries/astryx-admin-screen) | [shadcn/ui](../../studies/ui-libraries/shadcn-admin-screen) |
|---|---|---|
| Version studied | `@astryxdesign/core` 0.7.13 (beta) | shadcn CLI 4.23.0, `base-nova` style on `@base-ui/react` 1.9 |
| Date | 2026-11-12 | 2026-11-12 |
| Framework | Next.js 16.4.6, React 19.3 | Next.js 16.4.6, React 19.3 |
| How you get it | npm packages | Source files copied into the project |
| Coverage (of 8 requirements) | 8 with library components alone | 8 met; 6 with library components alone |
| Extra libraries needed | None | TanStack Table (table behaviour), next-themes and Sonner (both scaffolded) |
| Custom components written | 0 | 0 new components; 2 copied components edited |
| Screen code | 702 lines, no raw HTML, no `className` | 1,114 lines, 34 raw HTML elements, 60 `className` props |
| Component source you own | None | 23 files, 2,680 lines |
| CSS written | 10 lines (two imports, one rule) | 22 lines (brand theme) |
| axe violations (WCAG 2.2 A/AA, 6 states) | 0 | 0 after one fix (1 on the first run) |
| Keyboard-only pass | Yes, two notes (see study) | Yes |
| Accessibility wiring written by hand | Almost none | `aria-sort`, row counts, live regions, invalid-field wiring, one heading role |
| First-load JavaScript, compressed | 463 kB | 261 kB |
| First-load CSS, compressed | 50 kB | 15 kB |
| Setup | 4 packages, 2 CSS imports, 3 providers, no bundler plugin | 2 CLI commands, no bundler plugin |
| Dark mode | One prop | Scaffolded (`.dark` class via next-themes) |
| Custom brand theme | 8 lines of tokens | 22 lines of CSS variables, plus a 53-line hook to remember the choice |
| Docs enough to finish the task | Yes (CLI docs match the installed version) | Yes (docs and examples per component; props read from the copied source) |
| Upgrade path | Bump all packages together, run the `astryx upgrade` codemod | Per component: `shadcn add <name> --diff`, then merge by hand |
| Licence and maintainer | MIT, Meta | MIT, shadcn; Base UI is MIT |

For scale on the JavaScript row: a page of the [next-app-like-ux](../../studies/architecture/next-app-like-ux) study, on the same Next.js version and with no UI library, ships 169 kB compressed.

Screen code is counted with both studies formatted at 120 columns.

## How the numbers were taken

- **JavaScript and CSS:** production build (`next build`, `next start`), bytes transferred for files referenced by the route's initial HTML, measured through the browser's network layer. Files prefetched for other routes are excluded.
- **axe:** axe-core with the `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa` rule sets, run on the table (light, dark, brand theme, 390px wide), the dialog with validation errors, and the empty state.
- **Keyboard pass:** open, fill, submit and cancel each dialog, and tab through the filters and the table, without a pointer.
- **Screen code:** lines in the study's own components, excluding data, types and generated or copied files.

Not measured: time to build. Both screens were built with an AI coding agent, so hours would not transfer to a person working alone.

## What the numbers say

The two libraries sit at opposite ends of one trade-off.

- **Astryx does more for you.** One `Table` with plugins replaces about 320 lines of table code, and accessibility details arrive without being asked for. You pay about 200 kB more compressed JavaScript and you build inside its layout system.
- **shadcn/ui gives you more control and less weight.** It ships a little over half the JavaScript and a third of the CSS. You write more code, and you need to know the accessibility details it leaves to you. Because the components are your files, you can fix or restyle anything.

## Recommendation

- **Default for product and public-facing front ends: shadcn/ui** (on Base UI). First-load size, freedom over the design, and the size of its community make it the safer general choice. Budget time for accessibility review, because the library will not do it for you.
- **For data-heavy internal tools: Astryx is worth a serious look.** When the screens are mostly tables, filters and forms, and weight matters less than speed of assembly and consistency, it needs far less code. Check first that beta churn is acceptable.

**When this does not apply:** both studies used React 19 and Next.js 16 on one desktop-first admin screen. A content site, a mobile-first app, or a team without Tailwind experience would weigh these differently. Two libraries is still a small sample; Mantine, MUI or React Aria Components would add useful columns.
