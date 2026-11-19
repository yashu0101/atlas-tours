import { SiteConfig, TourPackage } from "./types";

export const SITE_CONFIG: SiteConfig = {
  name: "Atlas Tour & Travels",
  phone: "+916388360881",
  whatsapp: "916388360881",
  // C-09: public email pending client confirmation — change only this line.
  email: "info@atlastours.in",
  address: "Varanasi, Uttar Pradesh, India",
  tagline: "Spiritual Journey... Lifetime Memories",
};

/**
 * Phone formatted for display ("+91 6388360881"), derived from SITE_CONFIG.phone.
 * Kept out of SITE_CONFIG because that object is also the seeded DB `config` row (SiteConfig).
 */
export const PHONE_DISPLAY = SITE_CONFIG.phone.replace(/^\+91(\d+)$/, "+91 $1");

export const DEFAULT_PACKAGES: TourPackage[] = [
  {
    id: "pkg-varanasi",
    name: "Divine Varanasi & Prayagraj",
    destination: "Varanasi, Prayagraj, Ayodhya",
    duration: "4 Days / 3 Nights",
    price: 8999,
    originalPrice: 12999,
    image: "https://images.unsplash.com/photo-1561359313-0639aad49ca6?w=800&q=75",
    description: "Experience the spiritual heart of India with Ganga Aarti, Kashi Vishwanath Temple, and holy dips.",
    highlights: ["Ganga Aarti at Dashashwamedh Ghat", "Kashi Vishwanath Temple", "Sarnath Buddhist Site", "Triveni Sangam Prayagraj", "Ram Mandir Ayodhya"],
    itinerary: ["Day 1: Arrival in Varanasi, Evening Ganga Aarti", "Day 2: Kashi Vishwanath, Sarnath, Local Temples", "Day 3: Prayagraj Sangam, Hanuman Mandir", "Day 4: Ayodhya Ram Mandir, Departure"],
    inclusions: ["AC Transport", "3-Star Hotel Stay", "Breakfast & Dinner", "Guided Temple Tours", "All Entry Tickets"],
    exclusions: [],
    category: "spiritual",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pkg-rajasthan",
    // N-18: from the client's "Royal Rajasthan Tour Package" brochure (Oct 2026).
    name: "Royal Rajasthan Tour",
    destination: "Jaipur, Jodhpur, Jaisalmer, Udaipur",
    duration: "8 Days / 7 Nights",
    price: 17500,
    image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&q=75",
    description:
      "An 8-day trip from Prayagraj through Rajasthan's four royal cities — Jaipur the Pink City, Jodhpur the Blue City, Jaisalmer the Golden City and Udaipur the City of Lakes — with hill forts, palaces, a camel safari on the Sam sand dunes and a night at a desert camp.",
    highlights: [
      "Amber Fort, City Palace & Hawa Mahal, Jaipur",
      "Mehrangarh Fort & Jaswant Thada, Jodhpur",
      "Jaisalmer Fort & Patwon Ki Haveli",
      "Camel safari & sunset at Sam Sand Dunes",
      "Night at a desert camp with Rajasthani cultural programme",
      "Lake Pichola & City Palace, Udaipur",
    ],
    itinerary: [
      "Day 1: Prayagraj → Jaipur | Departure from Prayagraj for Jaipur | Arrival in Jaipur & hotel check-in | Evening at the local market | Overnight in Jaipur",
      "Day 2: Jaipur sightseeing | Amber Fort | Jal Mahal | City Palace | Jantar Mantar | Hawa Mahal | Overnight in Jaipur",
      "Day 3: Jaipur → Jodhpur | Morning departure | Arrival in Jodhpur & check-in | Mehrangarh Fort | Jaswant Thada | Clock Tower Market | Overnight in Jodhpur",
      "Day 4: Jodhpur → Jaisalmer | Morning departure | Jaisalmer Fort | Patwon Ki Haveli | Gadisar Lake | Overnight in Jaisalmer",
      "Day 5: Jaisalmer desert | Kuldhara Village | Sam Sand Dunes | Camel safari | Desert sunset | Rajasthani cultural programme & dinner | Overnight at Sam desert camp",
      "Day 6: Jaisalmer → Udaipur | Early-morning departure | Arrival in Udaipur | Lake Pichola / Gangaur Ghat | Overnight in Udaipur",
      "Day 7: Udaipur sightseeing | City Palace | Jagdish Temple | Saheliyon Ki Bari | Fateh Sagar Lake | Optional boat ride | Overnight in Udaipur",
      "Day 8: Udaipur → Prayagraj | Breakfast & check-out | Return journey to Prayagraj",
    ],
    inclusions: [
      "Hotel stay (3★ / 4★)",
      "Daily breakfast",
      "AC vehicle for sightseeing & transfers",
      "All sightseeing & entry tickets (as per itinerary)",
      "Desert camp stay with cultural programme & dinner",
      "24×7 tour manager support",
    ],
    // Not printed on the brochure — follows from what it does include; confirm with the client (Q-10).
    exclusions: [
      "Lunch, and dinners other than at the desert camp",
      "Optional boat ride in Udaipur",
      "Personal expenses (shopping, tips, laundry, phone calls)",
      "Anything not listed under What's included",
    ],
    startsFrom: "Prayagraj",
    minTravelers: 4,
    priceNote: "Based on double sharing",
    category: "heritage",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pkg-odisha",
    // N-18: from the client's "Odisha Tour Package" brochure (Oct 2026). The brochure has no
    // price or inclusions: the price is the old placeholder and the inclusions/exclusions
    // follow the Rajasthan brochure's standard — confirm with the client (Q-10).
    name: "Odisha Temples & Beaches Tour",
    destination: "Bhubaneswar, Puri, Chilika Lake, Konark",
    duration: "6 Days / 5 Nights",
    price: 11999,
    image: "https://images.unsplash.com/photo-1576235282476-debff2a4d0b9?w=800&q=75",
    description:
      "Discover the soul of Odisha in six days — temples, beaches, culture and nature: the ancient temples of Bhubaneswar, Lord Jagannath's Puri, the Sun Temple at Konark, the artists' village of Raghurajpur and a boat ride on Chilika Lake to spot dolphins.",
    highlights: [
      "Jagannath Temple & Puri Beach",
      "Konark Sun Temple & Chandrabhaga Beach",
      "Lingaraj, Mukteshwar & Rajarani temples, Bhubaneswar",
      "Khandagiri & Udayagiri caves",
      "Boat ride to the dolphin-spotting area, Chilika Lake",
      "Dhauli, Pipili & Raghurajpur artists' village",
    ],
    itinerary: [
      "Day 1: Arrival in Bhubaneswar | Bhubaneswar sightseeing: Lingaraj, Mukteshwar & Rajarani temples, Khandagiri & Udayagiri caves | Overnight in Bhubaneswar",
      "Day 2: Bhubaneswar → Puri | Via Dhauli, Pipili & Raghurajpur | Jagannath Temple & Puri Beach | Overnight in Puri",
      "Day 3: Chilika Lake / Satpada | Boat ride to the dolphin-spotting area | Return to Puri | Overnight in Puri",
      "Day 4: Konark Sun Temple | Chandrabhaga Beach | Ramachandi | Return to Puri | Overnight in Puri",
      "Day 5: Puri local sightseeing | Temples & local attractions | Evening transfer to Bhubaneswar | Overnight in Bhubaneswar",
      "Day 6: Departure | Shopping / local sightseeing in Bhubaneswar | Drop at the airport / railway station",
    ],
    inclusions: [
      "Hotel stay — 5 nights (Bhubaneswar 2, Puri 3)",
      "Daily breakfast",
      "AC vehicle for sightseeing & transfers",
      "Sightseeing as per itinerary",
      "Drop at Bhubaneswar airport / railway station",
    ],
    exclusions: [
      "Train / flight tickets to and from Bhubaneswar",
      "Lunch & dinner",
      "Boat ride & entry tickets, unless confirmed with your booking",
      "Personal expenses (shopping, tips, laundry, phone calls)",
    ],
    startsFrom: "Bhubaneswar",
    category: "spiritual",
    createdAt: new Date().toISOString(),
  },
];

export const NAV_ITEMS = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Packages", href: "#packages" },
  { label: "Gallery", href: "#gallery" },
  { label: "Blog", href: "#blog" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

/**
 * UPI payment details shown in the Contact section and after a booking request
 * (QR supplied by the client: Hotel Ganga Imperial, payee "Dilip"). Change only here.
 */
/**
 * Q-7: the marketing numbers shown in the Hero stats and the Counter section — one source so the
 * two can never disagree. (provisional) Awaiting the real figures from the client. The package
 * count is not here: the Hero shows the live number of visible packages.
 */
export const SITE_STATS = {
  happyTravellers: 500,
  destinations: 10,
  yearsExperience: 10,
  tripsCompleted: 1000,
} as const;

/**
 * Footer social links. (provisional) These handles were guessed when the site was built and
 * have not been confirmed by the client (see CLIENT_QUESTIONS.md). Remove an entry to hide
 * its icon; change only here.
 */
export const SOCIAL_LINKS: readonly { name: "Facebook" | "Instagram" | "YouTube" | "X"; href: string }[] = [
  { name: "Facebook", href: "https://facebook.com/atlastours" },
  { name: "Instagram", href: "https://instagram.com/atlastours" },
  { name: "YouTube", href: "https://youtube.com/atlastours" },
  { name: "X", href: "https://x.com/atlastours" },
];

export const UPI_CONFIG = {
  id: "d2095760-1@okicici",
  payee: "Dilip",
  qrImage: "/images/upi-qr.jpg",
} as const;
