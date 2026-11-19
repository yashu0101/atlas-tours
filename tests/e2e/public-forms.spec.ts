import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

// N-4 /track, N-5 /reviews/new, N-6 /plan-trip. Runs against the e2e dev server's temp JSON
// database (see playwright.config.ts). The public endpoints are rate-limited per IP
// (x-forwarded-for, see src/lib/rate-limit.ts), so every test uses its own fake IP.

let ipCounter = 0;
const uniqueIp = () => `10.${Date.now() % 250}.${process.pid % 250}.${++ipCounter}`;

async function useOwnIp(page: Page) {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
}

async function createBooking(page: Page, phone: string) {
  const res = await page.request.post("/api/book", {
    headers: { "x-forwarded-for": uniqueIp() },
    data: {
      packageId: "pkg-varanasi",
      name: "Track Tester",
      phone,
      travelers: 2,
      travelDate: "2099-01-15",
    },
  });
  expect(res.ok()).toBeTruthy();
  const booking = (await res.json()) as { id: string; amount: number };
  return { id: booking.id, reference: booking.id.slice(0, 8).toUpperCase(), amount: booking.amount };
}

/** Confirms a booking through the admin API (separate request context = its own cookie jar). */
async function confirmBooking(request: APIRequestContext, id: string, extra: Record<string, unknown> = {}) {
  const login = await request.post("/api/auth/login", {
    data: { email: "admin@atlastours.com", password: "admin123" },
  });
  expect(login.ok()).toBeTruthy();
  const patch = await request.patch("/api/bookings", { data: { id, bookingStatus: "confirmed", ...extra } });
  expect(patch.ok()).toBeTruthy();
}

async function trackBooking(page: Page, reference: string, phone: string) {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
  await page.goto(`/track?ref=${reference}`);
  const form = page.getByRole("form", { name: "Track a booking" });
  await form.getByLabel("Phone *").fill(phone);
  await form.getByRole("button", { name: "Check status" }).click();
  const result = page.getByRole("region", { name: `Booking ${reference}` });
  await expect(result).toBeVisible();
  return result;
}

test("pending booking on /track has no pay panel (N-13)", async ({ page }) => {
  const { reference } = await createBooking(page, "9876566661");
  const result = await trackBooking(page, reference, "9876566661");
  await expect(result.getByText("Pay via UPI")).toHaveCount(0);
});

test("confirmed booking shows the UPI QR and accepts a UTR (N-13)", async ({ page, request }) => {
  const { id, reference, amount } = await createBooking(page, "9876566662");
  await confirmBooking(request, id);
  const result = await trackBooking(page, reference, "9876566662");

  await expect(result.getByText(/Your booking is confirmed\. Scan the QR code below to pay/)).toBeVisible();
  await expect(result.getByText("Pay via UPI", { exact: true })).toBeVisible();
  await expect(result.getByRole("img", { name: /UPI ID/ })).toBeVisible();
  await expect(result.getByText(`Amount: ₹${amount.toLocaleString("en-IN")}`)).toBeVisible();

  await result.getByLabel("UPI transaction ID (UTR)").fill("4123 5678 9012");
  await result.getByRole("button", { name: "Submit transaction ID" }).click();
  await expect(result.getByText("Verifying payment", { exact: true })).toBeVisible();
  await expect(result.getByText("Pay via UPI", { exact: true })).toHaveCount(0);
});

test("a failed payment can be paid again on /track (N-13)", async ({ page, request }) => {
  const { id, reference } = await createBooking(page, "9876566664");
  await confirmBooking(request, id, { paymentStatus: "failed" });
  const result = await trackBooking(page, reference, "9876566664");

  await expect(result.getByText("Payment failed", { exact: true })).toBeVisible();
  await expect(result.getByText(/Scan the QR code below to pay again/)).toBeVisible();
  await expect(result.getByText("Pay via UPI", { exact: true })).toBeVisible();

  await result.getByLabel("UPI transaction ID (UTR)").fill("5123 5678 9012");
  await result.getByRole("button", { name: "Submit transaction ID" }).click();
  await expect(result.getByText("Verifying payment", { exact: true })).toBeVisible();
});

test("an invalid UTR shows an inline error without a request (N-13)", async ({ page, request }) => {
  const { id, reference } = await createBooking(page, "9876566663");
  await confirmBooking(request, id);
  const result = await trackBooking(page, reference, "9876566663");

  let claims = 0;
  page.on("request", (r) => {
    if (r.url().endsWith("/api/payment-claim")) claims++;
  });
  await result.getByLabel("UPI transaction ID (UTR)").fill("123");
  await result.getByRole("button", { name: "Submit transaction ID" }).click();
  await expect(result.getByText("The transaction ID must be 12 digits.")).toBeVisible();
  expect(claims).toBe(0);
});

test("booking success shows no QR and says to pay after confirmation (N-13)", async ({ page }) => {
  await useOwnIp(page);
  await page.goto("/packages/pkg-varanasi");
  const form = page.getByRole("form", { name: /Book Divine Varanasi/ });
  await form.getByLabel("Full Name *").fill("Copy Tester");
  await form.getByLabel("Phone *").fill("9876566664");
  await form.getByRole("button", { name: "Request Booking" }).click();
  await expect(form.getByText(/you can pay by UPI from the Track page/)).toBeVisible();
  await expect(page.getByRole("img", { name: /UPI QR code/ })).toHaveCount(0);
});

test("track page shows a booking found by reference + phone (N-4)", async ({ page }) => {
  const { reference, amount } = await createBooking(page, "+91 98765 11111");
  await useOwnIp(page);

  await page.goto(`/track?ref=${reference}`);
  await expect(page.getByRole("heading", { level: 1, name: "Track your booking" })).toBeVisible();
  const form = page.getByRole("form", { name: "Track a booking" });
  await expect(form.getByLabel("Booking reference *")).toHaveValue(reference);

  // Different formatting of the same number still matches (digits only, last 10).
  await form.getByLabel("Phone *").fill("09876511111");
  await form.getByRole("button", { name: "Check status" }).click();

  const result = page.getByRole("region", { name: `Booking ${reference}` });
  await expect(result).toBeVisible();
  await expect(result.getByText("Hi Track, here is the latest on your booking.")).toBeVisible();
  await expect(result.getByText("Divine Varanasi & Prayagraj")).toBeVisible();
  await expect(result.getByText("15 Jan 2099")).toBeVisible();
  await expect(result.getByText(`₹${amount.toLocaleString("en-IN")}`)).toBeVisible();
  await expect(result.getByText("Pending", { exact: true })).toBeVisible();
  await expect(result.getByText("Not paid yet", { exact: true })).toBeVisible();
  await expect(result.getByText(/Once we confirm your booking, you can pay here by UPI/)).toBeVisible();
});

test("track page shows not-found for a wrong phone number (N-4)", async ({ page }) => {
  const { reference } = await createBooking(page, "9876522222");
  await useOwnIp(page);

  await page.goto("/track");
  const form = page.getByRole("form", { name: "Track a booking" });
  await form.getByLabel("Booking reference *").fill(reference.toLowerCase());
  await form.getByLabel("Phone *").fill("9000000000");
  await form.getByRole("button", { name: "Check status" }).click();

  await expect(form.getByRole("alert")).toContainText("No booking matches that reference and phone number");
  await expect(page.getByRole("heading", { name: `Booking ${reference}` })).toHaveCount(0);
});

test("booking success message links to the track page (N-4)", async ({ page }) => {
  await useOwnIp(page);
  await page.goto("/packages/pkg-varanasi");
  const form = page.getByRole("form", { name: /Book Divine Varanasi/ });
  await form.getByLabel("Full Name *").fill("Link Tester");
  await form.getByLabel("Phone *").fill("9876533333");
  await form.getByRole("button", { name: "Request Booking" }).click();

  const link = form.getByRole("link", { name: "Track this booking" });
  await expect(link).toHaveAttribute("href", /^\/track\?ref=[0-9A-F]{8}$/);
  await link.click();
  await page.waitForURL(/\/track\?ref=/);
  await expect(page.getByLabel("Booking reference *")).toHaveValue(/^[0-9A-F]{8}$/);
});

test("review form submits a review for approval (N-5)", async ({ page }) => {
  await useOwnIp(page);
  await page.goto("/reviews/new");
  await expect(page.getByRole("heading", { level: 1, name: "Write a review" })).toBeVisible();
  const form = page.getByRole("form", { name: "Write a review" });

  await form.getByLabel("Full Name *").fill("E2E Reviewer");
  await form.getByLabel("Your City").fill("Pune");

  // Star rating is a radio group: pick 5 with the pointer, then 3 and 4 with the keyboard.
  await form.locator('label[for="review-star-5"]').click();
  await expect(form.getByRole("radio", { name: "5 stars" })).toBeChecked();
  await form.getByRole("radio", { name: "3 stars" }).focus();
  await page.keyboard.press("Space");
  await expect(form.getByRole("radio", { name: "3 stars" })).toBeChecked();
  await page.keyboard.press("ArrowRight");
  await expect(form.getByRole("radio", { name: "4 stars" })).toBeChecked();
  await expect(form.getByRole("radio", { name: "4 stars" })).toBeFocused();

  await form.getByLabel("Which tour did you take?").selectOption({ label: "Divine Varanasi & Prayagraj" });
  const text = "Wonderful trip, the evening Ganga Aarti was unforgettable.";
  await form.getByLabel("Your review *").fill(text);
  await expect(form.getByText(`${text.length} / 1000 characters`)).toBeVisible();

  const response = page.waitForResponse((r) => r.url().endsWith("/api/review") && r.request().method() === "POST");
  await form.getByRole("button", { name: "Submit review" }).click();
  const res = await response;
  expect(res.status()).toBe(200);
  expect(res.request().postDataJSON()).toMatchObject({ name: "E2E Reviewer", rating: 4, packageId: "pkg-varanasi", text });

  await expect(page.getByText("Thank you for your review! It will appear on the site once our team has approved it.")).toBeVisible();
});

test("plan-trip form sends a trip plan (N-6)", async ({ page }) => {
  await useOwnIp(page);
  await page.goto("/plan-trip");
  await expect(page.getByRole("radio", { name: "Plan my trip" })).toBeChecked();
  const form = page.getByRole("form", { name: "Plan my trip" });

  await form.getByLabel("Full Name *").fill("E2E Planner");
  await form.getByLabel("Phone *").fill("9876544444");
  await form.getByLabel("Where would you like to go?").fill("Varanasi, Sarnath");
  await form.getByLabel("Number of days").fill("4");
  await form.getByLabel("Travelers").fill("3");
  await form.getByLabel("Budget").selectOption("10k-25k");
  await form.getByLabel("Ganga boat rides").check();
  await form.getByLabel("Food & local markets").check();

  const response = page.waitForResponse((r) => r.url().endsWith("/api/trip-request") && r.request().method() === "POST");
  await form.getByRole("button", { name: "Send trip request" }).click();
  const res = await response;
  expect(res.status()).toBe(200);
  expect(res.request().postDataJSON()).toMatchObject({
    kind: "trip-plan",
    destinations: "Varanasi, Sarnath",
    days: 4,
    travelers: 3,
    budget: "10k-25k",
    interests: ["boat-ride", "food"],
  });
  await expect(form.getByRole("status")).toContainText("We have your trip request");
});

test("plan-trip ?mode=callback requests a callback (N-6)", async ({ page }) => {
  await useOwnIp(page);
  await page.goto("/plan-trip?mode=callback");
  await expect(page.getByRole("radio", { name: "Request a callback" })).toBeChecked();
  const form = page.getByRole("form", { name: "Request a callback" });

  await form.getByLabel("Full Name *").fill("E2E Caller");
  await form.getByLabel("Phone *").fill("9876555555");
  const dateInput = form.getByLabel("Date *");
  const min = await dateInput.getAttribute("min");
  expect(min).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(await dateInput.getAttribute("max")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  await dateInput.fill(min!);
  await form.getByLabel("Evening (4 PM – 8 PM IST)").check();

  const response = page.waitForResponse((r) => r.url().endsWith("/api/trip-request") && r.request().method() === "POST");
  await form.getByRole("button", { name: "Request callback" }).click();
  const res = await response;
  expect(res.status()).toBe(200);
  expect(res.request().postDataJSON()).toMatchObject({ kind: "callback", callbackDate: min, callbackSlot: "evening" });
  await expect(form.getByRole("status")).toContainText("We will call you on");
});

test("plan-trip mode switch is keyboard operable (N-6)", async ({ page }) => {
  await page.goto("/plan-trip");
  await page.getByRole("radio", { name: "Plan my trip" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "Request a callback" })).toBeChecked();
  await expect(page.getByRole("form", { name: "Request a callback" })).toBeVisible();
});
