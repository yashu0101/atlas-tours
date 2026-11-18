import { expect, test, type Page } from "@playwright/test";

// N-8: multiple admins. The built-in (env) admin creates a user, that user logs in in a
// separate browser context, then the env admin deactivates them: their open session stops
// working and they can no longer log in. (No "sign out all devices" here: for the env admin
// it would also end the sessions of the other e2e tests running in parallel.)

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
}

test("admin can add a user who can log in, then deactivate them", async ({ page, browser }) => {
  const alerts: string[] = [];
  page.on("dialog", async (dialog) => {
    if (dialog.type() === "confirm") return dialog.accept();
    alerts.push(dialog.message());
    return dialog.dismiss();
  });

  await login(page, "admin@atlastours.com", "admin123");
  await page.waitForURL("**/admin");
  await page.getByRole("button", { name: "Users", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();

  const email = `e2e.${Date.now()}@example.com`;
  const password = "e2e long password 123";
  await page.getByRole("button", { name: "Add user" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name *").fill("E2E Admin");
  await dialog.getByLabel("Email *").fill(email);
  await dialog.getByLabel(/Password \*/).fill(password);
  await dialog.getByRole("button", { name: "Save" }).click();
  const card = page.locator(".adm-card", { hasText: email });
  await expect(card).toBeVisible();
  await expect(card).toContainText("Active");
  await expect(card).toContainText("Never logged in");

  // The new user logs in (own browser context = own cookie jar) and sees themselves as "You".
  const other = await browser.newContext();
  const userPage = await other.newPage();
  userPage.on("dialog", (d) => d.dismiss());
  await login(userPage, email, password);
  await userPage.waitForURL("**/admin");
  await userPage.getByRole("button", { name: "Users", exact: true }).click();
  const selfCard = userPage.locator(".adm-card", { hasText: email });
  await expect(selfCard).toContainText("You");
  await expect(selfCard.getByRole("button", { name: "Deactivate" })).toHaveCount(0);
  await expect(selfCard.getByRole("button", { name: "Delete" })).toHaveCount(0);

  // Their login shows up in the audit log.
  await page.getByRole("button", { name: "Audit log", exact: true }).click();
  await expect(page.locator(".adm-table tr", { hasText: email }).filter({ hasText: "Logged in" }).first()).toBeVisible();

  // The env admin deactivates them.
  await page.getByRole("button", { name: "Users", exact: true }).click();
  await card.getByRole("button", { name: "Deactivate" }).click();
  await expect(card).toContainText("Inactive");

  // Their session is revoked: the next admin request sends them to the login page...
  await userPage.reload();
  await userPage.waitForURL("**/login");
  // ...and they cannot log back in.
  await login(userPage, email, password);
  await expect(userPage.locator(".lg-error")).toBeVisible();
  expect(userPage.url()).toContain("/login");
  await other.close();

  // The deactivation is in the audit log.
  await page.getByRole("button", { name: "Audit log", exact: true }).click();
  await expect(page.locator(".adm-table tr", { hasText: "Admin user" }).filter({ hasText: "active" }).first()).toBeVisible();

  expect(alerts, `unexpected alert() dialogs: ${alerts.join(" | ")}`).toEqual([]);
});
