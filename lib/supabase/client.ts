import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getSupabaseConfig, warnMissingSupabaseConfig } from "./config"

export function createClient(): SupabaseClient | null {
  const config = getSupabaseConfig()

  if (!config) {
    warnMissingSupabaseConfig("Authentication features are disabled in the browser until Supabase is configured.")
    return null
  }

  return createBrowserClient(config.url, config.anonKey)
}
