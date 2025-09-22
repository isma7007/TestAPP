import { createServerClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { getSupabaseConfig, warnMissingSupabaseConfig } from "./config"

export async function createClient(): Promise<SupabaseClient | null> {
  const config = getSupabaseConfig()

  if (!config) {
    warnMissingSupabaseConfig("Server components cannot access Supabase until the environment variables are provided.")
    return null
  }

  const cookieStore = await cookies()

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}
