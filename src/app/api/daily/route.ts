import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAndResetStreak, getTodayUTC } from "@/lib/streak";
import { getMakeupDates, getMakeupCost, getDaysAgo } from "@/lib/makeup";
import { format } from "date-fns";
import type { DailyResponse, HintData, StarterCode } from "@/types";

export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  // ── Build makeup days list ────────────────────────────────────────────
  const pastDates = getMakeupDates(30);

  // Get all daily problems for past dates that exist
  const pastDailyProblems = await prisma.dailyProblem.findMany({
    where: { date: { in: pastDates } },
    include: {
      problem: {
        select: { id: true, title: true, difficulty: true, topic: true },
      },
    },
  });

  // Get user's existing solves for those problems
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
    .sort((a, b) => a.daysAgo - b.daysAgo); // most recent first

  const makeupRewardGivenToday = user?.lastMakeupDate === today;

  const publicProblem = {
    id: problem.id,
    title: problem.title,
    slug: problem.slug,
    description: problem.description,
    difficulty: problem.difficulty,
    topic: problem.topic,
    starterCode: problem.starterCode as StarterCode,
  };

  const response: DailyResponse = {
    problem: publicProblem,
    alreadySolved: !!existingSolve?.passed,
    hintsUnlocked: unlockedTiers,
    unlockedHintContents,
    makeupDays,
    makeupRewardGivenToday,
    userStats: {
      currentStreak: user?.currentStreak ?? 0,
      longestStreak: user?.longestStreak ?? 0,
      stars: user?.stars ?? 10,
      lastSolvedAt: user?.lastSolvedAt?.toISOString() ?? null,
    },
  };

  return NextResponse.json(response);
}
