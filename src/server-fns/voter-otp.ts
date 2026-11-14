import { createServerFn } from "@tanstack/react-start";

export interface DispatchEmailOtpPayload {
  email: string;
  code: string;
}

export interface DispatchEmailOtpResponse {
  success: boolean;
  message: string;
  dispatchedVia?: "zeptomail" | "brevo" | "resend" | "mock";
}

interface ProviderResult {
  ok: boolean;
  id?: string;
  error?: string;
}

/**
 * Dispatches an email via Zoho ZeptoMail REST API v1.1.
 * ZeptoMail provides high-volume transactional email capacity (up to 10,000 emails).
 */
export async function sendViaZeptoMail(params: {
  apiKey: string;
  senderName: string;
  senderEmail: string;
  toEmail: string;
  subject: string;
  text: string;
  html: string;
  apiUrl?: string;
}): Promise<ProviderResult> {
  try {
    const rawKey = params.apiKey.trim();
    const authHeader = rawKey.startsWith("Zoho-enczapikey ")
      ? rawKey
      : `Zoho-enczapikey ${rawKey}`;

    const url = params.apiUrl || "https://api.zeptomail.com/v1.1/email";

    const res = await fetch(url, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        authorization: authHeader,
      },
      body: JSON.stringify({
        from: {
          address: params.senderEmail,
          name: params.senderName,
        },
        to: [
          {
            email_address: {
              address: params.toEmail,
            },
          },
        ],
        subject: params.subject,
        htmlbody: params.html,
        textbody: params.text,
      }),
    });

    if (res.ok || res.status === 201) {
      const data = (await res.json().catch(() => ({}))) as {
        request_id?: string;
        data?: Array<{ response?: { id?: string } }>;
      };
      const messageId = data.data?.[0]?.response?.id || data.request_id || "zeptomail_success";
      return { ok: true, id: messageId };
    }

    const errJson = (await res.json().catch(() => ({}))) as {
      error?: { message?: string; details?: unknown[] };
      message?: string;
    };
    const errText = errJson.error?.message || errJson.message || `HTTP ${res.status}`;
    return { ok: false, error: errText };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Dispatches an email via Brevo REST API v3.
 * Brevo Free Plan offers 300 free emails per day with zero credit card required.
 */
export async function sendViaBrevo(params: {
  apiKey: string;
  senderName: string;
  senderEmail: string;
  toEmail: string;
  subject: string;
  text: string;
  html: string;
}): Promise<ProviderResult> {
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": params.apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: params.senderName,
          email: params.senderEmail,
        },
        to: [{ email: params.toEmail }],
        subject: params.subject,
        htmlContent: params.html,
        textContent: params.text,
      }),
    });

    if (res.ok || res.status === 201) {
      const data = (await res.json().catch(() => ({}))) as { messageId?: string };
      return { ok: true, id: data.messageId };
    }

    const errJson = (await res.json().catch(() => ({}))) as { message?: string; code?: string };
    const errText = errJson.message || `HTTP ${res.status}`;
    return { ok: false, error: errText };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Dispatches an email via Resend API.
 * Resend Free Plan offers 100 free emails per day.
 */
export async function sendViaResend(params: {
  apiKey: string;
  fromAddresses: string[];
  toEmail: string;
  subject: string;
  text: string;
  html: string;
}): Promise<ProviderResult> {
  let lastError = "";
  for (const fromAddress of params.fromAddresses) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [params.toEmail],
          subject: params.subject,
          text: params.text,
          html: params.html,
        }),
      });

      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as { id?: string };
        return { ok: true, id: data.id };
      }

      const errJson = (await res.json().catch(() => ({}))) as { message?: string };
      lastError = errJson.message || `HTTP ${res.status}`;
      console.warn(`[OTP Server] Failed Resend dispatch via ${fromAddress}: ${lastError}`);
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.warn(`[OTP Server] Network error dispatching via ${fromAddress}: ${lastError}`);
    }
  }
  return { ok: false, error: lastError };
}

/**
 * Core business logic for dispatching voter OTP verification emails.
 * Primary: Zoho ZeptoMail (high-volume transactional email, up to 10,000 emails).
 * Secondary fallback: Brevo (300/day free limit).
 * Tertiary fallback: Resend (100/day free limit).
 */
export async function dispatchVoterEmailOtpLogic(
  data: DispatchEmailOtpPayload,
  envOverride?: {
    zeptomailApiKey?: string;
    zeptomailSenderEmail?: string;
    zeptomailSenderName?: string;
    zeptomailApiUrl?: string;
    brevoApiKey?: string;
    brevoSenderEmail?: string;
    brevoSenderName?: string;
    resendApiKey?: string;
    resendSenderEmail?: string;
  }
): Promise<DispatchEmailOtpResponse> {
  const zeptomailApiKey =
    envOverride?.zeptomailApiKey ??
    process.env["ZEPTOMAIL_API_KEY"] ??
    process.env["ZEPTOMAIL_SEND_MAIL_TOKEN"] ??
    process.env["ZEPTO_API_KEY"];
  const brevoApiKey = envOverride?.brevoApiKey ?? process.env["BREVO_API_KEY"];
  const resendApiKey = envOverride?.resendApiKey ?? process.env["RESEND_API_KEY"];

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

  const emailSubject = `Your SHABACH 2026 Verification Code [${data.code}]`;

  // =========================================================================
  // 1. PRIMARY DISPATCH: Brevo (v3 REST API)
  // =========================================================================
  if (brevoApiKey) {
    const brevoSenderEmail =
      envOverride?.brevoSenderEmail ??
      process.env["BREVO_SENDER_EMAIL"] ??
      process.env["VOTER_OTP_SENDER_EMAIL"] ??
      "voting@mail.cornelabs.com";
    const brevoSenderName =
      envOverride?.brevoSenderName ?? process.env["BREVO_SENDER_NAME"] ?? "SHABACH 2026";

    const brevoResult = await sendViaBrevo({
      apiKey: brevoApiKey,
      senderName: brevoSenderName,
      senderEmail: brevoSenderEmail,
      toEmail: data.email,
      subject: emailSubject,
      text: textBody,
      html: htmlBody,
    });

    if (brevoResult.ok) {
      console.info(
        `[OTP Server] Dispatched code via Brevo (${brevoSenderEmail}) to ${data.email}. ID: ${brevoResult.id}`
      );
      return {
        success: true,
        message: `Verification code successfully sent to ${data.email}.`,
        dispatchedVia: "brevo",
      };
    }

    console.warn(
      `[OTP Server] Brevo dispatch error (${brevoResult.error}). Checking fallback provider (Resend)...`
    );
  }

  // =========================================================================
  // 2. SECONDARY FALLBACK: Resend (100 emails/day free limit)
  // =========================================================================
  if (resendApiKey) {
    const customSender =
      envOverride?.resendSenderEmail ??
      process.env["RESEND_SENDER_EMAIL"] ??
      process.env["VOTER_OTP_SENDER_EMAIL"];
    const sendAttempts = [
      customSender,
      "SHABACH 2026 <voting@mail.cornelabs.com>",
      "SHABACH 2026 <onboarding@resend.dev>",
    ].filter(Boolean) as string[];

    const resendResult = await sendViaResend({
      apiKey: resendApiKey,
      fromAddresses: sendAttempts,
      toEmail: data.email,
      subject: emailSubject,
      text: textBody,
      html: htmlBody,
    });

    if (resendResult.ok) {
      console.info(
        `[OTP Server] Dispatched code via Resend to ${data.email}. ID: ${resendResult.id}`
      );
      return {
        success: true,
        message: `Verification code successfully sent to ${data.email}.`,
        dispatchedVia: "resend",
      };
    }

    console.warn(
      `[OTP Server] Resend dispatch error (${resendResult.error}). Checking fallback provider (ZeptoMail)...`
    );
  }

  // =========================================================================
  // 3. TERTIARY / FINAL FALLBACK: Zoho ZeptoMail (high-volume transactional)
  // =========================================================================
  if (zeptomailApiKey) {
    const zeptoSenderEmail =
      envOverride?.zeptomailSenderEmail ??
      process.env["ZEPTOMAIL_SENDER_EMAIL"] ??
      process.env["ZEPTO_SENDER_EMAIL"] ??
      process.env["VOTER_OTP_SENDER_EMAIL"] ??
      "voting@mail.cornelabs.com";
    const zeptoSenderName =
      envOverride?.zeptomailSenderName ??
      process.env["ZEPTOMAIL_SENDER_NAME"] ??
      process.env["ZEPTO_SENDER_NAME"] ??
      "SHABACH 2026";
    const zeptoApiUrl =
      envOverride?.zeptomailApiUrl ?? process.env["ZEPTOMAIL_API_URL"];

    const zeptoResult = await sendViaZeptoMail({
      apiKey: zeptomailApiKey,
      senderName: zeptoSenderName,
      senderEmail: zeptoSenderEmail,
      toEmail: data.email,
      subject: emailSubject,
      text: textBody,
      html: htmlBody,
      apiUrl: zeptoApiUrl,
    });

    if (zeptoResult.ok) {
      console.info(
        `[OTP Server] Dispatched code via ZeptoMail (${zeptoSenderEmail}) to ${data.email}. ID: ${zeptoResult.id}`
      );
      return {
        success: true,
        message: `Verification code successfully sent to ${data.email}.`,
        dispatchedVia: "zeptomail",
      };
    }

    console.warn(
      `[OTP Server] ZeptoMail dispatch error (${zeptoResult.error}). All email providers exhausted.`
    );
  }

  // =========================================================================
  // 4. DEVELOPMENT / TEST MOCK DISPATCH (when no API keys are present)
  // =========================================================================
  if (!brevoApiKey && !resendApiKey && !zeptomailApiKey) {
    console.warn(
      "[OTP Server] Neither BREVO_API_KEY, RESEND_API_KEY, nor ZEPTOMAIL_API_KEY configured in environment. Using mock dispatch."
    );
    return {
      success: true,
      message: `Verification code ready (mock dispatch): ${data.code}`,
      dispatchedVia: "mock",
    };
  }

  // Both configured providers failed
  return {
    success: false,
    message:
      "Could not dispatch verification email via configured providers. Please check email address and try again.",
  };
}

/**
 * Server-side OTP email dispatch using Brevo (300/day free) and Resend (100/day free).
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
    return dispatchVoterEmailOtpLogic(data);
  });
