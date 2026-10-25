export interface TourPackage {
  id: string;
  name: string;
  destination: string;
  duration: string;
  price: number;
  originalPrice?: number;
  image: string;
  description: string;
  highlights: string[];
  itinerary: string[];
  inclusions: string[];
  category: "spiritual" | "cultural" | "adventure" | "heritage";
  hidden?: boolean;
  createdAt: string;
}

export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  packageId?: string;
  travelers: number;
  travelDate: string;
  message: string;
  status: "new" | "contacted" | "confirmed" | "cancelled";
  createdAt: string;
}

export interface Booking {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  packageId: string;
  packageName: string;
  travelers: number;
  travelDate: string;
  amount: number;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  bookingStatus: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  city: string;
  packageName?: string;
  active: boolean;
  createdAt: string;
}

export interface GalleryImage {
  id: string;
  src: string;
  caption: string;
  category: string;
  active: boolean;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  author: string;
  active: boolean;
  createdAt: string;
}

export interface FAQ {
  id: string;
  question: string;
  questionHi?: string;
  answer: string;
  answerHi?: string;
  active: boolean;
  order: number;
  createdAt: string;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  discount: number;
  code?: string;
  validFrom: string;
  validTo: string;
  active: boolean;
  createdAt: string;
}

export interface SiteConfig {
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  tagline: string;
}

export interface DB {
  packages: TourPackage[];
  enquiries: Enquiry[];
  bookings: Booking[];
  reviews: Review[];
  gallery: GalleryImage[];
  blogs: BlogPost[];
  faqs: FAQ[];
  offers: Offer[];
  config: SiteConfig;
}
