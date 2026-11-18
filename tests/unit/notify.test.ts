import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Booking, Enquiry, Review } from "@/lib/types";
import { PHONE_DISPLAY, SITE_CONFIG } from "@/lib/config";
import { SITE_URL } from "@/lib/seo";

// `after()` only works inside a Next request scope; record the scheduled task instead.
const { afterMock } = vi.hoisted(() => ({ afterMock: vi.fn() }));
vi.mock("next/server", async (orig) => ({ ...(await orig<typeof import("next/server")>()), after: afterMock }));

type Notify = typeof import("@/lib/notify");
let notify: Notify;

const BOOKING: Booking = {
  id: "3f9a2c1b-1111-4222-8333-444455556666",
  name: "Asha <b>Verma</b>",
  phone: "+91 98765 43210",
  email: "asha@example.com",
  city: "Pune",
  packageId: "pkg-1",
  packageName: "Ganga & Aarti Tour",
  travelers: 3,
  travelDate: "2099-12-01",
  amount: 7500,
  paymentStatus: "pending",
  bookingStatus: "pending",
  createdAt: "2026-11-01T00:00:00.000Z",
};

const SECRET_NOTE = "Please forward http://evil.example/phish to everyone";
const ENQUIRY: Enquiry = {
  id: "e1",
  kind: "contact",
  name: "Meera\r\nBcc: victim@example.com",
  phone: "9876543210",
  email: "meera@example.com",
  travelers: 2,
  travelDate: "",
  message: `<script>alert(1)</script> ${SECRET_NOTE}`,
  status: "new",
  createdAt: "2026-11-01T00:00:00.000Z",
};

const REVIEW: Review = {
  id: "r1",
  name: "Ravi",
  city: "Delhi",
  rating: 5,
  text: "Lovely <i>trip</i>",
  active: false,
  source: "customer",
  createdAt: "2026-11-01T00:00:00.000Z",
};

type Sent = { url: string; init: RequestInit; body: Record<string, unknown> };
let fetchMock: ReturnType<typeof vi.fn>;
const sent = (): Sent[] =>
  fetchMock.mock.calls.map(([url, init]) => ({ url: String(url), init: init as RequestInit, body: JSON.parse(String((init as RequestInit).body)) }));
const sentTo = (addr: string) => sent().find((s) => (s.body.to as string[]).includes(addr));

function enable(owners = "owner@example.com, partner@example.com") {
  vi.stubEnv("RESEND_API_KEY", "re_test_key");
  vi.stubEnv("NOTIFY_FROM", "Atlas Tours <bookings@example.com>");
  vi.stubEnv("NOTIFY_EMAIL", owners);
}

beforeEach(async () => {
  vi.resetModules(); // fresh "log once" state per test
  notify = await import("@/lib/notify");
  fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: "x" }), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  afterMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("notify: disabled", () => {
  it("does nothing and logs once when RESEND_API_KEY / NOTIFY_FROM are missing", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    await notify.notifySubmission({ type: "booking", booking: BOOKING });
    notify.notifyAfterResponse({ type: "booking", booking: BOOKING });
    vi.stubEnv("RESEND_API_KEY", "re_test_key"); // NOTIFY_FROM still missing
    await notify.notifySubmission({ type: "booking", booking: BOOKING });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(afterMock).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledTimes(1);
    expect(String(info.mock.calls[0][0])).not.toContain("re_test_key");
  });

  it("sends only the customer mail when NOTIFY_EMAIL is empty", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    enable("");
    await notify.notifySubmission({ type: "booking", booking: BOOKING });
    expect(sent().map((s) => s.body.to)).toEqual([["asha@example.com"]]);
  });
});

describe("notify: Resend request", () => {
  it("POSTs to the Resend API with bearer auth, JSON body and an idempotency key", async () => {
    enable();
    await notify.notifySubmission({ type: "booking", booking: BOOKING });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const s of sent()) {
      expect(s.url).toBe("https://api.resend.com/emails");
      expect(s.init.method).toBe("POST");
      const h = s.init.headers as Record<string, string>;
      expect(h.Authorization).toBe("Bearer re_test_key");
      expect(h["Content-Type"]).toBe("application/json");
      expect(h["Idempotency-Key"]).toMatch(/^booking-3f9a2c1b-.*-(owner|customer)$/);
      expect(s.init.signal).toBeInstanceOf(AbortSignal);
      expect(s.body.from).toBe("Atlas Tours <bookings@example.com>");
      expect(typeof s.body.subject).toBe("string");
      expect(typeof s.body.html).toBe("string");
      expect(typeof s.body.text).toBe("string");
    }
  });

  it("sends the owner alert to every NOTIFY_EMAIL address (reply-to the customer) and the confirmation only to the customer", async () => {
    enable();
    await notify.notifySubmission({ type: "booking", booking: BOOKING });
    const owner = sentTo("owner@example.com")!;
    expect(owner.body.to).toEqual(["owner@example.com", "partner@example.com"]);
    expect(owner.body.reply_to).toBe("asha@example.com");
    const customer = sentTo("asha@example.com")!;
    expect(customer.body.to).toEqual(["asha@example.com"]);
    expect(customer.body).not.toHaveProperty("reply_to");
  });

  it("sends no customer mail without a customer email, and none for reviews", async () => {
    enable();
    await notify.notifySubmission({ type: "enquiry", enquiry: { ...ENQUIRY, email: "" } });
    await notify.notifySubmission({ type: "review", review: REVIEW });
    expect(sent().map((s) => s.body.to)).toEqual([
      ["owner@example.com", "partner@example.com"],
      ["owner@example.com", "partner@example.com"],
    ]);
  });

  it("caps customer mail per recipient (review finding); owner alerts are not capped", async () => {
    enable();
    const runs = notify.CUSTOMER_MAIL_LIMIT + 2;
    for (let i = 0; i < runs; i++) {
      await notify.notifySubmission({ type: "booking", booking: { ...BOOKING, id: `${i}${BOOKING.id.slice(1)}`, email: i % 2 ? "ASHA@example.com" : "asha@example.com" } });
    }
    const toCustomer = sent().filter((s) => (s.body.to as string[]).some((a) => a.toLowerCase() === "asha@example.com"));
    expect(toCustomer).toHaveLength(notify.CUSTOMER_MAIL_LIMIT); // case-insensitive cap
    expect(sent().filter((s) => (s.body.to as string[]).includes("owner@example.com"))).toHaveLength(runs);
  });
});

describe("notify: content", () => {
  it("booking confirmation: reference, package, date, travellers, estimate and track link", () => {
    const mail = notify.buildCustomerEmail({ type: "booking", booking: BOOKING })!;
    expect(mail.subject).toBe("Booking request received – reference 3F9A2C1B");
    for (const part of [mail.text, mail.html]) {
      expect(part).toContain("3F9A2C1B");
      expect(part).toContain("1 Dec 2099");
      expect(part).toContain("₹7,500 (estimate)");
      expect(part).toContain("₹2,500 per person × 3");
      expect(part).toContain(PHONE_DISPLAY);
      expect(part).toContain(SITE_CONFIG.email);
    }
    expect(mail.text).toContain(`${SITE_URL}/track?ref=3F9A2C1B`);
    expect(mail.html).toContain(`href="${SITE_URL}/track?ref=3F9A2C1B"`);
  });

  it("escapes user-supplied values in the HTML part", () => {
    const owner = notify.buildOwnerEmail({ type: "booking", booking: BOOKING });
    const customer = notify.buildCustomerEmail({ type: "booking", booking: BOOKING })!;
    expect(owner.html).toContain("Asha &lt;b&gt;Verma&lt;/b&gt;");
    for (const html of [owner.html, customer.html]) {
      expect(html).not.toContain("<b>Verma");
      expect(html).toContain("Ganga &amp; Aarti Tour");
    }
    // Review finding: the customer's name is attacker-controlled (any address can be entered),
    // so customer mail never includes it — not even escaped.
    expect(customer.html).not.toContain("Verma");
    expect(customer.text).not.toContain("Verma");
    const enq = notify.buildOwnerEmail({ type: "enquiry", enquiry: ENQUIRY });
    expect(enq.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(enq.html).not.toContain("<script>");
    expect(notify.buildOwnerEmail({ type: "review", review: REVIEW }).html).toContain("Lovely &lt;i&gt;trip&lt;/i&gt;");
  });

  it("strips CR/LF from subjects", async () => {
    const subject = notify.buildOwnerEmail({ type: "enquiry", enquiry: ENQUIRY }).subject;
    expect(subject).toBe("New enquiry from Meera Bcc: victim@example.com");
    expect(subject).not.toMatch(/[\r\n]/);
    expect(notify.safeSubject("a\r\nb\nc d")).toBe("a b c d");
    enable();
    await notify.notifySubmission({ type: "enquiry", enquiry: ENQUIRY });
    for (const s of sent()) expect(s.body.subject).not.toMatch(/[\r\n]/);
  });

  it("customer mail never echoes the free-text message; the owner mail does", () => {
    for (const kind of ["contact", "trip-plan", "callback"] as const) {
      const ev = { type: "enquiry" as const, enquiry: { ...ENQUIRY, kind } };
      const customer = notify.buildCustomerEmail(ev)!;
      expect(customer.text + customer.html).not.toContain("evil.example");
      expect(customer.text + customer.html).not.toContain("alert(1)");
      const owner = notify.buildOwnerEmail(ev);
      expect(owner.text).toContain(SECRET_NOTE);
      expect(owner.text).toContain(`${SITE_URL}/admin`);
    }
  });

  it("subjects and intros per enquiry kind; callback ack shows the chosen slot", () => {
    expect(notify.buildCustomerEmail({ type: "enquiry", enquiry: ENQUIRY })!.subject).toBe("We have received your enquiry");
    expect(notify.buildOwnerEmail({ type: "enquiry", enquiry: { ...ENQUIRY, kind: "trip-plan" } }).subject).toMatch(/^New trip plan request from/);
    const cb = notify.buildCustomerEmail({
      type: "enquiry",
      enquiry: { ...ENQUIRY, kind: "callback" },
      callback: { date: "2026-11-20", slot: "evening" },
    })!;
    expect(cb.text).toContain("20 Nov 2026, Evening (4 PM – 8 PM IST)");
    expect(notify.buildOwnerEmail({ type: "review", review: REVIEW }).subject).toBe("New review awaiting approval – 5/5 from Ravi");
  });
});

describe("notify: failures never throw", () => {
  it("logs HTTP errors without secrets or customer data", async () => {
    enable();
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockImplementation(
      async () => new Response(JSON.stringify({ name: "validation_error", message: "Invalid `to`: asha@example.com" }), { status: 422 }),
    );
    await expect(notify.notifySubmission({ type: "booking", booking: BOOKING })).resolves.toBeUndefined();
    expect(error).toHaveBeenCalledTimes(2);
    const logged = error.mock.calls.flat().join(" ");
    expect(logged).toContain("HTTP 422 (validation_error)");
    for (const leak of ["re_test_key", "asha@example.com", "owner@example.com", "Asha", "98765"]) expect(logged).not.toContain(leak);
  });

  it("swallows network errors and timeouts", async () => {
    enable();
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockRejectedValueOnce(new DOMException("The operation timed out.", "TimeoutError"));
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    await expect(notify.notifySubmission({ type: "booking", booking: BOOKING })).resolves.toBeUndefined();
    const logged = error.mock.calls.flat().join(" ");
    expect(logged).toContain("timed out after 5000 ms");
    expect(logged).toContain("TypeError");
    expect(fetchMock).toHaveBeenCalledTimes(2); // no retries
  });

  it("gives every request a 5 s abort timeout", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    enable();
    await notify.notifySubmission({ type: "review", review: REVIEW });
    expect(notify.SEND_TIMEOUT_MS).toBe(5000);
    expect(timeout).toHaveBeenCalledWith(5000);
  });
});

describe("notifyAfterResponse", () => {
  it("schedules the sends with after() instead of sending inline", async () => {
    enable();
    notify.notifyAfterResponse({ type: "booking", booking: BOOKING });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(afterMock).toHaveBeenCalledTimes(1);
    await afterMock.mock.calls[0][0]();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("falls back to a background promise outside a request scope", async () => {
    enable();
    afterMock.mockImplementation(() => {
      throw new Error("`after` was called outside a request scope");
    });
    expect(() => notify.notifyAfterResponse({ type: "review", review: REVIEW })).not.toThrow();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });
});
