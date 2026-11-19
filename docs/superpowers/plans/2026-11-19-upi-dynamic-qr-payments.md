# UPI Dynamic QR Payments (N-13) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After the owner confirms a booking, the customer pays the full amount by scanning a per-booking UPI QR on `/track` (amount and reference pre-filled), submits the UTR, and the owner verifies it and marks the booking paid.

**Architecture:** The QR is a `upi://pay` link built from `UPI_CONFIG` plus the booking's amount and reference, rendered in the browser with the `qrcode` package (no external service, no gateway). The site cannot see the payment, so a new public `POST /api/payment-claim` (reference + phone + UTR, same auth as `/api/booking-status`) moves the booking to `paymentStatus: "verifying"`, and the owner sets `paid` in the admin. Emails: customer on confirm (with the pay link) and on paid; owner on UTR submission.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, JSON/Postgres dual backend (`src/lib/db.ts`), Vitest 4, Playwright, `qrcode@1.5.4` (+ `@types/qrcode@1.5.5`).

**Spec (decisions, from the 2026-11-19 conversation):**
- Payee: the existing UPI ID `d2095760-1@okicici`, payee name `Dilip` (`UPI_CONFIG`). Real-device test: a QR with `pa=<UPI ID>` + `am` worked in Google Pay and PhonePe (bank name, payee and amount shown). `pa=<account>@<IFSC>.ifsc.npci` FAILED ("not linked") — never use account + IFSC.
- **Full payment**, only **after the owner confirms** the booking.
- No payment gateway (G-09 stays open/blocked). Verification is manual (UTR).
- Per-person pricing (`amount = price × travelers`) is still unconfirmed (Q-1) — the owner can correct the amount in the admin before confirming.

## Global Constraints

- Link format, exactly: `upi://pay?pa=<UPI_CONFIG.id>&pn=<encodeURIComponent(payee)>&am=<amount with 2 decimals>&cu=INR&tn=<encodeURIComponent("Atlas booking " + REF)>` — the `@` in `pa` is **not** percent-encoded.
- Never hardcode visible text: add keys to `src/lib/i18n/en.ts`, then `UPDATE_HINDI_DOC=1 npx vitest run tests/unit/i18n.test.ts`.
- Never edit a shipped migration — append v7. Status unions in `types.ts` must match the CHECK constraint.
- Integer fields use `int(min, max)` from `api.ts` (B-13). `amount` range: 1 … 10,000,000.
- Admin markup uses `--a-*` variables; public components use the existing CSS variables, no new colours.
- No visual redesign: the Contact-section `UpiPayCard` (static image) stays exactly as it is.
- Dependencies pinned exactly: `qrcode@1.5.4`, `@types/qrcode@1.5.5` (dev).
- Tests never touch `data/db.json` (temp DB helpers only).
- Before finishing each task: `npx tsc --noEmit`, `npm run lint`, `npm test`; `npm run test:e2e` for Tasks 5–6.

## Review Focus

1. **Paying before confirmation** (stale link, pending/cancelled/paid booking) → `/api/payment-claim` returns 409 and saves nothing; `/track` shows the QR only for `confirmed` + `pending`. (Task 3 tests, Task 5 e2e)
2. **UTR typed with spaces/dashes or wrong length** ("4123 5678-9012", 11 digits, letters) → normalised to 12 digits or 400. (Task 1 + Task 3 tests)
3. **Same UTR submitted for a second booking** → 409 "already used", nothing saved. (Task 3 test)
4. **Owner changes the amount after confirming** → the next `/track` lookup builds the QR from the new amount; amount must be an integer, decimals → 400. (Task 4 test)
5. **Old Postgres rows with no `utr` / `payment_submitted_at`** → read back as `undefined`; v7 applies on an old schema. (Task 2 pg test)

---

### Task 1: UPI link and UTR helpers

**Files:**
- Create: `src/lib/upi.ts`
- Modify: `src/lib/config.ts:87-88` (move `UPI_PAY_LINK` building into `upi.ts`; keep `UPI_CONFIG` in `config.ts`)
- Modify: `src/components/UpiPayCard.tsx:5` (import `UPI_PAY_LINK` from `@/lib/upi`)
- Test: `tests/unit/upi.test.ts`

**Interfaces:**
- Produces: `upiPayLink(opts?: { amount: number; reference: string }): string`; `UPI_PAY_LINK: string` (= `upiPayLink()`); `normalizeUtr(input: string): string | null`; `UTR_LENGTH = 12`.

- [ ] **Step 1: Write the failing tests**

```ts
it("builds a per-booking link with amount and reference", () => {
  expect(upiPayLink({ amount: 17998, reference: "3F9A21BC" })).toBe(
    "upi://pay?pa=d2095760-1@okicici&pn=Dilip&am=17998.00&cu=INR&tn=Atlas%20booking%203F9A21BC");
});
it("builds the generic link without amount", () => {
  expect(UPI_PAY_LINK).toBe("upi://pay?pa=d2095760-1@okicici&pn=Dilip&cu=INR");
});
it.each([["412356789012", "412356789012"], [" 4123 5678-9012 ", "412356789012"]])("normalizes UTR %s", (i, o) =>
  expect(normalizeUtr(i)).toBe(o));
it.each(["41235678901", "4123567890123", "41235678901A", ""])("rejects UTR %s", i => expect(normalizeUtr(i)).toBeNull());
```

- [ ] **Step 2: Run** `npx vitest run tests/unit/upi.test.ts` — expect FAIL (module not found).
- [ ] **Step 3: Implement `src/lib/upi.ts`** — `am` via `amount.toFixed(2)`; `normalizeUtr` strips whitespace and `-`, then requires `/^\d{12}$/`.
- [ ] **Step 4: Run** the test file and `tests/unit/site-config.test.ts` — expect PASS.
- [ ] **Step 5: Commit** `feat(N-13): UPI per-booking pay link and UTR helpers`

---

### Task 2: Data model — `verifying` status, UTR fields, editable amount, migration v7

**Files:**
- Modify: `src/lib/types.ts:39-53`
- Modify: `src/lib/db.ts:100-108` (BOOKINGS entity), `:525-539` (wrappers)
- Modify: `src/lib/db-schema.ts` (append v7)
- Modify: `src/lib/inbox-filters.ts:19`, `src/app/admin/_lib/api.ts:9`, `src/app/api/bookings/route.ts:10` (status lists)
- Modify: `src/lib/inbox-csv.ts:~49` (add `utr`, `payment_submitted_at` columns after payment status)
- Test: `tests/pg/migrations.test.ts`, `tests/pg/inbox.test.ts` (or a new `tests/pg/payments.test.ts`), `tests/unit/db-json.test.ts`, `tests/unit/inbox-csv.test.ts`

**Interfaces:**
- Produces:
  - `Booking.paymentStatus: "pending" | "verifying" | "paid" | "failed" | "refunded"`; `Booking.utr?: string`; `Booking.paymentSubmittedAt?: string` (ISO).
  - BOOKINGS columns `utr: c("utr", { optional: true })`, `paymentSubmittedAt: c("payment_submitted_at", { type: "timestamp", optional: true })`; `patchable: ["paymentStatus", "bookingStatus", "amount", "utr", "paymentSubmittedAt"]`.
  - `getBookingById(id: string): Promise<Booking | null>`
  - `findBookingByUtr(utr: string): Promise<Booking | null>` (Postgres: `WHERE utr = $1 LIMIT 1`; JSON: scan).
  - `updateBooking(id, u: Partial<Pick<Booking, "paymentStatus"|"bookingStatus"|"amount"|"utr"|"paymentSubmittedAt">>)`
- Migration v7 `booking_payments` (one transaction):
  - `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS utr TEXT`
  - `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_submitted_at TIMESTAMPTZ`
  - `ALTER TABLE bookings DROP CONSTRAINT bookings_payment_status_valid`
  - `ALTER TABLE bookings ADD CONSTRAINT bookings_payment_status_valid CHECK (payment_status IN ('pending','verifying','paid','failed','refunded'))`
  - `CREATE UNIQUE INDEX bookings_utr_unique ON bookings (utr) WHERE utr IS NOT NULL`

- [ ] **Step 1: Write failing tests**
  - pg: `"v7 allows verifying and round-trips utr"` — after `initDB`, `addBooking` → `updateBooking(id, { paymentStatus: "verifying", utr: "412356789012", paymentSubmittedAt: iso })`; `getBookingById` returns those values; `findBookingByUtr("412356789012")?.id === id`.
  - pg (old schema fixture → latest): an old booking row reads back with `utr === undefined` and `paymentSubmittedAt === undefined`.
  - pg: inserting a second booking with the same `utr` rejects.
  - json (`db-json.test.ts`): same round-trip and `findBookingByUtr` on the temp JSON DB.
  - csv: header contains `utr` and `payment_submitted_at`; a verifying row exports its UTR.
- [ ] **Step 2: Run** `npx vitest run tests/pg tests/unit/db-json.test.ts tests/unit/inbox-csv.test.ts` — expect FAIL.
- [ ] **Step 3: Implement** the type, entity, wrappers, v7 and status lists (`tsc` flags every `satisfies Record<Booking["paymentStatus"], …>` that needs `verifying`). In `src/components/TrackBookingForm.tsx` add `verifying: "warn"` to `PAYMENT_TONE` and the i18n keys `track.paymentStatus.verifying` = "Verifying payment" and `track.paymentStatusHelp.verifying` = "We have your transaction ID and are checking the payment. This usually takes a few hours."; change `track.paymentStatusHelp.pending` to "Once we confirm your booking, you can pay here by UPI."
- [ ] **Step 4: Run** the tests, `npx tsc --noEmit`, and `UPDATE_HINDI_DOC=1 npx vitest run tests/unit/i18n.test.ts` — expect PASS.
- [ ] **Step 5: Commit** `feat(N-13): verifying payment status, UTR fields, migration v7`

---

### Task 3: Public `POST /api/payment-claim`

**Files:**
- Create: `src/lib/booking-lookup.ts` (extracted from `src/app/api/booking-status/route.ts:26-36`)
- Modify: `src/app/api/booking-status/route.ts` (use the shared lookup; behaviour unchanged)
- Create: `src/app/api/payment-claim/route.ts`
- Test: `tests/routes/payment-claim.test.ts` (existing booking-status tests in `tests/routes/public-features.test.ts` must still pass)

**Interfaces:**
- Consumes: `normalizeUtr` (Task 1); `getBookingById`, `findBookingByUtr`, `updateBooking` (Task 2).
- Produces:
  - `findBookingByReferenceAndPhone(body: Body): Promise<Booking>` — parses/validates `reference` and `phone` (same 400s as today), throws the same `notFound(NOT_FOUND)` message.
  - `POST /api/payment-claim` body `{ reference, phone, utr, website }` → `200 { success: true, paymentStatus: "verifying" }`. Rate limit key `payment-claim:<ip>`, 10 per 15 min (429 "Too many attempts. Please try again in 15 minutes."). Honeypot (`isHoneypotTripped`) → `200 { success: true }`, nothing saved. Bad UTR → 400 `"utr must be the 12-digit UPI transaction ID"`. Booking not `confirmed`+`pending` → 409 `"This booking is not awaiting payment."`. UTR used by another booking → 409 `"This transaction ID has already been submitted."`. Saves `{ paymentStatus: "verifying", utr, paymentSubmittedAt: new Date().toISOString() }` and returns. (The owner email for this route is added in Task 4.)

- [ ] **Step 1: Write failing route tests** (pattern: `tests/routes/book.test.ts`, temp DB): success (status 200, stored `utr` `"412356789012"` from input `"4123 5678 9012"`, `paymentStatus` `verifying`, `paymentSubmittedAt` set); pending booking → 409; paid booking → 409; wrong phone → 404 with the booking-status message; `"12345"` → 400; duplicate UTR on a second confirmed booking → 409; honeypot → 200 and booking unchanged; 11th request from one IP → 429.
- [ ] **Step 2: Run** `npx vitest run tests/routes/payment-claim.test.ts` — expect FAIL.
- [ ] **Step 3: Implement** `booking-lookup.ts`, refactor `booking-status`, add the route.
- [ ] **Step 4: Run** `npx vitest run tests/routes` — expect PASS.
- [ ] **Step 5: Commit** `feat(N-13): POST /api/payment-claim for UTR submission`

---

### Task 4: Emails and admin PATCH (amount, confirm/paid triggers)

**Files:**
- Modify: `src/lib/notify.ts` (`NotifyEvent`, `buildOwnerEmail` → `EmailContent | null`, `buildCustomerEmail`, `recordId`/`customerAddress`, `notifySubmission` skips a null owner mail)
- Modify: `src/lib/i18n/en.ts` (`email.paymentClaim.*`, `email.bookingConfirmed.*`, `email.paymentReceived.*`, `email.labels.utr`)
- Modify: `src/app/api/bookings/route.ts` (PATCH)
- Modify: `src/app/api/payment-claim/route.ts` (after saving: `notifyAfterResponse({ type: "payment-claim", booking: updated })`)
- Test: `tests/unit/notify.test.ts`, `tests/routes/notify-routes.test.ts`, `tests/routes/inbox.test.ts` (PATCH cases)

**Interfaces:**
- Produces `NotifyEvent` additions:
  - `{ type: "payment-claim"; booking: Booking }` — owner only. Subject `"Payment submitted: {ref} – UTR {utr}"`; rows: reference, package, amount, UTR, name, phone, submitted. Customer mail: none.
  - `{ type: "booking-confirmed"; booking: Booking }` — customer only (needs `email`). Subject `"Booking {ref} confirmed – please complete your payment"`; rows: reference, package, travel date, travelers, amount due; `extraHtml`/`extraText` = the `trackUrl(ref)` link with copy "Pay by UPI here (you'll need your phone number):". No name, no free text.
  - `{ type: "payment-received"; booking: Booking }` — customer only. Subject `"Payment received for booking {ref}"`; rows: reference, package, amount paid.
  - Idempotency keys stay `${type}-${id}-owner|customer`.
- PATCH `/api/bookings`: also accepts `amount` via `int(1, 10_000_000)` (wrong type/decimal → 400). Reads the booking first (`getBookingById`, 404 if missing). After a successful update: if `bookingStatus` became `confirmed` (was not) and `paymentStatus` is `pending` → `notifyAfterResponse({ type: "booking-confirmed", booking: updated })`; if `paymentStatus` became `paid` (was not) → `"payment-received"`. Setting `paymentStatus` back to `pending` clears `utr` and `paymentSubmittedAt` (owner rejected a wrong UTR; customer resubmits). Audit `fields` include `amount` when sent.

- [ ] **Step 1: Write failing tests**
  - notify unit: owner `payment-claim` html/text contains the UTR and amount; `buildOwnerEmail` for `booking-confirmed`/`payment-received` is `null`; customer `booking-confirmed` contains `/track?ref=<REF>` and the amount and **not** the customer's name; `buildCustomerEmail` for `payment-claim` is `null`.
  - routes: PATCH `{ amount: 9000 }` → 200, stored; `{ amount: 9000.5 }` → 400; `pending→confirmed` calls the mocked `notifyAfterResponse` once with `type: "booking-confirmed"`; re-sending `confirmed` does not; `verifying→paid` sends `payment-received`; `verifying→pending` clears `utr`; a successful `/api/payment-claim` calls the mocked `notifyAfterResponse` once with `type: "payment-claim"`.
- [ ] **Step 2: Run** the three test files — expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm test` and `UPDATE_HINDI_DOC=1 npx vitest run tests/unit/i18n.test.ts` — expect PASS.
- [ ] **Step 5: Commit** `feat(N-13): payment emails and editable booking amount`

---

### Task 5: Public UI — pay panel on /track, booking success copy

**Files:**
- Modify: `package.json` (`npm install qrcode@1.5.4 && npm install -D @types/qrcode@1.5.5`)
- Modify: `src/components/UpiPayCard.tsx` (optional `amount` + `reference` props)
- Create: `src/components/PaymentPanel.tsx`
- Modify: `src/components/TrackBookingForm.tsx` (render `PaymentPanel` in the result)
- Modify: `src/components/BookingForm.tsx:258-263` (remove the `UpiPayCard` under the success message)
- Modify: `src/lib/i18n/en.ts` (`upi.amountLabel`, `upi.payAmount`, `pay.*`, `booking.payAfterConfirm`)
- Test: `tests/e2e/public-forms.spec.ts`

**Interfaces:**
- Consumes: `upiPayLink`, `normalizeUtr` (Task 1); `POST /api/payment-claim` (Task 3).
- Produces:
  - `UpiPayCard({ compact?, amount?, reference? })` — with both `amount` and `reference`: renders a QR generated client-side (`QRCode.toString(upiPayLink({amount, reference}), { type: "svg", margin: 2, errorCorrectionLevel: "M" })` in `useEffect`, shown as `<img src="data:image/svg+xml;utf8,…">` (CSP `img-src data:` already allowed) with a same-size placeholder before it is ready), an "Amount: ₹{amount}" line, and the "Open UPI app" button using the per-booking link; the static image, copy button and note otherwise unchanged. Without them: rendering is byte-for-byte as today.
  - `PaymentPanel({ reference, phone, amount, onSubmitted(): void })` — shows `UpiPayCard` (compact, with amount/reference) and a UTR form (label "UPI transaction ID (UTR)", hint "12 digits, shown in your UPI app after paying"); validates with `normalizeUtr` before POST; maps 409 → `pay.notPayable` / `pay.utrUsed` (by message), 429 → `pay.errorTooMany`, other → `pay.errorGeneric`; on 200 calls `onSubmitted`.
  - `TrackBookingForm` shows `PaymentPanel` only when `bookingStatus === "confirmed" && paymentStatus === "pending"`; keeps the phone used for the lookup in state; `onSubmitted` sets `result.paymentStatus = "verifying"` (panel disappears, verifying help text shows).
  - Booking success message gains `booking.payAfterConfirm` = "We'll call you to confirm. Once confirmed, you can pay by UPI from the Track page." — so nobody pays an unconfirmed amount. **Client-visible change** (the compact QR under the success message goes away): note it in PROJECT_AUDIT.

- [ ] **Step 1: Write failing e2e tests** (`public-forms.spec.ts`; create the booking via `/api/book`, confirm it via the admin API with the e2e admin credentials as other specs do): (a) pending booking on `/track` → no "Pay via UPI" heading; (b) confirmed booking → QR image (`alt` contains the UPI ID), "₹" amount, submit "4123 5678 9012" → "Verifying payment" status shown; (c) submit "123" → inline error, no request; (d) booking form success shows no QR and contains the pay-after-confirm text.
- [ ] **Step 2: Run** `npm run test:e2e -- public-forms` — expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run test:e2e` — expect PASS. Manually scan a QR from `/track` on a phone with ₹1 test data if the owner agrees.
- [ ] **Step 5: Commit** `feat(N-13): pay by UPI QR and submit UTR on /track`

---

### Task 6: Admin UI, docs

**Files:**
- Modify: `src/app/admin/_components/BookingsTab.tsx`
- Modify: `PROJECT_AUDIT.md` (new row **N-13**, progress table, changelog; G-09 stays ⏸ for a gateway), `CLAUDE.md` (payment flow paragraph under "Public, unauthenticated write endpoints" and the `Booking` notes), `CLIENT_QUESTIONS.md` (per-person pricing Q-1 now affects the QR amount; booking-success QR removed)
- Test: `tests/e2e/admin.spec.ts` (or `admin-lists.spec.ts`)

**Interfaces:**
- Consumes: PATCH `amount`, `"verifying"` status (Tasks 2, 4).
- Produces (BookingsTab):
  - Payment select and filter gain `<option value="verifying">Verifying</option>` (after Pending).
  - Payment cell shows `UTR {utr}` and `istDateTime(paymentSubmittedAt)` as `adm-sub` lines when set.
  - Amount cell: "Edit" button → `window.prompt("New amount (₹)", String(amount))`; integer ≥ 1 → PATCH `{ id, amount }`; otherwise alert and no request. Disabled when `paymentStatus` is `paid`.
  - Actions: "Copy pay link" button (enabled when `bookingStatus === "confirmed"`) copying `${location.origin}/track?ref=${bookingReference(id)}` (for WhatsApp), with "Copied!" feedback.

- [ ] **Step 1: Write failing e2e test**: a booking with UTR shows "UTR 412356789012" in its row; choosing "Verifying" in the filter lists it; Edit amount → 9000 → row shows ₹9,000; "Copy pay link" enabled only after setting status Confirmed.
- [ ] **Step 2: Run** `npm run test:e2e -- admin` — expect FAIL.
- [ ] **Step 3: Implement** the tab changes and the three doc updates.
- [ ] **Step 4: Run** the full check: `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run test:e2e` — expect all PASS. `git status` shows `data/db.json` unchanged.
- [ ] **Step 5: Commit** `feat(N-13): admin payment verification, docs`

**Release note (for PR #8 / deploy):** run `/api/seed` right after deploying so migration v7 applies; until then Postgres rejects `verifying` and `/api/payment-claim` returns 500.
