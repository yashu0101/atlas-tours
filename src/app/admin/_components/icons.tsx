// Small stroke icons for the admin (inline SVG — no icon font/CDN, see F-07).
const PATHS = {
  dashboard: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z",
  bookings: "M3 5h18v16H3zM3 10h18M8 3v4M16 3v4M8 15h3",
  enquiries: "M4 4h16v12H8l-4 4zM8 9h8M8 12h5",
  reviews: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
  packages: "M4 8h16v12H4zM9 8V5h6v3M4 13h16",
  gallery: "M3 4h18v16H3zM3 16l5-5 4 4 3-3 6 6M15.5 8.5h.01",
  blogs: "M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7",
  faqs: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5h.01",
  offers: "M3 12V3h9l9 9-9 9zM7.5 7.5h.01",
  external: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  logout: "M9 4H4v16h5M16 8l4 4-4 4M20 12H9",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  plus: "M12 5v14M5 12h14",
  close: "M6 6l12 12M18 6L6 18",
  download: "M12 4v11M7 10l5 5 5-5M4 20h16",
  arrow: "M5 12h14M13 6l6 6-6 6",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  eyeOff: "M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={PATHS[name]} />
    </svg>
  );
}
