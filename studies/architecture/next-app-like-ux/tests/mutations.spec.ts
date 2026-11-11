import { expect, test } from "@playwright/test";

// Lessons 05, 08 and 09: optimistic feedback, revalidation across pages, and
// rollback when the server refuses a change.

test("a favorite appears at once and shows up on the Favorites page", async ({ page }) => {
  await page.goto("/library");

  const add = page.getByRole("button", { name: "Add Fuse Box to favorites" });
  await add.click();

  // Optimistic: the button flips before the Server Action has answered.
  const remove = page.getByRole("button", { name: "Remove Fuse Box from favorites" });
  await expect(remove).toHaveAttribute("aria-pressed", "true");

  // Revalidated: a different page, reading a different cached query, has it.
  await page.getByRole("link", { name: "Favorites" }).first().click();
  await page.waitForURL("/favorites");
  const favorites = page.getByRole("list", { name: "Favorite tracks" });
  await expect(favorites.getByRole("link", { name: "Fuse Box" })).toBeVisible();

  // Clean up so the test can run again.
  await favorites.getByRole("button", { name: "Remove Fuse Box from favorites" }).click();
  await expect(favorites.getByRole("link", { name: "Fuse Box" })).toHaveCount(0);
});

test("removing a track from a locked playlist rolls back with a message", async ({ page }) => {
  await page.goto("/playlist/staff-picks");

  const removeButtons = page.getByRole("button", { name: /^Remove .* from this playlist$/ });
  await expect(removeButtons.first()).toBeVisible();
  const before = await removeButtons.count();

  await removeButtons.first().click();
  // Optimistic: one row fewer straight away.
  await expect(removeButtons).toHaveCount(before - 1);

  // Rejected: the server explains, and the row comes back by itself.
  await expect(page.getByText(/is locked, so the change was undone/)).toBeVisible();
  await expect(removeButtons).toHaveCount(before);
});
