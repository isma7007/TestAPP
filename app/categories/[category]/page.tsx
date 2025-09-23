"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen, CheckCircle, XCircle, Clock3, ChevronRight, ToggleLeft, ToggleRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  getStoredTestsByCategory,
  LOCAL_TEST_STORAGE_KEY,
  TEST_STATE_EVENT_NAME,
  type StoredTestState,
} from "@/lib/local-test-storage"

interface TestSummary {
  id: string
  title: string
  category: string
}

interface TestStatus {
  test_id: string
  status: "approved" | "failed" | "incomplete"
  score?: number
  total_questions?: number
  current_question?: number
  completed_at?: string
  updated_at?: string
}

const STATUS_PRIORITY: Record<TestStatus["status"], number> = {
  approved: 3,
  failed: 2,
  incomplete: 1,
}

function parseStatusTimestamp(status: TestStatus) {
  const iso = status.updated_at ?? status.completed_at
  if (!iso) return null
  const time = Date.parse(iso)
  return Number.isNaN(time) ? null : time
}

function shouldUseIncomingStatus(current: TestStatus | undefined, incoming: TestStatus) {
  if (!current) return true

  const currentTime = parseStatusTimestamp(current)
  const incomingTime = parseStatusTimestamp(incoming)

  if (incomingTime !== null && currentTime !== null) {
    if (incomingTime === currentTime) {
      return STATUS_PRIORITY[incoming.status] >= STATUS_PRIORITY[current.status]
    }
    return incomingTime > currentTime
  }

  if (incomingTime !== null) return true
  if (currentTime !== null) return false

  return STATUS_PRIORITY[incoming.status] >= STATUS_PRIORITY[current.status]
}

function upsertStatus(map: Record<string, TestStatus>, status: TestStatus) {
  if (shouldUseIncomingStatus(map[status.test_id], status)) {
    map[status.test_id] = status
  }
}

export default function CategoryPage({ params }: { params: { category: string } }) {
  const tests = useMemo(() => {
    const generated: TestSummary[] = []
    for (let i = 1; i <= 100; i++) {
      generated.push({
        id: `test${i}`,
        title: `Test ${String(i).padStart(3, "0")}`,
        category: params.category,
      })
    }
    return generated
  }, [params.category])

  const [testStatuses, setTestStatuses] = useState<Record<string, TestStatus>>({})
  const [loading, setLoading] = useState(true)
  const [testMode, setTestMode] = useState<"study" | "exam">("exam")
  const isMountedRef = useRef(true)
  const latestRequestRef = useRef(0)
  const spinnerRequestRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchStatuses = useCallback(async () => {
    const statusMap: Record<string, TestStatus> = {}
    const supabase = createClient()

    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const [{ data: results }, { data: progress }] = await Promise.all([
          supabase
            .from("test_results")
            .select("test_pack, passed, score, total_questions, completed_at")
            .eq("user_id", user.id)
            .eq("category_code", params.category),
          supabase
            .from("test_progress")
            .select("test_id, current_question, updated_at")
            .eq("user_id", user.id)
            .eq("category_code", params.category),
        ])

        results?.forEach((result: any) => {
          if (!result) return
          upsertStatus(statusMap, {
            test_id: result.test_pack,
            status: result.passed ? "approved" : "failed",
            score: typeof result.score === "number" ? result.score : undefined,
            total_questions: typeof result.total_questions === "number" ? result.total_questions : undefined,
            completed_at: result.completed_at ?? undefined,
            updated_at: result.completed_at ?? undefined,
          })
        })

        progress?.forEach((prog: any) => {
          if (!prog) return
          upsertStatus(statusMap, {
            test_id: prog.test_id,
            status: "incomplete",
            current_question: typeof prog.current_question === "number" ? prog.current_question : undefined,
            updated_at: prog.updated_at ?? undefined,
          })
        })
      }
    }

    const localStates = getStoredTestsByCategory(params.category)
    localStates.forEach((state) => {
      const totalQuestions = state.totalQuestions ?? state.answers?.length

      if (state.status === "approved" || state.status === "failed") {
        upsertStatus(statusMap, {
          test_id: state.testId,
          status: state.status,
          score: typeof state.score === "number" ? state.score : undefined,
          total_questions: typeof totalQuestions === "number" ? totalQuestions : undefined,
          completed_at: state.completedAt,
          updated_at: state.completedAt ?? state.updatedAt,
        })
        return
      }

      if (state.status === "incomplete") {
        upsertStatus(statusMap, {
          test_id: state.testId,
          status: "incomplete",
          current_question: state.currentQuestion,
          total_questions: typeof totalQuestions === "number" ? totalQuestions : undefined,
          updated_at: state.updatedAt,
        })
      }
    })

    return statusMap
  }, [params.category])

  const refreshStatuses = useCallback(
    async (options?: { withLoading?: boolean }) => {
      const withLoading = options?.withLoading ?? false
      const requestId = latestRequestRef.current + 1
      latestRequestRef.current = requestId

      if (withLoading) {
        spinnerRequestRef.current = requestId
        setLoading(true)
      }

      try {
        const statusMap = await fetchStatuses()
        if (!isMountedRef.current || requestId !== latestRequestRef.current) return
        setTestStatuses(statusMap)
      } catch (error) {
        if (isMountedRef.current) {
          console.error("Error cargando datos:", error)
        }
      } finally {
        if (!isMountedRef.current) return

        if (spinnerRequestRef.current === requestId) {
          spinnerRequestRef.current = null
          setLoading(false)
        } else if (withLoading && spinnerRequestRef.current === null) {
          setLoading(false)
        }
      }
    },
    [fetchStatuses],
  )

  useEffect(() => {
    void refreshStatuses({ withLoading: true })
  }, [refreshStatuses])

  useEffect(() => {
    const handleImmediateRefresh = () => void refreshStatuses()
    const handleVisibilityChange = () => {
      if (!document.hidden) void refreshStatuses()
    }
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === LOCAL_TEST_STORAGE_KEY) {
        void refreshStatuses()
      }
    }
    const handleTestStateChange: EventListener = (event) => {
      const detail = (event as CustomEvent<{ state: StoredTestState | null; previousState: StoredTestState | null }>).detail
      const categoryFromEvent = detail?.state?.category ?? detail?.previousState?.category
      if (!categoryFromEvent || categoryFromEvent === params.category) {
        void refreshStatuses()
      }
    }

    window.addEventListener("focus", handleImmediateRefresh)
    window.addEventListener("pageshow", handleImmediateRefresh)
    window.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("storage", handleStorage)
    window.addEventListener(TEST_STATE_EVENT_NAME, handleTestStateChange)

    return () => {
      window.removeEventListener("focus", handleImmediateRefresh)
      window.removeEventListener("pageshow", handleImmediateRefresh)
      window.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener(TEST_STATE_EVENT_NAME, handleTestStateChange)
    }
  }, [params.category, refreshStatuses])

  const approvedCount = Object.values(testStatuses).filter((s) => s.status === "approved").length
  const failedCount = Object.values(testStatuses).filter((s) => s.status === "failed").length
  const incompleteCount = Object.values(testStatuses).filter((s) => s.status === "incomplete").length

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando tests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-balance">Nuestros test en {params.category}</h1>
              <p className="text-muted-foreground text-lg">
                Practica con 100 tests oficiales y mejora tus conocimientos
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Test mode:</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${testMode === "study" ? "text-foreground" : "text-muted-foreground"}`}>
                  estudio
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTestMode(testMode === "study" ? "exam" : "study")}
                  className="p-0 h-auto"
                >
                  {testMode === "exam" ? (
                    <ToggleRight className="w-8 h-8 text-orange-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                  )}
                </Button>
                <span className={`text-sm ${testMode === "exam" ? "text-orange-500 font-medium" : "text-muted-foreground"}`}>
                  examen
                </span>
              </div>
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">?</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader className="bg-blue-600 text-white rounded-t-lg">
            <div className="grid grid-cols-4 gap-4 text-center font-semibold">
              <div>Test</div>
              <div>Fallos</div>
              <div>Realizado</div>
              <div>Último</div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {tests.map((test, index) => {
                const status = testStatuses[test.id]
                const testNumber = String(index + 1).padStart(3, "0")

                return (
                  <div
                    key={test.id}
                    className="grid grid-cols-4 gap-4 items-center py-3 px-6 hover:bg-muted/30 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-10 bg-gray-600 text-white rounded flex items-center justify-center font-mono text-sm">
                        {testNumber}
                      </div>
                      {status?.status === "approved" && <CheckCircle className="w-4 h-4 text-green-600" />}
                      {status?.status === "failed" && <XCircle className="w-4 h-4 text-red-600" />}
                      {status?.status === "incomplete" && <Clock3 className="w-4 h-4 text-amber-500" />}
                    </div>

                    <div className="text-center">
                      {status && (status.status === "approved" || status.status === "failed") &&
                      typeof status.total_questions === "number" &&
                      typeof status.score === "number" ? (
                        <span className="text-sm">
                          {status.total_questions - status.score}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>

                    <div className="text-center">
                      {status?.status === "approved" && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">Aprobado</Badge>
                      )}
                      {status?.status === "failed" && (
                        <Badge className="bg-red-100 text-red-800 border-red-200">Suspendido</Badge>
                      )}
                      {status?.status === "incomplete" && (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200">Incompleto</Badge>
                      )}
                      {!status && <span className="text-muted-foreground text-sm">No realizado</span>}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-center flex-1">
                        {status?.completed_at ? (
                          <span className="text-sm text-muted-foreground">
                            {new Date(status.completed_at).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "2-digit",
                            })}
                          </span>
                        ) : status?.status === "incomplete" ? (
                          <span className="text-sm text-amber-600">
                            P. {(status.current_question || 0) + 1}/{status.total_questions ?? 30}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </div>
                      <Link href={`/test/${test.id}?mode=${testMode}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{tests.length}</p>
                  <p className="text-sm text-muted-foreground">Tests disponibles</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{approvedCount}</p>
                  <p className="text-sm text-muted-foreground">Aprobados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-red-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{failedCount}</p>
                  <p className="text-sm text-muted-foreground">Suspendidos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-amber-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Clock3 className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{incompleteCount}</p>
                  <p className="text-sm text-muted-foreground">Incompletos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
