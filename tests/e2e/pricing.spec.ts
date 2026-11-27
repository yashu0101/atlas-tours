import { expect, test, type Page } from "@playwright/test";

// N-22: price grid (hotel category × group size). Seed package pkg-kashmir-4d carries the
// Srinagar–Sonamarg–Gulmarg brochure table; the admin test uses its own package.

test("package page shows the price grid and the booking estimate follows category and group size", async ({ page }) => {
  await page.goto("/packages/pkg-kashmir-4d");
  const table = page.getByRole("region", { name: "Prices by hotel category" }).getByRole("table");
  await expect(table.getByRole("columnheader", { name: "12+ Pax" })).toBeVisible();
  const premium = table.getByRole("row", { name: /4★ Premium/ });
  await expect(premium).toContainText("₹25,600");
  await expect(premium).toContainText("₹15,600"); // extra bed

  const form = page.getByRole("form", { name: /Book Srinagar Sonamarg Gulmarg Tour/ });
  await form.getByLabel("Travellers *").fill("4");
  await form.getByLabel("Hotel category *").selectOption("4★ Premium");
  await expect(form.getByText("₹23,600 × 4 travellers")).toBeVisible();
  await expect(form.getByText("₹94,400")).toBeVisible();

  await form.getByLabel("Travellers *").fill("5"); // between columns → 4 pax rate
  await expect(form.getByText("₹23,600 × 5 travellers")).toBeVisible();
});

async function login(page: Page) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill("admin@atlastours.com");
  await page.locator('input[type="password"]').fill("admin123");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/admin");
}

test("admin edits a package's pricing options and the package page shows them", async ({ page }) => {
  await login(page);
  const name = `E2E Pricing ${Date.now()}`;
  const created = await page.request.post("/api/packages", { data: { name, price: 9000, category: "honeymoon" } });
  expect(created.ok()).toBe(true);
  const { id } = await created.json();

  try {
    await page.goto("/admin");
    await page.getByRole("button", { name: "Packages", exact: true }).click();
    await page.locator(".pkg-card", { hasText: name }).getByRole("button", { name: "Edit" }).click();
    const modal = page.locator(".modal-content");
    await expect(modal.getByLabel("Category")).toHaveValue("honeymoon");

    await modal.getByRole("button", { name: "Start from brochure layout (2–12 pax)" }).click();
    await modal.getByLabel("3★ Budget, 2 pax, price per person").fill("15400");
    await modal.getByLabel("3★ Budget, 4 pax, price per person").fill("13600");
    await modal.getByLabel("3★ Deluxe, 2 pax, price per person").fill("16000");
    await modal.getByLabel("4★ Deluxe, 2 pax, price per person").fill("20600");
    await modal.getByLabel("3★ Budget, extra bed").fill("6900");
    await modal.getByRole("button", { name: /Use lowest pricing option/ }).click();
    await expect(modal.getByLabel(/^Price \(INR\)/)).toHaveValue("13600");
    await modal.getByRole("button", { name: "Save" }).click();
    await expect(modal).toHaveCount(0);
    await expect(page.locator(".pkg-card", { hasText: name })).toContainText("3 hotel categories × 6 group sizes");

    await page.goto(`/packages/${id}`);
    const table = page.getByRole("region", { name: "Prices by hotel category" }).getByRole("table");
    await expect(table.getByRole("row", { name: /3★ Budget/ })).toContainText("₹13,600");
    await expect(table.getByRole("row", { name: /3★ Budget/ })).toContainText("₹6,900");
    await expect(page.getByText("from").first()).toBeVisible();
  } finally {
    await page.request.delete("/api/packages", { data: { id } });
  }
});

test("pricing editor scrolls inside the admin modal at phone width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page.getByRole("button", { name: "Packages", exact: true }).click();
  await page.locator(".pkg-card", { hasText: "Srinagar Sonamarg Gulmarg Tour" }).getByRole("button", { name: "Edit" }).click();
  const editor = page.locator(".adm-pricing");
  await editor.scrollIntoViewIfNeeded();
  // The grid scrolls in its own box; the modal and the buttons under the grid stay within the screen.
  const modal = page.locator(".modal-content");
  expect(await modal.evaluate(e => e.scrollWidth - e.clientWidth)).toBeLessThanOrEqual(1);
  const box = await editor.getByRole("button", { name: "Remove all pricing options" }).boundingBox();
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
});
