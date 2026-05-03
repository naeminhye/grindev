import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAndResetStreak, getTodayUTC } from "@/lib/streak";
import { getMakeupDates, getMakeupCost, getDaysAgo } from "@/lib/makeup";
import { getAuthUserId } from "@/lib/auth-helper";
import type { DailyResponse, HintData, StarterCode } from "@/types";

export async function GET() {
  const { userId, error } = await getAuthUserId();
  if (error) return error;

  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId },
  });

  await checkAndResetStreak(userId);

  const today = getTodayUTC();

  const daily = await prisma.dailyProblem.findUnique({
    where: { date: today },
    include: { problem: true },
  });

  if (!daily) {
    return NextResponse.json(
      { error: "No problem scheduled for today" },
      { status: 404 },
    );
  }

  const { problem } = daily;

  const existingSolve = await prisma.solve.findUnique({
    where: { userId_problemId: { userId, problemId: problem.id } },
  });

  const purchases = await prisma.hintPurchase.findMany({
    where: { userId, problemId: problem.id },
    select: { tier: true },
  });

  const allHints = problem.hints as HintData[];
  const unlockedTiers = purchases.map((p) => p.tier);
  const unlockedHintContents: Record<number, string> = {};
  for (const tier of unlockedTiers) {
    const hint = allHints.find((h) => h.tier === tier);
    if (hint) unlockedHintContents[tier] = hint.content;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  const pastDates = getMakeupDates(30);
  const pastDailyProblems = await prisma.dailyProblem.findMany({
    where: { date: { in: pastDates } },
    include: {
      problem: {
        select: { id: true, title: true, difficulty: true, topic: true },
      },
    },
  });

  const pastProblemIds = pastDailyProblems.map((d) => d.problemId);
  const existingSolves = await prisma.solve.findMany({
    where: { userId, problemId: { in: pastProblemIds } },
    select: { problemId: true, passed: true },
  });
  const solvedProblemIds = new Set(
    existingSolves.filter((s) => s.passed).map((s) => s.problemId),
  );

  const makeupDays = pastDailyProblems
    .map((d) => ({
      date: d.date,
      daysAgo: getDaysAgo(d.date),
      problemId: d.problemId,
      problemTitle: d.problem.title,
      difficulty: d.problem.difficulty,
      topic: d.problem.topic,
      starCost: getMakeupCost(getDaysAgo(d.date)),
      alreadySolved: solvedProblemIds.has(d.problemId),
    }))
    .sort((a, b) => a.daysAgo - b.daysAgo);

  const response: DailyResponse = {
    problem: {
      id: problem.id,
      title: problem.title,
      slug: problem.slug,
      description: problem.description,
      difficulty: problem.difficulty,
      topic: problem.topic,
      starterCode: problem.starterCode as StarterCode,
    },
    alreadySolved: !!existingSolve?.passed,
    hintsUnlocked: unlockedTiers,
    unlockedHintContents,
    makeupDays,
    makeupRewardGivenToday: user?.lastMakeupDate === today,
    userStats: {
      currentStreak: user?.currentStreak ?? 0,
      longestStreak: user?.longestStreak ?? 0,
      stars: user?.stars ?? 10,
      lastSolvedAt: user?.lastSolvedAt?.toISOString() ?? null,
    },
  };

  return NextResponse.json(response);
}
