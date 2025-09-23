export type StoredTestStatus = "incomplete" | "approved" | "failed"

export interface StoredTestState {
  testId: string
  category: string
  answers: (string | null)[]
  currentQuestion: number
  status: StoredTestStatus
  score?: number
  totalQuestions?: number
  completedAt?: string
  updatedAt: string
  timeLeft?: number
}

const STORAGE_KEY = "autotest-test-state"

const isBrowser = typeof window !== "undefined"

function readStorage(): Record<string, StoredTestState> {
  if (!isBrowser) {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {}
    }

    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, StoredTestState>
    }
  } catch (error) {
    console.warn("Failed to read stored test state", error)
  }

  return {}
}

function writeStorage(map: Record<string, StoredTestState>) {
  if (!isBrowser) {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch (error) {
    console.warn("Failed to persist test state", error)
  }
}

export function getStoredTestState(testId: string): StoredTestState | null {
  const allStates = readStorage()
  const state = allStates[testId]

  if (!state) {
    return null
  }

  return {
    ...state,
    testId,
    answers: Array.isArray(state.answers) ? [...state.answers] : [],
  }
}

export function setStoredTestState(testId: string, state: StoredTestState | null): StoredTestState | null {
  if (!isBrowser) {
    return null
  }

  const allStates = readStorage()

  if (!state) {
    if (testId in allStates) {
      delete allStates[testId]
      writeStorage(allStates)
    }
    return null
  }

  const normalized: StoredTestState = {
    ...state,
    testId,
    updatedAt: state.updatedAt || new Date().toISOString(),
    answers: Array.isArray(state.answers) ? [...state.answers] : [],
  }

  allStates[testId] = normalized
  writeStorage(allStates)
  return normalized
}

export function clearStoredTestState(testId: string) {
  setStoredTestState(testId, null)
}

export function getStoredTestsByCategory(category: string): StoredTestState[] {
  const allStates = readStorage()

  return Object.values(allStates)
    .filter((state) => state.category === category)
    .map((state) => ({
      ...state,
      answers: Array.isArray(state.answers) ? [...state.answers] : [],
    }))
}

export function getAllStoredTestStates(): StoredTestState[] {
  const allStates = readStorage()
  return Object.values(allStates).map((state) => ({
    ...state,
    answers: Array.isArray(state.answers) ? [...state.answers] : [],
  }))
}
