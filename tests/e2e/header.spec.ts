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

test("mobile menu shows the links and contact details, and closes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const menu = page.getByRole("dialog", { name: "Site menu" });
  await expect(menu).toBeHidden();

  await page.getByRole("button", { name: "Menu" }).click();
  await expect(menu).toBeVisible();
  await expect(page.getByRole("button", { name: "Close menu" })).toBeFocused();
  await expect(menu.getByRole("link", { name: "Packages" })).toBeVisible();
  await expect(menu.getByRole("link", { name: /\+91 6388360881/ })).toHaveAttribute("href", "tel:+916388360881");
  await expect(menu.getByRole("link", { name: /atlastourandtravels01@gmail\.com/ })).toHaveAttribute("href", "mailto:atlastourandtravels01@gmail.com");
  await expect(menu.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute("href", /wa\.me\/916388360881/);
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

  await page.getByRole("button", { name: "Close menu" }).click();
  await expect(menu).toBeHidden();
  await expect(page.getByRole("button", { name: "Menu" })).toBeFocused();

  await page.getByRole("button", { name: "Menu" }).click();
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();

  await page.getByRole("button", { name: "Menu" }).click();
  await menu.getByRole("link", { name: "Gallery" }).click();
  await expect(menu).toBeHidden();
  await expect(page).toHaveURL(/#gallery$/);
});
