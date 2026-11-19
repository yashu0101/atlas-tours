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
    id: "pkg-odisha",
    name: "Odisha Tour Package",
    destination: "Bhubaneswar, Puri, Konark, Chilika Lake",
    duration: "6 Days / 5 Nights",
    price: 11999,
    originalPrice: 16999,
    image: "/images/pkg-odisha.jpeg",
    description: "Discover the soul of Odisha — from the magnificent temples of Bhubaneswar to the sacred Jagannath Temple in Puri, the stunning Konark Sun Temple, and the serene Chilika Lake with dolphin spotting. A perfect blend of temples, beaches, culture and nature.",
    highlights: ["Puri Jagannath Temple", "Konark Sun Temple", "Chilika Lake & Dolphin Spotting", "Bhubaneswar Temples (Lingaraj, Mukteshwar, Rajarani)", "Khandagiri & Udayagiri Caves", "Puri Beach", "Chandrabhaga Beach", "Dhauli Peace Pagoda", "Pipili Applique Village", "Raghurajpur Artist Village"],
    itinerary: [
      "Day 1: Arrival Bhubaneswar — Sightseeing (Lingaraj, Mukteshwar, Rajarani, Khandagiri/Udayagiri). Overnight at Bhubaneswar",
      "Day 2: Bhubaneswar to Puri — Via Dhauli, Pipili & Raghurajpur. Jagannath Temple & Puri Beach. Overnight at Puri",
      "Day 3: Chilika Lake / Satpada — Boat ride & dolphin spotting area. Return to Puri. Overnight at Puri",
      "Day 4: Konark Sun Temple — Chandrabhaga Beach, Ramachandi. Return to Puri. Overnight at Puri",
      "Day 5: Puri Local Sightseeing — Temples & local attractions. Evening transfer to Bhubaneswar. Overnight at Bhubaneswar",
      "Day 6: Departure — Bhubaneswar shopping / local sightseeing. Drop at airport / railway station",
    ],
    inclusions: ["AC Transport", "Hotel Stay (3-Star)", "Daily Breakfast", "Sightseeing as per itinerary", "Boat Ride at Chilika", "Temple Guide", "All Toll & Parking"],
    category: "spiritual",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pkg-rajasthan",
    name: "Royal Rajasthan Tour Package",
    destination: "Jaipur, Jodhpur, Jaisalmer, Udaipur",
    duration: "8 Days / 7 Nights",
    price: 17500,
    originalPrice: 22999,
    image: "/images/pkg-rajasthan.jpeg",
    description: "Experience the royal heritage of Rajasthan — from the Pink City Jaipur to the Blue City Jodhpur, the Golden City Jaisalmer with desert camping, and the City of Lakes Udaipur. Same land, different stories. Package cost ₹17,500 per person based on double sharing. Minimum 4 pax required.",
    highlights: ["Amber Fort & Hawa Mahal Jaipur", "Mehrangarh Fort Jodhpur", "Jaisalmer Fort & Patwon Ki Haveli", "Sam Sand Dunes Camel Safari", "Rajasthani Cultural Programme & Dinner", "Lake Pichola & Gangaur Ghat Udaipur", "City Palace Udaipur", "Saheliyon Ki Bari", "Fateh Sagar Lake", "Clock Tower Market Jodhpur"],
    itinerary: [
      "Day 1: Prayagraj to Jaipur — Departure, arrival & hotel check-in. Evening local market. Overnight Jaipur",
      "Day 2: Jaipur — Amber Fort, Jal Mahal, City Palace, Jantar Mantar, Hawa Mahal. Overnight Jaipur",
      "Day 3: Jaipur to Jodhpur — Morning departure, Jodhpur arrival. Mehrangarh Fort, Jaswant Thada, Clock Tower Market. Overnight Jodhpur",
      "Day 4: Jodhpur to Jaisalmer — Morning departure. Jaisalmer Fort, Patwon Ki Haveli, Gadisar Lake. Overnight Jaisalmer",
      "Day 5: Jaisalmer Desert — Kuldhara Village, Sam Sand Dunes, Camel Safari, Sunset. Rajasthani cultural programme & dinner. Overnight Desert Camp",
      "Day 6: Jaisalmer to Udaipur — Early morning departure. Udaipur arrival, Lake Pichola / Gangaur Ghat. Overnight Udaipur",
      "Day 7: Udaipur — City Palace, Jagdish Temple, Saheliyon Ki Bari, Fateh Sagar Lake, Optional boat ride. Overnight Udaipur",
      "Day 8: Udaipur to Prayagraj — Breakfast & check-out. Return journey to Prayagraj",
    ],
    inclusions: ["Hotel (3★/4★)", "Daily Breakfast", "AC Vehicle for Sightseeing & Transfers", "All Sightseeing & Entry Tickets (as per itinerary)", "24x7 Tour Manager Support", "Desert Camp Stay", "Driver Charges, Toll Tax & Parking"],
    category: "heritage",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pkg-up-spiritual",
    name: "Spiritual Wonders of Uttar Pradesh",
    destination: "Ayodhya, Varanasi, Prayagraj, Chitrakoot, Lucknow, Vrindavan, Agra",
    duration: "3 to 8 Days (Multiple Itineraries)",
    price: 12699,
    originalPrice: 17999,
    image: "/images/pkg-up-spiritual.jpeg",
    description: "Explore the spiritual wonders of Uttar Pradesh with our curated pilgrimage and heritage tours. Visit Ayodhya Ram Mandir, witness the Ganga Aarti in Varanasi, take a holy dip at Prayagraj Sangam, experience the serenity of Chitrakoot, heritage of Lucknow, devotion of Vrindavan, and the iconic Taj Mahal in Agra. Five signature itineraries from 3 nights to 8 nights. Rates based on minimum 6 paying guests.",
    highlights: ["Ayodhya Ram Mandir", "Varanasi Ganga Aarti", "Prayagraj Triveni Sangam", "Chitrakoot Divine Serenity", "Lucknow Heritage", "Vrindavan Bhakti", "Agra Taj Mahal", "Naimisharanya Day Visit"],
    itinerary: [
      "Day 1: Ayodhya — Ram Mandir darshan, Hanuman Garhi, Saryu Ghat. Overnight Ayodhya",
      "Day 2: Ayodhya to Varanasi — Kashi Vishwanath Temple, Sarnath. Evening Ganga Aarti at Dashashwamedh Ghat. Overnight Varanasi",
      "Day 3: Varanasi — Morning boat ride on Ganges, local temples. Overnight Varanasi",
      "Day 4: Varanasi to Prayagraj — Triveni Sangam holy dip, Hanuman Mandir, Anand Bhawan. Overnight Prayagraj",
      "Day 5: Prayagraj to Chitrakoot — Kamadgiri Parikrama, Ram Ghat, Gupt Godavari. Overnight Chitrakoot",
      "Day 6: Chitrakoot to Lucknow — Bara Imambara, Chota Imambara, British Residency, Hazratganj. Overnight Lucknow",
      "Day 7: Lucknow to Vrindavan & Agra — Banke Bihari Temple, Prem Mandir, ISKCON. Drive to Agra. Overnight Agra",
      "Day 8: Agra & Departure — Taj Mahal, Agra Fort. Departure",
    ],
    inclusions: ["3-Star Hotel on Double Sharing", "Daily Hotel Breakfast", "AC Innova Crysta for Transfers & Sightseeing", "Driver Charges, Toll Tax & Parking", "GST Included", "Pickup and Drop as per Selected Itinerary"],
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
