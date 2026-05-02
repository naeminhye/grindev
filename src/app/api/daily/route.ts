import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAndResetStreak, getTodayUTC } from "@/lib/streak";
import type { DailyResponse } from "@/types";

export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Upsert user — creates on first login
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId },
  });

  // Check if streak should be reset (missed a day)
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

  // Check if already solved today
  // const existingSolve = await prisma.solve.findUnique({
  //   where: { userId_problemId: { userId, problemId: problem.id } },
  // });
  const existingSolve = await prisma.solve.findFirst({
    where: { userId, problemId: problem.id },
  });

  // Which hint tiers has this user already purchased for today's problem?
  const purchases: { tier: number }[] = await prisma.hintPurchase.findMany({
    where: { userId, problemId: problem.id },
    select: { tier: true },
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });

  // Return public problem — strip testCases and raw hints content
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
    hintsUnlocked: purchases.map((p) => p.tier),
    userStats: {
      currentStreak: user?.currentStreak ?? 0,
      longestStreak: user?.longestStreak ?? 0,
      stars: user?.stars ?? 10,
      lastSolvedAt: user?.lastSolvedAt?.toISOString() ?? null,
    },
  };

  return NextResponse.json(response);
}
