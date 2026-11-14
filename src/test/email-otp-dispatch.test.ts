import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { dispatchVoterEmailOtpLogic } from "@/server-fns/voter-otp";

describe("Transactional Email OTP Dispatch (ZeptoMail, Brevo & Resend)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env["ZEPTOMAIL_API_KEY"];
    delete process.env["ZEPTOMAIL_SEND_MAIL_TOKEN"];
    delete process.env["ZEPTOMAIL_SENDER_EMAIL"];
    delete process.env["BREVO_API_KEY"];
    delete process.env["RESEND_API_KEY"];
    delete process.env["BREVO_SENDER_EMAIL"];
    delete process.env["RESEND_SENDER_EMAIL"];
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("falls back to mock dispatch when no email API keys are set", async () => {
    const res = await dispatchVoterEmailOtpLogic({
      email: "voter@example.com",
      code: "123456",
    });

    expect(res.success).toBe(true);
    expect(res.dispatchedVia).toBe("mock");
    expect(res.message).toContain("123456");
  });

  it("dispatches successfully via Zoho ZeptoMail REST API v1.1 when ZEPTOMAIL_API_KEY is configured", async () => {
    process.env["ZEPTOMAIL_API_KEY"] = "mock-zeptomail-token-12345";
    process.env["ZEPTOMAIL_SENDER_EMAIL"] = "noreply@shabach.org";

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        message: "success",
        request_id: "req_zepto_98765",
        data: [{ code: "EM_104", response: { id: "zepto_msg_001" } }],
      }),
    } as Response);

    const res = await dispatchVoterEmailOtpLogic({
      email: "audience@fellowship.org",
      code: "456789",
    });

    expect(res.success).toBe(true);
    expect(res.dispatchedVia).toBe("zeptomail");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, options] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.zeptomail.com/v1.1/email");
    expect((options?.headers as Record<string, string>)?.authorization).toBe(
      "Zoho-enczapikey mock-zeptomail-token-12345"
    );

    const body = JSON.parse(options?.body as string);
    expect(body.to[0].email_address.address).toBe("audience@fellowship.org");
    expect(body.from.address).toBe("noreply@shabach.org");
    expect(body.subject).toContain("456789");
  });

  it("falls back from ZeptoMail to Brevo when ZeptoMail fails", async () => {
    process.env["ZEPTOMAIL_API_KEY"] = "mock-zepto-failing";
    process.env["ZEPTOMAIL_SENDER_EMAIL"] = "noreply@shabach.org";
    process.env["BREVO_API_KEY"] = "xkeysib-brevo-working";

    // Call 1: ZeptoMail error
    // Call 2: Brevo success
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: "Invalid Send Mail Token" } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ messageId: "<brevo-fallback-msg>" }),
      } as Response);

    const res = await dispatchVoterEmailOtpLogic({
      email: "voter@domain.com",
      code: "112233",
    });

    expect(res.success).toBe(true);
    expect(res.dispatchedVia).toBe("brevo");
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [zeptoUrl] = fetchMock.mock.calls[0]!;
    const [brevoUrl] = fetchMock.mock.calls[1]!;
    expect(zeptoUrl).toBe("https://api.zeptomail.com/v1.1/email");
    expect(brevoUrl).toBe("https://api.brevo.com/v3/smtp/email");
  });

  it("dispatches successfully via Brevo REST API v3 when BREVO_API_KEY is configured", async () => {
    process.env["BREVO_API_KEY"] = "xkeysib-mock-test-key";
    process.env["BREVO_SENDER_EMAIL"] = "voting@mail.cornelabs.com";

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ messageId: "<20261114.brevo.test@smtp.mailin.fr>" }),
    } as Response);

    const res = await dispatchVoterEmailOtpLogic({
      email: "audience@fellowship.org",
      code: "789123",
    });

    expect(res.success).toBe(true);
    expect(res.dispatchedVia).toBe("brevo");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, options] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    expect((options?.headers as Record<string, string>)?.["api-key"]).toBe("xkeysib-mock-test-key");

    const body = JSON.parse(options?.body as string);
    expect(body.to).toEqual([{ email: "audience@fellowship.org" }]);
    expect(body.sender.email).toBe("voting@mail.cornelabs.com");
    expect(body.subject).toContain("789123");
  });

  it("falls back to Resend when Brevo returns an error or quota limit", async () => {
    process.env["BREVO_API_KEY"] = "xkeysib-brevo-exhausted";
    process.env["RESEND_API_KEY"] = "re_resend_fallback_key";

    // 1st call (Brevo): fails with daily quota limit
    // 2nd call (Resend): succeeds
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: "Daily quota limit reached for account" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: "resend_msg_12345" }),
      } as Response);

    const res = await dispatchVoterEmailOtpLogic({
      email: "voter.backup@gmail.com",
      code: "654321",
    });

    expect(res.success).toBe(true);
    expect(res.dispatchedVia).toBe("resend");
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [brevoUrl] = fetchMock.mock.calls[0]!;
    const [resendUrl, resendOpts] = fetchMock.mock.calls[1]!;

    expect(brevoUrl).toBe("https://api.brevo.com/v3/smtp/email");
    expect(resendUrl).toBe("https://api.resend.com/emails");
    expect((resendOpts?.headers as Record<string, string>)?.Authorization).toBe(
      "Bearer re_resend_fallback_key"
    );
  });

  it("handles failure gracefully when both providers fail", async () => {
    process.env["BREVO_API_KEY"] = "xkeysib-failing-key";
    process.env["RESEND_API_KEY"] = "re_failing_key";

    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: "Brevo internal error" }),
      } as Response)
      .mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: "Resend internal error" }),
      } as Response);

    const res = await dispatchVoterEmailOtpLogic({
      email: "voter.fail@gmail.com",
      code: "999888",
    });

    expect(res.success).toBe(false);
    expect(res.message).toMatch(/Could not dispatch verification email/);
  });
});
