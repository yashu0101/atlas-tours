/**
 * Default site content (B-11). The single source for BOTH seed paths:
 *  - the JSON backend writes it to the JSON db file when that file is missing (`readDB` in db.ts);
 *  - `POST /api/seed` inserts it into Postgres (`seedContent` in db.ts), skipping any id that exists.
 *
 * Ids and `createdAt` values are fixed so seeding is deterministic and idempotent.
 * Bookings and enquiries are customer data and are never seeded.
 */
import { BlogPost, DB, FAQ, GalleryImage, Offer, Review, SiteConfig, TourPackage } from "./types";
import { DEFAULT_PACKAGES, SITE_CONFIG } from "./config";

const EPOCH = "2024-01-01T00:00:00.000Z";

// DEFAULT_PACKAGES stamps createdAt with the import time; pin it so both backends seed the same rows.
export const SEED_PACKAGES: readonly TourPackage[] = DEFAULT_PACKAGES.map(p => ({ ...p, createdAt: EPOCH }));

export const SEED_REVIEWS: readonly Review[] = [
  { id: "rev-1", name: "Rahul Sharma", rating: 5, text: "Amazing Varanasi trip! Everything was perfectly organized. The Ganga Aarti experience was unforgettable.", city: "Delhi", packageName: "Divine Varanasi & Prayagraj", active: true, createdAt: "2024-06-01T00:00:00.000Z" },
  { id: "rev-2", name: "Priya Patel", rating: 5, text: "Rajasthan tour was incredible. Desert safari and fort visits were highlights. Great value for money!", city: "Mumbai", packageName: "Royal Rajasthan Explorer", active: true, createdAt: "2024-07-01T00:00:00.000Z" },
  { id: "rev-3", name: "Amit Kumar", rating: 4, text: "Odisha pilgrimage was very well planned. Jagannath Temple darshan was smooth. Recommended!", city: "Kolkata", packageName: "Sacred Odisha Pilgrimage", active: true, createdAt: "2024-08-01T00:00:00.000Z" },
];

export const SEED_GALLERY: readonly GalleryImage[] = [
  { id: "g1", src: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=600&q=75", caption: "Varanasi Ghats", category: "Varanasi", active: true, createdAt: EPOCH },
  { id: "g2", src: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&q=75", caption: "Hawa Mahal Jaipur", category: "Rajasthan", active: true, createdAt: EPOCH },
  { id: "g3", src: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&q=75", caption: "Taj Mahal", category: "Heritage", active: true, createdAt: EPOCH },
  { id: "g4", src: "https://images.unsplash.com/photo-1548013146-72479768bada?w=600&q=75", caption: "Amber Fort", category: "Rajasthan", active: true, createdAt: EPOCH },
  { id: "g5", src: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&q=75", caption: "India Gate", category: "Heritage", active: true, createdAt: EPOCH },
  { id: "g6", src: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&q=75", caption: "Temple Architecture", category: "Spiritual", active: true, createdAt: EPOCH },
];

export const SEED_BLOGS: readonly BlogPost[] = [
  { id: "b1", title: "Top 10 Temples to Visit in Varanasi", excerpt: "Discover the most sacred temples in the holy city of Varanasi, from Kashi Vishwanath to lesser-known gems.", content: "Varanasi is home to thousands of temples...", image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=600&q=75", category: "Spiritual", author: "Atlas Team", active: true, createdAt: "2024-06-01T00:00:00.000Z" },
  { id: "b2", title: "Rajasthan Travel Guide: Desert to Palace", excerpt: "Everything you need to know before your Rajasthan trip — best time, budget, must-visit places.", content: "Rajasthan is a land of kings...", image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&q=75", category: "Guide", author: "Atlas Team", active: true, createdAt: "2024-07-01T00:00:00.000Z" },
  { id: "b3", title: "Best Street Food in Indian Holy Cities", excerpt: "A foodie's guide to the best street food across India's pilgrimage destinations.", content: "Indian holy cities offer some of the best vegetarian food...", image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=75", category: "Food", author: "Atlas Team", active: true, createdAt: "2024-08-01T00:00:00.000Z" },
];

export const SEED_FAQS: readonly FAQ[] = [
  { id: "f1", question: "What is included in the tour package?", questionHi: "टूर पैकेज में क्या शामिल है?", answer: "All our packages include AC transport, hotel accommodation, meals (breakfast & dinner), guided tours, and entry tickets. Specific inclusions are listed on each package.", answerHi: "हमारे सभी पैकेज में एसी ट्रांसपोर्ट, होटल आवास, भोजन (नाश्ता और रात का खाना), गाइडेड टूर और एंट्री टिकट शामिल हैं।", active: true, order: 1, createdAt: EPOCH },
  { id: "f2", question: "How do I book a tour?", questionHi: "मैं टूर कैसे बुक करूं?", answer: "You can book through our website, call us at 6388360881, or message us on WhatsApp. We'll confirm your booking within 24 hours.", answerHi: "आप हमारी वेबसाइट से बुक कर सकते हैं, 6388360881 पर कॉल करें, या WhatsApp पर मैसेज करें।", active: true, order: 2, createdAt: EPOCH },
  { id: "f3", question: "Is there a cancellation policy?", questionHi: "क्या कोई कैंसिलेशन पॉलिसी है?", answer: "Yes, free cancellation up to 7 days before the trip. 50% refund for cancellations 3-7 days before. No refund for last-minute cancellations.", answerHi: "हां, यात्रा से 7 दिन पहले तक मुफ्त कैंसिलेशन। 3-7 दिन पहले कैंसिलेशन पर 50% रिफंड।", active: true, order: 3, createdAt: EPOCH },
  { id: "f4", question: "Do you provide hotel accommodation?", questionHi: "क्या आप होटल आवास प्रदान करते हैं?", answer: "Yes, we partner with Hotel Ganga Imperial in Varanasi and quality hotels at all destinations. All stays are 3-star or above.", answerHi: "हां, हम वाराणसी में होटल गंगा इम्पीरियल और सभी गंतव्यों पर गुणवत्ता वाले होटलों के साथ साझेदारी करते हैं।", active: true, order: 4, createdAt: EPOCH },
  { id: "f5", question: "Can I customize my tour package?", questionHi: "क्या मैं अपना टूर पैकेज कस्टमाइज कर सकता हूं?", answer: "Absolutely! Contact us with your requirements and we'll create a custom itinerary that fits your budget and preferences.", answerHi: "बिल्कुल! अपनी आवश्यकताओं के साथ हमसे संपर्क करें और हम आपके बजट के अनुसार कस्टम यात्रा कार्यक्रम बनाएंगे।", active: true, order: 5, createdAt: EPOCH },
];

export const SEED_OFFERS: readonly Offer[] = [
  { id: "o1", title: "Early Bird Discount", description: "Book 30 days in advance and get 15% off on any package!", discount: 15, code: "EARLY15", validFrom: "2024-01-01", validTo: "2025-12-31", active: true, createdAt: EPOCH },
  { id: "o2", title: "Group Special", description: "Group of 5+ travelers get flat 20% discount on total booking.", discount: 20, code: "GROUP20", validFrom: "2024-01-01", validTo: "2025-12-31", active: true, createdAt: EPOCH },
];

export const SEED_CONFIG: SiteConfig = SITE_CONFIG;

/** A fresh, mutable copy of the full JSON-backend seed (no bookings/enquiries). */
export function buildSeedDB(): DB {
  return structuredClone({
    packages: [...SEED_PACKAGES],
    enquiries: [],
    bookings: [],
    reviews: [...SEED_REVIEWS],
    gallery: [...SEED_GALLERY],
    blogs: [...SEED_BLOGS],
    faqs: [...SEED_FAQS],
    offers: [...SEED_OFFERS],
    config: SEED_CONFIG,
  });
}
