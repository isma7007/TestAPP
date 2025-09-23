import type React from "react"
import type { Metadata } from "next"
import { Suspense } from "react"
import "./globals.css"
import { DEFAULT_SUPABASE_CONFIG, resolveSupabaseConfig } from "@/lib/supabase/config"

export const metadata: Metadata = {
  title: "AutoTest Pro - Test de Conducir Permiso B",
  description: "Practica para tu examen de conducir con tests oficiales del permiso B",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabaseConfig = resolveSupabaseConfig()?.config ?? DEFAULT_SUPABASE_CONFIG

  return (
    <html lang="es">
      <body className="font-sans antialiased">
        <Suspense fallback={null}>{children}</Suspense>

        <script
          dangerouslySetInnerHTML={{
            __html: `window.__env = ${JSON.stringify({
              NEXT_PUBLIC_SUPABASE_URL: supabaseConfig.url,
              NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseConfig.anonKey,
            })};`,
          }}
        />
      </body>
    </html>
  )
}
