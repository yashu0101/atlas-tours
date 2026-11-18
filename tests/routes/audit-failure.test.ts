import "../helpers/no-upstash";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest, type NextResponse } from "next/server";
import { uniqueIp, useTempDb } from "../helpers/temp-db";

const sessionCookie = (res: Response) => (res as NextResponse).cookies.get("admin_session");

// N-8: a failing audit write must never fail the admin's action (it is logged instead).
const session = vi.hoisted(() => ({ token: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "admin_session" && session.token ? { name, value: session.token } : undefined),
  }),
}));
vi.mock("@/lib/db", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/db")>()),
  addAuditEntry: async () => { throw new Error("audit table is down"); },
}));

let db: ReturnType<typeof useTempDb>;
beforeAll(() => { db = useTempDb(); });
afterAll(() => db.cleanup());

const req = (url: string, method: string, body: unknown) =>
  new NextRequest(`http://localhost${url}`, {
    method, body: JSON.stringify(body), headers: { "content-type": "application/json", "x-forwarded-for": uniqueIp() },
  });

describe("audit write failures", () => {
  it("do not break login, content writes or logout", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const login = await import("@/app/api/auth/login/route");
    const packages = await import("@/app/api/packages/route");
    const logout = await import("@/app/api/auth/logout/route");

    const res = await login.POST(req("/api/auth/login", "POST", { email: "admin@atlastours.com", password: "admin123" }));
    expect(res.status).toBe(200);
    session.token = sessionCookie(res)!.value;

    const created = await packages.POST(req("/api/packages", "POST", { name: "Still saved", price: 10 }));
    expect(created.status).toBe(200);
    expect(db.read().packages.some(p => p.name === "Still saved")).toBe(true);

    expect((await login.POST(req("/api/auth/login", "POST", { email: "admin@atlastours.com", password: "wrong" }))).status).toBe(401);
    expect((await logout.POST(req("/api/auth/logout", "POST", {}))).status).toBe(200);

    expect(error).toHaveBeenCalledWith(expect.stringContaining("[audit] failed to record"), expect.any(Error));
  });
});
