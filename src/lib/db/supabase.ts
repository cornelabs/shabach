import { supabase } from "@/integrations/supabase/client";

export function isSupabaseConfigured(): boolean {
  try {
    const url =
      (typeof import.meta !== "undefined" && import.meta.env?.["VITE_SUPABASE_URL"]) ||
      (typeof process !== "undefined" && process.env?.["SUPABASE_URL"]);
    const key =
      (typeof import.meta !== "undefined" && import.meta.env?.["VITE_SUPABASE_PUBLISHABLE_KEY"]) ||
      (typeof process !== "undefined" && process.env?.["SUPABASE_PUBLISHABLE_KEY"]);
    return Boolean(url && key);
  } catch {
    return false;
  }
}

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  return supabase;
}
