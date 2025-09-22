import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

import { getSupabaseConfig, warnMissingSupabaseConfig } from "./config"

let browserClientFailureLogged = false

export function createClient(): SupabaseClient | null {
  const config = getSupabaseConfig()

  if (!config) {
    warnMissingSupabaseConfig(
      "Authentication features are disabled in the browser until Supabase is configured.",
    )
    return null
  }

  try {
    return createBrowserClient(config.url, config.anonKey)
  } catch (error) {
    if (process.env.NODE_ENV !== "production" && !browserClientFailureLogged) {
      console.warn("Supabase browser client failed to initialize.", error)
      browserClientFailureLogged = true
    }
    return null
  }
}
