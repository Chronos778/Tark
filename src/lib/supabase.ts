import { createClient } from "@supabase/supabase-js";

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const rawKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim();

const isValidUrl = (testUrl?: string): boolean => {
  if (!testUrl) return false;
  try {
    const parsed = new URL(testUrl);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawKey &&
  isValidUrl(rawUrl) &&
  !rawUrl.includes("placeholder")
);

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn("Supabase is not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env");
}

const safeUrl = isValidUrl(rawUrl) ? (rawUrl as string) : "https://placeholder-project.supabase.co";
const safeKey = rawKey || "dummy-anon-key";

// Only the publishable key belongs in the browser. Never import the secret key here.
export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: typeof window !== "undefined",
    autoRefreshToken: typeof window !== "undefined",
  }
});

