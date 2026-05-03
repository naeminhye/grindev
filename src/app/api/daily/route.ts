import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAndResetStreak, getTodayUTC } from "@/lib/streak";
import type { DailyResponse, HintData } from "@/types";

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

  // Fetch hint purchases with tier info
  const purchases = await prisma.hintPurchase.findMany({
    where: { userId, problemId: problem.id },
    select: { tier: true },
    orderBy: { tier: "asc" },
  });

  // Return hint contents for already-purchased tiers
  const allHints = problem.hints as HintData[];
  const unlockedTiers = purchases.map((p) => p.tier);
  const unlockedHints: Record<number, string> = {};
  for (const tier of unlockedTiers) {
    const hint = allHints.find((h) => h.tier === tier);
    if (hint) unlockedHints[tier] = hint.content;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  const publicProblem = {
    id: problem.id,
    title: problem.title,
    slug: problem.slug,
    description: problem.description,
    difficulty: problem.difficulty,
    topic: problem.topic,
    starterCode: problem.starterCode,
  };

  const response: DailyResponse = {
    problem: publicProblem,
    alreadySolved: !!existingSolve?.passed,
    hintsUnlocked: unlockedTiers,
    unlockedHintContents: unlockedHints, // ← new
    userStats: {
      currentStreak: user?.currentStreak ?? 0,
      longestStreak: user?.longestStreak ?? 0,
      stars: user?.stars ?? 10,
      lastSolvedAt: user?.lastSolvedAt?.toISOString() ?? null,
    },
  };

  return NextResponse.json(response);
}
