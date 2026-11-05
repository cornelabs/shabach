import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import {
  DEFAULT_ADMIN_CODE,
  FALLBACK_ADMIN_CODES,
  isAdminUnlocked,
  lockAdminAccess,
  unlockAdminAccess,
  verifyAdminCode,
} from "@/lib/auth/admin-access";
import { AdminAccessGate } from "@/components/admin/admin-access-gate";

// Mock TanStack Router Link
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

describe("Admin Access Protection & Gate", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  describe("Admin Code Verification Logic", () => {
    it("rejects empty or whitespace codes", () => {
      expect(verifyAdminCode("").valid).toBe(false);
      expect(verifyAdminCode("   ").valid).toBe(false);
    });

    it("accepts default admin code (case-insensitive)", () => {
      expect(verifyAdminCode("admin2026").valid).toBe(true);
      expect(verifyAdminCode("ADMIN2026").valid).toBe(true);
    });

    it("accepts fallback admin codes", () => {
      for (const code of FALLBACK_ADMIN_CODES) {
        expect(verifyAdminCode(code).valid).toBe(true);
        expect(verifyAdminCode(code.toLowerCase()).valid).toBe(true);
      }
    });

    it("rejects invalid admin codes with a helpful message", () => {
      const res = verifyAdminCode("WRONG_CODE");
      expect(res.valid).toBe(false);
      expect(res.message).toMatch(/Invalid administrator access code/i);
    });
  });

  describe("Admin Session Storage", () => {
    it("unlocks and locks session storage cleanly", () => {
      unlockAdminAccess();
      const raw = window.sessionStorage.getItem("shabach_admin_access_state");
      expect(raw).toBeTruthy();
      expect(JSON.parse(raw!).unlocked).toBe(true);

      lockAdminAccess();
      expect(window.sessionStorage.getItem("shabach_admin_access_state")).toBeNull();
    });
  });

  describe("AdminAccessGate UI Component", () => {
    it("renders the access gate with title, prompt, and secure input", () => {
      render(<AdminAccessGate />);

      expect(screen.getByText("Score Desk Administration")).toBeInTheDocument();
      expect(
        screen.getByText(/Access to the SHABACH 2026 score desk and master collation is restricted/i),
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Enter administrator code/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Unlock Score Desk/i })).toBeInTheDocument();
    });

    it("shows error when entering invalid administrator code", async () => {
      render(<AdminAccessGate />);

      const input = screen.getByPlaceholderText(/Enter administrator code/i);
      fireEvent.change(input, { target: { value: "INVALID_ADMIN_CODE" } });

      const submitBtn = screen.getByRole("button", { name: /Unlock Score Desk/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Invalid administrator access code/i)).toBeInTheDocument();
      });
    });

    it("unlocks when entering valid administrator code", async () => {
      const onUnlocked = vi.fn();
      render(<AdminAccessGate onUnlocked={onUnlocked} />);

      const input = screen.getByPlaceholderText(/Enter administrator code/i);
      fireEvent.change(input, { target: { value: DEFAULT_ADMIN_CODE } });

      const submitBtn = screen.getByRole("button", { name: /Unlock Score Desk/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(onUnlocked).toHaveBeenCalled();
      });
    });
  });
});
