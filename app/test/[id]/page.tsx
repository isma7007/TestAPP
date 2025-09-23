"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, ArrowLeft, ArrowRight, CheckCircle, XCircle, RotateCcw, List, EyeOff, Save } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { clearStoredTestState, getStoredTestState, setStoredTestState } from "@/lib/local-test-storage"

interface Question {
  question: string
  image?: string
  options: string[]
  answer: string
}

interface TestData {
  id: string
  title: string
  category: string
  questions: Question[]
}

export default function TestPage() {
  const routeParams = useParams() as { id?: string | string[] }
  const searchParams = useSearchParams()
  const rawId = routeParams?.id ?? searchParams.get("test")
  const id = Array.isArray(rawId) ? rawId[0] : rawId || null

  const [data, setData] = useState<TestData | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<(string | null)[]>([])
  const [timeLeft, setTimeLeft] = useState(30 * 60)
  const [isFinished, setIsFinished] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showQuestionPanel, setShowQuestionPanel] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function loadTest() {
      try {
        if (!id) return
        const capitalizedId = id.charAt(0).toUpperCase() + id.slice(1)
        const res = await fetch(`/tests/${capitalizedId}.json`)
        if (!res.ok) throw new Error(`No se pudo cargar /tests/${capitalizedId}.json`)
        const json: TestData = await res.json()
        setData(json)
        setSelectedAnswers(new Array(json.questions.length).fill(null))
      } catch (error) {
        console.error("Error cargando el test:", error)
      }
    }
    loadTest()
    setCurrentQuestion(0)
    setIsFinished(false)
    setShowResults(false)
    setTimeLeft(30 * 60)
  }, [id])

  useEffect(() => {
    let isMounted = true

    async function loadUserAndProgress() {
      if (!id || !data) {
        setUser(null)
        return
      }

      let progressApplied = false
      const supabase = createClient()

      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!isMounted) return

        setUser(user)

        if (user) {
          const { data: progress } = await supabase
            .from("test_progress")
            .select("answers, current_question")
            .eq("user_id", user.id)
            .eq("test_id", id)
            .single()

          if (!isMounted) return

          if (progress) {
            const answersArray = new Array(data.questions.length).fill(null)

            if (progress.answers) {
              Object.entries(progress.answers as Record<string, string>).forEach(([key, value]) => {
                const index = Number(key)
                if (!Number.isNaN(index) && index < answersArray.length) {
                  answersArray[index] = value as string
                }
              })
            }

            const current = Math.min((progress.current_question as number) || 0, data.questions.length - 1)

            setSelectedAnswers(answersArray)
            setCurrentQuestion(current)

            setStoredTestState(id, {
              testId: id,
              category: data.category,
              answers: answersArray,
              currentQuestion: current,
              status: "incomplete",
              totalQuestions: data.questions.length,
              updatedAt: new Date().toISOString(),
            })

            progressApplied = true
          }
        }
      } else {
        setUser(null)
      }

      if (!progressApplied) {
        const stored = getStoredTestState(id)
        if (stored) {
          const answersArray = new Array(data.questions.length).fill(null)
          stored.answers.forEach((answer, index) => {
            if (index < answersArray.length) {
              answersArray[index] = answer
            }
          })

          const clampedQuestion = Math.min(stored.currentQuestion || 0, data.questions.length - 1)

          setSelectedAnswers(answersArray)
          setCurrentQuestion(clampedQuestion)

          if (typeof stored.timeLeft === "number" && stored.timeLeft >= 0) {
            setTimeLeft(stored.timeLeft)
          }

          const finished = stored.status === "approved" || stored.status === "failed"
          setIsFinished(finished)
          setShowResults(finished)

          progressApplied = true
        }
      }

      if (!progressApplied) {
        setSelectedAnswers(new Array(data.questions.length).fill(null))
      }
    }

    loadUserAndProgress()

    return () => {
      isMounted = false
    }
  }, [id, data])

  useEffect(() => {
    if (timeLeft > 0 && !isFinished) {
      const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      finishTest()
    }
  }, [timeLeft, isFinished])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswers((prev) => {
      const copy = [...prev]
      copy[currentQuestion] = answer
      return copy
    })
  }

  const nextQuestion = () => {
    if (data && currentQuestion < data.questions.length - 1) {
      setCurrentQuestion((q) => q + 1)
    }
  }

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((q) => q - 1)
    }
  }

  const calculateResults = () => {
    if (!data) return { correct: 0, incorrect: 0, unanswered: 0 }
    let correct = 0
    let incorrect = 0
    let unanswered = 0

    selectedAnswers.forEach((ans, i) => {
      if (ans === null) {
        unanswered++
      } else if (ans === data.questions[i].answer) {
        correct++
      } else {
        incorrect++
      }
    })

    return { correct, incorrect, unanswered }
  }

  const finishTest = async () => {
    if (!data || !id) return

    const results = calculateResults()
    const passed = results.correct >= 27
    const completedAt = new Date().toISOString()

    setIsFinished(true)
    setShowResults(true)

    const normalizedAnswers = data.questions.map((_, index) => selectedAnswers[index] ?? null)

    setStoredTestState(id, {
      testId: id,
      category: data.category,
      answers: normalizedAnswers,
      currentQuestion: data.questions.length - 1,
      status: passed ? "approved" : "failed",
      score: results.correct,
      totalQuestions: data.questions.length,
      completedAt,
      updatedAt: completedAt,
      timeLeft: 0,
    })

    if (user) {
      const supabase = createClient()
      if (supabase) {
        await supabase.from("test_results").insert({
          user_id: user.id,
          test_pack: id,
          category_code: data.category,
          score: results.correct,
          total_questions: data.questions.length,
          passed,
          test_mode: "practice",
        })

        await supabase.from("test_progress").delete().eq("user_id", user.id).eq("test_id", id)
      }
    }
  }

  const restartTest = () => {
    if (!data) return
    if (id) {
      clearStoredTestState(id)
    }
    setCurrentQuestion(0)
    setSelectedAnswers(new Array(data.questions.length).fill(null))
    setTimeLeft(30 * 60)
    setIsFinished(false)
    setShowResults(false)
  }

  const jumpToQuestion = (questionIndex: number) => {
    setCurrentQuestion(questionIndex)
    setShowQuestionPanel(false)
  }

  const persistIncompleteState = useCallback(
    (providedAnswers?: (string | null)[]) => {
      if (!id || !data || isFinished) return false

      const normalizedAnswers = providedAnswers ?? data.questions.map((_, index) => selectedAnswers[index] ?? null)
      const hasProgress = normalizedAnswers.some((answer) => answer !== null)

      if (!hasProgress) {
        clearStoredTestState(id)
        return false
      }

      setStoredTestState(id, {
        testId: id,
        category: data.category,
        answers: normalizedAnswers,
        currentQuestion,
        status: "incomplete",
        totalQuestions: data.questions.length,
        updatedAt: new Date().toISOString(),
        timeLeft,
      })

      return true
    },
    [id, data, selectedAnswers, currentQuestion, timeLeft, isFinished],
  )

  const saveProgress = useCallback(async () => {
    if (!id || !data || isFinished) return

    const normalizedAnswers = data.questions.map((_, index) => selectedAnswers[index] ?? null)
    const hasProgress = persistIncompleteState(normalizedAnswers)

    if (!user) return

    const supabase = createClient()
    if (!supabase) return

    if (!hasProgress) {
      await supabase.from("test_progress").delete().eq("user_id", user.id).eq("test_id", id)
      return
    }

    const answersObj = normalizedAnswers.reduce((acc, answer, index) => {
      if (answer !== null) acc[index] = answer
      return acc
    }, {} as Record<number, string>)

    await supabase.from("test_progress").upsert({
      user_id: user.id,
      test_id: id,
      category_code: data.category,
      current_question: currentQuestion,
      answers: answersObj,
    })
  }, [id, data, selectedAnswers, user, persistIncompleteState, currentQuestion, isFinished])

  useEffect(() => {
    return () => {
      if (!isFinished) {
        persistIncompleteState()
      }
    }
  }, [isFinished, persistIncompleteState])

  useEffect(() => {
    if (!id || !data || isFinished) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        persistIncompleteState()
      }
    }

    const handlePageHide = () => {
      persistIncompleteState()
    }

    window.addEventListener("beforeunload", handlePageHide)
    window.addEventListener("pagehide", handlePageHide)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("beforeunload", handlePageHide)
      window.removeEventListener("pagehide", handlePageHide)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [id, data, isFinished, persistIncompleteState])

  useEffect(() => {
    if (!id || !data || isFinished) return
    if (!selectedAnswers.some((a) => a !== null)) return

    const timeoutId = setTimeout(() => {
      void saveProgress()
    }, 600)

    return () => clearTimeout(timeoutId)
  }, [selectedAnswers, currentQuestion, id, data, isFinished, saveProgress])

  if (!id) {
    return (
      <div className="p-6">
        <p>No se encontró el identificador del test.</p>
        <Link href="/dashboard">
          <Button className="mt-4">Volver</Button>
        </Link>
      </div>
    )
  }

  if (!data) {
    return <p className="p-6">Cargando test...</p>
  }

  const results = calculateResults()
  const passed = results.correct >= 27
  const question = data.questions[currentQuestion]
  const progress = ((currentQuestion + 1) / data.questions.length) * 100

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div
                className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  passed ? "bg-chart-4/10" : "bg-destructive/10"
                }`}
              >
                {passed ? (
                  <CheckCircle className="w-10 h-10 text-chart-4" />
                ) : (
                  <XCircle className="w-10 h-10 text-destructive" />
                )}
              </div>
              <CardTitle className="text-3xl mb-2">
                {passed ? "¡Enhorabuena! Has aprobado" : "No has aprobado esta vez"}
              </CardTitle>
              <p className="text-muted-foreground">
                {passed
                  ? "Has superado el test con éxito. ¡Estás preparado para el examen oficial!"
                  : "Necesitas al menos 27 respuestas correctas. ¡Sigue practicando!"}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-chart-4/5 border-chart-4/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-chart-4">{results.correct}</div>
                    <div className="text-sm text-muted-foreground">Correctas</div>
                  </CardContent>
                </Card>
                <Card className="bg-destructive/5 border-destructive/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-destructive">{results.incorrect}</div>
                    <div className="text-sm text-muted-foreground">Incorrectas</div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50 border-border/50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-muted-foreground">{results.unanswered}</div>
                    <div className="text-sm text-muted-foreground">Sin responder</div>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Puntuación</span>
                  <span>
                    {results.correct}/{data.questions.length} (
                    {Math.round((results.correct / data.questions.length) * 100)}
                    %)
                  </span>
                </div>
                <Progress value={(results.correct / data.questions.length) * 100} className="h-3" />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button onClick={restartTest} className="flex-1">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Repetir Test
                </Button>
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver al Inicio
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/categories/${data?.category || ""}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Salir
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold text-foreground">{data.title}</h1>
              <p className="text-sm text-muted-foreground">
                Pregunta {currentQuestion + 1} de {data.questions.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <Button variant="outline" size="sm" onClick={saveProgress} className="gap-2 bg-transparent">
                <Save className="w-4 h-4" />
                Guardar
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuestionPanel(!showQuestionPanel)}
              className="gap-2"
            >
              {showQuestionPanel ? <EyeOff className="w-4 h-4" /> : <List className="w-4 h-4" />}
              {showQuestionPanel ? "Ocultar" : "Ver"} Preguntas
            </Button>
            <Badge variant="outline" className="font-mono">
              <Clock className="w-3 h-3 mr-1" />
              {formatTime(timeLeft)}
            </Badge>
            <Badge className="bg-accent text-accent-foreground">
              {selectedAnswers.filter((a) => a !== null).length}/{data.questions.length}
            </Badge>
          </div>
        </div>
        <div className="mt-2">
          <Progress value={progress} className="h-2" />
        </div>
      </header>

      <main className="py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex gap-6">
            {showQuestionPanel && (
              <Card className="w-80 bg-card/50 backdrop-blur-sm h-fit sticky top-24">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <List className="w-5 h-5" />
                    Navegación de Preguntas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {data.questions.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => jumpToQuestion(index)}
                        className={`
                          w-10 h-10 rounded-lg text-sm font-medium transition-all
                          ${currentQuestion === index
                            ? "bg-primary text-primary-foreground ring-2 ring-primary/50"
                            : selectedAnswers[index] !== null
                              ? "bg-chart-4/20 text-chart-4 border border-chart-4/30 hover:bg-chart-4/30"
                              : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border"
                          }
                        `}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-primary rounded"></div>
                      <span>Pregunta actual</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-chart-4/20 border border-chart-4/30 rounded"></div>
                      <span>Respondida</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-muted border border-border rounded"></div>
                      <span>Sin responder</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Progreso: {selectedAnswers.filter((a) => a !== null).length} de {data.questions.length}
                    </div>
                    <Progress
                      value={(selectedAnswers.filter((a) => a !== null).length / data.questions.length) * 100}
                      className="h-2 mt-2"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex-1">
              <Card className="bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl leading-relaxed text-balance">{question.question}</CardTitle>
                    <Badge variant="secondary" className="ml-4">
                      {currentQuestion + 1}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {question.image && (
                    <div className="flex justify-center">
                      <img
                        src={question.image || "/placeholder.svg"}
                        alt="Imagen de la pregunta"
                        className="max-w-xs rounded-lg border"
                      />
                    </div>
                  )}
                  <div className="space-y-3">
                    {question.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(option)}
                        className={`w-full p-4 text-left rounded-lg border-2 transition-all hover:bg-muted/50 ${selectedAnswers[currentQuestion] === option ? "border-primary bg-primary/5 text-primary" : "border-border bg-card hover:border-border/80"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium ${selectedAnswers[currentQuestion] === option ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground text-muted-foreground"}`}
                          >
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span>{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between pt-6">
                    <Button variant="outline" onClick={prevQuestion} disabled={currentQuestion === 0}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Anterior
                    </Button>
                    {currentQuestion === data.questions.length - 1 ? (
                      <Button onClick={finishTest} className="bg-accent hover:bg-accent/90">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Finalizar Test
                      </Button>
                    ) : (
                      <Button onClick={nextQuestion}>
                        Siguiente
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
