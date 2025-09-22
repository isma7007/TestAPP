export type SupabaseConfig = {
  url: string
  anonKey: string
}

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

export function getSupabaseConfig(): SupabaseConfig | null {
  const url =
    normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL) || readBrowserEnv('NEXT_PUBLIC_SUPABASE_URL')
  const anonKey =
    normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY) || readBrowserEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  if (!url || !anonKey) {
    return null
  }

  return {
    url,
    anonKey,
  }
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
