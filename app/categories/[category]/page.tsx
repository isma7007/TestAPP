import fs from "fs"
import path from "path"
import Link from "next/link"

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const testsDir = path.join(process.cwd(), "public", "tests")

  let tests: any[] = []

  try {
    const files = fs.readdirSync(testsDir)

    tests = files
      .filter((f) => f.endsWith(".json"))
      .map((f) => {
        const filePath = path.join(testsDir, f)
        const content = JSON.parse(fs.readFileSync(filePath, "utf-8"))
        return content
      })
      .filter((t) => t.category === params.category)
  } catch (error) {
    console.error("Error loading tests:", error)
  }

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
