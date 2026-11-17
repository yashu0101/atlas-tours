import { expect, test } from "@playwright/test";

// Q-6: the reviews carousel has a visible pause/play control (WCAG 2.2.2).
// Seed data has 3 reviews; auto-advance is 5s per slide.

test("reviews carousel auto-advances, and the pause button stops it until play", async ({ page }) => {
  await page.goto("/");
  const carousel = page.getByRole("region", { name: "Customer reviews" });
  await carousel.scrollIntoViewIfNeeded();
  const slide = carousel.getByRole("group");
  // Hovering the carousel also pauses it, so keep the mouse away while waiting.
  const moveAway = () => page.mouse.move(0, 0);

  await moveAway();
  await expect(slide).toHaveAttribute("aria-label", "1 of 3");
  await expect(slide).toHaveAttribute("aria-label", "2 of 3", { timeout: 8000 });

  await carousel.getByRole("button", { name: "Pause automatic review rotation" }).click();
  await moveAway();
  const playButton = carousel.getByRole("button", { name: "Resume automatic review rotation" });
  await expect(playButton).toBeVisible();
  await page.waitForTimeout(6500);
  await expect(slide).toHaveAttribute("aria-label", "2 of 3");

  await playButton.click();
  await moveAway();
  await expect(carousel.getByRole("button", { name: "Pause automatic review rotation" })).toBeVisible();
  await expect(slide).toHaveAttribute("aria-label", "3 of 3", { timeout: 8000 });
});

test("pause button is not shown when the visitor prefers reduced motion", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  const carousel = page.getByRole("region", { name: "Customer reviews" });
  await carousel.scrollIntoViewIfNeeded();
  await expect(carousel.getByRole("button", { name: "Next review" })).toBeVisible();
  await expect(carousel.getByRole("button", { name: /automatic review rotation/ })).toHaveCount(0);
  await context.close();
});

test("admin login placeholder does not reveal a real account (Q-4)", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator('input[type="email"]')).toHaveAttribute("placeholder", "you@example.com");
});
