import { expect, test, type Page } from "@playwright/test";

// Drives the real admin UI against the e2e dev server's temp JSON database
// (see playwright.config.ts), so it exercises the A-08 refactor end to end:
// login → FAQs tab → create → edit (clear Hindi) → deactivate → delete.

async function login(page: Page) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill("admin@atlastours.com");
  await page.locator('input[type="password"]').fill("admin123");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/admin");
  await expect(page.getByRole("heading", { name: /Admin/ })).toBeVisible();
}

test("admin can create, edit, deactivate and delete an FAQ", async ({ page }) => {
  // Delete asks confirm(); any other dialog is an alert() = a failed request.
  const alerts: string[] = [];
  page.on("dialog", async (dialog) => {
    if (dialog.type() === "confirm") return dialog.accept();
    alerts.push(dialog.message());
    return dialog.dismiss();
  });

  await login(page);
  await page.getByRole("button", { name: "FAQs", exact: true }).click();
  await expect(page.getByRole("heading", { name: "FAQs" })).toBeVisible();

  const question = `E2E question ${Date.now()}`;
  const card = page.locator(".adm-card", { hasText: question });

  // Create (with Hindi fields)
  await page.getByRole("button", { name: "Add FAQ" }).click();
  await page.getByPlaceholder("e.g. What is included in the tour package?").fill(question);
  await page.locator('input[placeholder="Hindi translation (optional)"]').fill("प्रश्न");
  await page.getByPlaceholder("Answer to the question...").fill("E2E answer");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(card).toBeVisible();
  await expect(card).toContainText("HI: प्रश्न");
  await expect(card).toContainText("Active");

  // Edit: clear the Hindi question (admin sends null → backend clears it)
  await card.getByRole("button", { name: "Edit" }).click();
  await page.locator('input[placeholder="Hindi translation (optional)"]').fill("");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(card).not.toContainText("HI:");

  // Toggle active
  await card.getByRole("button", { name: "Deactivate" }).click();
  await expect(card).toContainText("Inactive");

  // Survives a reload (really persisted, not just local state)
  await page.reload();
  await page.getByRole("button", { name: "FAQs", exact: true }).click();
  await expect(card).toContainText("Inactive");
  await expect(card).not.toContainText("HI:");

  // Delete
  await card.getByRole("button", { name: "Del" }).click();
  await expect(card).toHaveCount(0);
  await page.reload();
  await page.getByRole("button", { name: "FAQs", exact: true }).click();
  await expect(page.getByRole("heading", { name: "FAQs" })).toBeVisible();
  await expect(card).toHaveCount(0);

  expect(alerts, `unexpected alert() dialogs: ${alerts.join(" | ")}`).toEqual([]);
});

test("hiding a package in admin removes it from the public home page", async ({ page }) => {
  page.on("dialog", (d) => d.accept());
  await login(page);
  await page.getByRole("button", { name: "Packages", exact: true }).click();

  const card = page.locator(".pkg-card", { hasText: "Royal Rajasthan Explorer" });
  await card.getByRole("button", { name: "Hide" }).click();
  await expect(card.getByRole("button", { name: "Show" })).toBeVisible();

  await page.goto("/");
  await expect(page.getByText("Divine Varanasi & Prayagraj").first()).toBeVisible();
  await expect(page.locator("#packages")).not.toContainText("Royal Rajasthan Explorer");

  // Restore for other tests
  await page.goto("/admin");
  await page.getByRole("button", { name: "Packages", exact: true }).click();
  await card.getByRole("button", { name: "Show" }).click();
  await expect(card.getByRole("button", { name: "Hide" })).toBeVisible();
});
