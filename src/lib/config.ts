import { SiteConfig, TourPackage } from "./types";

export const SITE_CONFIG: SiteConfig = {
  name: "Atlas Tour & Travels",
  phone: "+916388360881",
  whatsapp: "916388360881",
  // C-09: public email pending client confirmation — change only this line.
  email: "info@atlastours.in",
  address: "Hotel Ganga Imperial, Tilamapur, Varanasi, Rustampur, Uttar Pradesh 221112",
  tagline: "Spiritual Journeys, Lifetime Memories",
  established: 1983,
};

/** Travel-agency contact person (Managing Director); phone is SITE_CONFIG.phone. Change only here. */
export const MD_NAME = "Mrs. Bushra Ashfaque";

/** Direct numbers shown under people in Our Team (src/lib/team.ts). E.164 format. Change only here. */
export const TEAM_PHONES = {
  founder: "+919616074995",
  generalManager: "+917268895995",
  /** The MD is the agency's main contact, so her number is the site phone. */
  managingDirector: SITE_CONFIG.phone,
} as const;

/** "+919616074995" → "+91 96160 74995" (Indian 10-digit mobile, 5 + 5 grouping). */
export function formatTeamPhone(phone: string): string {
  return phone.replace(/^\+91(\d{5})(\d{5})$/, "+91 $1 $2");
}

/** Partner hotel. Every "Hotel Ganga Imperial" mention on the site links here. Change only here. */
export const HOTEL_PARTNER = {
  name: "Hotel Ganga Imperial",
  url: "https://hotel-ganga-imperial.vercel.app/",
} as const;

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
  // --- Char Dham ---
  {
    id: "pkg-chardham",
    name: "Char Dham Yatra",
    destination: "Yamunotri, Gangotri, Kedarnath, Badrinath",
    duration: "11 Days / 10 Nights",
    price: 22999,
    originalPrice: 29999,
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=75",
    description: "The sacred Char Dham Yatra covers all four holy abodes in Uttarakhand — Yamunotri, Gangotri, Kedarnath, and Badrinath. A life-changing pilgrimage through the Himalayas. Every package is customised to your group.",
    highlights: ["Yamunotri Temple", "Gangotri Temple", "Kedarnath Temple (16-18 km trek)", "Badrinath Temple & Mana Village", "Rishikesh Visit", "Himalayan Scenic Drives", "Kashi Vishwanath Temple Uttarkashi", "Gaurikund Trek Start Point"],
    itinerary: [
      "Day 1: Dehradun to Barkot — Pickup from Dehradun, drive via Mussoorie (subject to road conditions). Check-in and dinner. Overnight Barkot",
      "Day 2: Yamunotri Darshan — Drive to Janki Chatti, trek ~5-6 km one way to Yamunotri Temple, return to Barkot. Overnight Barkot",
      "Day 3: Barkot to Uttarkashi — Scenic drive through mountain region. Visit Kashi Vishwanath Temple if time permits. Overnight Uttarkashi",
      "Day 4: Gangotri Darshan — Excursion to Gangotri Temple and return to Uttarkashi. Overnight Uttarkashi",
      "Day 5: Uttarkashi to Guptkashi — Long mountain drive via Tehri and Rudraprayag. Rest after arrival. Overnight Guptkashi",
      "Day 6: Kedarnath Yatra — Transfer to Gaurikund, trek ~16-18 km to Kedarnath. Overnight near temple (subject to availability). Overnight Kedarnath",
      "Day 7: Kedarnath to Guptkashi — Morning darshan if possible, descend to Gaurikund, transfer back. Overnight Guptkashi",
      "Day 8: Guptkashi to Badrinath — Drive via Joshimath, reach Badrinath for darshan. Overnight Badrinath",
      "Day 9: Badrinath & Return — Morning darshan, Mana Village visit if accessible, drive towards Rudraprayag. Overnight Rudraprayag",
      "Day 10: Rudraprayag to Rishikesh — Drive towards Rishikesh, short visit if time allows. Overnight Rishikesh",
      "Day 11: Rishikesh to Dehradun — Breakfast and transfer to Dehradun airport/railway station/hotel. Departure",
    ],
    inclusions: ["AC/Non-AC Vehicle", "Hotel Stay (3-Star)", "Daily Breakfast & Dinner", "All Sightseeing & Transfers", "Driver Charges, Toll & Parking", "GST Included"],
    exclusions: [],
    category: "pilgrimage",
    createdAt: new Date().toISOString(),
  },
  // --- Do Dham ---
  {
    id: "pkg-dodham",
    name: "Do Dham Yatra",
    destination: "Kedarnath, Badrinath",
    duration: "7 Days / 6 Nights",
    price: 15999,
    originalPrice: 19999,
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=75",
    description: "Visit the two most revered Dhams — Kedarnath and Badrinath — in one pilgrimage through the Garhwal Himalayas. Customised packages for all group sizes.",
    highlights: ["Kedarnath Temple", "Badrinath Temple", "Mana Village", "Rishikesh", "Joshimath", "Gaurikund Trek", "Himalayan Views"],
    itinerary: [
      "Day 1: Dehradun/Haridwar to Guptkashi — Arrival and scenic drive. Overnight Guptkashi",
      "Day 2: Kedarnath Yatra — Trek from Gaurikund to Kedarnath (~16-18 km). Overnight Kedarnath",
      "Day 3: Kedarnath to Guptkashi — Morning darshan, descend and return. Overnight Guptkashi",
      "Day 4: Guptkashi to Badrinath — Drive via Joshimath. Evening darshan. Overnight Badrinath",
      "Day 5: Badrinath Darshan — Morning darshan, Mana Village. Drive to Rudraprayag. Overnight Rudraprayag",
      "Day 6: Rudraprayag to Rishikesh — Visit Rishikesh attractions. Overnight Rishikesh",
      "Day 7: Departure — Transfer to Dehradun/Haridwar for departure",
    ],
    inclusions: ["AC/Non-AC Vehicle", "Hotel Stay", "Daily Breakfast & Dinner", "All Transfers", "Driver Charges, Toll & Parking"],
    exclusions: [],
    category: "pilgrimage",
    createdAt: new Date().toISOString(),
  },
  // --- Kailash Mansarovar ---
  {
    id: "pkg-kailash",
    name: "Kailash Mansarovar Yatra",
    destination: "Kailash Mansarovar, Tibet (via Lucknow/Kathmandu)",
    duration: "14-16 Days",
    price: 185000,
    originalPrice: 225000,
    image: "https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=600&q=75",
    description: "The ultimate spiritual pilgrimage to Mount Kailash and the sacred Mansarovar Lake in Tibet. A once-in-a-lifetime yatra that tests your endurance and deepens your faith. Fully customised packages with all permits and logistics handled.",
    highlights: ["Mount Kailash Parikrama", "Mansarovar Lake Holy Dip", "Gauri Kund", "Kathmandu Pashupatinath", "Tibet Border Crossing", "High Altitude Acclimatization", "Medical Support Throughout"],
    itinerary: [
      "Day 1-2: Arrival Kathmandu — Acclimatization, Pashupatinath & Bouddhanath visit",
      "Day 3: Kathmandu to Kerung — Cross Nepal-Tibet border. Overnight Kerung",
      "Day 4-5: Kerung to Mansarovar — Drive through Tibetan plateau. Holy dip at Mansarovar Lake",
      "Day 6-7: Mansarovar to Darchen — Transfer to base of Mount Kailash",
      "Day 8-10: Kailash Parikrama — 3-day trek around Mount Kailash (52 km)",
      "Day 11-12: Return to Kerung — Drive back via Saga",
      "Day 13-14: Kerung to Kathmandu — Border crossing and return. Departure",
    ],
    inclusions: ["All Permits & Visa", "Hotels & Guest Houses", "All Meals", "Experienced Guide & Sherpa", "Medical Kit & Oxygen", "All Transfers", "Tibet Border Fees"],
    exclusions: [],
    category: "pilgrimage",
    createdAt: new Date().toISOString(),
  },
  // --- Jain Pilgrimage ---
  {
    id: "pkg-jain-pilgrimage",
    name: "Jain Pilgrimage Tour",
    destination: "Palitana, Ranakpur, Dilwara, Shravanabelagola, Parasnath",
    duration: "8 Days / 7 Nights",
    price: 19999,
    originalPrice: 25999,
    image: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=600&q=75",
    description: "A pilgrimage to India's most revered Jain Tirthas — from the magnificent Shatrunjaya Hill in Palitana to the exquisite Ranakpur and Dilwara temples. Customised for Jain families and groups with pure Jain meals.",
    highlights: ["Palitana Shatrunjaya Hill", "Ranakpur Jain Temple", "Dilwara Temples Mount Abu", "Shravanabelagola Gommateshwara", "Parasnath Hill Jharkhand", "Girnar Hill", "Jain Meal Arrangements"],
    itinerary: [
      "Day 1: Arrival Ahmedabad — Transfer to Palitana. Overnight Palitana",
      "Day 2: Palitana — Shatrunjaya Hill climb (3,500+ steps), temple darshan. Overnight Palitana",
      "Day 3: Palitana to Ranakpur — Visit Ranakpur Jain Temple (1,444 pillars). Overnight Ranakpur",
      "Day 4: Ranakpur to Mount Abu — Dilwara Temple darshan. Overnight Mount Abu",
      "Day 5: Mount Abu to Udaipur — Sightseeing if time permits. Overnight Udaipur",
      "Day 6: Fly/Drive to next Tirtha as per itinerary. Overnight en route",
      "Day 7: Temple visits and darshan. Overnight at destination",
      "Day 8: Departure — Transfer to airport/station",
    ],
    inclusions: ["AC Vehicle", "3-Star Hotels", "Pure Jain Meals", "All Entry Tickets", "Temple Guide", "Toll & Parking", "GST Included"],
    exclusions: [],
    category: "pilgrimage",
    createdAt: new Date().toISOString(),
  },
  // --- International: Dubai ---
  {
    id: "pkg-dubai",
    name: "Dubai Tour Package",
    destination: "Dubai, Abu Dhabi, UAE",
    duration: "5 Days / 4 Nights",
    price: 35999,
    originalPrice: 45999,
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=75",
    description: "Experience the glamour of Dubai — from the towering Burj Khalifa and Dubai Mall to the golden desert safari and the charm of old Dubai souks. Includes Abu Dhabi city tour with Sheikh Zayed Mosque. Fully customised packages available.",
    highlights: ["Burj Khalifa Observation Deck", "Desert Safari with BBQ Dinner", "Dubai Mall & Fountain Show", "Dhow Cruise Dinner", "Abu Dhabi City Tour", "Sheikh Zayed Grand Mosque", "Palm Jumeirah & Atlantis", "Gold & Spice Souk"],
    itinerary: [
      "Day 1: Arrival Dubai — Airport pickup, hotel check-in, evening Dhow Cruise dinner. Overnight Dubai",
      "Day 2: Dubai City Tour — Burj Khalifa, Dubai Mall, Dubai Frame, Old Dubai Souks, Jumeirah Beach. Overnight Dubai",
      "Day 3: Desert Safari — Morning free, afternoon Desert Safari with dune bashing, camel ride, BBQ dinner, belly dance. Overnight Dubai",
      "Day 4: Abu Dhabi Day Tour — Sheikh Zayed Mosque, Corniche, Emirates Palace photo stop. Return Dubai. Overnight Dubai",
      "Day 5: Departure — Breakfast, free time for shopping, airport transfer",
    ],
    inclusions: ["4-Star Hotel", "Daily Breakfast", "Airport Transfers", "Desert Safari with BBQ", "Dhow Cruise Dinner", "Dubai & Abu Dhabi City Tours", "All Sightseeing Tickets", "Visa Assistance"],
    exclusions: [],
    category: "international",
    createdAt: new Date().toISOString(),
  },
  // --- International: Thailand ---
  {
    id: "pkg-thailand",
    name: "Thailand Tour Package",
    destination: "Bangkok, Pattaya, Phuket",
    duration: "6 Days / 5 Nights",
    price: 29999,
    originalPrice: 39999,
    image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=75",
    description: "Discover the Land of Smiles — vibrant Bangkok temples, Pattaya beach life, and island hopping. From street food to floating markets, Thailand offers something for everyone. Customised itineraries available.",
    highlights: ["Grand Palace & Wat Phra Kaew", "Pattaya Beach & Coral Island", "Floating Market", "Safari World", "Alcazar Show Pattaya", "Gems Gallery", "Thai Street Food Tour", "Phi Phi Islands (Phuket extension)"],
    itinerary: [
      "Day 1: Arrival Bangkok — Airport pickup, hotel check-in. Evening free. Overnight Bangkok",
      "Day 2: Bangkok City Tour — Grand Palace, Wat Phra Kaew, Wat Pho, Wat Arun. Overnight Bangkok",
      "Day 3: Bangkok to Pattaya — Floating Market, Nong Nooch Garden. Overnight Pattaya",
      "Day 4: Pattaya — Coral Island tour, water sports, Alcazar Show evening. Overnight Pattaya",
      "Day 5: Pattaya to Bangkok — Safari World or shopping. Overnight Bangkok",
      "Day 6: Departure — Breakfast, airport transfer",
    ],
    inclusions: ["4-Star Hotel", "Daily Breakfast", "Airport Transfers", "All Sightseeing & Tours", "Coral Island Tour", "Alcazar Show", "English Speaking Guide", "Visa on Arrival Assistance"],
    exclusions: [],
    category: "international",
    createdAt: new Date().toISOString(),
  },
  // --- International: Vietnam ---
  {
    id: "pkg-vietnam",
    name: "Vietnam Tour Package",
    destination: "Hanoi, Ha Long Bay, Ho Chi Minh City",
    duration: "6 Days / 5 Nights",
    price: 34999,
    originalPrice: 44999,
    image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=600&q=75",
    description: "Explore the beauty of Vietnam — cruise through the stunning Ha Long Bay, walk the streets of historic Hanoi, and experience the energy of Ho Chi Minh City. Rich culture, amazing food, and breathtaking landscapes.",
    highlights: ["Ha Long Bay Cruise", "Hanoi Old Quarter", "Ho Chi Minh City", "Cu Chi Tunnels", "Hoan Kiem Lake", "Water Puppet Show", "Vietnamese Cuisine Tour", "Mekong Delta (optional)"],
    itinerary: [
      "Day 1: Arrival Hanoi — Airport pickup, Hoan Kiem Lake walk, Water Puppet Show. Overnight Hanoi",
      "Day 2: Hanoi City Tour — Ho Chi Minh Mausoleum, Temple of Literature, Old Quarter. Overnight Hanoi",
      "Day 3: Ha Long Bay — Drive to Ha Long, cruise through limestone karsts, kayaking. Overnight on cruise/hotel",
      "Day 4: Ha Long to Hanoi — Morning cruise, return to Hanoi. Fly to Ho Chi Minh City. Overnight HCMC",
      "Day 5: Ho Chi Minh City — Cu Chi Tunnels, War Remnants Museum, Ben Thanh Market. Overnight HCMC",
      "Day 6: Departure — Breakfast, free time, airport transfer",
    ],
    inclusions: ["4-Star Hotels", "Daily Breakfast", "Ha Long Bay Cruise", "Domestic Flight", "All Transfers", "English Speaking Guide", "Sightseeing Tickets", "Visa Assistance"],
    exclusions: [],
    category: "international",
    createdAt: new Date().toISOString(),
  },
  // --- Kashmir: Srinagar-Sonamarg-Gulmarg (from client brochure) ---
  {
    id: "pkg-kashmir-4d",
    name: "Srinagar Sonamarg Gulmarg Tour",
    destination: "Srinagar, Sonamarg, Gulmarg",
    duration: "4 Days / 3 Nights",
    price: 13600,
    originalPrice: 15400,
    image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=75",
    description: "Discover the paradise of Kashmir — the City of Lakes Srinagar, the golden meadows of Sonamarg, and the stunning slopes of Gulmarg. Includes Mughal gardens, a houseboat night, and breathtaking Himalayan views. 2 nights Srinagar + 1 night Houseboat.",
    highlights: [
      "Nishat Bagh, Shalimar Bagh & Chashme Shahi",
      "Sonamarg — Meadow of Gold",
      "Thajiwas Glacier Pony Ride (optional)",
      "Gulmarg Gondola Ride (optional)",
      "Dal Lake Houseboat Night Stay",
      "Scenic Sindh Valley Drive",
    ],
    itinerary: [
      "Day 1: Arrival in Srinagar | Transfer to hotel | Nishat Bagh, Shalimar Bagh & Chashme Shahi | Overnight in Srinagar",
      "Day 2: Srinagar to Sonamarg excursion | Sindh Valley scenic drive | Thajiwas Glacier (optional pony ride) | Return to Srinagar | Overnight in Srinagar",
      "Day 3: Srinagar to Gulmarg (60 km) | Explore Gulmarg meadows | Gondola ride (optional, payable separately) | Overnight in Houseboat",
      "Day 4: Breakfast | Transfer to Srinagar Airport | Departure",
    ],
    inclusions: [
      "Hotel stay — 2 nights Srinagar + 1 night Houseboat",
      "Daily breakfast & dinner",
      "AC vehicle for all transfers & sightseeing",
      "Airport pickup & drop",
    ],
    exclusions: [
      "Airfare to/from Srinagar",
      "Pony rides at Sonamarg",
      "Gondola tickets at Gulmarg",
      "Local union taxi charges & entry fees",
      "Personal expenses (shopping, tips, laundry)",
    ],
    startsFrom: "Srinagar",
    minTravelers: 2,
    priceNote: "Per person, 4 Pax in 3★ Deluxe",
    category: "adventure",
    createdAt: new Date().toISOString(),
  },
  // --- Kashmir Honeymoon ---
  {
    id: "pkg-kashmir-honeymoon",
    name: "Kashmir Honeymoon Package",
    destination: "Srinagar, Pahalgam, Gulmarg, Sonamarg",
    duration: "6 Days / 5 Nights",
    price: 22999,
    originalPrice: 29999,
    image: "https://images.unsplash.com/photo-1566837945700-30057527ade0?w=800&q=75",
    description: "A romantic escape through the paradise on Earth — Kashmir. Cruise on Dal Lake in a private Shikara, explore the flower-filled Mughal gardens, walk through Pahalgam's pine valleys, ride the Gulmarg Gondola with snow-capped peaks, and stay in a luxury houseboat under the stars. Perfect for couples and honeymooners.",
    highlights: [
      "Private Shikara Ride on Dal Lake",
      "Luxury Houseboat Night Stay",
      "Pahalgam — Betaab Valley & Aru Valley",
      "Gulmarg Gondola & Snow Point",
      "Mughal Gardens — Nishat, Shalimar, Chashme Shahi",
      "Sonamarg — Meadow of Gold",
      "Candlelight Dinner (on request)",
    ],
    itinerary: [
      "Day 1: Arrival in Srinagar | Airport pickup | Check-in at hotel | Evening Shikara ride on Dal Lake | Overnight in Srinagar",
      "Day 2: Srinagar local sightseeing | Mughal Gardens — Nishat Bagh, Shalimar Bagh, Chashme Shahi | Shankaracharya Temple | Local market | Overnight in Srinagar",
      "Day 3: Srinagar to Pahalgam (95 km) | Betaab Valley | Aru Valley | Chandanwari (optional) | Overnight in Pahalgam",
      "Day 4: Pahalgam to Gulmarg (140 km) | Gulmarg Gondola Phase 1 & 2 | Snow activities | Meadow walk | Overnight in Gulmarg",
      "Day 5: Gulmarg to Srinagar via Sonamarg | Thajiwas Glacier view | Return to Srinagar | Houseboat check-in | Overnight in Houseboat",
      "Day 6: Breakfast on Houseboat | Transfer to Srinagar Airport | Departure",
    ],
    inclusions: [
      "Deluxe hotel stay — 4 nights + 1 night Luxury Houseboat",
      "Daily breakfast & dinner",
      "AC vehicle for all transfers & sightseeing",
      "Airport pickup & drop",
      "Private Shikara ride on Dal Lake",
      "Welcome gift for couples",
    ],
    exclusions: [
      "Airfare to/from Srinagar",
      "Gondola tickets at Gulmarg",
      "Pony rides & snow activities",
      "Personal expenses (shopping, tips, laundry)",
      "Candlelight dinner arrangement (available on request at extra cost)",
    ],
    startsFrom: "Srinagar",
    minTravelers: 2,
    priceNote: "Per person, couple package on double sharing",
    category: "honeymoon",
    createdAt: new Date().toISOString(),
  },
  // --- International: Bali ---
  {
    id: "pkg-bali",
    name: "Bali Tour Package",
    destination: "Bali, Ubud, Kuta, Nusa Penida",
    duration: "6 Days / 5 Nights",
    price: 32999,
    originalPrice: 42999,
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=75",
    description: "Experience the Island of Gods — Bali's stunning temples, rice terraces, pristine beaches, and vibrant culture. From Ubud's spiritual heart to Kuta's beach vibes and Nusa Penida's dramatic cliffs. Fully customisable.",
    highlights: ["Tanah Lot Temple Sunset", "Ubud Rice Terraces", "Kecak Fire Dance", "Nusa Penida Day Trip", "Kuta & Seminyak Beach", "Uluwatu Temple", "Bali Swing", "Water Sports"],
    itinerary: [
      "Day 1: Arrival Bali — Airport pickup, hotel check-in, Kuta Beach sunset. Overnight Kuta/Seminyak",
      "Day 2: Ubud Tour — Monkey Forest, Tegallalang Rice Terrace, Ubud Market, Bali Swing. Overnight Ubud",
      "Day 3: Temples Tour — Tanah Lot Temple, Uluwatu Temple, Kecak Dance at sunset. Overnight Kuta",
      "Day 4: Nusa Penida Day Trip — Kelingking Beach, Angel's Billabong, Broken Beach. Overnight Kuta",
      "Day 5: Water Sports & Free Day — Tanjung Benoa water sports, shopping. Overnight Kuta",
      "Day 6: Departure — Breakfast, airport transfer",
    ],
    inclusions: ["4-Star Hotel/Villa", "Daily Breakfast", "Airport Transfers", "All Sightseeing Tours", "Nusa Penida Boat & Tour", "Water Sports Package", "English Speaking Driver", "Visa on Arrival"],
    exclusions: [],
    category: "international",
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
