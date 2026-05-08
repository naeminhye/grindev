import { getAuthUserId } from "@/lib/auth-helper";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMakeupCost, getDaysAgo } from "@/lib/makeup";
import { getTodayUTC } from "@/lib/streak";
import { type MakeupProblemResponse, type HintData } from "@/types";
import { parseProblemExamples } from "@/lib/problem-utils";
import { DEFAULT_EXPLAIN_COST } from "../../ai/explain/route";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ date: string }> },
) {
  const { userId, error } = await getAuthUserId();
  if (error) return NextResponse.json({ error }, { status: 401 });

  const { date } = await params;

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  // Can't makeup today or future
  const today = getTodayUTC();
  if (date >= today) {
    return NextResponse.json(
      { error: "Can only make up past problems" },
      { status: 400 },
    );
  }

  const daily = await prisma.dailyProblem.findFirst({
    where: { date },
    include: { problem: true },
  });

  if (!daily) {
    return NextResponse.json(
      { error: "No problem found for this date" },
      { status: 404 },
    );
  }

  const { problem } = daily;
  const daysAgo = getDaysAgo(date);
  const starCost = getMakeupCost(daysAgo);

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
  const makeupRewardGivenToday = user?.lastMakeupDate === today;
  const [explainCostConfig, hintDiscountBought, hintDiscountUsed] =
    await Promise.all([
      prisma.appConfig.findUnique({ where: { key: "AI_EXPLAIN_COST" } }),
      prisma.starTransaction.count({
        where: { userId, reason: "HINT_DISCOUNT_PURCHASE" },
      }),
      prisma.starTransaction.count({
        where: { userId, reason: "HINT_DISCOUNT_USED" as any },
      }),
    ]);
  const reviewCostConfig = await prisma.appConfig.findUnique({
    where: { key: "AI_CODE_REVIEW_COST" },
  });

  const response: MakeupProblemResponse = {
    problem: {
      id: problem.id,
      title: problem.title,
      slug: problem.slug,
      functionName: problem.functionName,
      description: problem.description,
      examples: parseProblemExamples(problem.examples),
      constraints: problem.constraints ?? "",
      difficulty: problem.difficulty,
      topics: problem.topics,
      starterCode: problem.starterCode as any,
    },
    date,
    daysAgo,
    starCost,
    alreadySolved: !!existingSolve?.passed,
    hintsUnlocked: unlockedTiers,
    unlockedHintContents,
    makeupRewardGivenToday,
    userStats: {
      currentStreak: user?.currentStreak ?? 0,
      longestStreak: user?.longestStreak ?? 0,
      stars: user?.stars ?? 10,
      lastSolvedAt: user?.lastSolvedAt?.toISOString() ?? null,
      streakFreezeCount: 0,
    },
    hintDiscount: Math.max(0, hintDiscountBought - hintDiscountUsed),
    explainCost: explainCostConfig
      ? parseInt(explainCostConfig.value)
      : DEFAULT_EXPLAIN_COST,
    reviewCost: reviewCostConfig ? parseInt(reviewCostConfig.value) : 5,
  };

  return NextResponse.json(response);
}
