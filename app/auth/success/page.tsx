import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Car, CheckCircle, Mail } from "lucide-react"
import Link from "next/link"

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Car className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">AutoTest Pro</h1>
              <p className="text-sm text-muted-foreground">Permiso B</p>
            </div>
          </div>
        </div>

        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-chart-4/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-chart-4" />
            </div>
            <CardTitle className="text-2xl text-chart-4">¡Cuenta creada con éxito!</CardTitle>
            <CardDescription>Revisa tu email para confirmar tu cuenta</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
              <Mail className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Te hemos enviado un email de confirmación. Haz clic en el enlace para activar tu cuenta.
              </p>
            </div>

            <div className="space-y-2">
              <Link href="/auth/login">
                <Button className="w-full">Ir al inicio de sesión</Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full bg-transparent">
                  Volver al inicio
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
