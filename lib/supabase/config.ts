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
