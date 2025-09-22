"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, ArrowLeft, ArrowRight, CheckCircle, XCircle, RotateCcw } from "lucide-react"
import Link from "next/link"
import testData from "@/data/test-pack-1.json"

interface Question {
  id: number
  question: string
  image?: string
  options: string[]
  correctAnswer: number
}

interface TestData {
  id: number
  title: string
  description: string
  questions: Question[]
}

export default function TestPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(new Array(30).fill(null))
  const [timeLeft, setTimeLeft] = useState(30 * 60) // 30 minutos en segundos
  const [isFinished, setIsFinished] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const data: TestData = testData

  // Timer
  useEffect(() => {
    if (timeLeft > 0 && !isFinished) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
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

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestion] = answerIndex
    setSelectedAnswers(newAnswers)
  }

  const nextQuestion = () => {
    if (currentQuestion < data.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const finishTest = () => {
    setIsFinished(true)
    setShowResults(true)
  }

  const calculateResults = () => {
    let correct = 0
    let incorrect = 0
    let unanswered = 0

    selectedAnswers.forEach((answer, index) => {
      if (answer === null) {
        unanswered++
      } else if (answer === data.questions[index].correctAnswer) {
        correct++
      } else {
        incorrect++
      }
    })

    return { correct, incorrect, unanswered }
  }

  const restartTest = () => {
    setCurrentQuestion(0)
    setSelectedAnswers(new Array(30).fill(null))
    setTimeLeft(30 * 60)
    setIsFinished(false)
    setShowResults(false)
  }

  const results = calculateResults()
  const passed = results.correct >= 27

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
              {/* Resultados */}
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

              {/* Progreso */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Puntuación</span>
                  <span>
                    {results.correct}/30 ({Math.round((results.correct / 30) * 100)}%)
                  </span>
                </div>
                <Progress value={(results.correct / 30) * 100} className="h-3" />
              </div>

              {/* Revisión de respuestas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Revisión de respuestas</h3>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {data.questions.map((_, index) => {
                    const userAnswer = selectedAnswers[index]
                    const isCorrect = userAnswer === data.questions[index].correctAnswer
                    const isUnanswered = userAnswer === null

                    return (
                      <div
                        key={index}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium ${
                          isUnanswered
                            ? "bg-muted text-muted-foreground"
                            : isCorrect
                              ? "bg-chart-4 text-white"
                              : "bg-destructive text-white"
                        }`}
                      >
                        {index + 1}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Acciones */}
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

  const question = data.questions[currentQuestion]
  const progress = ((currentQuestion + 1) / data.questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
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
              <Badge variant="outline" className="font-mono">
                <Clock className="w-3 h-3 mr-1" />
                {formatTime(timeLeft)}
              </Badge>
              <Badge className="bg-accent text-accent-foreground">
                {selectedAnswers.filter((a) => a !== null).length}/{data.questions.length}
              </Badge>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </header>

      {/* Question */}
      <main className="py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-xl text-balance leading-relaxed">{question.question}</CardTitle>
                <Badge variant="secondary" className="ml-4 shrink-0">
                  {currentQuestion + 1}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Image if exists */}
              {question.image && (
                <div className="flex justify-center">
                  <img
                    src={question.image || "/placeholder.svg"}
                    alt="Imagen de la pregunta"
                    className="max-w-xs rounded-lg border border-border/50"
                  />
                </div>
              )}

              {/* Options */}
              <div className="space-y-3">
                {question.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all hover:bg-muted/50 ${
                      selectedAnswers[currentQuestion] === index
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-card hover:border-border/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium ${
                          selectedAnswers[currentQuestion] === index
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground text-muted-foreground"
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="text-balance">{option}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={prevQuestion} disabled={currentQuestion === 0}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>

                <div className="flex gap-2">
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
              </div>
            </CardContent>
          </Card>

          {/* Question Navigator */}
          <Card className="mt-6 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                {data.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      index === currentQuestion
                        ? "bg-primary text-primary-foreground"
                        : selectedAnswers[index] !== null
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
