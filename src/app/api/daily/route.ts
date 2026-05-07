import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAndResetStreak, getTodayInTz } from "@/lib/streak";
import { getMakeupDates, getMakeupCost, getDaysAgo } from "@/lib/makeup";
import { getAuthUserId } from "@/lib/auth-helper";
import { pickBestDifficulty } from "@/lib/daily-logic";
import { checkDailyLoginBonus } from "@/lib/stars";
import type { DailyResponse, HintData, StarterCode } from "@/types";
import type { Difficulty } from "@prisma/client";
import { parseProblemExamples } from "@/lib/problem-utils";

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

  await checkAndResetStreak(userId);

  const timeZone = req.headers.get("x-timezone") ?? "UTC";
  const today = getTodayInTz(timeZone);

  // Daily login bonus
  const loginBonus = await checkDailyLoginBonus(userId, today);

  const user = await prisma.user.findUnique({ where: { id: userId } });

  // Get today's scheduled problems
  const todaySlots = await prisma.dailyProblem.findMany({
    where: { date: today },
    include: { problem: true },
  });

  const availableSlots = todaySlots.filter(
    (s) => s.problem && !s.problem.deletedAt,
  );
  const availableDifficulties = availableSlots.map(
    (s) => s.difficulty,
  ) as Difficulty[];

  // No problem today
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
        data: { stars: { increment: bonusStars }, lastNoProblemBonus: today },
      });
    }

    const freshUser = await prisma.user.findUnique({ where: { id: userId } });
    return NextResponse.json({
      noProblemToday: true,
      bonusStars: bonusAlreadyGiven ? 0 : bonusStars,
      bonusAlreadyGiven,
      loginBonus,
      userStats: {
        currentStreak: freshUser?.currentStreak ?? 0,
        longestStreak: freshUser?.longestStreak ?? 0,
        stars: freshUser?.stars ?? 10,
        lastSolvedAt: freshUser?.lastSolvedAt?.toISOString() ?? null,
        streakFreezeCount: freshUser?.streakFreezeCount ?? 0,
      },
    });
  }

  // Pick best problem for user's preferred difficulty
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

  // Check solved status across all today's problems
  const todayProblemIds = availableSlots.map((s) => s.problem.id);
  const anySolvedToday = await prisma.solve.findFirst({
    where: { userId, problemId: { in: todayProblemIds }, passed: true },
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

  // Makeup days
  const pastDates = getMakeupDates(30);
  const allPastSlots = await prisma.dailyProblem.findMany({
    where: { date: { in: pastDates } },
    include: {
      problem: {
        select: { id: true, title: true, difficulty: true, topics: true },
      },
    },
  });

  const slotsByDate = new Map<string, typeof allPastSlots>();
  for (const slot of allPastSlots) {
    if (!slotsByDate.has(slot.date)) slotsByDate.set(slot.date, []);
    slotsByDate.get(slot.date)!.push(slot);
  }

  const allPastProblemIds = allPastSlots.map((s) => s.problemId);
  const existingSolves = await prisma.solve.findMany({
    where: { userId, problemId: { in: allPastProblemIds }, passed: true },
    select: { problemId: true },
  });
  const solvedProblemIds = new Set(existingSolves.map((s) => s.problemId));

  const makeupByDate = new Map<string, (typeof allPastSlots)[0]>();
  for (const [date, slots] of slotsByDate) {
    const availableDiffs = slots.map((s) => s.difficulty);
    const bestDiff = pickBestDifficulty(
      user?.preferredDifficulty ?? "ANY",
      availableDiffs,
    );
    const bestSlot = slots.find((s) => s.difficulty === bestDiff);
    if (bestSlot) makeupByDate.set(date, bestSlot);
  }

  const makeupDays = [...makeupByDate.values()]
    .map((s) => {
      const dateSlotIds = allPastSlots
        .filter((slot) => slot.date === s.date)
        .map((slot) => slot.problemId);
      const alreadySolved = dateSlotIds.some((id) => solvedProblemIds.has(id));
      return {
        date: s.date,
        daysAgo: getDaysAgo(s.date),
        problemId: s.problemId,
        problemTitle: s.problem.title,
        difficulty: s.problem.difficulty,
        topics: s.problem.topics,
        starCost: getMakeupCost(getDaysAgo(s.date)),
        alreadySolved,
      };
    })
    .sort((a, b) => a.daysAgo - b.daysAgo);

  const freshUser = await prisma.user.findUnique({ where: { id: userId } });

  const [skipPurchases, skipUsed] = await Promise.all([
    prisma.starTransaction.count({
      where: { userId, reason: "PROBLEM_SKIP" },
    }),
    prisma.starTransaction.count({
      where: { userId, reason: "PROBLEM_SKIP_USED" },
    }),
  ]);
  const skipCount = Math.max(0, skipPurchases - skipUsed);

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
    loginBonus,
    userStats: {
      currentStreak: freshUser?.currentStreak ?? 0,
      longestStreak: freshUser?.longestStreak ?? 0,
      stars: freshUser?.stars ?? 10,
      lastSolvedAt: freshUser?.lastSolvedAt?.toISOString() ?? null,
      streakFreezeCount: freshUser?.streakFreezeCount ?? 0,
    },
    skipCount,
  };

  return NextResponse.json(response);
}
