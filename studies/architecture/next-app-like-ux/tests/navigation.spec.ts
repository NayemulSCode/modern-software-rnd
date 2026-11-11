import { instant } from "@next/playwright";
import { expect, test } from "@playwright/test";

// Lesson 12. Inside instant(), dynamic content is held back: the page shows
// only what was prerendered or prefetched. These tests fail if someone makes
// a navigation wait for data again.

test("opening the Library shows its heading immediately", async ({ page }) => {
  await page.goto("/");

  await instant(page, async () => {
    await page.getByRole("link", { name: "Library" }).first().click();
    await page.waitForURL("/library");
    await expect(page.getByRole("heading", { name: "Everything on the shelf" })).toBeVisible();
  });
});

test("a track page paints its shell before the dynamic section", async ({ page, baseURL }) => {
  await instant(
    page,
    async () => {
      await page.goto("/track/glass-harbor");
      // The app frame is in the static shell…
      await expect(page.getByRole("navigation", { name: "Main" }).first()).toBeVisible();
      // …and the per-request recommendations are not.
      await expect(page.getByRole("list", { name: "More like this" })).toHaveCount(0);
    },
    { baseURL },
  );

  await expect(page.getByRole("heading", { level: 1, name: "Glass Harbor" })).toBeVisible();
  await expect(page.getByRole("list", { name: "More like this" })).toBeVisible();
});

test("navigating to a track does not wait for recommendations", async ({ page }) => {
  await page.goto("/library");
  const link = page.getByRole("link", { name: "Glass Harbor" }).first();
  await expect(link).toBeVisible();

  await instant(page, async () => {
    await link.click();
    await page.waitForURL("/track/glass-harbor");
    await expect(page.getByRole("list", { name: "More like this" })).toHaveCount(0);
  });

  await expect(page.getByRole("list", { name: "More like this" })).toBeVisible();
});
