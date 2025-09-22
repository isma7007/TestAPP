const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

type SupabaseConfig = {
  url: string
  anonKey: string
}

export function getSupabaseConfig(): SupabaseConfig | null {
  if (!url || !anonKey) {
    return null
  }

  return {
    url,
    anonKey,
  }
}

const missingConfigWarnings = new Set<string>()

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
