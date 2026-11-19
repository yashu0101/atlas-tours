import { expect, test } from "@playwright/test";

// Runs against the seed data (see playwright.config.ts → JSON_DB_PATH).
// Seed package used below: pkg-varanasi "Divine Varanasi & Prayagraj", ₹8,999, category spiritual.

test("package detail page renders server-side content (G-03)", async ({ page }) => {
  const res = await page.goto("/packages/pkg-varanasi");
  expect(res?.status()).toBe(200);

  await expect(page).toHaveTitle(/Divine Varanasi & Prayagraj/);
  await expect(page.getByRole("heading", { level: 1, name: "Divine Varanasi & Prayagraj" })).toBeVisible();
  await expect(page.getByText("₹8,999").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Itinerary" })).toBeVisible();
  await expect(page.getByText("Day 1", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What's included" })).toBeVisible();
  await expect(page.getByText("3-Star Hotel Stay")).toBeVisible();

  const wa = page.getByRole("link", { name: /Enquire on WhatsApp/ });
  await expect(wa).toHaveAttribute("href", /^https:\/\/wa\.me\/\d+\?text=/);

  // Canonical + JSON-LD
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/packages\/pkg-varanasi$/);
  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(jsonLd.some((s) => s.includes('"TouristTrip"'))).toBe(true);

  // Header section links point back to the home page from a sub-route.
  await expect(page.getByRole("banner").getByRole("link", { name: "Packages", exact: true }).first()).toHaveAttribute("href", "/#packages");
});

// N-18. Odisha, not Rajasthan: admin.spec.ts hides pkg-rajasthan while the specs run in parallel.
test("detail page shows the route, day-by-day points, overnight stays and what is not included", async ({ page }) => {
  await page.goto("/packages/pkg-odisha");
  await expect(page.getByRole("term").filter({ hasText: "Starts from" })).toBeVisible();

  const route = page.locator("section", { has: page.getByRole("heading", { name: "Where you'll go" }) });
  await expect(route.getByText("5 nights")).toBeVisible();
  await expect(route.getByRole("listitem")).toHaveText([/Bhubaneswar\s*1 night/, /Puri\s*3 nights/, /Bhubaneswar\s*1 night/]);

  await expect(page.getByRole("heading", { level: 3, name: "Bhubaneswar → Puri" })).toBeVisible();
  await expect(page.getByText("Via Dhauli, Pipili & Raghurajpur")).toBeVisible();
  await expect(page.getByText("Overnight: Puri").first()).toBeVisible();

  await expect(page.getByRole("heading", { name: "What's included" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Not included" })).toBeVisible();
  await expect(page.getByText("Train / flight tickets to and from Bhubaneswar")).toBeVisible();
});

test("unknown and hidden packages return 404", async ({ page, request }) => {
  expect((await page.goto("/packages/does-not-exist"))?.status()).toBe(404);

  const login = await request.post("/api/auth/login", {
    data: { email: "admin@atlastours.com", password: "admin123" },
  });
  expect(login.ok()).toBe(true);
  const created = await request.post("/api/packages", {
    data: { name: `E2E hidden ${Date.now()}`, price: 1000, hidden: true },
  });
  expect(created.ok()).toBe(true);
  const { id } = await created.json();

  try {
    expect((await page.goto(`/packages/${id}`))?.status()).toBe(404);
  } finally {
    await request.delete("/api/packages", { data: { id } });
  }
});

test("booking form shows the estimate and submits to /api/book (G-01)", async ({ page }) => {
  await page.goto("/packages/pkg-varanasi");
  const form = page.getByRole("form", { name: /Book Divine Varanasi/ });

  await form.getByLabel("Full Name *").fill("E2E Traveller");
  await form.getByLabel("Phone *").fill("+91 98765 43210");
  await form.getByLabel("Email").fill("e2e@example.com");
  await form.getByLabel("Travel Date").fill("2099-01-15");
  await form.getByLabel("Travelers *").fill("2");
  await expect(form.getByText("× 2 travelers")).toBeVisible();
  await expect(form.getByText("₹17,998")).toBeVisible();

  const response = page.waitForResponse((r) => r.url().endsWith("/api/book") && r.request().method() === "POST");
  await form.getByRole("button", { name: "Request Booking" }).click();
  const res = await response;
  expect(res.status()).toBe(200);
  const sent = res.request().postDataJSON();
  expect(sent).toMatchObject({ packageId: "pkg-varanasi", travelers: 2, name: "E2E Traveller" });
  expect(sent).not.toHaveProperty("amount");

  await expect(form.getByText(/booking request has been received/)).toBeVisible();
  // N-13: no payment details until the booking is confirmed.
  await expect(form.getByText(/you can pay by UPI from the Track page/)).toBeVisible();
  await expect(form.getByText("d2095760-1@okicici")).toHaveCount(0);
  await expect(form.getByLabel("Full Name *")).toHaveValue("");
});

test("home page category filter and detail link (G-06)", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("#packages");
  const filters = section.getByRole("group", { name: "Filter packages by category" });

  await expect(filters.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
  await filters.getByRole("button", { name: "Heritage" }).click();
  await expect(filters.getByRole("button", { name: "Heritage" })).toHaveAttribute("aria-pressed", "true");
  await expect(section.getByRole("heading", { name: "Royal Rajasthan Tour" })).toBeVisible();
  await expect(section.getByRole("heading", { name: "Divine Varanasi & Prayagraj" })).toHaveCount(0);

  await filters.getByRole("button", { name: "All" }).click();
  await section.getByRole("link", { name: "View details: Divine Varanasi & Prayagraj" }).click();
  await page.waitForURL("**/packages/pkg-varanasi");
  await expect(page.getByRole("heading", { level: 1, name: "Divine Varanasi & Prayagraj" })).toBeVisible();
});

test("package cards open the detail page: image, title, View Details, Book Now", async ({ page }) => {
  const h1 = page.getByRole("heading", { level: 1, name: "Odisha Temples & Beaches Tour" });
  const card = () => page.locator("#packages .pkg-card").filter({ hasText: "Odisha Temples & Beaches Tour" });

  await page.goto("/");
  await card().getByRole("link", { name: "View details: Odisha Temples & Beaches Tour" }).click();
  await page.waitForURL("**/packages/pkg-odisha");
  await expect(h1).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.goto("/");
  await card().getByRole("heading", { name: "Odisha Temples & Beaches Tour" }).getByRole("link").click();
  await page.waitForURL("**/packages/pkg-odisha");
  await expect(h1).toBeVisible();

  // The image link is mouse-only (aria-hidden), so click the image itself.
  await page.goto("/");
  await card().locator('img[alt="Odisha Temples & Beaches Tour"]').click();
  await page.waitForURL("**/packages/pkg-odisha");
  await expect(h1).toBeVisible();

  // Book Now lands on the booking form.
  await page.goto("/");
  await card().getByRole("link", { name: "Book Odisha Temples & Beaches Tour" }).click();
  await page.waitForURL("**/packages/pkg-odisha#book");
  const form = page.getByRole("form", { name: /Book Odisha Temples & Beaches Tour/ });
  await expect(form).toBeInViewport();
  await expect(form.getByLabel("Travel Date")).toHaveAttribute("min", /^\d{4}-\d{2}-\d{2}$/);
});

test("/packages lists every public package with search, filter and sort", async ({ page }) => {
  const res = await page.goto("/packages");
  expect(res?.status()).toBe(200);
  await expect(page).toHaveTitle(/Tour Packages/);
  await expect(page.getByRole("heading", { level: 1, name: "Tour packages" })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/packages$/);

  // admin.spec.ts briefly hides "Royal Rajasthan Tour" on the shared test DB, so these
  // assertions only rely on the two spiritual seed packages (Varanasi, Odisha).
  const cards = page.locator(".pkg-card");
  await expect(cards.filter({ hasText: "Divine Varanasi & Prayagraj" })).toHaveCount(1);
  await expect(cards.filter({ hasText: "Odisha Temples & Beaches Tour" })).toHaveCount(1);
  await expect(page.getByRole("status").filter({ hasText: /^\d+ packages?$/ })).toBeVisible();

  // Search narrows the list and is mirrored into the URL.
  await page.getByLabel("Search packages").fill("ayodhya");
  await expect(cards).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 2, name: "Divine Varanasi & Prayagraj" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "1 package" })).toBeVisible();
  await expect(page).toHaveURL(/\?q=ayodhya$/);

  // No matches → empty state with a reset.
  await page.getByLabel("Search packages").fill("antarctica");
  await expect(cards).toHaveCount(0);
  await page.getByRole("button", { name: "Clear search and filters" }).click();
  await expect(cards.filter({ hasText: "Odisha Temples & Beaches Tour" })).toHaveCount(1);

  // Category filter.
  const filters = page.getByRole("group", { name: "Filter packages by category" });
  await filters.getByRole("button", { name: "Spiritual" }).click();
  await expect(cards).toHaveCount(2);
  await filters.getByRole("button", { name: "All" }).click();

  // Sort by price, high to low: Varanasi (₹8,999, the cheapest) ends up last.
  await page.getByLabel("Sort by").selectOption("price-desc");
  await expect(cards.last()).toContainText("Divine Varanasi & Prayagraj");
  await expect(page).toHaveURL(/sort=price-desc/);
});

test("/packages reads its filters from the URL", async ({ page }) => {
  await page.goto("/packages?q=temple&sort=price-asc");
  await expect(page.getByLabel("Search packages")).toHaveValue("temple");
  await expect(page.getByLabel("Sort by")).toHaveValue("price-asc");
  const cards = page.locator(".pkg-card");
  await expect(cards).toHaveCount(2);
  await expect(cards.first()).toContainText("Divine Varanasi & Prayagraj");
});

test("detail page links back to /packages and suggests other packages", async ({ page }) => {
  await page.goto("/packages/pkg-varanasi");
  await expect(page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Packages" })).toHaveAttribute("href", "/packages");
  const more = page.locator("section", { has: page.getByRole("heading", { name: "More packages" }) });
  // Same category first: Odisha is the other spiritual package.
  await expect(more.locator(".pkg-card").first()).toContainText("Odisha Temples & Beaches Tour");
  await expect(more.getByText("Divine Varanasi & Prayagraj")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Plan a custom trip" })).toHaveAttribute("href", "/plan-trip");
});

test("home page links to the full package list", async ({ page }) => {
  await page.goto("/");
  await page.locator("#packages").getByRole("link", { name: "See all packages" }).click();
  await page.waitForURL("**/packages");
  await expect(page.getByRole("heading", { level: 1, name: "Tour packages" })).toBeVisible();
});
