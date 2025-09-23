import type React from "react"
import type { Metadata } from "next"
import { Suspense } from "react"
import "./globals.css"

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
  return (
    <html lang="es">
      <body className="font-sans antialiased">
        <Suspense fallback={null}>{children}</Suspense>

        <script
          dangerouslySetInnerHTML={{
            __html: `window.__env = ${JSON.stringify({
              NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
              NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
            })};`,
          }}
        />
      </body>
    </html>
  )
}
