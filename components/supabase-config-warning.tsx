import { AlertTriangle } from "lucide-react"

interface SupabaseConfigWarningProps {
  context?: string
}

export function SupabaseConfigWarning({ context }: SupabaseConfigWarningProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-6">
      <div className="max-w-xl w-full space-y-4 rounded-2xl border border-border/50 bg-card/80 p-8 text-center shadow-sm backdrop-blur-sm">
        <div className="flex justify-center">
          <AlertTriangle className="h-12 w-12 text-amber-500" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">Configura Supabase para continuar</h1>
        <p className="text-sm text-muted-foreground">
          Las variables de entorno <code className="rounded bg-muted px-1 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code> y
          <code className="rounded bg-muted px-1 py-0.5">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> no están definidas, por lo que las
          funcionalidades conectadas a Supabase se han deshabilitado temporalmente.
        </p>
        {context ? <p className="text-sm text-muted-foreground">{context}</p> : null}
        <p className="text-xs text-muted-foreground">
          Añade los valores correspondientes en tu <code className="rounded bg-muted px-1 py-0.5">.env.local</code> o en la
          configuración de tu despliegue y vuelve a cargar la página.
        </p>
      </div>
    </div>
  )
}
