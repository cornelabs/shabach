/**
 * SHABACH 2026 Voter Identity & OTP Verification Service
 * Handles Email OTP issuance, verification, rate limiting, replay protection,
 * and single-vote enforcement.
 *
 * In Live mode: Interfaces with Supabase Auth OTP (signInWithOtp, verifyOtp)
 * or authoritative Postgres RPC. Never fakes success when unconfigured.
 * In Demo mode: In-memory simulation with full rate limiting and replay prevention.
 */

import { DEFAULT_EVENT_ID, getSupabaseClient, isSupabaseConfigured } from "@/lib/db/supabase";

export interface OtpRequestResult {
  success: boolean;
  message: string;
  expiresInSeconds?: number;
  mockCode?: string; // Provided only in mock/demo mode for easy testing
  isConfigured?: boolean;
}

export interface OtpVerifyResult {
  success: boolean;
  message: string;
  voterToken?: string | undefined;
  voterEmail?: string | undefined;
  sessionToken?: string | undefined;
}

export interface VoterStatusResult {
  hasVoted: boolean;
  voterToken: string;
  eventId: string;
}

interface StoredOtpRecord {
  email: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
  verified: boolean;
}

interface RateLimitRecord {
  count: number;
  windowStart: number;
}

const OTP_TTL_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 3;
const MAX_VERIFY_ATTEMPTS = 5;

// In-memory store for Demo OTP and rate limits
const otpStore = new Map<string, StoredOtpRecord>();
const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Cryptographic SHA-256 hash calculation for browser and node/bun runtimes.
 */
export async function hashVoterIdentifier(
  identifier: string,
  salt: string = "shabach2026",
): Promise<string> {
  const text = `${identifier.toLowerCase().trim()}:${salt}`;
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Simple fallback hash if crypto.subtle is not available
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return `hash_${Math.abs(hash)}`;
}

/**
 * Generates a cryptographically sound 6-digit numeric OTP code.
 */
function generate6DigitCode(): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const val = array[0] ?? 0;
    const code = (val % 900000) + 100000;
    return code.toString();
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Validates standard email address formats.
 */
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

/**
 * Checks and increments rate limits for OTP requests.
 */
function checkRateLimit(email: string): boolean {
  const key = email.toLowerCase().trim();
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count += 1;
  return true;
}

/**
 * Requests an OTP code for voter email verification.
 * In Live mode: Dispatches genuine email OTP via Supabase Auth.
 * If live OTP is unconfigured, honestly returns an unconfigured status.
 */
export async function requestVoterOtp(
  email: string,
  options?: { isLive?: boolean },
): Promise<OtpRequestResult> {
  const cleanEmail = email.toLowerCase().trim();

  if (!isValidEmail(cleanEmail)) {
    return {
      success: false,
      message: "Please enter a valid email address.",
    };
  }

  if (!checkRateLimit(cleanEmail)) {
    return {
      success: false,
      message: "Too many verification requests. Please wait a few minutes before trying again.",
    };
  }

  // Handle Live Mode
  if (options?.isLive) {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: "Email OTP verification service is unconfigured: missing Supabase credentials.",
        isConfigured: false,
      };
    }

    const client = getSupabaseClient();
    if (!client) {
      return {
        success: false,
        message: "Email OTP verification service is unconfigured: Supabase client unavailable.",
        isConfigured: false,
      };
    }

    try {
      const { error } = await client.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        return {
          success: false,
          message: `Email OTP service unavailable: ${error.message}`,
          isConfigured: false,
        };
      }

      return {
        success: true,
        message: `A verification code has been dispatched to ${cleanEmail}. Please check your inbox.`,
        expiresInSeconds: OTP_TTL_MS / 1000,
        isConfigured: true,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `Email OTP service error: ${message}`,
        isConfigured: false,
      };
    }
  }

  // Demo / Local Mode
  const code = generate6DigitCode();
  const codeHash = await hashVoterIdentifier(code, cleanEmail);
  const expiresAt = Date.now() + OTP_TTL_MS;

  otpStore.set(cleanEmail, {
    email: cleanEmail,
    codeHash,
    expiresAt,
    attempts: 0,
    verified: false,
  });

  console.info(`[SHABACH Demo OTP] Verification code for ${cleanEmail}: ${code}`);
  return {
    success: true,
    message: `Verification code generated for ${cleanEmail}. In demo mode, use code: ${code}`,
    expiresInSeconds: OTP_TTL_MS / 1000,
    mockCode: code,
    isConfigured: true,
  };
}

/**
 * Verifies a submitted OTP code with replay and brute-force protection.
 * In Live mode: Validates via Supabase Auth verifyOtp.
 * In Demo mode: Validates against single-use in-memory ledger.
 */
export async function verifyVoterOtp(
  email: string,
  code: string,
  options?: { isLive?: boolean },
): Promise<OtpVerifyResult> {
  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = code.trim();

  // If live mode explicitly requested
  if (options?.isLive) {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: "Email OTP verification service is unconfigured: missing Supabase credentials.",
      };
    }

    const client = getSupabaseClient();
    if (!client) {
      return {
        success: false,
        message: "Supabase client unavailable.",
      };
    }

    try {
      const { data, error } = await client.auth.verifyOtp({
        email: cleanEmail,
        token: cleanCode,
        type: "email",
      });

      if (error || !data.user) {
        return {
          success: false,
          message: error?.message || "Invalid or expired verification code.",
        };
      }

      const voterToken = data.user.id;
      return {
        success: true,
        message: "Email successfully verified. You may now cast your vote.",
        voterToken,
        voterEmail: cleanEmail,
        sessionToken: data.session?.access_token,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `Verification failed: ${message}`,
      };
    }
  }

  // Demo / Local Mode Verification
  const record = otpStore.get(cleanEmail);

  if (!record) {
    return {
      success: false,
      message: "No active verification request found. Please request a new code.",
    };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleanEmail);
    return {
      success: false,
      message: "Verification code has expired. Please request a new one.",
    };
  }

  if (record.verified) {
    return {
      success: false,
      message: "This verification code has already been used (replay protection).",
    };
  }

  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    otpStore.delete(cleanEmail);
    return {
      success: false,
      message: "Maximum verification attempts exceeded. Please request a new code.",
    };
  }

  record.attempts += 1;

  const candidateHash = await hashVoterIdentifier(cleanCode, cleanEmail);
  if (candidateHash !== record.codeHash) {
    return {
      success: false,
      message: `Incorrect code. ${MAX_VERIFY_ATTEMPTS - record.attempts} attempts remaining.`,
    };
  }

  // Mark verified and invalidate to guarantee replay prevention
  record.verified = true;
  otpStore.delete(cleanEmail);

  const encodedEmail =
    typeof Buffer !== "undefined" ? Buffer.from(cleanEmail).toString("base64") : btoa(cleanEmail);

  const voterToken = `voter_${encodedEmail}_${Date.now()}`;

  return {
    success: true,
    message: "Email successfully verified. You may now cast your vote.",
    voterToken,
    voterEmail: cleanEmail,
  };
}

/**
 * Checks whether a verified voter has already cast their single vote in an event.
 */
export async function hasVoterVoted(
  voterToken: string,
  eventId: string = DEFAULT_EVENT_ID,
): Promise<boolean> {
  if (!voterToken) return false;

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("votes")
          .select("id")
          .eq("event_id", eventId)
          .eq("voter_id", voterToken)
          .limit(1);

        if (!error && data && data.length > 0) {
          return true;
        }
      } catch {
        // Fall through
      }
    }
  }

  return false;
}
