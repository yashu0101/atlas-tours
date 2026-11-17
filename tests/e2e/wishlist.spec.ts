import { expect, test, type Locator } from "@playwright/test";

// N-7: wishlist + comparison. Runs against the seed data (see playwright.config.ts → JSON_DB_PATH):
// pkg-varanasi "Divine Varanasi & Prayagraj", pkg-odisha "Sacred Odisha Pilgrimage". Not pkg-rajasthan: admin.spec.ts hides it while the specs run in parallel.
const VARANASI = "Divine Varanasi & Prayagraj";
const ODISHA = "Sacred Odisha Pilgrimage";

/** Presses a toggle until it reports pressed (a click before hydration is otherwise lost). */
async function pressUntilOn(toggle: Locator) {
  await expect(async () => {
    if ((await toggle.getAttribute("aria-pressed")) !== "true") await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true", { timeout: 1000 });
  }).toPass({ timeout: 15_000 });
}

test("save a package on the home page and see it on /wishlist after reload", async ({ page }) => {
  await page.goto("/");
  const packages = page.locator("#packages");
  await pressUntilOn(packages.getByRole("button", { name: `Save ${VARANASI} to wishlist` }));

  // Stored on this device only.
  expect(await page.evaluate(() => localStorage.getItem("atlas-wishlist"))).toBe('["pkg-varanasi"]');

  await page.goto("/wishlist");
  await page.reload();
  const main = page.locator("main");
  await expect(main.getByRole("link", { name: VARANASI })).toBeVisible();
  await expect(main.getByRole("link", { name: ODISHA })).toHaveCount(0);

  // Remove → empty state linking back to the packages section.
  await main.getByRole("button", { name: `Remove ${VARANASI} from wishlist` }).click();
  await expect(main.getByRole("link", { name: "Browse packages" })).toHaveAttribute("href", "/#packages");
});

test("select two packages for comparison and open /compare", async ({ page }) => {
  await page.goto("/");
  const packages = page.locator("#packages");
  await pressUntilOn(packages.getByRole("button", { name: `Compare ${VARANASI}` }));
  await pressUntilOn(packages.getByRole("button", { name: `Compare ${ODISHA}` }));

  const bar = page.getByRole("region", { name: "Package comparison" });
  const open = bar.getByRole("link", { name: "Compare (2/3)" });
  await expect(open).toHaveAttribute("href", "/compare?ids=pkg-varanasi,pkg-odisha");
  await open.click();

  await expect(page).toHaveURL(/\/compare\?ids=pkg-varanasi,pkg-odisha$/);
  const table = page.getByRole("table");
  await expect(table.getByRole("columnheader", { name: VARANASI })).toBeVisible();
  await expect(table.getByRole("columnheader", { name: ODISHA })).toBeVisible();
  await expect(table.getByText("₹8,999").first()).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("compare ignores unknown and duplicate ids", async ({ page }) => {
  // The cap at three is covered by tests/unit/wishlist.test.ts: only three seed packages
  // exist and admin.spec.ts briefly hides one of them.
  await page.goto("/compare?ids=nope,pkg-odisha,pkg-varanasi,pkg-odisha");
  const headers = page.getByRole("table").getByRole("columnheader");
  await expect(headers).toHaveCount(2);
  await expect(headers.nth(0)).toContainText(ODISHA);
  await expect(headers.nth(1)).toContainText(VARANASI);
});
