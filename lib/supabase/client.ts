import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

import { resolveSupabaseConfig, warnMissingSupabaseConfig } from "./config"

let browserClientFailureLogged = false
let defaultSupabaseConfigNoticeLogged = false

export function createClient(): SupabaseClient | null {
  const resolved = resolveSupabaseConfig()

  if (!resolved) {
    // Mostramos advertencia clara y evitamos romper la app
    warnMissingSupabaseConfig(
      "Supabase environment variables are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    )
    return null
  }

  const { config, sources } = resolved

  if (
    (sources.url === "default" || sources.anonKey === "default") &&
    process.env.NODE_ENV !== "production" &&
    !defaultSupabaseConfigNoticeLogged
  ) {
    console.info(
      "Using bundled Supabase credentials. Override them by setting NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    )
    defaultSupabaseConfigNoticeLogged = true
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
