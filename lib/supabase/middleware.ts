import { NextResponse, type NextRequest } from "next/server"

import { getSupabaseConfig, warnMissingSupabaseConfig } from "./config"
import { getSupabaseServerClientFactory } from "./factory"

const middlewareWarnings = new Set<string>()

function logMiddlewareIssue(context: string, error: unknown) {
  if (process.env.NODE_ENV === "production") {
    return
  }

  const key = context.trim().toLowerCase() || "unknown"

  if (middlewareWarnings.has(key)) {
    return
  }

  middlewareWarnings.add(key)

  const details =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : typeof error === "string"
        ? error
        : "Unknown error"

  console.warn(`Supabase middleware ${context}. (${details})`)
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const config = getSupabaseConfig()

  if (!config) {
    warnMissingSupabaseConfig("Skipping Supabase session refresh in middleware.")
    return supabaseResponse
  }

  const factory = await getSupabaseServerClientFactory("middleware")

  if (!factory) {
    return supabaseResponse
  }

  try {
    const supabase = factory(config.url, config.anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          try {
            const setCookie = request.cookies.set?.bind(request.cookies)

            if (setCookie) {
              cookiesToSet.forEach(({ name, value, options }) => setCookie(name, value, options))
            }

            supabaseResponse = NextResponse.next({
              request,
            })

            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options),
            )
          } catch (error) {
            logMiddlewareIssue("could not persist refreshed auth cookies", error)
          }
        },
      },
    })

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      logMiddlewareIssue("failed to refresh the Supabase session", error)
      return supabaseResponse
    }

    if (
      !user &&
      !request.nextUrl.pathname.startsWith("/auth") &&
      request.nextUrl.pathname !== "/"
    ) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }
  } catch (error) {
    logMiddlewareIssue("encountered an unexpected error", error)
    return supabaseResponse
  }

  return supabaseResponse
}
