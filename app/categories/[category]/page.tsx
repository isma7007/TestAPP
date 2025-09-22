import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SupabaseConfigWarning } from "@/components/supabase-config-warning"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookOpen, Clock, CheckCircle, XCircle, Star, Trophy, Target } from "lucide-react"
import Link from "next/link"

interface TestResult {
  id: string
  test_pack: string
  score: number
  total_questions: number
  passed: boolean
  test_mode: string
  completed_at: string
}

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const supabase = await createClient()

  if (!supabase) {
    return (
      <SupabaseConfigWarning context="Las categorías y resultados de tus tests requieren una conexión a Supabase para mostrarse." />
    )
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Get category info
  const { data: category } = await supabase.from("categories").select("*").eq("code", params.category).single()

  if (!category) {
    redirect("/dashboard")
  }

  // Get test results for this category
  const { data: testResults } = await supabase
    .from("test_results")
    .select("*")
    .eq("user_id", user.id)
    .eq("category_code", params.category)
    .order("completed_at", { ascending: false })

  // Get gamification data for this category
  const { data: gamificationData } = await supabase
    .from("user_gamification")
    .select("*")
    .eq("user_id", user.id)
    .eq("category_code", params.category)
    .single()

  const availableTests = Array.from({ length: category.total_tests }, (_, i) => i + 1)

  const getTestStatus = (testNumber: number) => {
    const testId = `test-${testNumber.toString().padStart(3, "0")}`
    const results = testResults?.filter((r) => r.test_pack === testId) || []
    if (results.length === 0)
      return { status: "not-attempted", color: "bg-muted text-muted-foreground", icon: Clock, lastScore: null }

    const lastResult = results[0]
    if (lastResult.passed)
      return {
        status: "passed",
        color: "bg-chart-4 text-chart-4-foreground",
        icon: CheckCircle,
        lastScore: lastResult.score,
      }
    return {
      status: "failed",
      color: "bg-destructive text-destructive-foreground",
      icon: XCircle,
      lastScore: lastResult.score,
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">{category.name}</h1>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>
            </div>
            {gamificationData && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
                  <Star className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Nivel {gamificationData.level}</span>
                </div>
                <Badge variant="secondary">
                  {gamificationData.tests_passed}/{gamificationData.tests_completed} aprobados
                </Badge>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Category Stats */}
        {gamificationData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardContent className="p-6 text-center">
                <Star className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-2xl font-bold text-foreground">{gamificationData.level}</div>
                <div className="text-sm text-muted-foreground">Nivel</div>
              </CardContent>
            </Card>
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardContent className="p-6 text-center">
                <Trophy className="w-8 h-8 text-chart-4 mx-auto mb-3" />
                <div className="text-2xl font-bold text-foreground">{gamificationData.tests_passed}</div>
                <div className="text-sm text-muted-foreground">Aprobados</div>
              </CardContent>
            </Card>
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardContent className="p-6 text-center">
                <Target className="w-8 h-8 text-accent mx-auto mb-3" />
                <div className="text-2xl font-bold text-foreground">{gamificationData.perfect_scores}</div>
                <div className="text-sm text-muted-foreground">Perfectos</div>
              </CardContent>
            </Card>
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardContent className="p-6 text-center">
                <BookOpen className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-2xl font-bold text-foreground">{gamificationData.total_points}</div>
                <div className="text-sm text-muted-foreground">Puntos</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tests Grid */}
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-6">Tests Disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {availableTests.map((testNumber) => {
              const status = getTestStatus(testNumber)
              const StatusIcon = status.icon
              const testId = `test-${testNumber.toString().padStart(3, "0")}`

              return (
                <Card
                  key={testNumber}
                  className="bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Test {testNumber}</CardTitle>
                      <Badge className={status.color} variant="secondary">
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.status === "passed" && "✓"}
                        {status.status === "failed" && "✗"}
                        {status.status === "not-attempted" && "—"}
                      </Badge>
                    </div>
                    {status.lastScore !== null && (
                      <div className="text-sm text-muted-foreground">
                        Último: {status.lastScore}/{category.questions_per_test}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Link href={`/test?category=${params.category}&test=${testId}&mode=exam`} className="flex-1">
                          <Button size="sm" className="w-full">
                            <Clock className="w-3 h-3 mr-1" />
                            Examen
                          </Button>
                        </Link>
                        <Link href={`/test?category=${params.category}&test=${testId}&mode=study`} className="flex-1">
                          <Button size="sm" variant="outline" className="w-full bg-transparent">
                            <BookOpen className="w-3 h-3 mr-1" />
                            Estudio
                          </Button>
                        </Link>
                      </div>
                      <div className="text-xs text-muted-foreground text-center">
                        {category.questions_per_test} preguntas • {category.time_limit_minutes} min
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
