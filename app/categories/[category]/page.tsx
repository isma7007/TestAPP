"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface TestSummary {
  id: string
  title: string
  category: string
}

export default function CategoryPage({ params }: { params: { category: string } }) {
  const [tests, setTests] = useState<TestSummary[]>([])

  useEffect(() => {
    async function loadTests() {
      try {
        // Leemos el índice desde /public/tests/index.json
        const res = await fetch("/tests/index.json")
        const allTests: TestSummary[] = await res.json()

        // Filtramos por categoría
        const filtered = allTests.filter((t) => t.category === params.category)
        setTests(filtered)
      } catch (error) {
        console.error("Error cargando índice de tests:", error)
      }
    }

    loadTests()
  }, [params.category])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Tests Disponibles</h1>
      {tests.length === 0 ? (
        <p>No hay tests disponibles para esta categoría.</p>
      ) : (
        <ul className="space-y-3">
          {tests.map((test) => (
            <li key={test.id}>
              <Link href={`/test/${test.id}`} className="text-blue-600 hover:underline">
                {test.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
