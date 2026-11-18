import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { makePackage, uniqueIp, useTempDb } from "../helpers/temp-db";

type Route = typeof import("@/app/api/enquiry/route");

let route: Route;
let db: ReturnType<typeof useTempDb>;

beforeAll(async () => {
  db = useTempDb({ packages: [makePackage({ id: "pkg-1", name: "Ganga Aarti Tour" })] });
  route = await import("@/app/api/enquiry/route");
});

afterAll(() => db.cleanup());

let ip: string;
beforeEach(() => {
  ip = uniqueIp();
});

const post = (body: unknown, raw?: string) =>
  route.POST(
    new NextRequest("http://localhost/api/enquiry", {
      method: "POST",
      body: raw ?? JSON.stringify(body),
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
    }),
  );

const valid = { name: "Asha", phone: "+91 98765 43210", email: "asha@example.com", travelers: 2, travelDate: "2099-12-01", message: "Hi" };

describe("POST /api/enquiry", () => {
  it("saves a valid enquiry with only whitelisted fields", async () => {
    const res = await post({ ...valid, status: "confirmed", id: "evil", createdAt: "1999", isAdmin: true });
    expect(res.status).toBe(200);
    const saved = await res.json();
    expect(saved).toMatchObject({ ...valid, status: "new" });
    expect(saved.id).not.toBe("evil");
    expect(saved).not.toHaveProperty("isAdmin");

    const stored = db.read().enquiries;
    expect(stored).toHaveLength(1);
    expect(stored[0]).not.toHaveProperty("isAdmin");
    expect(stored[0].status).toBe("new");
  });

  it("maps the legacy `package` name onto packageId", async () => {
    const saved = await (await post({ ...valid, package: "ganga aarti tour" })).json();
    expect(saved.packageId).toBe("pkg-1");
  });

  it("drops an unknown package rather than rejecting the enquiry", async () => {
    const res = await post({ ...valid, packageId: "missing" });
    expect(res.status).toBe(200);
    expect((await res.json()).packageId).toBeUndefined();
  });

  it("trips the honeypot: 200 without saving", async () => {
    const before = db.read().enquiries.length;
    const res = await post({ ...valid, website: "http://spam.example" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(db.read().enquiries).toHaveLength(before);
  });

  it.each([
    ["bad phone", { ...valid, phone: "12ab" }, /phone/],
    ["missing name", { ...valid, name: "" }, /name is required/],
    ["bad email", { ...valid, email: "not-an-email" }, /email/],
    ["bad date", { ...valid, travelDate: "01/12/2026" }, /travelDate/],
    ["past date", { ...valid, travelDate: "2020-01-01" }, /travelDate cannot be in the past/],
    ["zero travelers", { ...valid, travelers: 0 }, /travelers/],
  ])("rejects %s with 400 and saves nothing", async (_label, body, message) => {
    const before = db.read().enquiries.length;
    const res = await post(body);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(message);
    expect(db.read().enquiries).toHaveLength(before);
  });

  it("rejects malformed JSON with 400", async () => {
    const res = await post(undefined, "{oops");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Malformed JSON body" });
  });

  it("rate-limits a single IP after 5 submissions per minute", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) statuses.push((await post({ ...valid, website: "bot" })).status);
    expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
  });
});
