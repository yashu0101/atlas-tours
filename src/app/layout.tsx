import type { Metadata } from "next";
import { AppProvider } from "@/lib/context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atlas Tour & Travels | Spiritual Journeys Across India",
  description: "Explore India's incredible destinations — Varanasi, Rajasthan, Odisha & more. Affordable tour packages with Hotel Ganga Imperial partnership.",
  keywords: "tour, travel, varanasi, rajasthan, odisha, pilgrimage, spiritual, india, atlas tours",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
