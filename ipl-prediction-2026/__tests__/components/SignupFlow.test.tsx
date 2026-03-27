/**
 * Integration tests for the 3-step Signup flow
 *
 * Step 1: Enter phone  → "Send OTP"
 * Step 2: Enter OTP   → "Verify OTP"
 * Step 3: Enter name/username → "Create Account & Predict"
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ── Next.js navigation mock ───────────────────────────────────────────────
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));
// ─────────────────────────────────────────────────────────────────────────

// ── Global fetch mock ─────────────────────────────────────────────────────
global.fetch = jest.fn();
// ─────────────────────────────────────────────────────────────────────────

// ── localStorage mock ─────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });
// ─────────────────────────────────────────────────────────────────────────

import SignupPage from "@/app/signup/page";

function mockFetch(responses: Array<{ ok?: boolean; json: object }>) {
  let callCount = 0;
  (fetch as jest.Mock).mockImplementation(() => {
    const r = responses[callCount++] ?? responses[responses.length - 1];
    return Promise.resolve({
      ok: r.ok ?? true,
      json: () => Promise.resolve(r.json),
    });
  });
}

describe("SignupPage — 3-step flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  // ── Step 1 ────────────────────────────────────────────────────────────
  describe("Step 1: Phone entry", () => {
    it("renders the phone input and Send OTP button", () => {
      render(<SignupPage />);
      expect(screen.getByPlaceholderText(/98765 43210/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /send otp/i })).toBeInTheDocument();
    });

    it("disables Send OTP until 10 digits are entered", async () => {
      render(<SignupPage />);
      const btn = screen.getByRole("button", { name: /send otp/i });
      expect(btn).toBeDisabled();

      const input = screen.getByPlaceholderText(/98765 43210/i);
      await userEvent.type(input, "9876543210");

      expect(btn).toBeEnabled();
    });

    it("progresses to OTP step on successful send", async () => {
      mockFetch([{ json: { success: true, dev: true, devOtp: "123456" } }]);
      render(<SignupPage />);

      const input = screen.getByPlaceholderText(/98765 43210/i);
      await userEvent.type(input, "9876543210");
      await userEvent.click(screen.getByRole("button", { name: /send otp/i }));

      await waitFor(() =>
        expect(screen.getByText(/step 2 of 3/i)).toBeInTheDocument()
      );
      expect(screen.getByPlaceholderText(/000000/i)).toBeInTheDocument();
    });

    it("shows error message when send-otp API fails", async () => {
      mockFetch([{ json: { success: false, error: "Unsupported phone provider" } }]);
      render(<SignupPage />);

      await userEvent.type(screen.getByPlaceholderText(/98765 43210/i), "9876543210");
      await userEvent.click(screen.getByRole("button", { name: /send otp/i }));

      await waitFor(() =>
        expect(screen.getByText(/Unsupported phone provider/i)).toBeInTheDocument()
      );
    });
  });

  // ── Step 2 ────────────────────────────────────────────────────────────
  describe("Step 2: OTP verification", () => {
    async function goToOtpStep() {
      mockFetch([{ json: { success: true, dev: true, devOtp: "123456" } }]);
      render(<SignupPage />);
      await userEvent.type(screen.getByPlaceholderText(/98765 43210/i), "9876543210");
      await userEvent.click(screen.getByRole("button", { name: /send otp/i }));
      await waitFor(() => screen.getByPlaceholderText(/000000/i));
    }

    it("disables Verify OTP until 6 digits are entered", async () => {
      await goToOtpStep();
      const btn = screen.getByRole("button", { name: /verify otp/i });
      expect(btn).toBeDisabled();

      await userEvent.type(screen.getByPlaceholderText(/000000/i), "12345");
      expect(btn).toBeDisabled();

      await userEvent.type(screen.getByPlaceholderText(/000000/i), "6");
      expect(btn).toBeEnabled();
    });

    it("progresses to username step after entering 6 digits", async () => {
      await goToOtpStep();
      await userEvent.type(screen.getByPlaceholderText(/000000/i), "123456");
      await userEvent.click(screen.getByRole("button", { name: /verify otp/i }));

      await waitFor(() =>
        expect(screen.getByText(/step 3 of 3/i)).toBeInTheDocument()
      );
    });

    it("allows going back to change phone number", async () => {
      await goToOtpStep();
      await userEvent.click(screen.getByRole("button", { name: /change number/i }));
      await waitFor(() =>
        expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument()
      );
    });
  });

  // ── Step 3 ────────────────────────────────────────────────────────────
  describe("Step 3: Username + account creation", () => {
    async function goToUsernameStep() {
      mockFetch([{ json: { success: true, dev: true, devOtp: "123456" } }]);
      render(<SignupPage />);
      await userEvent.type(screen.getByPlaceholderText(/98765 43210/i), "9876543210");
      await userEvent.click(screen.getByRole("button", { name: /send otp/i }));
      await waitFor(() => screen.getByPlaceholderText(/000000/i));
      await userEvent.type(screen.getByPlaceholderText(/000000/i), "123456");
      await userEvent.click(screen.getByRole("button", { name: /verify otp/i }));
      await waitFor(() => screen.getByPlaceholderText(/cricketking99/i));
    }

    it("disables Create Account until username has ≥3 chars", async () => {
      await goToUsernameStep();
      const btn = screen.getByRole("button", { name: /create account/i });
      expect(btn).toBeDisabled();

      await userEvent.type(screen.getByPlaceholderText(/cricketking99/i), "ab");
      expect(btn).toBeDisabled();

      await userEvent.type(screen.getByPlaceholderText(/cricketking99/i), "c");
      expect(btn).toBeEnabled();
    });

    it("creates account and stores userId in localStorage", async () => {
      await goToUsernameStep();

      // Now mock the verify-otp call
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ success: true, user_id: "test-user-id", dev: true }),
      });

      await userEvent.type(screen.getByPlaceholderText(/cricketking99/i), "fanatic99");
      await userEvent.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(localStorageMock.getItem("userId")).toBe("test-user-id");
        expect(localStorageMock.getItem("username")).toBe("fanatic99");
      });
    });

    it("redirects to results page when a match was pre-selected", async () => {
      localStorageMock.setItem("selectedMatchId", "match-abc");
      await goToUsernameStep();

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ success: true, user_id: "test-user-id" }),
      });

      await userEvent.type(screen.getByPlaceholderText(/cricketking99/i), "fanatic99");
      await userEvent.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() =>
        expect(mockPush).toHaveBeenCalledWith("/results?match_id=match-abc")
      );
    });

    it("redirects to home when no match was pre-selected", async () => {
      await goToUsernameStep();

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ success: true, user_id: "test-user-id" }),
      });

      await userEvent.type(screen.getByPlaceholderText(/cricketking99/i), "fanatic99");
      await userEvent.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"));
    });

    it("shows error when account creation fails", async () => {
      await goToUsernameStep();

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({ success: false, error: "Username already taken" }),
      });

      await userEvent.type(screen.getByPlaceholderText(/cricketking99/i), "taken99");
      await userEvent.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() =>
        expect(screen.getByText(/Username already taken/i)).toBeInTheDocument()
      );
    });
  });

  // ── Dev mode banner ───────────────────────────────────────────────────
  describe("Dev mode UI", () => {
    it("shows the dev mode banner with OTP hint", () => {
      render(<SignupPage />);
      expect(screen.getByText(/Dev Mode/i)).toBeInTheDocument();
      expect(screen.getByText(/123456/)).toBeInTheDocument();
    });
  });
});
