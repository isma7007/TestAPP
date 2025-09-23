export interface TestProgress {
  id: string
  user_id: string
  test_id: string
  category_code: string
  current_question: number
  answers: Record<number, string>
  started_at: string
  updated_at: string
}

export interface TestResult {
  id: string
  user_id: string
  test_pack: string
  category_code: string
  score: number
  total_questions: number
  passed: boolean
  completed_at: string
  test_mode: string
}

export type TestStatus = "approved" | "failed" | "pending" | null
