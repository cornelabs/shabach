import { describe, expect, it } from "vitest";

import { isValidEmail, requestVoterOtp, verifyVoterOtp } from "@/lib/auth/voter-verification";

describe("Voter Identity & OTP Verification Service", () => {
  it("validates proper email formats", () => {
    expect(isValidEmail("voter@example.com")).toBe(true);
    expect(isValidEmail("praise.adebayo@yaf.church")).toBe(true);
    expect(isValidEmail("invalid-email")).toBe(false);
    expect(isValidEmail("@missing-username.com")).toBe(false);
    expect(isValidEmail("missing-domain@")).toBe(false);
  });

  it("requests OTP code and receives a valid 6-digit code in demo mode", async () => {
    const email = "test1@shabach.org";
    const res = await requestVoterOtp(email);

    expect(res.success).toBe(true);
    expect(res.mockCode).toBeDefined();
    expect(res.mockCode).toMatch(/^\d{6}$/);
    expect(res.expiresInSeconds).toBe(15 * 60);
  });

  it("successfully verifies with matching OTP code and returns voterToken", async () => {
    const email = "test2@shabach.org";
    const req = await requestVoterOtp(email);
    expect(req.success).toBe(true);
    const code = req.mockCode!;

    const verifyRes = await verifyVoterOtp(email, code);
    expect(verifyRes.success).toBe(true);
    expect(verifyRes.voterToken).toBeDefined();
    expect(verifyRes.voterEmail).toBe(email);
  });

  it("rejects invalid OTP codes with attempts decrement", async () => {
    const email = "test3@shabach.org";
    await requestVoterOtp(email);

    const badVerify = await verifyVoterOtp(email, "000000");
    expect(badVerify.success).toBe(false);
    expect(badVerify.message).toMatch(/Incorrect code/);
  });

  it("enforces replay protection: prevents code reuse after successful verification", async () => {
    const email = "test4@shabach.org";
    const req = await requestVoterOtp(email);
    const code = req.mockCode!;

    const firstVerify = await verifyVoterOtp(email, code);
    expect(firstVerify.success).toBe(true);

    const replayVerify = await verifyVoterOtp(email, code);
    expect(replayVerify.success).toBe(false);
    expect(replayVerify.message).toMatch(/No active verification request found/);
  });

  it("enforces rate limits on excessive OTP requests within the window", async () => {
    const email = "ratelimit@shabach.org";

    const req1 = await requestVoterOtp(email);
    expect(req1.success).toBe(true);

    const req2 = await requestVoterOtp(email);
    expect(req2.success).toBe(true);

    const req3 = await requestVoterOtp(email);
    expect(req3.success).toBe(true);

    // 4th request in the same window should be rejected
    const req4 = await requestVoterOtp(email);
    expect(req4.success).toBe(false);
    expect(req4.message).toMatch(/Too many verification requests/);
  });
});
