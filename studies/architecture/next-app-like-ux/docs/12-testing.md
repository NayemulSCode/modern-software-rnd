# Testing instant navigation

## The problem

Instant navigation is easy to break by accident. Someone adds `await cookies()` at the top of a page, or moves a heading inside a Suspense boundary, and the page now shows a blank area on click. Nothing fails. It is simply slower, and nobody notices until users do.

The build already checks that a shell **exists**. It cannot check that the **right content** is in it.

## The rule

**Write a test that asserts what the user sees at the moment of the click, before any dynamic data arrives.**

`@next/playwright` provides `instant()` for exactly this. Inside its callback, dynamic content is held back. You see only what was prerendered or prefetched, the same view as the Navigation Inspector's "Pause on navigations".

## The code in this repo

```ts
// tests/navigation.spec.ts
import { instant } from "@next/playwright";
import { expect, test } from "@playwright/test";

test("opening the Library shows its heading immediately", async ({ page }) => {
  await page.goto("/");

  await instant(page, async () => {
    await page.getByRole("link", { name: "Library" }).first().click();
    await page.waitForURL("/library");
    await expect(page.getByRole("heading", { name: "Everything on the shelf" })).toBeVisible();
  });
});
```

Three details:

1. **Wait for the URL before asserting.** Otherwise a selector could match the page you are leaving.
2. **Assert presence and absence.** The track test checks that the skeleton or header is visible *and* that "More like this" rows are not there yet. After the `instant()` block ends, it checks that they do arrive.
3. **For a first page load, pass `baseURL`:** `instant(page, fn, { baseURL })`.

### Running them

```bash
npx playwright install chromium
```

```bash
npm test
```

`playwright.config.ts` starts `next dev` automatically, where the testing API is always on. To test a production build in CI, build with `EXPOSE_TESTING_API=1`; `next.config.ts` reads it:

```ts
experimental: {
  exposeTestingApiInProductionBuild: process.env.EXPOSE_TESTING_API === "1",
},
```

Never set that variable for a real deployment.

## What else to test in a frontend

`instant()` covers one specific risk. A balanced set for an app like this:

| Kind | Tool | What it catches | In Tempo |
|---|---|---|---|
| Types | `tsc --noEmit` | Wrong props, missing cases | `npm run typecheck` |
| Lint | ESLint | Hook rules, accessibility slips | `npm run lint` |
| Build | `next build` | Uncached data outside Suspense | `npm run build` |
| End-to-end | Playwright | Real flows across pages | `tests/*.spec.ts` |
| Unit | Vitest or similar | Pure logic | Good candidates: `applyPlaylistChanges`, `formatDuration` |

Test the flows that would embarrass you if they broke: navigating, playing, favoriting, the rollback. Leave styling to your eyes.

## Try it

1. Run `npm test`. All five specs should pass.
2. Prove that `instant()` really holds dynamic content back. In `tests/navigation.spec.ts`, inside the `instant()` block of the test "a track page paints its shell before the dynamic section", change `.toHaveCount(0)` to `.toBeVisible()`. Run `npm test` again. That test now fails: inside the scope the recommendations never appear. Change it back.

## Common mistakes

- **Only testing the finished page.** `await expect(heading).toBeVisible()` passes whether it took 10ms or 5 seconds.
- **Selecting by CSS class or test id first.** Prefer `getByRole` and `getByLabel`. If the test cannot find a button by its accessible name, neither can a screen reader.
- **Sleeping** (`waitForTimeout`). Wait for a URL, a role or a response instead.
- **Testing against shared, changing data.** Seed a known database before the run (`npm run db:reset`).

Next: [The frontend checklist](./checklist.md)
