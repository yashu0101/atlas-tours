# Questions for the client

Open decisions that block or affect work on the Atlas Tours site. IDs match `PROJECT_AUDIT.md`.
Items marked **(provisional)** have been built with a placeholder answer that is a one-line change once the client confirms.

Last updated: 2026-11-19

## Client to-do before launch (emails and admin accounts)

The email notifications (G-02 / N-10) and multiple admin logins (N-8) are built. To switch them on, the client needs to:

- [ ] Create a **Resend** account and verify the sending domain.
- [ ] Give us the values for `RESEND_API_KEY`, `NOTIFY_FROM` (the sender, e.g. `Atlas Tours <bookings@your-domain>`) and `NOTIFY_EMAIL` (the owner address or addresses that receive the alerts).
- [ ] Approve the email wording (the owner alert and the customer confirmation emails).
- [ ] Confirm that **"all admins have full access"** is OK, or tell us what staff should be limited to.

## Contact details

| # | Question | Current provisional choice |
|---|---|---|
| C-09 | Which email is correct for the website: **info@atlastours.in** or **atlastourandtravels01@gmail.com**? | ✅ **Answered (2026-11-28):** `atlastourandtravels01@gmail.com` everywhere, from `SITE_CONFIG` in `src/lib/config.ts` — atlastours.in is not the client's domain and atlastravelvns.com has no mailbox yet |
| C-09 | Is **+91 6388360881** the right phone *and* WhatsApp number? | Kept as is |
| Q-9 | What are your real **Facebook, Instagram, YouTube and X (Twitter)** pages? The footer icons currently link to `…/atlastours`, which were guessed and may belong to someone else. Send the links, or tell us which to remove. | **(provisional)** guessed links kept; change or remove them in `SOCIAL_LINKS` in `src/lib/config.ts` |
| Q-11 | **Srinagar–Sonamarg–Gulmarg brochure:** the 3★ Budget rate for **12 pax is ₹13,900**, higher than for 10 pax (₹12,700) — every other category gets cheaper with more people. Is ₹13,900 a typo (₹12,400?)? Should **extra bed and child-without-bed** be bookable online, or quoted on the call? | **(provisional)** copied as printed; extra bed / child rates are shown on the package page but not added to the online estimate. Editable in Admin → Packages → Pricing options |
| Q-10 | **Package brochures:** the **Odisha** brochure has no price or "package includes" — what is the price per person, and what is included (hotel, meals, Chilika boat ride, entry tickets)? For **both** tours, what is **not included** (we listed lunch/dinner, personal expenses, travel to the start city for Odisha, the optional Udaipur boat ride)? Is the Rajasthan price for 3★ or 4★, and is the desert-camp dinner included? | **(provisional)** Odisha keeps the old ₹11,999 placeholder and the Rajasthan brochure's standard inclusions; exclusions written from what the brochures leave out. All editable in Admin → Packages |
| Q-7 | Correct numbers for the stats on the home page: happy travellers, destinations, years of experience, trips completed | **(provisional)** The top banner and the counter section now show the same numbers: 500+ travellers, **10+ destinations** (they used to say 10+ and 50+), 10+ years, 1000+ trips. The "Tour Packages" number now counts the packages actually on the site (3 today) instead of "15+" |
| Q-2 | ~~Production domain (used for canonical links, sharing previews, sitemap)~~ | ✅ **Answered:** https://atlastravelvns.com (live 2026-11-27) |

## Pricing and booking

| # | Question | Current provisional choice |
|---|---|---|
| Q-1 / G-01 | Are package prices **per person** or **per package**? | **(provisional)** per person: booking total = price × travelers |
| G-01 | After a booking request is sent, what should happen next (call back, WhatsApp, payment link)? | Shows a "request received" message; the owner sees it in the admin |
| N-13 | **UPI payment flow (built, please confirm).** After you confirm a booking, the customer gets an email with a link to `/track`, where a QR code for that booking (exact amount, UPI ID `d2095760-1@okicici`) is shown; they pay and enter the 12-digit transaction ID (UTR); you check your bank/UPI app and mark the booking Paid in the admin. Is this flow OK? Also: **the UPI QR is no longer shown under the booking-request message** (it only appears after you confirm) — is that OK? Note: Q-1 (per person or per package) now decides the amount on the QR; you can correct a booking amount in the admin before confirming. | **(provisional)** as described; per-person pricing |

## Features that need third-party accounts (not built yet)

| # | Feature | What we need from the client |
|---|---|---|
| G-04 | Upload images from the admin instead of pasting URLs | Choose a storage provider (**Vercel Blob** if hosted on Vercel, or **Cloudinary**) and create the account |
| G-09 | Online payments | A **Razorpay** account (KYC done), API keys, and a decision: full payment or advance/deposit? Refund policy text |
| N-2 | Website analytics (visits, form conversions) | Choose **Vercel Analytics** (if hosted on Vercel) or **Plausible** (paid, privacy-friendly) or Google Analytics (needs a cookie notice); create the account |

## Built on provisional answers — please confirm

| # | Feature | What was built | What we need from the client |
|---|---|---|---|
| G-02 / N-10 | Email to the owner on every booking, enquiry, trip/callback request and review; confirmation email to the customer from every form that has an email | Email via **Resend**. Switched off until the keys are set | Create a Resend account, verify the sending domain, and give us the sender address (`NOTIFY_FROM`) and the owner address(es) (`NOTIFY_EMAIL`). Approve the email wording. WhatsApp is not built. |
| N-8 | Several admin logins, sign out of all devices, audit trail | Any number of admin accounts, **all with the same full access** (no staff role), plus a log of who changed what | Is "everyone has full access" OK, or should staff be limited (e.g. bookings only, no deletes)? |

## New features that need a decision (not built yet)

| # | Feature | What we need from the client |
|---|---|---|
| N-3 | Departure dates and seats per package; the booking date picker only offers real departures | Do tours run on fixed departure dates or any day? Is there a seat/group-size limit per departure? |

## Design and content approval

| # | Question |
|---|---|
| E-10 | **Already applied (please sign off):** for readability/accessibility, grey and orange text is slightly darker, and **text on the orange buttons is now dark navy instead of white** (white on orange was too faint to pass accessibility standards). Keep this, or prefer a darker orange button with white text? |
| Q-3 | **Already applied (please sign off):** if the contact form fails to send, the message is now shown in a **red** box (it used to be the same green box as a successful send), matching the booking, tracking and trip-plan forms. |
| F-11 | **Resolved — stock photo applied.** The old "Sacred Odisha Pilgrimage" photo no longer existed online; the package now shows a free stock photo of the Konark Sun Temple. If you have your own photo, send it (or set it in Admin → Packages → Edit → Image URL). |
| Q-5 | **Resolved — sample offers removed.** When you have real offers (title, discount, code, start and end date), add them in Admin → Offers; the Offers section on the home page appears automatically while an offer is valid. |
| G-06 | Package filter/search and gallery category tabs: review the new UI |
| G-08 | Full Hindi translation: please send the Hindi text for every section (the site has a translation file ready for it) |
| G-03 / G-07 | Package and blog detail pages: review the new pages |
| N-4…N-9 | **Built, please review:** booking status page (`/track`, reference + phone), customer reviews (`/reviews/new`, shown only after you approve them in the admin), "Plan my trip" / callback form (`/plan-trip`), wishlist (`/wishlist`) and package comparison (`/compare`) with a heart and a "Compare" button on each package card, new footer links, and the hero video now plays automatically only on larger screens with a good connection (otherwise a "Play video" button) |
| N-12 | **Built, please review:** new **Our Team** section (after the reviews) with the photos you sent: Founder, General Manager of Hotel Ganga Imperial, and the front-desk team. Please send **the names** (and, if you like, a one-line description) for each person; until then the cards show only the role. Also new: a **Pay via UPI** box (QR code, UPI ID `d2095760-1@okicici`, payee "Dilip") in the Contact section and after a booking request, asking customers to pay only after you confirm. Please confirm this Hotel Ganga Imperial UPI account is the one customers of Atlas Tours should pay. |
| N-11 | **Built, please review:** the admin panel and login page have a new look (sidebar menu, "Needs attention" cards on the dashboard, light and dark mode, phone-friendly tables). Nothing about your data changed. Are you happy with the new look? |
| C-10 | **Built, please review:** clicking a package (photo, name or "View Details") now opens its full page instead of a pop-up, and **"Book Now" opens the online booking form** on that page (it used to open WhatsApp; WhatsApp is still on the page and in the corner button). Travel dates in the past can no longer be chosen. The Varanasi package photo (it showed a van on a beach) is now a photo of the Varanasi ghats. |
