// Type helper that extracts the signature of `createServerClient` from `@supabase/ssr`.
type CreateServerClient = typeof import("@supabase/ssr") extends {
  createServerClient: infer T
}
  ? T
  : never

let cachedFactory: CreateServerClient | null = null
let loadFailed = false
const loggedContexts = new Set<string>()

function logFactoryLoadFailure(context: string, error: unknown) {
  if (process.env.NODE_ENV === "production") {
    return
  }

  const key = context.trim().toLowerCase() || "default"

  if (loggedContexts.has(key)) {
    return
  }

  loggedContexts.add(key)

  const details =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : typeof error === "string"
        ? error
        : "Unknown error"

  console.warn(
    `Supabase server client failed to load in ${context}. Authentication features are disabled. (${details})`,
  )
}

export async function getSupabaseServerClientFactory(
  context: string,
): Promise<CreateServerClient | null> {
  if (cachedFactory) {
    return cachedFactory
  }

  if (loadFailed) {
    return null
  }

  try {
    const mod = await import("@supabase/ssr")
    cachedFactory = mod.createServerClient as CreateServerClient
    return cachedFactory
  } catch (error) {
    loadFailed = true
    logFactoryLoadFailure(context, error)
    return null
  }
}
