import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth-helper";
import { checkAndResetStreak } from "@/lib/streak";
import { getMakeupDates, getMakeupCost, getDaysAgo } from "@/lib/makeup";
import { getTodayInTz } from "@/lib/streak";
import type { QuizQuestion } from "@/types";

const NO_PROBLEM_BONUS_KEY = "NO_PROBLEM_BONUS_STARS";
const DEFAULT_BONUS = 5;

export async function GET(req: Request) {
  const { userId, error } = await getAuthUserId();
  if (error) return error;

  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId },
  });

  const timeZone = req.headers.get("x-timezone") ?? "UTC";
  await checkAndResetStreak(userId, timeZone);

  const today = getTodayInTz(timeZone);
  const user = await prisma.user.findUnique({ where: { id: userId } });

  // ── Find today's quiz ─────────────────────────────────────────────────
  const dailyQuiz = await prisma.dailyQuiz.findUnique({
    where: { date: today },
    include: { quiz: true },
  });

  if (!dailyQuiz || !dailyQuiz.quiz || dailyQuiz.quiz.deletedAt) {
    const bonusAlreadyGiven = user?.lastNoProblemBonus === today;
    let bonusStars = 0;

    if (!bonusAlreadyGiven) {
      const config = await prisma.appConfig.findUnique({
        where: { key: NO_PROBLEM_BONUS_KEY },
      });
      bonusStars = config ? parseInt(config.value) : DEFAULT_BONUS;
      await prisma.user.update({
        where: { id: userId },
        data: { stars: { increment: bonusStars }, lastNoProblemBonus: today },
      });
    }

    return NextResponse.json({
      noQuizToday: true,
      bonusStars: bonusAlreadyGiven ? 0 : bonusStars,
      bonusAlreadyGiven,
      userStats: {
        currentStreak: user?.currentStreak ?? 0,
        longestStreak: user?.longestStreak ?? 0,
        stars: (user?.stars ?? 0) + bonusStars,
        lastSolvedAt: user?.lastSolvedAt?.toISOString() ?? null,
      },
    });
  }

  const quiz = dailyQuiz.quiz;

  // ── Already solved? ───────────────────────────────────────────────────
  const existing = await prisma.quizAttempt.findUnique({
    where: { userId_quizId: { userId, quizId: quiz.id } },
  });

  // ── Makeup quiz days ──────────────────────────────────────────────────
  const pastDates = getMakeupDates(30);
  const pastQuizSlots = await prisma.dailyQuiz.findMany({
    where: { date: { in: pastDates } },
    include: {
      quiz: {
        select: { id: true, title: true, difficulty: true, topic: true },
      },
    },
    orderBy: { date: "desc" },
  });

  const pastQuizIds = pastQuizSlots.map((s) => s.quizId);
  const solvedAttempts = await prisma.quizAttempt.findMany({
    where: { userId, quizId: { in: pastQuizIds }, passed: true },
    select: { quizId: true },
  });
  const solvedQuizIds = new Set(solvedAttempts.map((a) => a.quizId));

  const makeupDays = pastQuizSlots
    .filter((s) => s.quiz)
    .map((s) => ({
      date: s.date,
      daysAgo: getDaysAgo(s.date),
      problemId: s.quizId,
      problemTitle: s.quiz.title,
      difficulty: s.quiz.difficulty,
      topics: [s.quiz.topic],
      starCost: getMakeupCost(getDaysAgo(s.date)),
      alreadySolved: solvedQuizIds.has(s.quizId),
    }))
    .sort((a, b) => a.daysAgo - b.daysAgo);

  const freshUser = await prisma.user.findUnique({ where: { id: userId } });

  return NextResponse.json({
    quiz: {
      id: quiz.id,
      title: quiz.title,
      topic: quiz.topic,
      difficulty: quiz.difficulty,
      questions: quiz.questions as QuizQuestion[],
    },
    alreadySolved: !!existing?.passed,
    makeupDays,
    makeupRewardGivenToday: freshUser?.lastMakeupDate === today,
    userStats: {
      currentStreak: freshUser?.currentStreak ?? 0,
      longestStreak: freshUser?.longestStreak ?? 0,
      stars: freshUser?.stars ?? 10,
      lastSolvedAt: freshUser?.lastSolvedAt?.toISOString() ?? null,
    },
  });
}
