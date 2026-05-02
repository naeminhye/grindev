import { Difficulty, Topic } from '@prisma/client'

// ─── Problem ─────────────────────────────────────────────────────────────────

export type HintData = {
  tier: 1 | 2 | 3 | 4
  cost: number
  content: string
}

export type TestCase = {
  input: string
  expected: string
}

/** Safe problem shape sent to the client — no test cases, no hint answers */
export type PublicProblem = {
  id: string
  title: string
  slug: string
  description: string
  difficulty: Difficulty
  topic: Topic
  starterCode: string
}

// ─── Solve ───────────────────────────────────────────────────────────────────

export type TestResult = {
  index: number
  passed: boolean
  stderr: string
}

export type SolveResponse = {
  passed: boolean
  results: TestResult[]
  streak?: {
    currentStreak: number
    longestStreak: number
    isNewRecord: boolean
  }
}

// ─── Hints ───────────────────────────────────────────────────────────────────

export type HintResponse = {
  content: string
  tier: number
  starsRemaining: number
}

// ─── User ────────────────────────────────────────────────────────────────────

export type UserStats = {
  currentStreak: number
  longestStreak: number
  stars: number
  lastSolvedAt: string | null
}

// ─── Daily ───────────────────────────────────────────────────────────────────

export type DailyResponse = {
  problem: PublicProblem
  alreadySolved: boolean
  hintsUnlocked: number[]   // tiers already purchased today
  userStats: UserStats
}
