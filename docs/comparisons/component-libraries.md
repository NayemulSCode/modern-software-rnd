# Component libraries

Every library builds the same screen, specified in [`ui-library-task.md`](./ui-library-task.md), and is measured the same way. Add a column when a study concludes.

Last updated: 2026-11-12.

## Results

| Criterion | [Astryx](../../studies/ui-libraries/astryx-admin-screen) | shadcn/ui |
|---|---|---|
| Version studied | `@astryxdesign/core` 0.7.13 (beta) | not studied yet |
| Date | 2026-11-12 | |
| Framework | Next.js 16.4.6, React 19.3 | |
| Coverage (of 8 requirements) | 8 | |
| Custom components written | 0 | |
| Screen code | 702 lines, no raw HTML, no `className` | |
| CSS written | 10 lines (two imports, one rule) | |
| axe violations (WCAG 2.2 A/AA, 6 states) | 0 | |
| Keyboard-only pass | Yes, two notes (see study) | |
| First-load JavaScript, compressed | 463 kB | |
| First-load CSS, compressed | 50 kB | |
| Setup | 4 packages, 2 CSS imports, 3 providers, no bundler plugin | |
| Dark mode | One prop | |
| Custom brand theme | 8 lines of tokens | |
| Docs enough to finish the task | Yes (CLI docs match the installed version) | |
| Upgrade path | Bump all packages together, run the `astryx upgrade` codemod | |
| Licence and maintainer | MIT, Meta | |

For scale on the JavaScript row: a page of the [next-app-like-ux](../../studies/architecture/next-app-like-ux) study, on the same Next.js version and with no UI library, ships 169 kB compressed.

## How the numbers were taken

- **JavaScript and CSS:** production build (`next build`, `next start`), bytes transferred for files referenced by the route's initial HTML, measured through the browser's network layer. Files prefetched for other routes are excluded.
- **axe:** axe-core with the `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa` rule sets, run on the table (light, dark, brand theme, 390px wide), the dialog with validation errors, and the empty state.
- **Keyboard pass:** open, fill, submit and cancel each dialog, and tab through the filters and the table, without a pointer.
- **Screen code:** lines in the study's own components, excluding data, types and generated files.

## Recommendation so far

One library is not a comparison. Until the shadcn/ui study is done, read the Astryx column with its study's verdict: strong for data-heavy internal tools on React 19, heavy on first load, and still in beta.
