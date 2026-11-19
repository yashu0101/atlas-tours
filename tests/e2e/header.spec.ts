import { expect, test, type Page } from "@playwright/test";

// The header reads what is under it: clear over the hero, light glass over white sections,
// dark glass over navy sections (data-header-tone="dark"), always dark in the dark theme.

const scrollTo = (page: Page, selector: string) =>
  page.evaluate((sel) => {
    document.documentElement.style.scrollBehavior = "auto";
    const el = document.querySelector(sel)!;
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + 30);
  }, selector);

test("header switches between clear, light glass and dark glass", async ({ page }) => {
  await page.goto("/");
  const header = page.locator("header.site-header");
  await expect(header).toHaveAttribute("data-surface", "clear");
  await expect(header).toHaveAttribute("data-tone", "dark");

  await scrollTo(page, "#about");
  await expect(header).toHaveAttribute("data-surface", "light");
  await expect(header).toHaveAttribute("data-tone", "light");

  await scrollTo(page, "#reviews");
  await expect(header).toHaveAttribute("data-surface", "dark");

  await scrollTo(page, "#faq");
  await expect(header).toHaveAttribute("data-surface", "light");
});

test("header uses the dark look on white sections in the dark theme", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("atlas-theme", "dark"));
  await page.goto("/packages");
  const header = page.locator("header.site-header");
  await expect(header).toHaveAttribute("data-surface", "clear");
  await page.evaluate(() => window.scrollTo(0, 600));
  await expect(header).toHaveAttribute("data-tone", "dark");
  await expect(header).toHaveAttribute("data-surface", "dark");
});
