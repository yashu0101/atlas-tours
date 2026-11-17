import { expect, test } from "@playwright/test";

// G-07: blog detail pages. Runs against the seed data on the e2e dev server's temp
// JSON database (see playwright.config.ts); seed post "b1" is active.

const ADMIN = { email: "admin@atlastours.com", password: "admin123" };

test("home blog card links to a full article page", async ({ page }) => {
  await page.goto("/");
  const link = page.locator("#blog").getByRole("link", { name: /Read full article: Top 10 Temples to Visit in Varanasi/ });
  await expect(link).toHaveAttribute("href", "/blog/b1");
  await link.click();
  await page.waitForURL("**/blog/b1");
  await expect(page.getByRole("heading", { level: 1, name: "Top 10 Temples to Visit in Varanasi" })).toBeVisible();
});

test("blog detail renders content, date, metadata and JSON-LD", async ({ page }) => {
  const res = await page.goto("/blog/b1");
  expect(res?.status()).toBe(200);

  await expect(page.getByRole("heading", { level: 1, name: "Top 10 Temples to Visit in Varanasi" })).toBeVisible();
  await expect(page.getByText("Varanasi is home to thousands of temples...")).toBeVisible();
  await expect(page.locator("time")).toHaveText("1 Jun 2024");
  await expect(page.getByRole("img", { name: "Top 10 Temples to Visit in Varanasi" })).toBeVisible();

  await expect(page).toHaveTitle(/Top 10 Temples to Visit in Varanasi/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/blog\/b1$/);
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");

  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  const posting = jsonLd.map((t) => JSON.parse(t)).find((d) => d["@type"] === "BlogPosting");
  expect(posting?.headline).toBe("Top 10 Temples to Visit in Varanasi");

  const back = page.getByRole("link", { name: "Back to all articles" }).first();
  await expect(back).toHaveAttribute("href", "/#blog");
});

test("missing blog post returns 404", async ({ page }) => {
  const res = await page.goto("/blog/does-not-exist");
  expect(res?.status()).toBe(404);
});

test("inactive blog post returns 404", async ({ request }) => {
  const login = await request.post("/api/auth/login", { data: ADMIN });
  expect(login.ok()).toBeTruthy();

  const created = await request.post("/api/blogs", {
    data: { title: `E2E hidden post ${Date.now()}`, excerpt: "x", content: "Hidden", active: false },
  });
  expect(created.ok()).toBeTruthy();
  const { id } = (await created.json()) as { id: string };

  try {
    const res = await request.get(`/blog/${id}`);
    expect(res.status()).toBe(404);
  } finally {
    await request.delete("/api/blogs", { data: { id } });
  }
});
