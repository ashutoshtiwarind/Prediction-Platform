/**
 * @jest-environment node
 *
 * Tests for POST /api/auth/send-otp and POST /api/auth/verify-otp (dev mode)
 */

// ── Mock Supabase before any imports ──────────────────────────────────────
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      signInWithOtp: jest.fn(),
      verifyOtp: jest.fn(),
    },
  },
}));
// ──────────────────────────────────────────────────────────────────────────

import { POST as sendOtp }   from "@/app/api/auth/send-otp/route";
import { POST as verifyOtp } from "@/app/api/auth/verify-otp/route";
import { supabase }          from "@/lib/supabase";

const mockFrom   = supabase.from as jest.Mock;

function makeRequest(body: object) {
  return new Request("http://localhost:3000", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  }) as unknown as import("next/server").NextRequest;
}

function makeFromChain({
  singleData = null as object | null,
  singleError = null as object | null,
  insertError = null as object | null,
} = {}) {
  return {
    select: jest.fn().mockReturnThis(),
    eq:     jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: singleData, error: singleError }),
    insert: jest.fn().mockResolvedValue({ error: insertError }),
  };
}

// ── send-otp ─────────────────────────────────────────────────────────────
describe("POST /api/auth/send-otp (dev mode)", () => {
  it("returns success + devOtp for a valid +91 phone", async () => {
    const res  = await sendOtp(makeRequest({ phone: "+919876543210" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.dev).toBe(true);
    expect(json.devOtp).toBe("123456");
  });

  it("rejects a non-+91 phone number", async () => {
    const res  = await sendOtp(makeRequest({ phone: "+12025551234" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/Invalid phone/i);
  });

  it("rejects when phone is missing from body", async () => {
    const res  = await sendOtp(makeRequest({}));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBeDefined();
  });

  it("does not call supabase.auth in dev mode", async () => {
    await sendOtp(makeRequest({ phone: "+919876543210" }));
    expect(supabase.auth.signInWithOtp).not.toHaveBeenCalled();
  });
});

// ── verify-otp ────────────────────────────────────────────────────────────
describe("POST /api/auth/verify-otp (dev mode)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("accepts OTP 123456 and creates a new user", async () => {
    const chain = makeFromChain({ singleError: { code: "PGRST116" } });
    mockFrom.mockReturnValue(chain);

    const res  = await verifyOtp(makeRequest({
      phone: "+919876543210", otp: "123456",
      name: "Cricket Fan", username: "cricketfan",
    }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.user_id).toBeDefined();
    expect(json.dev).toBe(true);
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ username: "cricketfan", phone: "+919876543210" })
    );
  });

  it("returns existing user ID without calling insert", async () => {
    const chain = makeFromChain({ singleData: { id: "existing-user-abc" } });
    mockFrom.mockReturnValue(chain);

    const res  = await verifyOtp(makeRequest({
      phone: "+919876543210", otp: "123456",
      name: "Fan", username: "fan",
    }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.user_id).toBe("existing-user-abc");
    expect(chain.insert).not.toHaveBeenCalled();
  });

  it("rejects a wrong OTP with a clear message mentioning 123456", async () => {
    const res  = await verifyOtp(makeRequest({
      phone: "+919876543210", otp: "000000",
      name: "Fan", username: "fan",
    }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/123456/);
  });

  it("does not call supabase.auth.verifyOtp in dev mode", async () => {
    const chain = makeFromChain({ singleError: { code: "PGRST116" } });
    mockFrom.mockReturnValue(chain);

    await verifyOtp(makeRequest({
      phone: "+919876543210", otp: "123456",
      name: "Fan", username: "fan",
    }));

    expect(supabase.auth.verifyOtp).not.toHaveBeenCalled();
  });
});
