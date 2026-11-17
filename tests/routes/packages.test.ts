import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { makePackage, useTempDb } from "../helpers/temp-db";

// verifySession() reads the admin cookie via next/headers, which needs a request
// scope outside Next. Supply a controllable cookie store instead.
const session = vi.hoisted(() => ({ token: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "admin_session" && session.token ? { name, value: session.token } : undefined),
  }),
}));

type Route = typeof import("@/app/api/packages/route");

let route: Route;
let db: ReturnType<typeof useTempDb>;
let adminToken: string;

beforeAll(async () => {
  db = useTempDb({
    packages: [
      makePackage({ id: "visible", name: "Ganga Aarti Tour", price: 1500 }),
      makePackage({ id: "hidden", name: "Secret Tour", price: 9999, hidden: true }),
    ],
  });
  route = await import("@/app/api/packages/route");
  adminToken = await (await import("@/lib/auth")).createSession("admin@atlastours.com");
});

afterAll(() => db.cleanup());

beforeEach(() => {
  session.token = undefined;
});

const url = "http://localhost/api/packages";
const jsonReq = (method: string, body: string, path = url) =>
  new NextRequest(path, { method, body, headers: { "content-type": "application/json" } });

describe("GET /api/packages", () => {
  it("returns only public packages to anonymous visitors", async () => {
    const res = await route.GET(new NextRequest(url));
    expect(res.status).toBe(200);
    const items = (await res.json()) as { id: string }[];
    expect(items.map((p) => p.id)).toEqual(["visible"]);
  });

  it("ignores ?all=1 without an admin session", async () => {
    const items = (await (await route.GET(new NextRequest(`${url}?all=1`))).json()) as { id: string }[];
    expect(items.map((p) => p.id)).toEqual(["visible"]);
  });

  it("returns hidden packages to an admin with ?all=1", async () => {
    session.token = adminToken;
    const items = (await (await route.GET(new NextRequest(`${url}?all=1`))).json()) as { id: string }[];
    expect(items.map((p) => p.id).sort()).toEqual(["hidden", "visible"]);
  });

  it("rejects a forged session token", async () => {
    session.token = adminToken.slice(0, -4) + "AAAA";
    const items = (await (await route.GET(new NextRequest(`${url}?all=1`))).json()) as { id: string }[];
    expect(items.map((p) => p.id)).toEqual(["visible"]);
  });
});

describe("writes require an admin session", () => {
  it.each(["POST", "PATCH", "DELETE"] as const)("%s without a session is 401", async (method) => {
    const res = await route[method](jsonReq(method, JSON.stringify({ id: "visible", name: "x", price: 1 })));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("leaves the stored packages untouched", () => {
    expect(db.read().packages.map((p) => p.id)).toEqual(["visible", "hidden"]);
  });
});

describe("admin writes", () => {
  beforeEach(() => {
    session.token = adminToken;
  });

  it("malformed JSON is 400", async () => {
    const res = await route.POST(jsonReq("POST", "{not json"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Malformed JSON body" });
  });

  it("a non-object JSON body is 400", async () => {
    const res = await route.POST(jsonReq("POST", "[1,2]"));
    expect(res.status).toBe(400);
  });

  it("POST validates fields and requires name and price", async () => {
    expect((await route.POST(jsonReq("POST", JSON.stringify({ name: "No price" })))).status).toBe(400);
    expect((await route.POST(jsonReq("POST", JSON.stringify({ name: "x", price: 1, image: "javascript:alert(1)" })))).status).toBe(400);
  });

  it("POST ignores client ids, applies defaults and persists", async () => {
    const res = await route.POST(jsonReq("POST", JSON.stringify({ id: "client-chosen", name: "New Tour", price: "2500" })));
    expect(res.status).toBe(200);
    const created = await res.json();
    expect(created.id).not.toBe("client-chosen");
    expect(created).toMatchObject({ name: "New Tour", price: 2500, category: "spiritual", hidden: false });
    expect(db.read().packages.some((p) => p.id === created.id)).toBe(true);
  });

  it("PATCH and DELETE on an unknown id are 404", async () => {
    expect((await route.PATCH(jsonReq("PATCH", JSON.stringify({ id: "nope", name: "x" })))).status).toBe(404);
    expect((await route.DELETE(jsonReq("DELETE", JSON.stringify({ id: "nope" })))).status).toBe(404);
  });

  it("PATCH cannot blank a required field", async () => {
    const res = await route.PATCH(jsonReq("PATCH", JSON.stringify({ id: "visible", name: "  " })));
    expect(res.status).toBe(400);
  });
});
