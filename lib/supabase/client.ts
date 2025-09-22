import { createBrowserClient } from "@supabase/ssr"
import { getSupabaseConfig } from "./config"

export function createClient() {
  const config = getSupabaseConfig()

  if (!config) {
    throw new Error(
      "Supabase environment variables are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    )
  }

  return createBrowserClient(config.url, config.anonKey)
}
