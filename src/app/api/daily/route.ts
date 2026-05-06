import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAndResetStreak, getTodayUTC } from "@/lib/streak";
import { getMakeupDates, getMakeupCost, getDaysAgo } from "@/lib/makeup";
import { getAuthUserId } from "@/lib/auth-helper";
import { pickBestDifficulty } from "@/lib/daily-logic";
import {
  parseProblemExamples,
  type DailyResponse,
  type HintData,
  type StarterCode,
} from "@/types";
import type { Difficulty } from "@prisma/client";

const NO_PROBLEM_BONUS_KEY = "NO_PROBLEM_BONUS_STARS";
const DEFAULT_BONUS = 5;

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
  const user = await prisma.user.findUnique({ where: { id: userId } });

  // ── Get all problems scheduled for today ──────────────────────────────
  const todaySlots = await prisma.dailyProblem.findMany({
    where: { date: today },
    include: { problem: true },
  });

  const availableSlots = todaySlots.filter((s) => s.problem);
  const availableDifficulties = availableSlots.map(
    (s) => s.difficulty,
  ) as Difficulty[];

  // ── No problem today ──────────────────────────────────────────────────
  if (availableSlots.length === 0) {
    const bonusAlreadyGiven = user?.lastNoProblemBonus === today;
    let bonusStars = 0;

    if (!bonusAlreadyGiven) {
      const config = await prisma.appConfig.findUnique({
        where: { key: NO_PROBLEM_BONUS_KEY },
      });
      bonusStars = config ? parseInt(config.value) : DEFAULT_BONUS;
      await prisma.user.update({
        where: { id: userId },
        data: {
          stars: { increment: bonusStars },
          lastNoProblemBonus: today,
        },
      });
    }

    return NextResponse.json({
      noProblemToday: true,
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

  // ── Pick best problem for user's preferred difficulty ─────────────────
  const bestDifficulty = pickBestDifficulty(
    user?.preferredDifficulty ?? "ANY",
    availableDifficulties,
  )!;

  const bestSlot = availableSlots.find((s) => s.difficulty === bestDifficulty)!;
  const problem = bestSlot.problem;

  const isExactMatch =
    user?.preferredDifficulty === "ANY" ||
    user?.preferredDifficulty === bestDifficulty;
  const difficultyNote = !isExactMatch
    ? `No ${user?.preferredDifficulty?.toLowerCase()} problem today — showing ${bestDifficulty.toLowerCase()} instead.`
    : null;

  // ── checks all of today's problems ───────────────
  const todayProblemIds = availableSlots.map((s) => s.problem.id);
  const anySolvedToday = await prisma.solve.findFirst({
    where: {
      userId,
      problemId: { in: todayProblemIds },
      passed: true,
    },
  });

  const existingSolve = await prisma.solve.findUnique({
    where: { userId_problemId: { userId, problemId: problem.id } },
  });

  // ── Hints already purchased ───────────────────────────────────────────
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

  // ── Makeup days ───────────────────────────────────────────────────────
  const pastDates = getMakeupDates(30);
  const pastSlots = await prisma.dailyProblem.findMany({
    where: { date: { in: pastDates } },
    include: {
      problem: {
        select: { id: true, title: true, difficulty: true, topics: true },
      },
    },
    orderBy: { date: "desc" },
  });

  // Dedupe by date — for makeup, show the hardest scheduled problem per day
  const makeupByDate = new Map<string, (typeof pastSlots)[0]>();
  for (const slot of pastSlots) {
    const existing = makeupByDate.get(slot.date);
    if (!existing) {
      makeupByDate.set(slot.date, slot);
    } else {
      const order = ["EASY", "MEDIUM", "HARD"];
      if (order.indexOf(slot.difficulty) > order.indexOf(existing.difficulty)) {
        makeupByDate.set(slot.date, slot);
      }
    }
  }

  const pastProblemIds = [...makeupByDate.values()].map((s) => s.problemId);
  const existingSolves = await prisma.solve.findMany({
    where: { userId, problemId: { in: pastProblemIds } },
    select: { problemId: true, passed: true },
  });
  const solvedProblemIds = new Set(
    existingSolves.filter((s) => s.passed).map((s) => s.problemId),
  );

  const makeupDays = [...makeupByDate.values()]
    .map((s) => ({
      date: s.date,
      daysAgo: getDaysAgo(s.date),
      problemId: s.problemId,
      problemTitle: s.problem.title,
      difficulty: s.problem.difficulty,
      topics: s.problem.topics,
      starCost: getMakeupCost(getDaysAgo(s.date)),
      alreadySolved: solvedProblemIds.has(s.problemId),
    }))
    .sort((a, b) => a.daysAgo - b.daysAgo);

  const freshUser = await prisma.user.findUnique({ where: { id: userId } });

  const response: DailyResponse = {
    problem: {
      id: problem.id,
      title: problem.title,
      slug: problem.slug,
      description: problem.description,
      examples: parseProblemExamples(problem.examples),
      constraints: problem.constraints,
      difficulty: problem.difficulty,
      topics: problem.topics,
      functionName: problem.functionName,
      starterCode: problem.starterCode as StarterCode,
    },
    difficultyNote,
    alreadySolved: !!anySolvedToday,
    hintsUnlocked: unlockedTiers,
    unlockedHintContents,
    makeupDays,
    makeupRewardGivenToday: freshUser?.lastMakeupDate === today,
    userStats: {
      currentStreak: freshUser?.currentStreak ?? 0,
      longestStreak: freshUser?.longestStreak ?? 0,
      stars: freshUser?.stars ?? 10,
      lastSolvedAt: freshUser?.lastSolvedAt?.toISOString() ?? null,
    },
  };

  return NextResponse.json(response);
}
