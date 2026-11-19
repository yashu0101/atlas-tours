import { readFile } from "node:fs/promises";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

// N-1 / N-5: admin Bookings search + CSV export and customer review moderation, against the
// e2e dev server's temp JSON database (see playwright.config.ts). Data is created through the
// public endpoints; each request gets its own x-forwarded-for so the 5/min/IP limit never trips.

async function login(page: Page) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill("admin@atlastours.com");
  await page.locator('input[type="password"]').fill("admin123");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/admin");
  await expect(page.getByRole("heading", { name: /Admin/ })).toBeVisible();
}

const uniqueIp = () => `10.${[0, 0, 0].map(() => Math.floor(Math.random() * 250) + 1).join(".")}`;

async function postPublic(request: APIRequestContext, url: string, data: Record<string, unknown>) {
  const res = await request.post(url, { data, headers: { "x-forwarded-for": uniqueIp() } });
  expect(res.status(), `${url} → ${await res.text()}`).toBe(200);
  return res.json();
}

// Delete asks confirm(); any other dialog is an alert() = a failed request.
function trackAlerts(page: Page) {
  const alerts: string[] = [];
  page.on("dialog", async (dialog) => {
    if (dialog.type() === "confirm") return dialog.accept();
    alerts.push(dialog.message());
    return dialog.dismiss();
  });
  return alerts;
}

test("bookings: search narrows the table and Export CSV downloads the filtered rows", async ({ page }) => {
  const alerts = trackAlerts(page);
  const tag = `E2E${Date.now()}`;
  const travelDate = new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10);
  const alpha = await postPublic(page.request, "/api/book", {
    name: `Alpha ${tag}`, phone: "9876543210", email: "alpha@example.com", city: "Pune, MH",
    travelers: 2, travelDate, packageId: "pkg-varanasi",
  });
  await postPublic(page.request, "/api/book", {
    name: `Beta ${tag}`, phone: "9123456780", email: "beta@example.com", city: "Delhi",
    travelers: 1, travelDate, packageId: "pkg-odisha",
  });
  await postPublic(page.request, "/api/enquiry", {
    name: `Gamma ${tag}`, phone: "9000011111", email: "gamma@example.com", travelers: 3, travelDate, message: "Line one\nLine two",
  });
  const reference = String(alpha.id).slice(0, 8).toUpperCase();

  await login(page);
  await page.getByRole("button", { name: "Bookings", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Bookings" })).toBeVisible();

  const rows = page.locator(".adm-table tbody tr");
  await expect(rows.filter({ hasText: `Alpha ${tag}` })).toHaveCount(1);
  await expect(rows.filter({ hasText: `Beta ${tag}` })).toHaveCount(1);

  // Search by name tag: both; by reference: only Alpha.
  const search = page.getByRole("searchbox", { name: "Search bookings" });
  await search.fill(tag.toLowerCase());
  await expect(rows).toHaveCount(2);
  await expect(page.locator(".adm-pager")).toContainText("Showing 1–2 of 2");
  await search.fill(reference);
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText(`Alpha ${tag}`);
  await expect(rows.first()).toContainText(reference);

  // Export: built by the server from the same filters; the file holds exactly the filtered row.
  const [download, exportRequest] = await Promise.all([
    page.waitForEvent("download"),
    page.waitForRequest(req => new URL(req.url()).pathname === "/api/bookings/export"),
    page.getByRole("button", { name: "Export CSV" }).click(),
  ]);
  expect(new URL(exportRequest.url()).searchParams.get("q")).toBe(reference);
  expect(download.suggestedFilename()).toMatch(/^atlas-bookings-\d{4}-\d{2}-\d{2}\.csv$/);
  const path = await download.path();
  const csv = await readFile(path, "utf8");
  expect(csv.startsWith("﻿")).toBe(true);
  const lines = csv.slice(1).split("\r\n").filter(Boolean);
  expect(lines[0]).toMatch(/^Reference,Booking ID,Received \(IST\),Name,/);
  expect(lines).toHaveLength(2);
  expect(lines[1]).toContain(`${reference},${alpha.id},`);
  expect(lines[1]).toContain(`Alpha ${tag}`);
  expect(lines[1]).toContain('"Pune, MH"');
  expect(lines[1]).toContain("Divine Varanasi & Prayagraj");
  expect(csv).not.toContain(`Beta ${tag}`);

  // Status edits refetch the current page: with "Pending" selected, confirming Alpha removes it.
  await search.fill(tag);
  await page.locator(".adm-filters select").first().selectOption("pending"); // the "Booking status" filter
  await expect(rows).toHaveCount(2);
  const alphaRow = rows.filter({ hasText: `Alpha ${tag}` });
  await alphaRow.getByRole("combobox", { name: "Booking status" }).selectOption("confirmed");
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText(`Beta ${tag}`);
  await page.getByRole("button", { name: "Clear" }).click();

  // No match → empty state, and Export is disabled.
  await search.fill(`${tag}-nobody`);
  await expect(rows).toHaveCount(0);
  await expect(page.getByText("No bookings match these filters.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Export CSV" })).toBeDisabled();

  // Enquiries: type badge and the full multi-line message behind "View".
  await page.getByRole("button", { name: "Enquiries", exact: true }).click();
  await page.getByRole("searchbox", { name: "Search enquiries" }).fill(`Gamma ${tag}`);
  const enquiryRow = page.locator(".adm-table tbody tr", { hasText: `Gamma ${tag}` });
  await expect(enquiryRow).toHaveCount(1);
  await expect(enquiryRow).toContainText("Contact");
  await enquiryRow.getByRole("button", { name: "View" }).click();
  const message = page.locator(".adm-message");
  await expect(message).toBeVisible();
  expect(await message.evaluate(el => el.textContent)).toBe("Line one\nLine two");
  await expect(message).toHaveCSS("white-space", "pre-wrap");

  expect(alerts, `unexpected alert() dialogs: ${alerts.join(" | ")}`).toEqual([]);
});

test("reviews: approving a customer review publishes it on the home page", async ({ page }) => {
  const alerts = trackAlerts(page);
  const name = `Reviewer ${Date.now()}`;
  const text = `E2E customer review ${Date.now()} — wonderful Ganga Aarti evening.`;
  await postPublic(page.request, "/api/review", { name, city: "Lucknow", rating: 5, text });

  // Not public before approval.
  const before = await (await page.request.get("/api/reviews")).json();
  expect(before.some((r: { name: string }) => r.name === name)).toBe(false);

  await login(page);
  await expect(page.locator(".stat-card", { hasText: "Reviews awaiting approval" }).locator(".num")).not.toHaveText("0");

  await page.getByRole("button", { name: "Reviews", exact: true }).click();
  await page.getByRole("button", { name: /^Awaiting approval/ }).click();
  const card = page.locator(".adm-card", { hasText: name });
  await expect(card).toContainText("Customer");
  await expect(card).toContainText("Awaiting approval");
  await card.getByRole("button", { name: "Approve" }).click();

  // Leaves the "Awaiting approval" view once approved; shows as Active under "Active".
  await expect(card).toHaveCount(0);
  await page.getByRole("button", { name: /^Active/ }).click();
  await expect(card).toContainText("Active");
  await expect(card.getByRole("button", { name: "Deactivate" })).toBeVisible();

  const after = await (await page.request.get("/api/reviews")).json();
  expect(after.some((r: { name: string }) => r.name === name)).toBe(true);

  // The home page carousel shows one review at a time: step through the dots until it appears.
  await page.goto("/");
  const section = page.locator("#reviews");
  await section.scrollIntoViewIfNeeded();
  const dots = section.getByRole("button", { name: /^Go to review \d+$/ });
  const count = await dots.count();
  expect(count).toBeGreaterThan(0);
  let found = false;
  for (let i = count - 1; i >= 0 && !found; i--) {
    await dots.nth(i).click();
    found = await expect(section.getByText(name, { exact: true })).toBeVisible({ timeout: 1000 }).then(() => true, () => false);
  }
  expect(found, "approved review should be on the home page").toBe(true);
  await expect(section).toContainText(text);

  expect(alerts, `unexpected alert() dialogs: ${alerts.join(" | ")}`).toEqual([]);
});

// N-13: payment verification in the admin Bookings tab.
test("bookings: verifying filter, UTR display, edit amount and copy pay link", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const tag = `Pay${Date.now()}`;
  const phone = "9811122233";
  const travelDate = new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10);
  const booking = await postPublic(page.request, "/api/book", {
    name: `Payer ${tag}`, phone, email: "payer@example.com", city: "Pune",
    travelers: 2, travelDate, packageId: "pkg-varanasi",
  });
  const reference = String(booking.id).slice(0, 8).toUpperCase();

  // Confirm through the admin API, then the customer submits a UTR on the public endpoint.
  await login(page);
  const confirm = await page.request.patch("/api/bookings", { data: { id: booking.id, bookingStatus: "confirmed" } });
  expect(confirm.ok()).toBeTruthy();
  await postPublic(page.request, "/api/payment-claim", { reference, phone, utr: "712356789012" });

  const alerts: string[] = [];
  let promptValue = "9000";
  page.on("dialog", async (dialog) => {
    if (dialog.type() === "prompt") return dialog.accept(promptValue);
    alerts.push(dialog.message());
    return dialog.dismiss();
  });

  await page.getByRole("button", { name: "Bookings", exact: true }).click();
  const rows = page.locator(".adm-table tbody tr");
  await page.getByRole("searchbox", { name: "Search bookings" }).fill(tag);
  const row = rows.filter({ hasText: `Payer ${tag}` });
  await expect(row).toContainText("UTR 712356789012");

  // Payment filter "Verifying" lists it.
  await page.locator(".adm-filters select").nth(1).selectOption("verifying");
  await expect(row).toHaveCount(1);
  await expect(row).toContainText("UTR 712356789012");
  await page.getByRole("button", { name: "Clear" }).click();
  await page.getByRole("searchbox", { name: "Search bookings" }).fill(tag);

  // While verifying, the amount and pay link are locked.
  await expect(row.getByRole("button", { name: "Edit" })).toBeDisabled();
  await expect(row.getByRole("button", { name: "Copy pay link" })).toBeDisabled();

  // Owner rejects the UTR: back to pending clears it and unlocks both.
  await row.getByRole("combobox", { name: "Payment status" }).selectOption("pending");
  await expect(row).not.toContainText("UTR 712356789012");

  // Edit amount.
  await row.getByRole("button", { name: "Edit" }).click();
  await expect(row).toContainText("₹9,000");

  // Copy pay link: enabled only for confirmed bookings.
  await row.getByRole("button", { name: "Copy pay link" }).click();
  await expect(row.getByRole("button", { name: "Copied!" })).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toBe(`${new URL(page.url()).origin}/track?ref=${reference}`);

  await row.getByRole("combobox", { name: "Booking status" }).selectOption("pending");
  await expect(row.getByRole("button", { name: "Copy pay link" })).toBeDisabled();

  // Invalid amount: alert and no change.
  promptValue = "abc";
  await row.getByRole("button", { name: "Edit" }).click();
  await expect.poll(() => alerts.length).toBe(1);
  await expect(row).toContainText("₹9,000");
  expect(alerts.length).toBe(1);
});
