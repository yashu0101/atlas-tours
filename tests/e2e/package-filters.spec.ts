import { expect, test } from "@playwright/test";

// /packages filter modal: trip type, budget, trip length, sort. Runs on the seed data (15 packages:
// 3 under ₹15,000, 8 from ₹15,000 to ₹30,000, 3 from ₹30,000 to ₹60,000, 1 above).

test("filter modal: live counts, apply, URL, pills, clear", async ({ page }) => {
  await page.goto("/packages");
  const button = page.getByRole("button", { name: "Filters" });
  await button.click();

  const dialog = page.getByRole("dialog", { name: "Filter packages" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Close filters" })).toBeFocused();
  await expect(dialog.getByRole("button", { name: "Show 15 packages" })).toBeVisible();

  await dialog.getByText("₹15,000 – ₹30,000").click();
  await expect(dialog.getByRole("button", { name: "Show 8 packages" })).toBeVisible();
  await dialog.getByText("8 days or more").click();
  const apply = dialog.getByRole("button", { name: /^Show \d+ package/ });
  const label = (await apply.textContent())!;
  const n = Number(/\d+/.exec(label)![0]);
  await apply.click();

  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/budget=15k-30k/);
  await expect(page).toHaveURL(/days=long/);
  await expect(page.locator(".pkg-card")).toHaveCount(n);
  await expect(page.getByRole("button", { name: "Filters, 2 active" })).toBeFocused();

  const pills = page.getByRole("group", { name: "Active filters" });
  await pills.getByRole("button", { name: "Remove filter: 8 days or more" }).click();
  await expect(page.locator(".pkg-card")).toHaveCount(8);
  await expect(page).not.toHaveURL(/days=/);
  await pills.getByRole("button", { name: "Clear all" }).click();
  await expect(page.locator(".pkg-card")).toHaveCount(15);
  await expect(page.getByRole("group", { name: "Active filters" })).toHaveCount(0);
});

test("filter modal: Escape discards the draft; filters load from the URL", async ({ page }) => {
  await page.goto("/packages?budget=under-15k");
  await expect(page.locator(".pkg-card")).toHaveCount(3);
  await page.getByRole("button", { name: "Filters, 1 active" }).click();
  const dialog = page.getByRole("dialog", { name: "Filter packages" });
  await dialog.getByText("₹60,000 and above").click();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".pkg-card")).toHaveCount(3); // draft discarded
  await expect(page.getByRole("button", { name: "Filters, 1 active" })).toBeFocused();
});

test("filter modal is a bottom sheet on phones and the page does not scroll sideways", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/packages");
  await page.getByRole("button", { name: "Filters" }).click();
  const dialog = page.getByRole("dialog", { name: "Filter packages" });
  await expect(dialog).toBeVisible();
  // Wait for the slide-up to finish, then the sheet sits on the bottom edge, full width.
  await expect.poll(async () => {
    const b = await dialog.boundingBox();
    return b ? Math.round(b.y + b.height) : 0;
  }).toBe(844);
  const box = (await dialog.boundingBox())!;
  expect(Math.round(box.width)).toBe(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
