import { SiteConfig, TourPackage } from "./types";

export const SITE_CONFIG: SiteConfig = {
  name: "Atlas Tour & Travels",
  phone: "+916388360881",
  whatsapp: "916388360881",
  email: "atlastourandtravels01@gmail.com",
  address: "Varanasi, Uttar Pradesh, India",
  tagline: "Spiritual Journey... Lifetime Memories",
};

export const DEFAULT_PACKAGES: TourPackage[] = [
  {
    id: "pkg-varanasi",
    name: "Divine Varanasi & Prayagraj",
    destination: "Varanasi, Prayagraj, Ayodhya",
    duration: "4 Days / 3 Nights",
    price: 8999,
    originalPrice: 12999,
    image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800&q=75",
    description: "Experience the spiritual heart of India with Ganga Aarti, Kashi Vishwanath Temple, and holy dips.",
    highlights: ["Ganga Aarti at Dashashwamedh Ghat", "Kashi Vishwanath Temple", "Sarnath Buddhist Site", "Triveni Sangam Prayagraj", "Ram Mandir Ayodhya"],
    itinerary: ["Day 1: Arrival in Varanasi, Evening Ganga Aarti", "Day 2: Kashi Vishwanath, Sarnath, Local Temples", "Day 3: Prayagraj Sangam, Hanuman Mandir", "Day 4: Ayodhya Ram Mandir, Departure"],
    inclusions: ["AC Transport", "3-Star Hotel Stay", "Breakfast & Dinner", "Guided Temple Tours", "All Entry Tickets"],
    category: "spiritual",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pkg-rajasthan",
    name: "Royal Rajasthan Explorer",
    destination: "Jaipur, Udaipur, Jodhpur, Jaisalmer",
    duration: "6 Days / 5 Nights",
    price: 15999,
    originalPrice: 21999,
    image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&q=75",
    description: "Explore majestic forts, royal palaces, golden sand dunes and vibrant Rajasthani culture.",
    highlights: ["Amber Fort & Hawa Mahal", "City Palace Udaipur", "Mehrangarh Fort Jodhpur", "Sam Sand Dunes Camel Safari", "Traditional Rajasthani Dinner"],
    itinerary: ["Day 1: Arrive Jaipur, Hawa Mahal, Jantar Mantar", "Day 2: Amber Fort, City Palace, Local Market", "Day 3: Drive to Jodhpur, Mehrangarh Fort", "Day 4: Drive to Jaisalmer, Golden Fort", "Day 5: Sam Dunes, Desert Camp, Camel Safari", "Day 6: Departure"],
    inclusions: ["AC Transport", "Hotel Stay", "Daily Breakfast", "Desert Camp Stay", "Guide Services"],
    category: "heritage",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pkg-odisha",
    name: "Sacred Odisha Pilgrimage",
    destination: "Puri, Konark, Bhubaneswar",
    duration: "5 Days / 4 Nights",
    price: 11999,
    originalPrice: 16999,
    image: "https://images.unsplash.com/photo-1621427642877-68e20cf5f770?w=800&q=75",
    description: "Visit Jagannath Temple, Sun Temple and ancient caves in the land of Lord Jagannath.",
    highlights: ["Jagannath Temple Puri", "Konark Sun Temple", "Lingaraj Temple", "Udayagiri & Khandagiri Caves", "Puri Beach & Chilika Lake"],
    itinerary: ["Day 1: Arrive Bhubaneswar, Lingaraj Temple", "Day 2: Udayagiri Caves, ISKCON Temple", "Day 3: Konark Sun Temple, Chandrabhaga Beach", "Day 4: Puri Jagannath Temple, Beach", "Day 5: Chilika Lake, Departure"],
    inclusions: ["AC Transport", "Hotel Stay", "Breakfast & Dinner", "Temple Guide", "Boat Ride at Chilika"],
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
