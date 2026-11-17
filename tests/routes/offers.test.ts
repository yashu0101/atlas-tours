import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { useTempDb } from "../helpers/temp-db";
import type { Offer } from "@/lib/types";

// verifySession() reads the admin cookie via next/headers; supply a controllable store.
const session = vi.hoisted(() => ({ token: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "admin_session" && session.token ? { name, value: session.token } : undefined),
  }),
}));

const offer = (o: Partial<Offer>): Offer => ({
  id: "o",
  title: "Offer",
  description: "",
  discount: 10,
  validFrom: "",
  validTo: "",
  active: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  ...o,
});

let route: typeof import("@/app/api/offers/route");
let db: ReturnType<typeof useTempDb>;
let adminToken: string;

beforeAll(async () => {
  db = useTempDb({
    offers: [
      offer({ id: "current", validTo: "2999-12-31" }),
      offer({ id: "open-ended", validTo: "" }),
      offer({ id: "expired", validTo: "2025-12-31" }),
      offer({ id: "inactive", validTo: "2999-12-31", active: false }),
    ],
  });
  route = await import("@/app/api/offers/route");
  adminToken = await (await import("@/lib/auth")).createSession("admin@atlastours.com");
});

afterAll(() => db.cleanup());

beforeEach(() => {
  session.token = undefined;
});

const url = "http://localhost/api/offers";
const ids = async (res: Response) => ((await res.json()) as Offer[]).map((o) => o.id).sort();

describe("GET /api/offers (G-05)", () => {
  it("returns only active, unexpired offers to the public", async () => {
    expect(await ids(await route.GET(new NextRequest(url)))).toEqual(["current", "open-ended"]);
  });

  it("ignores ?all=1 without an admin session", async () => {
    expect(await ids(await route.GET(new NextRequest(`${url}?all=1`)))).toEqual(["current", "open-ended"]);
  });

  it("returns every offer to an admin with ?all=1", async () => {
    session.token = adminToken;
    expect(await ids(await route.GET(new NextRequest(`${url}?all=1`)))).toEqual(["current", "expired", "inactive", "open-ended"]);
  });
});
