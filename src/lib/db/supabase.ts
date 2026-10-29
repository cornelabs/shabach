import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Reads an environment variable safely in both Vite client and SSR/Node runtimes.
 */
function getEnvVar(key: string): string | undefined {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const val = import.meta.env[key];
    if (typeof val === "string" && val.length > 0) return val;
  }
  if (typeof process !== "undefined" && process.env) {
    const val = process.env[key];
    if (typeof val === "string" && val.length > 0) return val;
  }
  return undefined;
}

export const SUPABASE_URL =
  getEnvVar("VITE_SUPABASE_URL") || getEnvVar("SUPABASE_URL") || "";

export const SUPABASE_ANON_KEY =
  getEnvVar("VITE_SUPABASE_ANON_KEY") || getEnvVar("SUPABASE_ANON_KEY") || "";

export const SUPABASE_SERVICE_ROLE_KEY =
  getEnvVar("SUPABASE_SERVICE_ROLE_KEY") || "";

export const APP_MODE =
  getEnvVar("VITE_APP_MODE") || getEnvVar("APP_MODE") || "demo";

/**
 * Returns true if real Supabase environment variables are available.
 */
export function isSupabaseConfigured(): boolean {
  return (
    APP_MODE === "live" &&
    Boolean(SUPABASE_URL) &&
    Boolean(SUPABASE_ANON_KEY) &&
    !SUPABASE_URL.includes("placeholder")
  );
}

let supabaseInstance: SupabaseClient<Database> | null = null;

/**
 * Returns a typed Supabase client singleton, or null if unconfigured.
 */
export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return supabaseInstance;
}
