import { expect, test } from "@playwright/test";

// Runs against the seed data (see playwright.config.ts → JSON_DB_PATH).

test("home page renders packages and reviews from the server", async ({ page }) => {
  await page.goto("/");

  const packages = page.locator("#packages");
  await expect(packages.getByText("Divine Varanasi & Prayagraj").first()).toBeVisible();
  await expect(packages.getByText("₹8,999").first()).toBeVisible();

  await expect(page.locator("#reviews").getByText(/Amazing Varanasi trip!/)).toBeVisible();
  await expect(page.getByText(/Loading/i)).toHaveCount(0);
});

test("/login renders the admin login form", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Admin Login" })).toBeVisible();
});

test("/robots.txt is served", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.status()).toBe(200);
  expect(await res.text()).toMatch(/User-Agent/i);
});

test("home page shows the team section and UPI payment details", async ({ page }) => {
  await page.goto("/");
  const team = page.locator("#team");
  await expect(team.getByRole("heading", { name: /The People Behind/ })).toBeVisible();
  for (const role of ["Founder", "General Manager", "Front Desk Team"]) {
    await expect(team.getByRole("heading", { name: role })).toBeVisible();
  }
  await expect(team.getByText("Hotel Ganga Imperial")).toBeVisible();
  await expect(team.locator("img")).toHaveCount(3);

  const contact = page.locator("#contact");
  // UPI payment lives only on /track (per-booking QR); Contact no longer shows a UPI card.
  await expect(contact.getByText("Pay via UPI")).toHaveCount(0);
});
