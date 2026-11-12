import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import {
  verifyJudgeCode,
  isJudgeUnlocked,
  grantJudgeAccess,
  lockJudgeAccess,
  DEFAULT_PANEL_CODE,
  JUDGE_SEAT_PINS,
} from "@/lib/auth/judge-access";
import { JudgeAccessGate } from "@/components/judge/judge-access-gate";

// Mock TanStack Router Link
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

describe("Judge Access Protection & PIN Verification", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe("Code Verification Logic", () => {
    it("rejects empty or whitespace codes", () => {
      expect(verifyJudgeCode("").valid).toBe(false);
      expect(verifyJudgeCode("   ").valid).toBe(false);
    });

    it("accepts default panel master code (case-insensitive)", () => {
      const res = verifyJudgeCode(DEFAULT_PANEL_CODE);
      expect(res.valid).toBe(true);
      expect(res.seatId).toBe("all");

      const resLower = verifyJudgeCode(DEFAULT_PANEL_CODE.toLowerCase());
      expect(resLower.valid).toBe(true);
      expect(resLower.seatId).toBe("all");
    });

    it("accepts SHABACH2026 as an authorized master code", () => {
      const res = verifyJudgeCode("SHABACH2026");
      expect(res.valid).toBe(true);
      expect(res.seatId).toBe("all");
    });

    it("accepts each individual judge seat PIN correctly", () => {
      expect(verifyJudgeCode(JUDGE_SEAT_PINS.judge1)).toEqual({ valid: true, seatId: "judge1" });
      expect(verifyJudgeCode(JUDGE_SEAT_PINS.judge2)).toEqual({ valid: true, seatId: "judge2" });
      expect(verifyJudgeCode(JUDGE_SEAT_PINS.judge3)).toEqual({ valid: true, seatId: "judge3" });
      expect(verifyJudgeCode(JUDGE_SEAT_PINS.judge4)).toEqual({ valid: true, seatId: "judge4" });
    });

    it("accepts 6-character alphanumeric passcodes directly (case-insensitive)", () => {
      expect(verifyJudgeCode("P7X2M9")).toEqual({ valid: true, seatId: "judge1" });
      expect(verifyJudgeCode("p7x2m9")).toEqual({ valid: true, seatId: "judge1" });
      expect(verifyJudgeCode("G4K8V3")).toEqual({ valid: true, seatId: "judge2" });
      expect(verifyJudgeCode("D9W5T2")).toEqual({ valid: true, seatId: "judge3" });
      expect(verifyJudgeCode("S3R7B6")).toEqual({ valid: true, seatId: "judge4" });
    });

    it("preserves backward compatibility with legacy aliases", () => {
      expect(verifyJudgeCode("7103")).toEqual({ valid: true, seatId: "judge1" });
      expect(verifyJudgeCode("7102")).toEqual({ valid: true, seatId: "judge2" });
      expect(verifyJudgeCode("7101", "judge3")).toEqual({ valid: true, seatId: "judge3" });
      expect(verifyJudgeCode("7104")).toEqual({ valid: true, seatId: "judge4" });
    });

    it("accepts ADMIN2026 as panel master code", () => {
      expect(verifyJudgeCode("ADMIN2026")).toEqual({ valid: true, seatId: "all" });
    });

    it("rejects invalid codes with clear message", () => {
      const res = verifyJudgeCode("WRONG_CODE_999");
      expect(res.valid).toBe(false);
      expect(res.message).toMatch(/Invalid access code/i);
    });
  });

  describe("JudgeAccessGate UI Component", () => {
    it("renders the access gate with title, prompt, and secure PIN input", () => {
      render(<JudgeAccessGate />);

      expect(screen.getByText("Judges' Workspace Access")).toBeInTheDocument();
      expect(
        screen.getByText(/Scoring is restricted to appointed competition judges/i),
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter access code or 4-digit PIN...")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Unlock Workspace/i })).toBeInTheDocument();
      expect(screen.getByText(/Seat PINs and access codes are distributed privately/i)).toBeInTheDocument();
    });

    it("shows error when entering invalid code", async () => {
      render(<JudgeAccessGate />);

      const input = screen.getByPlaceholderText("Enter access code or 4-digit PIN...");
      fireEvent.change(input, { target: { value: "INVALID_PIN" } });

      const submitBtn = screen.getByRole("button", { name: /Unlock Workspace/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Invalid access code/i)).toBeInTheDocument();
      });
    });

    it("successfully unlocks when entering valid master code", async () => {
      const onUnlocked = vi.fn();
      render(<JudgeAccessGate onUnlocked={onUnlocked} />);

      const input = screen.getByPlaceholderText(/Enter access code or 4-digit PIN/i);
      fireEvent.change(input, { target: { value: DEFAULT_PANEL_CODE } });

      const submitBtn = screen.getByRole("button", { name: /Unlock Workspace/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(onUnlocked).toHaveBeenCalledWith("all");
      });
    });

    it("rejects seat mismatch when a specific seat PIN is required", async () => {
      const onUnlocked = vi.fn();
      // Render gate specifically for judge1
      render(<JudgeAccessGate requiredSeatId="judge1" onUnlocked={onUnlocked} />);

      const input = screen.getByPlaceholderText(/Enter access code or 4-digit PIN/i);
      // Try entering judge2's PIN
      fireEvent.change(input, { target: { value: JUDGE_SEAT_PINS.judge2 } });

      const submitBtn = screen.getByRole("button", { name: /Unlock Workspace/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/This access code is for a different seat/i)).toBeInTheDocument();
        expect(onUnlocked).not.toHaveBeenCalled();
      });
    });

    it("unlocks specific seat when entering matching seat PIN", async () => {
      const onUnlocked = vi.fn();
      render(<JudgeAccessGate requiredSeatId="judge1" onUnlocked={onUnlocked} />);

      const input = screen.getByPlaceholderText(/Enter access code or 4-digit PIN/i);
      fireEvent.change(input, { target: { value: JUDGE_SEAT_PINS.judge1 } });

      const submitBtn = screen.getByRole("button", { name: /Unlock Workspace/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(onUnlocked).toHaveBeenCalledWith("judge1");
      });
    });
  });
});
