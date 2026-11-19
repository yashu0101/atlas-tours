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
  for (const name of ["Ashfaque Ahmed", "Dinesh Singh Rathore"]) {
    await expect(team.getByRole("heading", { name })).toBeVisible();
  }
  await expect(team.getByText("Front Desk Team")).toHaveCount(0);
  await expect(team.getByRole("link", { name: /Hotel Ganga Imperial/ })).toBeVisible();
  await expect(team.locator("img")).toHaveCount(2);

  const about = page.locator("#about");
  await expect(about.getByText("Travel agency since")).toBeVisible();
  await expect(about.getByText("1983", { exact: true })).toBeVisible();
  // People live in Our Team / Contact, not in About.
  await expect(about.getByText("Ashfaque Ahmed")).toHaveCount(0);
  await expect(page.locator("#contact").getByText("Mera Bushra Ashfaque")).toBeVisible();

  // Every Hotel Ganga Imperial link goes to the hotel's website in a new tab.
  const hotelLinks = page.locator('a[href="https://hotel-ganga-imperial.vercel.app/"]');
  await expect(hotelLinks).toHaveCount(2); // Team GM card + footer partner line
  for (const link of await hotelLinks.all()) {
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener/);
  }

  const contact = page.locator("#contact");
  // UPI payment lives only on /track (per-booking QR); Contact no longer shows a UPI card.
  await expect(contact.getByText("Pay via UPI")).toHaveCount(0);
});

test("hero package stat matches the visible packages (Q-7)", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator("#home");
  await expect(hero.getByText("Tour Packages")).toBeVisible();
  await expect(hero.getByText("15+")).toHaveCount(0);
  // admin.spec.ts adds and hides a package on the shared test DB in parallel, so compare with
  // the live public count instead of the seed's 3, re-reading both until they agree.
  await expect
    .poll(async () => {
      const visible = ((await (await page.request.get("/api/packages")).json()) as unknown[]).length;
      await page.reload();
      return hero.getByText(String(visible), { exact: true }).count();
    })
    .toBeGreaterThan(0);
});

test("contact form shows a failed submit as an alert, not a success box (Q-3)", async ({ page }) => {
  await page.route("**/api/enquiry", route => route.fulfill({ status: 500, body: '{"error":"x"}' }));
  await page.goto("/");
  const contact = page.locator("#contact");
  await contact.locator("#contact-name").fill("Test User");
  await contact.locator("#contact-phone").fill("9876543210");
  await contact.locator('button[type="submit"]').click();
  await expect(contact.getByRole("alert")).toContainText("Something went wrong");
  await expect(contact.getByRole("status")).toHaveCount(0);
});
