import { describe, expect, it } from "vitest";
import { bookingsCsv, csvCell, csvFilename, enquiriesCsv, istDateTime, toCsv } from "@/lib/inbox-csv";
import { booking, enquiry } from "../helpers/inbox-fixtures";

// Review point #6: the CSV module shared by the export endpoints (ported from the N-1 tests).

describe("istDateTime", () => {
  it("formats in IST", () => {
    expect(istDateTime("2026-11-10T20:00:00.000Z")).toBe("2026-11-11 01:30");
    expect(istDateTime("nope")).toBe("");
  });
});

describe("CSV", () => {
  it("quotes per RFC 4180", () => {
    expect(csvCell("plain")).toBe("plain");
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("line1\nline2")).toBe('"line1\nline2"');
    expect(csvCell(undefined)).toBe("");
    expect(csvCell(null)).toBe("");
    expect(csvCell(42)).toBe("42");
  });

  it("guards against formula injection", () => {
    expect(csvCell("=HYPERLINK(\"x\")")).toBe("\"'=HYPERLINK(\"\"x\"\")\"");
    expect(csvCell("+91 98765")).toBe("'+91 98765");
    expect(csvCell("-2+3")).toBe("'-2+3");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvCell("\tcmd")).toBe("'\tcmd");
    expect(csvCell("\rcmd")).toBe("\"'\rcmd\"");
    expect(csvCell("a=b")).toBe("a=b");
  });

  it("starts with a BOM and uses CRLF rows", () => {
    const csv = toCsv(["A", "B"], [["1", "₹ यात्रा"], ["x,y", 2]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toBe("﻿A,B\r\n1,₹ यात्रा\r\n\"x,y\",2\r\n");
  });

  it("names files with the IST date", () => {
    expect(csvFilename("bookings", new Date("2026-11-18T20:00:00Z"))).toBe("atlas-bookings-2026-11-19.csv");
    expect(csvFilename("enquiries", new Date("2026-11-18T06:00:00Z"))).toBe("atlas-enquiries-2026-11-18.csv");
  });

  it("exports bookings with reference, received date and all fields", () => {
    const csv = bookingsCsv([booking({ city: "Delhi, NCR" })]);
    const [header, row] = csv.slice(1).split("\r\n");
    expect(header).toBe("Reference,Booking ID,Received (IST),Name,Phone,Email,City,Package ID,Package,Travel Date,Travelers,Amount (INR),Payment Status,utr,payment_submitted_at,Booking Status");
    expect(row).toBe("3F9A2C1B,3f9a2c1b-0000-4000-8000-000000000001,2026-11-10 11:30,Rahul Sharma,'+91 98765 43210,rahul@example.com,\"Delhi, NCR\",pkg-varanasi,Divine Varanasi & Prayagraj,2026-12-01,2,25998,pending,,,pending");
  });

  it("exports a verifying booking with its UTR and submission time", () => {
    const csv = bookingsCsv([booking({ paymentStatus: "verifying", utr: "412356789012", paymentSubmittedAt: "2026-11-10T20:00:00.000Z" })]);
    const [header, row] = csv.slice(1).split("\r\n");
    expect(header).toContain("utr,payment_submitted_at");
    expect(row).toContain(",verifying,412356789012,2026-11-11 01:30,pending");
  });

  it("exports enquiries with type and the multi-line message quoted", () => {
    const csv = enquiriesCsv([enquiry({}), enquiry({ id: "e2", kind: "trip-plan", message: "Destinations: Varanasi\nBudget: 50000" })]);
    const lines = csv.slice(1).split("\r\n");
    expect(lines[0]).toBe("Enquiry ID,Received (IST),Type,Name,Phone,Email,Package ID,Travelers,Travel Date,Status,Message");
    expect(lines[1]).toBe("enq-1,2026-11-10 11:30,Contact,Priya Patel,9123456789,priya@example.com,,3,2026-12-20,new,Need a hotel near the ghats");
    expect(lines[2]).toBe("e2,2026-11-10 11:30,Trip plan,Priya Patel,9123456789,priya@example.com,,3,2026-12-20,new,\"Destinations: Varanasi\nBudget: 50000\"");
  });
});
