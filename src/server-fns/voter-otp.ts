import { createServerFn } from "@tanstack/react-start";

interface DispatchEmailOtpPayload {
  email: string;
  code: string;
}

export interface DispatchEmailOtpResponse {
  success: boolean;
  message: string;
  dispatchedVia?: "resend" | "mock";
}

/**
 * Server-side OTP email dispatch using Resend API.
 * Dispatches an email containing exclusively the 6-digit code with zero links,
 * eliminating token mismatch errors caused by external link redirects.
 */
export const dispatchVoterEmailOtpServerFn = createServerFn({ method: "POST" })
  .validator((data: unknown): DispatchEmailOtpPayload => {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid payload");
    }
    const { email, code } = data as Record<string, unknown>;
    if (typeof email !== "string" || !email.includes("@")) {
      throw new Error("Invalid recipient email");
    }
    if (typeof code !== "string" || code.trim().length !== 6) {
      throw new Error("Invalid 6-digit OTP code");
    }
    return {
      email: email.trim().toLowerCase(),
      code: code.trim(),
    };
  })
  .handler(async ({ data }): Promise<DispatchEmailOtpResponse> => {
    const resendApiKey = process.env["RESEND_API_KEY"];

    if (!resendApiKey) {
      console.warn("[OTP Server] RESEND_API_KEY not configured in environment. Using mock dispatch.");
      return {
        success: true,
        message: `Verification code ready (mock dispatch): ${data.code}`,
        dispatchedVia: "mock",
      };
    }

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SHABACH 2026 Verification Code</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF9F6; color: #2B2621;">
  <div style="max-width: 480px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E8E2D9; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
    <div style="background-color: #1A3026; padding: 28px 24px; text-align: center;">
      <h1 style="margin: 0; color: #D4AF37; font-size: 26px; font-weight: 700; letter-spacing: 2px;">SHABACH 2026</h1>
      <p style="margin: 6px 0 0; color: #E8E2D9; font-size: 13px; text-transform: uppercase; tracking-wider: 1px;">Grand Finale Audience Adjudication</p>
    </div>
    
    <div style="padding: 32px 24px; text-align: center;">
      <p style="margin: 0 0 16px; font-size: 15px; color: #2B2621; font-weight: 500;">
        Here is your single-use verification code to cast your official audience vote:
      </p>
      
      <div style="margin: 20px 0; padding: 18px 24px; background-color: #F4F1EA; border: 1px solid #D4AF37; border-radius: 8px; display: inline-block;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 700; letter-spacing: 10px; color: #1A3026; padding-left: 10px;">
          ${data.code}
        </span>
      </div>
      
      <p style="margin: 20px 0 0; font-size: 13px; color: #665E55; line-height: 1.5;">
        Enter this 6-digit code on the voting screen to confirm your identity.<br>
        <strong>This code expires in 10 minutes.</strong>
      </p>
    </div>

    <div style="border-top: 1px solid #E8E2D9; padding: 16px 24px; background-color: #FAF9F6; text-align: center;">
      <p style="margin: 0; font-size: 11px; color: #8C8275; line-height: 1.4;">
        Strict single-vote policy: each verified email may vote once across the competition.<br>
        If you did not request this verification code, no further action is required.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const textBody = `
SHABACH 2026 Grand Finale — Voter Verification

Your 6-digit voter verification code is: ${data.code}

Enter this code on the voting screen to verify your email and confirm your vote.
This code is valid for 10 minutes.

Strict single-vote policy: each verified email may cast exactly one vote across the competition.
    `.trim();

    // Primary sender: mail.cornelabs.com; Secondary fallback: onboarding@resend.dev
    const sendAttempts = [
      "SHABACH 2026 <voting@mail.cornelabs.com>",
      "SHABACH 2026 <onboarding@resend.dev>",
    ];

    let lastError: string = "";

    for (const fromAddress of sendAttempts) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [data.email],
            subject: `Your SHABACH 2026 Verification Code [${data.code}]`,
            text: textBody,
            html: htmlBody,
          }),
        });

        if (response.ok) {
          const resData = (await response.json()) as { id?: string };
          console.info(`[OTP Server] Dispatched code via Resend (${fromAddress}) to ${data.email}. ID: ${resData.id}`);
          return {
            success: true,
            message: `Verification code successfully sent to ${data.email}.`,
            dispatchedVia: "resend",
          };
        }

        const errJson = (await response.json().catch(() => ({}))) as { message?: string };
        lastError = errJson.message || `HTTP ${response.status}`;
        console.warn(`[OTP Server] Failed dispatch via ${fromAddress}: ${lastError}`);
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : String(err);
        console.warn(`[OTP Server] Network error dispatching via ${fromAddress}: ${lastError}`);
      }
    }

    // If Resend failed with external domains, return informative response
    return {
      success: false,
      message: `Could not send verification email: ${lastError}`,
    };
  });
