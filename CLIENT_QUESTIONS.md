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
| Q-3 | Contact form errors currently use the same green box as success. OK to show errors in red? |
| F-11 | **Resolved — stock photo applied.** The old "Sacred Odisha Pilgrimage" photo no longer existed online; the package now shows a free stock photo of the Konark Sun Temple. If you have your own photo, send it (or set it in Admin → Packages → Edit → Image URL). |
| Q-5 | **Resolved — sample offers removed.** When you have real offers (title, discount, code, start and end date), add them in Admin → Offers; the Offers section on the home page appears automatically while an offer is valid. |
| G-06 | Package filter/search and gallery category tabs: review the new UI |
| G-08 | Full Hindi translation: please send the Hindi text for every section (the site has a translation file ready for it) |
| G-03 / G-07 | Package and blog detail pages: review the new pages |
| N-4…N-9 | **Built, please review:** booking status page (`/track`, reference + phone), customer reviews (`/reviews/new`, shown only after you approve them in the admin), "Plan my trip" / callback form (`/plan-trip`), wishlist (`/wishlist`) and package comparison (`/compare`) with a heart and a "Compare" button on each package card, new footer links, and the hero video now plays automatically only on larger screens with a good connection (otherwise a "Play video" button) |
| N-11 | **Built, please review:** the admin panel and login page have a new look (sidebar menu, "Needs attention" cards on the dashboard, light and dark mode, phone-friendly tables). Nothing about your data changed. Are you happy with the new look? |
| C-10 | **Built, please review:** clicking a package (photo, name or "View Details") now opens its full page instead of a pop-up, and **"Book Now" opens the online booking form** on that page (it used to open WhatsApp; WhatsApp is still on the page and in the corner button). Travel dates in the past can no longer be chosen. The Varanasi package photo (it showed a van on a beach) is now a photo of the Varanasi ghats. |
