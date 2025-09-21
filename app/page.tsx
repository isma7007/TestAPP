import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Clock, Target, Trophy, Car, CheckCircle, LogIn } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Car className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">AutoTest Pro</h1>
                <p className="text-sm text-muted-foreground">Permiso B</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="font-mono">
                v1.0
              </Badge>
              <Link href="/auth/login">
                <Button variant="outline" size="sm">
                  <LogIn className="w-4 h-4 mr-2" />
                  Iniciar Sesión
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="mb-8">
            <Badge className="mb-4 bg-accent text-accent-foreground">Test Oficial DGT</Badge>
            <h2 className="text-4xl md:text-6xl font-bold text-balance mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Prepárate para tu examen de conducir
            </h2>
            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              Practica con tests oficiales del permiso B. 30 preguntas por test, necesitas 27 respuestas correctas para
              aprobar.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/auth/login">
              <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90">
                <BookOpen className="w-5 h-5 mr-2" />
                Comenzar Test
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 bg-transparent">
                <Trophy className="w-5 h-5 mr-2" />
                Registrarse
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-6 text-center">
                <Target className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-2xl font-bold text-foreground">30</div>
                <div className="text-sm text-muted-foreground">Preguntas por test</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-6 text-center">
                <Clock className="w-8 h-8 text-accent mx-auto mb-3" />
                <div className="text-2xl font-bold text-foreground">30</div>
                <div className="text-sm text-muted-foreground">Minutos máximo</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-8 h-8 text-chart-4 mx-auto mb-3" />
                <div className="text-2xl font-bold text-foreground">27</div>
                <div className="text-sm text-muted-foreground">Para aprobar</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">Todo lo que necesitas para aprobar</h3>
            <p className="text-muted-foreground text-lg">Tests oficiales con las últimas actualizaciones de la DGT</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-card border-border/50 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-foreground">Tests Oficiales</CardTitle>
                <CardDescription>Preguntas reales del examen oficial de la DGT actualizadas</CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border/50 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-foreground">Simulacro Real</CardTitle>
                <CardDescription>Mismas condiciones que el examen oficial: 30 preguntas, 30 minutos</CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border/50 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center mb-4">
                  <Trophy className="w-6 h-6 text-chart-4" />
                </div>
                <CardTitle className="text-foreground">Seguimiento</CardTitle>
                <CardDescription>Revisa tus respuestas y aprende de los errores cometidos</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t bg-card/30">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">AutoTest Pro</span>
          </div>
          <p className="text-muted-foreground text-sm">Preparación oficial para el examen de conducir - Permiso B</p>
        </div>
      </footer>
    </div>
  )
}
