import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import "../helpers/no-upstash";
import { POST } from "@/app/api/seed/route";

// B-14: /api/seed is rate-limited per IP so SEED_SECRET can't be brute-forced.
// vitest forces DATABASE_URL="", so nothing here touches a database.
const seedReq = (secret: string, ip: string) =>
  new NextRequest("http://localhost/api/seed", {
    method: "POST",
    body: JSON.stringify({ secret }),
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
  });

describe("POST /api/seed", () => {
  it("rejects a wrong secret with 401", async () => {
    expect((await POST(seedReq("wrong", "203.0.113.1"))).status).toBe(401);
  });

  it("returns 429 after 5 attempts from one IP, without affecting other IPs", async () => {
    const ip = "203.0.113.2";
    for (let i = 0; i < 5; i++) expect((await POST(seedReq("wrong", ip))).status).toBe(401);
    // Even the correct (dev) secret is refused once the limit is hit.
    expect((await POST(seedReq("atlas-seed-2024", ip))).status).toBe(429);
    expect((await POST(seedReq("wrong", "203.0.113.3"))).status).toBe(401);
  });
});
