import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { getSupabaseConfig, warnMissingSupabaseConfig } from "./config"

function logMiddlewareIssue(error: unknown) {
  if (process.env.NODE_ENV === "production") {
    return
  }

  console.error("Supabase middleware session refresh failed:", error)
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

  try {
    const supabase = createServerClient(config.url, config.anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          try {
            const setCookie = request.cookies.set?.bind(request.cookies)

            if (setCookie) {
              cookiesToSet.forEach(({ name, value, options }) =>
                setCookie(name, value, options),
              )
            }

            supabaseResponse = NextResponse.next({
              request,
            })

            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options),
            )
          } catch (error) {
            logMiddlewareIssue(error)
          }
        },
      },
    })

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      logMiddlewareIssue(error)
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
    logMiddlewareIssue(error)
    return supabaseResponse
  }

  return supabaseResponse
}
