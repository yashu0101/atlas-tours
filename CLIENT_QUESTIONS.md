# Questions for the client

Open decisions that block or affect work on the Atlas Tours site. IDs match `PROJECT_AUDIT.md`.
Items marked **(provisional)** have been built with a placeholder answer that is a one-line change once the client confirms.

Last updated: 2026-11-18

## Contact details

| # | Question | Current provisional choice |
|---|---|---|
| C-09 | Which email is correct for the website: **info@atlastours.in** or **atlastourandtravels01@gmail.com**? | **(provisional)** `info@atlastours.in` everywhere, from `SITE_CONFIG` in `src/lib/config.ts` |
| C-09 | Is **+91 6388360881** the right phone *and* WhatsApp number? | Kept as is |
| Q-7 | Correct numbers for the hero stats (it says 500+ / 15+ packages / 10+ destinations, while the counter says 50+ and the site has 3 packages) | Unchanged |
| Q-2 | Production domain (used for canonical links, sharing previews, sitemap) | Falls back to `https://atlastours.in` |

## Pricing and booking

| # | Question | Current provisional choice |
|---|---|---|
| Q-1 / G-01 | Are package prices **per person** or **per package**? | **(provisional)** per person: booking total = price × travelers |
| G-01 | After a booking request is sent, what should happen next (call back, WhatsApp, payment link)? | Shows a "request received" message; the owner sees it in the admin |

## Features that need third-party accounts (not built yet)

| # | Feature | What we need from the client |
|---|---|---|
| G-02 | Notify the owner on every new enquiry/booking | Choose **email** (e.g. Resend/SMTP: sender address, recipient address) and/or **WhatsApp** (WhatsApp Business API account) |
| G-04 | Upload images from the admin instead of pasting URLs | Choose a storage provider (**Vercel Blob** if hosted on Vercel, or **Cloudinary**) and create the account |
| G-09 | Online payments | A **Razorpay** account (KYC done), API keys, and a decision: full payment or advance/deposit? Refund policy text |

## Design and content approval

| # | Question |
|---|---|
| E-10 | **Already applied (please sign off):** for readability/accessibility, grey and orange text is slightly darker, and **text on the orange buttons is now dark navy instead of white** (white on orange was too faint to pass accessibility standards). Keep this, or prefer a darker orange button with white text? |
| Q-3 | Contact form errors currently use the same green box as success. OK to show errors in red? |
| Q-5 | **Resolved — sample offers removed.** When you have real offers (title, discount, code, start and end date), add them in Admin → Offers; the Offers section on the home page appears automatically while an offer is valid. |
| G-06 | Package filter/search and gallery category tabs: review the new UI |
| G-08 | Full Hindi translation: please send the Hindi text for every section (the site has a translation file ready for it) |
| G-03 / G-07 | Package and blog detail pages: review the new pages |
