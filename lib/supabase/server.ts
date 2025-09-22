import type { SupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { getSupabaseConfig, warnMissingSupabaseConfig } from "./config"

type CreateServerClient = typeof import("@supabase/ssr") extends {
  createServerClient: infer T
}
  ? T
  : never

let createServerClientFactory: Promise<CreateServerClient> | null = null
let serverClientLoadFailed = false

async function loadServerClientFactory() {
  if (!createServerClientFactory) {
    createServerClientFactory = import("@supabase/ssr").then(
      (mod) => mod.createServerClient,
      (error) => {
        createServerClientFactory = null
        throw error
      },
    )
  }

  return createServerClientFactory
}

export async function createClient(): Promise<SupabaseClient | null> {
  const config = getSupabaseConfig()

  if (!config) {
    warnMissingSupabaseConfig("Server components cannot access Supabase until the environment variables are provided.")
    return null
  }

  const cookieStore = await cookies()

  const createServerClient = await loadServerClientFactory().catch((error) => {
    if (!serverClientLoadFailed && process.env.NODE_ENV !== "production") {
      console.warn(
        "Supabase server client initialization failed. Returning a null client instead.",
        error,
      )
      serverClientLoadFailed = true
    }

    return null
  })

  if (!createServerClient) {
    return null
  }

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
