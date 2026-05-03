import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMakeupCost, getDaysAgo } from "@/lib/makeup";
import { getTodayUTC } from "@/lib/streak";
import type { MakeupProblemResponse, HintData } from "@/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ date: string }> },
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const daily = await prisma.dailyProblem.findUnique({
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

  const response: MakeupProblemResponse = {
    problem: {
      id: problem.id,
      title: problem.title,
      slug: problem.slug,
      description: problem.description,
      difficulty: problem.difficulty,
      topic: problem.topic,
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
    },
  };

  return NextResponse.json(response);
}
