import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAndResetStreak, getTodayInTz, getDateStr } from "@/lib/streak";
import { getMakeupDates, getMakeupCost, getDaysAgo } from "@/lib/makeup";
import { getAuthUserId } from "@/lib/auth-helper";
import { pickBestDifficulty } from "@/lib/daily-logic";
import { checkDailyLoginBonus } from "@/lib/stars";
import type { DailyResponse, HintData, StarterCode } from "@/types";
import { StarTransactionReason, type Difficulty } from "@prisma/client";
import { parseProblemExamples } from "@/lib/problem-utils";
import { TIME_LIMIT_DEFAULTS } from "@/lib/game-config";
import { fromZonedTime } from "date-fns-tz";

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

  const timeZone =
    (req.headers.get("x-timezone") ??
      decodeURIComponent(
        req.headers.get("cookie")?.match(/tz=([^;]+)/)?.[1] ?? "",
      )) ||
    "UTC";
  await checkAndResetStreak(userId, timeZone);

  const today = getTodayInTz(timeZone);

  const [hintPassesToday, hintPassesUsedToday, loginBonus, user] =
    await Promise.all([
      prisma.starTransaction.count({
        where: {
          userId,
          reason: StarTransactionReason.HINT_DISCOUNT_PURCHASE,
          createdAt: { gte: new Date(today + "T00:00:00") },
        },
      }),
      prisma.starTransaction.count({
        where: {
          userId,
          reason: StarTransactionReason.HINT_DISCOUNT_USED,
          createdAt: { gte: new Date(today + "T00:00:00") },
        },
      }),
      checkDailyLoginBonus(userId, today),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);

  // ── Check skip intent ─────────────────────────────────────────────────
  const skipActive = user?.skipRequestedAt
    ? getDateStr(user.skipRequestedAt, timeZone) === today
    : false;

  // ── Today's scheduled problems ────────────────────────────────────────
  const todaySlots = await prisma.dailyProblem.findMany({
    where: { date: today },
    include: { problem: true },
  });

  const availableSlots = todaySlots.filter(
    (s) => s.problem && !s.problem.deletedAt,
  );

  // ── Helper: pick a random problem ────────────────────────────────────
  async function pickRandomProblem(excludeId?: string) {
    return prisma.problem.findMany({
      where: {
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  // ── Helper: build common tail of the response ─────────────────────────
  async function buildTail() {
    const pastDates = [today, ...getMakeupDates(30)];
    const allPastSlots = await prisma.dailyProblem.findMany({
      where: { date: { in: pastDates } },
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            topics: true,
            slug: true,
            deletedAt: true,
          },
        },
      },
    });

    const allPastProblemIds = allPastSlots.map((s) => s.problemId);
    const existingSolves = await prisma.solve.findMany({
      where: { userId, problemId: { in: allPastProblemIds }, passed: true },
      select: { problemId: true },
    });
    const solvedProblemIds = new Set(existingSolves.map((s) => s.problemId));

    const solvedDates = new Set<string>();
    for (const slot of allPastSlots) {
      if (solvedProblemIds.has(slot.problemId)) solvedDates.add(slot.date);
    }

    const makeupDays = allPastSlots
      .filter((s) => s.problem && !s.problem.deletedAt)
      .map((s) => ({
        date: s.date,
        daysAgo: getDaysAgo(s.date),
        problemId: s.problemId,
        problemSlug: s.problem.slug,
        problemTitle: s.problem.title,
        difficulty: s.problem.difficulty,
        topics: s.problem.topics,
        starCost: getMakeupCost(getDaysAgo(s.date)),
        alreadySolved: solvedProblemIds.has(s.problemId),
        dateHasAnySolved: solvedDates.has(s.date),
      }))
      .sort(
        (a, b) =>
          a.daysAgo - b.daysAgo || a.difficulty.localeCompare(b.difficulty),
      );

    const [
      freshUser,
      skipPurchases,
      skipUsed,
      timeLimitConfigs,
      hintDiscountBought,
      hintDiscountUsed,
      explainCostConfig,
      reviewCostConfig,
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.starTransaction.count({
        where: { userId, reason: "PROBLEM_SKIP" },
      }),
      prisma.starTransaction.count({
        where: { userId, reason: "PROBLEM_SKIP_USED" },
      }),
      prisma.appConfig.findMany({
        where: {
          key: { in: ["HARD_TIME_EASY", "HARD_TIME_MEDIUM", "HARD_TIME_HARD"] },
        },
      }),
      prisma.starTransaction.count({
        where: { userId, reason: "HINT_DISCOUNT_PURCHASE" },
      }),
      prisma.starTransaction.count({
        where: { userId, reason: "HINT_DISCOUNT_USED" as any },
      }),
      prisma.appConfig.findUnique({ where: { key: "AI_EXPLAIN_COST" } }),
      prisma.appConfig.findUnique({ where: { key: "AI_CODE_REVIEW_COST" } }),
    ]);

    const timeLimitMap = Object.fromEntries(
      timeLimitConfigs.map((c) => [c.key, parseInt(c.value)]),
    );

    return {
      makeupDays,
      makeupRewardGivenToday: freshUser?.lastMakeupDate === today,
      loginBonus,
      userStats: {
        currentStreak: freshUser?.currentStreak ?? 0,
        longestStreak: freshUser?.longestStreak ?? 0,
        stars: freshUser?.stars ?? 10,
        lastSolvedAt: freshUser?.lastSolvedAt?.toISOString() ?? null,
        streakFreezeCount: freshUser?.streakFreezeCount ?? 0,
        streakStatus: freshUser?.streakStatus ?? "ACTIVE",
        frozenStreakValue: freshUser?.frozenStreakValue ?? 0,
      },
      skipCount: Math.max(0, skipPurchases - skipUsed),
      hardTimeLimits: {
        EASY:
          timeLimitMap["HARD_TIME_EASY"] ?? TIME_LIMIT_DEFAULTS.HARD_TIME_EASY,
        MEDIUM:
          timeLimitMap["HARD_TIME_MEDIUM"] ??
          TIME_LIMIT_DEFAULTS.HARD_TIME_MEDIUM,
        HARD:
          timeLimitMap["HARD_TIME_HARD"] ?? TIME_LIMIT_DEFAULTS.HARD_TIME_HARD,
      },
      hintDiscount: Math.max(0, hintDiscountBought - hintDiscountUsed),
      explainCost: explainCostConfig ? parseInt(explainCostConfig.value) : 5,
      reviewCost: reviewCostConfig ? parseInt(reviewCostConfig.value) : 5,
    };
  }

  // ── No problem scheduled today ────────────────────────────────────────
  if (availableSlots.length === 0) {
    // If skip is active, serve a random problem instead of no-problem screen
    if (skipActive) {
      const allProblems = await pickRandomProblem();
      if (allProblems.length > 0) {
        const random =
          allProblems[Math.floor(Math.random() * allProblems.length)];
        await prisma.user.update({
          where: { id: userId },
          data: { skippedProblemId: random.id, skipRequestedAt: null },
        });

        const tail = await buildTail();
        const purchases = await prisma.hintPurchase.findMany({
          where: { userId, problemId: random.id },
          select: { tier: true },
        });
        const unlockedTiers = purchases.map((p) => p.tier);
        const unlockedHintContents: Record<number, string> = {};
        for (const tier of unlockedTiers) {
          const hint = (random.hints as HintData[]).find(
            (h) => h.tier === tier,
          );
          if (hint) unlockedHintContents[tier] = hint.content;
        }

        return NextResponse.json({
          problem: {
            id: random.id,
            title: random.title,
            slug: random.slug,
            description: random.description,
            examples: parseProblemExamples(random.examples),
            constraints: random.constraints,
            difficulty: random.difficulty,
            topics: random.topics,
            functionName: random.functionName,
            starterCode: random.starterCode as StarterCode,
          },
          difficultyNote: null,
          alreadySolved: false,
          hintsUnlocked: unlockedTiers,
          unlockedHintContents,
          ...tail,
        } satisfies DailyResponse);
      }
    }

    // Normal no-problem day
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
      hintDiscount: hintPassesToday > hintPassesUsedToday ? 1 : 0,
    });
  }

  // ── Pick best problem for user's preferred difficulty ─────────────────
  const availableDifficulties = availableSlots.map(
    (s) => s.difficulty,
  ) as Difficulty[];
  const bestDifficulty = pickBestDifficulty(
    user?.preferredDifficulty ?? "ANY",
    availableDifficulties,
  )!;
  const bestSlot = availableSlots.find((s) => s.difficulty === bestDifficulty)!;

  let finalProblem = bestSlot.problem;

  // ── Apply skip ────────────────────────────────────────────────────────
  if (skipActive) {
    const allProblems = await pickRandomProblem(bestSlot.problem.id);
    if (allProblems.length > 0) {
      const random =
        allProblems[Math.floor(Math.random() * allProblems.length)];
      finalProblem = random;
      await prisma.user.update({
        where: { id: userId },
        data: { skippedProblemId: random.id, skipRequestedAt: null },
      });
    }
  } else if (user?.skippedProblemId) {
    // Skip was already applied — keep showing the same skipped problem until solved
    const skipped = await prisma.problem.findUnique({
      where: { id: user.skippedProblemId, deletedAt: null },
    });
    if (skipped) finalProblem = skipped;
  }

  const problem = finalProblem;

  const isExactMatch =
    user?.preferredDifficulty === "ANY" ||
    user?.preferredDifficulty === bestDifficulty;
  const difficultyNote = !isExactMatch
    ? `No ${user?.preferredDifficulty?.toLowerCase()} problem today — showing ${bestDifficulty.toLowerCase()} instead.`
    : null;

  const todayStartUTC = fromZonedTime(`${today}T00:00:00`, timeZone);
  const todayEndUTC = fromZonedTime(`${today}T23:59:59`, timeZone);

  // Check solved status
  const anySolvedToday = await prisma.solve.findFirst({
    where: {
      userId,
      passed: true,
      isMakeup: false,
      solvedAt: {
        gte: todayStartUTC,
        lt: todayEndUTC,
      },
    },
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

  const tail = await buildTail();

  const response: DailyResponse = {
    problem: {
      id: finalProblem.id,
      title: finalProblem.title,
      slug: finalProblem.slug,
      description: finalProblem.description,
      examples: parseProblemExamples(finalProblem.examples),
      constraints: finalProblem.constraints,
      difficulty: finalProblem.difficulty,
      topics: finalProblem.topics,
      functionName: finalProblem.functionName,
      starterCode: finalProblem.starterCode as StarterCode,
    },
    difficultyNote,
    alreadySolved: !!anySolvedToday,
    hintsUnlocked: unlockedTiers,
    unlockedHintContents,
    ...tail,
  };

  return NextResponse.json(response);
}
