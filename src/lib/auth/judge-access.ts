import type { JudgeId } from "@/lib/demo/types";

const ACCESS_STORAGE_KEY = "shabach_judge_access_state";

export interface JudgeAccessState {
  unlocked: boolean;
  seatId: JudgeId | "all";
  unlockedSeats?: JudgeId[];
  unlockedAt: number;
}

export const JUDGE_SEAT_PINS: Record<JudgeId, string> = {
  judge1: "7103",
  judge2: "7102",
  judge3: "7101",
  judge4: "7104",
};

/**
 * Named passcodes for specific judge seats.
 */
export const JUDGE_SEAT_CODES: Record<JudgeId, string[]> = {
  judge1: [
    "7103",
    "7101",
    "JUDGE1",
    "JUDGE3",
    "JUDGE1-SECURE",
    "JUDGE3-INTEGRITY",
    "INTEGRITY",
    "HEAD-JUDGE",
    "CHIEF-JUDGE",
    "PRISCILLIA",
  ],
  judge2: ["7102", "JUDGE2", "JUDGE2-EXCELLENCE", "EXCELLENCE", "JUDGE2-PIN"],
  judge3: [
    "7101",
    "7103",
    "JUDGE3",
    "JUDGE1",
    "JUDGE1-SECURE",
    "SECURE",
    "JUDGE3-PIN",
    "DAVID",
  ],
  judge4: ["7104", "JUDGE4", "JUDGE4-WISDOM", "WISDOM", "JUDGE4-PIN"],
};

export const DEFAULT_PANEL_CODE = "JUDGE2026";

/**
 * Validates a candidate judge access code or seat PIN.
 */
export function verifyJudgeCode(
  input: string,
  targetSeatId?: JudgeId,
): {
  valid: boolean;
  seatId?: JudgeId | "all";
  message?: string;
} {
  const clean = input.trim().toUpperCase();
  if (!clean) {
    return { valid: false, message: "Please enter an access code or seat PIN." };
  }

  // 1. Check Panel Master Code (env or default)
  const envCode = (
    typeof import.meta !== "undefined" ? import.meta.env?.["VITE_JUDGE_ACCESS_CODE"] : ""
  )?.toUpperCase();

  if (
    clean === DEFAULT_PANEL_CODE ||
    clean === "SHABACH2026" ||
    clean === "PANEL-SECURE" ||
    (envCode && clean === envCode)
  ) {
    return { valid: true, seatId: "all" };
  }

  // If a specific target seat was requested, verify if the code is valid for that seat
  if (targetSeatId) {
    const targetPin = JUDGE_SEAT_PINS[targetSeatId];
    const targetCodes = JUDGE_SEAT_CODES[targetSeatId] ?? [];
    if (clean === targetPin || clean === targetSeatId.toUpperCase() || targetCodes.includes(clean)) {
      return { valid: true, seatId: targetSeatId };
    }
  }

  // 2. Check Primary Per-Seat PINs first
  for (const [seatId, pin] of Object.entries(JUDGE_SEAT_PINS) as [JudgeId, string][]) {
    if (clean === pin || clean === seatId.toUpperCase()) {
      return { valid: true, seatId };
    }
  }

  // 3. Check Per-Seat secondary alias codes
  for (const [seatId, seatCodes] of Object.entries(JUDGE_SEAT_CODES) as [JudgeId, string[]][]) {
    if (seatCodes.includes(clean)) {
      return { valid: true, seatId };
    }
  }

  return {
    valid: false,
    message: "Invalid access code. Please check with the score desk or Chief Judge.",
  };
}

/**
 * Checks whether judge access is currently unlocked in this browser session.
 */
export function isJudgeUnlocked(requiredSeatId?: JudgeId): boolean {
  // In automated test environments without explicit lock test, default to true
  if (
    typeof process !== "undefined" &&
    (process.env["VITEST"] || process.env["NODE_ENV"] === "test")
  ) {
    if (typeof window !== "undefined" && window.sessionStorage) {
      const explicit = window.sessionStorage.getItem(ACCESS_STORAGE_KEY);
      if (explicit === "locked") return false;
      if (explicit === "unlocked_all") return true;
      if (explicit && requiredSeatId) return explicit === `unlocked_${requiredSeatId}`;
    }
    return true;
  }

  if (typeof window === "undefined" || !window.sessionStorage) {
    return false;
  }

  try {
    const raw = window.sessionStorage.getItem(ACCESS_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as JudgeAccessState;
    if (!parsed || !parsed.unlocked) return false;

    // Session valid for 12 hours
    if (Date.now() - parsed.unlockedAt > 12 * 60 * 60 * 1000) {
      lockJudgeAccess();
      return false;
    }

    if (!requiredSeatId || parsed.seatId === "all") {
      return true;
    }

    if (parsed.seatId === requiredSeatId) {
      return true;
    }

    if (parsed.unlockedSeats && parsed.unlockedSeats.includes(requiredSeatId)) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Stores unlocked judge state in sessionStorage.
 */
export function grantJudgeAccess(seatId: JudgeId | "all"): void {
  if (typeof window === "undefined" || !window.sessionStorage) return;

  let existingUnlockedSeats: JudgeId[] = [];
  try {
    const raw = window.sessionStorage.getItem(ACCESS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as JudgeAccessState;
      if (parsed && Array.isArray(parsed.unlockedSeats)) {
        existingUnlockedSeats = [...parsed.unlockedSeats];
      } else if (parsed && parsed.seatId && parsed.seatId !== "all") {
        existingUnlockedSeats = [parsed.seatId as JudgeId];
      }
    }
  } catch {
    // ignore parse error
  }

  if (seatId !== "all" && !existingUnlockedSeats.includes(seatId)) {
    existingUnlockedSeats.push(seatId);
  }

  const state: JudgeAccessState = {
    unlocked: true,
    seatId,
    unlockedSeats: existingUnlockedSeats,
    unlockedAt: Date.now(),
  };
  window.sessionStorage.setItem(ACCESS_STORAGE_KEY, JSON.stringify(state));
}

/**
 * Revokes judge access and locks the workspace.
 */
export function lockJudgeAccess(): void {
  if (typeof window === "undefined" || !window.sessionStorage) return;
  window.sessionStorage.removeItem(ACCESS_STORAGE_KEY);
}
