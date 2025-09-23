export type SupabaseConfig = {
  url: string
  anonKey: string
}

export type SupabaseConfigSource = "env" | "runtime" | "default"

export type ResolvedSupabaseConfig = {
  config: SupabaseConfig
  sources: {
    url: SupabaseConfigSource
    anonKey: SupabaseConfigSource
  }
}

export const DEFAULT_SUPABASE_CONFIG: Readonly<SupabaseConfig> = Object.freeze({
  url: "https://mddlxrtpaczpkhcdayvb.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZGx4cnRwYWN6cGtoY2RheXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0OTk1MzAsImV4cCI6MjA3NDA3NTUzMH0.3LyyGk8o-PiAmJcydDnRk88C_HXjcX2YUWoACu1Y15Y",
})

const missingConfigWarnings = new Set<string>()


function readBrowserEnv(key: string): string {
  if (typeof window === "undefined") return ""
  try {
    // @ts-ignore
    const v = window.__env?.[key]
    return typeof v === "string" ? v.trim() : ""
  } catch {
    return ""
  }
}

function normalizeEnvValue(value: string | undefined) {
  if (!value) {
    return ""
  }

  const normalized = value.trim()

  if (!normalized || normalized === "undefined" || normalized === "null") {
    return ""
  }

  return normalized
}

type ResolvedValue = {
  value: string
  source: SupabaseConfigSource
}

function resolveValue(options: {
  env?: string
  runtime?: string
  fallback?: string
}): ResolvedValue | null {
  if (options.env) {
    return { value: options.env, source: "env" }
  }

  if (options.runtime) {
    return { value: options.runtime, source: "runtime" }
  }

  if (options.fallback) {
    return { value: options.fallback, source: "default" }
  }

  return null
}

export function resolveSupabaseConfig(): ResolvedSupabaseConfig | null {
  const url = resolveValue({
    env: normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL),
    runtime: normalizeEnvValue(readBrowserEnv("NEXT_PUBLIC_SUPABASE_URL")),
    fallback: normalizeEnvValue(DEFAULT_SUPABASE_CONFIG.url),
  })

  const anonKey = resolveValue({
    env: normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY),
    runtime: normalizeEnvValue(readBrowserEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")),
    fallback: normalizeEnvValue(DEFAULT_SUPABASE_CONFIG.anonKey),
  })

  if (!url || !anonKey) {
    return null
  }

  return {
    config: {
      url: url.value,
      anonKey: anonKey.value,
    },
    sources: {
      url: url.source,
      anonKey: anonKey.source,
    },
  }
}

export function getSupabaseConfig(): SupabaseConfig | null {
  return resolveSupabaseConfig()?.config ?? null
}

export function warnMissingSupabaseConfig(context: string) {
  if (process.env.NODE_ENV === "production") {
    return
  }

  const key = context.trim().toLowerCase() || "default"

  if (missingConfigWarnings.has(key)) {
    return
  }

  missingConfigWarnings.add(key)

  const messageParts = [
    "Supabase environment variables are not configured.",
    context,
    "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable Supabase features.",
  ].filter(Boolean)

  console.warn(messageParts.join(" "))
}
