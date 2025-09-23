"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { SupabaseConfigWarning } from "@/components/supabase-config-warning"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Car,
  BookOpen,
  Trophy,
  User,
  LogOut,
  Play,
  CheckCircle,
  XCircle,
  Star,
  Award,
  Target,
  Heart,
  Truck,
  Bus,
  PowerCircle as Motorcycle,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { CategorySelectionModal } from "@/components/category-selection-modal"
import { signOut } from "@/lib/actions/auth"

interface TestResult {
  id: string
  test_pack: string
  category_code: string
  score: number
  total_questions: number
  passed: boolean
  test_mode: string
  completed_at: string
}

interface Category {
  code: string
  name: string
  description: string
  total_tests: number
  questions_per_test: number
  passing_score: number
  time_limit_minutes: number
}

interface UserGamification {
  category_code: string
  total_points: number
  level: number
  tests_completed: number
  tests_passed: number
  perfect_scores: number
  streak_days: number
}

interface Profile {
  id: string
  full_name: string | null
  onboarding_completed: boolean
}

const getCategoryIcon = (code: string) => {
  if (code.includes("A")) return Motorcycle
  if (code.includes("B")) return Car
  if (code.includes("C")) return Truck
  if (code.includes("D")) return Bus
  return Car
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [favoriteCategories, setFavoriteCategories] = useState<string[]>([])
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [gamificationData, setGamificationData] = useState<UserGamification[]>([])
  const router = useRouter()

  const supabase = createClient()

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    async function loadData() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push("/auth/login")
          return
        }

        setUser(user)

        const [profileRes, categoriesRes, favoritesRes, testResultsRes, gamificationRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).single(),
          supabase.from("categories").select("*").order("code"),
          supabase.from("user_favorite_categories").select("category_code").eq("user_id", user.id),
          supabase.from("test_results").select("*").eq("user_id", user.id).order("completed_at", { ascending: false }),
          supabase.from("user_gamification").select("*").eq("user_id", user.id),
        ])

        setProfile(profileRes.data)
        setCategories(categoriesRes.data || [])
        setFavoriteCategories(favoritesRes.data?.map((f) => f.category_code) || [])
        setTestResults(testResultsRes.data || [])
        setGamificationData(gamificationRes.data || [])
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase, router])

  if (!supabase) {
    return (
      <SupabaseConfigWarning context="El panel de control necesita una conexión activa con Supabase para cargar tus datos y estadísticas." />
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Cargando dashboard...</span>
        </div>
      </div>
    )
  }

  const favoriteSet = new Set(favoriteCategories)
  const totalPoints = gamificationData.reduce((acc, g) => acc + g.total_points, 0)
  const totalLevel = Math.max(1, Math.floor(totalPoints / 100))
  const totalTestsCompleted = gamificationData.reduce((acc, g) => acc + g.tests_completed, 0)
  const totalTestsPassed = gamificationData.reduce((acc, g) => acc + g.tests_passed, 0)

  // Separate favorite and other categories
  const favoriteCategoriesList = categories.filter((c) => favoriteSet.has(c.code))
  const otherCategories = categories.filter((c) => !favoriteSet.has(c.code))

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
                <p className="text-sm text-muted-foreground">Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
                <Star className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Nivel {totalLevel}</span>
                <span className="text-xs text-muted-foreground">({totalPoints} pts)</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{profile?.full_name || user?.email}</span>
              </div>
              <form action={signOut}>
                <Button variant="outline" size="sm">
                  <LogOut className="w-4 h-4 mr-2" />
                  Salir
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            ¡Bienvenido, {profile?.full_name?.split(" ")[0] || "Usuario"}!
          </h2>
          <p className="text-muted-foreground">Selecciona una categoría para comenzar a practicar</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-6 text-center">
              <Award className="w-8 h-8 text-primary mx-auto mb-3" />
              <div className="text-2xl font-bold text-foreground">{totalLevel}</div>
              <div className="text-sm text-muted-foreground">Nivel actual</div>
            </CardContent>
          </Card>
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-6 text-center">
              <Trophy className="w-8 h-8 text-chart-4 mx-auto mb-3" />
              <div className="text-2xl font-bold text-foreground">{totalTestsPassed}</div>
              <div className="text-sm text-muted-foreground">Tests aprobados</div>
            </CardContent>
          </Card>
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-6 text-center">
              <BookOpen className="w-8 h-8 text-accent mx-auto mb-3" />
              <div className="text-2xl font-bold text-foreground">{totalTestsCompleted}</div>
              <div className="text-sm text-muted-foreground">Tests realizados</div>
            </CardContent>
          </Card>
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-6 text-center">
              <Star className="w-8 h-8 text-primary mx-auto mb-3" />
              <div className="text-2xl font-bold text-foreground">{totalPoints}</div>
              <div className="text-sm text-muted-foreground">Puntos totales</div>
            </CardContent>
          </Card>
        </div>

        {/* Favorite Categories */}
        {favoriteCategoriesList.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <Heart className="w-5 h-5 text-red-500" />
              <h3 className="text-2xl font-bold text-foreground">Categorías Favoritas</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteCategoriesList.map((category) => {
                const categoryGamification = gamificationData.find((g) => g.category_code === category.code)
                const Icon = getCategoryIcon(category.code)

                return (
                  <Card
                    key={category.code}
                    className="bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all relative"
                  >
                    <div className="absolute top-3 right-3">
                      <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                    </div>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                      </div>
                      <CardDescription>{category.description}</CardDescription>
                      {categoryGamification && (
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Nivel {categoryGamification.level}
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            {categoryGamification.tests_passed}/{categoryGamification.tests_completed}
                          </div>
                          <div className="flex items-center gap-1">
                            <Trophy className="w-3 h-3" />
                            {categoryGamification.perfect_scores} perfectos
                          </div>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Link href={`/categories/${category.code}`}>
                          <Button className="w-full">
                            <Play className="w-4 h-4 mr-2" />
                            Ver Tests
                          </Button>
                        </Link>
                        <div className="text-xs text-muted-foreground text-center">
                          {category.total_tests} tests • {category.questions_per_test} preguntas •{" "}
                          {category.time_limit_minutes} min
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Other Categories */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-foreground mb-6">
            {favoriteCategoriesList.length > 0 ? "Otras Categorías" : "Categorías Disponibles"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherCategories.map((category) => {
              const categoryGamification = gamificationData.find((g) => g.category_code === category.code)
              const Icon = getCategoryIcon(category.code)

              return (
                <Card
                  key={category.code}
                  className="bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all"
                >
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-muted rounded-lg">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                    </div>
                    <CardDescription>{category.description}</CardDescription>
                    {categoryGamification && (
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Nivel {categoryGamification.level}
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {categoryGamification.tests_passed}/{categoryGamification.tests_completed}
                        </div>
                        <div className="flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          {categoryGamification.perfect_scores} perfectos
                        </div>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Link href={`/categories/${category.code}`}>
                        <Button className="w-full bg-transparent" variant="outline">
                          <Play className="w-4 h-4 mr-2" />
                          Ver Tests
                        </Button>
                      </Link>
                      <div className="text-xs text-muted-foreground text-center">
                        {category.total_tests} tests • {category.questions_per_test} preguntas •{" "}
                        {category.time_limit_minutes} min
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Recent Results */}
        {testResults.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-6">Resultados Recientes</h3>
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {testResults.slice(0, 5).map((result) => {
                    const category = categories.find((c) => c.code === result.category_code)
                    return (
                      <div key={result.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          {result.passed ? (
                            <CheckCircle className="w-5 h-5 text-chart-4" />
                          ) : (
                            <XCircle className="w-5 h-5 text-destructive" />
                          )}
                          <div>
                            <div className="font-medium text-foreground">
                              {category?.name || result.category_code} - Test {result.test_pack}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {result.test_mode === "study" ? "Modo Estudio" : "Modo Examen"} •{" "}
                              {new Date(result.completed_at).toLocaleDateString("es-ES", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-foreground">
                            {result.score}/{result.total_questions}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {result.passed ? "Aprobado" : "Suspendido"}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Category Selection Modal for new users */}
      {profile && !profile.onboarding_completed && categories.length > 0 && (
        <CategorySelectionModal
          open={true}
          onClose={() => {}}
          categories={categories}
          onComplete={() => window.location.reload()}
        />
      )}
    </div>
  )
}
