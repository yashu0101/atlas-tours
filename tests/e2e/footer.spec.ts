import { expect, test } from "@playwright/test";

// Footer redesign: every link has a real destination (no dead "#packages" for every service).
test("footer contact links are actionable and tour links open the filtered listing", async ({ page }) => {
  await page.goto("/");
  const footer = page.locator("footer.ft");
  await expect(footer.locator('a[href^="tel:+91"]')).toHaveCount(1);
  await expect(footer.locator('a[href^="mailto:"]')).toHaveCount(1);
  await expect(footer.locator('a[href^="https://wa.me/"]')).toHaveCount(1);
  await expect(footer.getByRole("link", { name: "Heritage Tours" })).toHaveAttribute("href", "/packages?category=heritage");

  await footer.getByRole("link", { name: "Heritage Tours" }).click();
  await expect(page).toHaveURL(/\/packages\?category=heritage/);
});

test("footer section links point back to the home page on sub-routes", async ({ page }) => {
  await page.goto("/track");
  const footer = page.locator("footer.ft");
  await expect(footer.getByRole("link", { name: "FAQ" })).toHaveAttribute("href", "/#faq");
  await expect(footer.getByRole("link", { name: "Hotel Booking" })).toHaveAttribute("href", "/#contact");
});
