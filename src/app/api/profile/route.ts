// src/app/api/profile/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth-helper'
import { getMakeupDates, getDaysAgo } from '@/lib/makeup'
import { getTodayInTz } from '@/lib/streak'

export async function GET(req: Request) {
  const { userId, error } = await getAuthUserId()
  if (error) return error

  const timeZone =
    (req.headers.get("x-timezone") ??
      decodeURIComponent(
        req.headers.get("cookie")?.match(/tz=([^;]+)/)?.[1] ?? "",
      )) ||
    "UTC";
  const today = getTodayInTz(timeZone);

  const solves = await prisma.solve.findMany({
    where: { userId, passed: true },
    include: {
      problem: { select: { difficulty: true, topics: true } },
    },
    orderBy: { solvedAt: 'desc' },
  })

  type SolveWithProblem = (typeof solves)[number]

  const quizAttempts = await prisma.quizAttempt.findMany({
    where: { userId, passed: true },
    include: {
      quiz: { select: { difficulty: true, topic: true } },
    },
    orderBy: { solvedAt: 'desc' },
  })

  type QuizAttemptWithQuiz = (typeof quizAttempts)[number]

  const [user] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        currentStreak: true,
        longestStreak: true,
        stars: true,
        challengeMode: true,
        practiceMode: true,
      },
    }),
    prisma.solve.findMany({
      where: { userId, passed: true },
      include: {
        problem: { select: { difficulty: true, topics: true } },
      },
      orderBy: { solvedAt: 'desc' },
    }),
    prisma.quizAttempt.findMany({
      where: { userId, passed: true },
      include: {
        quiz: { select: { difficulty: true, topic: true } },
      },
      orderBy: { solvedAt: 'desc' },
    }),
  ])

  // ── DSA stats ─────────────────────────────────────────────────────────
  const totalSolves = solves.length
  const cleanSolves = solves.filter((s) => s.cleanSolve).length
  const hardModeSolves = solves.filter((s) => s.challengeMode === 'HARD').length
  const totalAttempts = solves.reduce((sum, s) => sum + s.attempts, 0)

  const topicMap = new Map<string, number>()
  for (const s of solves) {
    for (const topic of s.problem.topics as string[]) {
      topicMap.set(topic, (topicMap.get(topic) ?? 0) + 1)
    }
  }
  const topicBreakdown = [...topicMap.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const diffMap = new Map<string, number>()
  for (const s of solves) {
    const d = s.problem.difficulty
    diffMap.set(d, (diffMap.get(d) ?? 0) + 1)
  }
  const difficultyBreakdown = [...diffMap.entries()].map(([difficulty, count]) => ({ difficulty, count }))

  // ── Quiz stats ────────────────────────────────────────────────────────
  const totalQuizzes = quizAttempts.length
  const perfectQuizzes = quizAttempts.filter((a) => a.score === a.total).length
  const totalQuizScore = quizAttempts.reduce((sum, a) => sum + a.score, 0)
  const totalQuizQuestions = quizAttempts.reduce((sum, a) => sum + a.total, 0)
  const avgScore = totalQuizzes > 0
    ? Math.round((totalQuizScore / totalQuizQuestions) * 100)
    : 0

  const quizTopicMap = new Map<string, number>()
  for (const a of quizAttempts) {
    const topic = a.quiz.topic
    quizTopicMap.set(topic, (quizTopicMap.get(topic) ?? 0) + 1)
  }
  const quizTopicBreakdown = [...quizTopicMap.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)

  const quizDiffMap = new Map<string, number>()
  for (const a of quizAttempts) {
    const d = a.quiz.difficulty
    quizDiffMap.set(d, (quizDiffMap.get(d) ?? 0) + 1)
  }
  const quizDifficultyBreakdown = [...quizDiffMap.entries()].map(([difficulty, count]) => ({ difficulty, count }))

  // ── Activity (last 26 weeks = 182 days) ───────────────────────────────
  const totalDays = 26 * 7
  const pastDates: string[] = []
  for (let i = 0; i < totalDays; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    pastDates.push(d.toLocaleDateString('en-CA', { timeZone }))
  }
  const allDates = [...new Set([today, ...pastDates])]

  // Dates with a normal DSA solve
  const dsaSolvedDates = new Set(
    solves
      .filter((s) => !s.isMakeup)
      .map((s) => new Date(s.solvedAt).toLocaleDateString('en-CA', { timeZone }))
  )

  // Dates with a makeup solve (use makeupDate)
  const makeupSolvedDates = new Set(
    solves
      .filter((s) => s.isMakeup && s.makeupDate)
      .map((s) => s.makeupDate!)
  )

  // Dates with a quiz solve
  const quizSolvedDates = new Set(
    quizAttempts
      .filter((a) => !a.isMakeup)
      .map((a) => new Date(a.solvedAt).toLocaleDateString('en-CA', { timeZone }))
  )

  const recentActivity = allDates.map((date) => ({
    date,
    solved: dsaSolvedDates.has(date) || quizSolvedDates.has(date),
    isMakeup: makeupSolvedDates.has(date) && !dsaSolvedDates.has(date),
    hasDSA: dsaSolvedDates.has(date),
    hasQuiz: quizSolvedDates.has(date),
    hasMakeup: makeupSolvedDates.has(date),
  }))

  return NextResponse.json({
    // User
    currentStreak: user?.currentStreak ?? 0,
    longestStreak: user?.longestStreak ?? 0,
    stars: user?.stars ?? 0,
    challengeMode: user?.challengeMode ?? 'NORMAL',
    practiceMode: user?.practiceMode ?? 'DSA',

    // DSA stats
    totalSolves,
    cleanSolves,
    hardModeSolves,
    totalAttempts,
    topicBreakdown,
    difficultyBreakdown,

    // Quiz stats
    totalQuizzes,
    perfectQuizzes,
    avgScore,
    quizTopicBreakdown,
    quizDifficultyBreakdown,

    // Heatmap
    recentActivity,
  })
}