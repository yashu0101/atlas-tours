import { expect, test } from "@playwright/test";
import { HOTEL_PARTNER } from "../../src/lib/config";

// Hotel Ganga Imperial badge (PartnerNote) in the hero, About, Contact and on /track.
// The booking success message is covered in public-forms.spec.ts.

test("partner hotel badge is on the first screen and in About and Contact", async ({ page }) => {
  await page.goto("/");
  for (const section of ["#home", "#about", "#contact"]) {
    const link = page.locator(`${section} [data-testid="partner-note"]`);
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute("href", HOTEL_PARTNER.url);
    await expect(link).toHaveAttribute("target", "_blank");
  }
  // Visible without scrolling.
  await expect(page.locator('#home [data-testid="partner-note"]')).toBeInViewport();
});

test("track page shows the partner hotel badge", async ({ page }) => {
  await page.goto("/track");
  const card = page.getByTestId("partner-note");
  await expect(card).toHaveAccessibleName(/Our partner hotel in Varanasi Hotel Ganga Imperial/);
  await expect(card).toHaveAttribute("href", HOTEL_PARTNER.url);
});
