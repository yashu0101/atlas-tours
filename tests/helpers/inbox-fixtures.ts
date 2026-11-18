import type { Booking, Enquiry } from "@/lib/types";

/** A complete Booking with overrides (unit tests of the inbox filters / CSV). */
export const booking = (over: Partial<Booking>): Booking => ({
  id: "3f9a2c1b-0000-4000-8000-000000000001",
  name: "Rahul Sharma",
  phone: "+91 98765 43210",
  email: "rahul@example.com",
  city: "Delhi",
  packageId: "pkg-varanasi",
  packageName: "Divine Varanasi & Prayagraj",
  travelers: 2,
  travelDate: "2026-12-01",
  amount: 25998,
  paymentStatus: "pending",
  bookingStatus: "pending",
  createdAt: "2026-11-10T06:00:00.000Z",
  ...over,
});

/** A complete Enquiry with overrides. */
export const enquiry = (over: Partial<Enquiry>): Enquiry => ({
  id: "enq-1",
  name: "Priya Patel",
  phone: "9123456789",
  email: "priya@example.com",
  travelers: 3,
  travelDate: "2026-12-20",
  message: "Need a hotel near the ghats",
  status: "new",
  createdAt: "2026-11-10T06:00:00.000Z",
  ...over,
});
