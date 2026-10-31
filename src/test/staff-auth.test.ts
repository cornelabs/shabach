import { describe, expect, it } from "vitest";
import {
  assertIsAssignedJudge,
  assertIsOrganiser,
  assertIsStaff,
  clearClientStaffSession,
  extractTokenFromRequest,
  getClientStaffSession,
  getClientStaffUser,
  getStaffSession,
  isJudgeRole,
  isOrganiserRole,
  loginStaff,
  normalizeJudgeId,
  setClientStaffSession,
  StaffAuthError,
  type StaffSessionUser,
} from "@/lib/auth/staff-auth";

describe("Staff Authentication & Request-Scoped Session Service", () => {
  describe("Role Normalization & Classification", () => {
    it("normalizes diverse judge identifiers accurately", () => {
      expect(normalizeJudgeId("judge1")).toBe("judge1");
      expect(normalizeJudgeId("judge_1")).toBe("judge1");
      expect(normalizeJudgeId("JUDGE_2")).toBe("judge2");
      expect(normalizeJudgeId("judge3")).toBe("judge3");
      expect(normalizeJudgeId("judge_4")).toBe("judge4");
      expect(normalizeJudgeId("organiser")).toBeUndefined();
      expect(normalizeJudgeId("unknown")).toBeUndefined();
    });

    it("identifies organiser and score desk roles", () => {
      expect(isOrganiserRole("organiser")).toBe(true);
      expect(isOrganiserRole("organizer")).toBe(true);
      expect(isOrganiserRole("score_desk")).toBe(true);
      expect(isOrganiserRole("judge1")).toBe(false);
      expect(isOrganiserRole(null)).toBe(false);
    });

    it("identifies judge roles correctly", () => {
      expect(isJudgeRole("judge1")).toBe(true);
      expect(isJudgeRole("judge_4")).toBe(true);
      expect(isJudgeRole("organiser")).toBe(false);
    });
  });

  describe("Staff Login Flow", () => {
    it("logs in canonical judges (judge1..judge4)", async () => {
      for (const [judgeNum, judgeId] of [
        ["1", "judge1"],
        ["2", "judge2"],
        ["3", "judge3"],
        ["4", "judge4"],
      ] as const) {
        const res = await loginStaff({ email: `judge${judgeNum}@shabach.org` });
        expect(res.success).toBe(true);
        expect(res.user).toBeDefined();
        expect(res.user?.judgeId).toBe(judgeId);
        expect(res.user?.isJudge).toBe(true);
        expect(res.user?.isOrganiser).toBe(false);
        expect(res.token).toBeDefined();
      }
    });

    it("logs in organisers and score desk officers", async () => {
      const orgRes = await loginStaff({ email: "organiser@shabach.org" });
      expect(orgRes.success).toBe(true);
      expect(orgRes.user?.isOrganiser).toBe(true);
      expect(orgRes.user?.isJudge).toBe(false);

      const deskRes = await loginStaff({ email: "desk@shabach.org" });
      expect(deskRes.success).toBe(true);
      expect(deskRes.user?.isScoreDesk).toBe(true);
      expect(deskRes.user?.isOrganiser).toBe(true);
    });

    it("supports roleHint for demo accounts", async () => {
      const res = await loginStaff({
        email: "panelist.guest@church.org",
        roleHint: "judge_3",
      });
      expect(res.success).toBe(true);
      expect(res.user?.judgeId).toBe("judge3");
    });

    it("rejects unregistered emails without role hint", async () => {
      const res = await loginStaff({ email: "intruder@external.com" });
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/Unrecognized staff email/);
    });
  });

  describe("Request-Scoped Session Extraction (Zero SSR Leakage)", () => {
    it("extracts token from Authorization: Bearer header", () => {
      const headers = new Headers();
      headers.set("Authorization", "Bearer test-token-123");
      expect(extractTokenFromRequest(headers)).toBe("test-token-123");

      const req = new Request("https://shabach.org/api", {
        headers: { Authorization: "Bearer req-token-456" },
      });
      expect(extractTokenFromRequest(req)).toBe("req-token-456");
    });

    it("extracts token from x-shabach-staff-token custom header", () => {
      const headers = new Headers();
      headers.set("x-shabach-staff-token", "custom-header-token");
      expect(extractTokenFromRequest(headers)).toBe("custom-header-token");
    });

    it("extracts token from cookie header", () => {
      const headers = new Headers();
      headers.set("Cookie", "other=abc; shabach_staff_session=cookie-staff-token; foo=bar");
      expect(extractTokenFromRequest(headers)).toBe("cookie-staff-token");
    });

    it("resolves user session strictly from the request context without shared mutable state", async () => {
      const judge1Login = await loginStaff({ email: "judge1@shabach.org" });
      const judge2Login = await loginStaff({ email: "judge2@shabach.org" });

      // Request 1: Judge 1
      const session1 = await getStaffSession(judge1Login.token);
      expect(session1?.judgeId).toBe("judge1");

      // Request 2: Judge 2
      const session2 = await getStaffSession(judge2Login.token);
      expect(session2?.judgeId).toBe("judge2");

      // Request 3: Unauthenticated request
      const session3 = await getStaffSession(null);
      expect(session3).toBeNull();

      // Ensure session 1 was not overwritten
      const rechecked1 = await getStaffSession(judge1Login.token);
      expect(rechecked1?.judgeId).toBe("judge1");
    });

    it("rejects forged, tampered, or expired tokens", async () => {
      const forged = "shabach_staff_invalidpayload.signature";
      expect(await getStaffSession(forged)).toBeNull();

      expect(await getStaffSession("malformed-token")).toBeNull();
    });
  });

  describe("Blind Judging & Role Authorization Assertions", () => {
    const judge1User: StaffSessionUser = {
      id: "u-judge-1",
      email: "judge1@shabach.org",
      fullName: "Judge 1",
      role: "judge_1",
      judgeId: "judge1",
      isOrganiser: false,
      isJudge: true,
      isScoreDesk: false,
      eventId: "00000000-0000-0000-0000-000000002026",
    };

    const judge2User: StaffSessionUser = {
      id: "u-judge-2",
      email: "judge2@shabach.org",
      fullName: "Judge 2",
      role: "judge_2",
      judgeId: "judge2",
      isOrganiser: false,
      isJudge: true,
      isScoreDesk: false,
      eventId: "00000000-0000-0000-0000-000000002026",
    };

    const organiserUser: StaffSessionUser = {
      id: "u-organiser",
      email: "organiser@shabach.org",
      fullName: "Lead Admin",
      role: "organiser",
      isOrganiser: true,
      isJudge: false,
      isScoreDesk: false,
      eventId: "00000000-0000-0000-0000-000000002026",
    };

    it("assertIsStaff verifies presence of authenticated staff", () => {
      expect(() => assertIsStaff(judge1User)).not.toThrow();
      expect(() => assertIsStaff(null)).toThrow(StaffAuthError);
    });

    it("assertIsOrganiser allows organisers and denies judges", () => {
      expect(() => assertIsOrganiser(organiserUser)).not.toThrow();
      expect(() => assertIsOrganiser(judge1User)).toThrow(StaffAuthError);
    });

    it("assertIsAssignedJudge enforces blind judging isolation", () => {
      // Judge 1 accessing Judge 1's cards: Allowed
      expect(() => assertIsAssignedJudge(judge1User, "judge1")).not.toThrow();

      // Judge 1 accessing Judge 2's cards: Forbidden (blind judging)
      expect(() => assertIsAssignedJudge(judge1User, "judge2")).toThrow(
        /Blind judging isolation prevents access/,
      );

      // Judge 2 accessing Judge 1's cards: Forbidden
      expect(() => assertIsAssignedJudge(judge2User, "judge1")).toThrow(StaffAuthError);

      // Organiser has supervisory access to all judges' cards
      expect(() => assertIsAssignedJudge(organiserUser, "judge1")).not.toThrow();
      expect(() => assertIsAssignedJudge(organiserUser, "judge2")).not.toThrow();
    });
  });

  describe("Browser Client-Side Session Scoping", () => {
    it("stores and clears staff session in client storage", () => {
      const mockUser: StaffSessionUser = {
        id: "client-test-id",
        email: "judge3@shabach.org",
        fullName: "Judge 3",
        role: "judge_3",
        judgeId: "judge3",
        isOrganiser: false,
        isJudge: true,
        isScoreDesk: false,
        eventId: "00000000-0000-0000-0000-000000002026",
      };

      setClientStaffSession("session-token-xyz", mockUser);
      expect(getClientStaffUser()?.judgeId).toBe("judge3");

      clearClientStaffSession();
      expect(getClientStaffUser()).toBeNull();
    });
  });
});
